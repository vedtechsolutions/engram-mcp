# Engram MCP — Cognitive Memory for AI

> *An engram is a unit of cognitive information imprinted in neural tissue — the physical trace of a memory.*

Engram gives Claude Code **persistent, cross-session memory** that learns from experience. It runs locally as an MCP server + hook processor, automatically encoding errors, decisions, and discoveries — then surfacing them when relevant.

## What It Does

- **Remembers across sessions** — knowledge encoded in session 5 surfaces automatically in session 20
- **Learns from mistakes** — errors resolved in past sessions auto-surface their fix when the same error appears
- **Warns about antipatterns** — known bad patterns trigger warnings before you write code
- **Survives compaction** — after context window compression, Engram restores your full project understanding
- **Reduces context bloat** — deliberate offloading protocol keeps the context window lean
- **Self-maintaining** — automatic consolidation prunes noise, promotes valuable memories, optimizes storage

## Quick Install

```bash
# Install
npm install -g @vedtechsolutions/engram-mcp

# Configure Claude Code
npx @vedtechsolutions/engram-mcp setup
```

That's it. Start a new Claude Code session and Engram activates automatically.

## Manual Setup

If you prefer manual configuration, add to `~/.claude/settings.json`:

### MCP Server

```json
{
  "mcpServers": {
    "engram": {
      "command": "node",
      "args": ["/path/to/node_modules/engram-mcp/dist/index.js"],
      "env": {
        "ENGRAM_DB_PATH": "~/.engram/engram.db",
        "ENGRAM_LOG_LEVEL": "info",
        "ENGRAM_AUTO_CONSOLIDATE": "true"
      }
    }
  }
}
```

### Hooks

Add these hooks to enable automatic memory encoding:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "type": "command",
      "command": "node /path/to/node_modules/engram-mcp/dist/hook.js user-prompt-submit",
      "input": "stdin"
    }],
    "PreToolUse": [{
      "type": "command",
      "command": "node /path/to/node_modules/engram-mcp/dist/hook.js pre-tool-use"
    }],
    "PostToolUse": [{
      "type": "command",
      "command": "node /path/to/node_modules/engram-mcp/dist/hook.js post-tool-use"
    }],
    "SessionStart": [{
      "type": "command",
      "command": "node /path/to/node_modules/engram-mcp/dist/hook.js session-start",
      "input": "stdin"
    }],
    "SessionEnd": [{
      "type": "command",
      "command": "node /path/to/node_modules/engram-mcp/dist/hook.js session-end",
      "input": "stdin"
    }]
  }
}
```

See the setup script output for the complete hook list.

## How It Works

### Automatic Encoding

Engram hooks into Claude Code events and automatically captures:

| Event | What's Captured |
|---|---|
| Bash errors | Error fingerprint + context → graduates to antipattern after recurring |
| Bash success after errors | Error resolution → links to original error via `caused_by` |
| Approach pivots | Why approach X failed, what replaced it → `contradicts` connection |
| Subagent completions | Discoveries, conclusions, lessons extracted from agent output |
| Write operations | File tracking, architecture graph updates |
| Session end | Session summary, Hebbian learning (co-recalled memories strengthen) |

### Intelligent Recall

On every prompt, Engram injects relevant memories:

- **`[ENGRAM CONTEXT]`** — relevant knowledge and past experiences
- **`[ENGRAM CAUTION]`** — warnings from past mistakes (cross-session)
- **`[ENGRAM SURFACE]`** — top domain memories for ambient awareness
- **`[ENGRAM REMINDER]`** — trigger-based prospective memories

Recall uses dual-path search:
1. **FTS5 keyword matching** — exact and stemmed keywords
2. **TF-IDF cosine similarity** — meaning-based matching (512-dim vectors, zero external APIs)

### Cross-Session Error Resolution

```
Session 1: ParseError in views.xml
  → Encoded as error memory

Session 3: Fixed by replacing <tree> with <list>
  → Resolution linked via caused_by connection

Session 8: Same ParseError in different file
  → [ENGRAM CAUTION] Similar past error resolved: Use <list> not <tree>
```

### Context Management

Engram actively manages context window pressure:

| Context % | Behavior |
|---|---|
| > 55% | Full recall and injection |
| 35-55% | Reduced injection, essentials prioritized |
| < 50% | Offload message: "your state is encoded, safe to focus" |
| < 40% | Summary mode: truncated content + recall pointers |
| < 20% | Essential antipatterns only |

## Tools

These tools are available in Claude Code after setup:

| Tool | Usage |
|---|---|
| `engram_recall` | Search memory: `engram_recall("how to fix ParseError")` |
| `engram_encode` | Store knowledge: `engram_encode("In Odoo 18, use list not tree", type: "semantic")` |
| `engram_learn` | Record experience: `engram_learn(action, outcome, lesson)` |
| `engram_strengthen` | Reinforce useful memory |
| `engram_weaken` | Correct wrong memory |
| `engram_immune_check` | Check code against known antipatterns |
| `engram_stats` | Memory health and statistics |
| `engram_remind` | Create trigger-based reminder ("when X happens, do Y") |
| `engram_vaccinate` | Pre-register an antipattern |
| `engram_cleanup` | Remove noise from database (dry-run by default) |
| `engram_consolidate` | Trigger memory optimization cycle |
| `engram_self` | View/update persistent self-model |
| `engram_set_goal` | Set learning goals |
| `engram_list_goals` | Track learning progress |
| `engram_list_reminders` | List active reminders |
| `engram_experience` | Get version-specific knowledge |

## Architecture

```
Layer 6: Primary Memory Protocol    (Offloading, bridge file, cross-session learning)
Layer 5: Experience Versioning      (Framework knowledge inheritance)
Layer 4: Consolidation Engine       (9-phase: replay, prune, promote, transfer, dream)
Layer 3: Cortical Storage           (Semantic, Episodic, Procedural, Immune + TF-IDF)
Layer 2: Hippocampal Bridge         (Significance detection + encoding)
Layer 1: Sensory Buffer             (Context window / working memory)
```

31 cognitive engines. 14 hook handlers. 16 MCP tools. All running locally.

## Data & Privacy

- **100% local** — all data stays on your machine in `~/.engram/engram.db`
- **No external APIs** — embeddings computed locally via TF-IDF (no OpenAI, no cloud)
- **Your memories are yours** — each installation starts with a fresh database
- **No telemetry** — zero network calls, zero tracking

## Requirements

- Node.js 20+
- Claude Code CLI

## License

Business Source License 1.1 — free for personal and non-commercial use. Converts to Apache 2.0 on 2029-03-05. See [LICENSE](LICENSE) for details.

For commercial licensing: [Contact us](https://github.com/vedtechsolutions/engram-mcp/issues)

---

Built by [VedTech Solutions](https://github.com/vedtechsolutions)
