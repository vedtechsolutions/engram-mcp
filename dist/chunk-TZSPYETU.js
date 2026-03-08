#!/usr/bin/env node
import {
  BRIEFING,
  CONFIDENCE,
  HOOK
} from "./chunk-H5CEFO34.js";

// src/v2/hooks/shared/briefing.ts
function compileBriefing(db, input) {
  const parts = [];
  if (input.interrupted) {
    parts.push("PREVIOUS SESSION INTERRUPTED");
  }
  const plan = getActivePlan(db, input.project);
  if (plan) {
    parts.push(formatPlanSection(plan, input.interrupted));
  }
  if (input.sessionType === "compact" && input.snapshot) {
    parts.push(formatSnapshotSection(input.snapshot));
  }
  const maxPitfalls = input.maxPitfalls ?? (input.sessionType === "resume" ? BRIEFING.MAX_CORRECTIONS : BRIEFING.MAX_PITFALLS);
  const pitfalls = getPitfalls(db, input.project, maxPitfalls);
  if (pitfalls.length > 0) {
    parts.push(formatPitfalls(pitfalls));
  }
  const corrections = getCorrections(db, input.project, BRIEFING.MAX_CORRECTIONS);
  if (corrections.length > 0) {
    parts.push(formatCorrections(corrections));
  }
  const text = parts.join("\n\n");
  const tokenEstimate = estimateTokens(text);
  return { text, tokenEstimate };
}
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.4);
}
function getActivePlan(db, project) {
  const plan = db.prepare(
    "SELECT * FROM plans WHERE project = ? AND status = 'active' LIMIT 1"
  ).get(project);
  if (!plan) return null;
  const steps = db.prepare(
    "SELECT * FROM plan_steps WHERE plan_id = ? ORDER BY step_id"
  ).all(plan.id);
  const decisions = db.prepare(
    "SELECT * FROM plan_decisions WHERE plan_id = ? ORDER BY decided_at DESC LIMIT 3"
  ).all(plan.id);
  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    steps: steps.map((s) => ({
      plan_id: s.plan_id,
      step_id: s.step_id,
      description: s.description,
      status: s.status,
      depends_on: safeJsonParse(s.depends_on, []),
      outcome: s.outcome,
      blockers: s.blockers,
      notes: safeJsonParse(s.notes, [])
    })),
    decisions: decisions.map((d) => ({
      id: d.id,
      plan_id: d.plan_id,
      step_id: d.step_id,
      chose: d.chose,
      why: d.why,
      alternatives: safeJsonParse(d.alternatives, []),
      permanent: d.permanent !== 0,
      decided_at: d.decided_at
    }))
  };
}
function formatPlanSection(plan, interrupted) {
  const done = plan.steps.filter((s) => s.status === "done").length;
  const total = plan.steps.length;
  const lines = [`Plan: ${plan.name} \u2014 ${done}/${total} steps`];
  const lastDone = [...plan.steps].reverse().find((s) => s.status === "done");
  if (lastDone) {
    lines.push(`  Done: ${lastDone.step_id}. ${lastDone.description}`);
  }
  const current = plan.steps.find((s) => s.status === "in_progress") ?? plan.steps.find((s) => s.status === "blocked");
  if (current) {
    const flag = interrupted ? " [interrupted]" : ` [${current.status}]`;
    lines.push(`  Current: ${current.step_id}. ${current.description}${flag}`);
    if (current.blockers) {
      lines.push(`  Blocker: ${current.blockers}`);
    }
    if (current.notes.length > 0) {
      lines.push(`  Note: ${current.notes[current.notes.length - 1].note}`);
    }
  }
  const next = plan.steps.find((s) => s.status === "pending");
  if (next) {
    lines.push(`  Next: ${next.step_id}. ${next.description}`);
  }
  if (plan.decisions.length > 0) {
    const last = plan.decisions[0];
    lines.push(`  Decisions: ${plan.decisions.length} \u2014 last: ${last.chose}`);
  }
  return lines.join("\n");
}
function formatSnapshotSection(snapshot) {
  const lines = ["Recovery:"];
  if (snapshot.recent_files.length > 0) {
    const files = snapshot.recent_files.slice(0, 5).map((f) => f.split("/").pop()).join(", ");
    lines.push(`  Files: ${files}`);
  }
  if (snapshot.recent_commands.length > 0) {
    const last = snapshot.recent_commands[snapshot.recent_commands.length - 1];
    const cmd = last.command.length > 60 ? last.command.slice(0, 57) + "..." : last.command;
    lines.push(`  Last cmd: ${cmd} (exit:${last.exit_code})`);
  }
  if (snapshot.user_context) {
    const ctx = snapshot.user_context.length > 100 ? snapshot.user_context.slice(0, 97) + "..." : snapshot.user_context;
    lines.push(`  Context: ${ctx}`);
  }
  return lines.join("\n");
}
function getPitfalls(db, project, max) {
  const rows = db.prepare(`
    SELECT * FROM memories
    WHERE kind = 'pitfall' AND invalidated = 0
      AND confidence >= ?
      AND (project = ? OR project IS NULL)
    ORDER BY
      CASE WHEN project = ? THEN 0 ELSE 1 END,
      confidence DESC
    LIMIT ?
  `).all(CONFIDENCE.MIN_FOR_PITFALL_SURFACE, project, project, max);
  return rows.map(rowToMemory);
}
function getCorrections(db, project, max) {
  const rows = db.prepare(`
    SELECT * FROM memories
    WHERE kind = 'correction' AND invalidated = 0
      AND confidence >= ?
      AND (project = ? OR project IS NULL)
    ORDER BY confidence DESC
    LIMIT ?
  `).all(CONFIDENCE.MIN_FOR_BRIEFING, project, max);
  return rows.map(rowToMemory);
}
function formatPitfalls(pitfalls) {
  const lines = pitfalls.map((p) => `[PITFALL] ${p.content}`);
  return lines.join("\n");
}
function formatCorrections(corrections) {
  const lines = corrections.map((c) => `[CORRECTION] ${c.content}`);
  return lines.join("\n");
}
function rowToMemory(row) {
  return {
    id: row.id,
    content: row.content,
    kind: row.kind,
    project: row.project,
    tags: safeJsonParse(row.tags, []),
    confidence: row.confidence,
    source: row.source,
    created_at: row.created_at,
    last_recalled: row.last_recalled,
    recall_count: row.recall_count,
    invalidated: row.invalidated !== 0
  };
}
function safeJsonParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// src/v2/hooks/shared/transcript.ts
import { readFileSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
function parseTranscript(transcriptPath) {
  const empty = {
    recentFiles: [],
    recentCommands: [],
    userContext: "",
    approachNotes: null
  };
  const resolved = resolve(transcriptPath);
  const claudeDir = resolve(homedir(), ".claude");
  if (!resolved.startsWith(claudeDir + "/") && !resolved.startsWith("/tmp/")) {
    return empty;
  }
  try {
    statSync(transcriptPath);
  } catch {
    return empty;
  }
  try {
    const content = readFileSync(transcriptPath, "utf8");
    const allLines = content.split("\n").filter(Boolean);
    const lines = allLines.slice(-HOOK.TRANSCRIPT_MAX_LINES);
    const files = /* @__PURE__ */ new Set();
    const commands = [];
    const userMessages = [];
    let lastAssistantText = null;
    for (const line of lines) {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (entry.type === "tool_use" && (entry.name === "Write" || entry.name === "Edit")) {
        const path = entry.input?.file_path ?? entry.input?.path;
        if (typeof path === "string") files.add(path);
      }
      if (entry.type === "tool_use" && entry.name === "Bash") {
        const cmd = entry.input?.command;
        if (typeof cmd === "string") {
          commands.push({
            command: cmd.slice(0, 100),
            exitCode: 0,
            // Updated from tool_result if available
            outputSummary: ""
          });
        }
      }
      if (entry.type === "tool_result" && commands.length > 0) {
        const text = typeof entry.content === "string" ? entry.content : Array.isArray(entry.content) ? entry.content.map((c) => c.text ?? "").join("") : "";
        const exitMatch = text.match(/Exit code: (\d+)/);
        if (exitMatch) {
          commands[commands.length - 1].exitCode = parseInt(exitMatch[1], 10);
        }
        commands[commands.length - 1].outputSummary = text.slice(0, 80);
      }
      if (entry.type === "user") {
        const text = typeof entry.content === "string" ? entry.content : Array.isArray(entry.content) ? entry.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join(" ") : "";
        if (text) userMessages.push(text);
      }
      if (entry.type === "assistant") {
        const text = Array.isArray(entry.content) ? entry.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join(" ") : typeof entry.content === "string" ? entry.content : "";
        if (text) lastAssistantText = text;
      }
    }
    const recentFiles = [...files].slice(-20);
    const recentCommands = commands.slice(-5);
    const lastTwo = userMessages.slice(-2).join(" ");
    const userContext = lastTwo.length > 200 ? lastTwo.slice(0, 197) + "..." : lastTwo;
    const approachNotes = lastAssistantText ? lastAssistantText.length > 150 ? lastAssistantText.slice(0, 147) + "..." : lastAssistantText : null;
    return { recentFiles, recentCommands, userContext, approachNotes };
  } catch {
    return empty;
  }
}

export {
  compileBriefing,
  parseTranscript
};
//# sourceMappingURL=chunk-TZSPYETU.js.map