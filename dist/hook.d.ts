/**
 * Retrieval Engine — Spreading Activation
 *
 * Implements Collins & Loftus (1975) spreading activation for memory retrieval.
 * Unlike vector similarity search (RAG), this follows the connection graph,
 * activating related memories through associative links.
 *
 * Algorithm:
 * 1. SEED — Find initial activation nodes via FTS5 text search
 * 2. SPREAD — Propagate activation through connection graph with decay
 * 3. FILTER — Apply activation threshold and domain/version filtering
 * 4. BUDGET — Select top-N activated memories within token budget
 * 5. BUILD — Format retrieval payload with activation scores
 *
 * Reference: docs/02-core-algorithms/04-retrieval-engine.md
 */

/**
 * Determine if a memory is noise that should be filtered from recall results.
 * Canonical function — used in hook.ts, curator.ts, cleanup.ts.
 */
declare function isRecallNoise(content: string, type: string, tags?: string[]): boolean;

/**
 * Engram Hook CLI
 *
 * Lightweight CLI invoked by Claude Code hooks to feed events into Engram.
 * Designed for speed — initializes DB, processes one event, exits.
 *
 * Commands:
 *   pre-write              Check code against antipatterns (reads stdin)
 *   post-bash              Capture bash outcome / errors (reads stdin)
 *   post-write             Track file modifications (reads stdin)
 *   post-tool              Capture reasoning traces from generic tool use (reads stdin)
 *   notification           Process conversation event (reads stdin)
 *   session-start          Recall context + output to stdout
 *   session-end            Flush volatile state + light consolidation
 *   stop-watch             Watcher: escalating reminders based on turn count
 *   engram-used            Reset watcher counter (reads stdin for tool_name)
 *   pre-compact            Save session learnings before compaction
 *   prompt-check           Check prospective memories against prompt (reads stdin)
 *   subagent-stop          Capture subagent outcome as episodic memory (reads stdin)
 *
 * Data flow:
 *   Claude Code passes tool data as JSON on stdin.
 *   Commands also accept argv fallback for manual testing.
 *
 * Output:
 *   - Antipattern warnings → stdout (Claude sees them)
 *   - Watcher nudges → stdout (Claude sees them)
 *   - All other output → stderr (invisible to Claude)
 */

/**
 * Tracks byte consumption across output sections and enforces a hard cap.
 * Sections are appended with a priority tag — when the budget is exceeded,
 * lower-priority sections are truncated first.
 *
 * Exported for testing.
 */
declare class OutputBudget {
    private sections;
    private consumed;
    private _evicted;
    readonly maxBytes: number;
    constructor(maxBytes?: number);
    /**
     * Append content under a priority tag.
     * Returns true if the content was added (possibly truncated), false if completely skipped.
     * When budget is exceeded, evicts lower-priority sections to make room.
     *
     * @param tag - Section tag (maps to SECTION_PRIORITY for base priority)
     * @param content - Content to append
     * @param domainRelevance - Optional 0-1 domain relevance boost (effective priority += domainRelevance * 2)
     */
    append(tag: string, content: string, domainRelevance?: number): boolean;
    /** Total bytes consumed so far */
    get bytesUsed(): number;
    /** How many bytes remain in the budget */
    get bytesRemaining(): number;
    /** Get list of evicted section tags (for debugging/logging) */
    getEvicted(): string[];
    /**
     * Render all sections as a single string, joined by newlines.
     * Sections are output in insertion order (not re-sorted by priority).
     */
    toString(): string;
    /**
     * Flush the budget to stdout.
     * Only writes if there's content.
     */
    flush(): void;
}

export { OutputBudget, isRecallNoise };
