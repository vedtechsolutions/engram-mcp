#!/usr/bin/env node

// src/v2/constants.ts
var MEMORY_KINDS = ["pitfall", "decision", "correction", "fact", "task_state"];
var CONFIDENCE = {
  DEFAULT_LEARNED: 0.5,
  DEFAULT_CORRECTION: 0.8,
  DEFAULT_USER: 0.9,
  AUTO_DETECTED: 0.4,
  BOOST_INCREMENT: 0.1,
  WEAKEN_FACTOR: 0.85,
  DELETE_THRESHOLD: 0.1,
  MIN_FOR_BRIEFING: 0.5,
  MIN_FOR_PITFALL_SURFACE: 0.6,
  CAP: 1,
  FLOOR: 0
};
var DECAY = {
  FACTOR: 0.9,
  // Multiply confidence by this per interval
  INTERVAL_DAYS: 30,
  // How often decay triggers
  EXEMPT_KINDS: ["correction"]
  // Never delete corrections
};
var DEDUP = {
  SIMILARITY_THRESHOLD: 0.8,
  // >80% token overlap = duplicate
  MAX_CANDIDATES: 3
  // Check top 3 FTS matches
};
var RETRIEVAL = {
  DEFAULT_MAX_RESULTS: 5,
  MAX_MAX_RESULTS: 20,
  RECENCY_BOOST_DAYS: 7,
  // Recalled in last 7 days = 1.2x boost
  RECENCY_NORMAL_DAYS: 30,
  // Recalled in last 30 days = 1.0x
  RECENCY_STALE_FACTOR: 0.8
  // Never recalled or >30 days = 0.8x
};
var BRIEFING = {
  MAX_TOKENS: 300,
  // Hard cap on briefing injection
  MAX_PITFALLS: 5,
  // Max pitfalls in briefing
  MAX_CORRECTIONS: 3
  // Max corrections in briefing
};
var CONTENT = {
  WARN_LENGTH: 200,
  // Warn "distill further" above this
  MAX_LENGTH: 2e3,
  // Hard reject above this
  MAX_TAGS: 5,
  MAX_TAG_LENGTH: 50,
  NOTE_MAX_LENGTH: 150
  // Plan notes max chars
};
var PLANS = {
  MAX_STEPS: 15,
  MAX_ACTIVE_PER_PROJECT: 1
};
var REMINDERS = {
  MAX_ACTIVE: 20,
  MAX_ACTION_LENGTH: 200,
  MAX_FIRE_PER_PROMPT: 3
};
var CONTEXT_MODES = {
  NORMAL_THRESHOLD: 50,
  // >50% free
  COMPACT_THRESHOLD: 25,
  // >25% free
  MINIMAL_THRESHOLD: 10
  // >10% free
  // Below 10% = critical
};
var INTENT_PATTERNS = {
  CORRECTION: [
    /^no[,.]?\s/,
    /that'?s\s*(not|wrong)/,
    /don'?t\s+(do|use|add|make)/,
    /always\s+(use|do|make|add)/,
    /i\s+(said|told|asked)/,
    /stop\s+(doing|using)/,
    /never\s+(use|do)/
  ],
  STATUS: [
    /where\s+are\s+we/,
    /what'?s\s+(the\s+)?(status|progress)/,
    /what\s+(step|phase)/,
    /show\s+(me\s+)?(the\s+)?plan/,
    /^status$/
  ],
  QUESTION: /^(how|what|why|where|when|which|can\s+you\s+explain|tell\s+me|is\s+(it|there)|does|do\s+we)/,
  ACTION_VERBS: /\b(fix|implement|create|update|refactor|add|remove|change|build|write|delete|move|rename|deploy|install|upgrade|migrate)\b/
};
var HOOK = {
  STATE_FILE_NAME: "state.json",
  STATE_DIR: ".engram/v2",
  TOKEN_BUDGET: 300,
  BRIEFING_PASS_MAX_PITFALLS_1: 3,
  BRIEFING_PASS_MAX_PITFALLS_2: 1,
  TRANSCRIPT_MAX_LINES: 200,
  SNAPSHOT_KEEP_DAYS: 7,
  NOTE_PRECOMPACT_MAX: 150,
  SESSION_INTERRUPT_WINDOW_HOURS: 24
};
var CONTEXT_ADAPTIVE = {
  NORMAL_MAX_RESULTS: 5,
  COMPACT_MAX_RESULTS: 3,
  MINIMAL_MAX_RESULTS: 2,
  COMPACT_CONTENT_MAX_CHARS: 100,
  MINIMAL_CONTENT_SENTENCES: 1
};
var MODE_LIMITS = {
  normal: {
    promptCheckPitfalls: 3,
    pitfallCheckFile: 2,
    // matches LEARNING.MAX_PITFALL_SURFACE
    pitfallCheckBash: 1,
    maxReminders: 3
    // matches REMINDERS.MAX_FIRE_PER_PROMPT
  },
  compact: {
    promptCheckPitfalls: 1,
    pitfallCheckFile: 1,
    pitfallCheckBash: 0,
    maxReminders: 1
  },
  minimal: {
    promptCheckPitfalls: 0,
    pitfallCheckFile: 0,
    pitfallCheckBash: 0,
    maxReminders: 0
  },
  critical: {
    promptCheckPitfalls: 0,
    pitfallCheckFile: 0,
    pitfallCheckBash: 0,
    maxReminders: 0
  }
};
var LEARNING = {
  MAX_PITFALL_SURFACE: 2,
  // Max pitfalls to surface per PreToolUse
  MAX_ERROR_CONTENT_LENGTH: 300,
  // Truncate error text for encoding
  SELF_CORRECTION_WINDOW_MS: 6e4,
  // Same file edited within 60s = self-correction
  SUCCESS_BOOST: 0.05,
  // Confidence boost on successful avoidance
  MAX_SURFACED_PER_SESSION: 20,
  // Don't surface more than this per session
  PROMOTE_AFTER_SESSIONS: 3,
  // Promote to global after N sessions with avoidance
  PROMOTE_MIN_CONFIDENCE: 0.7
  // Min confidence before considering promotion
};
var ERROR_PATTERNS = {
  COMPILATION: [
    /SyntaxError/,
    /TypeError/,
    /ReferenceError/,
    /ModuleNotFoundError/,
    /ImportError/,
    /IndentationError/,
    /cannot find module/i,
    /unexpected token/i,
    /is not defined/,
    /is not a function/,
    /Property .+ does not exist/,
    /TS\d{4}:/
    // TypeScript errors
  ],
  TEST_FAILURE: [
    /FAIL\s/,
    /AssertionError/,
    /AssertionError/,
    /expect\(.+\)\./,
    /test failed/i,
    /\d+ failed/
  ],
  RUNTIME: [
    /Error:/,
    /Traceback/,
    /panic:/,
    /FATAL/,
    /Unhandled/i
  ]
};
var NOISE_ERROR_PATTERNS = [
  /ConnectionError|TimeoutError|ConnectionRefused/,
  /PermissionError|Permission denied/,
  /FileNotFoundError|No such file/,
  /command not found/,
  /KeyboardInterrupt/,
  /SIGTERM|SIGKILL/,
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT/,
  /ENOMEM|ENOSPC/
];

