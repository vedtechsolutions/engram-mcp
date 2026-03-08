# Engram — Persistent Memory for Claude Code

> *An engram is a unit of cognitive information imprinted in neural tissue — the physical trace of a memory.*

## Why Engram?

Claude Code forgets everything when the context window compacts. Your decisions, your debugging breakthroughs, your "always use X instead of Y" — gone. You repeat the same mistakes, re-explain the same architecture, re-discover the same solutions.

**Engram fixes this.** After compaction, Claude continues working like it never happened — with your decisions, pitfalls, and project context intact.

## You Don't Need Memory MCP

If you're using [Memory MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) or similar knowledge-graph memory servers, Engram replaces them entirely:

| | Memory MCP | Engram |
|---|---|---|
| **Encoding** | Manual — Claude must decide to call `create_entities` | **Automatic** — hooks capture errors, corrections, decisions without tool calls |
| **Recall** | Manual — Claude must call `search_nodes` | **Automatic** — pitfalls injected before writes, corrections on session start |
| **After compaction** | Nothing — Claude doesn't know the memory server exists | **Full recovery** — briefing auto-injected with task, files, decisions, pitfalls |
| **Context cost** | Every tool call burns tokens | **Zero-token hooks** — hooks run outside the context window |
| **Learning** | Store and retrieve | **Encode, decay, and surface** — confidence scoring, relevance matching, natural forgetting |
| **Noise** | Grows forever, no curation | **Self-maintaining** — confidence decay, dedup, stale detection |
| **Error prevention** | None | **Pitfall surfacing** — warns before you repeat known mistakes |

### The Compaction Problem (and Why Hooks Solve It)

When Claude Code's context window fills up, it compacts — summarizing the conversation to free space. This destroys:
- What you were doing and why
- Decisions you made and their rationale
- Errors you hit and how you fixed them
- Files you were working on

**Tool-based memory servers can't help** because after compaction, Claude doesn't remember the server exists until something reminds it to call a tool. There's no automatic trigger.

**Engram's hooks fire automatically:**
- `SessionStart` hook injects a briefing with your active plan, recent pitfalls, and project context — Claude picks up exactly where it left off
- `PreCompact` hook saves a snapshot of what you were doing before compaction happens
- `UserPromptSubmit` hook surfaces relevant memories on every prompt — no tool call needed
- `PreToolUse` hook warns about known pitfalls before every Write/Edit/Bash

The result: **compaction becomes invisible.** Claude continues working with full context of your decisions, your mistakes, and your project's pitfalls.

### How Much Context Does Engram Use?

Engram's post-compaction injection is ~180 tokens — just task, domain, files, and critical decisions. Everything else is pulled on-demand per prompt. Compare this to the 2000+ tokens that narrative-style memory systems inject, displacing space you need for actual work.

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                   Claude Code                        │
│                                                      │
│  Hooks (automatic, zero-token):                      │
│    SessionStart  → inject briefing + pitfalls        │
│    PreCompact    → save snapshot before compaction    │
│    PreToolUse    → warn on known pitfalls             │
│    UserPrompt    → surface relevant memories          │
│    PostToolFail  → learn from errors automatically    │
│    PostToolUse   → boost pitfalls you avoided         │
│    SessionEnd    → close session, promote pitfalls    │
│                                                      │
│  MCP Tools (discretionary):                          │
│    engram_recall    → search memories                 │
│    engram_learn     → store a lesson                  │
│    engram_plan      → track multi-step tasks          │
│    engram_remind    → "when X, remind me Y"           │
│    + correct, forget, strengthen, weaken              │
│                                                      │
│  StatusLine:                                         │
│    Engram: normal | 42 mem 3 rem                     │
└────────────────────┬────────────────────────────────┘
                     │
              ┌──────┴──────┐
              │  SQLite DB  │
              │  + FTS5     │
              │  ~/.engram/ │
              └─────────────┘
```

## Quick Start

### 1. Clone and build

```bash
git clone https://github.com/vedtechsolutions/engram-mcp.git
cd engram-mcp
pnpm install
npx tsup
```

### 2. Configure MCP server

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "engram": {
      "command": "node",
      "args": ["/path/to/engram-mcp/dist/server.js"]
    }
  }
}
```

### 3. Configure hooks

