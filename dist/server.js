#!/usr/bin/env node
import {
  REMINDER_TOOL_DEFINITIONS,
  handleListReminders,
  handleRemind
} from "./chunk-XAQ43TKA.js";
import {
  CONFIDENCE,
  CONTENT,
  CONTEXT_ADAPTIVE,
  DEDUP,
  MEMORY_KINDS,
  PLANS,
  RETRIEVAL,
  SCHEMA,
  readStateFile
} from "./chunk-V4B64BB2.js";

// src/v2/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// src/v2/db/client.ts
import Database from "better-sqlite3";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";
import { createHash } from "crypto";
function projectId(path) {
  const name = path.split("/").pop() ?? "unknown";
  const hash = createHash("sha256").update(path).digest("hex").slice(0, 8);
  return `${name}-${hash}`;
}
function getDbPath(project) {
  const dir = join(homedir(), ".engram", "v2");
  mkdirSync(dir, { recursive: true });
  if (project) {
    return join(dir, `${project}.db`);
  }
  return join(dir, "engram.db");
}
function createDb(dbPath2) {
  const path = dbPath2 ?? getDbPath();
  const db2 = new Database(path);
  db2.pragma("journal_mode = WAL");
  db2.pragma("synchronous = NORMAL");
  db2.pragma("foreign_keys = ON");
  db2.exec(SCHEMA);
  return db2;
}