// src/v2/hooks/shared/db.ts
import Database from "better-sqlite3";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { createHash } from "crypto";

// src/v2/db/schema.ts
var SCHEMA = `
-- Memories: the core data
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pitfall','decision','correction','fact','task_state')),
  project TEXT,
  tags TEXT,                -- JSON array
  confidence REAL DEFAULT 0.5,
  source TEXT DEFAULT 'learned' CHECK (source IN ('user','learned','corrected')),
  created_at TEXT NOT NULL,
  last_recalled TEXT,
  recall_count INTEGER DEFAULT 0,
  invalidated INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
CREATE INDEX IF NOT EXISTS idx_memories_kind ON memories(kind);
CREATE INDEX IF NOT EXISTS idx_memories_confidence ON memories(confidence DESC);

-- FTS5 for full-text search with BM25 scoring
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content,
  tags,
  content=memories,
  content_rowid=rowid
);

-- FTS sync triggers
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, tags)
  VALUES (new.rowid, new.content, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, tags)
  VALUES ('delete', old.rowid, old.content, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, tags)
  VALUES ('delete', old.rowid, old.content, old.tags);
  INSERT INTO memories_fts(rowid, content, tags)
  VALUES (new.rowid, new.content, new.tags);
END;

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  task_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project, started_at DESC);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_project ON plans(project, status);

CREATE TABLE IF NOT EXISTS plan_steps (
  plan_id TEXT NOT NULL REFERENCES plans(id),
  step_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('done','in_progress','pending','blocked')),
  depends_on TEXT,          -- JSON array of step IDs
  outcome TEXT,
  blockers TEXT,
  notes TEXT,               -- JSON array of {note, at}
  PRIMARY KEY (plan_id, step_id)
);

CREATE TABLE IF NOT EXISTS plan_decisions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  step_id INTEGER,          -- NULL = plan-level decision
  chose TEXT NOT NULL,
  why TEXT NOT NULL,
  alternatives TEXT,        -- JSON array
  permanent INTEGER DEFAULT 0,
  decided_at TEXT NOT NULL
);

-- Compaction snapshots (recovery data, transient)
CREATE TABLE IF NOT EXISTS compaction_snapshots (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  recent_files TEXT,        -- JSON array
  read_files TEXT,           -- JSON array (Read/Glob/Grep paths)
  recent_commands TEXT,      -- JSON array
  user_context TEXT,
  approach_notes TEXT,
  initial_goal TEXT          -- First substantial user message
);

CREATE INDEX IF NOT EXISTS idx_snapshots_session ON compaction_snapshots(session_id);

-- Reminders (prospective memory)
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  trigger_pattern TEXT NOT NULL,
  action TEXT NOT NULL,
  project TEXT,
  fire_count INTEGER DEFAULT 0,
  max_fires INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(active, project);

-- Reminders FTS for trigger matching
CREATE VIRTUAL TABLE IF NOT EXISTS reminders_fts USING fts5(
  trigger_pattern,
  content=reminders,
  content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS reminders_ai AFTER INSERT ON reminders BEGIN
  INSERT INTO reminders_fts(rowid, trigger_pattern)
  VALUES (new.rowid, new.trigger_pattern);
END;

CREATE TRIGGER IF NOT EXISTS reminders_ad AFTER DELETE ON reminders BEGIN
  INSERT INTO reminders_fts(reminders_fts, rowid, trigger_pattern)
  VALUES ('delete', old.rowid, old.trigger_pattern);
END;

CREATE TRIGGER IF NOT EXISTS reminders_au AFTER UPDATE ON reminders BEGIN
  INSERT INTO reminders_fts(reminders_fts, rowid, trigger_pattern)
  VALUES ('delete', old.rowid, old.trigger_pattern);
  INSERT INTO reminders_fts(rowid, trigger_pattern)
  VALUES (new.rowid, new.trigger_pattern);
END;
`;

