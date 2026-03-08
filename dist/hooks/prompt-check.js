#!/usr/bin/env node
import {
  checkReminders
} from "../chunk-7YDVCCRG.js";
import {
  CONFIDENCE,
  INTENT_PATTERNS,
  MODE_LIMITS,
  getProjectId,
  openHookDb,
  readHookStdin,
  readStateFile
} from "../chunk-2PJDMCJB.js";

// src/v2/hooks/prompt-check.ts
import { v4 as uuid } from "uuid";
function run(input, db, mode) {
  const prompt = input.content ?? input.prompt ?? "";
  if (!prompt || prompt.length < 5) return {};
  const effectiveMode = mode ?? "normal";
  const limits = MODE_LIMITS[effectiveMode];
  const project = getProjectId(input.cwd);
  const result = {};
  if (isCorrection(prompt)) {
    const correction = extractCorrection(prompt);
    if (correction) {
      encodeCorrection(db, correction);
      result.correctionEncoded = true;
    }
  }
  const contextParts = [];
  if (limits.promptCheckPitfalls > 0) {
    const pitfalls = recallRelevantPitfalls(db, project, prompt, limits.promptCheckPitfalls);
    if (pitfalls.length > 0) {
      const warnings = pitfalls.map((p) => `- ${p}`).join("\n");
      contextParts.push(`[ENGRAM] Relevant pitfalls:
${warnings}`);
    }
  }
  if (!result.correctionEncoded && limits.maxReminders > 0) {
    const fired = checkReminders(db, prompt, project);
    const capped = fired.slice(0, limits.maxReminders);
    if (capped.length > 0) {
      const lines = capped.map((r) => `[ENGRAM REMINDER] ${r.action}`);
      contextParts.push(lines.join("\n"));
    }
  }
  if (contextParts.length > 0) {
    result.additionalContext = contextParts.join("\n");
  }
  return result;
}
function isCorrection(prompt) {
  const lower = prompt.toLowerCase().trim();
  return INTENT_PATTERNS.CORRECTION.some((p) => p.test(lower));
}
function extractCorrection(prompt) {
  const trimmed = prompt.trim();
  let cleaned = trimmed.replace(/^no[,.]?\s*/i, "").trim();
  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 197) + "...";
  }
  if (cleaned.length < 10) return null;
  return cleaned;
}
function encodeCorrection(db, content) {
  const id = uuid();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = findSimilar(db, content);
  if (existing) {
    const newConf = Math.min(CONFIDENCE.CAP, existing.confidence + CONFIDENCE.BOOST_INCREMENT);
    db.prepare("UPDATE memories SET confidence = ? WHERE id = ?").run(newConf, existing.id);
    return;
  }
  db.prepare(`
    INSERT INTO memories (id, content, kind, project, tags, confidence, source, created_at, recall_count, invalidated)
    VALUES (?, ?, 'correction', NULL, '[]', ?, 'corrected', ?, 0, 0)
  `).run(id, content, CONFIDENCE.DEFAULT_LEARNED, now);
}
function recallRelevantPitfalls(db, project, prompt, limit) {
  const words = prompt.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3).slice(0, 8).map((w) => `"${w}"`).join(" OR ");
  if (!words) return [];
  try {
    const rows = db.prepare(`
      SELECT memories.content FROM memories_fts
      JOIN memories ON memories.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ?
        AND memories.kind = 'pitfall'
        AND memories.invalidated = 0
        AND memories.confidence >= ?
        AND (memories.project = ? OR memories.project IS NULL)
      ORDER BY bm25(memories_fts)
      LIMIT ?
    `).all(words, CONFIDENCE.MIN_FOR_PITFALL_SURFACE, project, limit);
    return rows.map((r) => r.content);
  } catch {
    return [];
  }
}
function findSimilar(db, content) {
  const words = content.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3).slice(0, 6).map((w) => `"${w}"`).join(" OR ");
  if (!words) return null;
  try {
    const rows = db.prepare(`
      SELECT memories.id, memories.content, memories.confidence
      FROM memories_fts
      JOIN memories ON memories.rowid = memories_fts.rowid
      WHERE memories_fts MATCH ?
        AND memories.kind = 'correction'
        AND memories.invalidated = 0
      ORDER BY bm25(memories_fts)
      LIMIT 3
    `).all(words);
    for (const row of rows) {
      if (tokenOverlap(content, row.content) > 0.5) {
        return { id: row.id, confidence: row.confidence };
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
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  let db = null;
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    db = openHookDb();
    const state = readStateFile();
    const result = run(input, db, state.mode);
    if (result.additionalContext) {
      process.stdout.write(result.additionalContext);
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
  isCorrection,
  run
};
//# sourceMappingURL=prompt-check.js.map