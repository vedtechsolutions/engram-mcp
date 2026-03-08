# Engram Changelog

All notable changes to the Engram cognitive memory system.

---

## [2.1.0] — 2026-03-08 — Mode-Aware Hook Scaling & Richer Snapshots

### Signal-to-Noise Improvements
- **Mode-aware hook scaling** — hooks now read context mode from state file and scale injection volume:
  - `normal`: full injection (3 prompt pitfalls, 2 file pitfalls, 1 bash pitfall, 3 reminders)
  - `compact`: reduced injection (1 prompt pitfall, 1 file pitfall, 0 bash pitfalls, 1 reminder)
  - `minimal`/`critical`: **zero injection** — complete silence when context is tight
- **~520 → ~200 max tokens in compact mode**, zero in minimal/critical
- Corrections are always encoded regardless of mode (high value, low noise)

### Richer Compaction Snapshots
- `user_context` now stores **array of last 3 user messages** (was: single concatenated string truncated to 200 chars)
- `approach_notes` now stores **array of last 5 assistant texts** (was: single string truncated to 150 chars)
- Briefing recovery section now shows last 2 user messages and latest approach note
- Backward compatible: old plain-string snapshots gracefully fall back to empty arrays

### Constants
- Added `MODE_LIMITS` constant mapping each context mode to per-hook injection limits
- `prompt-check` and `pitfall-check` accept optional `mode` parameter (testable, CLI reads from state file)

### Tests
- **263 tests** across 15 files (up from 249)
- 14 new tests for mode-aware scaling in prompt-check and pitfall-check
- Updated transcript and briefing tests for array-based snapshots

---

## [2.0.0] — 2026-03-08 — Ground-Up Rewrite

