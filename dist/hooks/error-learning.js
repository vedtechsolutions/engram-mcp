#!/usr/bin/env node
import {
  CONFIDENCE,
  ERROR_PATTERNS,
  LEARNING,
  NOISE_ERROR_PATTERNS,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-6WMCIY6C.js";

// src/v2/hooks/error-learning.ts
import { v4 as uuid } from "uuid";
function run(input, db) {
  if (input.is_interrupt) return {};
  const errorText = input.error ?? "";
  if (!errorText || errorText.length < 10) return {};
  if (isNoiseError(errorText)) return {};
  const category = classifyError(errorText);
  if (!category) return {};
  const project = getProjectId(input.cwd);
  const lesson = distillError(input.tool_name, input.tool_input, errorText, category);
  if (!lesson) return {};
  const existing = findSimilarPitfall(db, project, lesson);
  if (existing) {
    const newConf = Math.min(CONFIDENCE.CAP, existing.confidence + CONFIDENCE.BOOST_INCREMENT);
    db.prepare("UPDATE memories SET confidence = ? WHERE id = ?").run(newConf, existing.id);
    return {
      additionalContext: `[ENGRAM] Repeated error. Previous lesson: "${existing.content}"`,
      strengthened: true
    };
  }
  const tags = inferTags(input.tool_name, input.tool_input, category);
  const id = uuid();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO memories (id, content, kind, project, tags, confidence, source, created_at, recall_count, invalidated)
    VALUES (?, ?, 'pitfall', ?, ?, ?, 'learned', ?, 0, 0)
  `).run(id, lesson, project, JSON.stringify(tags), CONFIDENCE.AUTO_DETECTED, now);
  return { encoded: true };
}
function isNoiseError(error) {
  return NOISE_ERROR_PATTERNS.some((p) => p.test(error));
}
function classifyError(error) {
  for (const pattern of ERROR_PATTERNS.COMPILATION) {
    if (pattern.test(error)) return "compilation";
  }
  for (const pattern of ERROR_PATTERNS.TEST_FAILURE) {
    if (pattern.test(error)) return "test_failure";
  }
  for (const pattern of ERROR_PATTERNS.RUNTIME) {
    if (pattern.test(error)) return "runtime";
  }
  return null;
}
function distillError(toolName, toolInput, error, category) {
  const lines = error.split("\n").filter((l) => l.trim().length > 0);
  let errorLine = lines[0] ?? "";
  for (const line of lines) {
    if (/error|Error|ERROR/.test(line) && line.length < 200) {
      errorLine = line.trim();
      break;
    }
  }
  if (errorLine.length < 5) return null;
  errorLine = errorLine.replace(/[|;&$`><]/g, " ");
  let prefix = "";
  if (toolName === "Bash") {
    const cmd = String(toolInput.command ?? "").slice(0, 50);
    prefix = `Command "${cmd}": `;
  } else if (toolName === "Write" || toolName === "Edit") {
    const file = String(toolInput.file_path ?? "").split("/").pop() ?? "";
    prefix = `Editing ${file}: `;
  }
  const lesson = `${prefix}${errorLine}`.slice(0, LEARNING.MAX_ERROR_CONTENT_LENGTH);
  return lesson;
}
function findSimilarPitfall(db, project, lesson) {
  const words = lesson.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3).slice(0, 8).map((w) => `"${w}"`).join(" OR ");
  if (!words) return null;
  try {
    const rows = db.prepare(`
      SELECT memories.id, memories.content, memories.confidence
      FROM memories_fts
      JOIN memories ON memories.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ?
        AND memories.kind = 'pitfall'
        AND memories.invalidated = 0
        AND (memories.project = ? OR memories.project IS NULL)
      ORDER BY bm25(memories_fts)
      LIMIT 3
    `).all(words, project);
    for (const row of rows) {
      if (tokenOverlap(lesson, row.content) > 0.5) {
        return row;
      }
    }
  } catch {
  }
  return null;
}
function tokenOverlap(a, b) {
  const tokensA = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
  const tokensB = new Set(b.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = (/* @__PURE__ */ new Set([...tokensA, ...tokensB])).size;
  return union === 0 ? 0 : intersection / union;
}
function inferTags(toolName, toolInput, category) {
  const tags = [category];
  if (toolName === "Write" || toolName === "Edit") {
    const filePath = String(toolInput.file_path ?? "");
    const ext = filePath.split(".").pop();
    if (ext && ext.length <= 10) tags.push(ext);
  }
  if (toolName === "Bash") {
    const cmd = String(toolInput.command ?? "");
    if (cmd.includes("vitest") || cmd.includes("jest") || cmd.includes("pytest")) tags.push("testing");
    if (cmd.includes("tsc") || cmd.includes("typescript")) tags.push("typescript");
    if (cmd.includes("python")) tags.push("python");
  }
  return tags.slice(0, 5);
}
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  let db = null;
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    db = openHookDb();
    const result = run(input, db);
    if (result.additionalContext) {
      const output = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUseFailure",
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
  classifyError,
  isNoiseError,
  run
};
//# sourceMappingURL=error-learning.js.map