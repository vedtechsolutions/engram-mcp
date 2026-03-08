#!/usr/bin/env node
import {
  parseTranscript
} from "../chunk-CMESQ3P2.js";
import {
  HOOK,
  getProjectId,
  openHookDb,
  readHookStdin
} from "../chunk-2PJDMCJB.js";

// src/v2/hooks/pre-compact.ts
import { v4 as uuid } from "uuid";
function run(input, db) {
  const project = getProjectId(input.cwd);
  const sessionId = input.session_id;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO sessions (id, project, started_at)
    VALUES (?, ?, ?)
  `).run(sessionId, project, now);
  const transcript = parseTranscript(input.transcript_path);
  const activePlan = db.prepare(
    "SELECT id FROM plans WHERE project = ? AND status = 'active' LIMIT 1"
  ).get(project);
  if (activePlan) {
    const inProgressStep = db.prepare(
      "SELECT step_id, notes FROM plan_steps WHERE plan_id = ? AND status = 'in_progress' LIMIT 1"
    ).get(activePlan.id);
    if (inProgressStep) {
      const fileList = transcript.recentFiles.slice(-3).map((f) => f.split("/").pop()).join(", ");
      const lastCmd = transcript.recentCommands.length > 0 ? transcript.recentCommands[transcript.recentCommands.length - 1] : null;
      const cmdSummary = lastCmd ? `${lastCmd.command.slice(0, 40)} (exit:${lastCmd.exitCode})` : "";
      let noteText = "Pre-compact:";
      if (fileList) noteText += ` files: ${fileList}.`;
      if (cmdSummary) noteText += ` cmd: ${cmdSummary}.`;
      noteText = noteText.slice(0, HOOK.NOTE_PRECOMPACT_MAX);
      const existingNotes = safeJsonParse(inProgressStep.notes, []);
      existingNotes.push({ note: noteText, at: now });
      db.prepare(
        "UPDATE plan_steps SET notes = ? WHERE plan_id = ? AND step_id = ?"
      ).run(JSON.stringify(existingNotes), activePlan.id, inProgressStep.step_id);
    }
  }
  const snapshotId = uuid();
  db.prepare(`
    INSERT INTO compaction_snapshots (id, session_id, project, captured_at, recent_files, read_files, recent_commands, user_context, approach_notes, initial_goal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    snapshotId,
    sessionId,
    project,
    now,
    JSON.stringify(transcript.recentFiles),
    JSON.stringify(transcript.readFiles),
    JSON.stringify(transcript.recentCommands),
    JSON.stringify(transcript.userContext),
    JSON.stringify(transcript.approachNotes),
    transcript.initialGoal
  );
  db.prepare(
    "DELETE FROM compaction_snapshots WHERE project = ? AND session_id != ?"
  ).run(project, sessionId);
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
//# sourceMappingURL=pre-compact.js.map