#!/usr/bin/env node
import {
  BRIEFING,
  CONFIDENCE,
  MODE_LIMITS,
  getProjectId,
  openHookDb,
  readHookStdin,
  readStateFile
} from "../chunk-ILV37I4F.js";

// src/v2/hooks/pitfall-check.ts
import { extname } from "path";
function run(input, db, mode) {
  const effectiveMode = mode ?? "normal";
  const limits = MODE_LIMITS[effectiveMode];
  const project = getProjectId(input.cwd);
  if (input.tool_name === "Write" || input.tool_name === "Edit") {
    if (limits.pitfallCheckFile <= 0) return { permissionDecision: "allow" };
    return checkFilePitfalls(db, project, input.tool_input, limits.pitfallCheckFile);
  }
  if (input.tool_name === "Bash") {
    if (limits.pitfallCheckBash <= 0) return { permissionDecision: "allow" };
    return checkCommandPitfalls(db, project, input.tool_input, limits.pitfallCheckBash);
  }
  return { permissionDecision: "allow" };
}
function checkFilePitfalls(db, project, toolInput, limit) {
  const filePath = String(toolInput.file_path ?? "");
  if (!filePath) return { permissionDecision: "allow" };
  const rawExt = extname(filePath).slice(1);
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  if (!ext) return { permissionDecision: "allow" };
  const projectPitfalls = db.prepare(`
    SELECT content FROM memories
    WHERE kind = 'pitfall'
      AND invalidated = 0
      AND confidence >= ?
      AND project = ?
      AND tags LIKE ?
    ORDER BY confidence DESC
    LIMIT ?
  `).all(
    CONFIDENCE.MIN_FOR_PITFALL_SURFACE,
    project,
    `%"${ext}"%`,
    limit
  );
  const remaining = limit - projectPitfalls.length;
  let globalPitfalls = [];
  if (remaining > 0) {
    const domainTags = getProjectDomainTags(db, project);
    if (domainTags.has(ext)) {
      globalPitfalls = db.prepare(`
        SELECT content FROM memories
        WHERE kind = 'pitfall'
          AND invalidated = 0
          AND confidence >= ?
          AND project IS NULL
          AND tags LIKE ?
        ORDER BY confidence DESC
        LIMIT ?
      `).all(
        CONFIDENCE.MIN_FOR_PITFALL_SURFACE,
        `%"${ext}"%`,
        remaining
      );
    }
  }
  const allPitfalls = [...projectPitfalls, ...globalPitfalls];
  if (allPitfalls.length === 0) return { permissionDecision: "allow" };
  const warnings = allPitfalls.map((p) => `- ${p.content}`).join("\n");
  return {
    permissionDecision: "allow",
    additionalContext: `[ENGRAM] Pitfalls for .${ext} files:
${warnings}`
  };
}
function checkCommandPitfalls(db, project, toolInput, limit) {
  const command = String(toolInput.command ?? "");
  if (!command || command.length < 3) return { permissionDecision: "allow" };
  const keywords = command.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !isCommonWord(w)).slice(0, 5).map((w) => `"${w}"`).join(" OR ");
  if (!keywords) return { permissionDecision: "allow" };
  try {
    const projectPitfalls = db.prepare(`
      SELECT memories.content FROM memories_fts
      JOIN memories ON memories.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ?
        AND memories.kind = 'pitfall'
        AND memories.invalidated = 0
        AND memories.confidence >= ?
        AND memories.project = ?
      ORDER BY bm25(memories_fts)
      LIMIT ?
    `).all(keywords, CONFIDENCE.MIN_FOR_PITFALL_SURFACE, project, limit);
    const remaining = limit - projectPitfalls.length;
    let globalPitfalls = [];
    if (remaining > 0) {
      const domainTags = getProjectDomainTags(db, project);
      if (domainTags.size > 0) {
        const globalRows = db.prepare(`
          SELECT memories.content, memories.tags FROM memories_fts
          JOIN memories ON memories.rowid = memories_fts.rowid
          WHERE memories_fts MATCH ?
            AND memories.kind = 'pitfall'
            AND memories.invalidated = 0
            AND memories.confidence >= ?
            AND memories.project IS NULL
          ORDER BY bm25(memories_fts)
          LIMIT ?
        `).all(keywords, CONFIDENCE.MIN_FOR_PITFALL_SURFACE, remaining * 3);
        globalPitfalls = globalRows.filter((r) => {
          const tags = safeJsonParse(r.tags, []);
          return tags.some((t) => domainTags.has(t));
        }).slice(0, remaining);
      }
    }
    const allPitfalls = [...projectPitfalls, ...globalPitfalls];
    if (allPitfalls.length === 0) return { permissionDecision: "allow" };
    const warnings = allPitfalls.map((p) => `- ${p.content}`).join("\n");
    return {
      permissionDecision: "allow",
      additionalContext: `[ENGRAM] Warning:
${warnings}`
    };
  } catch {
    return { permissionDecision: "allow" };
  }
}
function getProjectDomainTags(db, project) {
  const rows = db.prepare(`
    SELECT tags FROM memories
    WHERE project = ? AND invalidated = 0 AND tags != '[]'
    LIMIT 50
  `).all(project);
  const tagCounts = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const tags = safeJsonParse(row.tags, []);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const domain = /* @__PURE__ */ new Set();
  for (const [tag, count] of tagCounts) {
    if (count >= BRIEFING.DOMAIN_TAG_MIN_COUNT) domain.add(tag);
  }
  return domain;
}
function safeJsonParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
var COMMON_WORDS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "not",
  "run",
  "npm",
  "npx",
  "node",
  "bash",
  "echo",
  "cat",
  "grep",
  "find",
  "test",
  "true",
  "false",
  "null",
  "sudo",
  "apt",
  "pip",
  "git",
  "cd",
  "ls",
  "rm",
  "mv",
  "cp"
]);
function isCommonWord(word) {
  return COMMON_WORDS.has(word.toLowerCase());
}
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  let db = null;
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    db = openHookDb();
    const state = readStateFile();
    const result = run(input, db, state.mode);
    if (result.additionalContext) {
      const output = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          additionalContext: result.additionalContext
        }
      });
      process.stdout.write(output);
    }
  } catch {
  } finally {
    try {
      db?.close();
    } catch {
    }
  }
}
export {
  run
};
//# sourceMappingURL=pitfall-check.js.map