// src/v2/db/memory-repository.ts
import { v4 as uuid } from "uuid";
function tokenize(text) {
  return new Set(
    text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)
  );
}
function tokenOverlap(a, b) {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = (/* @__PURE__ */ new Set([...tokensA, ...tokensB])).size;
  return union === 0 ? 0 : intersection / union;
}
var MemoryRepository = class {
  constructor(db2) {
    this.db = db2;
  }
  // ---- LEARN (with Mem0-style ADD/UPDATE/NOOP dedup) ----
  learn(content, kind, options = {}) {
    const {
      project = null,
      source = "learned",
      confidence = source === "corrected" ? CONFIDENCE.DEFAULT_CORRECTION : source === "user" ? CONFIDENCE.DEFAULT_USER : CONFIDENCE.DEFAULT_LEARNED
    } = options;
    const tags = (options.tags ?? []).slice(0, CONTENT.MAX_TAGS).map((t) => t.slice(0, CONTENT.MAX_TAG_LENGTH));
    const candidates = this.searchFts(content, DEDUP.MAX_CANDIDATES);
    for (const candidate of candidates) {
      if (candidate.invalidated) continue;
      const overlap = tokenOverlap(content, candidate.content);
      if (overlap >= DEDUP.SIMILARITY_THRESHOLD) {
        if (content.length > candidate.content.length) {
          this.db.prepare(`
            UPDATE memories SET content = ?, tags = ?, confidence = MAX(confidence, ?), source = ?
            WHERE id = ?
          `).run(content, JSON.stringify(tags), confidence, source, candidate.id);
          return { id: candidate.id, deduplicated: true };
        }
        return { id: candidate.id, deduplicated: true };
      }
    }
    const id = uuid();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      INSERT INTO memories (id, content, kind, project, tags, confidence, source, created_at, recall_count, invalidated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).run(id, content, kind, project ?? null, JSON.stringify(tags), confidence, source, now);
    return { id, deduplicated: false };
  }
  // ---- RECALL (FTS5 BM25 + confidence + recency scoring) ----
  recall(query, options = {}) {
    const {
      project = null,
      kind,
      maxResults = RETRIEVAL.DEFAULT_MAX_RESULTS
    } = options;
    const limit = Math.min(maxResults, RETRIEVAL.MAX_MAX_RESULTS);
    const ftsResults = this.searchFts(query, limit * 3);
    const now = Date.now();
    const scored = [];
    for (const mem of ftsResults) {
      if (mem.invalidated) continue;
      if (kind && mem.kind !== kind) continue;
      if (project !== void 0 && project !== null) {
        if (mem.project !== null && mem.project !== project) continue;
      }
      let recencyBoost = RETRIEVAL.RECENCY_STALE_FACTOR;
      if (mem.last_recalled) {
        const daysSinceRecall = (now - new Date(mem.last_recalled).getTime()) / (1e3 * 60 * 60 * 24);
        if (daysSinceRecall <= RETRIEVAL.RECENCY_BOOST_DAYS) {
          recencyBoost = 1.2;
        } else if (daysSinceRecall <= RETRIEVAL.RECENCY_NORMAL_DAYS) {
          recencyBoost = 1;
        }
      }
      const bm25Score = mem._bm25 !== void 0 ? Math.max(0, 1 + mem._bm25 / 10) : 0.5;
      const relevance = bm25Score * mem.confidence * recencyBoost;
      const projectBoost = project && mem.project === project ? 1.2 : 1;
      scored.push({ ...mem, relevance: relevance * projectBoost });
    }
    scored.sort((a, b) => b.relevance - a.relevance);
    const results = scored.slice(0, limit);
    const updateStmt = this.db.prepare(
      "UPDATE memories SET last_recalled = ?, recall_count = recall_count + 1 WHERE id = ?"
    );
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    for (const mem of results) {
      updateStmt.run(nowIso, mem.id);
    }
    return results;
  }
  // ---- CORRECT ----
  correct(id, action, newContent) {
    if (action === "invalidate") {
      const result = this.db.prepare(
        "UPDATE memories SET invalidated = 1 WHERE id = ? AND invalidated = 0"
      ).run(id);
      return result.changes > 0;
    }
    if (action === "update" && newContent) {
      const result = this.db.prepare(`
        UPDATE memories SET content = ?, confidence = ?, source = 'corrected'
        WHERE id = ? AND invalidated = 0
      `).run(newContent, CONFIDENCE.DEFAULT_CORRECTION, id);
      return result.changes > 0;
    }
    return false;
  }
  // ---- FORGET (hard delete) ----
  forget(id) {
    const result = this.db.prepare("DELETE FROM memories WHERE id = ?").run(id);
    return result.changes > 0;
  }
  // ---- STRENGTHEN ----
  strengthen(id) {
    const result = this.db.prepare(`
      UPDATE memories SET confidence = MIN(?, confidence + ?)
      WHERE id = ? AND invalidated = 0
    `).run(CONFIDENCE.CAP, CONFIDENCE.BOOST_INCREMENT, id);
    return result.changes > 0;
  }
  // ---- WEAKEN (auto-invalidate below threshold) ----
  weaken(id) {
    const mem = this.db.prepare(
      "SELECT confidence FROM memories WHERE id = ? AND invalidated = 0"
    ).get(id);
    if (!mem) return { weakened: false, invalidated: false };
    const newConf = Math.max(mem.confidence * CONFIDENCE.WEAKEN_FACTOR, CONFIDENCE.FLOOR);
    if (newConf < CONFIDENCE.DELETE_THRESHOLD) {
      this.db.prepare("UPDATE memories SET invalidated = 1 WHERE id = ?").run(id);
      return { weakened: true, invalidated: true };
    }
    this.db.prepare("UPDATE memories SET confidence = ? WHERE id = ?").run(newConf, id);
    return { weakened: true, invalidated: false };
  }
  // ---- GET by ID ----
  get(id) {
    const row = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(id);
    return row ? rowToMemory(row) : null;
  }
  // ---- LIST by project/kind ----
  list(options = {}) {
    const conditions = [];
    const params = [];
    if (!options.includeInvalidated) {
      conditions.push("invalidated = 0");
    }
    if (options.project !== void 0) {
      if (options.project === null) {
        conditions.push("project IS NULL");
      } else {
        conditions.push("(project = ? OR project IS NULL)");
        params.push(options.project);
      }
    }
    if (options.kind) {
      conditions.push("kind = ?");
      params.push(options.kind);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = this.db.prepare(
      `SELECT * FROM memories ${where} ORDER BY confidence DESC`
    ).all(...params);
    return rows.map(rowToMemory);
  }
  // ---- FTS5 internal search ----
  searchFts(query, limit) {
    const ftsQuery = query.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2).map((w) => `"${w}"`).join(" OR ");
    if (!ftsQuery) return [];
    try {
      const rows = this.db.prepare(`
        SELECT memories.*, bm25(memories_fts) as _bm25
        FROM memories_fts
        JOIN memories ON memories.rowid = memories_fts.rowid
        WHERE memories_fts MATCH ?
        ORDER BY bm25(memories_fts)
        LIMIT ?
      `).all(ftsQuery, limit);
      return rows.map((row) => ({ ...rowToMemory(row), _bm25: row._bm25 }));
    } catch {
      return [];
    }
  }
};
function rowToMemory(row) {
  let tags = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {
  }
  return {
    id: row.id,
    content: row.content,
    kind: row.kind,
    project: row.project,
    tags,
    confidence: row.confidence,
    source: row.source,
    created_at: row.created_at,
    last_recalled: row.last_recalled,
    recall_count: row.recall_count,
    invalidated: row.invalidated !== 0
  };
}