// src/v2/hooks/shared/db.ts
function getProjectId(cwd) {
  const name = cwd.split("/").pop() ?? "unknown";
  const hash = createHash("sha256").update(cwd).digest("hex").slice(0, 8);
  return `${name}-${hash}`;
}
function openHookDb() {
  const dir = join(homedir(), ".engram", "v2");
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, "engram.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrateSchema(db);
  return db;
}
function migrateSchema(db) {
  const cols = db.pragma("table_info(compaction_snapshots)");
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("read_files")) {
    db.exec("ALTER TABLE compaction_snapshots ADD COLUMN read_files TEXT");
  }
  if (!colNames.has("initial_goal")) {
    db.exec("ALTER TABLE compaction_snapshots ADD COLUMN initial_goal TEXT");
  }
}
function getStatePath() {
  const dir = join(homedir(), HOOK.STATE_DIR);
  mkdirSync(dir, { recursive: true });
  return join(dir, HOOK.STATE_FILE_NAME);
}
var VALID_MODES = /* @__PURE__ */ new Set(["normal", "compact", "minimal", "critical"]);
var DEFAULT_STATE = { mode: "normal", freeUntilCompact: 100, usedPct: 0, updatedAt: "" };
function readStateFile() {
  try {
    const raw = readFileSync(getStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!VALID_MODES.has(parsed?.mode)) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}
var MAX_STDIN_BYTES = 1048576;
function readHookStdin() {
  let raw;
  try {
    raw = readFileSync("/dev/stdin", "utf8");
  } catch {
    raw = readFileSync(0, "utf8");
  }
  if (raw.length > MAX_STDIN_BYTES) return raw.slice(0, MAX_STDIN_BYTES);
  return raw;
}
function writeStateFile(state) {
  const path = getStatePath();
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, path);
}

export {
  SCHEMA,
  MEMORY_KINDS,
  CONFIDENCE,
  DECAY,
  DEDUP,
  RETRIEVAL,
  BRIEFING,
  CONTENT,
  PLANS,
  REMINDERS,
  CONTEXT_MODES,
  INTENT_PATTERNS,
  HOOK,
  CONTEXT_ADAPTIVE,
  MODE_LIMITS,
  LEARNING,
  ERROR_PATTERNS,
  NOISE_ERROR_PATTERNS,
  getProjectId,
  openHookDb,
  readStateFile,
  readHookStdin,
  writeStateFile
};
//# sourceMappingURL=chunk-2PJDMCJB.js.map