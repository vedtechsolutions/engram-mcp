#!/usr/bin/env node
import "../chunk-VESSVJCD.js";
import {
  HOOK,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-ILV37I4F.js";

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
//# sourceMappingURL=session-end.js.map