#!/usr/bin/env node
import {
  CONFIDENCE,
  LEARNING,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-V4B64BB2.js";

// src/v2/hooks/success-tracker.ts
function run(input, db, lastEdit) {
  if (input.tool_name !== "Write" && input.tool_name !== "Edit") return {};
  const filePath = String(input.tool_input.file_path ?? "");
  if (!filePath) return {};
  const project = getProjectId(input.cwd);
  const now = Date.now();
  const result = {};
  if (lastEdit && lastEdit.filePath === filePath) {
    const elapsed = now - lastEdit.timestamp;
    if (elapsed < LEARNING.SELF_CORRECTION_WINDOW_MS) {
      result.selfCorrection = true;
    }
  }
  const rawExt = filePath.split(".").pop();
  const ext = rawExt?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  if (ext) {
    const boosted = boostRelevantPitfalls(db, project, ext);
    if (boosted > 0) {
      result.pitfallsBoosted = boosted;
    }
  }
  return result;
}
function boostRelevantPitfalls(db, project, ext) {
  const pitfalls = db.prepare(`
    SELECT id, confidence FROM memories
    WHERE kind = 'pitfall'
      AND invalidated = 0
      AND tags LIKE ?
      AND (project = ? OR project IS NULL)
      AND last_recalled IS NOT NULL
      AND last_recalled > strftime('%Y-%m-%dT%H:%M:%f', 'now', '-1 hour') || 'Z'
    LIMIT 5
  `).all(`%"${ext}"%`, project);
  let count = 0;
  for (const p of pitfalls) {
    db.prepare(
      "UPDATE memories SET confidence = MIN(?, confidence + ?) WHERE id = ?"
    ).run(CONFIDENCE.CAP, LEARNING.SUCCESS_BOOST, p.id);
    count++;
  }
  return count;
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
  run
};
//# sourceMappingURL=success-tracker.js.map