### Breaking Changes
- **Complete v1 removal** — all 31 engines, 16 tools, 14 hook handlers, 91 test files, and v1 scripts deleted
- **New MCP server** — `dist/server.js` replaces `dist/index.js` (9 tools, down from 16)
- **New hook system** — 8 independent hook scripts replace the monolithic `dist/hook.js`
- **New database** — `~/.engram/v2/engram.db` (separate from v1's `~/.engram/engram.db`)
- **Removed tools**: `engram_encode`, `engram_experience`, `engram_immune_check`, `engram_set_goal`, `engram_list_goals`, `engram_self`, `engram_vaccinate`, `engram_stats`, `engram_consolidate`, `engram_cleanup`
- **Removed resources**: `engram://context`, `engram://antipatterns`, `engram://version`

### Architecture
- **24 source files** (down from 47+), **249 tests** across 15 files (down from 2393 across 106)
- **9 MCP tools**: recall, learn, correct, forget, strengthen, weaken, plan, remind, list_reminders
- **8 hook scripts**: session-start, pre-compact, session-end, error-learning, pitfall-check, prompt-check, success-tracker, statusline
- **4 memory kinds**: pitfall, decision, correction, fact (down from 4 types + subtypes)
- **Zero-token hooks** — all automatic injection runs outside the context window
- **~180 token post-compaction injection** (down from ~2000+ tokens in v1)
- **Context-adaptive modes**: normal/compact/minimal/critical based on context window pressure

### New Features
- **Plan tracking** — `engram_plan` with steps, decisions, notes, dependencies
- **Prospective memory** — `engram_remind` / `engram_list_reminders` with FTS5-based trigger matching
- **Cross-project pitfall promotion** — project-scoped pitfalls promoted to global after 3+ session recalls
- **Confidence decay** — 0.9x per 30 days without recall, auto-delete below 0.1 (corrections exempt)
- **Success tracking** — confidence boost on pitfalls you successfully avoided
- **Interrupted session detection** — briefing flags `[interrupted]` with last plan step
- **Compaction snapshots** — pre-compact hook saves files, commands, context, approach notes
- **StatusLine** — shows context mode, memory count, reminder count
- **Migration script** — `scripts/migrate-v1-to-v2.ts` converts v1 memories and reminders

### Security Hardening
- Standardized FTS5 sanitization to allowlist pattern (`[^a-zA-Z0-9\s]`) across all 7 locations
- File extension sanitization in LIKE patterns (pitfall-check, success-tracker)
- Transcript path traversal guard (only `~/.claude/` and `/tmp/`)
- 1MB stdin cap on all hook inputs via `readHookStdin()`
- Negative `max_results` guard (SQLite `LIMIT -1` = unlimited)
- Length limit on `engram_correct` `new_content` (max 2000 chars)
- Trigger length limit on reminders (max 200 chars)
- Notes array cap (max 20 per plan step)
- Shell metacharacter stripping in error distillation
- Auto-correction confidence lowered from 0.8 to 0.5
- State file mode validation (only accept known modes)
- Atomic confidence boost (MIN SQL) prevents race conditions

### Design Philosophy (Cairn-Informed)
- **Encode conclusions, not experiences** — "X failed because Y, fix Z"
- **Inject minimum, retrieve on demand** — briefing < 300 tokens
- **Hooks for critical path, tools for discretionary** — automatic > manual
- **Decay is a feature** — unretrieved memories should fade
- **Better encoding beats better retrieval** — store the right things, naive retrieval works

---

> **Note:** v1.x changelog preserved below for historical reference. All v1 code has been removed.


## [1.0.33] — 2026-03-07 — Injection Noise Reduction: Quality Over Quantity

### Suppressed Noise Generators (15 outputs removed)
- **Removed** `[ENGRAM NUDGE]` context pressure warnings — adds anxiety without value
- **Removed** `[ENGRAM OFFLOAD]` context offload messages — same
- **Removed** `[Engram] Context: X% | Injection: Y | Phase: Z` status line — same
- **Removed** `[ENGRAM DISTILL]` memory maintenance prompts — interrupts workflow
- **Removed** `[ENGRAM GAP]` "No prior knowledge" warnings — obvious and unhelpful
- **Removed** `[ENGRAM CONFIDENCE: LOW]` warnings — same
- **Removed** `[ENGRAM SCAFFOLD]` mastery level labels — condescending noise
- **Removed** `[ENGRAM ANALOGY]` cross-domain analogies — rarely actionable
- **Removed** `[ENGRAM PATTERN]` schema metadata (name, instance count) — noise
- **Removed** `[ENGRAM TEACH]` teaching hints — "explanation request detected" is noise
- **Removed** `[ENGRAM ARCH]` low-risk architecture impact — only inject when risk is high
- **Removed** `[ENGRAM LEARNING PATH]` auto-generated paths — not actionable during work
- **Removed** ZPD mastery level injection — noise
- All internal tracking continues silently — only the output injection is suppressed

### Prompt Relevance Gating (universal principle)
- **Memory Surface (step 2.5)**: Only surfaces memories with keyword overlap to current prompt; antipatterns bypass (always relevant in-domain)
- **Contextual Recall (step 3a)**: Non-critical memories require keyword overlap; somatic markers and failure warnings bypass
- **Proactive Recall (step 3z)**: Proven/decision memories require keyword overlap
- **Code Context Recall (pre-write)**: Patterns, conventions, and procedural memories require keyword overlap with the code being written — prevents generic memories (e.g., "git workflow") from firing on every edit
- **Schema Intuitions (step 3b)**: Only strong intuitions with actionable hints AND keyword overlap pass
- **Insights (3c) + Procedural (3d)**: Now require keyword overlap in HIGH mode
- New constants: `MEMORY_SURFACE.MIN_PROMPT_RELEVANCE` (0.08), `PROACTIVE_RECALL.MIN_PROMPT_RELEVANCE` (0.06)

### Mental Model Throttling
- Mental model now only injected on first prompt, domain change, or after 15-turn cooldown — not every prompt
- New constant: `MEMORY_SURFACE.MODEL_INJECTION_COOLDOWN` (15 turns)

### Pre-Write File-Type Filtering
- Antipattern warnings now filtered by file extension: Python/ORM antipatterns skip when editing XML/HTML/CSS files, and vice versa
- Prevents "stock.move warnings during view audits" and "POS camelCase warnings while editing backup code"

### Injection Caps
- Maximum 3 contextual memories per prompt (was unbounded) — surfaces only the most relevant
- Maximum 1 decision injection per prompt (was unbounded) — multi-line, expensive
- Chain injection cooldown increased to 8 turns (was 5) and capped at 1 per prompt
- Contradictions still surface (they indicate real conflicts to resolve)

### MEMORY.md Mental Model Cleanup
- Mental model markdown now concise: domain + memory count + confidence + pitfalls only
- Removed noisy "Patterns" section (schema metadata like "Recurring pattern involving cognitive, engine, fixed, organic")
- Removed "Trajectory" section ("Evolved from spreading, activation, works to pushed, encoding" is noise)
- Stripped leaked user prompts from "Understanding" field (Know:/Recent:/Learned:/Track: suffixes)
- Principles limited to those with evidence > 1 (max 2)
- Pitfalls limited to 3, truncated to 150 chars

### Watcher Threshold Tuning
- Gentle nudge increased from 3 to 6 turns (was firing too early)
- Strong nudge increased from 6 to 12 turns
- Urgent nudge increased from 10 to 20 turns
- CLAUDE.md already prompts engram tool usage — watcher doesn't need to nag

### Tests
- 19 new tests: 4 relevance gating, 4 file-type filtering, 5 noise-vs-signal cases, 3 threshold sanity, 3 watcher thresholds
- 90 test files, 1909 tests passing

## [1.0.32] — 2026-03-07 — Architectural Recovery: Milestones, Decisions, Specificity

### Completed Milestones (Gap B)
- New `completed_milestones` field in WatcherState and ContinuationBrief
- Auto-detects milestones from: git commit messages, npm publish/version output, significant test passes (50+ tests)
- Post-compact injection shows "Completed:" section before decisions — what was accomplished is first-class context

### Implicit Decision Capture (Gap A)
- Decisions now include implicit sources: commit messages as "Applied: ..." decisions, user strategy prompts ("let's fix X first") as "Strategy: ..." decisions
- Explicit decision memories still take priority; implicit ones fill in when explicit < 3

### Specific Next Steps (Gap C)
- Next steps now follow strict priority order: planned_next_step > user's unfinished instruction > specific error content > hypothesis > discovery > search intent > generic fallback
- Error-based next steps now include the actual error message, not just "Fix: [truncated blob]"
- User prompts that look like instructions are carried forward as "Complete: ..." next steps

### Lesson Quality Scoring (Gap D)
- Lessons in bridge now scored by principle quality: +0.3 for principle language (because/when/always/never/instead), -0.4 for pure code-change descriptions
- `isPrincipleLevel()` detects lessons expressing generalizable rules
- `isDescriptiveOnly()` detects lessons that just describe what code was modified
- Lessons sorted by quality score, ensuring principle-level insights rank above descriptive summaries

### Pre-Compact Lesson Distillation (Gap 5)
- `distillPreCompactLesson()` replaces the garbage lesson "Working on X. N files modified." with actual content
- Lesson now includes: milestones accomplished, discoveries made, approach being used, failures encountered, active blockers
- Falls back to minimal format only when zero data exists — previously always produced filler

### Session Outcome Enrichment (Gap 6)
- **Approach pivots** now tracked as session outcomes: `Pivoted from "broad regex" to "targeted patterns"`
- **Discoveries** tracked as session outcomes: `Discovered: containsError strips real error classes`
- **Resolutions** tracked as session outcomes: `Resolved: Used targeted patterns instead`
- These feed the continuation brief and pre-compact lesson — reasoning chain reconstructable from outcomes

### Reasoning Trail Enhancement
- Session handoff reasoning trail now includes milestones as breadcrumbs
- Transcript mining runs when chain data is sparse (fallback reasoning extraction)

### Tests
- 20 new tests for milestones, decisions, next steps, lesson quality, pre-compact distillation, outcome enrichment (71 total in continuation-brief.test.ts)
- 1884 tests across 89 files, all passing

## [1.0.31] — 2026-03-07 — 31 Gap Fixes: Complete Post-Compact Recovery Pipeline

### Antipattern Display (v1.0.31)
- **GAP 31**: Antipattern fix hints deduplicated via word-overlap detection (50% threshold). Prevents "warning text → fix text" duplication when both contain the same content rephrased.

### Bridge Content Quality (v1.0.29)
- **GAP 21**: Subagent delegation prompts filtered from Active Decisions (7 delegation patterns)
- **GAP 22**: Ternary operator fragments (`? (cog.`) detected as code in sanitizeCognitiveState
- **GAP 23**: Noise lessons filtered — raw regex, code fragments, truncated text, CONSTANT_NAME: patterns
- **GAP 24**: Synthesis deduplication — stored synthesis memories excluded when live synthesis is generated
- **GAP 25**: Permission prompts ("Claude needs your permission") filtered from bridge insights
- **GAP 26**: `containsError()` handles camelCase identifiers (containsError, handleError), JSON stdout wrappers, and GAP commit messages. Bridge filters git log/show/diff from recent_errors
- **GAP 27**: Directory detection extended to all depths (was only ≤3 path components)

### Understanding Narrative Quality (v1.0.30)
- **GAP 28**: `planned_next_step` with raw system tags (`<task-notification>`) filtered via `isGarbledField()`
- **GAP 29**: Garbled decision fragments ("Chose . handleSessionStart()") detected and filtered
- **GAP 30**: Debug metadata in active chains ("debug: 1 lines. {json}") filtered
- New `isGarbledField()` function in compaction.ts validates all cognitive context fields before narrative assembly

### Test Coverage
- 51 tests in continuation-brief.test.ts (was 38, +13 for GAPs 21-30)
- 1864 total tests across 89 files

## [1.0.28] — 2026-03-07 — Post-Compact Recovery: 20 Gap Fixes + Full Data Quality

### Phase Detection & Task Inference (v1.0.23)
- **GAP 9**: Edit/Write tools now push to recent_tool_names and call updateCognitiveState
- **GAP 14**: Phase detection tracks all tool types (was only Read/Grep/Glob/Agent)
- Task inference 3-level priority: user prompts > approach first sentence > file-based fallback
- Expanded task verb regex: 18 new verbs (close, merge, release, etc.)

### Data Quality (v1.0.25)
- **GAP 11**: Code fragment detection in cognitive fields (&&, ||, const, if, property chains)
- **GAP 12**: Markdown/summary artifact detection (**bold**, bullet lists, numbered lists)
- **GAP 13**: Truncated paths and directories filtered from session_files
- **GAP 15**: Agent-style verbose prompts cleared from active_task (7 patterns)
- **GAP 16**: Compaction summaries excluded from task/prompt/approach capture
- **GAP 17**: Auto session outcomes from test/build/git pass/fail (tried_failed now populated)
- **GAP 18**: Sanitize prevState in handleSessionStart before injection
- **GAP 19**: Sanitize state in handlePreCompact before building recovery context

### Error Detection (v1.0.28)
- **GAP 20**: `containsError()` false positive filtering — npm warnings like "auto-corrected some errors" no longer flag successful commands as failures

### End-to-End Validation (v1.0.27)
- 3 integration tests simulating full sanitization pipeline with real corrupted data
- Verified: fully corrupted state → clean output, clean state → preserved, all corruption types simultaneously

### Test Coverage
- 38 tests in continuation-brief.test.ts covering all gap patterns
- 1851 total tests across 89 files

## [1.0.21] — 2026-03-07 — Post-Compact Recovery: 10 Gap Fixes + Security Hardening

### Security Hardening (v1.0.20)
- **CRIT-1**: `validateTranscriptPath()` prevents path traversal on transcript reads
- **CRIT-2**: 10MB stdin cap in `readStdin()` prevents memory exhaustion
- **HIGH-1**: `CLAUDE_MEMORY_DIR` validation in curator.ts (no null bytes, no traversal)
- **HIGH-2**: `validateCwd()` with null byte + length guard
- **HIGH-3**: Remove all 4 `notification-debug.log` file writes
- **MED-1**: 64KB cap on session handoff file size
- **MED-3**: `validateSessionId()` with alphanumeric regex
- **LOW-2**: Publish script input validation for version argument

### Post-Compact Recovery Gaps Fixed (v1.0.21)
- **GAP 1**: Conversational remarks no longer become active_task (pattern filter)
- **GAP 2**: Truncated discovery fragments cleared (< 40 chars starting with "that")
- **GAP 4**: Subagent reports/audits no longer recorded as errors
- **GAP 5**: session_files validated — rejects bare names, version numbers, traversal paths
- **GAP 6**: key_files strips " → content" suffix from Edit targets
- **GAP 7**: Decisions filter out subagent delegations
- **GAP 8**: handlePostCompact rebuilds continuation brief fresh with sanitized state
- **GAP 10**: Multi-word template patterns caught by regex ("X. Hypothesis: Y. Discovery: Z")

### Improvements
- Expanded task verb recognition (18 new verbs: enable, disable, audit, analyze, etc.)
- Last-resort task inference from recent_prompts when no edit files exist
- 1831 tests across 89 files (7 new continuation-brief tests)

---

## [1.0.16] — 2026-03-06 — Continuation Gap Closed (Ralph Loop)

7 iterations fixing post-compact and cross-session continuation quality.

### Bug Fixes
- **XML system tag filtering** — `<task-notification>`, `<system-reminder>` tags no longer leak into cognitive state, prompt tracking, or active_task
- **Cross-project memory bleed** — project isolation filter added to contextual recall injection (step 3a), was only in proactive recall (3z)

### New Features
- **User prompt tracking** — last 8 user prompts tracked, included in ContinuationBrief as `user_requests`, injected post-compact as "User asked:"
- **Edit content hints** — `summarizeToolInput` for Edit captures `file_path → first_new_line`, handlePostWrite includes content hint in actions
- **Session handoff uses ContinuationBrief** — task, decisions, next steps, key files from enriched brief
- **Aggressive task/approach extraction** — user prompts override stale approaches, short focused messages become active_task

### Improvements
- **Placeholder cleanup at save time** — `sanitizeCognitiveState()` runs on every `saveWatcherState()`, pre-compact snapshots never contain X/Y/Z garbage
- **Task-targeted post-compact recall** — uses continuation brief's task + key files, not vague cognitive fields
- **Session-narrative/milestone noise filtered** — from both contextual (3a) and proactive (3z) recall
- **Enriched ContinuationBrief** — full paths, bash context, discovery-driven next steps, hypothesis tracking, unfinished from next_steps

---

## [1.0.13] — 2026-03-06 — Continuation Gap Closed

### New Features
- **User prompt tracking** — last 8 user prompts tracked in WatcherState, included in ContinuationBrief as `user_requests`, injected in post-compact as "User asked:"
- **Edit content hints** — `summarizeToolInput` for Edit now captures `file_path → first_new_line`, so continuation shows exactly what was changed
- **Session handoff uses ContinuationBrief** — task, decisions, next steps, and key files now come from the enriched brief instead of raw cognitive fields

### Improvements
- **handlePostWrite richer actions** — captures file path + first line of new content in `recent_actions` instead of bare file path
- **Handoff unfinished** — populated from `brief.next_steps` when narrative unfinished is empty
- **Handoff key_files** — uses `brief.key_files` (full paths) instead of truncated session_files

---

## [1.0.12] — 2026-03-06 — User Prompt + Content Tracking

Internal release folded into 1.0.13.

---

## [1.0.11] — 2026-03-06 — Post-Compact Continuation Fix

### Bug Fixes
- **Placeholder cleanup at save time** — `sanitizeCognitiveState()` now runs on every `saveWatcherState()` call, ensuring pre-compact snapshots never contain "Approach: X", "Hypothesis: Y", "Discovery: Z" garbage values. Previously cleaned only at read/injection time, which was too late.
- **Task inference from work activity** — when no explicit task is set, `active_task` is now auto-inferred from recent Edit/Write targets in `sanitizeCognitiveState()`.
- **Session-narrative/milestone noise in recall** — filtered from both `[ENGRAM CONTEXT]` (step 3a) and `[ENGRAM PROACTIVE]` (step 3z) so old session summaries don't surface as actionable knowledge.

### Improvements
- **Enriched ContinuationBrief** — full file paths for Edit/Write actions, bash command summaries for workflow context, discovery-driven next steps, hypothesis tracking, and "continue editing X" inferences.
- **Task-targeted post-compact recall** — uses the continuation brief's concrete task + key file names as the query, not vague cognitive context fields. Falls back to high-value topics only when nothing concrete exists.
- **Pre-compaction prefix filter** — cognitive state values starting with "Pre-compaction" are cleared (regurgitated template strings).

### Tests
- 11 new tests in `tests/continuation-brief.test.ts` (sanitization patterns, brief structure, phase detection)
- 89 test files, 1824 tests total

---

## [1.0.10] — 2026-03-06 — Version Alignment

### Housekeeping
- **Consistent versioning** — README, CHANGELOG, and package.json now all use the same 1.0.x version scheme
- Test count updated: 1813 tests across 88 files

---

## [1.0.9] — 2026-03-06 — Session Narrative Fix

### Bug Fix
- **Tag mismatch** — session-narrative memories were created with hyphen (`session-narrative`) but filtered with underscore (`session_narrative`), causing narratives to leak into recall and never match session filters. Fixed all filter locations to use consistent hyphenated tag.

---

## [1.0.8] — 2026-03-06 — Live Injection Fixes

### Bug Fixes
- **Stale task inference** — `active_task` now auto-inferred from recent Edit/Write actions when no explicit task is set, instead of staying stuck on old values
- **Placeholder cognitive state** — cleaned up literal `"X"`, `"Y"`, `"Z"` values and file-path hypotheses that leaked from compaction template strings into CognitiveState
- **Stuck antipattern** — added staleness penalty in `contextualBoost()` for memories with high access count but low reinforcement ratio (`STALE_ACCESS_THRESHOLD: 15`, `STALE_RATIO_THRESHOLD: 8.0`)
- **Wrong phase detection** — debugging phase now requires both recent errors AND recent Bash activity, not just stale errors in buffer

---

## [1.0.7] — 2026-03-06 — Actionable Post-Compact Recovery

### New Features
- **ContinuationBrief** — structured post-compact recovery replacing vague cognitive state with specific task, last actions, next steps, decisions, tried-and-failed, key files, and blockers
- **`recent_actions` tracking** — WatcherState buffer of `{tool, target, time}` from Edit/Bash/Write calls, used for task inference and continuation
- **Surface-context dedup** — `surfacedIds` Set prevents same memory appearing in both `[ENGRAM SURFACE]` and `[ENGRAM CONTEXT]` sections

### Improvements
- **Session narrative quality** — `extractGoal()` skips vague comma-separated keyword lists, prefers file-based descriptions
- **`buildContinuationBrief()`** — infers next steps from cognitive state and recent tool patterns, serializes decisions from decision_memory_ids

---

## [1.0.6] — 2026-03-06 — Procedural Auto-Encoding

### New Features
- **Procedural workflow detection** — automatically encodes recurring bash command sequences (build, test, deploy, git, docker, lint, db, install) as procedural memories
- **8 workflow categories** with pattern matching: `build`, `test`, `deploy`, `install`, `lint`, `db`, `docker`, `git`
- **`recent_commands` tracking** in WatcherState (last 20 commands)
- **Per-session limits** — max 5 procedural encodings per session with 2-minute cooldown

### Constants
- `PROCEDURAL_WORKFLOW` block: `MIN_COMMANDS: 3`, `MAX_PER_SESSION: 5`, `MIN_CONFIDENCE: 0.65`

### Tests
- 11 new tests in `tests/procedural-workflow.test.ts`

---

## [1.0.5] — 2026-03-06 — Module-Scoped Pre-Write & Signal Quality

### Improvements
- **Module-scoped pre-write recall** — code context recall filtered by file's framework/module, so Odoo patterns don't inject when editing TypeScript
- **Signal quality fixes** — proficiency tracking, narrative rotation, surface item diversity, recall noise reduction
- **Post-compact cognitive injection** — cognitive state injected as first-class "you were here" block after compaction

---

## [0.2.1] — 2026-03-05 — Quality & Isolation

Post-v0.2.0 improvements targeting injection noise, mastery accuracy, schema detection, and multi-project isolation. All 1794 tests passing.

### Issue 1: Injection Noise (HIGH)
- **Removed "User intent:" encoding** — user prompts already captured in cognitive state; encoding as semantic memories polluted every subsequent recall
- **Cross-type noise filter** — `isRecallNoise()` extended with 4 new patterns (`User intent:`, `User instruction:`, `Session progress:`, `Reasoning insight:`) that apply to ALL memory types, not just episodic
- **Gap F hardened** — semantic similarity check now filters search results through `isRecallNoise()` before matching
- **Cleanup widened** — `runCleanup()` now scans semantic memories (was episodic-only), with 2 new categories: `user_intent_noise`, `session_progress_noise`

### Issue 2: Mastery Tracking (HIGH)
- **Negative outcomes wired** — `recordDomainOutcome('negative')` + `recordDomainMasteryOutcome('negative', 'bash_error')` on bash errors in `handlePostBash`
- **Initial proficiency lowered** — 0.5 → 0.3 so new domains start as clearly "novice" and must earn their way up

### Issue 3: Schema Detection (MEDIUM)
- **Stemmed keyword matching** — `findCommonKeywords()` now uses `porterStem()` so "fix"/"fixed"/"fixing" merge into one keyword
- **Common keyword threshold lowered** — `COMMON_KEYWORD_THRESHOLD` 0.4 → 0.3 (keyword in 30% of cluster suffices)

### Issue 4: Multi-Project Isolation (MEDIUM)
- **Semantic project filtering** — injection filter extended from episodic-only to also skip domain-specific semantic memories from different projects
- **Domain mismatch penalty increased** — `DOMAIN_MISMATCH_PENALTY` 0.7 → 0.5 (50% reduction for wrong-domain memories, was 30%)

---

## [0.2.0] — 2026-03-05 — Primary Memory

Engram transitions from supplementary memory tool to **primary memory system**. Five-step implementation plan completed, validated with 1794 tests across 87 files.

### Step 1: Recall Quality
- **Unified noise filter**: `isRecallNoise()` in `src/engines/retrieval.ts` — 14 patterns (investigation breadcrumbs, command output logs, delegation pseudo-memories, system artifacts, subagent boilerplate, error resolution breadcrumbs)
- **8 filter locations**: session-start, memory surface, contextual recall, proactive recall, miss tracking, recovery, lightweight recovery, MCP `engram_recall` handler
- **Cleanup engine extended**: 3 new categories (`delegation_log`, `engram_understanding_dump`, `session_summary_noise`) in `src/engines/cleanup.ts`
- **Encoding quality gates**: Minimum substance length raised to 120 chars, noise patterns blocked at encode time in `encodeReasoningTrace()`, `encodeDiscovery()`, `handleSubagentStop()`
- **Bridge insight quality**: Minimum confidence 0.6, type-prioritized sorting (semantic > episodic with lessons > antipatterns)

### Step 2: Single Source of Truth
- **Bridge file restructured**: `engram-context.md` transformed from flat dump to living knowledge document with 6 sections:
  1. **What You're Working On** — task, approach, phase, hypothesis, discovery, files, errors
  2. **Watch Out For** — antipattern warnings with severity and fix
  3. **What You Know** — architecture + codemap + synthesis + insights
  4. **Active Decisions** — chosen approach with rationale
  5. **Key Lessons** — validated episodic lessons
  6. **Memory** — stats and tool hints
- **`makeBridgeOptions()` helper**: Extracts `BridgeOptions` from `WatcherState` including cognitive state, recent files, recent errors
- **Bridge refreshes**: On session-start, every N turns, on errors, on post-compact (not just session-start)
- **New `BridgeContent` fields**: `cognitive`, `active_decisions`, `lessons`, `context.recent_files`

### Step 3: Deliberate Offloading
- **Offload message**: At 50% context remaining, injects `[ENGRAM OFFLOAD]` telling Claude its state is encoded and safe to release
- **Encode-and-confirm loop**: `handleEncode` and `handleLearn` responses include confirmation with recall hint
- **Proactive nudges**: At 25-60% context, `[ENGRAM NUDGE]` lists unrecorded decisions and unencoded approaches
- **Summary injection mode**: At ≤40% context, contextual recall uses truncated content + recall pointer instead of full text
- **WatcherState fields**: `offload_message_sent`, `summary_injection_mode`

### Step 4: Cross-Session Learning
- **Resolution tracking**: `linkResolutionToErrors()` in `src/hook.ts` — when errors are resolved, searches for matching past error memories and creates `caused_by` connections. Backfills missing lessons on error memories
- **`findResolutionForError()`**: New function in `src/storage/repository.ts` — follows `caused_by` connections bidirectionally to find resolution memories
- **Cross-session error matching**: Enhanced Gap F semantic check in `handlePostBash` — follows `caused_by` connections to surface resolutions in `[ENGRAM CAUTION]` warnings
- **Recall enrichment**: `handleRecall` in `src/tools/handlers.ts` now shows resolutions for negative-outcome memories and surfaces `contradicts` connections as alternatives
- **Time window expanded**: `CAUSED_BY_MAX_AGE_DIFF_HOURS` 2→168 (7 days) to allow cross-session causal inference

### Step 5: Validation & Hardening
- **Recall quality tests**: Noise patterns verified (14 patterns caught, valuable content preserved, non-episodic never filtered, tag-based exemptions work)
- **Recall ranking tests**: Relevant memories rank higher than noise after filtering
- **Bridge completeness tests**: All 6 sections present with full content, minimal-data resilience verified
- **Offload threshold tests**: Trigger points validated (50% offload, 40% summary, 25-60% nudge zone, progressive throttling)
- **Cross-session E2E tests**: Full cycle verified (error → caused_by → resolution → recall surfaces fix), approach failure tracking via contradicts connections
- **Test suite**: 87 files, 1794 tests, all passing

### Stats
- 31 engine files in `src/engines/`
- 16 MCP tools, 3 MCP resources
- 14 hook handlers in `src/hook.ts`
- 87 test files, 1794 tests

---

## [0.1.x] — Brain Implementation (Phase 7: Cognitive Architecture)

### 2026-03-05 — Phase 3: Active Context Management
- Dynamic injection throttling based on context pressure (55%→medium, 35%→low, 20%→essential-only)
- Confidence gating constants (LOW_CONFIDENCE_THRESHOLD, GAP_MEMORY_THRESHOLD, MAX_CONTRADICTIONS)
- Phase-aware injection boost matching cognitive phase to memory types
- Recall miss tracking for blind spot detection
- Periodic context status line (`[Engram] Context: X% remaining`)
- 22 tests in `tests/active-context.test.ts`

### 2026-03-04 — Distributed Memory (4 Steps)
- Embedding-based connection densification via TF-IDF cosine similarity
- Connection type diversification (`caused_by`, `supersedes`, `contradicts`)
- Hebbian learning (co-recalled memories strengthen connections)
- Activation-driven injection priority
- 18 tests across consolidation, hebbian, activation-profile

### 2026-03-03 — Signal-to-Noise + Organic Learning + Cleanup
- Subagent boilerplate filter (5 regex patterns, 120-char min substance)
- Dedup on auto-encoding (findDuplicate before all createMemory paths)
- Open questions filter (exclude subagent + require question-like patterns)
- Schema detection quality filter
- Mastery updates from auto-encoding
- Retroactive cleanup engine (7 categories, 54% noise removed)
- Error learning engine (fingerprinting → graduation to antipatterns)
- Automatic cognitive capture (`src/engines/cognitive.ts`)

### 2026-03-03 — Integration Gap Closure
- 28-issue fix plan (all phases 0-6 complete)
- 12 remaining gaps fixed
- 26 deep review issues fixed (3 critical, 8 high, 15 medium)
- 5 dead export loops wired

### 2026-03-02 — Phase 7.2: Decision Memory (Institutional Knowledge)

### 2026-03-02 — Phase 7.2: Decision Memory (Institutional Knowledge)
- **New types**: `DecisionData`, `DecisionAlternative` interfaces, `DecisionType` union (architectural|implementation|trade_off|tool_choice|approach), `DecisionOutcome` union (positive|negative|neutral|pending), `isDecisionData` type guard. Updated `type_data` union to include `DecisionData`. Enhanced `DecisionPoint` with rationale, constraints, decision_type fields (`src/types.ts`)
- **New constants**: `DECISION` block — 18 tunable params + 4 pattern groups: CHOICE_PATTERNS (4 regexps for "chose X because Y"), COMPARISON_PATTERNS (3 regexps for "A vs B"), REFACTOR_PATTERNS (10 strings for extraction decisions), TYPE_PATTERNS (5 keyword lists for type inference) (`src/const.ts`)
- **Enhanced detection**: `detectDecisionPoint()` now detects "chose X because Y", "opted for X over Y" (with alternatives), "A vs B" comparisons, and refactoring decisions. New helpers: `extractChoicePattern()`, `extractComparisonPattern()`, `inferDecisionType()` (`src/engines/hooks.ts`)
- **Decision encoding**: New `encodeDecision()` — creates Memory with type='episodic', type_data.kind='decision', full context including alternatives/rationale/constraints. Links to related memories via file overlap. New `updateDecisionOutcome()` for retrospective outcome enrichment (`src/engines/hooks.ts`)
- **Similar-decision retrieval**: New `findSimilarDecisions()` — dual-seeded search (FTS5 + embedding) for past decisions matching current context, with keyword similarity + file overlap scoring. New `formatDecisionInjection()` for `[ENGRAM DECISION]` output blocks (`src/engines/retrieval.ts`)
- **Hook integration** (`src/hook.ts`):
  - Post-tool: Decision detection triggers `encodeDecision()` with rate limiting (canEncodeDecision: max 10/session, 5min cooldown)
  - Post-tool: Architecture graph lookup via `getArchNodesByFile()` populates `affected_components`
  - Session-end: `updateDecisionOutcome()` enriches decisions with inferred outcome from feedback signals
  - Prompt-check: `findSimilarDecisions()` surfaces past decisions as `[ENGRAM DECISION]` blocks at HIGH/MEDIUM injection levels
  - WatcherState: New fields `decision_encoded_count`, `last_decision_encode_time`, `decision_memory_ids`
- **Tests**: 40 new tests across 7 groups: enhanced detection (12), type inference (5), encoding (4), outcome tracking (3), retrieval (4), injection formatting (3), type guards (4), constants (5). Also fixed 2 existing test files with updated DecisionPoint fixtures.
- **Results**: 1,324 tests across 60 files, all passing. Zero TypeScript errors. Build clean (ESM + DTS).
- **Key features**:
  - **Rich decision capture**: Extracts alternatives, rationale, constraints, and decision type from natural language
  - **Architecture-aware**: Links decisions to architecture graph nodes from Phase 7.1
  - **Retrospective outcome tracking**: Session-end automatically updates decision outcomes based on feedback signals
  - **Anti-regression surfacing**: Similar past decisions surfaced via `[ENGRAM DECISION]` to prevent re-debate
  - **Dual retrieval**: FTS5 keyword + embedding similarity for finding related past decisions

---

## [Previous] — Brain Implementation (Phase 6)

### 2026-03-02 — Task 6.3: Somatic Markers (Gut Feelings)
- **New types**: `SomaticSignal`, `SomaticValence` — structured gut-feeling signals with binary valence (positive/negative), intensity, and associated lesson (`src/types.ts`)
- **New constants**: `SOMATIC_MARKERS` block — 8 tunable params: emotional weight threshold (0.7), confidence gate (0.8), activation gate (0.3), max signals (3), message templates, tag (`src/const.ts`)
- **Retrieval engine**: New `extractSomaticMarkers()` — scans activated memories pre-budget-allocation for high-emotion, high-confidence episodic memories; generates binary good/bad signals sorted by intensity; `generateSomaticDescription()` helper for human-readable output; updated `ContextualRecallResult` with `somatic_signals` field; integrated as Step 2.5 in `contextualRecall()` pipeline (`src/engines/retrieval.ts`)
- **Hook output**: New `[GUT Warning]` / `[GUT OK]` tags — somatic signals surfaced FIRST (before regular context), with deduplication to prevent memories appearing in both somatic and context sections (`src/hook.ts`)
- **Tests**: 29 new tests across 5 groups (1179 total, 0 regressions)
- **Key features**:
  - **Pre-budget extraction**: Somatic signals extracted from full activated set before budget allocation, so they survive even when source memory gets cut by token budget
  - **Triple-gated filtering**: Only episodic memories that pass all three gates (emotional_weight >= 0.7, confidence >= 0.8, activation >= 0.3) produce signals
  - **Binary valence**: Negative outcomes → warning signal, positive/neutral → encouragement signal
  - **Intensity ranking**: Signals sorted by emotional_weight × confidence, capped at 3 per recall
  - **Deduplication**: Memories surfaced as somatic signals are excluded from regular `[ENGRAM CONTEXT]` output to avoid noise

### 2026-03-02 — Task 6.2: Creative Insight Surfacing
- **New type**: `CreativeInsight` — cross-domain insight discovered during dream-phase consolidation, with source/target domain, relevance, and description (`src/types.ts`)
- **New constants**: `CREATIVE_INSIGHT` block — 11 tunable params: tags, relevance threshold, max insights, encoding strength, confidence lifecycle, prospective memory params (`src/const.ts`)
- **Repository**: New `getInsightMemories(domain, limit)` — queries semantic memories tagged `creative_insight`, filters by domain, orders by confidence (`src/storage/repository.ts`)
- **Consolidation engine**: New `createInsightFromPromotion()` — when dream-phase promotes speculative → cross_domain connection, creates a semantic insight memory (tagged `creative_insight` + `cross_domain`) with both domains, connects to source memories, and auto-creates prospective memory for future recall triggering (`src/engines/consolidation.ts`)
- **Retrieval engine**: New `surfaceCreativeInsights()` — finds insight memories matching query keywords and domain, parses source/target domains from content, filters by relevance, caps at `MAX_INSIGHTS`; updated `ContextualRecallResult` with `insights` field; integrated into `contextualRecall()` pipeline as Step 5.5 (`src/engines/retrieval.ts`)
- **Hook output**: New `[ENGRAM INSIGHT]` tag — formats as "A pattern from {source_domain} might help here: {description}" for cross-domain discoveries (`src/hook.ts`)
- **Tests**: 30 new tests across 7 groups (1150 total, 0 regressions)
- **Key features**:
  - **Insight creation on promotion**: When dream-phase speculative connections reach the strength threshold and get promoted, a semantic insight memory is created with both domains, tagged for later retrieval
  - **Prospective memory trigger**: Each insight automatically creates a reminder that fires when relevant domains/keywords are queried in future sessions
  - **Domain-aware surfacing**: Insights are filtered by the current domain context, only showing cross-domain patterns relevant to what you're working on
  - **Validation lifecycle**: Insights start at 0.5 confidence; validation boosts by 0.15, invalidation decays by 0.2 — bad insights fade, good ones strengthen

### 2026-03-02 — Task 6.1: Real-Time Schema Surfacing
- **New types**: `SchemaIntuition`, `IntuitionStrength`; added `description: string | null` to `Schema` (`src/types.ts`)
- **New constants**: `SCHEMA_SURFACING` block — 10 tunable params: confidence tiers (strong/moderate/weak), instance activation boost, relevance thresholds, description limits (`src/const.ts`)
- **Database migration**: Added `description` column to `schemas` table (`src/storage/database.ts`)
- **Repository**: Updated `SchemaRow`, `rowToSchema()`, `createSchema()`, `updateSchema()` to support `description` field (`src/storage/repository.ts`)
- **Retrieval engine**: New `surfaceSchemaIntuitions()` — transforms raw schema matches into confidence-graded intuitions with descriptions and actionable hints; new `boostSchemaInstanceActivation()` — boosts activation of memories belonging to matched schemas before budget allocation; `generateSchemaDescription()` — synthesizes human-readable descriptions from schema name/structure; `generateActionableHint()` — extracts fixes from antipattern instances and lessons from episodic instances; updated `ContextualRecallResult` with `intuitions` field; enhanced `matchSchemas()` to include description in keyword matching (`src/engines/retrieval.ts`)
- **Consolidation engine**: New `generateSchemaDescriptionFromCluster()` — generates descriptions when schemas form during deep consolidation, sampling cluster content and detecting memory types (antipatterns → "pitfalls", episodic → "experience") (`src/engines/consolidation.ts`)
- **Hook output**: New `[ENGRAM INTUITION]` tag for strong/high-confidence patterns (replaces `[ENGRAM PATTERN]` for established schemas); confidence-graded presentation (strong → INTUITION, moderate/weak → PATTERN); actionable hints inline ("Known approach: ..."); fallback to raw schema display when no intuitions generated (`src/hook.ts`)
- **Tests**: 36 new tests across 10 groups (1120 total, 0 regressions)
- **Key features**:
  - **Confidence-graded intuitions**: Strong (>=0.8 or principle/mature status) → `[ENGRAM INTUITION]`; Moderate (>=0.6 or established) → `[ENGRAM PATTERN]`; Weak (>=0.4) → only surfaced if relevance is high
  - **Schema instance activation boost**: Memories belonging to matched schemas get activation boost (0.25 * relevance), making pattern-relevant knowledge more prominent in recall
  - **Actionable hints**: Antipattern fixes and episodic lessons extracted from schema instances and surfaced inline
  - **Rich descriptions**: Generated from cluster content during consolidation, stored in DB, fallback synthesis from schema name/structure at recall time

---

## Brain Implementation (Phase 5) — COMPLETE

### 2026-03-02 — Task 5.3: Learning Progression Engine
- **New types**: `Prerequisite`, `LearningPathStep`, `LearningPath`, `ZPDSkill`, `ZPDResult`, `ErrorDifficulty`, `ErrorClassification` (`src/types.ts`)
- **New constants**: `PROGRESSION` block — 14 tunable params: prerequisite defaults, ZPD caps, path limits, auto-discovery thresholds, error classification, injection budget (`src/const.ts`)
- **Database migration**: New `skill_prerequisites` table (domain/skill/prerequisite UNIQUE, 2 indexes) + `learning_paths` table (domain index) (`src/storage/database.ts`)
- **Repository**: Full CRUD — `createPrerequisite()`, `getPrerequisitesForSkill()`, `getPrerequisitesByDomain()`, `getDependentSkills()`, `deletePrerequisite()`, `deleteAutoDiscoveredPrerequisites()`, `createLearningPath()`, `getLearningPathsByDomain()`, `getLearningPath()`, `updateLearningPath()`, `deleteLearningPath()`, `getAllLearningPaths()` (`src/storage/repository.ts`)
- **Skills engine**: Learning progression — `addSkillPrerequisite()` (with cycle detection via BFS), `checkPrerequisitesMet()`, `computeZPD()` (3-strategy: paths → prerequisites → inferred), `classifyError()` (below/at/above mastery), `inferPrerequisites()`, `buildLearningPathFromPrereqs()` (topological sort), `formatZPDInjection()`, `recordProgressionOutcome()`, `refreshZPD()` (`src/engines/skills.ts`)
- **Hook integration**: ZPD injection at session-start (`[ENGRAM ZPD]` tag planned via `formatZPDInjection()`), error classification at post-bash with `[ENGRAM REGRESSION]` and `[ENGRAM LEARNING]` output tags (`src/hook.ts`)
- **Tests**: 52 new tests across 9 groups (1084 total, 0 regressions)
- **Key features**:
  - **Prerequisites**: Explicit skill dependency tracking with cycle prevention (BFS traversal)
  - **Learning paths**: Ordered skill sequences via topological sort (Kahn's algorithm), with path-aware ZPD reasons
  - **ZPD computation**: 3-strategy pipeline: (1) learning path steps, (2) explicit prerequisites, (3) inferred advancement for sparse domains
  - **Error classification**: Maps errors to mastery level — regression signals for mastered skills, learning opportunities for novice areas
  - **ZPD refresh**: Automatic on level change via `recordProgressionOutcome()`
  - **Auto-discovery**: `inferPrerequisites()` infers ordering from keyword similarity + practice chronology

### 2026-03-02 — Task 5.2: Scaffolded Knowledge (Mastery-Aware Recall)
- **New types**: `ScaffoldingConfig`, `CrossDomainAnalogy` (`src/types.ts`)
- **New constants**: `SCAFFOLDING` block — 26 tunable params: per-level result caps, procedural/schema limits, content lengths, activation boosts, cross-domain analogy settings (`src/const.ts`)
- **Skills engine**: `getScaffoldingConfig()`, `getEffectiveDomainLevel()`, `applyScaffolding()`, `findCrossDomainAnalogies()` — mastery-aware recall adaptation (`src/engines/skills.ts`)
- **Retrieval engine**: Scaffolding wired into `contextualRecall()` and `codeContextRecall()` — both functions now return `scaffolding` and `analogies` metadata (`src/engines/retrieval.ts`)
- **Hook output**: New `[ENGRAM SCAFFOLD]` and `[ENGRAM ANALOGY]` tags — novice/beginner domains get scaffolding hints, cross-domain bridges from mastered domains (`src/hook.ts`)
- **Tests**: 39 new tests across 9 groups (1032 total, 0 regressions)
- **Key features**:
  - Recall adapts to mastery: novice gets 8 results with boosted antipatterns/procedural; expert gets 3 results with only high-severity warnings
  - Expert level filters out medium-severity antipatterns and all procedural memories (noise reduction)
  - Competent level boosts episodic memories (approaches, trade-offs)
  - Cross-domain analogies: novice/advanced_beginner domains receive bridges from mastered domains (competent+)
  - Content truncation scales with mastery: 300 chars (novice) → 100 chars (expert)
  - Zero performance regression: scaffolding computed within existing recall pipeline

### 2026-03-02 — Task 5.1: Mastery Tracking (Dreyfus Model)
- **New types**: `MasteryLevel`, `MasteryEvidence`, `MasteryProfile`, `MASTERY_LEVEL_ORDER` (`src/types.ts`)
- **New constants**: `MASTERY` block — 22 tunable params: level thresholds (practices + success rates), regression detection, evidence caps, spaced repetition intervals, injection budget
- **Database migration**: New `mastery_profiles` table with domain/skill UNIQUE constraint, 3 indexes (domain, level, next_review)
- **Repository**: Full CRUD — `createMasteryProfile()`, `getMasteryProfile()`, `getMasteryProfileByDomainSkill()`, `getMasteryProfilesByDomain()`, `getAllMasteryProfiles()`, `getOverdueMasteryProfiles()`, `updateMasteryProfile()`, `deleteMasteryProfile()`, `getMasteryProfileCount()`
- **Skills engine**: Dreyfus model mastery — `assessMastery()`, `recordMasteryOutcome()`, `evaluateMasteryLevel()`, `computeNextReview()`, `getMasteryForDomain()`, `getProfilesDueForReview()`, `evaluateAllMastery()`, `formatMasteryInjection()`
- **Consolidation integration**: Phase 4.7 — `evaluateMastery()` runs during full/deep consolidation, re-evaluates all profiles
- **Identity engine**: Section 8 — mastery injection line at session start (level grouping, overdue review alerts)
- **Tool handler**: `engram_self view` shows mastery profiles (domain/skill, level, success rate, practices) + overdue review section
- **Tests**: 43 new tests across 12 groups (993 total, 0 regressions)
- **Key features**:
  - 5-level Dreyfus progression: novice → advanced_beginner → competent → proficient → expert
  - Dual criteria: practice count + success rate must both meet threshold
  - Regression detection: recent failure window + success rate drop below regression factor
  - Spaced repetition: exponential intervals (3d base × 2.5^level)
  - Evidence management: capped at 20, keeps most recent
  - Consolidation-time re-evaluation of all profiles

## Brain Implementation (Phase 4)

### 2026-03-02 — Task 4.3: Relationship Memory
- **New types**: `TrustSnapshot`, `TopicAffinity`, `SessionInteraction`, `CommunicationStyle`, `BehavioralPreference`, `RelationshipProfile` + `relationship` field on `SelfModel`
- **New constants**: `RELATIONSHIP` block (23 params: caps, decay, EMA alpha, depth weights, style thresholds)
- **Database migration**: `ALTER TABLE self_model ADD COLUMN relationship TEXT`
- **Repository**: Extended `SelfModelRow`, `rowToSelfModel()`, `upsertSelfModel()` (17 columns), field sets
- **Identity engine**: `createDefaultRelationshipProfile()`, `updateCommunicationStyle()`, `updateRelationshipFromSession()`, `updateTopicAffinities()`, `computeRelationshipDepth()`, `detectBehavioralPreferences()`
- **Hook wiring**: WatcherState +4 message pattern arrays, step 1c message tracking, session-end passes feedback_signals + message_stats, +3 utilities (containsCode, countJargon, isQuestion)
- **Tool handler**: `engram_self view` shows relationship profile (depth, topics, style, patterns, trust trend)
- **Injection**: Section 7 — relationship context line at session start
- **Tests**: 49 new tests across 12 groups (950 total, 0 regressions)
- **Key algorithms**: Correction frequency EMA (α=0.3), topic recency decay (0.9/session), relationship depth sigmoid composite

### 2026-03-02 — Task 4.2: Session Narrative (Identity Continuity)

**Goal:** Replace flat factual session summaries with rich narratives that capture the *experience* of a session — goal, approach, challenges, lessons, user sentiment, and unfinished work — so future sessions can "resume" the narrative thread.

#### Added
- **`SessionNarrative`, `SessionSentiment`, `FeedbackSignalCounts` types** (`src/types.ts`) — Structured narrative with goal, approach, challenges, lessons, sentiment, unfinished items, emotional weight, and full narrative text
- **`SESSION_NARRATIVE` constants** (`src/const.ts`) — 17 tunable parameters:
  - Thresholds: MIN_TURNS_FOR_NARRATIVE=3, MIN_TURNS_FOR_RICH_NARRATIVE=8
  - Encoding: ENCODING_STRENGTH=0.7 (vs 0.5 for old summaries), ENCODING_CONFIDENCE=0.6
  - Emotional weight: BASE=0.3, ERROR_BOOST=0.05, CORRECTION_BOOST=0.1, FRUSTRATION_BOOST=0.15, APPROVAL_REDUCE=0.03
  - Caps: MAX_NARRATIVE_LENGTH=800, MAX_CHALLENGES=5, MAX_LESSONS=5, MAX_UNFINISHED=3
- **`composeSessionNarrative()`** (`src/engines/hooks.ts`) — Synthesizes WatcherState into narrative:
  - Goal extraction: active_task -> first conversation topic -> null
  - Approach: topic arc ("research, implementation, then testing")
  - Challenges: errors + corrections + frustration signals
  - Lessons: decisions + discoveries + instructions received
  - Sentiment: deriveSentiment() from feedback signal counts
  - Emotional weight: computeEmotionalWeight() (error/frustration raise, approval lowers)
  - Two modes: rich (>8 turns, includes approach detail) and condensed (3-7 turns)
- **`feedback_signals` field in WatcherState** — Tracks per-type feedback counts (approval/correction/frustration/instruction) for sentiment analysis
- **52 new tests** (`tests/session-narrative.test.ts`) — Full coverage:
  - Basic behavior, goal extraction, approach extraction, challenges, lessons
  - deriveSentiment (7 tests), computeEmotionalWeight (6 tests)
  - Unfinished items, narrative text composition, full integration, edge cases

#### Changed
- **`handleSessionEnd()`** (`src/hook.ts`) — Now composes narrative before encoding:
  - Memory tagged `session-narrative` + `sentiment-{type}` (not just `session-summary`)
  - Higher encoding strength (0.7 vs 0.5) and confidence (0.6 vs 0.5)
  - Outcome derived from sentiment (positive/negative/neutral)
  - Lesson field populated from first narrative lesson
  - Emotional weight computed from session data
  - Narrative text passed to self-model for richer `last_session_summary`
- **`updateSelfModelFromSession()`** (`src/engines/identity.ts`) — Accepts optional `narrative_text` parameter; uses narrative for `last_session_summary` when available, falls back to structured parts
- **Feedback signal wiring** — Signal type (approval/correction/frustration/instruction) now tracked in WatcherState alongside encoded count

#### Stats
- 901 tests across 49 files, all passing (+52 new)
- Build clean (ESM + DTS)
- Zero new DB tables (uses existing memory storage)

---

### 2026-03-02 — Task 4.1: Self-Model Storage (Persistent Identity)

**Goal:** Maintain a coherent working identity across sessions — domain proficiency, user preferences, trust level, and session context — so Claude doesn't start as a blank slate each time.

#### Added
- **`DomainProficiency`, `UserPreference`, `SelfModel` types** (`src/types.ts`) — Full self-model with strengths, weaknesses, preferences, trust, triggers, and session history
- **`IDENTITY` constants** (`src/const.ts`) — 27 tunable parameters across 6 categories:
  - List caps: MAX_STRENGTHS=10, MAX_WEAKNESSES=10, MAX_USER_PREFERENCES=20, etc.
  - Proficiency: STRENGTH_THRESHOLD=0.65, WEAKNESS_THRESHOLD=0.35, blended scoring
  - Trust: Asymmetric evolution — APPROVAL_TRUST_BOOST=0.02, CORRECTION_TRUST_DECAY=0.98, FRUSTRATION_TRUST_DECAY=0.95
  - Preferences: PREFERENCE_INITIAL_STRENGTH=0.5, reinforcement on repeat
  - Injection: 300 token budget, progressive section dropping
  - String limits: truncation for all text fields
- **`self_model` table** (`src/storage/database.ts`) — Singleton table with structured columns (not JSON blob)
- **Repository CRUD** (`src/storage/repository.ts`):
  - `getSelfModel()`, `upsertSelfModel()`, `updateSelfModelField()` with allowlist validation
  - `SelfModelRow` type and `rowToSelfModel()` converter with JSON array deserialization
- **Identity Engine** (`src/engines/identity.ts`) — 7 public exports:
  - `getSelfModel()` — Lazy init from DB or create default
  - `updateSelfModelFromSession()` — Session-end: counters, summary, context, common tasks, proficiency
  - `updateFromFeedback()` — Trust evolution: approval (diminishing boost), correction (0.98x), frustration (0.95x)
  - `updateFromInstruction()` — Capture user directives as preferences with dedup and strength-based eviction
  - `formatSelfModelInjection()` — Session-start identity block with progressive section dropping
  - `recordDomainOutcome()` — Track proficiency: 0.4 * avg_confidence + 0.6 * success_ratio
  - `updateOngoingContext()` — Set current project/task context
- **`engram_self` MCP tool** (#14) — Actions: view, set_preference, set_context, set_style
- **Hook integration** (`src/hook.ts`):
  - Session-start: identity injection after learning goals
  - Session-end: self-model update from session state
  - Prompt-check: trust/preference updates from feedback signals
- **57 tests** (`tests/self-model.test.ts`) — CRUD, proficiency, trust, preferences, sessions, injection, MCP tool, constants

#### Technical Details
- Proficiency algorithm: `0.4 * avg_memory_confidence + 0.6 * success_ratio`
  - >= 0.65 + 3 tasks → STRENGTH; <= 0.35 + 3 tasks → WEAKNESS
  - Pending entries stored in strengths list, filtered at display by threshold
- Trust is asymmetric: builds slowly via diminishing returns, drops fast via multiplicative decay
  - Floor: 0.1 (always recoverable), Ceiling: 0.95
- All 849 tests pass (792 existing + 57 new)

---

## Phase 3 — Metacognitive Monitoring

### 2026-03-02 — Task 3.3: Learning Goal Setting

**Goal:** Auto-generate learning goals from blind spots, let users create explicit goals, lower encoding thresholds for goal-matching content, and track progress toward mastery.

#### Added
- **`LearningGoal`, `LearningGoalStatus` types** (`src/types.ts`) — Goal with domain, topic, priority, reason, target/current confidence, status
- **`LEARNING_GOALS` constants** (`src/const.ts`) — 10 tunable parameters:
  - `MAX_ACTIVE_GOALS: 10` — Prevent goal overload
  - `AUTO_PRIORITY: 0.5` — Default for auto-generated goals
  - `USER_PRIORITY: 1.0` — Default for user-created goals
  - `DEFAULT_TARGET_CONFIDENCE: 0.7` — Mastery threshold
  - `SIGNIFICANCE_BOOST: 0.7` — Threshold multiplier for goal-matching content
  - `KEYWORD_MATCH_THRESHOLD: 0.15` — Content-to-goal matching sensitivity
  - `AUTO_ABANDON_DAYS: 30` — Stale auto-goal cleanup
- **`learning_goals` table** (`src/storage/database.ts`) — New SQLite table with indexes on status and domain
- **CRUD operations** (`src/storage/repository.ts`):
  - `createLearningGoal()`, `getLearningGoal()`, `getActiveLearningGoals()`, `getAllLearningGoals()`
  - `updateLearningGoal()`, `deleteLearningGoal()`, `getLearningGoalByDomainTopic()`
- **`generateLearningGoals()` function** (`src/engines/metacognition.ts`):
  - Auto-creates goals from medium/high severity blind spots
  - Deduplicates against existing goals (domain+topic)
  - Respects `MAX_ACTIVE_GOALS` limit
  - Maps blind spot reasons to descriptive topics
- **`refreshLearningGoals()` function** — Progress tracking:
  - Updates current_confidence from domain memory stats
  - Auto-achieves goals when target confidence reached
  - Auto-abandons stale auto-generated goals (>30 days)
  - Preserves user-created goals regardless of age
- **`matchLearningGoals()` function** — Content-to-goal matching:
  - Keyword extraction + Jaccard similarity
  - Domain filtering support
  - Priority-sorted results
- **`formatLearningGoals()` function** — Session start display:
  - `[ENGRAM GOAL]` tags with progress percentage
  - Configurable display limit with overflow count
- **Significance boost** (`src/engines/significance.ts`):
  - `evaluateSignificance()` accepts optional `matchingGoals` parameter
  - Matching goals lower encoding threshold by `SIGNIFICANCE_BOOST` (0.7x)
  - User-priority goals get extra 0.8x reduction on top
  - Threshold clamped to [0.05, 0.8] safety range
- **`engram_set_goal` MCP tool** (`src/tools/handlers.ts` + `src/index.ts`):
  - Create learning goals with domain, topic, priority, target_confidence
  - Shows current domain confidence and progress on creation
  - Duplicate detection
- **`engram_list_goals` MCP tool** — View goals and progress:
  - Domain filtering, include_completed option
  - Shows status icons, progress, priority, reason
- **Session start integration** (`src/hook.ts` step 8b + step 9):
  - Auto-generates goals from blind spot report
  - Refreshes goal progress on every session start
  - Displays active goals in session context
- **Prompt check integration** (`src/hook.ts` step 3f):
  - Matches current prompt against active learning goals
  - Surfaces `[ENGRAM GOAL]` reminder when content matches a goal topic
- **41 new tests** (`tests/learning-goals.test.ts`):
  - CRUD operations (create, read, update, delete, find by domain+topic)
  - Auto-generation from blind spots (high/medium/low severity, duplicates, limits)
  - Progress refresh (confidence update, achievement, abandonment, user vs auto)
  - Goal matching (relevant/unrelated content, domain filter, priority sort)
  - Formatting (display, limits, overflow)
  - Significance boost (threshold lowering, user vs auto priority)
  - Full workflow integration (blind spots → goals → learning → achievement)
  - Edge cases (non-existent IDs, empty content, capped progress)

#### Changed
- MCP server now registers 13 tools (was 11)
- `evaluateSignificance()` signature extended with optional `matchingGoals` parameter (backward compatible)

#### Stats
- 792 tests across 47 files, all passing (+41 new)
- Build clean (zero TypeScript errors)

### 2026-03-01 — Task 3.2: Blind Spot Detection

**Goal:** Proactively identify domains/topics where the system lacks reliable knowledge — knowledge gaps, high error rates, poor recall quality, and frequent corrections — and surface these warnings at session start and during prompts.

#### Added
- **`BlindSpot`, `BlindSpotReport`, `BlindSpotReason` types** (`src/types.ts`) — Blind spot data with domain, reason, severity, detail, metric value, and recommendation
- **`BLIND_SPOT_DETECTION` constants** (`src/const.ts`) — 11 tunable parameters:
  - `KNOWLEDGE_GAP_THRESHOLD: 3` — Below this → high severity gap
  - `SPARSE_KNOWLEDGE_THRESHOLD: 8` — Below this → low severity gap
  - `HIGH_ERROR_RATE_THRESHOLD: 0.4` — Above this → error blind spot
  - `HIGH_CORRECTION_RATE_THRESHOLD: 0.3` — Above this → reliability concern
  - `LOW_RECALL_QUALITY_THRESHOLD: 0.3` — Below this → low quality blind spot
  - `MIN_METRICS_FOR_RATE: 3` — Minimum samples for meaningful rates
  - `MAX_SESSION_START_WARNINGS: 3` — Cap for session start output
  - `MAX_PROMPT_WARNINGS: 1` — Cap for per-prompt output
- **`detectBlindSpots()` function** (`src/engines/metacognition.ts`):
  - Scans all domains for knowledge gaps (too few memories)
  - Analyzes `blind_spot` metrics for high error rates per domain
  - Analyzes `recall_quality` metrics for low hit rates per domain
  - Analyzes `confidence_calibration` metrics for high correction rates (active domain only)
  - Deduplicates: knowledge gap takes priority over error rate
  - Sorts by severity (high > medium > low), then alphabetically
- **`formatBlindSpotWarnings()` function** — Formats for session start:
  - High severity: `[ENGRAM BLIND SPOT]`
  - Medium severity: `[ENGRAM WEAK AREA]`
  - Skips low severity (not worth noise at session start)
  - Shows overflow count when more blind spots than max warnings
- **`checkDomainBlindSpot()` function** — Lightweight per-domain check:
  - Checks knowledge gap + error rate for a single domain
  - Used by `handlePromptCheck()` for domain-specific warnings
- **Session start integration** (`src/hook.ts` step 8):
  - Runs `detectBlindSpots()` and injects warnings after test health block
  - Avoids overlapping with confidence gating warnings (3.1)
- **Prompt check integration** (`src/hook.ts` step 3e):
  - Runs `checkDomainBlindSpot()` on active domain
  - Only fires when confidence gating (3.1) didn't already warn
  - Skips low-severity blind spots (reduces noise)
- **32 new tests** (`tests/blind-spot-detection.test.ts`):
  - Knowledge gap detection (0, 1-2, 3-7, 8+ memories)
  - Error rate analysis with metric thresholds
  - Recall quality analysis
  - Correction rate for active domain
  - Severity ordering, deduplication, edge cases
  - Format output tests (high/medium/low, overflow, singular)
  - Integration with `recordRecallOutcome()`
  - Performance: 20 domains analyzed in <500ms

#### Test Results
- **751 tests across 46 files, all passing** (+32 new tests)
- Build: clean (no TypeScript errors)

---

### 2026-03-01 — Task 3.1: Confidence Gating

**Goal:** Claude should *know what it knows* — check confidence before acting, detect uncertainty, identify knowledge gaps, and surface conflicting memories. The prefrontal cortex of the Engram brain.

#### Added
- **`ConfidenceAssessment`, `Contradiction` types** (`src/types.ts`) — Confidence metadata with domain/approach confidence, gap detection, contradiction tracking, and success/failure history
- **`CONFIDENCE_GATING` constants** (`src/const.ts`) — 8 tunable parameters:
  - `LOW_CONFIDENCE_THRESHOLD: 0.4` — Below this → inject warning
  - `GAP_MEMORY_THRESHOLD: 3` — Below this memory count → knowledge gap
  - `MAX_CONTRADICTIONS: 2` — Cap to avoid overwhelming Claude
  - `RECALL_CONFIDENCE_WEIGHT: 0.6` / `DOMAIN_CONFIDENCE_WEIGHT: 0.4` — Blending weights
  - `MIN_MEMORIES_FOR_CONFIDENCE: 2` — Minimum for meaningful domain average
  - `MAX_EPISODIC_SCAN: 20` — Limit for success/failure scanning
  - `MIN_CONTRADICTION_STRENGTH: 0.2` — Ignore weak contradictions
- **`assessConfidence()` function** (`src/engines/metacognition.ts`):
  - Calculates domain confidence (average across all domain memories)
  - Calculates approach confidence (activation-weighted blend of recalled + domain)
  - Detects knowledge gaps (no/few memories in domain)
  - Detects contradictions (via 'contradicts' connections + version mismatches)
  - Extracts last success/failure timestamps from episodic memories
  - Includes system calibration score
- **Hook output integration** (`src/hook.ts`):
  - `[ENGRAM GAP]` — First-time territory warning when no prior knowledge exists
  - `[ENGRAM CONFIDENCE: LOW]` — Low confidence warning with percentage
  - `[ENGRAM CONFLICT]` — Contradiction warnings (content conflicts + version mismatches)

#### Modified
- `ContextualRecallResult` (`src/engines/retrieval.ts`) — Added `confidence: ConfidenceAssessment | null` field
- `contextualRecall()` (`src/engines/retrieval.ts`) — Calls `assessConfidence()` and attaches result
- `handlePromptCheck()` (`src/hook.ts`) — Formats and outputs confidence warnings to stdout

#### Tests
- **23 new tests** (`tests/confidence-gating.test.ts`):
  - Basic behavior: neutral defaults, gap detection, domain confidence calculation, blending
  - Contradiction detection: 'contradicts' connections, version mismatches, capping, deduplication, weak filtering
  - Episodic outcomes: last success/failure extraction
  - Edge cases: empty recall with domain, zero confidence, single memory, calibration
  - Shape validation and constants validation

**Results:** 719 tests across 45 files, all passing (+23 new)

---

## [Released] — Brain Implementation (Phase 2)

### 2026-03-01 — Task 2.4: Conversation Topic Tracking

**Goal:** Track the semantic thread of a conversation to build richer encoding context — topic changes, decision points, open questions, and conversation arc summaries.

#### Added
- **`ConversationState`, `TopicEntry`, `DecisionPoint` types** (`src/types.ts`) — Tracks current topic, topic history ring buffer, decision points, and open questions
- **`CONVERSATION` constants** (`src/const.ts`) — 13 tunable parameters:
  - `MAX_TOPIC_HISTORY: 10`, `MAX_DECISION_POINTS: 10`, `MAX_OPEN_QUESTIONS: 5` — capacity limits
  - `TOPIC_CHANGE_THRESHOLD: 0.3` — Jaccard similarity below this = new topic
  - `MIN_PROMPT_LENGTH: 15`, `MAX_TOPIC_KEYWORDS: 5`, `MIN_TOPIC_TURNS: 1` — extraction params
  - `DECISION_PATTERNS` — 10 patterns (e.g., "decided to", "going with", "opted for")
  - `QUESTION_INDICATORS` — 14 patterns for detecting genuine questions
  - `QUESTION_ANTI_PATTERNS` — 11 patterns to filter task requests from questions
- **Conversation tracking functions** (`src/engines/hooks.ts`):
  - `extractConversationTopic()` — Extract keywords as topic string from user prompts
  - `hasTopicChanged()` — Jaccard similarity comparison against current topic
  - `updateConversationState()` — Full state update: topic tracking, turn counting, open question detection/resolution
  - `detectDecisionPoint()` — Identify strategic decisions from tool calls (Agent delegations + decision language)
  - `buildConversationSummary()` — Generate conversation arc summary for session-end encoding
  - `createEmptyConversationState()` — Factory for fresh state
- **Hook integration** (`src/hook.ts`):
  - `WatcherState.conversation` field — Persists conversation state across hook invocations
  - `handlePromptCheck()` — Calls `updateConversationState()` on every user prompt (step 1b)
  - `handlePostToolGeneric()` — Calls `detectDecisionPoint()` on tool calls, records to state
  - `handleSessionEnd()` — Enriches session summary with `buildConversationSummary()` output
- **40 new tests** (`tests/conversation-tracking.test.ts`):
  - Topic extraction, topic change detection, multi-turn state updates
  - Decision point detection from Agent delegations and decision language
  - Open question tracking, deduplication, resolution
  - Conversation summary building, integration flow tests

#### Technical Details
- All state persists in `watcher.json` (hooks are stateless CLI processes)
- Topic extraction: keyword-based (reuses `extractKeywords()`), max 5 keywords per topic
- Topic change: Jaccard similarity < 0.3 = new topic, otherwise increment turn count
- Decision detection: Agent tools with prompts ≥50 chars, or any tool with decision language patterns
- Open questions: detected from `?` and question indicators, filtered by anti-patterns, resolved when subsequent non-question prompt has high keyword overlap
- Session summary includes topic arc (→-separated), recent decisions, and unresolved questions
- Zero new database tables — conversation state is ephemeral per-session (watcher.json)

#### Results
- 696 tests across 44 files, all passing (+40 new)
- Build clean, no new dependencies
- Conversation arc now appears in session-end episodic memories
- Phase 2: Continuous Encoding is now **COMPLETE** (Tasks 2.1–2.4 all done)

---

### 2026-03-01 — Task 2.3: Discovery Encoding

**Goal:** Automatically detect and encode discoveries from tool results — debugging breakthroughs, code patterns, and architectural insights — without requiring explicit `engram_learn` calls.

#### Added
- **`DiscoveryType`, `DiscoveryEvent` types** (`src/types.ts`) — 3 discovery types: `error_resolution`, `pattern_found`, `architecture_insight`
- **`DISCOVERY` constants** (`src/const.ts`) — 13 tunable parameters:
  - `MAX_PER_SESSION: 8`, `COOLDOWN_MINUTES: 3` — rate limiting
  - `ENCODING_STRENGTH: 0.7`, `CONFIDENCE: 0.55` — encoding parameters
  - `MIN_PATTERN_FILES: 3`, `MAX_PATTERN_FILES: 15` — pattern found thresholds
  - `MIN_INVESTIGATION_SEARCHES: 2` — error resolution threshold
  - `ARCHITECTURE_PATHS` — 16 recognized architectural path segments
  - `MIN_CODE_DEFINITIONS: 3` — architecture insight threshold
  - `EXTENSION_DOMAIN_MAP` — 12 file extensions mapped to domains
- **`detectDiscovery()` function** (`src/engines/hooks.ts`) — Dispatches to 3 specialized detectors:
  - `detectErrorResolutionDiscovery()` — Bash success after errors + investigation (≥2 search tools)
  - `detectPatternFoundDiscovery()` — Grep/Glob with 3-15 unique file matches
  - `detectArchitectureInsightDiscovery()` — Read on new architectural file with ≥3 code definitions
- **`encodeDiscovery()` function** (`src/engines/hooks.ts`) — Creates episodic memories with:
  - Tags: `discovery`, `disc_{type}`, `auto_encoded`
  - Domain inference from file extensions via `inferDomainsFromFiles()`
  - Related-memory connections via file overlap
  - Emotional weights: error_resolution=0.5, architecture_insight=0.35, pattern_found=0.3
- **Discovery detection in `handlePostToolGeneric()`** (`src/hook.ts`) — Fires for Grep/Glob/Read
- **Discovery detection in `handlePostBash()`** (`src/hook.ts`) — Fires for error resolution on Bash success
- **`canEncodeDiscovery()` rate limiter** (`src/hook.ts`) — 8/session max, 3-min cooldown
- **WatcherState fields** — `discovery_encoded_count`, `last_discovery_encode_time`
- **31 new tests** (`tests/discovery-encoding.test.ts`) — Detection, encoding, noise filtering

#### Results
- 656 tests across 43 files, all passing (+31 new)
- Silent encoding (no stdout output)
- High precision: conservative thresholds prevent false positives

---

### 2026-03-01 — Task 2.2: User Feedback Signal Capture

**Goal:** Detect and process user feedback signals (approval, correction, frustration, instruction) from prompts, strengthening/weakening memories and encoding new learnings automatically.

#### Added
- **`FEEDBACK` constants** (`src/const.ts`) — 17 tunable parameters + 4 pattern lists:
  - `MAX_AFFECTED_MEMORIES: 5` — recent memories to strengthen/weaken
  - `APPROVAL_CONFIDENCE_BOOST: 0.1`, `APPROVAL_REINFORCEMENT_BOOST: 1.15` — approval rewards
  - `CORRECTION_CONFIDENCE_DECAY: 0.85`, `CORRECTION_ENCODING_STRENGTH: 0.8` — correction handling
  - `INSTRUCTION_ENCODING_STRENGTH: 1.0`, `INSTRUCTION_CONFIDENCE: 0.95` — user directives
  - `FRUSTRATION_EMOTIONAL_WEIGHT: 0.9` — high emotional weight for frustration
  - `MAX_PER_SESSION: 15`, `COOLDOWN_SECONDS: 30` — rate limiting
  - 4 pattern lists: `APPROVAL_PATTERNS`, `CORRECTION_PATTERNS`, `FRUSTRATION_PATTERNS`, `INSTRUCTION_PATTERNS`
  - `ANTI_PATTERNS` — false positive prevention (questions, code, task requests)

- **Feedback types** (`src/types.ts`):
  - `FeedbackSignal` — `'approval' | 'correction' | 'frustration' | 'instruction' | 'neutral'`
  - `FeedbackEvent` — signal with intensity (0-1), content, and extracted keywords

- **Signal detection & processing** (`src/engines/hooks.ts`):
  - `detectFeedbackSignal()` — classifies user prompt with priority chain: instruction > frustration > correction > approval > neutral
  - `processFeedbackSignal()` — dispatches to signal-specific handlers
  - `handleApproval()` — strengthens recent non-antipattern memories (confidence + reinforcement)
  - `handleCorrection()` — weakens recent memories + encodes correction as episodic with `lesson_validated: true`
  - `handleFrustration()` — creates antipattern + auto-prospective + weakens recent memories
  - `handleInstruction()` — creates pinned semantic memory (long-term, decay-exempt) + prospective reminder
  - `countPatternMatches()` — utility for pattern matching with anti-pattern awareness
  - Request-style prefix detection ("can you", "could you") gives +2 anti-score to prevent false positives

- **Hook integration** (`src/hook.ts`):
  - Feedback detection runs as step 0 in `handlePromptCheck()` (before task extraction and recall)
  - Rate limiting via `canEncodeFeedback()` (max per session + cooldown)
  - WatcherState extended with `feedback_encoded_count` and `last_feedback_encode_time`
  - Stdout output for instruction/frustration: `[ENGRAM LEARNED]` tags (Claude sees them)
  - Approval/correction are silent (no noise for routine feedback)

- **Tests** (`tests/user-feedback.test.ts`) — 40 new tests:
  - Signal detection: approval (5), correction (4), frustration (4), instruction (5), neutral (4), anti-pattern (2), priority (2), intensity (2)
  - Processing: approval strengthening (2), correction weakening+encoding (1), frustration antipattern (2), instruction pinned+prospective (2), edge cases (3)

#### Stats
- **625 tests** across **42 files**, all passing (+40 new)
- Build clean, zero TypeScript errors

---

### 2026-03-01 — Task 2.1: Reasoning Trace Encoding

**Goal:** Automatically capture Claude's reasoning process (investigation patterns, strategic decisions, approach validations) as episodic memories, without requiring explicit `engram_learn` calls.

#### Added
- **`REASONING_TRACE` constants** (`src/const.ts`) — 13 tunable parameters:
  - `MAX_BUFFER_SIZE: 20` — tool calls buffered for pattern detection
  - `MIN_INVESTIGATION_TOOLS: 3` — search tools needed to detect investigation
  - `SEQUENCE_WINDOW_MINUTES: 10` — time window for grouping tool sequences
  - `MIN_AGENT_PROMPT_LENGTH: 50` — Agent prompt length for delegation detection
  - `MAX_PER_SESSION: 10`, `COOLDOWN_MINUTES: 2` — rate limiting
  - `ENCODING_STRENGTH: 0.6`, `CONFIDENCE: 0.5` — memory encoding parameters
  - `SEARCH_TOOLS`, `VALIDATION_TOOLS`, `DECISION_TOOLS` — tool category lists

- **Reasoning types** (`src/types.ts`):
  - `ReasoningToolCall` — buffered tool call record (tool, timestamp, input/output summary, files)
  - `ReasoningPattern` — detected pattern with type, description, tools, files, lesson
  - `ReasoningPatternType` — `'investigation' | 'delegation' | 'approach_validation'`

- **Pattern detection** (`src/engines/hooks.ts`):
  - `detectReasoningPattern()` — analyzes tool buffer for 3 pattern types
  - `encodeReasoningTrace()` — encodes pattern as episodic memory with connections
  - `extractInvestigationTopic()` — finds common keywords across search tool inputs

- **Post-tool handler** (`src/hook.ts`):
  - New `post-tool` CLI command for generic PostToolUse processing
  - `handlePostToolGeneric()` — buffers tool calls, detects patterns, encodes traces
  - `canEncodeReasoning()` — rate limiting (max per session + cooldown)
  - `summarizeToolInput()` / `summarizeToolOutput()` — compact tool summaries
  - `extractFilesFromToolCall()` — extracts file paths from tool data
  - Reasoning buffer fields in `WatcherState` (backward-compatible)

- **Hook registration** (`~/.claude/settings.json`):
  - New PostToolUse matcher: `Read|Grep|Glob|Agent|WebSearch|WebFetch` → `post-tool`

- **20 new tests** (`tests/reasoning-trace.test.ts`):
  - Pattern detection: investigation (3+ search tools), delegation (Agent with rich prompt), approach validation (search → bash success)
  - Noise filtering: empty buffer, single tool, short Agent prompts, errored bash
  - Time window filtering: old tool calls excluded
  - Priority: investigation wins over delegation when both match
  - Encoding: all 3 pattern types encode correctly with proper tags/metadata
  - Constants verification: valid ranges for all parameters

#### Technical Notes
- Silent encoding — no stdout output (doesn't add noise to Claude's context)
- Buffer-based pattern detection (not per-tool encoding) for noise filtering
- Rate-limited: max 10 traces/session, 2-min cooldown between encodings
- Encoded traces tagged `reasoning_trace` + `rt_{type}` for easy retrieval
- Investigation topic extraction uses keyword frequency analysis
- 585 tests across 41 files, all passing

---

## [Released] — Brain Implementation (Phase 1)

### 2026-03-01 — Task 1.3: Associative Priming (Train of Thought)

**Goal:** After recall, prime neighbors of returned memories so subsequent queries find related concepts faster — creating a "train of thought" effect.

#### Added
- **`PRIMING` constants** (`src/const.ts`) — 7 tunable parameters:
  - `BOOST: 0.3` — activation boost for primed nodes in retrieval
  - `HALF_LIFE_MINUTES: 5` — exponential decay window
  - `MAX_NEIGHBORS_PER_MEMORY: 3`, `MAX_PRIMED: 15` — capacity limits
  - `MIN_CONNECTION_STRENGTH: 0.3` — threshold for priming (weak links ignored)
  - `DECAY_FLOOR: 0.01`, `BASE_ACTIVATION: 0.2` — decay and base values

- **Priming buffer** (`src/engines/working-memory.ts`) — Separate from 7-item working memory:
  - `primeNeighbors()` — follows connection graph from recalled memories, sorts by strength, caps per-memory and total
  - `getPrimedBoost()` — exponential decay: `BOOST * 0.5^(age / HALF_LIFE_MINUTES)`
  - `clearPrimedNodes()` — cleanup on session start/end
  - `getPrimedNodeCount()`, `getPrimedNodeIds()` — introspection for testing

- **13 new tests** (`tests/associative-priming.test.ts`):
  - Neighbor priming, working memory exclusion, re-prime refresh, capacity limits
  - Boost decay over time, expired prime cleanup, clear behavior
  - Integration: priming doesn't affect working memory capacity
  - Connection strength scaling

#### Changed
- **`recall()` Step 7** (`src/engines/retrieval.ts`) — After results, primes top-5 recalled memories' neighbors
- **`seedActivation()`** (`src/engines/retrieval.ts`) — Applies priming boost to existing seeds AND injects primed-but-unseeded memories as new seeds
- **`processHookEvent()`** (`src/engines/hooks.ts`) — Clears primed nodes on session_start and session_end

#### Metrics
- Test suite: 565 tests across 40 files, all passing
- Priming is zero-cost when no primes exist (empty map check)
- Decay is O(1) per memory — computed on access, not background timer

---

### 2026-03-01 — Task 1.2: Pre-Write Semantic Recall

**Goal:** Before writing/editing code, recall relevant code patterns, past solutions, and conventions — not just antipatterns.

#### Added
- **`CODE_CONTEXT_RECALL` constants** (`src/const.ts`) — 10 tunable parameters for pre-write recall:
  - `MAX_CODE_KEYWORDS: 15`, `MAX_FTS_SEEDS: 5`, `TFIDF_SCAN_LIMIT: 25`
  - `TOKEN_BUDGET: 500`, `MAX_RESULTS: 3`, `MAX_PROCEDURAL: 1`, `MAX_CONVENTIONS: 2`
  - `MIN_CONTENT_LENGTH: 50`, `PROCEDURAL_MATCH_THRESHOLD: 0.15`

- **`codeContextRecall()` function** (`src/engines/retrieval.ts`) — Code-aware recall for Write/Edit hooks:
  - Extracts code identifiers as search terms (functions, classes, imports, decorators)
  - FTS5 + TF-IDF dual seeding with 1-hop spread (fast: <100ms)
  - Categorizes results into patterns, conventions, and procedural how-to
  - File path context for spatial matching (parent dir + filename)
  - Version/domain-aware contextual boosting

- **`extractCodeContext()` function** (`src/engines/retrieval.ts`) — Fast regex code identifier extraction:
  - Python: `def`, `class`, `import`, `from`, `@decorator`, `self.method()`
  - TypeScript/JS: `function`, `class`, `export`, `import from`, `const`/`let`
  - XML/Odoo: `model=`, `<field name="model">`, `widget=`, `t-name=`
  - File path components (basename + parent directory)
  - Language detection from extension or content heuristics
  - Common term filtering (SKIP_TERMS set), deduplication, capping at 15 terms

- **`matchProceduralForCode()` function** (`src/engines/retrieval.ts`) — Language-aware procedural matching

- **17 new tests** (`tests/code-context-recall.test.ts`):
  - extractCodeContext: Python, TypeScript, XML, decorators, imports, filtering, capping, language detection
  - codeContextRecall: empty input, backup code recall, convention categorization, token budget, null path, performance

#### Changed
- **`handlePreWrite()` enhanced** (`src/hook.ts`) — Now has two layers:
  1. **Antipattern immune check** (existing) — keyword matching, <1ms
  2. **Code context recall** (new) — FTS5 + TF-IDF + 1-hop spread, <100ms
  - Extracts file path from tool input for spatial context
  - Outputs `[ENGRAM PATTERN]`, `[ENGRAM CONVENTION]`, `[ENGRAM HOW-TO]` tags
  - Graceful fallback: if code recall fails, antipattern check still works

#### Fixed
- **`emotional-biasing.test.ts`** — Added missing `tfidf_scan_limit` to test config, added null guards for parallel DB stability

#### Metrics
- Before: Pre-write hook only checked antipatterns (fast but narrow)
- After: Pre-write surfaces patterns + conventions + how-to from memory (3 categories)
- Performance: ~2.4s total (2.3s Node cold start + <100ms recall logic)
- Tests: 552 passing (17 new + 535 existing)
- Build: clean, no type errors

---

### 2026-03-01 — Task 1.1: Pre-Action Contextual Recall

**Goal:** Make recall reflexive — Claude thinks *through* Engram, not alongside it.

#### Added
- **`CONTEXTUAL_RECALL` constants** (`src/const.ts`) — 10 tunable parameters for the new mid-weight recall path:
  - `MAX_FTS_SEEDS: 10`, `TFIDF_SCAN_LIMIT: 50`, `MAX_HOPS: 2`
  - `TOKEN_BUDGET: 1500`, `MAX_RESULTS: 6`
  - `MAX_SCHEMAS: 3`, `MIN_SCHEMA_CONFIDENCE: 0.5`, `SCHEMA_MATCH_THRESHOLD: 0.2`
  - `MAX_PROCEDURAL: 2`, `MIN_PROMPT_LENGTH: 15`

- **`contextualRecall()` function** (`src/engines/retrieval.ts`) — Mid-weight recall between lightweight (FTS5-only) and full recall():
  - FTS5 + TF-IDF dual seeding (not FTS5-only)
  - 2-hop spreading activation (not 1-hop)
  - Domain antipattern immune seeding
  - Version-aware contextual boosting
  - Returns `ContextualRecallResult` with memories, schemas, and procedural matches

- **`matchSchemas()` function** (`src/engines/retrieval.ts`) — Surfaces abstract patterns as "intuitions":
  - Queries schemas by domain (or all)
  - Keyword similarity matching against query
  - Returns top N schemas above confidence threshold

- **`matchProcedural()` function** (`src/engines/retrieval.ts`) — Finds "how to" procedural memories:
  - Keyword similarity matching against procedural memory content
  - Excludes already-seeded memories
  - Returns top N procedural memories

- **`getEpisodicOutcomeHint()` function** (`src/hook.ts`) — Enriches somatic marker memories with outcome context (positive/negative + lesson)

- **`fallbackLightweightRecall()` function** (`src/hook.ts`) — Graceful degradation to FTS5-only if contextual recall fails

- **New output tags** in prompt-check hook:
  - `[ENGRAM PATTERN]` — Schema intuitions
  - `[ENGRAM HOW-TO]` — Procedural memory matches
  - `[ENGRAM GUT]` — Somatic marker memories (strong emotional past experiences)

#### Changed
- **`handlePromptCheck()`** (`src/hook.ts`) — Replaced lightweight FTS5-only recall with full contextual recall:
  - Before: 3 results, 500 tokens, 1-hop FTS5-only
  - After: 6-9 results, 1500 tokens, 2-hop FTS5+TF-IDF dual seeding
  - Includes schema matching, procedural memory, somatic markers
  - Falls back to lightweight on error

#### Tests
- All 535 tests pass across 38 test files
- Build clean (tsup, no TypeScript errors)

---

## [0.1.0] — Production Release

Initial release of Engram cognitive memory system.

- 19 cognitive engines (significance, retrieval, consolidation, decay, immune, etc.)
- 11 MCP tools, 3 resources
- 9-phase consolidation (NREM + REM sleep simulation)
- TF-IDF embeddings (512-dim, zero external dependencies)
- Hook-based automatic encoding from Claude Code events
- Antipattern immune system with vaccination + affinity learning
- Schema formation (Piaget) + structural transfer (Gentner)
- 435 tests across 34 test files
