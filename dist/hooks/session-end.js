#!/usr/bin/env node
import "../chunk-LSU5BWZW.js";
import {
  DEDUP,
  HOOK,
  LEARNING,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-GHQQCGMZ.js";

// src/v2/hooks/session-end.ts
function run(input, db) {
  const project = getProjectId(input.cwd);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const summary = input.reason === "clear" ? "[cleared]" : null;
  db.prepare(
    "UPDATE sessions SET ended_at = ?, task_summary = COALESCE(?, task_summary) WHERE id = ?"
  ).run(now, summary, input.session_id);
  if (input.reason !== "clear") {
    const activePlan = db.prepare(
      "SELECT id FROM plans WHERE project = ? AND status = 'active' LIMIT 1"
    ).get(project);
    if (activePlan) {
      db.prepare(`
        UPDATE plan_steps SET status = 'blocked', blockers = ?
        WHERE plan_id = ? AND status = 'in_progress'
      `).run(`Session ended: ${input.reason}`, activePlan.id);
    }
  }
  const cutoff = new Date(
    Date.now() - HOOK.SNAPSHOT_KEEP_DAYS * 24 * 60 * 60 * 1e3
  ).toISOString();
  db.prepare(
    "DELETE FROM compaction_snapshots WHERE project = ? AND session_id != ? AND captured_at < ?"
  ).run(project, input.session_id, cutoff);
  promotePitfalls(db, project);
}
function promotePitfalls(db, project) {
  const candidates = db.prepare(`
    SELECT id, content, tags, confidence, recall_count
    FROM memories
    WHERE kind = 'pitfall'
      AND project = ?
      AND invalidated = 0
      AND confidence >= ?
      AND recall_count >= ?
  `).all(project, LEARNING.PROMOTE_MIN_CONFIDENCE, LEARNING.PROMOTE_AFTER_SESSIONS);
  let promoted = 0;
  for (const candidate of candidates) {
    let existing = [];
    try {
      existing = db.prepare(`
        SELECT memories.id, memories.confidence FROM memories_fts
        JOIN memories ON memories.rowid = memories_fts.rowid
        WHERE memories_fts MATCH ?
          AND memories.kind = 'pitfall'
          AND memories.project IS NULL
          AND memories.invalidated = 0
        LIMIT 3
      `).all(ftsEscape(candidate.content));
    } catch {
    }
    const candidateTokens = new Set(candidate.content.toLowerCase().split(/\s+/));
    let merged = false;
    for (const ex of existing) {
      const exContent = db.prepare("SELECT content FROM memories WHERE id = ?").get(ex.id);
      if (!exContent) continue;
      const exTokens = new Set(exContent.content.toLowerCase().split(/\s+/));
      const intersection = [...candidateTokens].filter((t) => exTokens.has(t)).length;
      const overlap = intersection / Math.max(candidateTokens.size, exTokens.size);
      if (overlap >= DEDUP.SIMILARITY_THRESHOLD) {
        const newConf = Math.min(1, Math.max(ex.confidence, candidate.confidence));
        db.prepare("UPDATE memories SET confidence = ? WHERE id = ?").run(newConf, ex.id);
        db.prepare("UPDATE memories SET invalidated = 1 WHERE id = ?").run(candidate.id);
        merged = true;
        promoted++;
        break;
      }
    }
    if (!merged) {
      db.prepare("UPDATE memories SET project = NULL WHERE id = ?").run(candidate.id);
      promoted++;
    }
  }
  return promoted;
}
function ftsEscape(text) {
  const words = text.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
  if (words.length === 0) return '""';
  return words.map((w) => `"${w}"`).join(" OR ");
}
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  let db = null;
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    db = openHookDb();
    run(input, db);
  } catch {
  } finally {
    try {
      db?.close();
    } catch {
    }
  }
}
export {
  promotePitfalls,
  run
};
//# sourceMappingURL=session-end.js.map