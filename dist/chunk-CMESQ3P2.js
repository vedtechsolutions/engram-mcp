#!/usr/bin/env node
import {
  BRIEFING,
  CONFIDENCE,
  HOOK
} from "./chunk-2PJDMCJB.js";

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
  if (snapshot.initial_goal) {
    const goal = snapshot.initial_goal.length > 120 ? snapshot.initial_goal.slice(0, 117) + "..." : snapshot.initial_goal;
    lines.push(`  Goal: ${goal}`);
  }
  if (snapshot.recent_files.length > 0) {
    const files = snapshot.recent_files.slice(-5).map((f) => f.split("/").pop()).join(", ");
    lines.push(`  Modified: ${files}`);
  }
  if (snapshot.read_files.length > 0) {
    const fileReads = snapshot.read_files.filter((f) => !f.startsWith("glob:") && !f.startsWith("grep:")).slice(-5).map((f) => f.split("/").pop());
    if (fileReads.length > 0) {
      lines.push(`  Read: ${fileReads.join(", ")}`);
    }
  }
  if (snapshot.recent_commands.length > 0) {
    const last = snapshot.recent_commands[snapshot.recent_commands.length - 1];
    const cmd = last.command.length > 60 ? last.command.slice(0, 57) + "..." : last.command;
    lines.push(`  Last cmd: ${cmd} (exit:${last.exit_code})`);
  }
  if (snapshot.user_context.length > 0) {
    const msgs = snapshot.user_context.slice(-2).map((m) => {
      const trimmed = m.length > 100 ? m.slice(0, 97) + "..." : m;
      return trimmed;
    });
    lines.push(`  Context: ${msgs.join(" | ")}`);
  }
  if (snapshot.approach_notes.length > 0) {
    const last = snapshot.approach_notes[snapshot.approach_notes.length - 1];
    const note = last.length > 100 ? last.slice(0, 97) + "..." : last;
    lines.push(`  Approach: ${note}`);
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
    readFiles: [],
    recentCommands: [],
    userContext: [],
    approachNotes: [],
    initialGoal: null
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
    const reads = /* @__PURE__ */ new Set();
    const commands = [];
    const bashToolIds = /* @__PURE__ */ new Map();
    const userMessages = [];
    const assistantTexts = [];
    for (const line of lines) {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      const messageContent = entry.message?.content;
      if (entry.type === "assistant" && Array.isArray(messageContent)) {
        for (const block of messageContent) {
          if (typeof block !== "object" || block === null) continue;
          if (block.type === "tool_use") {
            const input = block.input;
            if (block.name === "Write" || block.name === "Edit") {
              const path = input?.file_path ?? input?.path;
              if (typeof path === "string") files.add(path);
            }
            if (block.name === "Read") {
              const path = input?.file_path ?? input?.path;
              if (typeof path === "string") reads.add(path);
            }
            if (block.name === "Glob") {
              const pattern = input?.pattern;
              if (typeof pattern === "string") reads.add(`glob:${pattern}`);
            }
            if (block.name === "Grep") {
              const pattern = input?.pattern;
              const path = input?.path;
              if (typeof pattern === "string") {
                reads.add(`grep:${pattern}${typeof path === "string" ? ` in ${path}` : ""}`);
              }
            }
            if (block.name === "Bash") {
              const cmd = input?.command;
              if (typeof cmd === "string") {
                const idx = commands.length;
                commands.push({
                  command: cmd.slice(0, 100),
                  exitCode: 0,
                  outputSummary: ""
                });
                if (typeof block.id === "string") {
                  bashToolIds.set(block.id, idx);
                }
              }
            }
          }
          if (block.type === "text" && typeof block.text === "string" && block.text) {
            assistantTexts.push(block.text);
          }
        }
      }
      if (entry.type === "user") {
        if (typeof messageContent === "string") {
          if (messageContent) userMessages.push(messageContent);
        } else if (Array.isArray(messageContent)) {
          const textParts = [];
          for (const block of messageContent) {
            if (typeof block !== "object" || block === null) continue;
            if (block.type === "text" && typeof block.text === "string") {
              textParts.push(block.text);
            }
            if (block.type === "tool_result" && typeof block.tool_use_id === "string") {
              const cmdIdx = bashToolIds.get(block.tool_use_id);
              if (cmdIdx !== void 0 && cmdIdx < commands.length) {
                const resultText = typeof block.content === "string" ? block.content : "";
                const exitMatch = resultText.match(/Exit code[:\s]+(\d+)/);
                if (exitMatch) {
                  commands[cmdIdx].exitCode = parseInt(exitMatch[1], 10);
                }
                commands[cmdIdx].outputSummary = resultText.slice(0, 80);
              }
            }
          }
          const joined = textParts.join(" ");
          if (joined) userMessages.push(joined);
        }
      }
    }
    const recentFiles = [...files].slice(-20);
    const readFiles = [...reads].slice(-20);
    const recentCommands = commands.slice(-5);
    const userContext = userMessages.slice(-3).map(
      (m) => m.length > 200 ? m.slice(0, 197) + "..." : m
    );
    const approachNotes = assistantTexts.slice(-5).map(
      (t) => t.length > 150 ? t.slice(0, 147) + "..." : t
    );
    const firstSubstantial = userMessages.find((m) => m.length >= 20);
    const initialGoal = firstSubstantial ? firstSubstantial.length > 200 ? firstSubstantial.slice(0, 197) + "..." : firstSubstantial : null;
    return { recentFiles, readFiles, recentCommands, userContext, approachNotes, initialGoal };
  } catch {
    return empty;
  }
}

export {
  compileBriefing,
  parseTranscript
};
//# sourceMappingURL=chunk-CMESQ3P2.js.map