Add to your project's `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/session-start.js" }]
    }],
    "PreCompact": [{
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/pre-compact.js" }]
    }],
    "SessionEnd": [{
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/session-end.js" }]
    }],
    "PostToolUseFailure": [{
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/error-learning.js" }]
    }],
    "PreToolUse": [{
      "matcher": "Write|Edit|Bash",
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/pitfall-check.js" }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/prompt-check.js" }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/success-tracker.js", "async": true }]
    }]
  },
  "statusLine": {
    "type": "command",
    "command": "NODE_PATH=/path/to/engram-mcp/node_modules node /path/to/engram-mcp/dist/hooks/statusline.js",
    "padding": 0
  }
}
```

### 4. Add LLM instructions

Create `.claude/rules/engram.md` in your project:

```markdown
## Engram Memory
Briefing auto-injected at session start. Act on it immediately.
- Before non-trivial work: `engram_recall(query)` for relevant pitfalls.
- User corrects you: `engram_learn(kind:"correction", content: one sentence, project: null)`.
- Something fails unexpectedly: `engram_learn(kind:"pitfall", content: what+why+fix)`.
- Design choice: `engram_plan(decide, chose, why)`.
- Memory wrong: `engram_weaken(id)`. Memory useful: `engram_strengthen(id)`.
- User says "always do X when Y": `engram_remind(trigger, action)`.
```

That's it. Engram starts learning from your first session.

## Tools (9)

| Tool | Description |
|---|---|
| `engram_recall` | Search memories by query, filtered by project/kind |
| `engram_learn` | Store a lesson (pitfall, decision, correction, fact) |
| `engram_correct` | Update or invalidate a wrong memory |
| `engram_forget` | Hard-delete a memory |
| `engram_strengthen` | Boost confidence of a useful memory |
| `engram_weaken` | Lower confidence of a wrong memory |
| `engram_plan` | Create/track multi-step plans with decisions |
| `engram_remind` | Set trigger-action reminders ("when X, do Y") |
| `engram_list_reminders` | List active reminders |

## Hooks (8)

| Hook | Event | What Happens |
|---|---|---|
| `session-start` | Session begin | Injects briefing: plan status, pitfalls, interrupted session recovery |
| `pre-compact` | Before compaction | Saves snapshot: files, commands, user context, approach notes |
| `session-end` | Session end | Closes session, promotes cross-project pitfalls to global |
| `error-learning` | Tool failure | Classifies error, encodes as pitfall, boosts on repeat |
| `pitfall-check` | Before Write/Edit/Bash | Surfaces relevant pitfalls for the file/command |
| `prompt-check` | User prompt | Detects corrections, surfaces relevant memories and reminders |
| `success-tracker` | After Write/Edit | Boosts pitfalls you successfully avoided |
| `statusline` | After response | Shows context mode, memory count, reminder count |

## Context-Adaptive Modes

Engram monitors context window pressure and adjusts automatically:

| Mode | Context Free | Behavior |
|---|---|---|
| `normal` | > 50% | Full recall, full plan output |
| `compact` | 25–50% | 3 results max, current step only |
| `minimal` | 10–25% | 2 results, no new learning |
| `critical` | < 10% | Silent — preserves remaining context |

## Memory Types

| Kind | Purpose | Example |
|---|---|---|
| `pitfall` | Known mistakes to avoid | "Never use `store=False` computed fields in search domains" |
| `decision` | Architectural choices | "Chose SQLite over Postgres for single-user local storage" |
| `correction` | User corrections | "No, always use strict equality in TypeScript" |
| `fact` | Knowledge and conventions | "In Odoo 19, use `<list>` not `<tree>` in views" |

## Self-Maintaining

Engram maintains itself automatically:

- **Confidence decay**: Memories not recalled in 30 days decay by 10%. Below 0.1 confidence, they're auto-deleted (corrections are exempt)
- **Deduplication**: New memories with >80% token overlap to existing ones are merged
- **Stale project detection**: Projects with no recall in 90 days are flagged
- **Plan archival**: Completed plans older than 6 months are cleaned up
- **FTS5 integrity**: Automatic index rebuild on corruption detection
- **Cross-project promotion**: Pitfalls recalled in 3+ sessions are promoted from project-scoped to global

## Security

- All SQL queries use parameterized statements
- FTS5 input sanitized with allowlist pattern (`[^a-zA-Z0-9\s]` → strip)
- File extension sanitization prevents LIKE injection
- Transcript path validation prevents path traversal
- 1MB stdin cap on all hook inputs
- State file mode validation
- Shell metacharacter stripping in error distillation
- Atomic confidence updates prevent race conditions

## Development

```bash
pnpm install         # Install dependencies
npx tsup             # Build (ESM, node20 target)
npx vitest run       # Run tests (249 tests across 15 files)
```

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 20+ / TypeScript (strict mode) |
| Storage | SQLite (better-sqlite3) + WAL mode |
| Search | FTS5 (built into SQLite) |
| Interface | MCP Server (@modelcontextprotocol/sdk) |
| Validation | Zod schemas |
| Build | tsup (ESM output) |
| Testing | Vitest |

## Status

**v2.0.0** — Ground-up rewrite. 24 source files, 249 tests, 9 tools, 8 hooks.

## License

MIT
