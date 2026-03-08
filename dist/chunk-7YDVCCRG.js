#!/usr/bin/env node
import {
  REMINDERS
} from "./chunk-2PJDMCJB.js";

// src/v2/tools/reminder-tools.ts
import { v4 as uuid } from "uuid";
var REMINDER_TOOL_DEFINITIONS = [
  {
    name: "engram_remind",
    description: 'Set a trigger-action reminder: "when I encounter [trigger], remind me to [action]"',
    inputSchema: {
      type: "object",
      properties: {
        trigger: { type: "string", description: "Keywords/phrase that should trigger this reminder" },
        action: { type: "string", description: "What to remind about (max 200 chars)" },
        project: { type: "string", description: "Project scope (null = global)" },
        max_fires: { type: "number", description: "0 = unlimited, N = deactivate after N fires" }
      },
      required: ["trigger", "action"]
    }
  },
  {
    name: "engram_list_reminders",
    description: "List active reminders for the current project.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project scope (auto-detected if omitted)" },
        include_inactive: { type: "boolean", description: "Include deactivated reminders" }
      }
    }
  }
];
function handleRemind(db, input, defaultProject) {
  const trigger = String(input.trigger ?? "").trim();
  const action = String(input.action ?? "").trim();
  const project = input.project ?? defaultProject ?? null;
  const maxFires = typeof input.max_fires === "number" ? Math.max(0, Math.floor(input.max_fires)) : 0;
  if (!trigger || trigger.length < 3) {
    return { content: [{ type: "text", text: "Error: trigger too short (min 3 chars)." }] };
  }
  if (trigger.length > REMINDERS.MAX_ACTION_LENGTH) {
    return { content: [{ type: "text", text: `Error: trigger too long (max ${REMINDERS.MAX_ACTION_LENGTH} chars).` }] };
  }
  if (!action || action.length < 5) {
    return { content: [{ type: "text", text: "Error: action too short (min 5 chars)." }] };
  }
  if (action.length > REMINDERS.MAX_ACTION_LENGTH) {
    return { content: [{ type: "text", text: `Error: action too long (max ${REMINDERS.MAX_ACTION_LENGTH} chars).` }] };
  }
  const activeCount = db.prepare(
    "SELECT COUNT(*) as c FROM reminders WHERE active = 1"
  ).get();
  if (activeCount.c >= REMINDERS.MAX_ACTIVE) {
    return { content: [{ type: "text", text: `Error: limit reached (${REMINDERS.MAX_ACTIVE} active reminders). Deactivate some first.` }] };
  }
  const existing = findSimilarReminder(db, trigger, project);
  if (existing) {
    return { content: [{ type: "text", text: `ok (deduplicated \u2014 similar reminder exists: id:${existing})` }] };
  }
  const id = uuid();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(
    "INSERT INTO reminders (id, trigger_pattern, action, project, max_fires, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, trigger, action, project, maxFires, now);
  return { content: [{ type: "text", text: `ok (id:${id})` }] };
}
function handleListReminders(db, input, defaultProject) {
  const project = input.project ?? defaultProject ?? null;
  const includeInactive = input.include_inactive === true;
  const conditions = [];
  const params = [];
  if (!includeInactive) {
    conditions.push("active = 1");
  }
  if (project) {
    conditions.push("(project = ? OR project IS NULL)");
    params.push(project);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(
    `SELECT * FROM reminders ${where} ORDER BY created_at DESC`
  ).all(...params);
  if (rows.length === 0) {
    return { content: [{ type: "text", text: "No reminders found." }] };
  }
  const lines = rows.map((r, i) => {
    const scope = r.project ? `[${r.project}]` : "[global]";
    const status = r.active ? "" : " [inactive]";
    const fires = r.max_fires > 0 ? ` fires:${r.fire_count}/${r.max_fires}` : ` fires:${r.fire_count}`;
    return `${i + 1}. "${r.trigger_pattern}" \u2192 ${r.action} (id:${r.id} ${scope}${fires}${status})`;
  });
  return { content: [{ type: "text", text: lines.join("\n") }] };
}
function checkReminders(db, prompt, project) {
  if (!prompt || prompt.length < 5) return [];
  const keywords = prompt.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 8).map((w) => `"${w}"`).join(" OR ");
  if (!keywords) return [];
  try {
    const conditions = ["r.active = 1"];
    const params = [keywords];
    if (project) {
      conditions.push("(r.project = ? OR r.project IS NULL)");
      params.push(project);
    }
    const rows = db.prepare(`
      SELECT r.id, r.action, r.fire_count, r.max_fires
      FROM reminders_fts f
      JOIN reminders r ON r.rowid = f.rowid
      WHERE reminders_fts MATCH ?
        AND ${conditions.join(" AND ")}
      ORDER BY bm25(reminders_fts)
      LIMIT ?
    `).all(...params, REMINDERS.MAX_FIRE_PER_PROMPT);
    const fired = [];
    const updateFire = db.prepare("UPDATE reminders SET fire_count = fire_count + 1 WHERE id = ?");
    const deactivate = db.prepare("UPDATE reminders SET active = 0 WHERE id = ?");
    for (const r of rows) {
      updateFire.run(r.id);
      if (r.max_fires > 0 && r.fire_count + 1 >= r.max_fires) {
        deactivate.run(r.id);
      }
      fired.push({ id: r.id, action: r.action });
    }
    return fired;
  } catch {
    return [];
  }
}
function findSimilarReminder(db, trigger, project) {
  const keywords = trigger.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2).map((w) => `"${w}"`).join(" OR ");
  if (!keywords) return null;
  try {
    const projectCondition = project ? "(r.project = ? OR r.project IS NULL)" : "r.project IS NULL";
    const params = project ? [keywords, project] : [keywords];
    const row = db.prepare(`
      SELECT r.id, r.trigger_pattern FROM reminders_fts f
      JOIN reminders r ON r.rowid = f.rowid
      WHERE reminders_fts MATCH ?
        AND r.active = 1
        AND ${projectCondition}
      LIMIT 1
    `).get(...params);
    if (!row) return null;
    const trigTokens = new Set(trigger.toLowerCase().split(/\s+/));
    const existTokens = new Set(row.trigger_pattern.toLowerCase().split(/\s+/));
    const intersection = [...trigTokens].filter((t) => existTokens.has(t)).length;
    const overlap = intersection / Math.max(trigTokens.size, existTokens.size);
    return overlap >= 0.7 ? row.id : null;
  } catch {
    return null;
  }
}

export {
  REMINDER_TOOL_DEFINITIONS,
  handleRemind,
  handleListReminders,
  checkReminders
};
//# sourceMappingURL=chunk-7YDVCCRG.js.map