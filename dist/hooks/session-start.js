#!/usr/bin/env node
import {
  compileBriefing
} from "../chunk-TZSPYETU.js";
import {
  CONFIDENCE,
  DECAY,
  HOOK,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-H5CEFO34.js";

// src/v2/hooks/session-start.ts
import { v4 as uuid } from "uuid";

// src/v2/db/maintenance.ts
function applyConfidenceDecay(db) {
  const cutoff = new Date(
    Date.now() - DECAY.INTERVAL_DAYS * 24 * 60 * 60 * 1e3
  ).toISOString();
  const decayResult = db.prepare(`
    UPDATE memories SET confidence = confidence * ?
    WHERE invalidated = 0
      AND (last_recalled IS NULL OR last_recalled < ?)
      AND confidence > ?
  `).run(DECAY.FACTOR, cutoff, CONFIDENCE.DELETE_THRESHOLD);
  const exemptKinds = DECAY.EXEMPT_KINDS.map(() => "?").join(", ");
  const deleteResult = db.prepare(`
    UPDATE memories SET invalidated = 1
    WHERE invalidated = 0
      AND confidence < ?
      AND kind NOT IN (${exemptKinds})
  `).run(CONFIDENCE.DELETE_THRESHOLD, ...DECAY.EXEMPT_KINDS);
  return {
    decayed: decayResult.changes,
    deleted: deleteResult.changes
  };
}
var PLAN_ARCHIVE_DAYS = 180;
function archiveOldPlans(db) {
  const cutoff = new Date(
    Date.now() - PLAN_ARCHIVE_DAYS * 24 * 60 * 60 * 1e3
  ).toISOString();
  const plans = db.prepare(`
    SELECT id FROM plans
    WHERE status IN ('completed', 'abandoned')
      AND updated_at < ?
  `).all(cutoff);
  if (plans.length === 0) return 0;
  const deleteSteps = db.prepare("DELETE FROM plan_steps WHERE plan_id = ?");
  const deleteDecisions = db.prepare("DELETE FROM plan_decisions WHERE plan_id = ?");
  const deletePlan = db.prepare("DELETE FROM plans WHERE id = ?");
  for (const plan of plans) {
    deleteSteps.run(plan.id);
    deleteDecisions.run(plan.id);
    deletePlan.run(plan.id);
  }
  return plans.length;
}
var STALE_PROJECT_DAYS = 90;
function detectStaleProjects(db) {
  const cutoff = new Date(
    Date.now() - STALE_PROJECT_DAYS * 24 * 60 * 60 * 1e3
  ).toISOString();
  const projects = db.prepare(`
    SELECT DISTINCT project FROM memories
    WHERE project IS NOT NULL
      AND invalidated = 0
    GROUP BY project
    HAVING MAX(COALESCE(last_recalled, created_at)) < ?
  `).all(cutoff);
  return projects.map((p) => p.project);
}
function checkIntegrity(db) {
  try {
    const result = db.pragma("integrity_check");
    const ok = result.length === 1 && result[0].integrity_check === "ok";
    if (!ok) {
      try {
        db.prepare("INSERT INTO memories_fts(memories_fts) VALUES('rebuild')").run();
        db.prepare("INSERT INTO reminders_fts(reminders_fts) VALUES('rebuild')").run();
        return { ok: false, recovered: true };
      } catch {
        return { ok: false, recovered: false };
      }
    }
    return { ok: true, recovered: false };
  } catch {
    return { ok: false, recovered: false };
  }
}
function runMaintenance(db) {
  const { ok } = checkIntegrity(db);
  const { decayed, deleted } = applyConfidenceDecay(db);
  const plansArchived = archiveOldPlans(db);
  const staleProjects = detectStaleProjects(db);
  return { decayed, deleted, plansArchived, staleProjects, integrityOk: ok };
}

// src/v2/hooks/session-start.ts
function run(input, db) {
  const project = getProjectId(input.cwd);
  const sessionId = input.session_id ?? uuid();
  if (input.type === "compact") {
    return handleCompact(db, project, sessionId);
  }
  if (input.type === "startup" || input.type === "clear") {
    try {
      runMaintenance(db);
    } catch {
    }
  }
  const interrupted = detectAndCloseInterrupted(db, project);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO sessions (id, project, started_at)
    VALUES (?, ?, ?)
  `).run(sessionId, project, now);
  const sessionType = input.type === "clear" ? "startup" : input.type;
  let briefing = compileBriefing(db, {
    project,
    sessionType,
    interrupted
  });
  if (briefing.tokenEstimate > HOOK.TOKEN_BUDGET) {
    briefing = compileBriefing(db, {
      project,
      sessionType,
      interrupted,
      maxPitfalls: HOOK.BRIEFING_PASS_MAX_PITFALLS_1
    });
  }
  if (briefing.tokenEstimate > HOOK.TOKEN_BUDGET) {
    briefing = compileBriefing(db, {
      project,
      sessionType,
      interrupted,
      maxPitfalls: HOOK.BRIEFING_PASS_MAX_PITFALLS_2
    });
  }
  return briefing.text;
}
function handleCompact(db, project, sessionId) {
  const snapshotRow = db.prepare(`
    SELECT * FROM compaction_snapshots
    WHERE session_id = ? OR project = ?
    ORDER BY captured_at DESC LIMIT 1
  `).get(sessionId, project);
  const snapshot = snapshotRow ? {
    id: snapshotRow.id,
    session_id: snapshotRow.session_id,
    project: snapshotRow.project,
    captured_at: snapshotRow.captured_at,
    recent_files: safeJsonParse(snapshotRow.recent_files, []),
    recent_commands: safeJsonParse(snapshotRow.recent_commands, []),
    user_context: snapshotRow.user_context ?? "",
    approach_notes: snapshotRow.approach_notes
  } : null;
  let briefing = compileBriefing(db, {
    project,
    sessionType: "compact",
    interrupted: false,
    snapshot
  });
  if (briefing.tokenEstimate > HOOK.TOKEN_BUDGET) {
    briefing = compileBriefing(db, {
      project,
      sessionType: "compact",
      interrupted: false,
      snapshot,
      maxPitfalls: HOOK.BRIEFING_PASS_MAX_PITFALLS_1
    });
  }
  return briefing.text;
}
function detectAndCloseInterrupted(db, project) {
  const cutoff = new Date(
    Date.now() - HOOK.SESSION_INTERRUPT_WINDOW_HOURS * 60 * 60 * 1e3
  ).toISOString();
  const unclosed = db.prepare(`
    SELECT id FROM sessions
    WHERE project = ? AND ended_at IS NULL AND started_at > ?
    LIMIT 1
  `).get(project, cutoff);
  if (!unclosed) return false;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(
    "UPDATE sessions SET ended_at = ?, task_summary = '[interrupted]' WHERE id = ?"
  ).run(now, unclosed.id);
  return true;
}
function safeJsonParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  let db = null;
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    db = openHookDb();
    const output = run(input, db);
    if (output) process.stdout.write(output);
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
//# sourceMappingURL=session-start.js.map