// src/v2/db/plan-repository.ts
import { v4 as uuid2 } from "uuid";
var PlanRepository = class {
  constructor(db2) {
    this.db = db2;
  }
  // ---- CREATE ----
  create(project, name, steps) {
    const warnings = [];
    if (steps.length > PLANS.MAX_STEPS) {
      warnings.push(`Truncated to ${PLANS.MAX_STEPS} steps (had ${steps.length}).`);
      steps = steps.slice(0, PLANS.MAX_STEPS);
    }
    const existing = this.getActive(project);
    if (existing) {
      this.db.prepare(
        "UPDATE plans SET status = 'abandoned', updated_at = ? WHERE id = ?"
      ).run((/* @__PURE__ */ new Date()).toISOString(), existing.id);
      warnings.push(`Archived previous plan: "${existing.name}".`);
    }
    const id = uuid2();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      INSERT INTO plans (id, project, name, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `).run(id, project, name, now, now);
    const insertStep = this.db.prepare(`
      INSERT INTO plan_steps (plan_id, step_id, description, status, depends_on, outcome, blockers, notes)
      VALUES (?, ?, ?, 'pending', ?, NULL, NULL, '[]')
    `);
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      insertStep.run(id, i + 1, s.description, JSON.stringify(s.depends_on ?? []));
    }
    return { plan: this.get(id), warnings };
  }
  // ---- GET (with steps + decisions) ----
  get(planId) {
    const row = this.db.prepare("SELECT * FROM plans WHERE id = ?").get(planId);
    if (!row) return null;
    const steps = this.getSteps(planId);
    const decisions = this.getDecisions(planId);
    return { ...rowToPlan(row), steps, decisions };
  }
  // ---- GET ACTIVE (for a project) ----
  getActive(project) {
    const row = this.db.prepare(
      "SELECT * FROM plans WHERE project = ? AND status = 'active' LIMIT 1"
    ).get(project);
    if (!row) return null;
    return this.get(row.id);
  }
  // ---- STEP (update step status) ----
  updateStep(planId, stepId, update) {
    const warnings = [];
    const step = this.db.prepare(
      "SELECT * FROM plan_steps WHERE plan_id = ? AND step_id = ?"
    ).get(planId, stepId);
    if (!step) return { ok: false, warnings: ["Step not found."] };
    if (update.status === "in_progress") {
      const deps = JSON.parse(step.depends_on || "[]");
      if (deps.length > 0) {
        const doneSteps = this.db.prepare(
          `SELECT step_id FROM plan_steps WHERE plan_id = ? AND step_id IN (${deps.map(() => "?").join(",")}) AND status = 'done'`
        ).all(planId, ...deps);
        const doneIds = new Set(doneSteps.map((s) => s.step_id));
        const pending = deps.filter((d) => !doneIds.has(d));
        if (pending.length > 0) {
          warnings.push(`Dependencies not done: steps ${pending.join(", ")}.`);
        }
      }
    }
    const sets = [];
    const params = [];
    if (update.status) {
      sets.push("status = ?");
      params.push(update.status);
    }
    if (update.outcome !== void 0) {
      sets.push("outcome = ?");
      params.push(update.outcome);
    }
    if (update.blockers !== void 0) {
      sets.push("blockers = ?");
      params.push(update.blockers);
    }
    if (sets.length === 0) return { ok: false, warnings: ["Nothing to update."] };
    params.push(planId, stepId);
    this.db.prepare(
      `UPDATE plan_steps SET ${sets.join(", ")} WHERE plan_id = ? AND step_id = ?`
    ).run(...params);
    this.db.prepare("UPDATE plans SET updated_at = ? WHERE id = ?").run((/* @__PURE__ */ new Date()).toISOString(), planId);
    return { ok: true, warnings };
  }
  // ---- DECIDE (record a decision) ----
  decide(planId, chose, why, options = {}) {
    const id = uuid2();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      INSERT INTO plan_decisions (id, plan_id, step_id, chose, why, alternatives, permanent, decided_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, planId, options.step_id ?? null, chose, why, JSON.stringify(options.alternatives ?? []), now);
    this.db.prepare("UPDATE plans SET updated_at = ? WHERE id = ?").run(now, planId);
    return id;
  }
  // ---- NOTE (append progress checkpoint to step) ----
  addNote(planId, stepId, note, replace = false) {
    const step = this.db.prepare(
      "SELECT notes FROM plan_steps WHERE plan_id = ? AND step_id = ?"
    ).get(planId, stepId);
    if (!step) return false;
    const truncated = note.slice(0, CONTENT.NOTE_MAX_LENGTH);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let notes;
    if (replace) {
      notes = [{ note: truncated, at: now }];
    } else {
      notes = JSON.parse(step.notes || "[]");
      if (notes.length >= 20) notes = notes.slice(-19);
      notes.push({ note: truncated, at: now });
    }
    this.db.prepare(
      "UPDATE plan_steps SET notes = ? WHERE plan_id = ? AND step_id = ?"
    ).run(JSON.stringify(notes), planId, stepId);
    this.db.prepare("UPDATE plans SET updated_at = ? WHERE id = ?").run(now, planId);
    return true;
  }
  // ---- COMPLETE (archive plan, graduate permanent decisions to memories) ----
  complete(planId) {
    const plan = this.get(planId);
    if (!plan || plan.status !== "active") {
      return { ok: false, graduated_decisions: [] };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(
      "UPDATE plans SET status = 'completed', updated_at = ? WHERE id = ?"
    ).run(now, planId);
    const graduated = plan.decisions.filter((d) => d.permanent).map((d) => `${d.chose}: ${d.why}`);
    return { ok: true, graduated_decisions: graduated };
  }
  // ---- LIST (all plans for a project) ----
  list(project) {
    const rows = this.db.prepare(
      "SELECT * FROM plans WHERE project = ? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, updated_at DESC"
    ).all(project);
    return rows.map(rowToPlan);
  }
  // ---- ADD STEP (mid-plan) ----
  addStep(planId, description, depends_on = []) {
    const plan = this.get(planId);
    if (!plan || plan.status !== "active") return null;
    const nextId = plan.steps.length > 0 ? Math.max(...plan.steps.map((s) => s.step_id)) + 1 : 1;
    let warning;
    if (plan.steps.length >= PLANS.MAX_STEPS) {
      warning = `Plan now has ${plan.steps.length + 1} steps (max recommended: ${PLANS.MAX_STEPS}).`;
    }
    this.db.prepare(`
      INSERT INTO plan_steps (plan_id, step_id, description, status, depends_on, outcome, blockers, notes)
      VALUES (?, ?, ?, 'pending', ?, NULL, NULL, '[]')
    `).run(planId, nextId, description, JSON.stringify(depends_on));
    this.db.prepare("UPDATE plans SET updated_at = ? WHERE id = ?").run((/* @__PURE__ */ new Date()).toISOString(), planId);
    return { step_id: nextId, warning };
  }
  // ---- INTERNAL HELPERS ----
  getSteps(planId) {
    const rows = this.db.prepare(
      "SELECT * FROM plan_steps WHERE plan_id = ? ORDER BY step_id"
    ).all(planId);
    return rows.map(rowToStep);
  }
  getDecisions(planId) {
    const rows = this.db.prepare(
      "SELECT * FROM plan_decisions WHERE plan_id = ? ORDER BY decided_at"
    ).all(planId);
    return rows.map(rowToDecision);
  }
};
function rowToPlan(row) {
  return {
    id: row.id,
    project: row.project,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function rowToStep(row) {
  let depends_on = [];
  try {
    depends_on = JSON.parse(row.depends_on);
  } catch {
  }
  let notes = [];
  try {
    notes = JSON.parse(row.notes);
  } catch {
  }
  return {
    plan_id: row.plan_id,
    step_id: row.step_id,
    description: row.description,
    status: row.status,
    depends_on,
    outcome: row.outcome,
    blockers: row.blockers,
    notes
  };
}
function rowToDecision(row) {
  let alternatives = [];
  try {
    alternatives = JSON.parse(row.alternatives);
  } catch {
  }
  return {
    id: row.id,
    plan_id: row.plan_id,
    step_id: row.step_id,
    chose: row.chose,
    why: row.why,
    alternatives,
    permanent: row.permanent !== 0,
    decided_at: row.decided_at
  };
}

// src/v2/tools/memory-tools.ts
var MEMORY_TOOL_DEFINITIONS = [
  {
    name: "engram_recall",
    description: "Retrieve relevant memories for a task or topic. Call before starting work.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you are about to do or need to know" },
        project: { type: "string", description: "Project scope (auto-detected if omitted)" },
        kind: { type: "string", enum: [...MEMORY_KINDS], description: "Filter by memory kind" },
        max_results: { type: "number", description: "Max results (default 5, max 20)" }
      },
      required: ["query"]
    }
  },
  {
    name: "engram_learn",
    description: "Store a distilled lesson. ONE sentence preferred. Content over 200 chars triggers a warning.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The lesson \u2014 one sentence, distilled" },
        kind: {
          type: "string",
          enum: ["pitfall", "decision", "correction", "fact"],
          description: "pitfall: mistake+fix, decision: choice+why, correction: user said no, fact: stable knowledge"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Free-form tags for retrieval matching (max 5)"
        },
        project: { type: "string", description: "Project scope (null = global). Corrections default global." }
      },
      required: ["content", "kind"]
    }
  },
  {
    name: "engram_correct",
    description: "Fix or invalidate a stored memory that is wrong or outdated.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Memory ID to correct" },
        action: { type: "string", enum: ["update", "invalidate"], description: "Update content or soft-delete" },
        new_content: { type: "string", description: "Replacement content (for update action)" }
      },
      required: ["id", "action"]
    }
  },
  {
    name: "engram_forget",
    description: "Permanently delete a memory. Use when a memory is no longer relevant.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Memory ID to delete" }
      },
      required: ["id"]
    }
  },
  {
    name: "engram_strengthen",
    description: "Increase trust in a memory that proved accurate or useful.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Memory ID" }
      },
      required: ["id"]
    }
  },
  {
    name: "engram_weaken",
    description: "Decrease trust in a memory that was inaccurate or unhelpful.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Memory ID" }
      },
      required: ["id"]
    }
  }
];
function handleRecall(repo2, input, defaultProject2, mode = "normal") {
  if (mode === "critical") {
    return { content: [{ type: "text", text: "Context critical \u2014 engram silent." }] };
  }
  const query = String(input.query ?? "");
  const project = input.project ?? defaultProject2 ?? null;
  const kind = input.kind;
  const modeLimit = mode === "minimal" ? CONTEXT_ADAPTIVE.MINIMAL_MAX_RESULTS : mode === "compact" ? CONTEXT_ADAPTIVE.COMPACT_MAX_RESULTS : CONTEXT_ADAPTIVE.NORMAL_MAX_RESULTS;
  const maxResults = typeof input.max_results === "number" ? Math.min(Math.max(1, Math.floor(input.max_results)), modeLimit) : modeLimit;
  const results = repo2.recall(query, { project, kind, maxResults });
  if (results.length === 0) {
    return { content: [{ type: "text", text: "No relevant memories found." }] };
  }
  const lines = results.map((m, i) => {
    const scope = m.project ? `[${m.project}]` : "[global]";
    const tags = m.tags.length > 0 ? ` tags:${m.tags.join(",")}` : "";
    let content = m.content;
    if (mode === "compact" && content.length > CONTEXT_ADAPTIVE.COMPACT_CONTENT_MAX_CHARS) {
      content = content.slice(0, CONTEXT_ADAPTIVE.COMPACT_CONTENT_MAX_CHARS - 3) + "...";
    } else if (mode === "minimal") {
      const sentenceEnd = content.search(/[.!?]\s|$/);
      if (sentenceEnd > 0 && sentenceEnd < content.length - 1) {
        content = content.slice(0, sentenceEnd + 1);
      }
    }
    return `${i + 1}. [${m.kind}] ${content} (id:${m.id} conf:${m.confidence.toFixed(2)} ${scope}${tags})`;
  });
  return { content: [{ type: "text", text: lines.join("\n") }] };
}
function handleLearn(repo2, input, defaultProject2, mode = "normal") {
  if (mode === "critical" || mode === "minimal") {
    return { content: [{ type: "text", text: "Suppressed \u2014 context pressure too high." }] };
  }
  const content = String(input.content ?? "");
  const kind = input.kind;
  if (!content || content.length < 5) {
    return { content: [{ type: "text", text: "Error: content too short (min 5 chars)." }] };
  }
  if (content.length > CONTENT.MAX_LENGTH) {
    return { content: [{ type: "text", text: `Error: content too long (max ${CONTENT.MAX_LENGTH} chars). Distill further.` }] };
  }
  if (!MEMORY_KINDS.includes(kind) || kind === "task_state") {
    return { content: [{ type: "text", text: "Error: kind must be pitfall, decision, correction, or fact." }] };
  }
  let tags = Array.isArray(input.tags) ? input.tags.map(String).slice(0, CONTENT.MAX_TAGS) : [];
  tags = tags.map((t) => t.slice(0, CONTENT.MAX_TAG_LENGTH));
  const project = kind === "correction" ? input.project ?? null : input.project ?? defaultProject2 ?? null;
  const result = repo2.learn(content, kind, {
    tags,
    project,
    source: kind === "correction" ? "corrected" : "learned"
  });
  let response = "ok";
  if (result.deduplicated) response = "ok (deduplicated)";
  if (content.length > CONTENT.WARN_LENGTH) response += " \u2014 consider distilling further";
  return { content: [{ type: "text", text: response }] };
}
function handleCorrect(repo2, input) {
  const id = String(input.id ?? "");
  const action = input.action;
  const newContent = input.new_content;
  if (action === "update" && !newContent) {
    return { content: [{ type: "text", text: "Error: new_content required for update action." }] };
  }
  if (newContent && newContent.length > CONTENT.MAX_LENGTH) {
    return { content: [{ type: "text", text: `Error: new_content too long (max ${CONTENT.MAX_LENGTH} chars).` }] };
  }
  const ok2 = repo2.correct(id, action, newContent);
  return { content: [{ type: "text", text: ok2 ? "ok" : "not_found" }] };
}
function handleForget(repo2, input) {
  const id = String(input.id ?? "");
  const ok2 = repo2.forget(id);
  return { content: [{ type: "text", text: ok2 ? "ok" : "not_found" }] };
}
function handleStrengthen(repo2, input) {
  const id = String(input.id ?? "");
  const ok2 = repo2.strengthen(id);
  return { content: [{ type: "text", text: ok2 ? "ok" : "not_found" }] };
}
function handleWeaken(repo2, input) {
  const id = String(input.id ?? "");
  const result = repo2.weaken(id);
  if (!result.weakened) return { content: [{ type: "text", text: "not_found" }] };
  return { content: [{ type: "text", text: result.invalidated ? "ok (auto-invalidated \u2014 below threshold)" : "ok" }] };
}

// src/v2/tools/plan-tools.ts
var PLAN_TOOL_DEFINITION = {
  name: "engram_plan",
  description: "Structured task tracking. Actions: create, get, step, decide, note, complete, list.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "get", "step", "decide", "note", "complete", "list"],
        description: "Plan action to perform"
      },
      // create
      name: { type: "string", description: "Plan name (for create)" },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            depends_on: { type: "array", items: { type: "number" } }
          },
          required: ["description"]
        },
        description: "Steps (for create)"
      },
      // step
      step_id: { type: "number", description: "Step number (for step/decide/note)" },
      status: {
        type: "string",
        enum: ["done", "in_progress", "pending", "blocked"],
        description: "Step status (for step)"
      },
      outcome: { type: "string", description: "Step outcome (for step)" },
      blockers: { type: "string", description: "What is blocking (for step)" },
      // decide
      chose: { type: "string", description: "What was chosen (for decide)" },
      why: { type: "string", description: "Why this choice (for decide)" },
      alternatives: {
        type: "array",
        items: { type: "string" },
        description: "Alternatives considered (for decide)"
      },
      // note
      note: { type: "string", description: "Progress checkpoint (for note, max 150 chars)" },
      replace: { type: "boolean", description: "Replace prior notes (for note, default false)" },
      // get (optional filter)
      filter: {
        type: "string",
        enum: ["active", "current", "decisions"],
        description: "Filter mode (for get): active=active plan, current=current step, decisions=decisions only"
      }
    },
    required: ["action"]
  }
};
function handlePlan(repo2, input, project, mode = "normal") {
  const action = String(input.action ?? "");
  switch (action) {
    case "create":
      return handleCreate(repo2, input, project);
    case "get":
      return handleGet(repo2, input, project, mode);
    case "step":
      return handleStep(repo2, input, project);
    case "decide":
      return handleDecide(repo2, input, project);
    case "note":
      return handleNote(repo2, input, project);
    case "complete":
      return handleComplete(repo2, project);
    case "list":
      return handleList(repo2, project);
    default:
      return err(`Unknown action: "${action}". Use: create, get, step, decide, note, complete, list.`);
  }
}
function handleCreate(repo2, input, project) {
  const name = String(input.name ?? "");
  if (!name) return err("Error: name required.");
  const rawSteps = Array.isArray(input.steps) ? input.steps : [];
  if (rawSteps.length === 0) return err("Error: at least one step required.");
  const steps = rawSteps.map((s) => ({
    description: String(s.description ?? ""),
    depends_on: Array.isArray(s.depends_on) ? s.depends_on.map(Number) : void 0
  }));
  const { plan: created, warnings } = repo2.create(project, name, steps);
  const plan = repo2.get(created.id);
  if (!plan) return err("Failed to create plan.");
  return ok(formatPlan(plan, warnings));
}
function handleGet(repo2, input, project, mode = "normal") {
  const filter = input.filter;
  const plan = repo2.getActive(project);
  if (!plan) return ok("No active plan.");
  if (mode === "critical") {
    const current = plan.steps.find((s) => s.status === "in_progress") ?? plan.steps.find((s) => s.status === "pending");
    const stepDesc = current ? `: ${current.description}` : "";
    return ok(`${plan.name}${stepDesc}`);
  }
  if (mode === "minimal") {
    const current = plan.steps.find((s) => s.status === "in_progress") ?? plan.steps.find((s) => s.status === "pending");
    if (!current) return ok(`Plan "${plan.name}" \u2014 all steps done.`);
    return ok(formatStep(current, plan.name));
  }
  if (filter === "current") {
    const current = plan.steps.find((s) => s.status === "in_progress") ?? plan.steps.find((s) => s.status === "pending");
    if (!current) return ok(`Plan "${plan.name}" \u2014 all steps done.`);
    return ok(formatStep(current, plan.name));
  }
  if (filter === "decisions") {
    if (plan.decisions.length === 0) return ok("No decisions recorded.");
    const lines = plan.decisions.map(
      (d, i) => `${i + 1}. ${d.chose} \u2014 ${d.why}${d.step_id ? ` (step ${d.step_id})` : ""}`
    );
    return ok(lines.join("\n"));
  }
  if (mode === "compact") {
    const activeSteps = plan.steps.filter((s) => s.status !== "done");
    const done = plan.steps.length - activeSteps.length;
    const header = `${plan.name} \u2014 ${done}/${plan.steps.length} steps done`;
    const stepLines = activeSteps.map((s) => {
      const icon = s.status === "in_progress" ? "\u2192" : s.status === "blocked" ? "\u2717" : "\xB7";
      return `  ${icon} ${s.step_id}. ${s.description} [${s.status}]`;
    });
    return ok([header, ...stepLines].join("\n"));
  }
  return ok(formatPlan(plan));
}
function handleStep(repo2, input, project) {
  const plan = repo2.getActive(project);
  if (!plan) return err("No active plan.");
  const stepId = Number(input.step_id);
  if (!stepId || isNaN(stepId)) return err("Error: step_id required.");
  const { ok: updated, warnings } = repo2.updateStep(plan.id, stepId, {
    status: input.status,
    outcome: input.outcome,
    blockers: input.blockers
  });
  if (!updated) return err("Step not found.");
  const warn = warnings.length > 0 ? `
\u26A0 ${warnings.join(" ")}` : "";
  return ok(`ok${warn}`);
}
function handleDecide(repo2, input, project) {
  const plan = repo2.getActive(project);
  if (!plan) return err("No active plan.");
  const chose = String(input.chose ?? "");
  const why = String(input.why ?? "");
  if (!chose || !why) return err("Error: chose and why required.");
  repo2.decide(plan.id, chose, why, {
    step_id: typeof input.step_id === "number" ? input.step_id : void 0,
    alternatives: Array.isArray(input.alternatives) ? input.alternatives.map(String) : void 0
  });
  return ok("ok");
}
function handleNote(repo2, input, project) {
  const plan = repo2.getActive(project);
  if (!plan) return err("No active plan.");
  const stepId = Number(input.step_id);
  if (!stepId || isNaN(stepId)) return err("Error: step_id required.");
  const note = String(input.note ?? "");
  if (!note) return err("Error: note required.");
  const replace = input.replace === true;
  const added = repo2.addNote(plan.id, stepId, note, replace);
  if (!added) return err("Step not found.");
  return ok("ok");
}
function handleComplete(repo2, project) {
  const plan = repo2.getActive(project);
  if (!plan) return err("No active plan.");
  const { ok: completed, graduated_decisions } = repo2.complete(plan.id);
  if (!completed) return err("Failed to complete plan.");
  let response = "ok";
  if (graduated_decisions.length > 0) {
    response += `
Graduated ${graduated_decisions.length} permanent decision(s) for memory encoding.`;
  }
  return ok(response);
}
function handleList(repo2, project) {
  const plans = repo2.list(project);
  if (plans.length === 0) return ok("No plans.");
  const lines = plans.map(
    (p, i) => `${i + 1}. [${p.status}] ${p.name} (${p.created_at.slice(0, 10)})`
  );
  return ok(lines.join("\n"));
}
function formatPlan(plan, warnings) {
  const done = plan.steps.filter((s) => s.status === "done").length;
  const total = plan.steps.length;
  const header = `${plan.name} [${plan.status}] \u2014 ${done}/${total} steps done`;
  const stepLines = plan.steps.map((s) => {
    const icon = s.status === "done" ? "\u2713" : s.status === "in_progress" ? "\u2192" : s.status === "blocked" ? "\u2717" : "\xB7";
    const noteSuffix = s.notes.length > 0 ? ` (${s.notes[s.notes.length - 1].note})` : "";
    return `  ${icon} ${s.step_id}. ${s.description} [${s.status}]${noteSuffix}`;
  });
  const parts = [header, ...stepLines];
  if (plan.decisions.length > 0) {
    parts.push(`Decisions: ${plan.decisions.length}`);
  }
  if (warnings && warnings.length > 0) {
    parts.push(`\u26A0 ${warnings.join(" ")}`);
  }
  return parts.join("\n");
}
function formatStep(step, planName) {
  let line = `${planName} \u2192 step ${step.step_id}: ${step.description} [${step.status}]`;
  if (step.blockers) line += `
Blocker: ${step.blockers}`;
  if (step.notes.length > 0) {
    line += `
Last note: ${step.notes[step.notes.length - 1].note}`;
  }
  return line;
}
function ok(text) {
  return { content: [{ type: "text", text }] };
}
function err(text) {
  return { content: [{ type: "text", text }] };
}

// src/v2/server.ts
var cwd = process.cwd();
var defaultProject = projectId(cwd);
var dbPath = getDbPath();
var db = createDb(dbPath);
var repo = new MemoryRepository(db);
var planRepo = new PlanRepository(db);
function readContextMode() {
  try {
    return readStateFile().mode;
  } catch {
    return "normal";
  }
}
var server = new McpServer(
  { name: "engram", version: "2.1.0" },
  { capabilities: { tools: {} } }
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[0].name,
  {
    title: "Recall Memories",
    description: MEMORY_TOOL_DEFINITIONS[0].description,
    inputSchema: z.object({
      query: z.string().describe("What you are about to do or need to know"),
      project: z.string().optional().describe("Project scope (auto-detected if omitted)"),
      kind: z.enum(["pitfall", "decision", "correction", "fact"]).optional().describe("Filter by memory kind"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)")
    })
  },
  async (args) => handleRecall(repo, args, defaultProject, readContextMode())
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[1].name,
  {
    title: "Learn",
    description: MEMORY_TOOL_DEFINITIONS[1].description,
    inputSchema: z.object({
      content: z.string().describe("The lesson \u2014 one sentence, distilled"),
      kind: z.enum(["pitfall", "decision", "correction", "fact"]).describe("pitfall|decision|correction|fact"),
      tags: z.array(z.string()).optional().describe("Free-form tags for retrieval (max 5)"),
      project: z.string().optional().describe("Project scope (null = global)")
    })
  },
  async (args) => handleLearn(repo, args, defaultProject, readContextMode())
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[2].name,
  {
    title: "Correct Memory",
    description: MEMORY_TOOL_DEFINITIONS[2].description,
    inputSchema: z.object({
      id: z.string().describe("Memory ID to correct"),
      action: z.enum(["update", "invalidate"]).describe("Update content or soft-delete"),
      new_content: z.string().optional().describe("Replacement content (for update action)")
    })
  },
  async (args) => handleCorrect(repo, args)
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[3].name,
  {
    title: "Forget Memory",
    description: MEMORY_TOOL_DEFINITIONS[3].description,
    inputSchema: z.object({
      id: z.string().describe("Memory ID to delete")
    })
  },
  async (args) => handleForget(repo, args)
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[4].name,
  {
    title: "Strengthen Memory",
    description: MEMORY_TOOL_DEFINITIONS[4].description,
    inputSchema: z.object({
      id: z.string().describe("Memory ID")
    })
  },
  async (args) => handleStrengthen(repo, args)
);
server.registerTool(
  MEMORY_TOOL_DEFINITIONS[5].name,
  {
    title: "Weaken Memory",
    description: MEMORY_TOOL_DEFINITIONS[5].description,
    inputSchema: z.object({
      id: z.string().describe("Memory ID")
    })
  },
  async (args) => handleWeaken(repo, args)
);
server.registerTool(
  PLAN_TOOL_DEFINITION.name,
  {
    title: "Plan",
    description: PLAN_TOOL_DEFINITION.description,
    inputSchema: z.object({
      action: z.enum(["create", "get", "step", "decide", "note", "complete", "list"]).describe("Plan action"),
      name: z.string().optional().describe("Plan name (create)"),
      steps: z.array(z.object({
        description: z.string(),
        depends_on: z.array(z.number()).optional()
      })).optional().describe("Steps (create)"),
      step_id: z.number().optional().describe("Step number (step/decide/note)"),
      status: z.enum(["done", "in_progress", "pending", "blocked"]).optional().describe("Step status (step)"),
      outcome: z.string().optional().describe("Step outcome (step)"),
      blockers: z.string().optional().describe("Blocker description (step)"),
      chose: z.string().optional().describe("What was chosen (decide)"),
      why: z.string().optional().describe("Why this choice (decide)"),
      alternatives: z.array(z.string()).optional().describe("Alternatives (decide)"),
      note: z.string().optional().describe("Progress note (note, max 150 chars)"),
      replace: z.boolean().optional().describe("Replace prior notes (note)"),
      filter: z.enum(["active", "current", "decisions"]).optional().describe("Filter mode (get)")
    })
  },
  async (args) => handlePlan(planRepo, args, defaultProject, readContextMode())
);
server.registerTool(
  REMINDER_TOOL_DEFINITIONS[0].name,
  {
    title: "Set Reminder",
    description: REMINDER_TOOL_DEFINITIONS[0].description,
    inputSchema: z.object({
      trigger: z.string().describe("Keywords/phrase that should trigger this reminder"),
      action: z.string().describe("What to remind about (max 200 chars)"),
      project: z.string().optional().describe("Project scope (null = global)"),
      max_fires: z.number().optional().describe("0 = unlimited, N = deactivate after N fires")
    })
  },
  async (args) => handleRemind(db, args, defaultProject)
);
server.registerTool(
  REMINDER_TOOL_DEFINITIONS[1].name,
  {
    title: "List Reminders",
    description: REMINDER_TOOL_DEFINITIONS[1].description,
    inputSchema: z.object({
      project: z.string().optional().describe("Project scope (auto-detected if omitted)"),
      include_inactive: z.boolean().optional().describe("Include deactivated reminders")
    })
  },
  async (args) => handleListReminders(db, args, defaultProject)
);
var transport = new StdioServerTransport();
await server.connect(transport);
process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  db.close();
  process.exit(0);
});
//# sourceMappingURL=server.js.map