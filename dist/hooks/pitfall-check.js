#!/usr/bin/env node
import {
  CONFIDENCE,
  MODE_LIMITS,
  getProjectId,
  openHookDb,
  readHookStdin,
  readStateFile
} from "../chunk-V4B64BB2.js";

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
  const pitfalls = db.prepare(`
    SELECT content FROM memories
    WHERE kind = 'pitfall'
      AND invalidated = 0
      AND confidence >= ?
      AND (project = ? OR project IS NULL)
      AND tags LIKE ?
    ORDER BY confidence DESC
    LIMIT ?
  `).all(
    CONFIDENCE.MIN_FOR_PITFALL_SURFACE,
    project,
    `%"${ext}"%`,
    limit
  );
  if (pitfalls.length === 0) return { permissionDecision: "allow" };
  const warnings = pitfalls.map((p) => `- ${p.content}`).join("\n");
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
    const pitfalls = db.prepare(`
      SELECT memories.content FROM memories_fts
      JOIN memories ON memories.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ?
        AND memories.kind = 'pitfall'
        AND memories.invalidated = 0
        AND memories.confidence >= ?
        AND (memories.project = ? OR memories.project IS NULL)
      ORDER BY bm25(memories_fts)
      LIMIT ?
    `).all(keywords, CONFIDENCE.MIN_FOR_PITFALL_SURFACE, project, limit);
    if (pitfalls.length === 0) return { permissionDecision: "allow" };
    const warnings = pitfalls.map((p) => `- ${p.content}`).join("\n");
    return {
      permissionDecision: "allow",
      additionalContext: `[ENGRAM] Warning:
${warnings}`
    };
  } catch {
    return { permissionDecision: "allow" };
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