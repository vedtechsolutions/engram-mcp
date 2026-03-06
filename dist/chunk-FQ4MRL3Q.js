#!/usr/bin/env node

// src/const.ts
var RETRIEVAL = {
  /** Seed activation levels */
  SEED_ACTIVATION: {
    fts: 1,
    // FTS search results start at full activation
    antipattern: 0.9,
    // Antipatterns start high (immune priority)
    domain_backup: 0.5
    // Domain fallback seeds start lower
  },
  /** Minimum FTS results before falling back to domain seeds */
  MIN_SEEDS_FOR_DOMAIN_FALLBACK: 3,
  /** Connection type activation weights */
  CONNECTION_WEIGHT: {
    caused_by: 1.1,
    depends_on: 1,
    same_schema: 0.9,
    related: 0.8,
    cross_domain: 0.7,
    supersedes: 0.6,
    part_of: 0.9,
    contradicts: 0.4,
    speculative: 0.3
  },
  /** Default weight for unknown connection types */
  DEFAULT_CONNECTION_WEIGHT: 0.8,
  /** Lateral inhibition factor (activation reduction per competitor) */
  INHIBITION_FACTOR: 0.7,
  /** Max hops multiplier from autonomic modifier */
  MAX_HOPS_MODIFIER_CAP: 1.5,
  /** Max antipattern seeds during seeding (prevents flooding) */
  MAX_ANTIPATTERN_SEEDS: 5,
  /** Minimum reserved slots for TF-IDF semantic seeds */
  MIN_TFIDF_SLOTS: 3
};
var CONSOLIDATION = {
  /** Minimum keyword similarity for connection creation */
  MIN_SIMILARITY_FOR_CONNECTION: 0.15,
  /** Threshold for strong connection (similarity alone) */
  STRONG_SIMILARITY_THRESHOLD: 0.3,
  /** Hebbian strengthening increment per co-activation */
  HEBBIAN_STRENGTH_INCREMENT: 0.05,
  /** Connection strength multiplier for domain overlap */
  DOMAIN_OVERLAP_MULTIPLIER: 1.2,
  /** Connection strength multiplier for no domain overlap */
  NO_DOMAIN_OVERLAP_MULTIPLIER: 0.8,
  /** Pattern detection: keyword similarity threshold for cluster membership */
  PATTERN_SIMILARITY_THRESHOLD: 0.25,
  /** Schema formation: connection strength between cluster members */
  SCHEMA_CONNECTION_STRENGTH: 0.6,
  /** Common keyword threshold (fraction of cluster that must share keyword) */
  COMMON_KEYWORD_THRESHOLD: 0.3,
  // --- Embedding-based connection densification (Step 1) ---
  /** Minimum cosine similarity to create an embedding-based connection */
  EMBEDDING_CONNECTION_THRESHOLD: 0.45,
  /** Maximum embedding connections per consolidation cycle */
  MAX_EMBEDDING_CONNECTIONS_PER_CYCLE: 50,
  // --- Connection type inference thresholds (Step 2) ---
  /** Max age difference (hours) for error→fix causal inference (cross-session) */
  CAUSED_BY_MAX_AGE_DIFF_HOURS: 168,
  /** Minimum cosine similarity to infer supersedes relationship */
  SUPERSEDES_COSINE_THRESHOLD: 0.8,
  /** Minimum cosine similarity to infer contradicts relationship */
  CONTRADICTS_COSINE_THRESHOLD: 0.6,
  // --- Cross-project promotion (Phase 4) ---
  /** Minimum project occurrences before promoting to shared semantic */
  CROSS_PROJECT_MIN_OCCURRENCES: 2,
  /** Minimum TF-IDF cosine similarity for cross-project pattern matching */
  CROSS_PROJECT_SIMILARITY_THRESHOLD: 0.5,
  /** Maximum project DBs to scan during deep consolidation */
  MAX_PROJECT_DBS_TO_SCAN: 10,
  /** Connection strength for cross-project promotion links (promoted → source seed) */
  CROSS_PROJECT_CONNECTION_STRENGTH: 0.6
};
var HEBBIAN = {
  /** Strength increment per co-use in successful task */
  SUCCESS_INCREMENT: 0.08,
  /** Strength increment for co-use in any task (baseline) */
  BASELINE_INCREMENT: 0.03,
  /** Max pairs to process per session end */
  MAX_PAIRS_PER_SESSION: 100,
  /** Minimum co-retrieval count before strengthening */
  MIN_CO_RETRIEVALS: 2
};
var ACTIVATION_DRIVEN = {
  /** Max priority boost from activation profile */
  MAX_PRIORITY_BOOST: 3,
  /** Peak activation multiplier for boost calculation */
  PEAK_ACTIVATION_MULTIPLIER: 2,
  /** Minimum peak activation before boosting */
  MIN_PEAK_FOR_BOOST: 0.6
};
var AUTONOMIC = {
  /** Error rate threshold to switch to sympathetic mode */
  SYMPATHETIC_ERROR_RATE: 0.3,
  /** Error rate threshold to switch to parasympathetic mode */
  PARASYMPATHETIC_ERROR_RATE: 0.1,
  /** Sympathetic mode: significance threshold multiplier (lower = more encoding) */
  SYMPATHETIC_SIGNIFICANCE_MODIFIER: 0.7,
  /** Sympathetic mode: retrieval breadth multiplier (higher = wider search) */
  SYMPATHETIC_RETRIEVAL_MODIFIER: 1.5,
  /** Minimum events before allowing mode switch (prevents flapping) */
  MIN_EVENTS_FOR_MODE_SWITCH: 5
};
var HOOKS = {
  /** Significance threshold for creating antipattern from error */
  ERROR_ANTIPATTERN_THRESHOLD: 0.8,
  /** Emotional weight by hook event type */
  EMOTIONAL_WEIGHT: {
    error: 0.8,
    correction: 0.6,
    notification: 0.2,
    tool_result: 0.3,
    user_message: 0.3,
    session_start: 0.1,
    session_end: 0.1,
    default: 0.3
  },
  /** Encoding strength buffer added to significance score */
  ENCODING_STRENGTH_BUFFER: 0.1
};
var CONNECTION_DECAY = {
  /** Daily strength reduction per idle day (after grace period) */
  DECAY_RATE: 0.05,
  /** Below this strength → prune connection entirely */
  PRUNE_THRESHOLD: 0.05,
  /** Days of inactivity before decay begins */
  GRACE_PERIOD_DAYS: 3
};
var SPACED_REPETITION = {
  /** Base interval in days for first review */
  BASE_INTERVAL: 1,
  /** Multiplier applied per successful access (SM-2 doubling) */
  INTERVAL_MULTIPLIER: 2,
  /** Maximum review interval in days */
  MAX_REVIEW_INTERVAL: 365,
  /** Reinforcement boost per spaced access */
  ACCESS_BOOST: 1.15,
  /** Confidence boost on confirmed access */
  CONFIRMATION_BOOST: 1.05,
  /** Confidence decay on contradicted access */
  CONTRADICTION_DECAY: 0.7,
  /** Minimum access count before spaced scheduling applies */
  MIN_ACCESS_FOR_SCHEDULING: 2
};
var COMPACTION = {
  /** Minimum confidence for domain memories in post-compaction payload */
  DOMAIN_MEMORY_CONFIDENCE_THRESHOLD: 0.7,
  /** Max antipatterns included in compaction payload (critical/high first) */
  MAX_ANTIPATTERNS_IN_PAYLOAD: 20,
  /** Stopwords filtered from high_value_topics in recovery context */
  STOPWORDS: /* @__PURE__ */ new Set([
    "this",
    "that",
    "with",
    "from",
    "have",
    "been",
    "will",
    "just",
    "more",
    "some",
    "than",
    "them",
    "then",
    "they",
    "what",
    "when",
    "your",
    "also",
    "into",
    "very",
    "each",
    "much",
    "here",
    "both",
    "only",
    "does",
    "done",
    "make",
    "made",
    "like",
    "look",
    "need",
    "seem",
    "take",
    "want",
    "well",
    "based",
    "about",
    "after",
    "being",
    "could",
    "every",
    "first",
    "found",
    "given",
    "going",
    "hasn",
    "haven",
    "other",
    "quite",
    "really",
    "right",
    "shall",
    "should",
    "since",
    "still",
    "their",
    "there",
    "these",
    "thing",
    "think",
    "those",
    "three",
    "under",
    "until",
    "using",
    "which",
    "while",
    "would",
    "improve",
    "lets",
    "data",
    "good",
    "sure",
    "know",
    "work"
  ])
};
var PRE_COMPACTION = {
  /** Max decision summaries in understanding snapshot */
  MAX_KEY_DECISIONS: 3,
  /** Max chain summaries in understanding snapshot */
  MAX_ACTIVE_CHAINS: 3,
  /** Max open questions preserved */
  MAX_OPEN_QUESTIONS: 3,
  /** Max memory IDs in must_recall */
  MAX_MUST_RECALL_IDS: 5,
  /** Max high-value topics for targeted recall */
  MAX_HIGH_VALUE_TOPICS: 12,
  /** Max files to query for architecture delta */
  MAX_ARCH_DELTA_FILES: 15,
  /** Token budget for understanding narrative (chars ≈ tokens * 4) */
  NARRATIVE_TOKEN_BUDGET: 1500,
  /** Max length of continuation hint */
  MAX_CONTINUATION_HINT_LENGTH: 1e3,
  /** Max length of problem model */
  MAX_PROBLEM_MODEL_LENGTH: 300,
  /** Encoding strength for understanding memory */
  ENCODING_STRENGTH: 0.7,
  /** Confidence for understanding memory */
  ENCODING_CONFIDENCE: 0.6,
  /** Minimum session turns to generate understanding */
  MIN_TURNS_FOR_UNDERSTANDING: 2,
  /** Confidence score assigned per topic based on turn depth */
  CONFIDENCE_PER_TOPIC_TURN: 0.15,
  /** Max confidence for any single topic */
  MAX_TOPIC_CONFIDENCE: 0.95
};
var CONTEXT_PRESSURE = {
  /** Default context window size in tokens (Claude Opus) */
  DEFAULT_CONTEXT_WINDOW: 2e5,
  /** Percentage threshold to trigger proactive offload (0-100, lower = more aggressive) */
  OFFLOAD_THRESHOLD_PERCENT: 25,
  /** Number of trailing lines to scan in transcript for latest usage data */
  TRANSCRIPT_SCAN_LINES: 50,
  /** Minimum turns between context pressure checks (avoid overhead) */
  MIN_TURNS_BETWEEN_CHECKS: 3
};
var TRANSCRIPT_REASONING = {
  /** How many turns between reasoning extraction checks */
  EXTRACTION_INTERVAL_TURNS: 5,
  /** Max bytes to read from transcript tail for reasoning extraction */
  TAIL_BYTES: 6e4,
  /** Max number of assistant messages to scan per extraction (routine) */
  MAX_MESSAGES_TO_SCAN: 3,
  /** Max number of assistant messages to scan for post-compact recovery (deeper scan) */
  POST_COMPACT_MAX_MESSAGES: 10,
  /** Min length of reasoning text to be worth extracting */
  MIN_REASONING_LENGTH: 50,
  /** Max reasoning snippet length to encode */
  MAX_REASONING_SNIPPET: 300,
  /** Max reasoning memories per session */
  MAX_PER_SESSION: 15,
  /** Patterns that indicate explicit reasoning/conclusions */
  REASONING_PATTERNS: [
    /(?:the (?:root cause|issue|problem|bug|fix|solution) (?:is|was))\s+(.{30,300})/i,
    /(?:this (?:means|implies|shows|reveals|confirms))\s+(.{30,300})/i,
    /(?:I (?:found|discovered|realized|noticed) (?:that)?)\s+(.{30,300})/i,
    /(?:the key (?:insight|takeaway|learning|pattern) (?:is|was|here))\s+(.{30,200})/i,
    /(?:(?:so|therefore|thus|hence),?\s+)(.{30,200})/i,
    /(?:after (?:investigating|analyzing|examining|reviewing)),?\s+(.{30,300})/i,
    /(?:the (?:reason|explanation|cause) (?:is|was) (?:that)?)\s+(.{30,300})/i,
    /(?:(?:it turns out|it appears|looking at this) (?:that)?)\s+(.{30,300})/i,
    /(?:the (?:important|critical|key) (?:thing|part|detail) (?:is|here is))\s+(.{30,200})/i,
    /(?:(?:based on|given) (?:this|the|my)(?:\s\w+){0,3},?\s+)(.{30,200})/i
  ]
};
var DISTILLATION = {
  /** Minimum turns between distillation prompts */
  MIN_TURNS_BETWEEN_PROMPTS: 10,
  /** How many undistilled memories to include per prompt */
  MAX_MEMORIES_PER_PROMPT: 2,
  /** Minimum age (minutes) before a memory is eligible for distillation */
  MIN_AGE_MINUTES: 3,
  /** Maximum content length to show in distillation prompt */
  MAX_CONTENT_PREVIEW: 150
};
var ACTIVE_CONTEXT = {
  // --- 3.1: Dynamic injection throttling ---
  /** Context % remaining threshold → downgrade to 'medium' injection */
  THROTTLE_MEDIUM_THRESHOLD: 55,
  /** Context % remaining threshold → downgrade to 'low' injection */
  THROTTLE_LOW_THRESHOLD: 35,
  /** Context % remaining threshold → essential-only mode (antipatterns + errors only) */
  THROTTLE_ESSENTIAL_THRESHOLD: 20,
  /** Minimum turns before context-aware throttling kicks in (avoid early false positives) */
  THROTTLE_MIN_TURNS: 5,
  // --- 3.2: Confidence gating ---
  // NOTE: Already fully implemented via CONFIDENCE_GATING constants (Brain Phase 3.1).
  // Wired in handlePromptCheck Step 3e (gap detection, low confidence warnings, contradictions).
  // --- 3.3: Phase-aware injection boost ---
  /** Priority boost for memories matching current cognitive phase */
  PHASE_PRIORITY_BOOST: 2,
  /** Phase → preferred memory characteristics */
  PHASE_MEMORY_AFFINITY: {
    debugging: { preferred_tags: ["error", "fix", "antipattern", "error_narrative"], preferred_types: ["antipattern", "episodic"] },
    implementation: { preferred_tags: ["convention", "architecture", "pattern"], preferred_types: ["semantic", "procedural"] },
    validation: { preferred_tags: ["test", "validation", "verify"], preferred_types: ["procedural", "semantic"] },
    planning: { preferred_tags: ["decision", "architecture", "design"], preferred_types: ["semantic"] },
    exploration: { preferred_tags: [], preferred_types: [] }
  },
  // --- 3.4: Blind spot detection ---
  /** Min recall attempts before computing miss rate */
  BLIND_SPOT_MIN_QUERIES: 5,
  /** Miss rate above this → blind spot warning */
  BLIND_SPOT_MISS_THRESHOLD: 0.6,
  /** Max blind spots to surface per session start */
  MAX_BLIND_SPOTS: 3,
  // --- 3.5: Context status ---
  /** Show context status line every N turns */
  STATUS_INTERVAL_TURNS: 5
};
var SYNTHESIS = {
  /** Minimum memories in domain to produce synthesis */
  MIN_DOMAIN_MEMORIES: 5,
  /** Maximum concept clusters to extract */
  MAX_CLUSTERS: 5,
  /** Maximum memories per cluster */
  MAX_CLUSTER_SIZE: 20,
  /** Maximum decision memories to scan for principles */
  MAX_DECISIONS_SCANNED: 50,
  /** Encoding strength for synthesis memories */
  ENCODING_STRENGTH: 0.7,
  /** Encoding confidence for synthesis memories */
  ENCODING_CONFIDENCE: 0.7,
  /** Maximum key patterns to extract */
  MAX_KEY_PATTERNS: 5,
  /** Token budget for knowledge narrative (~4 chars/token) */
  NARRATIVE_TOKEN_BUDGET: 500,
  /** Minimum co_activation_count for cluster membership */
  CO_ACTIVATION_THRESHOLD: 2,
  /** Terms appearing in more than this fraction of memories are excluded (ubiquitous = uninformative) */
  MAX_DOCUMENT_FREQUENCY_RATIO: 0.7,
  /** Tags that are system metadata, not domain knowledge — excluded from key_patterns */
  SYSTEM_TAGS: /* @__PURE__ */ new Set([
    "antipattern",
    "vaccinated",
    "auto_encoded",
    "notification",
    "subagent",
    "discovery",
    "success",
    "lesson",
    "decision",
    "pre-compact",
    "session-narrative",
    "auto-encoded",
    "reasoning_trace",
    "user_message",
    "sentiment-neutral",
    "user_feedback",
    "synthesis",
    "domain-knowledge",
    "has_lesson",
    "has_cognition",
    "high",
    "critical",
    "medium",
    "pattern",
    "semantic",
    "episodic",
    "procedural"
  ]),
  /** Tag prefixes that are auto-generated metadata */
  SYSTEM_TAG_PREFIXES: ["subagent_", "disc_", "decision_", "rt_"]
};
var LIGHTWEIGHT_RECALL = {
  /** Maximum FTS5 seeds (vs 20 in full recall) */
  MAX_SEEDS: 5,
  /** Maximum spread hops (vs 4 in full recall) */
  MAX_HOPS: 1,
  /** Token budget for output (vs 2000 in full recall) */
  TOKEN_BUDGET: 500,
  /** Minimum prompt length to trigger recall */
  MIN_PROMPT_LENGTH: 20,
  /** Maximum memories returned */
  MAX_RESULTS: 3
};
var CONTEXTUAL_RECALL = {
  /** FTS5 seed limit — larger pool to avoid crowding out TF-IDF results */
  MAX_FTS_SEEDS: 20,
  /** TF-IDF candidates to scan — recency-ordered, larger pool catches new memories */
  TFIDF_SCAN_LIMIT: 80,
  /** Spreading activation hops (2 = meaningful association depth) */
  MAX_HOPS: 2,
  /** Token budget for output */
  TOKEN_BUDGET: 1500,
  /** Maximum memories returned */
  MAX_RESULTS: 8,
  /** Minimum prompt length to trigger contextual recall */
  MIN_PROMPT_LENGTH: 15,
  /** Maximum schemas to surface per recall */
  MAX_SCHEMAS: 3,
  /** Minimum schema confidence to surface */
  MIN_SCHEMA_CONFIDENCE: 0.5,
  /** Schema keyword overlap threshold */
  SCHEMA_MATCH_THRESHOLD: 0.2,
  /** Maximum procedural memories to include */
  MAX_PROCEDURAL: 2
};
var PROACTIVE_RECALL = {
  /** Maximum proactive injections per prompt check */
  MAX_INJECTIONS_PER_CHECK: 2,
  /** Minimum reinforcement for proactive injection */
  MIN_REINFORCEMENT: 1.1,
  /** Minimum confidence for proactive injection */
  MIN_CONFIDENCE: 0.6,
  /** Minimum turns between re-injecting the same memory */
  MIN_TURNS_BETWEEN_SAME: 5
};
var MEMORY_SURFACE = {
  /** Maximum memories surfaced per prompt check */
  MAX_SURFACE_ITEMS: 3,
  /** Candidate pool fetched from DB (wider pool = more rotation diversity) */
  CANDIDATE_POOL_SIZE: 15,
  /** Minimum turns before re-surfacing the same memory */
  MIN_TURNS_BETWEEN_SAME: 12,
  /** Minimum domain string length to trigger surface injection */
  MIN_DOMAIN_LENGTH: 2,
  /** Minimum confidence for surface injection */
  MIN_SURFACE_CONFIDENCE: 0.5,
  /** Minimum reinforcement for surface injection (below default 1.0 to allow fresh memories) */
  MIN_SURFACE_REINFORCEMENT: 0.5
};
var RETRIEVAL_FEEDBACK = {
  /** Maximum recalled memory IDs to track (ring buffer) */
  MAX_RECALLED_IDS: 20,
  /** Minimum keyword similarity to count as "used" */
  MIN_USAGE_SIMILARITY: 0.15,
  /** Reinforcement multiplier for used memories */
  REINFORCEMENT_BONUS: 1.2,
  /** Minimum embedding cosine similarity to count as "used" */
  MIN_EMBEDDING_USAGE_SIMILARITY: 0.25,
  /** Max chars of tool output to embed for usage check */
  USAGE_EMBEDDING_MAX_CHARS: 500,
  /** Reinforcement bonus for partial keyword overlap detection */
  PARTIAL_USAGE_BONUS: 1.1,
  /** Minimum partial keyword overlap ratio to count as partial usage */
  MIN_PARTIAL_KEYWORD_OVERLAP: 0.1
};
var SCHEMA_SURFACING = {
  /** Schema confidence threshold for strong intuition (INTUITION tag) */
  STRONG_CONFIDENCE: 0.8,
  /** Schema confidence threshold for moderate intuition (PATTERN tag) */
  MODERATE_CONFIDENCE: 0.6,
  /** Minimum relevance to surface a weak intuition */
  WEAK_MIN_RELEVANCE: 0.4,
  /** Activation boost applied to memories that are instances of a matched schema */
  INSTANCE_ACTIVATION_BOOST: 0.25,
  /** Maximum intuitions to surface per recall */
  MAX_INTUITIONS: 3,
  /** Minimum schema instances to qualify for intuition surfacing */
  MIN_INSTANCES: 2,
  /** Maximum description length for generated descriptions */
  MAX_DESCRIPTION_LENGTH: 200,
  /** Maximum instances to sample when generating a description */
  INSTANCE_SAMPLE_COUNT: 5
};
var CODE_CONTEXT_RECALL = {
  /** Maximum code identifiers to extract from content */
  MAX_CODE_KEYWORDS: 15,
  /** FTS5 seed limit (runs on every write/edit, moderate pool) */
  MAX_FTS_SEEDS: 8,
  /** TF-IDF candidates to scan */
  TFIDF_SCAN_LIMIT: 40,
  /** Token budget for output (tight — must not overwhelm pre-write) */
  TOKEN_BUDGET: 500,
  /** Maximum memories returned */
  MAX_RESULTS: 3,
  /** Maximum procedural memories */
  MAX_PROCEDURAL: 1,
  /** Minimum code content length to trigger recall (skip tiny edits) */
  MIN_CONTENT_LENGTH: 50,
  /** Minimum keyword similarity for procedural match */
  PROCEDURAL_MATCH_THRESHOLD: 0.15,
  /** Maximum conventions/standards to surface */
  MAX_CONVENTIONS: 2,
  /** Minimum activation score for pre-write pattern injection */
  MIN_PREWRITE_ACTIVATION: 0.4,
  /** Skip pre-write recall for N consecutive edits to same file */
  PREWRITE_COOLDOWN_PER_FILE: 3
};
var DEDUP = {
  /** Similarity threshold for blocking duplicate at encoding time */
  ENCODE_THRESHOLD: 0.9,
  /** Similarity threshold for merging during consolidation */
  CONSOLIDATION_THRESHOLD: 0.85
};
var SCHEMA_LIFECYCLE = {
  /** Confidence multiplier when memory assimilates into schema */
  ASSIMILATION_BOOST: 1.05,
  /** Cross-domain assimilation bonus */
  CROSS_DOMAIN_BOOST: 1.15,
  /** Confidence decay during accommodation (schema is adapting) */
  ACCOMMODATION_DECAY: 0.9,
  /** Similarity threshold for assimilation (memory fits schema well) */
  ASSIMILATION_THRESHOLD: 0.6,
  /** Similarity threshold for accommodation (memory almost fits) */
  ACCOMMODATION_THRESHOLD: 0.3,
  /** Minimum validations for principle promotion */
  PROMOTION_MIN_VALIDATIONS: 5,
  /** Minimum domains seen for principle promotion */
  PROMOTION_MIN_DOMAINS: 2,
  /** Minimum confidence for principle promotion */
  PROMOTION_MIN_CONFIDENCE: 0.7,
  /** Maximum false positive rate for promotion */
  PROMOTION_MAX_FP_RATE: 0.1
};
var TRANSFER = {
  /** Minimum relation type similarity for alignment candidate */
  RELATION_MATCH_THRESHOLD: 0.6,
  /** Bonus multiplied per higher-order relation in alignment */
  SYSTEMATICITY_BONUS: 0.5,
  /** Confidence discount for transferred knowledge */
  TRANSFER_DISCOUNT: 0.7,
  /** Minimum alignment score to proceed with transfer */
  MIN_ALIGNMENT_SCORE: 0.5,
  /** Max candidate patterns to evaluate per alignment */
  MAX_ALIGNMENT_CANDIDATES: 20
};
var ANTICIPATORY = {
  /** Activation boost for domain-related memories during pre-warming */
  DOMAIN_BOOST: 0.15,
  /** Activation level for pre-loaded immune memories */
  PRELOAD_ACTIVATION: 0.3,
  /** Maximum memories to pre-warm per session */
  MAX_PRELOAD: 20,
  /** Minimum confidence for memories to be pre-loaded */
  MIN_PRELOAD_CONFIDENCE: 0.5
};
var VALIDATION = {
  /** Per-perspective agreement threshold */
  AGREEMENT_THRESHOLD: 0.5,
  /** Consensus threshold for confident match (>= this = confident) */
  CONFIDENCE_THRESHOLD: 0.6,
  /** Below CONFIDENCE but above this = uncertain */
  UNCERTAIN_THRESHOLD: 0.4,
  /** Weights for each validation perspective */
  PERSPECTIVE_WEIGHT: {
    syntax: 1,
    error_type: 1,
    fix_type: 0.9,
    domain: 0.8,
    security: 1.1
  }
};
var WORKING_MEMORY = {
  /** Maximum items in working memory (Miller's Law: 7 ± 2) */
  MAX_CAPACITY: 7,
  /** Encoding reinforcement boost for rehearsed items when flushed */
  REHEARSAL_BOOST: 0.1,
  /** Eviction priority for antipatterns (stick longest) */
  PRIORITY_ANTIPATTERN: 1,
  /** Default eviction priority */
  PRIORITY_DEFAULT: 0.5,
  /** Minutes before items lose priority due to staleness */
  STALENESS_MINUTES: 30
};
var PRIMING = {
  /** Activation boost for primed memories during seeding (+0.3 per plan spec) */
  BOOST: 0.3,
  /** Half-life of priming in minutes (decays exponentially) */
  HALF_LIFE_MINUTES: 5,
  /** Maximum neighbors to prime per recalled memory */
  MAX_NEIGHBORS_PER_MEMORY: 3,
  /** Maximum total primed nodes (prevents memory bloat) */
  MAX_PRIMED: 15,
  /** Minimum connection strength to follow for priming */
  MIN_CONNECTION_STRENGTH: 0.3,
  /** Activation floor — primes below this are cleaned up */
  DECAY_FLOOR: 0.01,
  /** Base priming activation for directly primed neighbors */
  BASE_ACTIVATION: 0.2
};
var REASONING_TRACE = {
  /** Maximum tool calls buffered for pattern detection */
  MAX_BUFFER_SIZE: 20,
  /** Minimum consecutive search tools to detect an investigation */
  MIN_INVESTIGATION_TOOLS: 3,
  /** Time window for grouping tool calls into a sequence (minutes) */
  SEQUENCE_WINDOW_MINUTES: 10,
  /** Minimum Agent prompt length to consider as significant delegation */
  MIN_AGENT_PROMPT_LENGTH: 50,
  /** Minimum tool output length to consider processing (skip empty results) */
  MIN_OUTPUT_LENGTH: 20,
  /** Encoding strength for reasoning traces */
  ENCODING_STRENGTH: 0.6,
  /** Confidence for auto-detected reasoning (lower than explicit learning) */
  CONFIDENCE: 0.5,
  /** Maximum reasoning traces per session (raised for Engram-as-primary-memory) */
  MAX_PER_SESSION: 30,
  /** Cooldown between traces in seconds */
  COOLDOWN_MINUTES: 0.5,
  /** Tools considered "search" tools for investigation detection */
  SEARCH_TOOLS: ["Read", "Grep", "Glob"],
  /** Tools that validate an approach (successful test/compile) */
  VALIDATION_TOOLS: ["Bash"],
  /** Tools that indicate a strategic decision */
  DECISION_TOOLS: ["Agent"]
};
var FEEDBACK = {
  /** Minimum prompt length to attempt feedback detection (skip single words like "ok") */
  MIN_PROMPT_LENGTH: 2,
  /** Maximum recent memories to strengthen/weaken on feedback */
  MAX_AFFECTED_MEMORIES: 5,
  /** Confidence boost per approval signal (diminishing: boost * (1 - current)) */
  APPROVAL_CONFIDENCE_BOOST: 0.1,
  /** Reinforcement multiplier on approval */
  APPROVAL_REINFORCEMENT_BOOST: 1.15,
  /** Confidence penalty on correction (multiplicative decay) */
  CORRECTION_CONFIDENCE_DECAY: 0.85,
  /** Encoding strength for correction memories (high — learn from mistakes) */
  CORRECTION_ENCODING_STRENGTH: 0.8,
  /** Encoding strength for instruction memories (maximum — user directive) */
  INSTRUCTION_ENCODING_STRENGTH: 1,
  /** Confidence for instruction memories (user said it explicitly) */
  INSTRUCTION_CONFIDENCE: 0.95,
  /** Emotional weight for frustration signals */
  FRUSTRATION_EMOTIONAL_WEIGHT: 0.9,
  /** Encoding strength for frustration-derived antipatterns */
  FRUSTRATION_ENCODING_STRENGTH: 0.9,
  /** Maximum feedback encodings per session (prevent runaway encoding) */
  MAX_PER_SESSION: 15,
  /** Cooldown between feedback encodings in seconds (shorter than reasoning traces) */
  COOLDOWN_SECONDS: 30,
  /** Approval signal patterns (matched case-insensitively) */
  APPROVAL_PATTERNS: [
    "perfect",
    "great",
    "excellent",
    "exactly",
    "nice",
    "good job",
    "well done",
    "that works",
    "looks good",
    "thank you",
    "thanks",
    "awesome",
    "love it",
    "nailed it",
    "spot on",
    "correct",
    "right",
    "yes that",
    "yes!",
    "beautiful",
    "wonderful",
    "brilliant",
    "fantastic"
  ],
  /** Correction signal patterns */
  CORRECTION_PATTERNS: [
    "no,",
    "no.",
    "that's wrong",
    "that is wrong",
    "not what i",
    "fix this",
    "that's not",
    "that is not",
    "incorrect",
    "don't do that",
    "shouldn't",
    "should not",
    "wrong",
    "that's broken",
    "doesn't work",
    "does not work",
    "not right",
    "try again",
    "redo",
    "revert",
    "undo that"
  ],
  /** Frustration signal patterns (repeated failure, exasperation) */
  FRUSTRATION_PATTERNS: [
    "again?",
    "again!",
    "i told you",
    "i already said",
    "i already told",
    "how many times",
    "wrong again",
    "still wrong",
    "still broken",
    "not again",
    "same mistake",
    "same error",
    "same issue",
    "same problem",
    "stop doing",
    "keep getting",
    "keeps happening"
  ],
  /** Instruction signal patterns (teaching/directive) */
  INSTRUCTION_PATTERNS: [
    "always ",
    "never ",
    "remember that",
    "remember to",
    "from now on",
    "going forward",
    "in the future",
    "make sure to",
    "make sure you",
    "don't forget",
    "do not forget",
    "keep in mind",
    "the rule is",
    "the convention is",
    "we always",
    "we never",
    "standard is",
    "preferred way",
    "best practice"
  ],
  /** Words/phrases that indicate NOT feedback (questions, code, context) */
  ANTI_PATTERNS: [
    "can you",
    "could you",
    "would you",
    "please",
    "how do",
    "what is",
    "what are",
    "where is",
    "why does",
    "why is",
    "implement",
    "create",
    "add",
    "build",
    "write",
    "make",
    "refactor",
    "update",
    "modify",
    "change",
    "delete",
    "remove",
    "def ",
    "class ",
    "function ",
    "import ",
    "from ",
    "const ",
    "```",
    "http://",
    "https://"
  ]
};
var DISCOVERY = {
  /** Maximum discoveries per session (raised for broader capture) */
  MAX_PER_SESSION: 25,
  /** Cooldown between discoveries in seconds */
  COOLDOWN_MINUTES: 0.5,
  /** Encoding strength for discoveries (medium-high — discoveries are valuable) */
  ENCODING_STRENGTH: 0.7,
  /** Confidence for auto-detected discoveries (moderate — may be refined) */
  CONFIDENCE: 0.55,
  /** Minimum file matches in Grep/Glob to trigger pattern_found */
  MIN_PATTERN_FILES: 2,
  /** Maximum file matches — above this the pattern is too common to be interesting */
  MAX_PATTERN_FILES: 25,
  /** Minimum search pattern length (skip trivial patterns) */
  MIN_PATTERN_LENGTH: 3,
  /** Minimum search tools in reasoning buffer for error_resolution */
  MIN_INVESTIGATION_SEARCHES: 2,
  /** Architecture-indicating path segments (broadened to capture more code structure) */
  ARCHITECTURE_PATHS: [
    "models/",
    "controllers/",
    "services/",
    "engines/",
    "core/",
    "middleware/",
    "api/",
    "handlers/",
    "schemas/",
    "routes/",
    "providers/",
    "repositories/",
    "components/",
    "hooks/",
    "storage/",
    "views/",
    "wizard/",
    "utils/",
    "lib/",
    "tools/",
    "config/",
    "types/",
    "interfaces/",
    "src/",
    "tests/",
    "spec/"
  ],
  /** Minimum code definitions for architecture insight */
  MIN_CODE_DEFINITIONS: 2,
  /** Maximum output chars to scan for definitions (performance guard) */
  MAX_SCAN_LENGTH: 1e4,
  /** File extension to domain mapping */
  EXTENSION_DOMAIN_MAP: {
    py: "python",
    ts: "typescript",
    js: "javascript",
    xml: "odoo",
    css: "css",
    scss: "scss",
    sql: "sql",
    rs: "rust",
    go: "go",
    java: "java",
    rb: "ruby",
    php: "php"
  }
};
var CONVERSATION = {
  /** Maximum entries in topic history (ring buffer) */
  MAX_TOPIC_HISTORY: 10,
  /** Maximum decision points tracked per session */
  MAX_DECISION_POINTS: 10,
  /** Maximum open questions tracked */
  MAX_OPEN_QUESTIONS: 5,
  /** Minimum prompt length to attempt topic extraction */
  MIN_PROMPT_LENGTH: 15,
  /** Keyword similarity below this = topic has changed */
  TOPIC_CHANGE_THRESHOLD: 0.3,
  /** Maximum keywords per topic string */
  MAX_TOPIC_KEYWORDS: 5,
  /** Minimum turns on a topic before it's worth recording in history */
  MIN_TOPIC_TURNS: 1,
  /** Patterns that indicate a decision was made (matched case-insensitively) */
  DECISION_PATTERNS: [
    "decided to",
    "going with",
    "chose ",
    "choosing ",
    "let's use",
    "i'll use",
    "we'll use",
    "approach:",
    "strategy:",
    "plan:",
    "switching to",
    "opted for",
    "settled on"
  ],
  /** Patterns that indicate an open question (matched case-insensitively) */
  QUESTION_INDICATORS: [
    "?",
    "how do",
    "how to",
    "what is",
    "what are",
    "where is",
    "why does",
    "why is",
    "should i",
    "should we",
    "which one",
    "what if",
    "is there",
    "are there",
    "can we",
    "could we"
  ],
  /** Anti-patterns: skip questions that are really task requests */
  QUESTION_ANTI_PATTERNS: [
    "can you",
    "could you",
    "would you",
    "please ",
    "implement",
    "create",
    "add ",
    "build ",
    "write ",
    "fix ",
    "update ",
    "refactor"
  ]
};
var CONFIDENCE_GATING = {
  /** Below this domain confidence → inject low-confidence warning */
  LOW_CONFIDENCE_THRESHOLD: 0.4,
  /** Below this memory count → considered a knowledge gap */
  GAP_MEMORY_THRESHOLD: 3,
  /** Maximum contradictions to surface (don't overwhelm Claude) */
  MAX_CONTRADICTIONS: 2,
  /** Minimum memories needed to calculate meaningful domain confidence */
  MIN_MEMORIES_FOR_CONFIDENCE: 2,
  /** Weight for recalled memory confidence vs domain average */
  RECALL_CONFIDENCE_WEIGHT: 0.6,
  /** Weight for domain-level confidence */
  DOMAIN_CONFIDENCE_WEIGHT: 0.4,
  /** Minimum episodic memories scanned for last success/failure */
  MAX_EPISODIC_SCAN: 20,
  /** Connection strength below which 'contradicts' connections are ignored */
  MIN_CONTRADICTION_STRENGTH: 0.2
};
var BLIND_SPOT_DETECTION = {
  /** Below this memory count → knowledge gap (high severity) */
  KNOWLEDGE_GAP_THRESHOLD: 3,
  /** Below this memory count → sparse knowledge (medium severity) */
  SPARSE_KNOWLEDGE_THRESHOLD: 8,
  /** Error rate above this → high error blind spot */
  HIGH_ERROR_RATE_THRESHOLD: 0.4,
  /** Error rate above this → medium error blind spot */
  MEDIUM_ERROR_RATE_THRESHOLD: 0.25,
  /** Correction rate above this → reliability concern */
  HIGH_CORRECTION_RATE_THRESHOLD: 0.3,
  /** Recall quality below this → low recall quality blind spot */
  LOW_RECALL_QUALITY_THRESHOLD: 0.3,
  /** Minimum metrics needed to calculate meaningful rates */
  MIN_METRICS_FOR_RATE: 3,
  /** Maximum blind spots to surface at session start (avoid noise) */
  MAX_SESSION_START_WARNINGS: 3,
  /** Maximum blind spots to surface per prompt check */
  MAX_PROMPT_WARNINGS: 1,
  /** Minimum domain memories to even consider error rate (avoid noise on tiny samples) */
  MIN_DOMAIN_MEMORIES_FOR_RATE: 2,
  /** Token budget for blind spot block at session start */
  INJECTION_TOKEN_BUDGET: 200
};
var LEARNING_GOALS = {
  /** Maximum active learning goals (prevent goal overload) */
  MAX_ACTIVE_GOALS: 10,
  /** Default priority for auto-generated goals (from blind spots) */
  AUTO_PRIORITY: 0.5,
  /** Default priority for user-created goals */
  USER_PRIORITY: 1,
  /** Default target confidence to consider a goal achieved */
  DEFAULT_TARGET_CONFIDENCE: 0.7,
  /** Significance threshold reduction for goal-matching content (multiplicative) */
  SIGNIFICANCE_BOOST: 0.7,
  /** Minimum keyword overlap to consider content matching a goal */
  KEYWORD_MATCH_THRESHOLD: 0.15,
  /** Maximum goals to surface at session start */
  MAX_SESSION_START_DISPLAY: 3,
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 150,
  /** Minimum blind spot severity to auto-create a goal */
  MIN_BLIND_SPOT_SEVERITY: "medium",
  /** Days of inactivity before auto-generated goals are abandoned */
  AUTO_ABANDON_DAYS: 30
};
var IDENTITY = {
  // List caps
  /** Maximum tracked strengths */
  MAX_STRENGTHS: 10,
  /** Maximum tracked weaknesses */
  MAX_WEAKNESSES: 10,
  /** Maximum stored user preferences */
  MAX_USER_PREFERENCES: 20,
  /** Maximum frustration triggers */
  MAX_FRUSTRATION_TRIGGERS: 10,
  /** Maximum satisfaction triggers */
  MAX_SATISFACTION_TRIGGERS: 10,
  /** Maximum common tasks */
  MAX_COMMON_TASKS: 10,
  /** Maximum preferred approaches */
  MAX_PREFERRED_APPROACHES: 15,
  // Proficiency thresholds
  /** Proficiency score above which a domain is a strength */
  STRENGTH_THRESHOLD: 0.65,
  /** Proficiency score below which a domain is a weakness */
  WEAKNESS_THRESHOLD: 0.35,
  /** Minimum tasks before classifying a domain */
  MIN_TASKS_FOR_CLASSIFICATION: 3,
  /** Weight of average memory confidence in proficiency score */
  MEMORY_CONFIDENCE_WEIGHT: 0.4,
  /** Weight of success ratio in proficiency score */
  SUCCESS_RATIO_WEIGHT: 0.6,
  // Trust evolution
  /** Initial trust level for new users */
  INITIAL_TRUST: 0.5,
  /** Trust boost per approval (diminishing toward ceiling) */
  APPROVAL_TRUST_BOOST: 0.02,
  /** Multiplicative trust decay per correction */
  CORRECTION_TRUST_DECAY: 0.98,
  /** Multiplicative trust decay per frustration signal */
  FRUSTRATION_TRUST_DECAY: 0.95,
  /** Trust floor (always recoverable) */
  TRUST_FLOOR: 0.1,
  /** Trust ceiling */
  TRUST_CEILING: 0.95,
  // Preferences
  /** Initial strength for a newly captured preference */
  PREFERENCE_INITIAL_STRENGTH: 0.5,
  /** Strength boost when a preference is reinforced */
  PREFERENCE_REINFORCE_BOOST: 0.15,
  // Injection
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 300,
  /** Maximum items per injection section */
  MAX_INJECTION_ITEMS: 3,
  // String limits
  /** Maximum length for communication_style */
  MAX_STYLE_LENGTH: 200,
  /** Maximum length for last_session_summary */
  MAX_SESSION_SUMMARY_LENGTH: 500,
  /** Maximum length for ongoing_context */
  MAX_ONGOING_CONTEXT_LENGTH: 300,
  /** Maximum length for evidence trail */
  MAX_EVIDENCE_LENGTH: 200,
  /** Maximum length for preference description */
  MAX_PREFERENCE_DESCRIPTION_LENGTH: 200
};
var SESSION_NARRATIVE = {
  /** Minimum turns before composing a narrative (below this → basic summary only) */
  MIN_TURNS_FOR_NARRATIVE: 3,
  /** Turns threshold for a richer narrative with more detail */
  MIN_TURNS_FOR_RICH_NARRATIVE: 8,
  /** Maximum length of the composed narrative text (characters) */
  MAX_NARRATIVE_LENGTH: 800,
  /** Maximum challenges to include */
  MAX_CHALLENGES: 5,
  /** Maximum lessons to include */
  MAX_LESSONS: 5,
  /** Maximum unfinished items to include */
  MAX_UNFINISHED: 3,
  /** Encoding strength for narrative memories (higher than plain summaries at 0.5) */
  ENCODING_STRENGTH: 0.7,
  /** Encoding confidence for narrative memories */
  ENCODING_CONFIDENCE: 0.6,
  /** Base emotional weight for sessions */
  BASE_EMOTIONAL_WEIGHT: 0.3,
  /** Emotional weight boost per error encountered */
  ERROR_WEIGHT_BOOST: 0.05,
  /** Emotional weight boost per correction received */
  CORRECTION_WEIGHT_BOOST: 0.1,
  /** Emotional weight boost per frustration signal */
  FRUSTRATION_WEIGHT_BOOST: 0.15,
  /** Emotional weight reduction per approval signal */
  APPROVAL_WEIGHT_REDUCE: 0.03,
  /** Maximum emotional weight (cap) */
  MAX_EMOTIONAL_WEIGHT: 0.9,
  /** Minimum emotional weight (floor) */
  MIN_EMOTIONAL_WEIGHT: 0.1,
  /** Maximum challenge text length */
  MAX_CHALLENGE_LENGTH: 120,
  /** Maximum lesson text length */
  MAX_LESSON_LENGTH: 120
};
var RELATIONSHIP = {
  // Collection caps
  /** Maximum trust snapshots to retain */
  MAX_TRUST_SNAPSHOTS: 30,
  /** Maximum topic affinities to track */
  MAX_TOPIC_AFFINITIES: 20,
  /** Maximum session interactions to retain */
  MAX_SESSION_INTERACTIONS: 50,
  // Topic affinity
  /** Recency decay factor applied per session to existing topics (0.9 = 10% decay per session) */
  TOPIC_RECENCY_DECAY: 0.9,
  /** Minimum recency weight before eviction */
  TOPIC_MIN_WEIGHT: 0.05,
  // Correction frequency EMA
  /** Exponential moving average alpha for correction rate (higher = more responsive) */
  CORRECTION_EMA_ALPHA: 0.3,
  // Relationship depth scoring
  /** Weight of session count (sigmoid) in depth score */
  DEPTH_SESSION_WEIGHT: 0.25,
  /** Weight of trust stability in depth score */
  DEPTH_TRUST_STABILITY_WEIGHT: 0.25,
  /** Weight of topic diversity in depth score */
  DEPTH_TOPIC_DIVERSITY_WEIGHT: 0.2,
  /** Weight of interaction quality in depth score */
  DEPTH_QUALITY_WEIGHT: 0.3,
  /** Sigmoid midpoint for session count (at this many sessions, session factor = 0.5) */
  DEPTH_SESSION_MIDPOINT: 15,
  // Communication style detection
  /** Minimum sessions before style classification is attempted */
  MIN_SESSIONS_FOR_STYLE: 5,
  /** Average message length below this = concise */
  CONCISE_THRESHOLD: 80,
  /** Average message length above this = verbose */
  VERBOSE_THRESHOLD: 300,
  /** Jargon ratio above which = advanced */
  ADVANCED_JARGON_THRESHOLD: 0.15,
  /** Code ratio above which = code_heavy */
  CODE_HEAVY_THRESHOLD: 0.4,
  // Behavioral preferences
  /** Maximum behavioral preferences to track */
  MAX_BEHAVIORAL_PREFERENCES: 10,
  /** Minimum sessions a pattern must appear in to be a preference */
  MIN_PATTERN_SESSIONS: 3,
  // Injection
  /** Token budget for relationship section in session-start injection */
  INJECTION_TOKEN_BUDGET: 80
};
var MASTERY = {
  // Level-up thresholds (minimum practice_count to qualify)
  /** Practices to advance from novice → advanced_beginner */
  ADVANCED_BEGINNER_PRACTICES: 3,
  /** Practices to advance from advanced_beginner → competent */
  COMPETENT_PRACTICES: 8,
  /** Practices to advance from competent → proficient */
  PROFICIENT_PRACTICES: 20,
  /** Practices to advance from proficient → expert */
  EXPERT_PRACTICES: 50,
  // Success rate thresholds for level-up
  /** Minimum success rate for advanced_beginner */
  ADVANCED_BEGINNER_SUCCESS_RATE: 0.5,
  /** Minimum success rate for competent */
  COMPETENT_SUCCESS_RATE: 0.65,
  /** Minimum success rate for proficient */
  PROFICIENT_SUCCESS_RATE: 0.8,
  /** Minimum success rate for expert */
  EXPERT_SUCCESS_RATE: 0.9,
  // Regression thresholds
  /** Success rate drop below this fraction of level requirement triggers regression check */
  REGRESSION_FACTOR: 0.7,
  /** Minimum recent failures to trigger regression (prevents noise) */
  REGRESSION_MIN_FAILURES: 2,
  /** Recent window (practices) examined for regression */
  REGRESSION_WINDOW: 5,
  // Evidence management
  /** Maximum evidence entries retained per profile */
  MAX_EVIDENCE: 20,
  // Antipattern integration
  /** Antipattern trigger rate threshold below which = higher mastery signal */
  LOW_ANTIPATTERN_TRIGGER_RATE: 0.05,
  // Spaced repetition (Leitner-inspired)
  /** Base interval for review (days) */
  BASE_REVIEW_INTERVAL_DAYS: 3,
  /** Interval multiplier per level (higher level = longer between reviews) */
  REVIEW_INTERVAL_MULTIPLIER: 2.5,
  // Zone of proximal development
  /** Maximum ZPD suggestions per profile */
  MAX_ZPD_ITEMS: 5,
  // Injection
  /** Token budget for mastery section in session-start injection */
  INJECTION_TOKEN_BUDGET: 100,
  /** Maximum mastery profiles to show in injection */
  INJECTION_MAX_PROFILES: 5,
  // Caps
  /** Maximum mastery profiles per domain */
  MAX_PROFILES_PER_DOMAIN: 20,
  /** Maximum total mastery profiles */
  MAX_TOTAL_PROFILES: 200
};
var SCAFFOLDING = {
  // Memory result caps per mastery level (higher mastery = fewer, more targeted results)
  /** Max recall results for novice level */
  NOVICE_MAX_RESULTS: 8,
  /** Max recall results for advanced_beginner level */
  ADVANCED_BEGINNER_MAX_RESULTS: 6,
  /** Max recall results for competent level */
  COMPETENT_MAX_RESULTS: 5,
  /** Max recall results for proficient level */
  PROFICIENT_MAX_RESULTS: 4,
  /** Max recall results for expert level */
  EXPERT_MAX_RESULTS: 3,
  // Procedural memory inclusion (novice gets full how-to, expert gets none)
  /** Max procedural memories included for novice */
  NOVICE_MAX_PROCEDURAL: 3,
  /** Max procedural memories included for advanced_beginner */
  ADVANCED_BEGINNER_MAX_PROCEDURAL: 2,
  /** Max procedural memories included for competent */
  COMPETENT_MAX_PROCEDURAL: 1,
  /** Max procedural memories included for proficient (edge cases only) */
  PROFICIENT_MAX_PROCEDURAL: 0,
  /** Max procedural memories included for expert */
  EXPERT_MAX_PROCEDURAL: 0,
  // Schema inclusion (novice needs basics, expert gets cross-domain connections)
  /** Max schema matches for novice level */
  NOVICE_MAX_SCHEMAS: 1,
  /** Max schema matches for advanced_beginner level */
  ADVANCED_BEGINNER_MAX_SCHEMAS: 1,
  /** Max schema matches for competent level */
  COMPETENT_MAX_SCHEMAS: 2,
  /** Max schema matches for proficient level */
  PROFICIENT_MAX_SCHEMAS: 3,
  /** Max schema matches for expert level */
  EXPERT_MAX_SCHEMAS: 3,
  // Cross-domain analogy (only for low-mastery domains)
  /** Enable cross-domain analogies from mastered domains */
  ANALOGY_ENABLED: true,
  /** Maximum mastery level that receives analogies (0=novice, 1=adv_beginner) */
  ANALOGY_MAX_LEVEL_ORDER: 1,
  /** Max cross-domain analogy results */
  ANALOGY_MAX_RESULTS: 2,
  /** Minimum mastery level order to serve as analogy source (2=competent) */
  ANALOGY_SOURCE_MIN_LEVEL_ORDER: 2,
  // Content truncation per level (novice gets full content, expert gets summaries)
  /** Content truncation length for novice */
  NOVICE_CONTENT_LENGTH: 300,
  /** Content truncation length for advanced_beginner */
  ADVANCED_BEGINNER_CONTENT_LENGTH: 250,
  /** Content truncation length for competent */
  COMPETENT_CONTENT_LENGTH: 200,
  /** Content truncation length for proficient */
  PROFICIENT_CONTENT_LENGTH: 150,
  /** Content truncation length for expert */
  EXPERT_CONTENT_LENGTH: 100,
  // Memory type priorities per level
  // novice: prioritize antipatterns + procedural (warnings + steps)
  // competent: prioritize episodic + semantic (approaches + trade-offs)
  // expert: prioritize antipatterns with high severity only (novel/unusual)
  /** Activation boost for antipatterns at novice level */
  NOVICE_ANTIPATTERN_BOOST: 1.4,
  /** Activation boost for procedural memories at novice level */
  NOVICE_PROCEDURAL_BOOST: 1.3,
  /** Activation boost for episodic memories at competent level (trade-offs, approaches) */
  COMPETENT_EPISODIC_BOOST: 1.2,
  /** Minimum antipattern severity to include at expert level */
  EXPERT_MIN_ANTIPATTERN_SEVERITY: "high"
};
var MASTERY_LEVEL_ORDER = {
  novice: 0,
  advanced_beginner: 1,
  competent: 2,
  proficient: 3,
  expert: 4
};
var PROGRESSION = {
  // Prerequisite defaults
  /** Default mastery level required to satisfy a prerequisite */
  DEFAULT_REQUIRED_LEVEL: "advanced_beginner",
  // ZPD computation
  /** Maximum "next" skills (immediately learnable) in ZPD */
  MAX_ZPD_NEXT: 5,
  /** Maximum "stretch" skills (2+ steps ahead) in ZPD */
  MAX_ZPD_STRETCH: 3,
  /** When computing ZPD without explicit paths, how many related skills to suggest */
  MAX_INFERRED_SUGGESTIONS: 4,
  // Learning path generation
  /** Maximum steps in a single learning path */
  MAX_PATH_LENGTH: 15,
  // Auto-discovery of prerequisites
  /** Keyword similarity threshold for inferring skill relatedness */
  SKILL_SIMILARITY_THRESHOLD: 0.2,
  /** Minimum mastery profiles needed in a domain to attempt auto-path generation */
  MIN_PROFILES_FOR_AUTO_PATH: 3,
  // Error classification
  /** Keyword similarity threshold for matching errors to skills */
  ERROR_SKILL_MATCH_THRESHOLD: 0.15,
  // Integration
  /** Refresh ZPD automatically when mastery level changes */
  REFRESH_ZPD_ON_LEVEL_CHANGE: true,
  // Injection
  /** Maximum ZPD items to show in session-start injection */
  MAX_ZPD_INJECTION_ITEMS: 3,
  /** Token budget for ZPD section in session-start injection */
  INJECTION_TOKEN_BUDGET: 80
};
var TEACHING = {
  /** Minimum prompt length to attempt teaching detection */
  MIN_PROMPT_LENGTH: 10,
  /** Anti-pattern score threshold to reject (task requests, code) */
  ANTI_PATTERN_THRESHOLD: 2,
  /** Minimum Claude mastery order to teach (2 = competent) */
  MIN_MASTERY_ORDER: 2,
  /** Maximum depth level (0=basics, 1=explanation, 2=reasoning, 3=deep-dive) */
  MAX_DEPTH: 3,
  /** Window for "recently taught" concepts (7 days) */
  RECENT_WINDOW_MS: 7 * 24 * 60 * 60 * 1e3,
  /** Maximum taught concepts tracked per relationship */
  MAX_TAUGHT_CONCEPTS: 100,
  /** Keyword similarity threshold for matching taught topics */
  TOPIC_MATCH_THRESHOLD: 0.3,
  /** Maximum hint length in characters */
  MAX_HINT_LENGTH: 250,
  /** Explanation request patterns: "how does X work?" */
  EXPLANATION_PATTERNS: [
    "how does",
    "how do",
    "how is",
    "how are",
    "explain",
    "can you explain",
    "could you explain",
    "walk me through",
    "help me understand",
    "what happens when",
    "how would",
    "how can",
    "tell me about",
    "describe how"
  ],
  /** Concept question patterns: "what is X?" */
  CONCEPT_PATTERNS: [
    "what is",
    "what are",
    "what does",
    "define",
    "definition of",
    "meaning of",
    "what do you mean",
    "what exactly is",
    "what's the concept"
  ],
  /** Reasoning question patterns: "why does X?" */
  REASONING_PATTERNS: [
    "why does",
    "why do",
    "why is",
    "why are",
    "what's the reason",
    "what is the reason",
    "why would",
    "why should",
    "why not",
    "what's the purpose"
  ],
  /** Comparison request patterns: "difference between X and Y" */
  COMPARISON_PATTERNS: [
    "difference between",
    "differences between",
    "compare",
    "comparison",
    "versus",
    " vs ",
    "which is better",
    "pros and cons",
    "how does .* differ"
  ],
  /** Anti-patterns: task requests, code, commands — NOT teaching */
  TASK_ANTI_PATTERNS: [
    "fix",
    "implement",
    "create",
    "build",
    "add",
    "update",
    "delete",
    "remove",
    "install",
    "run",
    "execute",
    "deploy",
    "migrate",
    "refactor",
    "debug"
  ],
  /** Depth labels for hint formatting */
  DEPTH_LABELS: ["basics", "explanation", "reasoning/why", "deep-dive"],
  /** Depth guidance for hint formatting */
  DEPTH_GUIDANCE: [
    "definition + basic usage",
    "examples + context",
    "WHY \u2014 trade-offs, design decisions",
    "deep-dive: edge cases, internals"
  ],
  /** Base depth by signal type (used for never-taught concepts) */
  BASE_DEPTH: {
    explanation_request: 1,
    concept_question: 0,
    reasoning_question: 2,
    comparison_request: 1,
    progressive_question: 1
  }
};
var ARCHITECTURE = {
  /** Maximum architecture nodes per module */
  MAX_NODES_PER_MODULE: 50,
  /** Maximum edges per node */
  MAX_EDGES_PER_NODE: 20,
  /** Days without observation before edge strength decays */
  EDGE_DECAY_DAYS: 30,
  /** Decay factor applied to stale edges (multiplied by current strength) */
  EDGE_DECAY_FACTOR: 0.7,
  /** Minimum strength before an edge is pruned */
  EDGE_PRUNE_THRESHOLD: 0.05,
  /** Token budget for architecture injection at session-start */
  INJECTION_TOKEN_BUDGET: 200,
  /** Enable static analysis on post-write hook */
  STATIC_ANALYSIS_ON_WRITE: true,
  /** Enable pruning during consolidation */
  PRUNE_ON_CONSOLIDATION: true,
  /** Strength boost when an edge is re-observed */
  EVIDENCE_BOOST: 0.1,
  /** Maximum strength cap for edges */
  MAX_EDGE_STRENGTH: 1,
  /** Initial strength for statically-analyzed edges */
  STATIC_INITIAL_STRENGTH: 0.5,
  /** Initial strength for runtime-observed edges */
  RUNTIME_INITIAL_STRENGTH: 0.3,
  /** Maximum transitive hops for impact analysis */
  MAX_IMPACT_HOPS: 3,
  /** High risk threshold: callers + downstream above this count */
  HIGH_RISK_THRESHOLD: 5,
  /** Medium risk threshold */
  MEDIUM_RISK_THRESHOLD: 2,
  /** Maximum description length (chars) */
  MAX_DESCRIPTION_LENGTH: 100,
  /** Maximum nodes to include in session-start injection */
  MAX_INJECTION_NODES: 15
};
var DECISION = {
  /** Maximum alternatives to store per decision */
  MAX_ALTERNATIVES: 4,
  /** Maximum length of rationale text (chars) */
  MAX_RATIONALE_LENGTH: 300,
  /** Maximum length of chosen description (chars) */
  MAX_CHOSEN_LENGTH: 200,
  /** Hours after a decision in which outcome can be auto-updated */
  OUTCOME_UPDATE_WINDOW_HOURS: 24,
  /** Keyword similarity threshold for surfacing similar past decisions */
  SIMILAR_DECISION_THRESHOLD: 0.35,
  /** Maximum decision memories encoded per session */
  MAX_PER_SESSION: 15,
  /** Cooldown between decision encodings in minutes */
  COOLDOWN_MINUTES: 3,
  /** Maximum constraints per decision */
  MAX_CONSTRAINTS: 5,
  /** Maximum affected components per decision */
  MAX_AFFECTED_COMPONENTS: 10,
  /** Encoding strength for decision memories (high — institutional knowledge) */
  ENCODING_STRENGTH: 0.8,
  /** Confidence for auto-detected decisions (moderate — may be refined) */
  ENCODING_CONFIDENCE: 0.6,
  /** Maximum similar decisions to surface per prompt-check */
  MAX_SURFACED: 2,
  /** Enhanced patterns: "chose X because Y" style decision language */
  CHOICE_PATTERNS: [
    /chose\s+(.{5,80})\s+because\s+(.{5,150})/i,
    /decided\s+(?:to\s+)?(.{5,80})\s+(?:because|since|as)\s+(.{5,150})/i,
    /going\s+with\s+(.{5,80})\s+(?:because|since|due\s+to)\s+(.{5,150})/i,
    /settled\s+on\s+(.{5,80})\s+(?:because|since|after)\s+(.{5,150})/i
  ],
  /** Patterns for "option A vs option B" comparisons */
  COMPARISON_PATTERNS: [
    /(.{3,60})\s+(?:vs\.?|versus|or)\s+(.{3,60})/i,
    /(?:option\s*[ab12]|approach\s*[ab12])[:]\s*(.{5,80})/i,
    /(?:between|choosing)\s+(.{5,60})\s+and\s+(.{5,60})/i
  ],
  /** Patterns for refactoring/extraction decisions */
  REFACTOR_PATTERNS: [
    "split this into",
    "extract a service",
    "extract a module",
    "separate the",
    "decouple",
    "move this to",
    "refactor into",
    "break apart",
    "isolate the",
    "service layer"
  ],
  /** Decision type inference patterns */
  TYPE_PATTERNS: {
    architectural: ["module", "service", "layer", "architecture", "structure", "dependency", "decouple", "split"],
    implementation: ["implement", "code", "function", "method", "class", "algorithm", "logic"],
    trade_off: ["trade-off", "tradeoff", "compromise", "balance", "sacrifice", "cost of"],
    tool_choice: ["library", "package", "framework", "tool", "plugin", "extension"],
    approach: ["approach", "strategy", "plan", "way to", "method for"]
  }
};
var REASONING_CHAIN = {
  /** Maximum steps stored per chain */
  MAX_STEPS_PER_CHAIN: 15,
  /** Maximum concurrent chains being built */
  MAX_ACTIVE_CHAINS: 3,
  /** Auto-close chain after this many minutes of inactivity */
  CHAIN_TIMEOUT_MINUTES: 30,
  /** Minimum steps required before a chain is worth storing */
  MIN_STEPS_TO_STORE: 3,
  /** Keyword similarity threshold for surfacing similar past chains */
  SIMILAR_CHAIN_THRESHOLD: 0.3,
  /** Maximum chains stored per session */
  MAX_PER_SESSION: 12,
  /** Enable dead-end detection in chain steps */
  DEAD_END_DETECTION: true,
  /** Minutes after fix to wait before confirming chain success */
  VALIDATION_WINDOW_MINUTES: 10,
  /** Maximum length of trigger text (chars) */
  MAX_TRIGGER_LENGTH: 150,
  /** Maximum length of conclusion text (chars) */
  MAX_CONCLUSION_LENGTH: 300,
  /** Maximum length of step action text (chars) */
  MAX_ACTION_LENGTH: 100,
  /** Maximum length of step observation text (chars) */
  MAX_OBSERVATION_LENGTH: 150,
  /** Maximum length of step inference text (chars) */
  MAX_INFERENCE_LENGTH: 150,
  /** Maximum files tracked per step */
  MAX_FILES_PER_STEP: 5,
  /** Maximum similar chains to surface per prompt-check */
  MAX_SURFACED: 2,
  /** Encoding strength for chain memories */
  ENCODING_STRENGTH: 0.75,
  /** Confidence for auto-detected chains */
  ENCODING_CONFIDENCE: 0.55,
  /** Minimum error line length (chars) to trigger chain detection */
  MIN_CHAIN_ERROR_LENGTH: 8,
  /** Chain type detection patterns — keywords that hint at what kind of chain is active */
  TYPE_PATTERNS: {
    debug: ["error", "bug", "fix", "traceback", "exception", "failed", "broken", "crash", "wrong", "issue"],
    investigation: ["investigate", "check", "look into", "find out", "understand", "explore", "dig into", "trace"],
    design: ["design", "architect", "plan", "structure", "layout", "organize", "blueprint"],
    refactor: ["refactor", "extract", "split", "decouple", "clean up", "reorganize", "simplify", "move"],
    migration: ["migrate", "upgrade", "port", "convert", "transition", "move from", "update to"]
  },
  /** Trigger patterns that start a new reasoning chain */
  TRIGGER_PATTERNS: [
    /(?:let me|i'll|going to)\s+(?:investigate|debug|look into|figure out|trace)\s+(.{5,120})/i,
    /(?:error|exception|failed|broken|crash)[:]\s*(.{5,120})/i,
    /(?:how|why)\s+(?:does|is|did|should)\s+(.{5,120})/i,
    /(?:need to|trying to)\s+(?:fix|solve|resolve|understand)\s+(.{5,120})/i
  ],
  /** Patterns indicating a chain step's observation was a dead end */
  DEAD_END_PATTERNS: [
    "not the issue",
    "that's not it",
    "wrong approach",
    "didn't help",
    "no luck",
    "still broken",
    "same error",
    "not related",
    "red herring",
    "false positive",
    "dead end"
  ],
  /** Patterns indicating chain completion (success) */
  COMPLETION_PATTERNS: [
    /(?:fixed|resolved|solved|working now|that did it|problem solved)/i,
    /(?:all tests pass|build succeeds|no errors)/i,
    /(?:confirmed|validated|verified|looks good)/i
  ]
};
var PROSPECTIVE = {
  /** Maximum active prospective memories */
  MAX_ACTIVE: 50,
  /** Default max fires (0 = unlimited) */
  DEFAULT_MAX_FIRES: 0,
  /** Keyword similarity threshold to trigger (0.15 = lenient, matches natural prompts) */
  MATCH_THRESHOLD: 0.15,
  /** Activation level for injected reminders in recall results */
  INJECTION_ACTIVATION: 0.85
};
var ATTENTION = {
  /** Significance boost for focus-relevant events */
  FOCUS_BOOST: 1.3,
  /** Significance penalty for off-focus events */
  DEFOCUS_PENALTY: 0.6,
  /** Max hops reduction in focused state */
  FOCUSED_MAX_HOPS: -1,
  /** Activation threshold raise in focused state */
  FOCUSED_THRESHOLD_BOOST: 0.05,
  /** Extra hops in exploratory state */
  EXPLORATORY_HOP_BONUS: 1,
  /** Domain divergence threshold to detect context switch */
  CONTEXT_SWITCH_THRESHOLD: 0.7,
  /** Attention level decay per non-reinforcing event */
  DECAY_RATE: 0.1,
  /** Attention spike on error events */
  ERROR_SPIKE: 0.3
};
var EMOTIONAL = {
  /** Activation boost from emotional_weight during spreading activation */
  SPREAD_FACTOR: 0.2,
  /** Days added to stability per emotional_weight unit (flashbulb effect) */
  STABILITY_BONUS: 0.5,
  /** Extra connection strength for emotional memories during consolidation */
  CONNECTION_BONUS: 0.15,
  /** Promotion threshold reduction factor (* emotional_weight) */
  PROMOTION_THRESHOLD_REDUCTION: 0.3,
  /** emotional_weight >= this = somatic marker flag */
  SOMATIC_THRESHOLD: 0.7
};
var SOMATIC_MARKERS = {
  /** Minimum emotional_weight to qualify for somatic signal extraction */
  MIN_EMOTIONAL_WEIGHT: 0.7,
  /** Minimum memory confidence to generate a somatic signal */
  MIN_CONFIDENCE: 0.8,
  /** Lower confidence gate for negative outcomes (failures are important even at lower confidence) */
  MIN_CONFIDENCE_NEGATIVE: 0.55,
  /** Minimum activation level to consider for somatic marker extraction */
  MIN_ACTIVATION: 0.3,
  /** Maximum somatic signals per recall result */
  MAX_SIGNALS: 3,
  /** Positive gut feeling message template */
  POSITIVE_PREFIX: "This approach has worked well before",
  /** Negative gut feeling message template */
  NEGATIVE_PREFIX: "Warning \u2014 similar approach led to problems before",
  /** Tag used in hook output */
  TAG: "[GUT]"
};
var SKILL = {
  /** Repetitions to trigger skill compilation */
  COMPILATION_THRESHOLD: 3,
  /** Repetitions to trigger step chunking */
  CHUNKING_THRESHOLD: 10,
  /** Repetitions for full automaticity */
  AUTOMATICITY_THRESHOLD: 30,
  /** Automaticity increment per practice */
  AUTOMATICITY_INCREMENT: 0.03,
  /** Step similarity threshold for chunk merging */
  CHUNK_MERGE_SIMILARITY: 0.6,
  /** Context similarity for skill recommendation */
  TRIGGER_MATCH_THRESHOLD: 0.5,
  /** Maximum skill recommendations per recall */
  MAX_RECOMMENDATIONS: 3
};
var CREATIVE = {
  /** Maximum random pairs per dream cycle */
  MAX_PAIRS: 10,
  /** Lower similarity threshold for loose associations */
  SIMILARITY_THRESHOLD: 0.15,
  /** Initial speculative connection strength */
  SPECULATIVE_STRENGTH: 0.2,
  /** Consolidation cycles before pruning unstrengthened speculative connections */
  MAX_SPECULATIVE_AGE: 3,
  /** Strength threshold to promote speculative → real connection */
  INSIGHT_STRENGTH_THRESHOLD: 0.5
};
var CREATIVE_INSIGHT = {
  /** Tag used to identify insight memories */
  TAG: "creative_insight",
  /** Cross-domain tag for filtering */
  CROSS_DOMAIN_TAG: "cross_domain",
  /** Minimum keyword relevance to surface an insight during recall */
  MIN_RELEVANCE: 0.15,
  /** Maximum insights to surface per recall */
  MAX_INSIGHTS: 3,
  /** Maximum insight candidates to fetch from DB */
  MAX_CANDIDATES: 20,
  /** Encoding strength for new insight memories (significant discovery) */
  ENCODING_STRENGTH: 0.8,
  /** Initial confidence for insight memories */
  INITIAL_CONFIDENCE: 0.5,
  /** Confidence boost when insight is validated */
  VALIDATION_BOOST: 0.15,
  /** Confidence reduction when insight is invalidated */
  INVALIDATION_DECAY: 0.2,
  /** Prospective memory priority for insight reminders */
  PROSPECTIVE_PRIORITY: 0.7,
  /** Max fires for insight prospective memories */
  PROSPECTIVE_MAX_FIRES: 5
};
var METACOGNITION = {
  /** Recent events window for calibration tracking */
  CALIBRATION_WINDOW: 50,
  /** Empty recalls in a domain before flagging as blind spot */
  BLIND_SPOT_THRESHOLD: 3,
  /** False positive rate threshold for warning */
  FP_RATE_WARNING: 0.3,
  /** Run health check every N consolidations */
  HEALTH_CHECK_INTERVAL: 10
};
var OBSERVATION = {
  /** Observation enabled by default (abstract patterns only, never raw content) */
  ENABLED: true,
  /** Maximum events in observation buffer */
  BUFFER_SIZE: 200,
  /** Minimum repetitions to extract pattern */
  MIN_REPETITIONS: 3,
  /** Actions in a sequence window */
  SEQUENCE_WINDOW: 5,
  /** Never store raw code content, only abstract patterns */
  ABSTRACT_ONLY: true
};
var CONTEXTUAL = {
  /** Activation boost for matching project context (strongest place cell signal) */
  PROJECT_BOOST: 0.25,
  /** Per-file overlap boost */
  FILE_BOOST_PER_MATCH: 0.1,
  /** Maximum file overlap boost */
  FILE_BOOST_CAP: 0.3,
  /** Boost when error context keywords overlap */
  ERROR_CONTEXT_BOOST: 0.2,
  /** Boost for matching task type */
  TASK_TYPE_BOOST: 0.1,
  /** Boost for matching framework version (strong — prevents wrong-version recall) */
  VERSION_BOOST: 0.3,
  /** Penalty multiplier for version mismatch (0.4 = 60% reduction) */
  VERSION_MISMATCH_PENALTY: 0.4,
  /** Penalty multiplier for domain mismatch (0.5 = 50% reduction) */
  DOMAIN_MISMATCH_PENALTY: 0.5,
  /** Penalty multiplier for project mismatch on episodic memories (0.3 = 70% reduction) */
  PROJECT_MISMATCH_PENALTY: 0.3,
  /** Boost for failure experiences with lessons (surfaces "I tried this and it didn't work") */
  FAILURE_EXPERIENCE_BOOST: 0.2,
  /** Boost when memory files share the same module directory as current file */
  MODULE_PROXIMITY_BOOST: 0.2,
  /** Penalty multiplier when memory files are all from a different module (0.3 = 70% reduction) */
  MODULE_MISMATCH_PENALTY: 0.3
};
var REWARD = {
  /** Seed activation boost for positively-reinforced memories */
  POSITIVE_BOOST: 0.15,
  /** Seed activation reduction for negatively-reinforced memories */
  NEGATIVE_PENALTY: 0.3,
  /** How much confidence affects seed activation */
  CONFIDENCE_WEIGHT: 0.5,
  /** How much reinforcement affects seed activation */
  REINFORCEMENT_WEIGHT: 0.5,
  /** Default reinforcement (no bias) */
  NEUTRAL_REINFORCEMENT: 1,
  /** Confidence midpoint (no bias) */
  NEUTRAL_CONFIDENCE: 0.5
};
var EMBEDDING = {
  /** Fixed vector dimensionality (feature hashing) */
  VECTOR_DIMENSIONS: 512,
  /** Maximum synonyms to expand per term */
  MAX_SYNONYM_EXPANSION: 3,
  /** Weight discount for synonym terms (contribute less than original) */
  SYNONYM_WEIGHT: 0.5,
  /** Default IDF for unknown terms */
  DEFAULT_IDF_FLOOR: 1,
  /** Maximum candidates to scan for cosine similarity */
  MAX_SCAN_CANDIDATES: 200,
  /** Minimum cosine similarity to qualify as a TF-IDF seed */
  MIN_COSINE_SIMILARITY: 0.15,
  /** Seed activation level for TF-IDF seeds (below FTS5 at 1.0) */
  TFIDF_SEED_ACTIVATION: 0.85,
  /** IDF refresh triggers when memory count changes by this fraction */
  IDF_REFRESH_THRESHOLD: 0.1,
  /** Re-embedding batch size during consolidation */
  REEMBED_BATCH_SIZE: 50,
  /** TF weight discount for bigram tokens (prevents bigrams from dominating) */
  BIGRAM_WEIGHT: 0.7,
  /** Minimum keyword count before bigram generation activates */
  BIGRAM_MIN_KEYWORDS: 2
};
var HOUSEKEEPING = {
  /** Maximum cold_storage rows before oldest are evicted */
  MAX_COLD_ROWS: 500,
  /** Maximum consolidation_log entries to keep */
  MAX_CONSOLIDATION_LOGS: 100,
  /** Maximum metacognition_metrics entries to keep */
  MAX_METRICS_ROWS: 5e3,
  /** Maximum age in days for cold_storage entries before eviction */
  COLD_MAX_AGE_DAYS: 365,
  /** Run VACUUM when more than this many rows have been deleted since last VACUUM */
  VACUUM_DELETE_THRESHOLD: 200,
  /** Batch size for pruning old decay-flagged memories */
  FLAGGED_PRUNE_BATCH: 100,
  /** Extra memory candidates to scan for decay (beyond the main consolidation window) */
  DECAY_SCAN_EXTRA: 200
};
var INPUT = {
  /** Maximum length for text content (queries, memory content, actions) */
  MAX_CONTENT_LENGTH: 1e4,
  /** Maximum length for short string fields (domain, version, reason) */
  MAX_SHORT_STRING_LENGTH: 500,
  /** Maximum items in array fields */
  MAX_ARRAY_ITEMS: 50,
  /** Maximum tokens for a single request */
  MAX_TOKEN_BUDGET: 5e4
};
var SQL = {
  /** Maximum length for a single FTS5 search token */
  MAX_FTS5_TOKEN_LENGTH: 128
};
var CODEMAP = {
  /** Maximum files tracked per project */
  MAX_FILES_PER_PROJECT: 200,
  /** Maximum skeleton length per file (chars) */
  MAX_SKELETON_LENGTH: 200,
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 500,
  /** File extensions to parse */
  PARSEABLE_EXTENSIONS: ["py", "ts", "js", "xml", "json", "css", "md"],
  /** Maximum file size in bytes to attempt parsing */
  MAX_FILE_SIZE_BYTES: 1e5,
  /** Content hash length for change detection */
  HASH_LENGTH: 64,
  /** Stale entry cleanup: days without update */
  STALE_DAYS: 30
};
var ERROR_LEARNING = {
  /** Occurrences before auto-graduating critical errors to antipattern */
  GRADUATION_THRESHOLD_CRITICAL: 2,
  /** Occurrences before auto-graduating other errors to antipattern */
  GRADUATION_THRESHOLD_DEFAULT: 3,
  /** Maximum error message length stored */
  MAX_ERROR_MESSAGE_LENGTH: 300,
  /** Maximum fix content length stored */
  MAX_FIX_LENGTH: 500,
  /** Maximum candidates kept (oldest non-graduated pruned) */
  MAX_CANDIDATES: 200,
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 200,
  /** Critical error patterns (lower graduation threshold) */
  CRITICAL_PATTERNS: ["parseerror", "syntaxerror", "segfault", "oom", "permission denied", "column does not exist"]
};
var TASK_JOURNAL = {
  /** Keyword similarity threshold for matching existing tasks */
  MATCH_THRESHOLD: 0.4,
  /** Maximum active tasks per project */
  MAX_ACTIVE_TASKS: 10,
  /** Maximum files tracked per task */
  MAX_FILES_PER_TASK: 50,
  /** Maximum blockers per task */
  MAX_BLOCKERS_PER_TASK: 10,
  /** Keyword similarity threshold for deduplicating blockers (higher = less aggressive dedup) */
  BLOCKER_DEDUP_THRESHOLD: 0.75,
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 200,
  /** Days of inactivity before task is auto-paused */
  AUTO_PAUSE_DAYS: 7,
  /** Days of inactivity before task is auto-abandoned */
  AUTO_ABANDON_DAYS: 30,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 200,
  /** Semantic similarity threshold (TF-IDF cosine) for task matching fallback */
  SEMANTIC_MATCH_THRESHOLD: 0.25
};
var TEST_TRACKING = {
  /** Maximum test runs stored per project */
  MAX_RUNS_PER_PROJECT: 100,
  /** Number of alternating pass/fail to flag as flaky */
  FLAKY_THRESHOLD: 3,
  /** Token budget for session-start injection */
  INJECTION_TOKEN_BUDGET: 150,
  /** Patterns that identify test commands */
  TEST_COMMAND_PATTERNS: ["vitest", "pytest", "jest", "npm test", "yarn test", "python -m pytest", "npx vitest"]
};
var OUTPUT_BUDGET = {
  /** Hard cap on total stdout bytes per hook invocation */
  MAX_STDOUT_BYTES: 8e3,
  /** Section priority order (higher = kept when truncating). Antipatterns are most critical. */
  /** Larger cap for post-compaction recovery (needs more context) */
  POST_COMPACT_MAX_BYTES: 16e3,
  /** Section priority order (higher = kept when truncating). Antipatterns are most critical. */
  SECTION_PRIORITY: {
    stats: 10,
    model: 9,
    antipatterns: 9,
    surface: 8,
    compaction: 8,
    synthesis: 7,
    understanding: 7,
    codemap: 6,
    tasks: 5,
    memories: 4,
    errors: 3,
    architecture: 3,
    blindspots: 2,
    goals: 2,
    identity: 1,
    other: 0
  },
  /** Minimum bytes reserved for any single section that's appended */
  MIN_SECTION_BYTES: 100,
  /** Truncation suffix appended when content is cut */
  TRUNCATION_MARKER: "\n...[truncated by Engram output budget]"
};
var PREWRITE_BLOCKING = {
  /** Antipattern severities that trigger a deny (block the write) */
  BLOCK_ON_SEVERITY: ["critical"],
  /** Antipattern severities that add a warning via additionalContext */
  WARN_ON_SEVERITY: ["high"],
  /** Minimum match confidence to act on (block or warn) */
  MIN_MATCH_CONFIDENCE: 0.8,
  /** Environment variable to override mode: 'block' | 'warn' | 'off' */
  MODE_ENV_VAR: "ENGRAM_PREWRITE_MODE",
  /** Default mode when env var is not set */
  DEFAULT_MODE: "block"
};
var WATCHER = {
  /** State file name (relative to ~/.engram/) — legacy, pre-multi-session */
  STATE_FILE: "watcher.json",
  /** Directory for per-session state files (relative to ~/.engram/) */
  SESSIONS_DIR: "sessions",
  /** Max age for stale session files before cleanup (hours) */
  MAX_SESSION_AGE_HOURS: 48,
  /** Pre-compact: minimum turns in session before saving learnings */
  PRECOMPACT_MIN_TURNS: 1,
  /** Milestone turn intervals for auto-encode check */
  MILESTONE_TURNS: [10, 20, 30],
  /** Max auto-encodes per session before suppressing milestones */
  MAX_MILESTONE_ENCODES: 3,
  /** Encoding strength for milestone snapshots (low — decays naturally) */
  MILESTONE_ENCODING_STRENGTH: 0.4
};
var PROJECT = {
  /** Files that mark a project root directory */
  ROOT_MARKERS: [".git", "package.json", "pyproject.toml", "__manifest__.py"],
  /** Directory for per-project databases (relative to ~/.engram/) */
  DB_DIR: "projects",
  /** Days of inactivity before a project DB is considered stale */
  STALE_DB_DAYS: 180,
  /** Minimum memory count below which a stale project DB can be auto-deleted */
  STALE_DB_MIN_MEMORIES: 5
};
var CURATOR = {
  /** Token budget for the bridge markdown file */
  BRIDGE_TOKEN_BUDGET: 500,
  /** Max critical/high warnings included in bridge */
  MAX_BRIDGE_WARNINGS: 3,
  /** Max insights included in bridge */
  MAX_BRIDGE_INSIGHTS: 5,
  /** Min memory confidence to include in bridge insights (used as fallback; composeBridgeContent uses 0.6) */
  MIN_BRIDGE_CONFIDENCE: 0.6,
  /** Filename written to Claude's memory dir */
  BRIDGE_FILENAME: "engram-context.md",
  /** Max insight age in days — older insights excluded */
  MAX_INSIGHT_AGE_DAYS: 30,
  /** Minimum milliseconds between bridge file writes (rate limiting) */
  BRIDGE_MIN_INTERVAL_MS: 5e3
};
var ADAPTIVE = {
  /** Domain mastery threshold — below this → HIGH injection */
  MASTERY_MEDIUM_THRESHOLD: 0.4,
  /** Domain mastery threshold — above this → LOW injection */
  MASTERY_LOW_THRESHOLD: 0.7,
  /** Minimum session turns before reducing injection level */
  MIN_TURNS_FOR_REDUCTION: 3,
  /** Post-compact sessions always use HIGH injection */
  POST_COMPACT_ALWAYS_HIGH: true,
  /** Recent error count within last N turns boosts to HIGH */
  ERROR_BOOST_TURNS: 3,
  /** New domain (no memories) → always HIGH injection */
  NEW_DOMAIN_ALWAYS_HIGH: true,
  /** Watcher thresholds by injection level: [gentle, strong, urgent] */
  WATCHER_THRESHOLDS: {
    high: [3, 6, 10],
    medium: [4, 8, 12],
    low: [6, 12, 18]
  }
};
var COGNITIVE = {
  /** Maximum character length per cognitive field */
  MAX_FIELD_LENGTH: 200,
  /** Recent search queries to track for hypothesis detection */
  SEARCH_HISTORY_SIZE: 5,
  /** Minimum keyword overlap to consider queries related (continuity) */
  SEARCH_CONTINUITY_THRESHOLD: 0.2,
  /** Minimum divergence to detect a hypothesis pivot */
  SEARCH_PIVOT_THRESHOLD: 0.7,
  /** Tool-to-phase weight mapping for session phase detection */
  PHASE_WEIGHTS: {
    Read: "exploration",
    Grep: "exploration",
    Glob: "exploration",
    Agent: "planning",
    Edit: "implementation",
    Write: "implementation",
    NotebookEdit: "implementation",
    Bash: "validation"
  },
  /** Number of recent tools considered for phase detection */
  PHASE_WINDOW_SIZE: 5,
  /** Regex patterns for extracting approach from Agent tool prompts */
  APPROACH_PATTERNS: [
    /(?:i'll|let me|going to|strategy[:\s]|approach[:\s]|plan[:\s])(.{20,150}?)(?:\.|$)/i,
    /(?:we should|we need to|the idea is to)(.{20,150}?)(?:\.|$)/i
  ],
  /** Regex patterns for extracting discoveries from subagent messages */
  DISCOVERY_PATTERNS: [
    /(?:found that|discovered|turns out|it appears|the issue is|root cause)(.{20,150}?)(?:\.|$)/i,
    /(?:key finding|important[:\s]|notable[:\s]|interesting[:\s])(.{20,150}?)(?:\.|$)/i
  ],
  /** Regex patterns for extracting conclusions from subagent messages */
  CONCLUSION_PATTERNS: [
    /(?:conclusion|in summary|therefore|this means|so we|the solution)(.{20,150}?)(?:\.|$)/i,
    /(?:confirmed that|verified|resolved by|fixed by|the fix)(.{20,150}?)(?:\.|$)/i
  ],
  /** Minimum Agent prompt length to attempt cognitive extraction */
  MIN_AGENT_PROMPT_FOR_COGNITION: 80,
  /** Minimum subagent message length to attempt lesson extraction */
  MIN_SUBAGENT_MESSAGE_FOR_LESSON: 100,
  /** Encoding strength for cognitively-enriched subagent memories */
  ENRICHED_SUBAGENT_ENCODING_STRENGTH: 0.6,
  /** Confidence for cognitively-enriched subagent memories */
  ENRICHED_SUBAGENT_CONFIDENCE: 0.55,
  /** Patterns that indicate subagent boilerplate (transition phrases, not substance) */
  SUBAGENT_BOILERPLATE_PATTERNS: [
    /^(?:Perfect|Excellent|Great|Good|Wonderful)!?\s*(?:Now|Let me|I (?:now|have|can|will))/i,
    /^Now (?:let me|I (?:have|can|will))/i,
    /^(?:Let me (?:compile|create|generate|build|put together|summarize|format))/i,
    /^I (?:now have|have all|can now|will now)/i,
    /^(?:Alright|OK|Right)[.,!]?\s*(?:Now|Let me|I)/i
  ],
  /** Minimum meaningful content length after stripping boilerplate preamble */
  SUBAGENT_MIN_SUBSTANCE_LENGTH: 120,
  /** Minimum encoding strength for subagent memories that pass quality gate */
  SUBAGENT_MIN_ENCODING_STRENGTH: 0.25
};
var MENTAL_MODEL = {
  /** Maximum principles per model */
  MAX_PRINCIPLES: 7,
  /** Maximum patterns per model */
  MAX_PATTERNS: 5,
  /** Maximum pitfalls per model */
  MAX_PITFALLS: 5,
  /** Maximum understanding text length (narrative) */
  UNDERSTANDING_MAX_LENGTH: 800,
  /** Maximum principle statement + rationale length */
  PRINCIPLE_MAX_LENGTH: 200,
  /** Minimum memories in domain to build a model */
  MIN_MEMORIES_FOR_MODEL: 8,
  /** Minimum decision memories to extract principles */
  MIN_DECISIONS_FOR_PRINCIPLES: 2,
  /** Maximum bytes for injection output */
  INJECTION_MAX_BYTES: 2e3,
  /** Minimum session-narrative memories before composing rich narrative understanding */
  MIN_SESSIONS_FOR_RICH: 3
};
var SESSION_HANDOFF = {
  /** Filename for session handoff artifact */
  FILENAME: "session-handoff.json",
  /** Max length of the approach description */
  MAX_APPROACH_LENGTH: 300,
  /** Max length of the unfinished work description */
  MAX_UNFINISHED_LENGTH: 500,
  /** Max decision summaries to include */
  MAX_DECISIONS: 5,
  /** Max blockers to include */
  MAX_BLOCKERS: 5,
  /** Max files to include */
  MAX_FILES: 15,
  /** Max length of each lesson string */
  MAX_LESSON_LENGTH: 200,
  /** Max lessons to include */
  MAX_LESSONS: 5,
  /** Hours before a handoff is considered stale and ignored */
  MAX_AGE_HOURS: 72,
  /** Max bytes for handoff injection into session-start output */
  INJECTION_MAX_BYTES: 2e3
};

// src/config.ts
import { readFileSync, existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { join, resolve, dirname, basename } from "path";
import { homedir } from "os";
var DEFAULT_CONFIG = {
  storage: {
    db_path: join(homedir(), ".engram", "engram.db"),
    wal_mode: true,
    max_db_size_mb: 500
  },
  significance: {
    base_threshold: 0.3,
    goal_relevance_weight: 0.4,
    prediction_error_weight: 0.35,
    emotional_weight: 0.25,
    min_goal_relevance: 0.1,
    min_prediction_error: 0.05,
    adaptive_threshold: true,
    target_encoding_rate: 5
    // per hour
  },
  retrieval: {
    decay_per_hop: 0.85,
    activation_threshold: 0.1,
    max_hops: 4,
    max_seeds: 10,
    default_token_budget: 2e3,
    fts_result_limit: 20,
    tfidf_scan_limit: 200
  },
  consolidation: {
    global_downscale_factor: 0.95,
    promotion_confidence: 0.7,
    promotion_access_count: 3,
    pattern_min_instances: 2,
    max_memories_per_cycle: 100
  },
  decay: {
    base_stability: 1,
    // days
    connection_bonus: 0.1,
    // per connection
    retrieval_bonus: 0.2,
    // per access
    prune_threshold: 0.1,
    // retention below this = prune candidate
    archive_instead_of_delete: true
  },
  immune: {
    keyword_match_threshold: 0.5,
    false_positive_weaken: 0.1,
    max_exceptions: 5
  },
  // Auto-consolidation: enabled by default for dynamic learning
  auto_consolidate: true,
  consolidation_interval_s: 3600,
  // 1 hour (light every hour, full every 7h, deep every 30h)
  observation_enabled: true
  // Observational learning (abstract patterns only, never raw content)
};
function ensureEngramDir() {
  const dir = join(homedir(), ".engram");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sessionsDir = join(dir, "sessions");
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true });
  }
  const projectsDir = join(dir, "projects");
  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir, { recursive: true });
  }
  return dir;
}
function applyEnvOverrides(config) {
  const result = { ...config, storage: { ...config.storage } };
  const dbPath = process.env.ENGRAM_DB_PATH;
  if (dbPath) {
    const resolved = resolve(dbPath);
    const parentDir = dirname(resolved);
    const home = homedir();
    const safePrefixes = [
      join(home, ".engram"),
      join(home, ".local", "share", "engram"),
      process.env.XDG_DATA_HOME ? join(process.env.XDG_DATA_HOME, "engram") : null
    ].filter((p) => p !== null);
    const isInSafeDir = safePrefixes.some((prefix) => resolved.startsWith(prefix + "/") || resolved === join(prefix, "engram.db"));
    if (!resolved.endsWith(".db") || !isInSafeDir) {
    } else if (!existsSync(parentDir)) {
      try {
        mkdirSync(parentDir, { recursive: true });
        result.storage.db_path = resolved;
      } catch {
      }
    } else {
      result.storage.db_path = resolved;
    }
  }
  const autoConsolidate = process.env.ENGRAM_AUTO_CONSOLIDATE;
  if (autoConsolidate !== void 0) {
    result.auto_consolidate = autoConsolidate === "true" || autoConsolidate === "1";
  }
  const consolInterval = process.env.ENGRAM_CONSOLIDATION_INTERVAL;
  if (consolInterval !== void 0) {
    const seconds = parseInt(consolInterval, 10);
    if (!isNaN(seconds) && seconds > 0) {
      result.consolidation_interval_s = seconds;
    }
  }
  const observationEnabled = process.env.ENGRAM_OBSERVATION;
  if (observationEnabled !== void 0) {
    result.observation_enabled = observationEnabled === "true" || observationEnabled === "1";
  }
  return result;
}
function getEnvLogLevel() {
  const level = process.env.ENGRAM_LOG_LEVEL;
  if (level && ["error", "warn", "info", "debug"].includes(level)) {
    return level;
  }
  return "info";
}
function loadConfig() {
  const configPath = join(homedir(), ".engram", "config.json");
  let config;
  if (!existsSync(configPath)) {
    config = { ...DEFAULT_CONFIG };
  } else {
    try {
      const raw = readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(raw);
      config = mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch {
      config = { ...DEFAULT_CONFIG };
    }
  }
  return validateConfig(applyEnvOverrides(config));
}
function mergeConfig(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const override = overrides[key];
    if (override !== void 0 && typeof override === "object" && !Array.isArray(override)) {
      const defaultSection = defaults[key];
      const merged = { ...defaultSection ?? {} };
      for (const [subKey, subVal] of Object.entries(override)) {
        if (subVal !== void 0) {
          merged[subKey] = subVal;
        }
      }
      result[key] = merged;
    }
  }
  return result;
}
function validateConfig(config) {
  const result = { ...config };
  result.storage = { ...config.storage };
  result.storage.max_db_size_mb = clampInt(config.storage.max_db_size_mb, 10, 1e4, 500);
  result.significance = { ...config.significance };
  result.significance.base_threshold = clampNum(config.significance.base_threshold, 0.01, 0.99, 0.3);
  result.significance.goal_relevance_weight = clampNum(config.significance.goal_relevance_weight, 0, 1, 0.4);
  result.significance.prediction_error_weight = clampNum(config.significance.prediction_error_weight, 0, 1, 0.35);
  result.significance.emotional_weight = clampNum(config.significance.emotional_weight, 0, 1, 0.25);
  result.significance.target_encoding_rate = clampInt(config.significance.target_encoding_rate, 1, 100, 5);
  result.retrieval = { ...config.retrieval };
  result.retrieval.max_hops = clampInt(config.retrieval.max_hops, 1, 10, 4);
  result.retrieval.max_seeds = clampInt(config.retrieval.max_seeds, 1, 50, 10);
  result.retrieval.default_token_budget = clampInt(config.retrieval.default_token_budget, 100, 5e4, 2e3);
  result.retrieval.fts_result_limit = clampInt(config.retrieval.fts_result_limit, 1, 100, 20);
  result.retrieval.tfidf_scan_limit = clampInt(config.retrieval.tfidf_scan_limit, 50, 1e3, 200);
  result.consolidation = { ...config.consolidation };
  result.consolidation.global_downscale_factor = clampNum(config.consolidation.global_downscale_factor, 0.5, 1, 0.95);
  result.consolidation.max_memories_per_cycle = clampInt(config.consolidation.max_memories_per_cycle, 10, 1e3, 100);
  result.decay = { ...config.decay };
  result.decay.base_stability = clampNum(config.decay.base_stability, 0.1, 100, 1);
  result.decay.prune_threshold = clampNum(config.decay.prune_threshold, 0.01, 0.5, 0.1);
  if (result.consolidation_interval_s !== void 0) {
    result.consolidation_interval_s = clampInt(result.consolidation_interval_s, 60, 604800, 86400);
  }
  return result;
}
function clampNum(value, min, max, fallback) {
  if (typeof value !== "number" || isNaN(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}
function clampInt(value, min, max, fallback) {
  if (typeof value !== "number" || isNaN(value) || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), min), max);
}
function inferProjectPath(cwd) {
  let dir = resolve(cwd);
  const root = dirname(dir) === dir ? dir : "/";
  while (dir !== root) {
    for (const marker of PROJECT.ROOT_MARKERS) {
      if (existsSync(join(dir, marker))) {
        return dir;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(cwd);
}
function deriveProjectDbPath(projectPath) {
  const name = basename(projectPath).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  const hash = createHash("sha256").update(projectPath).digest("hex").slice(0, 8);
  const dir = join(homedir(), ".engram", PROJECT.DB_DIR, `${name}-${hash}`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, "project.db");
}

// src/storage/database.ts
import Database from "better-sqlite3";
import { existsSync as existsSync2, mkdirSync as mkdirSync2, statSync, readdirSync, lstatSync } from "fs";
import { dirname as dirname2, join as join2, resolve as resolve2 } from "path";
import { homedir as homedir2 } from "os";
function validateDbPathForAttach(dbPath) {
  const resolved = resolve2(dbPath);
  if (!resolved.endsWith(".db")) throw new Error(`ATTACH rejected: path must end with .db: ${resolved}`);
  if (existsSync2(resolved)) {
    try {
      const stat = lstatSync(resolved);
      if (stat.isSymbolicLink()) throw new Error(`ATTACH rejected: symlink not allowed: ${resolved}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("ATTACH rejected")) throw e;
    }
  }
  const engramRoot = join2(homedir2(), ".engram");
  const inEngram = resolved.startsWith(engramRoot + "/") || resolved === join2(engramRoot, "engram.db");
  const inTmp = resolved.startsWith("/tmp/");
  if (!inEngram && !inTmp) {
    throw new Error(`ATTACH rejected: path outside allowed directories: ${resolved}`);
  }
  return resolved;
}
function validateAlias(alias) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(alias)) {
    throw new Error(`ATTACH rejected: invalid alias: ${alias}`);
  }
  return alias;
}
var SCHEMA_SQL = `
-- Core memories table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('semantic', 'episodic', 'procedural', 'antipattern')),
  content TEXT NOT NULL,
  summary TEXT,
  token_count INTEGER NOT NULL DEFAULT 0,
  summary_token_count INTEGER NOT NULL DEFAULT 0,
  encoding_strength REAL NOT NULL DEFAULT 0.5,
  reinforcement REAL NOT NULL DEFAULT 1.0,
  confidence REAL NOT NULL DEFAULT 0.5,
  validation_count INTEGER NOT NULL DEFAULT 0,
  contradiction_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TEXT,
  access_count INTEGER NOT NULL DEFAULT 0,
  domains TEXT NOT NULL DEFAULT '[]',
  version TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  storage_tier TEXT NOT NULL DEFAULT 'short_term'
    CHECK(storage_tier IN ('working', 'short_term', 'medium_term', 'long_term', 'cold')),
  flagged_for_pruning INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  superseded_by TEXT,
  transformed_to TEXT,
  encoding_context TEXT NOT NULL DEFAULT '{}',
  type_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Connections table (graph edges)
CREATE TABLE IF NOT EXISTS connections (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  strength REAL NOT NULL DEFAULT 0.5,
  type TEXT NOT NULL DEFAULT 'related'
    CHECK(type IN ('related', 'caused_by', 'supersedes', 'contradicts',
                   'depends_on', 'same_schema', 'cross_domain', 'part_of', 'speculative')),
  co_activation_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_activated TEXT,
  PRIMARY KEY (source_id, target_id),
  FOREIGN KEY (source_id) REFERENCES memories(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- Schemas table
CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern_id TEXT,
  instances TEXT NOT NULL DEFAULT '[]',
  domains_seen_in TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0.5,
  validation_count INTEGER NOT NULL DEFAULT 0,
  false_positive_count INTEGER NOT NULL DEFAULT 0,
  formation_date TEXT NOT NULL,
  last_validated TEXT
);

-- Experience versions table
CREATE TABLE IF NOT EXISTS experience_versions (
  domain TEXT NOT NULL,
  version TEXT NOT NULL,
  parent_version TEXT,
  overrides TEXT NOT NULL DEFAULT '[]',
  antipatterns TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (domain, version)
);

-- Cold storage (archived memories)
CREATE TABLE IF NOT EXISTS cold_storage (
  id TEXT PRIMARY KEY,
  original_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  type TEXT NOT NULL,
  domains TEXT NOT NULL DEFAULT '[]',
  original_confidence REAL NOT NULL DEFAULT 0,
  archived_date TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT ''
);

-- Consolidation log
CREATE TABLE IF NOT EXISTS consolidation_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  stats TEXT NOT NULL DEFAULT '{}'
);

-- Structural patterns table (Gentner structure-mapping)
CREATE TABLE IF NOT EXISTS structural_patterns (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  relations TEXT NOT NULL DEFAULT '[]',
  abstraction_level INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.5,
  created_at TEXT NOT NULL,
  FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_patterns_memory ON structural_patterns(memory_id);
CREATE INDEX IF NOT EXISTS idx_patterns_level ON structural_patterns(abstraction_level);

-- Prospective memory (trigger-action pairs: "remembering to remember")
CREATE TABLE IF NOT EXISTS prospective_memory (
  id TEXT PRIMARY KEY,
  trigger_pattern TEXT NOT NULL,
  action TEXT NOT NULL,
  domain TEXT,
  priority REAL NOT NULL DEFAULT 0.5,
  active INTEGER NOT NULL DEFAULT 1,
  fire_count INTEGER NOT NULL DEFAULT 0,
  max_fires INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_fired TEXT,
  source_memory_id TEXT,
  FOREIGN KEY (source_memory_id) REFERENCES memories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_prospective_active ON prospective_memory(active);
CREATE INDEX IF NOT EXISTS idx_prospective_domain ON prospective_memory(domain);

-- Metacognition metrics (self-monitoring loop)
CREATE TABLE IF NOT EXISTS metacognition_metrics (
  id TEXT PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value REAL NOT NULL,
  context TEXT NOT NULL DEFAULT '{}',
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_metacog_type ON metacognition_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metacog_time ON metacognition_metrics(timestamp);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_storage_tier ON memories(storage_tier);
CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed);
CREATE INDEX IF NOT EXISTS idx_memories_durability ON memories(encoding_strength, reinforcement);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_version ON memories(version);
CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(type);
CREATE INDEX IF NOT EXISTS idx_cold_original ON cold_storage(original_id);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content,
  summary,
  domains,
  tags,
  content=memories,
  content_rowid=rowid
);

-- Triggers to keep FTS in sync with memories table
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, summary, domains, tags)
  VALUES (new.rowid, new.content, new.summary, new.domains, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary, domains, tags)
  VALUES ('delete', old.rowid, old.content, old.summary, old.domains, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary, domains, tags)
  VALUES ('delete', old.rowid, old.content, old.summary, old.domains, old.tags);
  INSERT INTO memories_fts(rowid, content, summary, domains, tags)
  VALUES (new.rowid, new.content, new.summary, new.domains, new.tags);
END;
`;
var _db = null;
function initDatabase(config) {
  if (_db) return _db;
  const dir = dirname2(config.db_path);
  if (!existsSync2(dir)) {
    mkdirSync2(dir, { recursive: true });
  }
  const db = new Database(config.db_path);
  if (config.wal_mode) {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("cache_size = -64000");
  db.exec(SCHEMA_SQL);
  const schemaColumns = db.prepare("PRAGMA table_info('schemas')").all();
  const columnNames = new Set(schemaColumns.map((c) => c.name));
  if (!columnNames.has("status")) {
    db.exec("ALTER TABLE schemas ADD COLUMN status TEXT NOT NULL DEFAULT 'candidate'");
  }
  if (!columnNames.has("abstraction_level")) {
    db.exec("ALTER TABLE schemas ADD COLUMN abstraction_level INTEGER NOT NULL DEFAULT 0");
  }
  const memColumns = db.prepare("PRAGMA table_info('memories')").all();
  const memColNames = new Set(memColumns.map((c) => c.name));
  if (!memColNames.has("embedding")) {
    db.exec("ALTER TABLE memories ADD COLUMN embedding BLOB DEFAULT NULL");
  }
  if (!memColNames.has("project_path")) {
    db.exec("ALTER TABLE memories ADD COLUMN project_path TEXT DEFAULT NULL");
    db.exec("CREATE INDEX IF NOT EXISTS idx_memories_project_path ON memories(project_path)");
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS tfidf_vocabulary (
      term TEXT PRIMARY KEY,
      document_frequency INTEGER NOT NULL DEFAULT 1,
      idf REAL NOT NULL DEFAULT 1.0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tfidf_idf ON tfidf_vocabulary(idf);

    CREATE TABLE IF NOT EXISTS tfidf_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_memories_tier_type ON memories(storage_tier, type);
    CREATE INDEX IF NOT EXISTS idx_cold_archived_date ON cold_storage(archived_date);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_map (
      project_path TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      skeleton TEXT NOT NULL DEFAULT '',
      file_hash TEXT NOT NULL DEFAULT '',
      last_parsed TEXT NOT NULL,
      PRIMARY KEY (project_path, file_path)
    );
    CREATE INDEX IF NOT EXISTS idx_project_map_project ON project_map(project_path);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_candidates (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      file_path TEXT,
      occurrences INTEGER NOT NULL DEFAULT 1,
      fix_content TEXT,
      fix_file_path TEXT,
      fix_command TEXT,
      graduated INTEGER NOT NULL DEFAULT 0,
      graduated_memory_id TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      project_path TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_error_candidates_fingerprint ON error_candidates(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_error_candidates_graduated ON error_candidates(graduated);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_journal (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'paused', 'completed', 'abandoned')),
      files_touched TEXT NOT NULL DEFAULT '[]',
      blockers TEXT NOT NULL DEFAULT '[]',
      progress_pct INTEGER NOT NULL DEFAULT 0,
      session_count INTEGER NOT NULL DEFAULT 1,
      last_session_id TEXT,
      project_path TEXT,
      domain TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_task_journal_status ON task_journal(status);
    CREATE INDEX IF NOT EXISTS idx_task_journal_project ON task_journal(project_path);

    -- test_runs: Basal ganglia habit learning
    CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      outcome TEXT NOT NULL DEFAULT 'pass'
        CHECK(outcome IN ('pass', 'fail', 'flaky', 'error')),
      failed_tests TEXT NOT NULL DEFAULT '[]',
      session_id TEXT,
      project_path TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_test_runs_project ON test_runs(project_path);
    CREATE INDEX IF NOT EXISTS idx_test_runs_outcome ON test_runs(outcome);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_goals (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      topic TEXT NOT NULL,
      priority REAL NOT NULL DEFAULT 0.5,
      reason TEXT NOT NULL DEFAULT '',
      target_confidence REAL NOT NULL DEFAULT 0.7,
      current_confidence REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'achieved', 'abandoned')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_learning_goals_status ON learning_goals(status);
    CREATE INDEX IF NOT EXISTS idx_learning_goals_domain ON learning_goals(domain);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS self_model (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      strengths TEXT NOT NULL DEFAULT '[]',
      weaknesses TEXT NOT NULL DEFAULT '[]',
      preferred_approaches TEXT NOT NULL DEFAULT '[]',
      user_preferences TEXT NOT NULL DEFAULT '[]',
      communication_style TEXT NOT NULL DEFAULT '',
      trust_level REAL NOT NULL DEFAULT 0.5,
      common_tasks TEXT NOT NULL DEFAULT '[]',
      session_count INTEGER NOT NULL DEFAULT 0,
      total_turns INTEGER NOT NULL DEFAULT 0,
      frustration_triggers TEXT NOT NULL DEFAULT '[]',
      satisfaction_triggers TEXT NOT NULL DEFAULT '[]',
      last_session_summary TEXT NOT NULL DEFAULT '',
      ongoing_context TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS mastery_profiles (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      skill TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'novice'
        CHECK(level IN ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert')),
      evidence TEXT NOT NULL DEFAULT '[]',
      practice_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      success_rate REAL NOT NULL DEFAULT 0.0,
      last_practiced TEXT NOT NULL,
      next_review TEXT NOT NULL,
      zone_of_proximal TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(domain, skill)
    );
    CREATE INDEX IF NOT EXISTS idx_mastery_domain ON mastery_profiles(domain);
    CREATE INDEX IF NOT EXISTS idx_mastery_level ON mastery_profiles(level);
    CREATE INDEX IF NOT EXISTS idx_mastery_next_review ON mastery_profiles(next_review);
  `);
  const selfModelCols = db.prepare("PRAGMA table_info('self_model')").all();
  const selfModelColNames = new Set(selfModelCols.map((c) => c.name));
  if (!selfModelColNames.has("relationship")) {
    db.exec("ALTER TABLE self_model ADD COLUMN relationship TEXT NOT NULL DEFAULT '{}'");
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_prerequisites (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      skill TEXT NOT NULL,
      prerequisite_skill TEXT NOT NULL,
      required_level TEXT NOT NULL DEFAULT 'advanced_beginner'
        CHECK(required_level IN ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert')),
      auto_discovered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(domain, skill, prerequisite_skill)
    );
    CREATE INDEX IF NOT EXISTS idx_prerequisites_domain ON skill_prerequisites(domain);
    CREATE INDEX IF NOT EXISTS idx_prerequisites_skill ON skill_prerequisites(domain, skill);

    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      name TEXT NOT NULL,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_learning_paths_domain ON learning_paths(domain);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS architecture_nodes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('module', 'model', 'service', 'controller', 'view', 'cron', 'mixin')),
      name TEXT NOT NULL,
      module TEXT NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      role TEXT DEFAULT NULL,
      project_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_arch_nodes_module ON architecture_nodes(module);
    CREATE INDEX IF NOT EXISTS idx_arch_nodes_project ON architecture_nodes(project_path);
    CREATE INDEX IF NOT EXISTS idx_arch_nodes_file ON architecture_nodes(file_path);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_arch_nodes_unique ON architecture_nodes(project_path, module, type, name);

    CREATE TABLE IF NOT EXISTS architecture_edges (
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('depends_on', 'calls', 'inherits', 'triggers', 'produces', 'consumes', 'contains')),
      label TEXT DEFAULT NULL,
      strength REAL NOT NULL DEFAULT 0.5,
      evidence_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_observed TEXT NOT NULL,
      PRIMARY KEY (source_id, target_id, type),
      FOREIGN KEY (source_id) REFERENCES architecture_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES architecture_nodes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_arch_edges_target ON architecture_edges(target_id);
    CREATE INDEX IF NOT EXISTS idx_arch_edges_type ON architecture_edges(type);
    CREATE INDEX IF NOT EXISTS idx_arch_edges_last_observed ON architecture_edges(last_observed);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reasoning_chains (
      id TEXT PRIMARY KEY,
      chain_type TEXT NOT NULL CHECK(chain_type IN ('debug', 'investigation', 'design', 'refactor', 'migration')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'interrupted', 'failed')),
      trigger TEXT NOT NULL,
      domain TEXT,
      steps TEXT NOT NULL DEFAULT '[]',
      conclusion TEXT,
      confidence REAL DEFAULT 0.5,
      validated INTEGER DEFAULT 0,
      reuse_count INTEGER DEFAULT 0,
      memory_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reasoning_chains_type ON reasoning_chains(chain_type);
    CREATE INDEX IF NOT EXISTS idx_reasoning_chains_status ON reasoning_chains(status);
    CREATE INDEX IF NOT EXISTS idx_reasoning_chains_domain ON reasoning_chains(domain);
    CREATE INDEX IF NOT EXISTS idx_reasoning_chains_memory ON reasoning_chains(memory_id);
  `);
  const schemaCols2 = db.prepare("PRAGMA table_info('schemas')").all();
  const schemaColNames2 = new Set(schemaCols2.map((c) => c.name));
  if (!schemaColNames2.has("description")) {
    db.exec("ALTER TABLE schemas ADD COLUMN description TEXT DEFAULT NULL");
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_memories_flagged ON memories(flagged_for_pruning) WHERE flagged_for_pruning = 1;
    CREATE INDEX IF NOT EXISTS idx_memories_pinned ON memories(pinned) WHERE pinned = 1;
    CREATE INDEX IF NOT EXISTS idx_memories_has_embedding ON memories(id) WHERE embedding IS NOT NULL;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS mental_models (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      project_path TEXT,
      understanding TEXT NOT NULL,
      principles TEXT NOT NULL DEFAULT '[]',
      patterns TEXT NOT NULL DEFAULT '[]',
      pitfalls TEXT NOT NULL DEFAULT '[]',
      trajectory TEXT,
      confidence REAL NOT NULL DEFAULT 0.5,
      memory_count INTEGER NOT NULL DEFAULT 0,
      generated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(domain, project_path)
    );
    CREATE INDEX IF NOT EXISTS idx_mental_models_domain ON mental_models(domain);
  `);
  _db = db;
  return db;
}
function getDatabase() {
  if (!_db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return _db;
}
function closeDatabase() {
  if (_db) {
    _projectDbAttached = false;
    _projectDbPath = null;
    _db.close();
    _db = null;
  }
}
function transaction(fn) {
  const db = getDatabase();
  return db.transaction(fn)();
}
function getDatabaseSizeBytes(dbPath) {
  const path = dbPath ?? _db?.name;
  if (!path) return 0;
  try {
    const stat = statSync(path);
    return stat.size;
  } catch {
    return 0;
  }
}
var PROJECT_SCHEMA_SQL = `
-- Project-scoped episodic memories
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('semantic', 'episodic', 'procedural', 'antipattern')),
  content TEXT NOT NULL,
  summary TEXT,
  token_count INTEGER NOT NULL DEFAULT 0,
  summary_token_count INTEGER NOT NULL DEFAULT 0,
  encoding_strength REAL NOT NULL DEFAULT 0.5,
  reinforcement REAL NOT NULL DEFAULT 1.0,
  confidence REAL NOT NULL DEFAULT 0.5,
  validation_count INTEGER NOT NULL DEFAULT 0,
  contradiction_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TEXT,
  access_count INTEGER NOT NULL DEFAULT 0,
  domains TEXT NOT NULL DEFAULT '[]',
  version TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  storage_tier TEXT NOT NULL DEFAULT 'short_term'
    CHECK(storage_tier IN ('working', 'short_term', 'medium_term', 'long_term', 'cold')),
  flagged_for_pruning INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  superseded_by TEXT,
  transformed_to TEXT,
  encoding_context TEXT NOT NULL DEFAULT '{}',
  type_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  project_path TEXT,
  embedding BLOB DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_storage_tier ON memories(storage_tier);
CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_project_path ON memories(project_path);

-- FTS5 for project-scoped search
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content,
  summary,
  domains,
  tags,
  content=memories,
  content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, summary, domains, tags)
  VALUES (new.rowid, new.content, new.summary, new.domains, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary, domains, tags)
  VALUES ('delete', old.rowid, old.content, old.summary, old.domains, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, summary, domains, tags)
  VALUES ('delete', old.rowid, old.content, old.summary, old.domains, old.tags);
  INSERT INTO memories_fts(rowid, content, summary, domains, tags)
  VALUES (new.rowid, new.content, new.summary, new.domains, new.tags);
END;

-- Project-scoped operational tables
CREATE TABLE IF NOT EXISTS error_candidates (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  file_path TEXT,
  occurrences INTEGER NOT NULL DEFAULT 1,
  fix_content TEXT,
  fix_file_path TEXT,
  fix_command TEXT,
  graduated INTEGER NOT NULL DEFAULT 0,
  graduated_memory_id TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  project_path TEXT
);
CREATE INDEX IF NOT EXISTS idx_error_candidates_fingerprint ON error_candidates(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_candidates_graduated ON error_candidates(graduated);

CREATE TABLE IF NOT EXISTS task_journal (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active', 'paused', 'completed', 'abandoned')),
  files_touched TEXT NOT NULL DEFAULT '[]',
  blockers TEXT NOT NULL DEFAULT '[]',
  progress_pct INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 1,
  last_session_id TEXT,
  project_path TEXT,
  domain TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_task_journal_status ON task_journal(status);
CREATE INDEX IF NOT EXISTS idx_task_journal_project ON task_journal(project_path);

CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'pass'
    CHECK(outcome IN ('pass', 'fail', 'flaky', 'error')),
  failed_tests TEXT NOT NULL DEFAULT '[]',
  session_id TEXT,
  project_path TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_runs_project ON test_runs(project_path);
CREATE INDEX IF NOT EXISTS idx_test_runs_outcome ON test_runs(outcome);

CREATE TABLE IF NOT EXISTS project_map (
  project_path TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  skeleton TEXT NOT NULL DEFAULT '',
  file_hash TEXT NOT NULL DEFAULT '',
  last_parsed TEXT NOT NULL,
  PRIMARY KEY (project_path, file_path)
);
CREATE INDEX IF NOT EXISTS idx_project_map_project ON project_map(project_path);

CREATE TABLE IF NOT EXISTS architecture_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('module', 'model', 'service', 'controller', 'view', 'cron', 'mixin')),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  file_path TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT NULL,
  project_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_arch_nodes_module ON architecture_nodes(module);
CREATE INDEX IF NOT EXISTS idx_arch_nodes_project ON architecture_nodes(project_path);
CREATE INDEX IF NOT EXISTS idx_arch_nodes_file ON architecture_nodes(file_path);
CREATE UNIQUE INDEX IF NOT EXISTS idx_arch_nodes_unique ON architecture_nodes(project_path, module, type, name);

CREATE TABLE IF NOT EXISTS architecture_edges (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('depends_on', 'calls', 'inherits', 'triggers', 'produces', 'consumes', 'contains')),
  label TEXT DEFAULT NULL,
  strength REAL NOT NULL DEFAULT 0.5,
  evidence_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_observed TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, type),
  FOREIGN KEY (source_id) REFERENCES architecture_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES architecture_nodes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_arch_edges_target ON architecture_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_arch_edges_type ON architecture_edges(type);
CREATE INDEX IF NOT EXISTS idx_arch_edges_last_observed ON architecture_edges(last_observed);

CREATE TABLE IF NOT EXISTS reasoning_chains (
  id TEXT PRIMARY KEY,
  chain_type TEXT NOT NULL CHECK(chain_type IN ('debug', 'investigation', 'design', 'refactor', 'migration')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'interrupted', 'failed')),
  trigger TEXT NOT NULL,
  domain TEXT,
  steps TEXT NOT NULL DEFAULT '[]',
  conclusion TEXT,
  confidence REAL DEFAULT 0.5,
  validated INTEGER DEFAULT 0,
  reuse_count INTEGER DEFAULT 0,
  memory_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_type ON reasoning_chains(chain_type);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_status ON reasoning_chains(status);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_domain ON reasoning_chains(domain);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_memory ON reasoning_chains(memory_id);
`;
var _projectDbAttached = false;
var _projectDbPath = null;
function initProjectDatabase(projectDbPath) {
  const mainDb = getDatabase();
  const dir = dirname2(projectDbPath);
  if (!existsSync2(dir)) {
    mkdirSync2(dir, { recursive: true });
  }
  const isNew = !existsSync2(projectDbPath);
  const projDb = new Database(projectDbPath);
  projDb.pragma("journal_mode = WAL");
  projDb.pragma("busy_timeout = 5000");
  if (isNew) {
    projDb.exec(PROJECT_SCHEMA_SQL);
  } else {
    projDb.exec(PROJECT_SCHEMA_SQL);
  }
  projDb.close();
  if (_projectDbAttached) {
    detachProjectDb();
  }
  const safePath = validateDbPathForAttach(projectDbPath);
  mainDb.exec(`ATTACH DATABASE '${safePath.replace(/'/g, "''")}' AS project`);
  _projectDbAttached = true;
  _projectDbPath = safePath;
}
function detachProjectDb() {
  if (!_projectDbAttached) return;
  try {
    const db = getDatabase();
    db.exec("DETACH DATABASE project");
  } catch {
  }
  _projectDbAttached = false;
  _projectDbPath = null;
}
function isProjectDbAttached() {
  return _projectDbAttached;
}
function getProjectDbPath() {
  return _projectDbPath;
}
function attachTemporary(dbPath, alias) {
  const db = getDatabase();
  const safePath = validateDbPathForAttach(dbPath);
  const safeAlias = validateAlias(alias);
  db.exec(`ATTACH DATABASE '${safePath.replace(/'/g, "''")}' AS "${safeAlias}"`);
}
function detachTemporary(alias) {
  try {
    const safeAlias = validateAlias(alias);
    const db = getDatabase();
    db.exec(`DETACH DATABASE "${safeAlias}"`);
  } catch {
  }
}
function listProjectDatabases() {
  const projectsDir = join2(homedir2(), ".engram", PROJECT.DB_DIR);
  if (!existsSync2(projectsDir)) return [];
  const results = [];
  try {
    for (const entry of readdirSync(projectsDir)) {
      const dbPath = join2(projectsDir, entry, "project.db");
      if (existsSync2(dbPath)) {
        results.push(dbPath);
      }
    }
  } catch {
  }
  return results;
}
function getProjectDatabaseInfo(dbPaths) {
  const paths = dbPaths ?? listProjectDatabases();
  const results = [];
  for (const dbPath of paths) {
    try {
      const stat = statSync(dbPath);
      const dirName = dbPath.split("/").at(-2) ?? "unknown";
      let memoryCount = 0;
      try {
        const projDb = new Database(dbPath, { readonly: true });
        try {
          const row = projDb.prepare("SELECT COUNT(*) as cnt FROM memories").get();
          memoryCount = row?.cnt ?? 0;
        } finally {
          projDb.close();
        }
      } catch {
      }
      results.push({
        name: dirName,
        path: dbPath,
        size_bytes: stat.size,
        last_modified: stat.mtime.toISOString(),
        memory_count: memoryCount
      });
    } catch {
    }
  }
  return results;
}

// src/utils.ts
import { v4 as uuidv4 } from "uuid";
function generateId() {
  return uuidv4();
}
function safeErrorStr(e, maxLen = 200) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.length > maxLen ? msg.slice(0, maxLen) + "..." : msg;
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function parseTimestamp(iso) {
  return new Date(iso);
}
function hoursElapsed(from, to) {
  const diff = parseTimestamp(to).getTime() - parseTimestamp(from).getTime();
  return diff / (1e3 * 60 * 60);
}
function daysElapsed(from, to) {
  return hoursElapsed(from, to) / 24;
}
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
function calculateDurability(encodingStrength, reinforcement) {
  return encodingStrength * reinforcement;
}
function calculateRetention(elapsedDays, stability) {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.exp(-elapsedDays / stability);
}
function calculateStability(durability, connectionCount, accessCount, baseStability = 1, connectionBonus = 0.1, retrievalBonus = 0.2) {
  return baseStability * durability * (1 + connectionBonus * connectionCount) * (1 + retrievalBonus * accessCount);
}
function extractKeywords(text) {
  const STOP_WORDS = /* @__PURE__ */ new Set([
    // Standard English stopwords
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "shall",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "as",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "out",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "because",
    "but",
    "and",
    "or",
    "if",
    "while",
    "that",
    "this",
    "these",
    "those",
    "it",
    "its",
    "i",
    "me",
    "my",
    "we",
    "our",
    "you",
    "your",
    "he",
    "she",
    "they",
    "them",
    "his",
    "her",
    "what",
    "which",
    "who",
    "whom",
    // Technical/path noise words
    "now",
    "also",
    "like",
    "get",
    "got",
    "set",
    "let",
    "run",
    "use",
    "used",
    "new",
    "file",
    "code",
    "need",
    "opt",
    "src",
    "add",
    "see",
    "try",
    "one",
    "two",
    "way",
    "back",
    "still",
    "done",
    "well",
    "look",
    "good",
    "want",
    "work",
    "make",
    "made",
    "take",
    "show",
    "thing",
    "right",
    "going",
    "already",
    "sure",
    "first",
    "last",
    "next",
    "put",
    "took"
  ]);
  return text.toLowerCase().replace(/[^a-z0-9_\-\.]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
function keywordSimilarity(textA, textB) {
  const kwA = new Set(extractKeywords(textA));
  const kwB = new Set(extractKeywords(textB));
  if (kwA.size === 0 || kwB.size === 0) return 0;
  let intersection = 0;
  for (const kw of kwA) {
    if (kwB.has(kw)) intersection++;
  }
  const union = kwA.size + kwB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
function safeJsonParse(json, fallback) {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    if (fallback !== null && typeof fallback === "object" && (typeof parsed !== "object" || parsed === null)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}
function toJson(value) {
  return JSON.stringify(value);
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function escapeLikePattern(value) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/"/g, '\\"');
}
function sanitizeFts5Query(query, useStemming = true) {
  if (!query || !query.trim()) return "";
  const cleaned = query.replace(/\0/g, " ").replace(/[{}()"^*:<>\-+\[\]]/g, " ").replace(/\b(AND|OR|NOT|NEAR|COLLATE)\b/gi, " ").trim();
  if (!cleaned) return "";
  const rawTokens = cleaned.split(/\s+/).filter((t) => t.length > 0 && t.length < SQL.MAX_FTS5_TOKEN_LENGTH).map((t) => t.replace(/"/g, "").toLowerCase()).filter((t) => t.length > 0);
  if (rawTokens.length === 0) return "";
  const allTerms = /* @__PURE__ */ new Set();
  for (const t of rawTokens) {
    allTerms.add(t);
    if (useStemming && t.length > 3) {
      const stemmed = porterStemLight(t);
      if (stemmed !== t && stemmed.length > 2) {
        allTerms.add(stemmed);
      }
    }
  }
  return [...allTerms].map((t) => `"${t}"`).join(" OR ");
}
function porterStemLight(word) {
  let stem = word.toLowerCase();
  if (stem.length <= 3) return stem;
  if (stem.endsWith("sses")) return stem.slice(0, -2);
  if (stem.endsWith("ies") && stem.length > 4) return stem.slice(0, -2);
  if (stem.endsWith("ss")) return stem;
  if (stem.endsWith("s") && stem.length > 3) stem = stem.slice(0, -1);
  const m = stem.match(/^(.+?)(ed|ing)$/);
  if (m && /[aeiou]/.test(m[1]) && m[1].length > 2) {
    stem = m[1];
    if (stem.endsWith("at") || stem.endsWith("bl") || stem.endsWith("iz")) {
      stem += "e";
    }
  }
  if (stem.endsWith("tion") && stem.length > 5) return stem.slice(0, -3);
  if (stem.endsWith("sion") && stem.length > 5) return stem.slice(0, -3);
  if (stem.endsWith("ly") && stem.length > 4) return stem.slice(0, -2);
  if (stem.endsWith("ment") && stem.length > 6) return stem.slice(0, -4);
  return stem;
}

// src/logger.ts
var LEVEL_ORDER = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};
var _currentLevel = "info";
function setLogLevel(level) {
  _currentLevel = level;
}
function shouldLog(level) {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[_currentLevel];
}
function formatMessage(level, subsystem, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] [${subsystem}]`;
  if (data && Object.keys(data).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}
function createLogger(subsystem) {
  return {
    error(message, data) {
      if (shouldLog("error")) {
        console.error(formatMessage("error", subsystem, message, data));
      }
    },
    warn(message, data) {
      if (shouldLog("warn")) {
        console.error(formatMessage("warn", subsystem, message, data));
      }
    },
    info(message, data) {
      if (shouldLog("info")) {
        console.error(formatMessage("info", subsystem, message, data));
      }
    },
    debug(message, data) {
      if (shouldLog("debug")) {
        console.error(formatMessage("debug", subsystem, message, data));
      }
    }
  };
}
var log = createLogger("engram");

// src/engines/autonomic.ts
var logger = createLogger("autonomic");
var _state = {
  mode: "parasympathetic",
  error_rate: 0,
  session_error_count: 0,
  session_event_count: 0,
  significance_threshold_modifier: 1,
  retrieval_breadth_modifier: 1,
  last_mode_change: now()
};
function getAutonomicState() {
  return { ..._state };
}
function recordEvent(isError) {
  _state.session_event_count++;
  if (isError) {
    _state.session_error_count++;
  }
  _state.error_rate = _state.session_event_count > 0 ? _state.session_error_count / _state.session_event_count : 0;
  evaluateModeTransition();
  return { ..._state };
}
function resetAutonomicState() {
  _state = {
    mode: "parasympathetic",
    error_rate: 0,
    session_error_count: 0,
    session_event_count: 0,
    significance_threshold_modifier: 1,
    retrieval_breadth_modifier: 1,
    last_mode_change: now()
  };
  logger.info("Autonomic state reset");
}
function getRetrievalModifier() {
  return _state.retrieval_breadth_modifier;
}
function evaluateModeTransition() {
  if (_state.session_event_count < AUTONOMIC.MIN_EVENTS_FOR_MODE_SWITCH) return;
  const previousMode = _state.mode;
  if (_state.mode === "parasympathetic" && _state.error_rate >= AUTONOMIC.SYMPATHETIC_ERROR_RATE) {
    _state.mode = "sympathetic";
    _state.significance_threshold_modifier = AUTONOMIC.SYMPATHETIC_SIGNIFICANCE_MODIFIER;
    _state.retrieval_breadth_modifier = AUTONOMIC.SYMPATHETIC_RETRIEVAL_MODIFIER;
    _state.last_mode_change = now();
    logger.warn("Switched to SYMPATHETIC mode", {
      error_rate: _state.error_rate.toFixed(2),
      errors: _state.session_error_count,
      events: _state.session_event_count
    });
  } else if (_state.mode === "sympathetic" && _state.error_rate < AUTONOMIC.PARASYMPATHETIC_ERROR_RATE) {
    _state.mode = "parasympathetic";
    _state.significance_threshold_modifier = 1;
    _state.retrieval_breadth_modifier = 1;
    _state.last_mode_change = now();
    logger.info("Switched to PARASYMPATHETIC mode", {
      error_rate: _state.error_rate.toFixed(2)
    });
  }
}

// src/storage/repository.ts
var MEMORY_COLS = "id, type, content, summary, token_count, summary_token_count, encoding_strength, reinforcement, confidence, validation_count, contradiction_count, last_accessed, access_count, domains, version, tags, storage_tier, flagged_for_pruning, pinned, superseded_by, transformed_to, encoding_context, type_data, created_at, updated_at";
function rowToMemory(row) {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    summary: row.summary,
    token_count: row.token_count,
    summary_token_count: row.summary_token_count,
    encoding_strength: row.encoding_strength,
    reinforcement: row.reinforcement,
    confidence: row.confidence,
    validation_count: row.validation_count,
    contradiction_count: row.contradiction_count,
    last_accessed: row.last_accessed,
    access_count: row.access_count,
    domains: safeJsonParse(row.domains, []),
    version: row.version,
    tags: safeJsonParse(row.tags, []),
    storage_tier: row.storage_tier,
    flagged_for_pruning: row.flagged_for_pruning === 1,
    pinned: row.pinned === 1,
    superseded_by: row.superseded_by,
    transformed_to: row.transformed_to,
    encoding_context: safeJsonParse(row.encoding_context, {
      project: null,
      framework: null,
      version: null,
      task_type: null,
      files: [],
      error_context: null,
      session_id: "",
      significance_score: 0
    }),
    type_data: safeJsonParse(row.type_data, { kind: row.type }),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function rowToConnection(row) {
  return {
    source_id: row.source_id,
    target_id: row.target_id,
    strength: row.strength,
    type: row.type,
    co_activation_count: row.co_activation_count,
    created_at: row.created_at,
    last_activated: row.last_activated
  };
}
function rowToSchema(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    pattern_id: row.pattern_id ?? "",
    instances: safeJsonParse(row.instances, []),
    domains_seen_in: safeJsonParse(row.domains_seen_in, []),
    confidence: row.confidence,
    validation_count: row.validation_count,
    false_positive_count: row.false_positive_count,
    formation_date: row.formation_date,
    last_validated: row.last_validated,
    status: row.status ?? "candidate",
    abstraction_level: row.abstraction_level ?? 0
  };
}
function rowToPattern(row) {
  return {
    id: row.id,
    memory_id: row.memory_id,
    relations: safeJsonParse(row.relations, []),
    abstraction_level: row.abstraction_level,
    confidence: row.confidence
  };
}
function rowToVersion(row) {
  return {
    domain: row.domain,
    version: row.version,
    parent_version: row.parent_version,
    overrides: safeJsonParse(row.overrides, []),
    antipatterns: safeJsonParse(row.antipatterns, []),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function createMemory(mem) {
  const db = getDatabase();
  const id = mem.id ?? generateId();
  const timestamp = now();
  const tokenCount = estimateTokens(mem.content);
  const summaryTokenCount = mem.summary ? estimateTokens(mem.summary) : 0;
  const projectPath = mem.encoding_context.project_path ?? null;
  const table = mem.type === "episodic" && isProjectDbAttached() ? "project.memories" : "memories";
  db.prepare(`
    INSERT INTO ${table} (
      id, type, content, summary, token_count, summary_token_count,
      encoding_strength, reinforcement, confidence,
      validation_count, contradiction_count, last_accessed, access_count,
      domains, version, tags, storage_tier,
      flagged_for_pruning, pinned, superseded_by, transformed_to,
      encoding_context, type_data, created_at, updated_at, project_path
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      0, 0, NULL, 0,
      ?, ?, ?, ?,
      0, ?, NULL, NULL,
      ?, ?, ?, ?, ?
    )
  `).run(
    id,
    mem.type,
    mem.content,
    mem.summary ?? null,
    tokenCount,
    summaryTokenCount,
    mem.encoding_strength,
    mem.reinforcement,
    mem.confidence,
    toJson(mem.domains),
    mem.version ?? null,
    toJson(mem.tags),
    mem.storage_tier,
    mem.pinned ? 1 : 0,
    toJson(mem.encoding_context),
    toJson(mem.type_data),
    timestamp,
    timestamp,
    projectPath
  );
  return getMemory(id);
}
function getMemory(id) {
  const db = getDatabase();
  const row = db.prepare(`SELECT ${MEMORY_COLS} FROM memories WHERE id = ?`).get(id);
  if (row) return rowToMemory(row);
  if (isProjectDbAttached()) {
    const projRow = db.prepare(`SELECT ${MEMORY_COLS} FROM project.memories WHERE id = ?`).get(id);
    if (projRow) return rowToMemory(projRow);
  }
  return null;
}
function updateMemory(id, updates) {
  const db = getDatabase();
  const existing = getMemory(id);
  if (!existing) return null;
  const setClauses = [];
  const values = [];
  const fieldMap = {
    content: (v) => v,
    summary: (v) => v,
    encoding_strength: (v) => v,
    reinforcement: (v) => v,
    confidence: (v) => v,
    validation_count: (v) => v,
    contradiction_count: (v) => v,
    last_accessed: (v) => v,
    access_count: (v) => v,
    version: (v) => v,
    storage_tier: (v) => v,
    pinned: (v) => v ? 1 : 0,
    flagged_for_pruning: (v) => v ? 1 : 0,
    superseded_by: (v) => v,
    transformed_to: (v) => v,
    domains: (v) => toJson(v),
    tags: (v) => toJson(v),
    encoding_context: (v) => toJson(v),
    type_data: (v) => toJson(v)
  };
  for (const [key, transform] of Object.entries(fieldMap)) {
    if (key in updates) {
      const val = updates[key];
      setClauses.push(`${key} = ?`);
      values.push(transform(val));
    }
  }
  if ("content" in updates && updates.content !== void 0) {
    setClauses.push("token_count = ?");
    values.push(estimateTokens(updates.content));
  }
  if ("summary" in updates && updates.summary !== void 0) {
    setClauses.push("summary_token_count = ?");
    values.push(updates.summary ? estimateTokens(updates.summary) : 0);
  }
  if (setClauses.length === 0) return existing;
  setClauses.push("updated_at = ?");
  values.push(now());
  values.push(id);
  const result = db.prepare(`UPDATE memories SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  if (result.changes === 0 && isProjectDbAttached()) {
    db.prepare(`UPDATE project.memories SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  }
  return getMemory(id);
}
function deleteMemory(id) {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM memories WHERE id = ?").run(id);
  if (result.changes > 0) return true;
  if (isProjectDbAttached()) {
    const projResult = db.prepare("DELETE FROM project.memories WHERE id = ?").run(id);
    return projResult.changes > 0;
  }
  return false;
}
function searchMemories(query, limit = 20, project) {
  const db = getDatabase();
  const sanitized = sanitizeFts5Query(query);
  if (!sanitized) return [];
  const memoryCols = MEMORY_COLS.split(", ").map((c) => "m." + c).join(", ");
  if (isProjectDbAttached()) {
    const rows2 = db.prepare(`
      SELECT * FROM (
        SELECT ${memoryCols}, rank FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
        AND m.superseded_by IS NULL
        UNION ALL
        SELECT ${memoryCols}, rank FROM project.memories m
        JOIN project.memories_fts fts ON m.rowid = fts.rowid
        WHERE fts.memories_fts MATCH ?
        AND m.superseded_by IS NULL
      ) ORDER BY rank LIMIT ?
    `).all(sanitized, sanitized, limit);
    return rows2.map(rowToMemory);
  }
  const projectClause = project ? `AND (m.type != 'episodic' OR m.project_path IS NULL OR m.project_path = ?)` : "";
  const params = [sanitized];
  if (project) params.push(project);
  params.push(limit);
  const rows = db.prepare(`
    SELECT ${memoryCols} FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
    AND m.superseded_by IS NULL
    ${projectClause}
    ORDER BY rank
    LIMIT ?
  `).all(...params);
  return rows.map(rowToMemory);
}
function searchMemoriesByDomain(query, domain, limit = 20, minResults = 3, project) {
  const db = getDatabase();
  const sanitized = sanitizeFts5Query(query);
  if (!sanitized) return [];
  const escaped = escapeLikePattern(domain);
  const memoryCols = MEMORY_COLS.split(", ").map((c) => "m." + c).join(", ");
  if (isProjectDbAttached()) {
    const domainRows2 = db.prepare(`
      SELECT * FROM (
        SELECT ${memoryCols}, rank FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
        AND m.domains LIKE ? ESCAPE '\\'
        AND m.superseded_by IS NULL
        UNION ALL
        SELECT ${memoryCols}, rank FROM project.memories m
        JOIN project.memories_fts fts ON m.rowid = fts.rowid
        WHERE fts.memories_fts MATCH ?
        AND m.domains LIKE ? ESCAPE '\\'
        AND m.superseded_by IS NULL
      ) ORDER BY rank LIMIT ?
    `).all(sanitized, `%"${escaped}"%`, sanitized, `%"${escaped}"%`, limit);
    if (domainRows2.length >= minResults) {
      return domainRows2.map(rowToMemory);
    }
    const rows2 = db.prepare(`
      SELECT * FROM (
        SELECT ${memoryCols}, rank FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
        AND m.superseded_by IS NULL
        UNION ALL
        SELECT ${memoryCols}, rank FROM project.memories m
        JOIN project.memories_fts fts ON m.rowid = fts.rowid
        WHERE fts.memories_fts MATCH ?
        AND m.superseded_by IS NULL
      ) ORDER BY rank LIMIT ?
    `).all(sanitized, sanitized, limit);
    return rows2.map(rowToMemory);
  }
  const projectClause = project ? `AND (m.type != 'episodic' OR m.project_path IS NULL OR m.project_path = ?)` : "";
  const domainParams = [sanitized, `%"${escaped}"%`];
  if (project) domainParams.push(project);
  domainParams.push(limit);
  const domainRows = db.prepare(`
    SELECT ${memoryCols} FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
    AND m.domains LIKE ? ESCAPE '\\'
    AND m.superseded_by IS NULL
    ${projectClause}
    ORDER BY rank
    LIMIT ?
  `).all(...domainParams);
  if (domainRows.length >= minResults) {
    return domainRows.map(rowToMemory);
  }
  const fallbackParams = [sanitized];
  if (project) fallbackParams.push(project);
  fallbackParams.push(limit);
  const rows = db.prepare(`
    SELECT ${memoryCols} FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
    AND m.superseded_by IS NULL
    ${projectClause}
    ORDER BY rank
    LIMIT ?
  `).all(...fallbackParams);
  return rows.map(rowToMemory);
}
function getMemoriesByType(type, limit = 100) {
  const db = getDatabase();
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories WHERE type = ? ORDER BY created_at DESC LIMIT ?`
  ).all(type, limit);
  return rows.map(rowToMemory);
}
function getMemoriesByDomain(domain, limit = 100) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories WHERE domains LIKE ? ESCAPE '\\' AND superseded_by IS NULL ORDER BY created_at DESC LIMIT ?`
  ).all(`%"${escaped}"%`, limit);
  return rows.map(rowToMemory);
}
function getPreCompactMemories(domain) {
  const db = getDatabase();
  if (domain) {
    const escaped = escapeLikePattern(domain);
    const rows2 = db.prepare(
      `SELECT ${MEMORY_COLS} FROM memories WHERE type = 'episodic' AND tags LIKE '%"pre-compact"%' AND tags LIKE '%"understanding"%' AND domains LIKE ? ESCAPE '\\' AND superseded_by IS NULL ORDER BY created_at DESC`
    ).all(`%"${escaped}"%`);
    return rows2.map(rowToMemory);
  }
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories WHERE type = 'episodic' AND tags LIKE '%"pre-compact"%' AND tags LIKE '%"understanding"%' AND superseded_by IS NULL ORDER BY created_at DESC`
  ).all();
  return rows.map(rowToMemory);
}
function getSynthesisMemories(domain) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories
     WHERE type = 'semantic'
       AND tags LIKE '%"synthesis"%'
       AND tags LIKE '%"domain-knowledge"%'
       AND domains LIKE ? ESCAPE '\\'
       AND superseded_by IS NULL
     ORDER BY created_at DESC`
  ).all(`%"${escaped}"%`);
  return rows.map(rowToMemory);
}
function getAntipatterns(domain) {
  const db = getDatabase();
  if (domain) {
    const escaped = escapeLikePattern(domain);
    const rows2 = db.prepare(
      `SELECT ${MEMORY_COLS} FROM memories WHERE type = 'antipattern'
       AND (domains LIKE ? ESCAPE '\\' OR domains LIKE '%"*"%')
       ORDER BY confidence DESC`
    ).all(`%"${escaped}"%`);
    return rows2.map(rowToMemory);
  }
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories WHERE type = 'antipattern' ORDER BY confidence DESC`
  ).all();
  return rows.map(rowToMemory);
}
function getRecentMemories(limit = 50) {
  const db = getDatabase();
  if (isProjectDbAttached()) {
    const rows2 = db.prepare(`
      SELECT * FROM (
        SELECT ${MEMORY_COLS} FROM memories WHERE storage_tier != 'cold'
        UNION ALL
        SELECT ${MEMORY_COLS} FROM project.memories WHERE storage_tier != 'cold'
      ) ORDER BY created_at DESC LIMIT ?
    `).all(limit);
    return rows2.map(rowToMemory);
  }
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories WHERE storage_tier != 'cold' ORDER BY created_at DESC LIMIT ?`
  ).all(limit);
  return rows.map(rowToMemory);
}
function getSessionMemories(sessionId, limit = 20) {
  const db = getDatabase();
  const query = `SELECT ${MEMORY_COLS} FROM memories
    WHERE json_extract(encoding_context, '$.session_id') = ?
    ORDER BY created_at DESC LIMIT ?`;
  if (isProjectDbAttached()) {
    const rows2 = db.prepare(`
      SELECT * FROM (
        ${query}
        UNION ALL
        SELECT ${MEMORY_COLS} FROM project.memories
          WHERE json_extract(encoding_context, '$.session_id') = ?
          ORDER BY created_at DESC LIMIT ?
      ) ORDER BY created_at DESC LIMIT ?
    `).all(sessionId, limit, sessionId, limit, limit);
    return rows2.map(rowToMemory);
  }
  const rows = db.prepare(query).all(sessionId, limit);
  return rows.map(rowToMemory);
}
function getTopDomainMemories(domain, limit = 5, excludeIds = [], project) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const excludeClause = excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.map(() => "?").join(",")})` : "";
  const projectClause = project ? `AND (type != 'episodic' OR json_extract(encoding_context, '$.project') IS NULL OR json_extract(encoding_context, '$.project') = ?)` : "";
  const params = [`%"${escaped}"%`, ...excludeIds];
  if (project) params.push(project);
  params.push(limit);
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS},
      (
        confidence * 0.35
        + MIN(reinforcement / 3.0, 1.0) * 0.30
        + (1.0 - MIN(CAST((julianday('now') - julianday(created_at)) AS REAL) / 90.0, 1.0)) * 0.15
        + CASE type
            WHEN 'antipattern' THEN 0.20
            WHEN 'procedural'  THEN 0.15
            WHEN 'semantic'    THEN 0.10
            WHEN 'episodic'    THEN 0.05
            ELSE 0.0
          END
      ) AS composite_score
    FROM memories
    WHERE domains LIKE ? ESCAPE '\\'
      AND storage_tier NOT IN ('cold')
      AND flagged_for_pruning = 0
      AND superseded_by IS NULL
      ${excludeClause}
      ${projectClause}
    ORDER BY composite_score DESC
    LIMIT ?`
  ).all(...params);
  return rows.map(rowToMemory);
}
function createConnection(conn) {
  const db = getDatabase();
  const timestamp = now();
  db.prepare(`
    INSERT INTO connections (source_id, target_id, strength, type, co_activation_count, created_at, last_activated)
    VALUES (?, ?, ?, ?, 0, ?, NULL)
    ON CONFLICT(source_id, target_id) DO UPDATE SET
      strength = MAX(excluded.strength, connections.strength),
      type = excluded.type
  `).run(conn.source_id, conn.target_id, conn.strength, conn.type, timestamp);
  return getConnection(conn.source_id, conn.target_id);
}
function getConnection(sourceId, targetId) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM connections WHERE source_id = ? AND target_id = ?"
  ).get(sourceId, targetId);
  return row ? rowToConnection(row) : null;
}
function getConnections(memoryId) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM connections WHERE source_id = ? OR target_id = ?"
  ).all(memoryId, memoryId);
  return rows.map(rowToConnection);
}
function batchGetConnections(memoryIds) {
  if (memoryIds.length === 0) return /* @__PURE__ */ new Map();
  const db = getDatabase();
  const placeholders = memoryIds.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT * FROM connections WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`
  ).all(...memoryIds, ...memoryIds);
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const conn = rowToConnection(row);
    map.set(`${conn.source_id}|${conn.target_id}`, conn);
    map.set(`${conn.target_id}|${conn.source_id}`, conn);
  }
  return map;
}
function findResolutionForError(errorMemoryId) {
  const db = getDatabase();
  const cols = MEMORY_COLS.split(", ").map((c) => `m.${c}`).join(", ");
  const row = db.prepare(
    `SELECT ${cols} FROM memories m
     JOIN connections c ON c.target_id = m.id AND c.source_id = ?
     WHERE c.type = 'caused_by'
     ORDER BY m.created_at DESC LIMIT 1`
  ).get(errorMemoryId);
  if (row) return rowToMemory(row);
  const reverseRow = db.prepare(
    `SELECT ${cols} FROM memories m
     JOIN connections c ON c.source_id = m.id AND c.target_id = ?
     WHERE c.type = 'caused_by'
     ORDER BY m.created_at DESC LIMIT 1`
  ).get(errorMemoryId);
  if (reverseRow) return rowToMemory(reverseRow);
  return null;
}
function batchGetEmbeddings(ids) {
  if (ids.length === 0) return /* @__PURE__ */ new Map();
  const db = getDatabase();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT id, embedding FROM memories WHERE id IN (${placeholders}) AND embedding IS NOT NULL`
  ).all(...ids);
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    map.set(row.id, row.embedding);
  }
  return map;
}
function incrementConnectionActivation(sourceId, targetId, strengthDelta = 0) {
  const db = getDatabase();
  const timestamp = now();
  if (strengthDelta > 0) {
    db.prepare(`
      UPDATE connections SET
        co_activation_count = co_activation_count + 1,
        last_activated = ?,
        strength = MIN(strength + ?, 1.0)
      WHERE source_id = ? AND target_id = ?
    `).run(timestamp, strengthDelta, sourceId, targetId);
  } else {
    db.prepare(`
      UPDATE connections SET co_activation_count = co_activation_count + 1, last_activated = ?
      WHERE source_id = ? AND target_id = ?
    `).run(timestamp, sourceId, targetId);
  }
}
function getNeighborhood(memoryId) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT target_id AS id, strength, type FROM connections WHERE source_id = ?
    UNION
    SELECT source_id AS id, strength, type FROM connections WHERE target_id = ?
  `).all(memoryId, memoryId);
  return rows.map((r) => ({ id: r.id, strength: r.strength, type: r.type }));
}
function bulkIncrementCoActivation(pairs) {
  if (pairs.length === 0) return;
  const db = getDatabase();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const stmt = db.prepare(`
    UPDATE connections
    SET co_activation_count = co_activation_count + 1, last_activated = ?
    WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)
  `);
  const batch = db.transaction((items) => {
    for (const [a, b] of items) {
      stmt.run(timestamp, a, b, b, a);
    }
  });
  batch(pairs);
}
function getStaleConnections(olderThanDays) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1e3).toISOString();
  const rows = getDatabase().prepare(
    `SELECT * FROM connections WHERE last_activated IS NOT NULL AND last_activated < ?
     UNION ALL
     SELECT * FROM connections WHERE last_activated IS NULL AND created_at < ?`
  ).all(cutoff, cutoff);
  return rows.map(rowToConnection);
}
function bulkUpdateConnectionStrengths(updates) {
  const db = getDatabase();
  const stmt = db.prepare(
    "UPDATE connections SET strength = ? WHERE source_id = ? AND target_id = ?"
  );
  let count = 0;
  for (const u of updates) {
    const result = stmt.run(u.strength, u.source_id, u.target_id);
    count += result.changes;
  }
  return count;
}
function bulkDeleteConnections(pairs) {
  const db = getDatabase();
  const stmt = db.prepare(
    "DELETE FROM connections WHERE source_id = ? AND target_id = ?"
  );
  let count = 0;
  for (const p of pairs) {
    const result = stmt.run(p.source_id, p.target_id);
    count += result.changes;
  }
  return count;
}
function createSchema(schema) {
  const db = getDatabase();
  const id = schema.id ?? generateId();
  db.prepare(`
    INSERT INTO schemas (id, name, description, pattern_id, instances, domains_seen_in, confidence, validation_count, false_positive_count, formation_date, last_validated, status, abstraction_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NULL, ?, ?)
  `).run(
    id,
    schema.name,
    schema.description ?? null,
    schema.pattern_id ?? null,
    toJson(schema.instances),
    toJson(schema.domains_seen_in),
    schema.confidence,
    schema.formation_date,
    schema.status ?? "candidate",
    schema.abstraction_level ?? 0
  );
  return getSchema(id);
}
function getSchema(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM schemas WHERE id = ?").get(id);
  return row ? rowToSchema(row) : null;
}
function updateSchema(id, updates) {
  const db = getDatabase();
  const setClauses = [];
  const values = [];
  const simpleFields = ["name", "description", "pattern_id", "confidence", "validation_count", "false_positive_count", "last_validated", "status", "abstraction_level"];
  for (const field of simpleFields) {
    if (field in updates) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }
  if (updates.instances !== void 0) {
    setClauses.push("instances = ?");
    values.push(toJson(updates.instances));
  }
  if (updates.domains_seen_in !== void 0) {
    setClauses.push("domains_seen_in = ?");
    values.push(toJson(updates.domains_seen_in));
  }
  if (setClauses.length === 0) return getSchema(id);
  values.push(id);
  db.prepare(`UPDATE schemas SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  return getSchema(id);
}
function getAllSchemas() {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM schemas ORDER BY confidence DESC").all();
  return rows.map(rowToSchema);
}
function getSchemasForDomain(domain) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const rows = db.prepare(
    `SELECT * FROM schemas WHERE domains_seen_in LIKE ? ESCAPE '\\'`
  ).all(`%"${escaped}"%`);
  return rows.map(rowToSchema);
}
function createVersion(ver) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO experience_versions (domain, version, parent_version, overrides, antipatterns, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    ver.domain,
    ver.version,
    ver.parent_version ?? null,
    toJson(ver.overrides),
    toJson(ver.antipatterns),
    ver.created_at,
    ver.updated_at
  );
  return getVersion(ver.domain, ver.version);
}
function getVersion(domain, version) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM experience_versions WHERE domain = ? AND version = ?"
  ).get(domain, version);
  return row ? rowToVersion(row) : null;
}
function getVersionChain(domain, version) {
  const chain = [];
  let current = getVersion(domain, version);
  while (current) {
    chain.push(current);
    if (current.parent_version) {
      current = getVersion(domain, current.parent_version);
    } else {
      current = null;
    }
  }
  return chain;
}
function archiveMemory(memory, reason) {
  const db = getDatabase();
  const id = generateId();
  const archived = {
    id,
    original_id: memory.id,
    summary: memory.summary ?? memory.content.substring(0, 200),
    type: memory.type,
    domains: memory.domains,
    original_confidence: memory.confidence,
    archived_date: now(),
    reason
  };
  return transaction(() => {
    db.prepare(`
      INSERT INTO cold_storage (id, original_id, summary, type, domains, original_confidence, archived_date, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      archived.id,
      archived.original_id,
      archived.summary,
      archived.type,
      toJson(archived.domains),
      archived.original_confidence,
      archived.archived_date,
      archived.reason
    );
    deleteMemory(memory.id);
    return archived;
  });
}
function logConsolidation(result) {
  const db = getDatabase();
  const id = generateId();
  const entry = {
    id,
    type: result.type,
    started_at: result.started_at,
    completed_at: result.completed_at,
    stats: result
  };
  db.prepare(`
    INSERT INTO consolidation_log (id, type, started_at, completed_at, stats)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, entry.type, entry.started_at, entry.completed_at, toJson(entry.stats));
  return entry;
}
function getLastConsolidation() {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM consolidation_log ORDER BY completed_at DESC LIMIT 1"
  ).get();
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    started_at: row.started_at,
    completed_at: row.completed_at,
    stats: safeJsonParse(row.stats, {})
  };
}
function getStats() {
  const db = getDatabase();
  const total = db.prepare("SELECT COUNT(*) as count FROM memories").get().count;
  const byType = db.prepare("SELECT type, COUNT(*) as count FROM memories GROUP BY type").all();
  const byTier = db.prepare("SELECT storage_tier, COUNT(*) as count FROM memories GROUP BY storage_tier").all();
  const connCount = db.prepare("SELECT COUNT(*) as count FROM connections").get().count;
  const schemaCount = db.prepare("SELECT COUNT(*) as count FROM schemas").get().count;
  const versionCount = db.prepare("SELECT COUNT(*) as count FROM experience_versions").get().count;
  const avgConf = db.prepare("SELECT AVG(confidence) as avg FROM memories").get().avg ?? 0;
  const avgDur = db.prepare("SELECT AVG(encoding_strength * reinforcement) as avg FROM memories").get().avg ?? 0;
  const oldest = db.prepare("SELECT MIN(created_at) as val FROM memories").get().val;
  const newest = db.prepare("SELECT MAX(created_at) as val FROM memories").get().val;
  const coldCount = db.prepare("SELECT COUNT(*) as count FROM cold_storage").get().count;
  const lastConsol = getLastConsolidation();
  const allDomains = db.prepare("SELECT domains FROM memories").all();
  const domainCounts = {};
  for (const row of allDomains) {
    const domains = safeJsonParse(row.domains, []);
    for (const d of domains) {
      domainCounts[d] = (domainCounts[d] ?? 0) + 1;
    }
  }
  return {
    total_memories: total,
    by_type: Object.fromEntries(byType.map((r) => [r.type, r.count])),
    by_tier: Object.fromEntries(byTier.map((r) => [r.storage_tier, r.count])),
    by_domain: domainCounts,
    total_connections: connCount,
    total_schemas: schemaCount,
    total_versions: versionCount,
    average_confidence: avgConf,
    average_durability: avgDur,
    oldest_memory: oldest,
    newest_memory: newest,
    last_consolidation: lastConsol?.completed_at ?? null,
    cold_storage_count: coldCount
  };
}
function globalDownscale(factor) {
  const db = getDatabase();
  const result = db.prepare(
    `UPDATE memories SET reinforcement = reinforcement * ?, updated_at = ?
     WHERE type != 'antipattern' AND pinned = 0`
  ).run(factor, now());
  return result.changes;
}
function getConsolidationCandidates(limit) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT ${MEMORY_COLS} FROM memories
    WHERE storage_tier NOT IN ('cold')
      AND type != 'antipattern'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  return rows.map(rowToMemory);
}
function getConnectionCount(memoryId) {
  const db = getDatabase();
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM connections WHERE source_id = ? OR target_id = ?"
  ).get(memoryId, memoryId);
  return result.count;
}
function batchGetConnectionCounts(ids) {
  if (ids.length === 0) return /* @__PURE__ */ new Map();
  const db = getDatabase();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT id, COALESCE(s.cnt, 0) + COALESCE(t.cnt, 0) as count FROM (
      SELECT value as id FROM json_each(?)
    ) ids
    LEFT JOIN (
      SELECT source_id, COUNT(*) as cnt FROM connections
      WHERE source_id IN (${placeholders}) GROUP BY source_id
    ) s ON s.source_id = ids.id
    LEFT JOIN (
      SELECT target_id, COUNT(*) as cnt FROM connections
      WHERE target_id IN (${placeholders}) GROUP BY target_id
    ) t ON t.target_id = ids.id
  `).all(JSON.stringify(ids), ...ids, ...ids);
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    map.set(row.id, row.count);
  }
  return map;
}
function createPattern(pattern) {
  const db = getDatabase();
  const timestamp = now();
  db.prepare(`
    INSERT INTO structural_patterns (id, memory_id, relations, abstraction_level, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    pattern.id,
    pattern.memory_id,
    toJson(pattern.relations),
    pattern.abstraction_level,
    pattern.confidence,
    timestamp
  );
  const row = db.prepare("SELECT * FROM structural_patterns WHERE id = ?").get(pattern.id);
  return rowToPattern(row);
}
function getPatternsByMemory(memoryId) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM structural_patterns WHERE memory_id = ? ORDER BY abstraction_level ASC"
  ).all(memoryId);
  return rows.map(rowToPattern);
}
function getPatternsByDomain(domain, limit = 100) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const rows = db.prepare(`
    SELECT sp.* FROM structural_patterns sp
    JOIN memories m ON sp.memory_id = m.id
    WHERE m.domains LIKE ? ESCAPE '\\'
    ORDER BY sp.confidence DESC
    LIMIT ?
  `).all(`%"${escaped}"%`, limit);
  return rows.map(rowToPattern);
}
function rowToProspective(row) {
  return {
    id: row.id,
    trigger_pattern: row.trigger_pattern,
    action: row.action,
    domain: row.domain,
    priority: row.priority,
    active: row.active === 1,
    fire_count: row.fire_count,
    max_fires: row.max_fires,
    created_at: row.created_at,
    last_fired: row.last_fired,
    source_memory_id: row.source_memory_id
  };
}
function createProspectiveMemory(pm) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO prospective_memory (id, trigger_pattern, action, domain, priority, active, fire_count, max_fires, created_at, last_fired, source_memory_id)
    VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, NULL, ?)
  `).run(
    id,
    pm.trigger_pattern,
    pm.action,
    pm.domain ?? null,
    pm.priority ?? 0.5,
    pm.max_fires ?? 0,
    timestamp,
    pm.source_memory_id ?? null
  );
  const row = db.prepare("SELECT * FROM prospective_memory WHERE id = ?").get(id);
  return rowToProspective(row);
}
function getProspectiveMemory(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM prospective_memory WHERE id = ?").get(id);
  return row ? rowToProspective(row) : null;
}
function getActiveProspectiveMemories(domain) {
  const db = getDatabase();
  if (domain) {
    const rows2 = db.prepare(
      "SELECT * FROM prospective_memory WHERE active = 1 AND (domain = ? OR domain IS NULL) ORDER BY priority DESC"
    ).all(domain);
    return rows2.map(rowToProspective);
  }
  const rows = db.prepare(
    "SELECT * FROM prospective_memory WHERE active = 1 ORDER BY priority DESC"
  ).all();
  return rows.map(rowToProspective);
}
function getAllProspectiveMemories(domain) {
  const db = getDatabase();
  if (domain) {
    const rows2 = db.prepare(
      "SELECT * FROM prospective_memory WHERE (domain = ? OR domain IS NULL) ORDER BY priority DESC"
    ).all(domain);
    return rows2.map(rowToProspective);
  }
  const rows = db.prepare(
    "SELECT * FROM prospective_memory ORDER BY priority DESC"
  ).all();
  return rows.map(rowToProspective);
}
function getStaleMemoryCount(daysThreshold = 90) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - daysThreshold * 864e5).toISOString();
  const row = db.prepare(
    "SELECT COUNT(*) as cnt FROM memories WHERE last_accessed < ? AND pinned = 0 AND storage_tier != 'cold'"
  ).get(cutoff);
  return row?.cnt ?? 0;
}
function getOrphanConnectionCount() {
  const db = getDatabase();
  const row = db.prepare(
    `SELECT COUNT(*) as cnt FROM connections
     WHERE source_id NOT IN (SELECT id FROM memories)
        OR target_id NOT IN (SELECT id FROM memories)`
  ).get();
  return row?.cnt ?? 0;
}
function updateProspectiveMemory(id, updates) {
  const db = getDatabase();
  const sets = [];
  const values = [];
  if (updates.active !== void 0) {
    sets.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }
  if (updates.fire_count !== void 0) {
    sets.push("fire_count = ?");
    values.push(updates.fire_count);
  }
  if (updates.last_fired !== void 0) {
    sets.push("last_fired = ?");
    values.push(updates.last_fired);
  }
  if (updates.priority !== void 0) {
    sets.push("priority = ?");
    values.push(updates.priority);
  }
  if (sets.length === 0) return getProspectiveMemory(id);
  values.push(id);
  db.prepare(`UPDATE prospective_memory SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getProspectiveMemory(id);
}
function incrementProspectiveFire(id) {
  const db = getDatabase();
  const timestamp = now();
  db.prepare(
    "UPDATE prospective_memory SET fire_count = fire_count + 1, last_fired = ? WHERE id = ?"
  ).run(timestamp, id);
}
function rowToMetric(row) {
  return {
    id: row.id,
    metric_type: row.metric_type,
    value: row.value,
    context: row.context,
    timestamp: row.timestamp
  };
}
function recordMetric(metricType, value, context = {}) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO metacognition_metrics (id, metric_type, value, context, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, metricType, value, toJson(context), timestamp);
  const row = db.prepare("SELECT * FROM metacognition_metrics WHERE id = ?").get(id);
  return rowToMetric(row);
}
function getRecentMetrics(metricType, limit = 50) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM metacognition_metrics WHERE metric_type = ? ORDER BY timestamp DESC, rowid DESC LIMIT ?"
  ).all(metricType, limit);
  return rows.map(rowToMetric);
}
function getMetricAverage(metricType, windowSize = 50) {
  const db = getDatabase();
  const result = db.prepare(
    "SELECT AVG(value) as avg FROM (SELECT value FROM metacognition_metrics WHERE metric_type = ? ORDER BY timestamp DESC LIMIT ?)"
  ).get(metricType, windowSize);
  return result?.avg ?? 0;
}
function getSpeculativeConnections() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM connections WHERE type = 'speculative'"
  ).all();
  return rows.map(rowToConnection);
}
function getInsightMemories(domain, limit = 20) {
  const db = getDatabase();
  const rows = db.prepare(
    `SELECT ${MEMORY_COLS} FROM memories
     WHERE type = 'semantic'
       AND tags LIKE '%creative_insight%'
       AND flagged_for_pruning = 0
     ORDER BY confidence DESC, created_at DESC
     LIMIT ?`
  ).all(limit);
  const memories = rows.map(rowToMemory);
  if (domain) {
    return memories.filter((m) => m.domains.includes(domain));
  }
  return memories;
}
function storeEmbedding(memoryId, embedding) {
  const db = getDatabase();
  const result = db.prepare("UPDATE memories SET embedding = ? WHERE id = ?").run(embedding, memoryId);
  if (result.changes === 0 && isProjectDbAttached()) {
    db.prepare("UPDATE project.memories SET embedding = ? WHERE id = ?").run(embedding, memoryId);
  }
}
function getEmbedding(memoryId) {
  const db = getDatabase();
  const row = db.prepare("SELECT embedding FROM memories WHERE id = ?").get(memoryId);
  if (row?.embedding) return row.embedding;
  if (isProjectDbAttached()) {
    const projRow = db.prepare("SELECT embedding FROM project.memories WHERE id = ?").get(memoryId);
    return projRow?.embedding ?? null;
  }
  return null;
}
function getEmbeddedMemories(domain, limit) {
  const db = getDatabase();
  if (domain) {
    const escaped = escapeLikePattern(domain);
    return db.prepare(`
      SELECT id, embedding FROM memories
      WHERE embedding IS NOT NULL
      AND domains LIKE ? ESCAPE '\\'
      ORDER BY created_at DESC, access_count DESC
      LIMIT ?
    `).all(`%"${escaped}"%`, limit);
  }
  return db.prepare(`
    SELECT id, embedding FROM memories
    WHERE embedding IS NOT NULL
    ORDER BY created_at DESC, access_count DESC
    LIMIT ?
  `).all(limit);
}
function getUnembeddedMemories(limit) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT ${MEMORY_COLS} FROM memories WHERE embedding IS NULL
    ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  return rows.map(rowToMemory);
}
function getAllMemoryContent() {
  const db = getDatabase();
  return db.prepare("SELECT id, content FROM memories").all();
}
function upsertVocabulary(terms, timestamp) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO tfidf_vocabulary (term, document_frequency, idf, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(term) DO UPDATE SET
      document_frequency = excluded.document_frequency,
      idf = excluded.idf,
      updated_at = excluded.updated_at
  `);
  const insertBatch = db.transaction((items) => {
    for (const t of items) {
      stmt.run(t.term, t.df, t.idf, timestamp);
    }
  });
  insertBatch(terms);
}
function loadVocabulary() {
  const db = getDatabase();
  const rows = db.prepare("SELECT term, idf FROM tfidf_vocabulary").all();
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    map.set(r.term, r.idf);
  }
  return map;
}
function getTfidfMeta(key) {
  const db = getDatabase();
  const row = db.prepare("SELECT value FROM tfidf_metadata WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setTfidfMeta(key, value) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO tfidf_metadata (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}
function deleteFlaggedMemories(limit) {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM memories WHERE id IN (
      SELECT id FROM memories WHERE flagged_for_pruning = 1 LIMIT ?
    )
  `).run(limit);
  return result.changes;
}
function evictColdStorage(maxRows, maxAgeDays) {
  const db = getDatabase();
  const cutoffDate = new Date(Date.now() - maxAgeDays * 864e5).toISOString();
  let total = 0;
  const ageResult = db.prepare("DELETE FROM cold_storage WHERE archived_date < ?").run(cutoffDate);
  total += ageResult.changes;
  const count = db.prepare("SELECT COUNT(*) as c FROM cold_storage").get();
  if (count.c > maxRows) {
    const excess = count.c - maxRows;
    const capResult = db.prepare(`
      DELETE FROM cold_storage WHERE id IN (
        SELECT id FROM cold_storage ORDER BY archived_date ASC LIMIT ?
      )
    `).run(excess);
    total += capResult.changes;
  }
  return total;
}
function pruneConsolidationLog(maxEntries) {
  const db = getDatabase();
  const count = db.prepare("SELECT COUNT(*) as c FROM consolidation_log").get();
  if (count.c <= maxEntries) return 0;
  const excess = count.c - maxEntries;
  const result = db.prepare(`
    DELETE FROM consolidation_log WHERE id IN (
      SELECT id FROM consolidation_log ORDER BY started_at ASC LIMIT ?
    )
  `).run(excess);
  return result.changes;
}
function pruneMetrics(maxEntries) {
  const db = getDatabase();
  const count = db.prepare("SELECT COUNT(*) as c FROM metacognition_metrics").get();
  if (count.c <= maxEntries) return 0;
  const excess = count.c - maxEntries;
  const result = db.prepare(`
    DELETE FROM metacognition_metrics WHERE id IN (
      SELECT id FROM metacognition_metrics ORDER BY timestamp ASC LIMIT ?
    )
  `).run(excess);
  return result.changes;
}
function pruneStaleVocabulary() {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM tfidf_vocabulary WHERE document_frequency = 0").run();
  return result.changes;
}
function getDecayScanCandidates(limit, excludeIds) {
  const db = getDatabase();
  if (excludeIds.length === 0) {
    const rows2 = db.prepare(`
      SELECT ${MEMORY_COLS} FROM memories
      WHERE type != 'antipattern'
        AND pinned = 0
        AND storage_tier NOT IN ('cold')
        AND flagged_for_pruning = 0
      ORDER BY last_accessed ASC NULLS FIRST
      LIMIT ?
    `).all(limit);
    return rows2.map(rowToMemory);
  }
  const placeholders = excludeIds.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT ${MEMORY_COLS} FROM memories
    WHERE type != 'antipattern'
      AND pinned = 0
      AND storage_tier NOT IN ('cold')
      AND flagged_for_pruning = 0
      AND id NOT IN (${placeholders})
    ORDER BY last_accessed ASC NULLS FIRST
    LIMIT ?
  `).all(...excludeIds, limit);
  return rows.map(rowToMemory);
}
function vacuumDatabase() {
  const db = getDatabase();
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.exec("VACUUM");
}
function optimizeFts() {
  const db = getDatabase();
  db.prepare("INSERT INTO memories_fts(memories_fts) VALUES('optimize')").run();
}
function getHousekeepingStats() {
  const db = getDatabase();
  const m = db.prepare("SELECT COUNT(*) as c FROM memories").get();
  const cold = db.prepare("SELECT COUNT(*) as c FROM cold_storage").get();
  const logs = db.prepare("SELECT COUNT(*) as c FROM consolidation_log").get();
  const met = db.prepare("SELECT COUNT(*) as c FROM metacognition_metrics").get();
  const vocab = db.prepare("SELECT COUNT(*) as c FROM tfidf_vocabulary").get();
  const flagged = db.prepare("SELECT COUNT(*) as c FROM memories WHERE flagged_for_pruning = 1").get();
  return { memories: m.c, cold: cold.c, logs: logs.c, metrics: met.c, vocab: vocab.c, flagged: flagged.c };
}
function rowToProjectMapEntry(row) {
  return {
    project_path: row.project_path,
    file_path: row.file_path,
    file_type: row.file_type,
    skeleton: row.skeleton,
    file_hash: row.file_hash,
    last_parsed: row.last_parsed
  };
}
function upsertProjectMapEntry(entry) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO project_map (project_path, file_path, file_type, skeleton, file_hash, last_parsed)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_path, file_path) DO UPDATE SET
      file_type = excluded.file_type,
      skeleton = excluded.skeleton,
      file_hash = excluded.file_hash,
      last_parsed = excluded.last_parsed
  `).run(entry.project_path, entry.file_path, entry.file_type, entry.skeleton, entry.file_hash, entry.last_parsed);
}
function getProjectMap(projectPath) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM project_map WHERE project_path = ? ORDER BY file_path"
  ).all(projectPath);
  return rows.map(rowToProjectMapEntry);
}
function getProjectMapEntry(projectPath, filePath) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM project_map WHERE project_path = ? AND file_path = ?"
  ).get(projectPath, filePath);
  return row ? rowToProjectMapEntry(row) : null;
}
function rowToErrorCandidate(row) {
  return {
    ...row,
    graduated: row.graduated === 1
  };
}
function createErrorCandidate(candidate) {
  const db = getDatabase();
  const id = candidate.id ?? generateId();
  db.prepare(`
    INSERT INTO error_candidates (id, fingerprint, error_type, error_message, file_path,
      occurrences, fix_content, fix_file_path, fix_command, graduated, graduated_memory_id,
      first_seen, last_seen, project_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    candidate.fingerprint,
    candidate.error_type,
    candidate.error_message,
    candidate.file_path,
    candidate.occurrences,
    candidate.fix_content,
    candidate.fix_file_path,
    candidate.fix_command,
    candidate.graduated ? 1 : 0,
    candidate.graduated_memory_id,
    candidate.first_seen,
    candidate.last_seen,
    candidate.project_path
  );
  return getErrorCandidate(id);
}
function getErrorCandidate(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM error_candidates WHERE id = ?").get(id);
  return row ? rowToErrorCandidate(row) : null;
}
function findErrorByFingerprint(fingerprint) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM error_candidates WHERE fingerprint = ? AND graduated = 0 ORDER BY last_seen DESC LIMIT 1"
  ).get(fingerprint);
  return row ? rowToErrorCandidate(row) : null;
}
function getUngraduatedErrorCandidates() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM error_candidates WHERE graduated = 0 ORDER BY occurrences DESC, last_seen DESC"
  ).all();
  return rows.map(rowToErrorCandidate);
}
function getRecentErrorCandidates(limit) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM error_candidates WHERE graduated = 0 ORDER BY last_seen DESC LIMIT ?"
  ).all(limit);
  return rows.map(rowToErrorCandidate);
}
var ERROR_CANDIDATE_ALLOWED_FIELDS = {
  fingerprint: (v) => v,
  error_type: (v) => v,
  error_message: (v) => v,
  file_path: (v) => v,
  occurrences: (v) => v,
  fix_content: (v) => v,
  fix_file_path: (v) => v,
  fix_command: (v) => v,
  graduated: (v) => v ? 1 : 0,
  graduated_memory_id: (v) => v,
  last_seen: (v) => v,
  project_path: (v) => v
};
function updateErrorCandidate(id, updates) {
  const db = getDatabase();
  const setClauses = [];
  const values = [];
  for (const [key, transform] of Object.entries(ERROR_CANDIDATE_ALLOWED_FIELDS)) {
    if (key in updates) {
      const val = updates[key];
      setClauses.push(`${key} = ?`);
      values.push(transform(val));
    }
  }
  if (setClauses.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE error_candidates SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
}
function pruneErrorCandidates(maxCandidates) {
  const db = getDatabase();
  const count = db.prepare("SELECT COUNT(*) as c FROM error_candidates WHERE graduated = 0").get().c;
  if (count <= maxCandidates) return 0;
  const toDelete = count - maxCandidates;
  const result = db.prepare(`
    DELETE FROM error_candidates WHERE id IN (
      SELECT id FROM error_candidates WHERE graduated = 0
      ORDER BY occurrences ASC, last_seen ASC LIMIT ?
    )
  `).run(toDelete);
  return result.changes;
}
function rowToTaskEntry(row) {
  return {
    id: row.id,
    description: row.description,
    keywords: safeJsonParse(row.keywords, []),
    status: row.status,
    files_touched: safeJsonParse(row.files_touched, []),
    blockers: safeJsonParse(row.blockers, []),
    progress_pct: row.progress_pct,
    session_count: row.session_count,
    last_session_id: row.last_session_id,
    project_path: row.project_path,
    domain: row.domain,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at
  };
}
function createTask(task) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO task_journal (id, description, keywords, status, files_touched, blockers,
      progress_pct, session_count, last_session_id, project_path, domain,
      created_at, updated_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    task.description,
    toJson(task.keywords),
    task.status,
    toJson(task.files_touched),
    toJson(task.blockers),
    task.progress_pct,
    task.session_count,
    task.last_session_id,
    task.project_path,
    task.domain,
    timestamp,
    timestamp,
    task.completed_at
  );
  return getTask(id);
}
function getTask(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM task_journal WHERE id = ?").get(id);
  return row ? rowToTaskEntry(row) : null;
}
function getActiveTasks(projectPath) {
  const db = getDatabase();
  let rows;
  if (projectPath) {
    rows = db.prepare(
      "SELECT * FROM task_journal WHERE status = 'active' AND project_path = ? ORDER BY updated_at DESC"
    ).all(projectPath);
  } else {
    rows = db.prepare(
      "SELECT * FROM task_journal WHERE status = 'active' ORDER BY updated_at DESC"
    ).all();
  }
  return rows.map(rowToTaskEntry);
}
function getIncompleteTasks(projectPath) {
  const db = getDatabase();
  let rows;
  if (projectPath) {
    rows = db.prepare(
      "SELECT * FROM task_journal WHERE status IN ('active', 'paused') AND project_path = ? ORDER BY updated_at DESC"
    ).all(projectPath);
  } else {
    rows = db.prepare(
      "SELECT * FROM task_journal WHERE status IN ('active', 'paused') ORDER BY updated_at DESC"
    ).all();
  }
  return rows.map(rowToTaskEntry);
}
var TASK_ALLOWED_FIELDS = {
  description: (v) => v,
  keywords: (v) => toJson(v),
  status: (v) => v,
  files_touched: (v) => toJson(v),
  blockers: (v) => toJson(v),
  progress_pct: (v) => v,
  session_count: (v) => v,
  last_session_id: (v) => v,
  project_path: (v) => v,
  domain: (v) => v,
  completed_at: (v) => v
};
function updateTask(id, updates) {
  const db = getDatabase();
  const setClauses = [];
  const values = [];
  for (const [key, transform] of Object.entries(TASK_ALLOWED_FIELDS)) {
    if (key in updates) {
      const val = updates[key];
      setClauses.push(`${key} = ?`);
      values.push(transform(val));
    }
  }
  if (setClauses.length === 0) return getTask(id);
  setClauses.push("updated_at = ?");
  values.push(now());
  values.push(id);
  db.prepare(`UPDATE task_journal SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  return getTask(id);
}
function rowToTestRun(row) {
  return {
    id: row.id,
    command: row.command,
    total: row.total,
    passed: row.passed,
    failed: row.failed,
    skipped: row.skipped,
    duration_ms: row.duration_ms,
    outcome: row.outcome,
    failed_tests: safeJsonParse(row.failed_tests, []),
    session_id: row.session_id,
    project_path: row.project_path,
    created_at: row.created_at
  };
}
function createTestRun(data) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO test_runs (id, command, total, passed, failed, skipped, duration_ms, outcome, failed_tests, session_id, project_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.command,
    data.total,
    data.passed,
    data.failed,
    data.skipped,
    data.duration_ms,
    data.outcome,
    toJson(data.failed_tests),
    data.session_id,
    data.project_path,
    timestamp
  );
  return getTestRun(id);
}
function getTestRun(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM test_runs WHERE id = ?").get(id);
  return row ? rowToTestRun(row) : null;
}
function getRecentTestRuns(projectPath, limit = 10) {
  const db = getDatabase();
  if (projectPath) {
    const rows2 = db.prepare(
      "SELECT * FROM test_runs WHERE project_path = ? ORDER BY created_at DESC LIMIT ?"
    ).all(projectPath, limit);
    return rows2.map(rowToTestRun);
  }
  const rows = db.prepare(
    "SELECT * FROM test_runs ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  return rows.map(rowToTestRun);
}
function pruneTestRuns(projectPath, maxRuns) {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM test_runs WHERE project_path = ? AND id NOT IN (
      SELECT id FROM test_runs WHERE project_path = ? ORDER BY created_at DESC LIMIT ?
    )
  `).run(projectPath, projectPath, maxRuns);
  return result.changes;
}
function rowToLearningGoal(row) {
  return {
    id: row.id,
    domain: row.domain,
    topic: row.topic,
    priority: row.priority,
    reason: row.reason,
    target_confidence: row.target_confidence,
    current_confidence: row.current_confidence,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function createLearningGoal(goal) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO learning_goals (id, domain, topic, priority, reason, target_confidence, current_confidence, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, goal.domain, goal.topic, goal.priority, goal.reason, goal.target_confidence, goal.current_confidence, goal.status, timestamp, timestamp);
  return { ...goal, id, created_at: timestamp, updated_at: timestamp };
}
function getLearningGoal(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM learning_goals WHERE id = ?").get(id);
  return row ? rowToLearningGoal(row) : null;
}
function getActiveLearningGoals(domain) {
  const db = getDatabase();
  if (domain) {
    const rows2 = db.prepare(
      "SELECT * FROM learning_goals WHERE status = ? AND domain = ? ORDER BY priority DESC, created_at ASC"
    ).all("active", domain);
    return rows2.map(rowToLearningGoal);
  }
  const rows = db.prepare(
    "SELECT * FROM learning_goals WHERE status = ? ORDER BY priority DESC, created_at ASC"
  ).all("active");
  return rows.map(rowToLearningGoal);
}
function getAllLearningGoals() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM learning_goals ORDER BY status ASC, priority DESC, created_at ASC"
  ).all();
  return rows.map(rowToLearningGoal);
}
function updateLearningGoal(id, updates) {
  const db = getDatabase();
  const existing = getLearningGoal(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updated_at: now() };
  db.prepare(`
    UPDATE learning_goals SET current_confidence = ?, status = ?, priority = ?, topic = ?, updated_at = ?
    WHERE id = ?
  `).run(merged.current_confidence, merged.status, merged.priority, merged.topic, merged.updated_at, id);
  return merged;
}
function getLearningGoalByDomainTopic(domain, topic) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM learning_goals WHERE domain = ? AND topic = ? AND status = ? LIMIT 1"
  ).get(domain, topic, "active");
  return row ? rowToLearningGoal(row) : null;
}
function rowToMasteryProfile(row) {
  return {
    id: row.id,
    domain: row.domain,
    skill: row.skill,
    level: row.level,
    evidence: safeJsonParse(row.evidence, []),
    practice_count: row.practice_count,
    success_count: row.success_count,
    failure_count: row.failure_count,
    success_rate: row.success_rate,
    last_practiced: row.last_practiced,
    next_review: row.next_review,
    zone_of_proximal: safeJsonParse(row.zone_of_proximal, []),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function createMasteryProfile(profile) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO mastery_profiles
      (id, domain, skill, level, evidence, practice_count, success_count, failure_count,
       success_rate, last_practiced, next_review, zone_of_proximal, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    profile.domain,
    profile.skill,
    profile.level,
    toJson(profile.evidence),
    profile.practice_count,
    profile.success_count,
    profile.failure_count,
    profile.success_rate,
    profile.last_practiced,
    profile.next_review,
    toJson(profile.zone_of_proximal),
    timestamp,
    timestamp
  );
  return { ...profile, id, created_at: timestamp, updated_at: timestamp };
}
function getMasteryProfile(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM mastery_profiles WHERE id = ?").get(id);
  return row ? rowToMasteryProfile(row) : null;
}
function getMasteryProfileByDomainSkill(domain, skill) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM mastery_profiles WHERE domain = ? AND skill = ? LIMIT 1"
  ).get(domain, skill);
  return row ? rowToMasteryProfile(row) : null;
}
function getMasteryProfilesByDomain(domain) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM mastery_profiles WHERE domain = ? ORDER BY level DESC, success_rate DESC"
  ).all(domain);
  return rows.map(rowToMasteryProfile);
}
function getAllMasteryProfiles() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM mastery_profiles ORDER BY domain ASC, level DESC, success_rate DESC"
  ).all();
  return rows.map(rowToMasteryProfile);
}
function getOverdueMasteryProfiles() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM mastery_profiles WHERE next_review <= ? ORDER BY next_review ASC"
  ).all(now());
  return rows.map(rowToMasteryProfile);
}
function updateMasteryProfile(id, updates) {
  const db = getDatabase();
  const existing = getMasteryProfile(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updated_at: now() };
  db.prepare(`
    UPDATE mastery_profiles SET
      level = ?, evidence = ?, practice_count = ?, success_count = ?,
      failure_count = ?, success_rate = ?, last_practiced = ?,
      next_review = ?, zone_of_proximal = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.level,
    toJson(merged.evidence),
    merged.practice_count,
    merged.success_count,
    merged.failure_count,
    merged.success_rate,
    merged.last_practiced,
    merged.next_review,
    toJson(merged.zone_of_proximal),
    merged.updated_at,
    id
  );
  return merged;
}
var DEFAULT_RELATIONSHIP_PROFILE = {
  correction_frequency: 0,
  interaction_count: 0,
  relationship_depth: 0,
  trust_trajectory: [],
  topic_affinities: [],
  session_interactions: [],
  communication_style: null,
  behavioral_preferences: [],
  taught_concepts: []
};
function rowToSelfModel(row) {
  return {
    id: row.id,
    strengths: safeJsonParse(row.strengths, []),
    weaknesses: safeJsonParse(row.weaknesses, []),
    preferred_approaches: safeJsonParse(row.preferred_approaches, []),
    user_preferences: safeJsonParse(row.user_preferences, []),
    communication_style: row.communication_style,
    trust_level: row.trust_level,
    common_tasks: safeJsonParse(row.common_tasks, []),
    session_count: row.session_count,
    total_turns: row.total_turns,
    frustration_triggers: safeJsonParse(row.frustration_triggers, []),
    satisfaction_triggers: safeJsonParse(row.satisfaction_triggers, []),
    last_session_summary: row.last_session_summary,
    ongoing_context: row.ongoing_context,
    relationship: safeJsonParse(row.relationship, DEFAULT_RELATIONSHIP_PROFILE),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function getSelfModel() {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM self_model WHERE id = ?").get("singleton");
  return row ? rowToSelfModel(row) : null;
}
function upsertSelfModel(model) {
  const db = getDatabase();
  const timestamp = now();
  const merged = { ...model, updated_at: timestamp };
  if (!merged.created_at) merged.created_at = timestamp;
  db.prepare(`
    INSERT OR REPLACE INTO self_model (
      id, strengths, weaknesses, preferred_approaches, user_preferences,
      communication_style, trust_level, common_tasks, session_count, total_turns,
      frustration_triggers, satisfaction_triggers, last_session_summary,
      ongoing_context, relationship, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    merged.id,
    toJson(merged.strengths),
    toJson(merged.weaknesses),
    toJson(merged.preferred_approaches),
    toJson(merged.user_preferences),
    merged.communication_style,
    merged.trust_level,
    toJson(merged.common_tasks),
    merged.session_count,
    merged.total_turns,
    toJson(merged.frustration_triggers),
    toJson(merged.satisfaction_triggers),
    merged.last_session_summary,
    merged.ongoing_context,
    toJson(merged.relationship),
    merged.created_at,
    merged.updated_at
  );
  return merged;
}
var SELF_MODEL_UPDATABLE_FIELDS = /* @__PURE__ */ new Set([
  "strengths",
  "weaknesses",
  "preferred_approaches",
  "user_preferences",
  "communication_style",
  "trust_level",
  "common_tasks",
  "session_count",
  "total_turns",
  "frustration_triggers",
  "satisfaction_triggers",
  "last_session_summary",
  "ongoing_context",
  "relationship"
]);
var SELF_MODEL_JSON_FIELDS = /* @__PURE__ */ new Set([
  "strengths",
  "weaknesses",
  "preferred_approaches",
  "user_preferences",
  "common_tasks",
  "frustration_triggers",
  "satisfaction_triggers",
  "relationship"
]);
var SELF_MODEL_UPDATE_SQL = Object.fromEntries(
  [...SELF_MODEL_UPDATABLE_FIELDS].map((f) => [f, `UPDATE self_model SET ${f} = ?, updated_at = ? WHERE id = 'singleton'`])
);
function updateSelfModelField(field, value) {
  const sql = SELF_MODEL_UPDATE_SQL[field];
  if (!sql) {
    throw new Error(`Field '${field}' is not an updatable self-model field`);
  }
  const db = getDatabase();
  const serialized = SELF_MODEL_JSON_FIELDS.has(field) ? toJson(value) : value;
  const result = db.prepare(sql).run(serialized, now());
  return result.changes > 0;
}
function rowToPrerequisite(row) {
  return {
    id: row.id,
    domain: row.domain,
    skill: row.skill,
    prerequisite_skill: row.prerequisite_skill,
    required_level: row.required_level,
    auto_discovered: row.auto_discovered === 1,
    created_at: row.created_at
  };
}
function createPrerequisite(prereq) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT OR IGNORE INTO skill_prerequisites
      (id, domain, skill, prerequisite_skill, required_level, auto_discovered, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    prereq.domain,
    prereq.skill,
    prereq.prerequisite_skill,
    prereq.required_level,
    prereq.auto_discovered ? 1 : 0,
    timestamp
  );
  return { ...prereq, id, created_at: timestamp };
}
function getPrerequisitesForSkill(domain, skill) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM skill_prerequisites WHERE domain = ? AND skill = ? ORDER BY created_at ASC"
  ).all(domain, skill);
  return rows.map(rowToPrerequisite);
}
function getPrerequisitesByDomain(domain) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM skill_prerequisites WHERE domain = ? ORDER BY skill ASC, created_at ASC"
  ).all(domain);
  return rows.map(rowToPrerequisite);
}
function rowToLearningPath(row) {
  return {
    id: row.id,
    domain: row.domain,
    name: row.name,
    steps: safeJsonParse(row.steps, []),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function createLearningPath(path) {
  const db = getDatabase();
  const id = generateId();
  const timestamp = now();
  db.prepare(`
    INSERT INTO learning_paths (id, domain, name, steps, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, path.domain, path.name, toJson(path.steps), timestamp, timestamp);
  return { ...path, id, created_at: timestamp, updated_at: timestamp };
}
function getLearningPathsByDomain(domain) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM learning_paths WHERE domain = ? ORDER BY created_at ASC"
  ).all(domain);
  return rows.map(rowToLearningPath);
}
function rowToArchNode(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    module: row.module,
    file_path: row.file_path,
    description: row.description,
    role: row.role ?? null,
    project_path: row.project_path,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function rowToArchEdge(row) {
  return {
    source_id: row.source_id,
    target_id: row.target_id,
    type: row.type,
    label: row.label,
    strength: row.strength,
    evidence_count: row.evidence_count,
    created_at: row.created_at,
    last_observed: row.last_observed
  };
}
function upsertArchNode(node) {
  const db = getDatabase();
  const timestamp = now();
  const existing = db.prepare(
    "SELECT * FROM architecture_nodes WHERE project_path = ? AND module = ? AND type = ? AND name = ?"
  ).get(node.project_path, node.module, node.type, node.name);
  if (existing) {
    db.prepare(`
      UPDATE architecture_nodes
      SET file_path = ?, description = ?, role = ?, updated_at = ?
      WHERE id = ?
    `).run(node.file_path, node.description, node.role, timestamp, existing.id);
    return rowToArchNode({ ...existing, file_path: node.file_path, description: node.description, role: node.role, updated_at: timestamp });
  }
  const id = node.id ?? generateId();
  db.prepare(`
    INSERT INTO architecture_nodes (id, type, name, module, file_path, description, role, project_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, node.type, node.name, node.module, node.file_path, node.description, node.role, node.project_path, timestamp, timestamp);
  return {
    id,
    type: node.type,
    name: node.name,
    module: node.module,
    file_path: node.file_path,
    description: node.description,
    role: node.role,
    project_path: node.project_path,
    created_at: timestamp,
    updated_at: timestamp
  };
}
function getArchNode(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM architecture_nodes WHERE id = ?").get(id);
  return row ? rowToArchNode(row) : null;
}
function findArchNode(projectPath, module, type, name) {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT * FROM architecture_nodes WHERE project_path = ? AND module = ? AND type = ? AND name = ?"
  ).get(projectPath, module, type, name);
  return row ? rowToArchNode(row) : null;
}
function getArchNodesByModule(projectPath, module) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM architecture_nodes WHERE project_path = ? AND module = ? ORDER BY type, name"
  ).all(projectPath, module);
  return rows.map(rowToArchNode);
}
function getArchNodesByProject(projectPath) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM architecture_nodes WHERE project_path = ? ORDER BY module, type, name"
  ).all(projectPath);
  return rows.map(rowToArchNode);
}
function getArchNodesByFile(projectPath, filePath) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM architecture_nodes WHERE project_path = ? AND file_path = ?"
  ).all(projectPath, filePath);
  return rows.map(rowToArchNode);
}
function upsertArchEdge(sourceId, targetId, type, label, initialStrength) {
  const db = getDatabase();
  const timestamp = now();
  const existing = db.prepare(
    "SELECT * FROM architecture_edges WHERE source_id = ? AND target_id = ? AND type = ?"
  ).get(sourceId, targetId, type);
  if (existing) {
    const newStrength = Math.min(existing.strength + 0.1, 1);
    db.prepare(`
      UPDATE architecture_edges
      SET strength = ?, evidence_count = evidence_count + 1, last_observed = ?, label = COALESCE(?, label)
      WHERE source_id = ? AND target_id = ? AND type = ?
    `).run(newStrength, timestamp, label ?? null, sourceId, targetId, type);
    return rowToArchEdge({
      ...existing,
      strength: newStrength,
      evidence_count: existing.evidence_count + 1,
      last_observed: timestamp,
      label: label ?? existing.label
    });
  }
  const strength = initialStrength ?? 0.5;
  db.prepare(`
    INSERT INTO architecture_edges (source_id, target_id, type, label, strength, evidence_count, created_at, last_observed)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(sourceId, targetId, type, label ?? null, strength, timestamp, timestamp);
  return {
    source_id: sourceId,
    target_id: targetId,
    type,
    label: label ?? null,
    strength,
    evidence_count: 1,
    created_at: timestamp,
    last_observed: timestamp
  };
}
function getArchEdgesFrom(sourceId) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM architecture_edges WHERE source_id = ? ORDER BY strength DESC"
  ).all(sourceId);
  return rows.map(rowToArchEdge);
}
function getArchEdgesTo(targetId) {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM architecture_edges WHERE target_id = ? ORDER BY strength DESC"
  ).all(targetId);
  return rows.map(rowToArchEdge);
}
function decayStaleArchEdges(maxAgeDays, decayFactor, pruneThreshold) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1e3).toISOString();
  const decayResult = db.prepare(`
    UPDATE architecture_edges SET strength = strength * ? WHERE last_observed < ?
  `).run(decayFactor, cutoff);
  const pruneResult = db.prepare(`
    DELETE FROM architecture_edges WHERE strength < ?
  `).run(pruneThreshold);
  return { decayed: decayResult.changes, pruned: pruneResult.changes };
}
function pruneOrphanArchNodes() {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM architecture_nodes WHERE id NOT IN (
      SELECT source_id FROM architecture_edges
      UNION
      SELECT target_id FROM architecture_edges
    )
  `).run();
  return result.changes;
}
function rowToReasoningChain(row) {
  return {
    id: row.id,
    chain_type: row.chain_type,
    status: row.status,
    trigger: row.trigger,
    domain: row.domain,
    steps: safeJsonParse(row.steps, []),
    conclusion: row.conclusion,
    confidence: row.confidence,
    validated: row.validated === 1,
    reuse_count: row.reuse_count,
    memory_id: row.memory_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function createReasoningChain(chain) {
  const db = getDatabase();
  const id = chain.id ?? generateId();
  const timestamp = now();
  const steps = chain.steps ?? [];
  db.prepare(`
    INSERT INTO reasoning_chains (id, chain_type, status, trigger, domain, steps, conclusion, confidence, validated, reuse_count, memory_id, created_at, updated_at)
    VALUES (?, ?, 'active', ?, ?, ?, NULL, 0.5, 0, 0, NULL, ?, ?)
  `).run(id, chain.chain_type, chain.trigger, chain.domain ?? null, toJson(steps), timestamp, timestamp);
  return {
    id,
    chain_type: chain.chain_type,
    status: "active",
    trigger: chain.trigger,
    domain: chain.domain ?? null,
    steps,
    conclusion: null,
    confidence: 0.5,
    validated: false,
    reuse_count: 0,
    memory_id: null,
    created_at: timestamp,
    updated_at: timestamp
  };
}
function getReasoningChain(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM reasoning_chains WHERE id = ?").get(id);
  return row ? rowToReasoningChain(row) : null;
}
function updateReasoningChain(id, updates) {
  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM reasoning_chains WHERE id = ?").get(id);
  if (!existing) return null;
  const setClauses = ["updated_at = ?"];
  const values = [now()];
  if (updates.status !== void 0) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.steps !== void 0) {
    setClauses.push("steps = ?");
    values.push(toJson(updates.steps));
  }
  if (updates.conclusion !== void 0) {
    setClauses.push("conclusion = ?");
    values.push(updates.conclusion);
  }
  if (updates.confidence !== void 0) {
    setClauses.push("confidence = ?");
    values.push(updates.confidence);
  }
  if (updates.validated !== void 0) {
    setClauses.push("validated = ?");
    values.push(updates.validated ? 1 : 0);
  }
  if (updates.memory_id !== void 0) {
    setClauses.push("memory_id = ?");
    values.push(updates.memory_id);
  }
  values.push(id);
  db.prepare(`UPDATE reasoning_chains SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
  return getReasoningChain(id);
}
function getActiveReasoningChains() {
  const db = getDatabase();
  const rows = db.prepare(
    "SELECT * FROM reasoning_chains WHERE status = 'active' ORDER BY updated_at DESC"
  ).all();
  return rows.map(rowToReasoningChain);
}
function getCompletedChainsByDomain(domain, limit = 20) {
  const db = getDatabase();
  let rows;
  if (domain) {
    rows = db.prepare(
      "SELECT * FROM reasoning_chains WHERE status = 'completed' AND domain = ? ORDER BY reuse_count DESC, confidence DESC LIMIT ?"
    ).all(domain, limit);
  } else {
    rows = db.prepare(
      "SELECT * FROM reasoning_chains WHERE status = 'completed' ORDER BY reuse_count DESC, confidence DESC LIMIT ?"
    ).all(limit);
  }
  return rows.map(rowToReasoningChain);
}
function searchReasoningChains(query, limit = 10) {
  const db = getDatabase();
  const escaped = escapeLikePattern(query);
  const rows = db.prepare(
    "SELECT * FROM reasoning_chains WHERE status = 'completed' AND (trigger LIKE ? ESCAPE '\\' OR conclusion LIKE ? ESCAPE '\\') ORDER BY confidence DESC, reuse_count DESC LIMIT ?"
  ).all(`%${escaped}%`, `%${escaped}%`, limit);
  return rows.map(rowToReasoningChain);
}
function incrementChainReuse(id) {
  const db = getDatabase();
  db.prepare(
    "UPDATE reasoning_chains SET reuse_count = reuse_count + 1, updated_at = ? WHERE id = ?"
  ).run(now(), id);
}
function rowToMentalModel(row) {
  return {
    id: row.id,
    domain: row.domain,
    project_path: row.project_path,
    understanding: row.understanding,
    principles: safeJsonParse(row.principles, []),
    patterns: safeJsonParse(row.patterns, []),
    pitfalls: safeJsonParse(row.pitfalls, []),
    trajectory: row.trajectory,
    confidence: row.confidence,
    memory_count: row.memory_count,
    generated_at: row.generated_at,
    updated_at: row.updated_at
  };
}
function getMentalModel(domain, projectPath) {
  const db = getDatabase();
  const row = projectPath ? db.prepare("SELECT * FROM mental_models WHERE domain = ? AND project_path = ?").get(domain, projectPath) : db.prepare("SELECT * FROM mental_models WHERE domain = ? AND project_path IS NULL").get(domain);
  return row ? rowToMentalModel(row) : null;
}
function upsertMentalModel(model) {
  const db = getDatabase();
  const ts = now();
  const projectPath = model.project_path ?? null;
  const existing = getMentalModel(model.domain, projectPath);
  if (existing) {
    db.prepare(`
      UPDATE mental_models SET
        understanding = ?, principles = ?, patterns = ?, pitfalls = ?,
        trajectory = ?, confidence = ?, memory_count = ?, updated_at = ?
      WHERE id = ?
    `).run(
      model.understanding,
      toJson(model.principles),
      toJson(model.patterns),
      toJson(model.pitfalls),
      model.trajectory ?? null,
      model.confidence,
      model.memory_count,
      ts,
      existing.id
    );
    return getMentalModel(model.domain, projectPath);
  }
  const id = generateId();
  db.prepare(`
    INSERT INTO mental_models (id, domain, project_path, understanding, principles, patterns, pitfalls, trajectory, confidence, memory_count, generated_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    model.domain,
    projectPath,
    model.understanding,
    toJson(model.principles),
    toJson(model.patterns),
    toJson(model.pitfalls),
    model.trajectory ?? null,
    model.confidence,
    model.memory_count,
    model.generated_at ?? ts,
    ts
  );
  return getMentalModel(model.domain, projectPath);
}
function getDecisionMemoriesForDomain(domain, limit = 20) {
  const db = getDatabase();
  const escaped = escapeLikePattern(domain);
  const rows = db.prepare(`
    SELECT ${MEMORY_COLS} FROM memories
    WHERE domains LIKE ? ESCAPE '\\'
      AND json_extract(type_data, '$.kind') = 'decision'
      AND superseded_by IS NULL
      AND storage_tier NOT IN ('cold')
    ORDER BY confidence DESC
    LIMIT ?
  `).all(`%"${escaped}"%`, limit);
  return rows.map(rowToMemory);
}

// src/types.ts
function isAntipatternData(data) {
  return data != null && typeof data === "object" && "kind" in data && data.kind === "antipattern";
}
function isEpisodicData(data) {
  return data != null && typeof data === "object" && "kind" in data && data.kind === "episodic";
}
function isSemanticData(data) {
  return data != null && typeof data === "object" && "kind" in data && data.kind === "semantic";
}
function isProceduralData(data) {
  return data != null && typeof data === "object" && "kind" in data && data.kind === "procedural";
}
function isDecisionData(data) {
  return data != null && typeof data === "object" && "kind" in data && data.kind === "decision";
}

// src/engines/prospective.ts
var logger2 = createLogger("prospective");
function checkProspectiveMemories(content, domain) {
  const active = getActiveProspectiveMemories();
  if (active.length === 0) return [];
  const results = [];
  for (const pm of active) {
    if (pm.domain && domain && pm.domain !== domain) continue;
    const similarity = keywordSimilarity(content, pm.trigger_pattern);
    if (similarity < PROSPECTIVE.MATCH_THRESHOLD) continue;
    incrementProspectiveFire(pm.id);
    if (pm.max_fires > 0 && pm.fire_count + 1 >= pm.max_fires) {
      updateProspectiveMemory(pm.id, { active: false });
      logger2.info("Prospective memory exhausted", { id: pm.id, fires: pm.fire_count + 1 });
    }
    if (pm.source_memory_id) {
      const sourceMem = getMemory(pm.source_memory_id);
      if (sourceMem) {
        results.push({
          memory: sourceMem,
          activation: PROSPECTIVE.INJECTION_ACTIVATION * similarity,
          source: "prospective",
          hops: 0,
          somatic_marker: false
        });
        logger2.debug("Prospective memory fired (source)", {
          id: pm.id,
          source_memory_id: pm.source_memory_id,
          similarity: similarity.toFixed(3)
        });
        continue;
      }
    }
    const ts = now();
    results.push({
      memory: {
        id: pm.id,
        type: "procedural",
        created_at: pm.created_at,
        updated_at: ts,
        content: pm.action,
        summary: null,
        token_count: Math.ceil(pm.action.length / 4),
        summary_token_count: 0,
        encoding_strength: 0.8,
        reinforcement: 1,
        confidence: 0.8,
        validation_count: 0,
        contradiction_count: 0,
        last_accessed: ts,
        access_count: 1,
        domains: pm.domain ? [pm.domain] : [],
        version: null,
        tags: ["prospective", "reminder"],
        storage_tier: "long_term",
        flagged_for_pruning: false,
        pinned: false,
        superseded_by: null,
        transformed_to: null,
        encoding_context: { project: null, framework: null, version: null, task_type: null, files: [] },
        type_data: { steps: [pm.action], context: "prospective reminder", verified: false }
      },
      activation: PROSPECTIVE.INJECTION_ACTIVATION * similarity,
      source: "prospective",
      hops: 0,
      somatic_marker: false
    });
    logger2.debug("Prospective memory fired (synthetic)", {
      id: pm.id,
      action: pm.action.substring(0, 50),
      similarity: similarity.toFixed(3)
    });
  }
  return results;
}
function createReminder(params) {
  const pm = createProspectiveMemory({
    trigger_pattern: params.trigger_pattern,
    action: params.action,
    domain: params.domain ?? null,
    priority: params.priority ?? 0.5,
    max_fires: params.max_fires ?? PROSPECTIVE.DEFAULT_MAX_FIRES,
    source_memory_id: params.source_memory_id ?? null
  });
  logger2.info("Created prospective memory", {
    id: pm.id,
    trigger: params.trigger_pattern.substring(0, 50),
    domain: params.domain
  });
  return pm;
}
function autoCreateFromAntipattern(memoryId, triggerKeywords, domain, severity) {
  const mem = getMemory(memoryId);
  if (!mem) return null;
  if (severity !== "critical" && severity !== "high") return null;
  const trigger = triggerKeywords.join(" ");
  if (!trigger) return null;
  const pm = createProspectiveMemory({
    trigger_pattern: trigger,
    action: `Antipattern warning: ${mem.content.substring(0, 100)}`,
    domain,
    priority: severity === "critical" ? 1 : 0.8,
    max_fires: 0,
    // Unlimited — antipattern reminders persist
    source_memory_id: memoryId
  });
  logger2.info("Auto-created prospective memory from antipattern", {
    id: pm.id,
    memory_id: memoryId,
    domain,
    severity
  });
  return pm;
}
function autoCreateFromLesson(memoryId, lesson, domain) {
  const mem = getMemory(memoryId);
  if (!mem) return null;
  const keywords = extractKeywords(lesson);
  if (keywords.length < 2) return null;
  const trigger = keywords.slice(0, 8).join(" ");
  const pm = createProspectiveMemory({
    trigger_pattern: trigger,
    action: `Lesson reminder: ${lesson.substring(0, 100)}`,
    domain,
    priority: 0.6,
    max_fires: 5,
    // Fire a few times then fade
    source_memory_id: memoryId
  });
  logger2.info("Auto-created prospective memory from lesson", {
    id: pm.id,
    memory_id: memoryId,
    domain
  });
  return pm;
}

// src/engines/validation.ts
var ALL_PERSPECTIVES = [
  "syntax",
  "error_type",
  "fix_type",
  "domain",
  "security"
];
function evaluatePerspective(perspective, content, domain, version) {
  switch (perspective) {
    case "syntax":
      return evaluateSyntaxPerspective(content, domain);
    case "error_type":
      return evaluateErrorTypePerspective(content, domain);
    case "fix_type":
      return evaluateFixTypePerspective(content, domain);
    case "domain":
      return evaluateDomainPerspective(content, domain);
    case "security":
      return evaluateSecurityPerspective(content, domain);
    default:
      return {
        perspective,
        confidence: 0,
        agrees: false,
        evidence: "Unknown perspective"
      };
  }
}
function evaluateSyntaxPerspective(content, domain) {
  const antipatterns = domain ? getAntipatterns(domain) : getAntipatterns();
  const contentKeywords = new Set(extractKeywords(content));
  const contentLower = content.toLowerCase();
  let bestScore = 0;
  let bestEvidence = "No keyword matches found";
  for (const ap of antipatterns) {
    if (!isAntipatternData(ap.type_data)) continue;
    const typeData = ap.type_data;
    if (typeData.trigger_keywords.length === 0) continue;
    let matches = 0;
    const matched = [];
    for (const keyword of typeData.trigger_keywords) {
      const kwLower = keyword.toLowerCase();
      if (contentKeywords.has(kwLower) || contentLower.includes(kwLower)) {
        matches++;
        matched.push(keyword);
      }
    }
    const score = matches / typeData.trigger_keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestEvidence = matched.length > 0 ? `Keyword matches: ${matched.join(", ")}` : "No keyword matches found";
    }
  }
  return {
    perspective: "syntax",
    confidence: bestScore,
    agrees: bestScore > VALIDATION.AGREEMENT_THRESHOLD,
    evidence: bestEvidence
  };
}
function evaluateErrorTypePerspective(content, domain) {
  const memories = searchMemories(content, 20);
  let bestScore = 0;
  let bestEvidence = "No error pattern matches found";
  for (const mem of memories) {
    if (!isEpisodicData(mem.type_data)) continue;
    if (mem.type_data.outcome !== "negative") continue;
    if (domain && mem.domains.length > 0 && !mem.domains.includes(domain)) continue;
    const similarity = keywordSimilarity(content, mem.content);
    if (similarity > bestScore) {
      bestScore = similarity;
      bestEvidence = `Error pattern match: ${mem.content.substring(0, 80)}`;
    }
  }
  const confidence = Math.min(bestScore * 1.5, 1);
  return {
    perspective: "error_type",
    confidence,
    agrees: confidence > VALIDATION.AGREEMENT_THRESHOLD,
    evidence: bestEvidence
  };
}
function evaluateFixTypePerspective(content, domain) {
  const antipatterns = domain ? getAntipatterns(domain) : getAntipatterns();
  const contentLower = content.toLowerCase();
  let bestScore = 0;
  let bestEvidence = "No fix pattern matches found";
  for (const ap of antipatterns) {
    if (!isAntipatternData(ap.type_data)) continue;
    const typeData = ap.type_data;
    const antipatternSimilarity = keywordSimilarity(content, ap.content);
    const fixSimilarity = keywordSimilarity(content, typeData.fix);
    let score = antipatternSimilarity;
    if (fixSimilarity > 0.3) {
      score *= 1 - fixSimilarity * 0.5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestEvidence = score > 0 ? `Content matches antipattern pattern (fix: ${typeData.fix.substring(0, 60)})` : "No fix pattern matches found";
    }
  }
  return {
    perspective: "fix_type",
    confidence: bestScore,
    agrees: bestScore > VALIDATION.AGREEMENT_THRESHOLD,
    evidence: bestEvidence
  };
}
function evaluateDomainPerspective(content, domain) {
  if (!domain) {
    return {
      perspective: "domain",
      confidence: 0,
      agrees: false,
      evidence: "No domain specified for domain perspective"
    };
  }
  const domainMemories = getMemoriesByDomain(domain, 50);
  let bestScore = 0;
  let bestEvidence = "No domain-specific contradictions found";
  for (const mem of domainMemories) {
    if (mem.type === "antipattern") continue;
    const similarity = keywordSimilarity(content, mem.content);
    const contentLower = mem.content.toLowerCase();
    const hasWarning = contentLower.includes("never") || contentLower.includes("deprecated") || contentLower.includes("removed") || contentLower.includes("avoid") || contentLower.includes("do not") || contentLower.includes("don't");
    const score = hasWarning ? similarity * 1.3 : similarity * 0.7;
    const clampedScore = Math.min(score, 1);
    if (clampedScore > bestScore) {
      bestScore = clampedScore;
      bestEvidence = `Domain knowledge: ${mem.content.substring(0, 80)}`;
    }
  }
  return {
    perspective: "domain",
    confidence: bestScore,
    agrees: bestScore > VALIDATION.AGREEMENT_THRESHOLD,
    evidence: bestEvidence
  };
}
function evaluateSecurityPerspective(content, domain) {
  const antipatterns = domain ? getAntipatterns(domain) : getAntipatterns();
  const contentLower = content.toLowerCase();
  let bestScore = 0;
  let bestEvidence = "No security concerns detected";
  for (const ap of antipatterns) {
    if (!isAntipatternData(ap.type_data)) continue;
    const typeData = ap.type_data;
    if (typeData.severity !== "critical" && typeData.severity !== "high") continue;
    const isSecurityRelated = typeData.applies_to.includes("security") || ap.domains.includes("security") || ap.content.toLowerCase().includes("security") || ap.content.toLowerCase().includes("injection") || ap.content.toLowerCase().includes("vulnerability") || ap.content.toLowerCase().includes("xss") || ap.content.toLowerCase().includes("csrf");
    const similarity = keywordSimilarity(content, ap.content);
    const score = isSecurityRelated ? similarity * 1.2 : similarity;
    const clampedScore = Math.min(score, 1);
    if (clampedScore > bestScore) {
      bestScore = clampedScore;
      bestEvidence = clampedScore > 0 ? `Security concern: [${typeData.severity.toUpperCase()}] ${ap.content.substring(0, 60)}` : "No security concerns detected";
    }
  }
  return {
    perspective: "security",
    confidence: bestScore,
    agrees: bestScore > VALIDATION.AGREEMENT_THRESHOLD,
    evidence: bestEvidence
  };
}
function validateMultiPerspective(content, domain, version) {
  const votes = ALL_PERSPECTIVES.map(
    (perspective) => evaluatePerspective(perspective, content, domain, version)
  );
  const agreeingVotes = votes.filter((v) => v.agrees);
  const consensus = votes.length > 0 ? agreeingVotes.length / votes.length : 0;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const vote of votes) {
    const weight = VALIDATION.PERSPECTIVE_WEIGHT[vote.perspective] ?? 1;
    weightedSum += vote.confidence * weight;
    weightTotal += weight;
  }
  const weightedConfidence = weightTotal > 0 ? weightedSum / weightTotal : 0;
  let decision;
  if (consensus >= VALIDATION.CONFIDENCE_THRESHOLD) {
    decision = "confident";
  } else if (consensus >= VALIDATION.UNCERTAIN_THRESHOLD) {
    decision = "uncertain";
  } else {
    decision = "reject";
  }
  return {
    votes,
    consensus,
    decision,
    weighted_confidence: weightedConfidence
  };
}

// src/engines/immune.ts
function checkAntipattern(content, domain, version, config) {
  const antipatterns = domain ? getAntipatterns(domain) : getAntipatterns();
  const matches = [];
  const contentKeywords = new Set(extractKeywords(content));
  for (const ap of antipatterns) {
    const typeData = ap.type_data;
    if (typeData.kind !== "antipattern") continue;
    const matchScore = calculateMatchScore(content, contentKeywords, typeData, ap);
    if (matchScore >= config.keyword_match_threshold) {
      if (version && ap.version && ap.version !== version) {
        if (!typeData.applies_to.includes("*")) continue;
      }
      const isFalsePositive = typeData.exceptions.some(
        (exc) => content.toLowerCase().includes(exc.context.toLowerCase())
      );
      if (isFalsePositive) continue;
      matches.push({
        antipattern_id: ap.id,
        memory_id: ap.id,
        trigger: typeData.trigger_keywords.join(", "),
        severity: typeData.severity,
        fix: typeData.fix,
        confidence: ap.confidence * typeData.affinity,
        domain: domain ?? ap.domains[0] ?? "general",
        match_score: matchScore
      });
    }
  }
  for (const match of matches) {
    if (match.match_score >= 0.5) {
      const consensus = validateMultiPerspective(content, domain, version);
      match.confidence *= consensus.weighted_confidence;
    }
  }
  matches.sort((a, b) => {
    const sevOrder = { critical: 3, high: 2, medium: 1 };
    const sevDiff = (sevOrder[b.severity] ?? 0) - (sevOrder[a.severity] ?? 0);
    if (sevDiff !== 0) return sevDiff;
    return b.match_score - a.match_score;
  });
  return {
    triggered: matches.length > 0,
    matches
  };
}
function calculateMatchScore(content, contentKeywords, typeData, memory) {
  let score = 0;
  if (typeData.trigger_keywords.length > 0) {
    let matches = 0;
    for (const keyword of typeData.trigger_keywords) {
      const kwLower = keyword.toLowerCase();
      if (contentKeywords.has(kwLower) || content.toLowerCase().includes(kwLower)) {
        matches++;
      }
    }
    score = matches / typeData.trigger_keywords.length;
  }
  const contentSim = keywordSimilarity(content, memory.content);
  score = Math.max(score, contentSim * 0.8);
  return score * typeData.affinity;
}
function createAntipatternFromExperience(content, fix, severity, domains, version, triggerKeywords, encodingContext) {
  const keywords = triggerKeywords.length > 0 ? triggerKeywords : extractKeywords(content).slice(0, 10);
  const typeData = {
    kind: "antipattern",
    trigger_keywords: keywords,
    fix,
    severity,
    applies_to: domains.length > 0 ? domains : ["*"],
    exceptions: [],
    first_encounter: null,
    exposure_count: 1,
    affinity: 0.7,
    // Starts moderate, improves with exposure
    false_positive_count: 0
  };
  return createMemory({
    type: "antipattern",
    content,
    summary: `[${severity.toUpperCase()}] ${content.substring(0, 100)}`,
    encoding_strength: 1,
    // Antipatterns encode at maximum strength
    reinforcement: 1,
    confidence: 0.7,
    domains,
    version,
    tags: ["antipattern", severity],
    storage_tier: "long_term",
    // Antipatterns go straight to long-term
    pinned: false,
    // Don't need pinning — they're decay-exempt by type
    encoding_context: encodingContext,
    type_data: typeData
  });
}
function vaccinate(warning, fix, severity, domains, version, sessionId) {
  const keywords = extractKeywords(warning).slice(0, 10);
  const typeData = {
    kind: "antipattern",
    trigger_keywords: keywords,
    fix,
    severity,
    applies_to: domains.length > 0 ? domains : ["*"],
    exceptions: [],
    first_encounter: null,
    exposure_count: 0,
    // Never actually experienced
    affinity: 0.5,
    // Lower initial affinity (learned from docs, not experience)
    false_positive_count: 0
  };
  const memory = createMemory({
    type: "antipattern",
    content: warning,
    summary: `[VACCINATED][${severity.toUpperCase()}] ${warning.substring(0, 80)}`,
    encoding_strength: 0.8,
    // Slightly lower than experiential (Kolb: experience > documentation)
    reinforcement: 1,
    confidence: 0.6,
    // Lower confidence until validated by experience
    domains,
    version,
    tags: ["antipattern", severity, "vaccinated"],
    storage_tier: "long_term",
    pinned: false,
    encoding_context: {
      project: null,
      project_path: null,
      framework: domains[0] ?? null,
      version,
      task_type: null,
      files: [],
      error_context: null,
      session_id: sessionId,
      significance_score: 0.8
    },
    type_data: typeData
  });
  if (severity === "critical" || severity === "high") {
    try {
      autoCreateFromAntipattern(memory.id, keywords, domains[0] ?? "general", severity);
    } catch {
    }
  }
  return memory;
}
function handleFalsePositive(antipatternId, falsePositiveContext, reason, config) {
  const memory = getMemory(antipatternId);
  if (!memory || memory.type !== "antipattern") return null;
  const typeData = memory.type_data;
  if (typeData.kind !== "antipattern") return null;
  const exceptions = [...typeData.exceptions];
  if (exceptions.length < config.max_exceptions) {
    exceptions.push({ context: falsePositiveContext, reason });
  }
  const newAffinity = clamp(typeData.affinity - config.false_positive_weaken, 0.1, 1);
  const updatedTypeData = {
    ...typeData,
    exceptions,
    affinity: newAffinity,
    false_positive_count: typeData.false_positive_count + 1
  };
  const newConfidence = clamp(memory.confidence - 0.05, 0.1, 1);
  return updateMemory(antipatternId, {
    confidence: newConfidence,
    type_data: updatedTypeData,
    contradiction_count: memory.contradiction_count + 1
  });
}
function strengthenAntipattern(antipatternId) {
  const memory = getMemory(antipatternId);
  if (!memory || memory.type !== "antipattern") return null;
  const typeData = memory.type_data;
  if (typeData.kind !== "antipattern") return null;
  const newAffinity = clamp(typeData.affinity + 0.05, 0, 1);
  const updatedTypeData = {
    ...typeData,
    affinity: newAffinity,
    exposure_count: typeData.exposure_count + 1
  };
  const newConfidence = clamp(memory.confidence + 0.03, 0, 1);
  return updateMemory(antipatternId, {
    confidence: newConfidence,
    validation_count: memory.validation_count + 1,
    type_data: updatedTypeData
  });
}

// src/engines/metacognition.ts
var logger3 = createLogger("metacognition");
function recordRecallOutcome(hitCount, totalReturned, domain) {
  const quality = totalReturned > 0 ? hitCount / totalReturned : 0;
  recordMetric("recall_quality", quality, { domain, hits: hitCount, total: totalReturned });
  if (totalReturned === 0 && domain) {
    recordMetric("blind_spot", 1, { domain });
  }
  logger3.debug("Recall outcome recorded", {
    quality: quality.toFixed(2),
    hits: hitCount,
    total: totalReturned,
    domain
  });
}
function recordImmuneOutcome(matchId, wasCorrect, domain) {
  recordMetric("immune_accuracy", wasCorrect ? 1 : 0, { match_id: matchId, domain, correct: wasCorrect });
  logger3.debug("Immune outcome recorded", {
    match_id: matchId,
    correct: wasCorrect,
    domain
  });
}
function recordCalibration(memoryId, predictedConfidence, actuallyCorrect) {
  recordMetric(
    "confidence_calibration",
    actuallyCorrect ? predictedConfidence : -predictedConfidence,
    { memory_id: memoryId, predicted: predictedConfidence, actual: actuallyCorrect }
  );
}
function recordRetrievalUtility(recalled, used) {
  const rate = recalled > 0 ? used / recalled : 0;
  recordMetric("retrieval_utility", rate, { recalled, used });
  logger3.info("Retrieval utility recorded", { recalled, used, rate: rate.toFixed(2) });
}
function evaluateSystemHealth() {
  const stats = getStats();
  const recallMetrics = getRecentMetrics("recall_quality", METACOGNITION.CALIBRATION_WINDOW);
  const recallHitRate = recallMetrics.length > 0 ? recallMetrics.filter((m) => m.value > 0).length / recallMetrics.length : 1;
  const immuneMetrics = getRecentMetrics("immune_accuracy", METACOGNITION.CALIBRATION_WINDOW);
  const falsePositiveRate = immuneMetrics.length > 0 ? immuneMetrics.filter((m) => m.value === 0).length / immuneMetrics.length : 0;
  const blindSpotMetrics = getRecentMetrics("blind_spot", METACOGNITION.CALIBRATION_WINDOW);
  const blindSpotCounts = /* @__PURE__ */ new Map();
  for (const metric of blindSpotMetrics) {
    try {
      const ctx = JSON.parse(metric.context);
      blindSpotCounts.set(ctx.domain, (blindSpotCounts.get(ctx.domain) ?? 0) + 1);
    } catch {
    }
  }
  const blindSpots = Array.from(blindSpotCounts.entries()).filter(([_, count]) => count >= METACOGNITION.BLIND_SPOT_THRESHOLD).map(([domain]) => domain);
  const calibMetrics = getRecentMetrics("confidence_calibration", METACOGNITION.CALIBRATION_WINDOW);
  let calibration = 1;
  if (calibMetrics.length > 0) {
    const correct = calibMetrics.filter((m) => m.value > 0);
    const avgPredicted = correct.length > 0 ? correct.reduce((sum, m) => sum + m.value, 0) / correct.length : 0.5;
    const actualRate = correct.length / calibMetrics.length;
    calibration = actualRate > 0 ? Math.min(avgPredicted / actualRate, 2) : 0;
  }
  const schemaCoverage = stats.total_memories > 0 && stats.total_schemas > 0 ? Math.min(1, stats.total_schemas / (stats.total_memories * 0.1)) : 0;
  const utilityMetrics = getRecentMetrics("retrieval_utility", METACOGNITION.CALIBRATION_WINDOW);
  const retrievalUtilityRate = utilityMetrics.length > 0 ? utilityMetrics.reduce((sum, m) => sum + m.value, 0) / utilityMetrics.length : -1;
  const recommendations = [];
  if (blindSpots.length > 0) {
    recommendations.push(`Blind spots detected in domains: ${blindSpots.join(", ")}. Consider encoding more knowledge.`);
  }
  if (falsePositiveRate > METACOGNITION.FP_RATE_WARNING) {
    recommendations.push(`High false positive rate (${(falsePositiveRate * 100).toFixed(0)}%). Review antipattern exceptions.`);
  }
  if (recallHitRate < 0.5) {
    recommendations.push(`Low recall hit rate (${(recallHitRate * 100).toFixed(0)}%). Memory relevance may need improvement.`);
  }
  if (calibration < 0.5 || calibration > 1.5) {
    recommendations.push(`Confidence calibration off (${calibration.toFixed(2)}). System may be over/under-confident.`);
  }
  if (retrievalUtilityRate >= 0 && retrievalUtilityRate < 0.1) {
    recommendations.push(`Low retrieval utility (${(retrievalUtilityRate * 100).toFixed(0)}%). Recalled memories aren't being used. Consider improving relevance.`);
  }
  const health = {
    confidence_calibration: calibration,
    false_positive_rate: falsePositiveRate,
    blind_spots: blindSpots,
    recall_hit_rate: recallHitRate,
    schema_coverage: schemaCoverage,
    retrieval_utility_rate: retrievalUtilityRate,
    recommendations
  };
  logger3.info("System health evaluated", {
    calibration: calibration.toFixed(2),
    fp_rate: falsePositiveRate.toFixed(2),
    blind_spots: blindSpots.length,
    recall_hit_rate: recallHitRate.toFixed(2),
    recommendations: recommendations.length
  });
  return health;
}
function assessConfidence(recalledMemories, domain, version) {
  let domainConfidence = 0.5;
  let memoryCount = 0;
  if (domain) {
    try {
      const domainMemories = getMemoriesByDomain(domain, 200);
      memoryCount = domainMemories.length;
      if (memoryCount >= CONFIDENCE_GATING.MIN_MEMORIES_FOR_CONFIDENCE) {
        const totalConf = domainMemories.reduce((sum, m) => sum + m.confidence, 0);
        domainConfidence = totalConf / memoryCount;
      } else if (memoryCount > 0) {
        const totalConf = domainMemories.reduce((sum, m) => sum + m.confidence, 0);
        domainConfidence = totalConf / memoryCount * (memoryCount / CONFIDENCE_GATING.MIN_MEMORIES_FOR_CONFIDENCE);
      } else {
        domainConfidence = 0;
      }
    } catch {
    }
  }
  let approachConfidence = 0;
  if (recalledMemories.length > 0) {
    let totalWeight = 0;
    let weightedConf = 0;
    for (const m of recalledMemories) {
      const weight = m.activation;
      weightedConf += m.memory.confidence * weight;
      totalWeight += weight;
    }
    approachConfidence = totalWeight > 0 ? weightedConf / totalWeight : 0;
  }
  const blendedApproach = recalledMemories.length > 0 ? approachConfidence * CONFIDENCE_GATING.RECALL_CONFIDENCE_WEIGHT + domainConfidence * CONFIDENCE_GATING.DOMAIN_CONFIDENCE_WEIGHT : domainConfidence;
  const gapDetected = recalledMemories.length === 0 && memoryCount < CONFIDENCE_GATING.GAP_MEMORY_THRESHOLD;
  const contradictions = detectContradictions(recalledMemories, version);
  const { lastSuccess, lastFailure } = findLastOutcomes(recalledMemories);
  const calibration = getCalibrationScore();
  const assessment = {
    domain_confidence: domainConfidence,
    approach_confidence: blendedApproach,
    memory_count: memoryCount,
    gap_detected: gapDetected,
    contradictions,
    last_success: lastSuccess,
    last_failure: lastFailure,
    calibration_score: calibration
  };
  logger3.debug("Confidence assessed", {
    domain,
    domain_confidence: domainConfidence.toFixed(2),
    approach_confidence: blendedApproach.toFixed(2),
    memory_count: memoryCount,
    gap: gapDetected,
    contradictions: contradictions.length,
    has_success: !!lastSuccess,
    has_failure: !!lastFailure
  });
  return assessment;
}
function detectContradictions(memories, version) {
  const contradictions = [];
  const memoryIds = new Set(memories.map((m) => m.memory.id));
  for (const m of memories) {
    if (contradictions.length >= CONFIDENCE_GATING.MAX_CONTRADICTIONS) break;
    try {
      const connections = getConnections(m.memory.id);
      for (const conn of connections) {
        if (contradictions.length >= CONFIDENCE_GATING.MAX_CONTRADICTIONS) break;
        if (conn.type !== "contradicts") continue;
        if (conn.strength < CONFIDENCE_GATING.MIN_CONTRADICTION_STRENGTH) continue;
        const otherId = conn.source_id === m.memory.id ? conn.target_id : conn.source_id;
        if (!memoryIds.has(otherId)) continue;
        const other = memories.find((x) => x.memory.id === otherId);
        if (!other) continue;
        const key = [m.memory.id, otherId].sort().join(":");
        if (contradictions.some((c) => [c.memory_a_id, c.memory_b_id].sort().join(":") === key)) continue;
        contradictions.push({
          memory_a_id: m.memory.id,
          memory_a_summary: truncateContent(m.memory),
          memory_b_id: otherId,
          memory_b_summary: truncateContent(other.memory),
          conflict_type: "contradicts"
        });
      }
    } catch {
    }
  }
  if (version && contradictions.length < CONFIDENCE_GATING.MAX_CONTRADICTIONS) {
    const versionMismatched = memories.filter(
      (m) => m.memory.version && m.memory.version !== version
    );
    const versionMatched = memories.filter(
      (m) => m.memory.version && m.memory.version === version
    );
    if (versionMismatched.length > 0 && versionMatched.length > 0) {
      const mismatch = versionMismatched[0];
      const match = versionMatched[0];
      if (contradictions.length < CONFIDENCE_GATING.MAX_CONTRADICTIONS) {
        contradictions.push({
          memory_a_id: match.memory.id,
          memory_a_summary: `[v${match.memory.version}] ${truncateContent(match.memory)}`,
          memory_b_id: mismatch.memory.id,
          memory_b_summary: `[v${mismatch.memory.version}] ${truncateContent(mismatch.memory)}`,
          conflict_type: "version_mismatch"
        });
      }
    }
  }
  return contradictions;
}
function findLastOutcomes(memories) {
  let lastSuccess = null;
  let lastFailure = null;
  for (const m of memories) {
    if (!isEpisodicData(m.memory.type_data)) continue;
    const outcome = m.memory.type_data.outcome;
    const timestamp = m.memory.created_at;
    if (outcome === "positive" && (!lastSuccess || timestamp > lastSuccess)) {
      lastSuccess = timestamp;
    } else if (outcome === "negative" && (!lastFailure || timestamp > lastFailure)) {
      lastFailure = timestamp;
    }
  }
  return { lastSuccess, lastFailure };
}
function truncateContent(memory) {
  const text = memory.summary ?? memory.content;
  return text.length > 100 ? text.substring(0, 97) + "..." : text;
}
function getCalibrationScore() {
  const avgRecallQuality = getMetricAverage("recall_quality", METACOGNITION.CALIBRATION_WINDOW);
  return avgRecallQuality ?? 0.5;
}
function detectBlindSpots(activeDomain) {
  const blindSpots = [];
  let stats;
  try {
    stats = getStats();
  } catch {
    return { blind_spots: [], domains_analyzed: 0, total_memories: 0, generated_at: now() };
  }
  const domainCounts = stats.by_domain;
  const domains = Object.keys(domainCounts);
  for (const [domain, count] of Object.entries(domainCounts)) {
    if (count < BLIND_SPOT_DETECTION.KNOWLEDGE_GAP_THRESHOLD) {
      blindSpots.push({
        domain,
        reason: "knowledge_gap",
        severity: "high",
        detail: `Only ${count} memor${count === 1 ? "y" : "ies"} in "${domain}"`,
        memory_count: count,
        metric_value: null,
        recommendation: `Encode more knowledge about ${domain}. Use engram_encode or engram_learn.`
      });
    } else if (count < BLIND_SPOT_DETECTION.SPARSE_KNOWLEDGE_THRESHOLD) {
      blindSpots.push({
        domain,
        reason: "knowledge_gap",
        severity: "low",
        detail: `Only ${count} memories in "${domain}" (sparse)`,
        memory_count: count,
        metric_value: null,
        recommendation: `Consider encoding more ${domain} knowledge when opportunities arise.`
      });
    }
  }
  const blindSpotMetrics = getRecentMetrics("blind_spot", METACOGNITION.CALIBRATION_WINDOW);
  const domainErrorCounts = /* @__PURE__ */ new Map();
  for (const metric of blindSpotMetrics) {
    try {
      const ctx = JSON.parse(metric.context);
      if (ctx.domain) {
        domainErrorCounts.set(ctx.domain, (domainErrorCounts.get(ctx.domain) ?? 0) + 1);
      }
    } catch {
    }
  }
  for (const [domain, errorCount] of domainErrorCounts) {
    const memCount = domainCounts[domain] ?? 0;
    if (memCount < BLIND_SPOT_DETECTION.MIN_DOMAIN_MEMORIES_FOR_RATE) continue;
    if (errorCount < BLIND_SPOT_DETECTION.MIN_METRICS_FOR_RATE) continue;
    const errorRate = errorCount / (errorCount + memCount);
    if (errorRate >= BLIND_SPOT_DETECTION.HIGH_ERROR_RATE_THRESHOLD) {
      if (!blindSpots.some((b) => b.domain === domain && b.reason === "knowledge_gap" && b.severity === "high")) {
        blindSpots.push({
          domain,
          reason: "high_error_rate",
          severity: errorRate >= 0.5 ? "high" : "medium",
          detail: `High error rate in "${domain}" (${(errorRate * 100).toFixed(0)}%)`,
          memory_count: memCount,
          metric_value: errorRate,
          recommendation: `Weak at ${domain}. Extra verification recommended.`
        });
      }
    } else if (errorRate >= BLIND_SPOT_DETECTION.MEDIUM_ERROR_RATE_THRESHOLD) {
      if (!blindSpots.some((b) => b.domain === domain)) {
        blindSpots.push({
          domain,
          reason: "high_error_rate",
          severity: "low",
          detail: `Moderate error rate in "${domain}" (${(errorRate * 100).toFixed(0)}%)`,
          memory_count: memCount,
          metric_value: errorRate,
          recommendation: `Some errors in ${domain}. Consider reviewing domain knowledge.`
        });
      }
    }
  }
  const recallMetrics = getRecentMetrics("recall_quality", METACOGNITION.CALIBRATION_WINDOW);
  const domainRecallTotals = /* @__PURE__ */ new Map();
  for (const metric of recallMetrics) {
    try {
      const ctx = JSON.parse(metric.context);
      const domain = ctx.domain;
      if (!domain) continue;
      const entry = domainRecallTotals.get(domain) ?? { total: 0, hits: 0 };
      entry.total++;
      if (metric.value > 0) entry.hits++;
      domainRecallTotals.set(domain, entry);
    } catch {
    }
  }
  for (const [domain, recallData] of domainRecallTotals) {
    if (recallData.total < BLIND_SPOT_DETECTION.MIN_METRICS_FOR_RATE) continue;
    const hitRate = recallData.hits / recallData.total;
    if (hitRate < BLIND_SPOT_DETECTION.LOW_RECALL_QUALITY_THRESHOLD) {
      if (!blindSpots.some((b) => b.domain === domain)) {
        blindSpots.push({
          domain,
          reason: "low_recall_quality",
          severity: hitRate < 0.15 ? "high" : "medium",
          detail: `Low recall quality in "${domain}" (${(hitRate * 100).toFixed(0)}% hit rate)`,
          memory_count: domainCounts[domain] ?? 0,
          metric_value: hitRate,
          recommendation: `Memories in ${domain} aren't helping. Consider rewriting or adding better-indexed knowledge.`
        });
      }
    }
  }
  if (activeDomain) {
    const feedbackMetrics = getRecentMetrics("confidence_calibration", METACOGNITION.CALIBRATION_WINDOW);
    let corrections = 0;
    let totalFeedback = 0;
    for (const metric of feedbackMetrics) {
      try {
        const ctx = JSON.parse(metric.context);
        if (ctx.domain !== activeDomain) continue;
        totalFeedback++;
        if (metric.value < 0) corrections++;
      } catch {
      }
    }
    if (totalFeedback >= BLIND_SPOT_DETECTION.MIN_METRICS_FOR_RATE) {
      const correctionRate = corrections / totalFeedback;
      if (correctionRate >= BLIND_SPOT_DETECTION.HIGH_CORRECTION_RATE_THRESHOLD) {
        if (!blindSpots.some((b) => b.domain === activeDomain)) {
          blindSpots.push({
            domain: activeDomain,
            reason: "high_correction_rate",
            severity: correctionRate >= 0.5 ? "high" : "medium",
            detail: `Frequent corrections in "${activeDomain}" (${(correctionRate * 100).toFixed(0)}%)`,
            memory_count: domainCounts[activeDomain] ?? 0,
            metric_value: correctionRate,
            recommendation: `Knowledge in ${activeDomain} may be outdated. Verify with current docs.`
          });
        }
      }
    }
  }
  const severityOrder = { high: 0, medium: 1, low: 2 };
  blindSpots.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.domain.localeCompare(b.domain);
  });
  const report = {
    blind_spots: blindSpots,
    domains_analyzed: domains.length,
    total_memories: stats.total_memories,
    generated_at: now()
  };
  logger3.info("Blind spot detection complete", {
    domains_analyzed: domains.length,
    blind_spots_found: blindSpots.length,
    high: blindSpots.filter((b) => b.severity === "high").length,
    medium: blindSpots.filter((b) => b.severity === "medium").length,
    low: blindSpots.filter((b) => b.severity === "low").length
  });
  return report;
}
function generateLearningGoals(report) {
  const created = [];
  let activeGoals;
  try {
    activeGoals = getActiveLearningGoals();
  } catch {
    return created;
  }
  if (activeGoals.length >= LEARNING_GOALS.MAX_ACTIVE_GOALS) {
    logger3.debug("Learning goal limit reached", { active: activeGoals.length, max: LEARNING_GOALS.MAX_ACTIVE_GOALS });
    return created;
  }
  const significant = report.blind_spots.filter(
    (b) => b.severity === "high" || b.severity === LEARNING_GOALS.MIN_BLIND_SPOT_SEVERITY
  );
  for (const blindSpot of significant) {
    if (activeGoals.length + created.length >= LEARNING_GOALS.MAX_ACTIVE_GOALS) break;
    const topic = blindSpotToTopic(blindSpot);
    const existing = getLearningGoalByDomainTopic(blindSpot.domain, topic);
    if (existing) continue;
    if (created.some((g) => g.domain === blindSpot.domain && g.topic === topic)) continue;
    try {
      const goal = createLearningGoal({
        domain: blindSpot.domain,
        topic,
        priority: LEARNING_GOALS.AUTO_PRIORITY,
        reason: blindSpot.reason,
        target_confidence: LEARNING_GOALS.DEFAULT_TARGET_CONFIDENCE,
        current_confidence: blindSpot.metric_value ?? 0,
        status: "active"
      });
      created.push(goal);
      logger3.info("Learning goal auto-created", { domain: goal.domain, topic: goal.topic, reason: goal.reason });
    } catch (e) {
      logger3.error("Failed to create learning goal", { domain: blindSpot.domain, error: String(e) });
    }
  }
  return created;
}
function blindSpotToTopic(blindSpot) {
  switch (blindSpot.reason) {
    case "knowledge_gap":
      return `${blindSpot.domain} fundamentals`;
    case "high_error_rate":
      return `${blindSpot.domain} error patterns`;
    case "high_correction_rate":
      return `${blindSpot.domain} accuracy`;
    case "low_recall_quality":
      return `${blindSpot.domain} recall improvement`;
    default:
      return blindSpot.domain;
  }
}
function refreshLearningGoals() {
  let updated = 0;
  let achieved = 0;
  let abandoned = 0;
  let goals;
  try {
    goals = getActiveLearningGoals();
  } catch {
    return { updated, achieved, abandoned };
  }
  for (const goal of goals) {
    let currentConfidence = 0;
    try {
      const domainMemories = getMemoriesByDomain(goal.domain, 200);
      if (domainMemories.length > 0) {
        currentConfidence = domainMemories.reduce((sum, m) => sum + m.confidence, 0) / domainMemories.length;
      }
    } catch {
      continue;
    }
    if (currentConfidence >= goal.target_confidence) {
      updateLearningGoal(goal.id, { current_confidence: currentConfidence, status: "achieved" });
      achieved++;
      logger3.info("Learning goal achieved", { domain: goal.domain, topic: goal.topic, confidence: currentConfidence.toFixed(2) });
      continue;
    }
    if (goal.priority <= LEARNING_GOALS.AUTO_PRIORITY) {
      const ageDays = daysElapsed(goal.updated_at, now());
      if (ageDays > LEARNING_GOALS.AUTO_ABANDON_DAYS) {
        updateLearningGoal(goal.id, { status: "abandoned" });
        abandoned++;
        logger3.info("Learning goal abandoned (stale)", { domain: goal.domain, topic: goal.topic, age_days: ageDays });
        continue;
      }
    }
    if (Math.abs(currentConfidence - goal.current_confidence) > 0.01) {
      updateLearningGoal(goal.id, { current_confidence: currentConfidence });
      updated++;
    }
  }
  return { updated, achieved, abandoned };
}

// src/engines/skills.ts
var logger4 = createLogger("skills");
function recordPractice(memoryId, success, durationMs) {
  const mem = getMemory(memoryId);
  if (!mem || !isProceduralData(mem.type_data)) return null;
  const typeData = mem.type_data;
  const newPracticeCount = typeData.practice_count + 1;
  let newAutomaticity = typeData.automaticity;
  let skillMeta = typeData.skill_metadata;
  if (!skillMeta) {
    skillMeta = {
      trigger_context: mem.content.substring(0, 200),
      chunk_level: 1,
      success_count: success ? 1 : 0,
      failure_count: success ? 0 : 1,
      avg_duration_ms: durationMs ?? null,
      last_executed: now(),
      prerequisites: [],
      transferable_to: []
    };
  } else {
    if (success) skillMeta.success_count++;
    else skillMeta.failure_count++;
    skillMeta.last_executed = now();
    if (durationMs != null) {
      if (skillMeta.avg_duration_ms == null) {
        skillMeta.avg_duration_ms = durationMs;
      } else {
        skillMeta.avg_duration_ms = skillMeta.avg_duration_ms * 0.7 + durationMs * 0.3;
      }
    }
  }
  if (success) {
    newAutomaticity = Math.min(1, newAutomaticity + SKILL.AUTOMATICITY_INCREMENT);
  }
  let stage = "declarative";
  if (newPracticeCount >= SKILL.AUTOMATICITY_THRESHOLD) {
    stage = "automatic";
    skillMeta.chunk_level = 5;
  } else if (newPracticeCount >= SKILL.CHUNKING_THRESHOLD) {
    stage = "chunked";
    skillMeta.chunk_level = Math.min(4, Math.max(skillMeta.chunk_level, 3));
  } else if (newPracticeCount >= SKILL.COMPILATION_THRESHOLD) {
    stage = "compiled";
    skillMeta.chunk_level = Math.max(skillMeta.chunk_level, 2);
  }
  const updatedTypeData = {
    ...typeData,
    practice_count: newPracticeCount,
    automaticity: newAutomaticity,
    skill_metadata: skillMeta
  };
  updateMemory(memoryId, {
    type_data: updatedTypeData,
    last_accessed: now(),
    access_count: mem.access_count + 1
  });
  logger4.debug("Practice recorded", {
    memory_id: memoryId,
    stage,
    practice_count: newPracticeCount,
    automaticity: newAutomaticity.toFixed(3)
  });
  return { stage, automaticity: newAutomaticity, practice_count: newPracticeCount };
}
function assessMastery(domain, skill) {
  const existing = getMasteryProfileByDomainSkill(domain, skill);
  if (existing) return existing;
  const timestamp = now();
  const nextReview = computeNextReview("novice", timestamp);
  return createMasteryProfile({
    domain,
    skill,
    level: "novice",
    evidence: [],
    practice_count: 0,
    success_count: 0,
    failure_count: 0,
    success_rate: 0,
    last_practiced: timestamp,
    next_review: nextReview,
    zone_of_proximal: []
  });
}
function recordMasteryOutcome(domain, skill, outcome, detail = "") {
  const profile = assessMastery(domain, skill);
  const previousLevel = profile.level;
  profile.practice_count++;
  if (outcome === "positive") profile.success_count++;
  if (outcome === "negative") profile.failure_count++;
  profile.success_rate = profile.practice_count > 0 ? profile.success_count / profile.practice_count : 0;
  profile.last_practiced = now();
  const evidence = {
    timestamp: now(),
    outcome,
    detail: detail.substring(0, 200),
    skill
  };
  profile.evidence.push(evidence);
  if (profile.evidence.length > MASTERY.MAX_EVIDENCE) {
    profile.evidence = profile.evidence.slice(-MASTERY.MAX_EVIDENCE);
  }
  const newLevel = evaluateMasteryLevel(profile);
  const levelChanged = newLevel !== previousLevel;
  profile.level = newLevel;
  profile.next_review = computeNextReview(newLevel, profile.last_practiced);
  updateMasteryProfile(profile.id, {
    level: profile.level,
    evidence: profile.evidence,
    practice_count: profile.practice_count,
    success_count: profile.success_count,
    failure_count: profile.failure_count,
    success_rate: profile.success_rate,
    last_practiced: profile.last_practiced,
    next_review: profile.next_review
  });
  if (levelChanged) {
    const direction = MASTERY_LEVEL_ORDER[newLevel] > MASTERY_LEVEL_ORDER[previousLevel] ? "leveled up" : "regressed";
    logger4.info(`Mastery ${direction}`, {
      domain,
      skill,
      from: previousLevel,
      to: newLevel,
      practice_count: profile.practice_count,
      success_rate: profile.success_rate.toFixed(3)
    });
  }
  return { profile, level_changed: levelChanged, previous_level: previousLevel };
}
function evaluateMasteryLevel(profile) {
  const { practice_count, success_rate } = profile;
  const regressionLevel = checkRegression(profile);
  if (regressionLevel !== null) return regressionLevel;
  if (practice_count >= MASTERY.EXPERT_PRACTICES && success_rate >= MASTERY.EXPERT_SUCCESS_RATE) {
    return "expert";
  }
  if (practice_count >= MASTERY.PROFICIENT_PRACTICES && success_rate >= MASTERY.PROFICIENT_SUCCESS_RATE) {
    return "proficient";
  }
  if (practice_count >= MASTERY.COMPETENT_PRACTICES && success_rate >= MASTERY.COMPETENT_SUCCESS_RATE) {
    return "competent";
  }
  if (practice_count >= MASTERY.ADVANCED_BEGINNER_PRACTICES && success_rate >= MASTERY.ADVANCED_BEGINNER_SUCCESS_RATE) {
    return "advanced_beginner";
  }
  return "novice";
}
function checkRegression(profile) {
  if (profile.level === "novice") return null;
  const recentEvidence = profile.evidence.slice(-MASTERY.REGRESSION_WINDOW);
  const recentFailures = recentEvidence.filter((e) => e.outcome === "negative").length;
  if (recentFailures < MASTERY.REGRESSION_MIN_FAILURES) return null;
  const requiredRate = getRequiredSuccessRate(profile.level);
  const regressionThreshold = requiredRate * MASTERY.REGRESSION_FACTOR;
  if (profile.success_rate < regressionThreshold) {
    const currentOrder = MASTERY_LEVEL_ORDER[profile.level];
    const levels = ["novice", "advanced_beginner", "competent", "proficient", "expert"];
    return levels[Math.max(0, currentOrder - 1)];
  }
  return null;
}
function getRequiredSuccessRate(level) {
  switch (level) {
    case "expert":
      return MASTERY.EXPERT_SUCCESS_RATE;
    case "proficient":
      return MASTERY.PROFICIENT_SUCCESS_RATE;
    case "competent":
      return MASTERY.COMPETENT_SUCCESS_RATE;
    case "advanced_beginner":
      return MASTERY.ADVANCED_BEGINNER_SUCCESS_RATE;
    default:
      return 0;
  }
}
function computeNextReview(level, fromDate) {
  const levelOrder = MASTERY_LEVEL_ORDER[level];
  const intervalDays = MASTERY.BASE_REVIEW_INTERVAL_DAYS * Math.pow(MASTERY.REVIEW_INTERVAL_MULTIPLIER, levelOrder);
  const date = new Date(fromDate);
  date.setDate(date.getDate() + Math.round(intervalDays));
  return date.toISOString();
}
function getMasteryForDomain(domain) {
  if (domain) return getMasteryProfilesByDomain(domain);
  return getAllMasteryProfiles();
}
function getProfilesDueForReview() {
  return getOverdueMasteryProfiles();
}
function evaluateAllMastery() {
  const profiles = getAllMasteryProfiles();
  let changedCount = 0;
  for (const profile of profiles) {
    const newLevel = evaluateMasteryLevel(profile);
    if (newLevel !== profile.level) {
      const fromLevel = profile.level;
      updateMasteryProfile(profile.id, {
        level: newLevel,
        next_review: computeNextReview(newLevel, profile.last_practiced)
      });
      changedCount++;
      logger4.info("Consolidation mastery adjustment", {
        domain: profile.domain,
        skill: profile.skill,
        from: fromLevel,
        to: newLevel
      });
    }
  }
  return changedCount;
}
function formatMasteryInjection() {
  const profiles = getAllMasteryProfiles();
  if (profiles.length === 0) return null;
  const byLevel = /* @__PURE__ */ new Map();
  for (const p of profiles) {
    const group = byLevel.get(p.level) ?? [];
    group.push(p);
    byLevel.set(p.level, group);
  }
  const parts = [];
  const levels = ["expert", "proficient", "competent", "advanced_beginner", "novice"];
  let itemCount = 0;
  for (const level of levels) {
    const group = byLevel.get(level);
    if (!group || group.length === 0) continue;
    const items = group.slice(0, MASTERY.INJECTION_MAX_PROFILES - itemCount);
    if (items.length === 0) break;
    const levelLabel = level.replace("_", " ");
    const skills = items.map((p) => `${p.domain}/${p.skill}(${Math.round(p.success_rate * 100)}%)`);
    parts.push(`${levelLabel}: ${skills.join(", ")}`);
    itemCount += items.length;
    if (itemCount >= MASTERY.INJECTION_MAX_PROFILES) break;
  }
  const overdue = getOverdueMasteryProfiles();
  if (overdue.length > 0) {
    const overdueSkills = overdue.slice(0, 3).map((p) => `${p.domain}/${p.skill}`);
    parts.push(`due for review: ${overdueSkills.join(", ")}`);
  }
  return parts.length > 0 ? `Mastery: ${parts.join(" | ")}` : null;
}
function getScaffoldingConfig(domain) {
  if (!domain) {
    return buildScaffoldingConfig("novice", []);
  }
  const profiles = getMasteryProfilesByDomain(domain);
  if (profiles.length === 0) {
    const analogySources2 = findAnalogySourceDomains(domain);
    return buildScaffoldingConfig("novice", analogySources2);
  }
  const effectiveLevel = getEffectiveDomainLevel(profiles);
  const levelOrder = MASTERY_LEVEL_ORDER[effectiveLevel];
  const analogySources = levelOrder <= SCAFFOLDING.ANALOGY_MAX_LEVEL_ORDER ? findAnalogySourceDomains(domain) : [];
  return buildScaffoldingConfig(effectiveLevel, analogySources);
}
function buildScaffoldingConfig(level, analogySourceDomains) {
  switch (level) {
    case "novice":
      return {
        level,
        max_results: SCAFFOLDING.NOVICE_MAX_RESULTS,
        max_procedural: SCAFFOLDING.NOVICE_MAX_PROCEDURAL,
        max_schemas: SCAFFOLDING.NOVICE_MAX_SCHEMAS,
        content_length: SCAFFOLDING.NOVICE_CONTENT_LENGTH,
        include_analogies: SCAFFOLDING.ANALOGY_ENABLED && analogySourceDomains.length > 0,
        analogy_source_domains: analogySourceDomains
      };
    case "advanced_beginner":
      return {
        level,
        max_results: SCAFFOLDING.ADVANCED_BEGINNER_MAX_RESULTS,
        max_procedural: SCAFFOLDING.ADVANCED_BEGINNER_MAX_PROCEDURAL,
        max_schemas: SCAFFOLDING.ADVANCED_BEGINNER_MAX_SCHEMAS,
        content_length: SCAFFOLDING.ADVANCED_BEGINNER_CONTENT_LENGTH,
        include_analogies: SCAFFOLDING.ANALOGY_ENABLED && analogySourceDomains.length > 0,
        analogy_source_domains: analogySourceDomains
      };
    case "competent":
      return {
        level,
        max_results: SCAFFOLDING.COMPETENT_MAX_RESULTS,
        max_procedural: SCAFFOLDING.COMPETENT_MAX_PROCEDURAL,
        max_schemas: SCAFFOLDING.COMPETENT_MAX_SCHEMAS,
        content_length: SCAFFOLDING.COMPETENT_CONTENT_LENGTH,
        include_analogies: false,
        analogy_source_domains: []
      };
    case "proficient":
      return {
        level,
        max_results: SCAFFOLDING.PROFICIENT_MAX_RESULTS,
        max_procedural: SCAFFOLDING.PROFICIENT_MAX_PROCEDURAL,
        max_schemas: SCAFFOLDING.PROFICIENT_MAX_SCHEMAS,
        content_length: SCAFFOLDING.PROFICIENT_CONTENT_LENGTH,
        include_analogies: false,
        analogy_source_domains: []
      };
    case "expert":
      return {
        level,
        max_results: SCAFFOLDING.EXPERT_MAX_RESULTS,
        max_procedural: SCAFFOLDING.EXPERT_MAX_PROCEDURAL,
        max_schemas: SCAFFOLDING.EXPERT_MAX_SCHEMAS,
        content_length: SCAFFOLDING.EXPERT_CONTENT_LENGTH,
        include_analogies: false,
        analogy_source_domains: []
      };
  }
}
function getEffectiveDomainLevel(profiles) {
  if (profiles.length === 0) return "novice";
  let highestOrder = 0;
  let highestLevel = "novice";
  for (const p of profiles) {
    const order = MASTERY_LEVEL_ORDER[p.level];
    if (order > highestOrder) {
      highestOrder = order;
      highestLevel = p.level;
    }
  }
  return highestLevel;
}
function findAnalogySourceDomains(targetDomain) {
  if (!SCAFFOLDING.ANALOGY_ENABLED) return [];
  const allProfiles = getAllMasteryProfiles();
  const domainBest = /* @__PURE__ */ new Map();
  for (const p of allProfiles) {
    if (p.domain === targetDomain) continue;
    const order = MASTERY_LEVEL_ORDER[p.level];
    const current = domainBest.get(p.domain) ?? 0;
    if (order > current) domainBest.set(p.domain, order);
  }
  const sources = [];
  for (const [domain, order] of domainBest) {
    if (order >= SCAFFOLDING.ANALOGY_SOURCE_MIN_LEVEL_ORDER) {
      sources.push(domain);
    }
  }
  return sources;
}
function applyScaffolding(memories, scaffolding) {
  if (memories.length === 0) return [];
  const level = scaffolding.level;
  const result = [];
  for (const mem of memories) {
    let activation = mem.activation;
    const m = mem.memory;
    if (level === "novice" || level === "advanced_beginner") {
      if (m.type === "antipattern") {
        activation *= SCAFFOLDING.NOVICE_ANTIPATTERN_BOOST;
      }
      if (m.type === "procedural") {
        activation *= SCAFFOLDING.NOVICE_PROCEDURAL_BOOST;
      }
    } else if (level === "competent") {
      if (m.type === "episodic") {
        activation *= SCAFFOLDING.COMPETENT_EPISODIC_BOOST;
      }
    } else if (level === "expert") {
      if (m.type === "antipattern") {
        const apData = m.type_data;
        if ("severity" in apData && apData.severity === "medium") {
          continue;
        }
      }
      if (m.type === "procedural") {
        continue;
      }
    }
    result.push({ ...mem, activation });
  }
  result.sort((a, b) => b.activation - a.activation);
  return result.slice(0, scaffolding.max_results);
}
function findCrossDomainAnalogies(query, scaffolding) {
  if (!scaffolding.include_analogies || scaffolding.analogy_source_domains.length === 0) {
    return [];
  }
  const analogies = [];
  for (const sourceDomain of scaffolding.analogy_source_domains) {
    const domainMems = getMemoriesByDomain(sourceDomain, 20);
    const profiles = getMasteryProfilesByDomain(sourceDomain);
    const sourceLevel = getEffectiveDomainLevel(profiles);
    for (const mem of domainMems) {
      const relevance = keywordSimilarity(query, mem.content);
      if (relevance >= 0.15) {
        analogies.push({
          source_domain: sourceDomain,
          source_level: sourceLevel,
          memory: mem,
          relevance
        });
      }
    }
  }
  analogies.sort((a, b) => b.relevance - a.relevance);
  return analogies.slice(0, SCAFFOLDING.ANALOGY_MAX_RESULTS);
}
function addSkillPrerequisite(domain, skill, prerequisiteSkill, requiredLevel, autoDiscovered = false) {
  if (skill === prerequisiteSkill) return null;
  if (wouldCreateCycle(domain, skill, prerequisiteSkill)) {
    logger4.warn("Circular prerequisite rejected", { domain, skill, prerequisiteSkill });
    return null;
  }
  return createPrerequisite({
    domain,
    skill,
    prerequisite_skill: prerequisiteSkill,
    required_level: requiredLevel ?? PROGRESSION.DEFAULT_REQUIRED_LEVEL,
    auto_discovered: autoDiscovered
  });
}
function wouldCreateCycle(domain, skill, prerequisiteSkill) {
  const visited = /* @__PURE__ */ new Set();
  const queue = [prerequisiteSkill];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === skill) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const prereqs = getPrerequisitesForSkill(domain, current);
    for (const p of prereqs) {
      queue.push(p.prerequisite_skill);
    }
  }
  return false;
}
function checkPrerequisitesMet(domain, skill) {
  const prereqs = getPrerequisitesForSkill(domain, skill);
  if (prereqs.length === 0) return { met: true, missing: [] };
  const missing = [];
  for (const prereq of prereqs) {
    const profile = getMasteryProfileByDomainSkill(domain, prereq.prerequisite_skill);
    if (!profile) {
      missing.push({ skill: prereq.prerequisite_skill, required: prereq.required_level, current: null });
      continue;
    }
    const currentOrder = MASTERY_LEVEL_ORDER[profile.level];
    const requiredOrder = MASTERY_LEVEL_ORDER[prereq.required_level];
    if (currentOrder < requiredOrder) {
      missing.push({ skill: prereq.prerequisite_skill, required: prereq.required_level, current: profile.level });
    }
  }
  return { met: missing.length === 0, missing };
}
function computeZPD(domain) {
  const profiles = getMasteryProfilesByDomain(domain);
  const currentSkills = profiles.map((p) => ({
    skill: p.skill,
    level: p.level
  }));
  const masteryMap = new Map(profiles.map((p) => [p.skill, p]));
  const allPrereqs = getPrerequisitesByDomain(domain);
  const paths = getLearningPathsByDomain(domain);
  const nextSkills = [];
  const stretchSkills = [];
  const handledSkills = /* @__PURE__ */ new Set();
  for (const lp of paths) {
    const sortedSteps = [...lp.steps].sort((a, b) => a.order_index - b.order_index);
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i];
      const existing = masteryMap.get(step.skill);
      const requiredOrder = MASTERY_LEVEL_ORDER[step.required_level];
      const currentOrder = existing ? MASTERY_LEVEL_ORDER[existing.level] : -1;
      if (currentOrder >= requiredOrder) continue;
      const prevStepsMastered = sortedSteps.slice(0, i).every((prev) => {
        const p = masteryMap.get(prev.skill);
        return p && MASTERY_LEVEL_ORDER[p.level] >= MASTERY_LEVEL_ORDER[prev.required_level];
      });
      if (prevStepsMastered && !handledSkills.has(step.skill)) {
        nextSkills.push({
          skill: step.skill,
          current_level: existing?.level ?? null,
          target_level: step.required_level,
          prerequisites_met: true,
          reason: `Next in path "${lp.name}" (step ${i + 1}/${sortedSteps.length})`
        });
        handledSkills.add(step.skill);
      } else if (!prevStepsMastered && !handledSkills.has(step.skill)) {
        const blocker = sortedSteps.slice(0, i).find((prev) => {
          const p = masteryMap.get(prev.skill);
          return !p || MASTERY_LEVEL_ORDER[p.level] < MASTERY_LEVEL_ORDER[prev.required_level];
        });
        if (blocker) {
          stretchSkills.push({
            skill: step.skill,
            current_level: existing?.level ?? null,
            target_level: step.required_level,
            prerequisites_met: false,
            reason: `Blocked by "${blocker.skill}" in path "${lp.name}"`
          });
          handledSkills.add(step.skill);
        }
      }
      if (nextSkills.length >= PROGRESSION.MAX_ZPD_NEXT) break;
    }
  }
  const prereqTargetSkills = new Set(allPrereqs.map((p) => p.skill));
  for (const targetSkill of prereqTargetSkills) {
    if (handledSkills.has(targetSkill)) continue;
    const existing = masteryMap.get(targetSkill);
    if (existing && MASTERY_LEVEL_ORDER[existing.level] >= MASTERY_LEVEL_ORDER["competent"]) {
      continue;
    }
    const prereqCheck = checkPrerequisitesMet(domain, targetSkill);
    if (prereqCheck.met) {
      nextSkills.push({
        skill: targetSkill,
        current_level: existing?.level ?? null,
        target_level: existing ? getNextLevel(existing.level) : "advanced_beginner",
        prerequisites_met: true,
        reason: existing ? `Ready to advance from ${existing.level}` : "Prerequisites met, ready to learn"
      });
      handledSkills.add(targetSkill);
    } else if (prereqCheck.missing.length === 1) {
      const miss = prereqCheck.missing[0];
      stretchSkills.push({
        skill: targetSkill,
        current_level: existing?.level ?? null,
        target_level: existing ? getNextLevel(existing.level) : "advanced_beginner",
        prerequisites_met: false,
        reason: `Needs ${miss.skill} at ${miss.required} (currently ${miss.current ?? "unlearned"})`
      });
      handledSkills.add(targetSkill);
    }
  }
  if (nextSkills.length === 0 && stretchSkills.length === 0 && profiles.length > 0) {
    const lowSkills = profiles.filter((p) => MASTERY_LEVEL_ORDER[p.level] < MASTERY_LEVEL_ORDER["competent"]).sort((a, b) => b.success_rate - a.success_rate);
    for (const p of lowSkills.slice(0, PROGRESSION.MAX_INFERRED_SUGGESTIONS)) {
      nextSkills.push({
        skill: p.skill,
        current_level: p.level,
        target_level: getNextLevel(p.level),
        prerequisites_met: true,
        reason: `Advance from ${p.level} (${Math.round(p.success_rate * 100)}% success rate)`
      });
    }
  }
  return {
    domain,
    current_skills: currentSkills,
    next_skills: nextSkills.slice(0, PROGRESSION.MAX_ZPD_NEXT),
    stretch_skills: stretchSkills.slice(0, PROGRESSION.MAX_ZPD_STRETCH)
  };
}
function getNextLevel(current) {
  switch (current) {
    case "novice":
      return "advanced_beginner";
    case "advanced_beginner":
      return "competent";
    case "competent":
      return "proficient";
    case "proficient":
      return "expert";
    case "expert":
      return "expert";
  }
}
function refreshZPD(domain) {
  if (!PROGRESSION.REFRESH_ZPD_ON_LEVEL_CHANGE) return;
  const zpd = computeZPD(domain);
  const profiles = getMasteryProfilesByDomain(domain);
  for (const profile of profiles) {
    const nextForProfile = zpd.next_skills.filter((n) => n.skill !== profile.skill).map((n) => n.skill).slice(0, MASTERY.MAX_ZPD_ITEMS);
    const currentZpd = profile.zone_of_proximal.sort().join(",");
    const newZpd = nextForProfile.sort().join(",");
    if (currentZpd !== newZpd) {
      updateMasteryProfile(profile.id, { zone_of_proximal: nextForProfile });
    }
  }
}
function classifyError(errorContent, domain) {
  const profiles = getMasteryProfilesByDomain(domain);
  if (profiles.length === 0) {
    return {
      difficulty: "above_mastery",
      domain,
      skill: null,
      mastery_level: "novice",
      signal: "No mastery data in this domain \u2014 everything is a learning opportunity"
    };
  }
  let bestMatch = null;
  for (const profile of profiles) {
    const score = keywordSimilarity(errorContent, profile.skill);
    if (score >= PROGRESSION.ERROR_SKILL_MATCH_THRESHOLD) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { profile, score };
      }
    }
  }
  const effectiveLevel = getEffectiveDomainLevel(profiles);
  if (!bestMatch) {
    const effectiveOrder = MASTERY_LEVEL_ORDER[effectiveLevel];
    if (effectiveOrder >= MASTERY_LEVEL_ORDER["competent"]) {
      return {
        difficulty: "above_mastery",
        domain,
        skill: null,
        mastery_level: effectiveLevel,
        signal: `Error in uncharted skill area (domain mastery: ${effectiveLevel})`
      };
    }
    return {
      difficulty: "at_mastery",
      domain,
      skill: null,
      mastery_level: effectiveLevel,
      signal: `Error at current learning edge (domain mastery: ${effectiveLevel})`
    };
  }
  const matchedProfile = bestMatch.profile;
  const levelOrder = MASTERY_LEVEL_ORDER[matchedProfile.level];
  if (levelOrder >= MASTERY_LEVEL_ORDER["competent"]) {
    return {
      difficulty: "below_mastery",
      domain,
      skill: matchedProfile.skill,
      mastery_level: matchedProfile.level,
      signal: `Unexpected error in mastered skill "${matchedProfile.skill}" (${matchedProfile.level}) \u2014 regression signal`
    };
  }
  if (levelOrder >= MASTERY_LEVEL_ORDER["advanced_beginner"]) {
    return {
      difficulty: "at_mastery",
      domain,
      skill: matchedProfile.skill,
      mastery_level: matchedProfile.level,
      signal: `Error at learning edge in "${matchedProfile.skill}" (${matchedProfile.level}) \u2014 expected difficulty`
    };
  }
  return {
    difficulty: "above_mastery",
    domain,
    skill: matchedProfile.skill,
    mastery_level: matchedProfile.level,
    signal: `Error in novice skill "${matchedProfile.skill}" \u2014 learning opportunity`
  };
}
function inferPrerequisites(domain) {
  const profiles = getMasteryProfilesByDomain(domain);
  if (profiles.length < PROGRESSION.MIN_PROFILES_FOR_AUTO_PATH) return [];
  const created = [];
  const sorted = [...profiles].sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  );
  for (let i = 1; i < sorted.length; i++) {
    const skill = sorted[i];
    for (let j = 0; j < i; j++) {
      const earlier = sorted[j];
      const similarity = keywordSimilarity(skill.skill, earlier.skill);
      if (similarity >= PROGRESSION.SKILL_SIMILARITY_THRESHOLD) {
        if (MASTERY_LEVEL_ORDER[earlier.level] > MASTERY_LEVEL_ORDER[skill.level]) {
          const prereq = addSkillPrerequisite(
            domain,
            skill.skill,
            earlier.skill,
            PROGRESSION.DEFAULT_REQUIRED_LEVEL,
            true
            // auto-discovered
          );
          if (prereq) created.push(prereq);
        }
      }
    }
  }
  return created;
}
function buildLearningPathFromPrereqs(domain, pathName) {
  const prereqs = getPrerequisitesByDomain(domain);
  if (prereqs.length === 0) return null;
  const graph = /* @__PURE__ */ new Map();
  const inDegree = /* @__PURE__ */ new Map();
  const allSkills = /* @__PURE__ */ new Set();
  for (const p of prereqs) {
    allSkills.add(p.skill);
    allSkills.add(p.prerequisite_skill);
    if (!graph.has(p.prerequisite_skill)) graph.set(p.prerequisite_skill, /* @__PURE__ */ new Set());
    graph.get(p.prerequisite_skill).add(p.skill);
    inDegree.set(p.skill, (inDegree.get(p.skill) ?? 0) + 1);
    if (!inDegree.has(p.prerequisite_skill)) inDegree.set(p.prerequisite_skill, 0);
  }
  const queue = [];
  for (const skill of allSkills) {
    if ((inDegree.get(skill) ?? 0) === 0) queue.push(skill);
  }
  const ordered = [];
  while (queue.length > 0) {
    const current = queue.shift();
    ordered.push(current);
    const dependents = graph.get(current);
    if (dependents) {
      for (const dep of dependents) {
        const newDeg = (inDegree.get(dep) ?? 1) - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) queue.push(dep);
      }
    }
  }
  if (ordered.length !== allSkills.size) {
    logger4.warn("Cycle detected in prerequisites during path building", { domain });
    return null;
  }
  const steps = ordered.slice(0, PROGRESSION.MAX_PATH_LENGTH).map((skill, index) => ({
    skill,
    order_index: index,
    description: `Learn ${skill}`,
    required_level: PROGRESSION.DEFAULT_REQUIRED_LEVEL
  }));
  return createLearningPath({
    domain,
    name: pathName ?? `${domain} learning path`,
    steps
  });
}
function formatZPDInjection(domain) {
  if (!domain) return null;
  const zpd = computeZPD(domain);
  if (zpd.next_skills.length === 0 && zpd.stretch_skills.length === 0) return null;
  const parts = [];
  if (zpd.next_skills.length > 0) {
    const items = zpd.next_skills.slice(0, PROGRESSION.MAX_ZPD_INJECTION_ITEMS).map((s) => `${s.skill}(${s.current_level ?? "new"}\u2192${s.target_level})`);
    parts.push(`ready to learn: ${items.join(", ")}`);
  }
  if (zpd.stretch_skills.length > 0) {
    const items = zpd.stretch_skills.slice(0, 2).map((s) => s.skill);
    parts.push(`upcoming: ${items.join(", ")}`);
  }
  return parts.length > 0 ? `ZPD: ${parts.join(" | ")}` : null;
}
function recordProgressionOutcome(domain, skill, outcome, detail = "") {
  const result = recordMasteryOutcome(domain, skill, outcome, detail);
  let zpdRefreshed = false;
  if (result.level_changed) {
    refreshZPD(domain);
    zpdRefreshed = true;
  }
  return { ...result, zpd_refreshed: zpdRefreshed };
}
function recordDomainMasteryOutcome(domain, outcome, eventType = "general") {
  if (!domain) return { level_changed: false };
  const skill = `${domain}/${eventType}`;
  const result = recordMasteryOutcome(domain, skill, outcome, eventType);
  if (result.level_changed) {
    refreshZPD(domain);
  }
  return { level_changed: result.level_changed };
}

// src/engines/embedding.ts
var logger5 = createLogger("embedding");
function porterStem(word) {
  if (word.length <= 2) return word;
  let stem = word.toLowerCase();
  if (stem.endsWith("sses")) stem = stem.slice(0, -2);
  else if (stem.endsWith("ies") && stem.length > 4) stem = stem.slice(0, -2);
  else if (stem.endsWith("ss")) {
  } else if (stem.endsWith("s") && stem.length > 3) stem = stem.slice(0, -1);
  const m1b = stem.match(/^(.+?)(ed|ing)$/);
  if (m1b) {
    const base = m1b[1];
    if (/[aeiou]/.test(base) && base.length > 2) {
      stem = base;
      if (stem.endsWith("at") || stem.endsWith("bl") || stem.endsWith("iz")) {
        stem += "e";
      } else if (/([^aeioulszr])\1$/.test(stem)) {
        stem = stem.slice(0, -1);
      }
    }
  }
  if (stem.endsWith("y") && stem.length > 2 && !/[aeiou]/.test(stem[stem.length - 2])) {
    stem = stem.slice(0, -1) + "i";
  }
  const step2Map = [
    ["ational", "ate"],
    ["tional", "tion"],
    ["enci", "ence"],
    ["anci", "ance"],
    ["izer", "ize"],
    ["ation", "ate"],
    ["ator", "ate"],
    ["alism", "al"],
    ["iveness", "ive"],
    ["fulness", "ful"],
    ["ousness", "ous"],
    ["aliti", "al"],
    ["iviti", "ive"],
    ["biliti", "ble"],
    ["alli", "al"],
    ["entli", "ent"],
    ["eli", "e"],
    ["ousli", "ous"]
  ];
  for (const [suffix, replacement] of step2Map) {
    if (stem.endsWith(suffix) && stem.length - suffix.length > 2) {
      stem = stem.slice(0, -suffix.length) + replacement;
      break;
    }
  }
  const step3Map = [
    ["icate", "ic"],
    ["ative", ""],
    ["alize", "al"],
    ["iciti", "ic"],
    ["ical", "ic"],
    ["ful", ""],
    ["ness", ""]
  ];
  for (const [suffix, replacement] of step3Map) {
    if (stem.endsWith(suffix) && stem.length - suffix.length > 2) {
      stem = stem.slice(0, -suffix.length) + replacement;
      break;
    }
  }
  if (stem.endsWith("e") && stem.length > 4) {
    stem = stem.slice(0, -1);
  }
  return stem;
}
var SYNONYM_TABLE = /* @__PURE__ */ new Map([
  // Authentication
  ["auth", ["authent", "login", "signin", "sso"]],
  ["login", ["auth", "authent", "signin"]],
  ["signin", ["auth", "login", "authent"]],
  ["authent", ["auth", "login", "signin", "sso"]],
  ["password", ["passwd", "credential", "secret"]],
  ["token", ["jwt", "bearer", "session"]],
  ["credential", ["password", "passwd", "secret"]],
  // Errors
  ["error", ["except", "fault", "fail", "bug"]],
  ["except", ["error", "throw", "rais"]],
  ["bug", ["defect", "error", "issu"]],
  ["fail", ["error", "crash", "abort"]],
  ["crash", ["fail", "error", "panic"]],
  ["issu", ["bug", "defect", "problem"]],
  // Database
  ["databas", ["db", "sql", "storag"]],
  ["db", ["databas", "sql", "storag"]],
  ["queri", ["sql", "select", "fetch"]],
  ["sql", ["queri", "databas", "db"]],
  ["migrat", ["upgrad", "schema", "alter"]],
  ["index", ["idx", "search", "lookup"]],
  // API
  ["api", ["endpoint", "rout", "rest", "rpc"]],
  ["endpoint", ["api", "rout", "url"]],
  ["rout", ["api", "endpoint", "path"]],
  ["rest", ["api", "http", "crud"]],
  ["webhook", ["callback", "hook", "event"]],
  // Frontend
  ["frontend", ["client", "ui", "browser", "view"]],
  ["compon", ["widget", "element", "modul"]],
  ["render", ["display", "draw", "paint"]],
  ["css", ["style", "scss", "sass"]],
  ["style", ["css", "theme", "design"]],
  ["templat", ["view", "layout", "markup"]],
  // Backend
  ["backend", ["server", "api"]],
  ["server", ["backend", "host", "daemon"]],
  ["cach", ["memoiz", "buffer", "store"]],
  ["perform", ["speed", "optim", "fast"]],
  // Version control
  ["commit", ["push", "revis"]],
  ["branch", ["fork", "checkout"]],
  ["merg", ["rebas", "pull", "integr"]],
  // Testing
  ["test", ["spec", "assert", "verifi"]],
  ["assert", ["expect", "test", "verifi"]],
  ["mock", ["stub", "fake", "spy"]],
  // Configuration
  ["config", ["set", "option", "param"]],
  ["environ", ["env", "config", "context"]],
  ["deploy", ["ship", "releas", "publish"]],
  // Security
  ["secur", ["auth", "permiss", "access"]],
  ["permiss", ["access", "role", "author"]],
  ["encrypt", ["hash", "cipher", "secur"]],
  // ORM/Models
  ["model", ["schema", "entiti", "class"]],
  ["field", ["column", "attrib", "properti"]],
  ["relat", ["foreign", "join", "link"]],
  ["inherit", ["extend", "overrid", "parent"]],
  // Types/Code
  ["function", ["method", "func", "callabl"]],
  ["async", ["await", "promis", "concurr"]],
  ["import", ["requir", "includ", "depend"]],
  ["deprec", ["remov", "obsol", "legaci"]],
  ["refactor", ["restructur", "clean", "rewrit"]],
  ["debug", ["troubleshoot", "fix", "diagnos"]]
]);
var BIDIRECTIONAL_SYNONYMS = (() => {
  const bimap = /* @__PURE__ */ new Map();
  for (const [key, synonyms] of SYNONYM_TABLE) {
    if (!bimap.has(key)) bimap.set(key, /* @__PURE__ */ new Set());
    for (const syn of synonyms) {
      bimap.get(key).add(syn);
      if (!bimap.has(syn)) bimap.set(syn, /* @__PURE__ */ new Set());
      bimap.get(syn).add(key);
    }
  }
  return bimap;
})();
function expandSynonyms(stemmedTerm) {
  const synonyms = BIDIRECTIONAL_SYNONYMS.get(stemmedTerm);
  if (!synonyms) return [stemmedTerm];
  return [stemmedTerm, ...Array.from(synonyms).slice(0, EMBEDDING.MAX_SYNONYM_EXPANSION)];
}
function fnv1aHash(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function hashToBucket(term, dimensions) {
  const h = fnv1aHash(term);
  const index = h % dimensions;
  const sign = h & 2147483648 ? -1 : 1;
  return { index, sign };
}
var _idfCache = /* @__PURE__ */ new Map();
var _totalDocuments = 0;
var _idfVersion = 0;
function refreshIdfCache() {
  try {
    _idfCache = loadVocabulary();
    const countStr = getTfidfMeta("total_documents");
    _totalDocuments = countStr ? parseInt(countStr, 10) : 0;
    _idfVersion++;
    logger5.info("IDF cache refreshed", {
      terms: _idfCache.size,
      documents: _totalDocuments,
      version: _idfVersion
    });
  } catch {
    logger5.debug("IDF cache empty (first run)");
  }
}
function getIdf(stemmedTerm) {
  const cached = _idfCache.get(stemmedTerm);
  if (cached !== void 0) return cached;
  return Math.log((_totalDocuments + 1) / 1) + 1;
}
function generateBigrams(stemmedKeywords) {
  if (stemmedKeywords.length < EMBEDDING.BIGRAM_MIN_KEYWORDS) return [];
  const bigrams = [];
  for (let i = 0; i < stemmedKeywords.length - 1; i++) {
    bigrams.push(`${stemmedKeywords[i]}_${stemmedKeywords[i + 1]}`);
  }
  return bigrams;
}
function tokenize(text) {
  const keywords = extractKeywords(text);
  const tokens = [];
  const stemmedOriginals = [];
  for (const kw of keywords) {
    const stemmed = porterStem(kw);
    stemmedOriginals.push(stemmed);
    const expanded = expandSynonyms(stemmed);
    tokens.push(expanded[0]);
    for (let i = 1; i < expanded.length; i++) {
      tokens.push(`~${expanded[i]}`);
    }
  }
  const bigrams = generateBigrams(stemmedOriginals);
  for (const bg of bigrams) {
    tokens.push(bg);
  }
  return tokens;
}
function computeTf(tokens) {
  const synonymTerms = /* @__PURE__ */ new Set();
  const counts = /* @__PURE__ */ new Map();
  for (const t of tokens) {
    const isSynonym = t.startsWith("~");
    const clean = isSynonym ? t.slice(1) : t;
    if (isSynonym) synonymTerms.add(clean);
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  const tf = /* @__PURE__ */ new Map();
  for (const [term, count] of counts) {
    const baseTf = 1 + Math.log(count);
    const weight = term.includes("_") ? EMBEDDING.BIGRAM_WEIGHT : synonymTerms.has(term) ? EMBEDDING.SYNONYM_WEIGHT : 1;
    tf.set(term, baseTf * weight);
  }
  return tf;
}
function generateEmbedding(text) {
  const dimensions = EMBEDDING.VECTOR_DIMENSIONS;
  const vector = new Float32Array(dimensions);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vector;
  const tf = computeTf(tokens);
  for (const [term, tfValue] of tf) {
    const idf = getIdf(term);
    const tfidf = tfValue * idf;
    const { index, sign } = hashToBucket(term, dimensions);
    vector[index] += sign * tfidf;
  }
  l2Normalize(vector);
  return vector;
}
function l2Normalize(vector) {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }
  return vector;
}
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
function recomputeIdf() {
  const allContent = getAllMemoryContent();
  const N = allContent.length;
  if (N === 0) return 0;
  const df = /* @__PURE__ */ new Map();
  for (const { content } of allContent) {
    const uniqueTerms = new Set(tokenize(content).map((t) => t.startsWith("~") ? t.slice(1) : t));
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const vocabEntries = [];
  for (const [term, docFreq] of df) {
    const idf = Math.log((N + 1) / (docFreq + 1)) + 1;
    vocabEntries.push({ term, df: docFreq, idf });
  }
  upsertVocabulary(vocabEntries, timestamp);
  setTfidfMeta("total_documents", String(N));
  setTfidfMeta("last_recompute", timestamp);
  refreshIdfCache();
  logger5.info("IDF recomputed", { terms: vocabEntries.length, documents: N });
  return vocabEntries.length;
}
function embeddingToBuffer(embedding) {
  return Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
}
function bufferToEmbedding(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) view[i] = buf[i];
  return new Float32Array(ab);
}

// src/engines/attention.ts
var logger6 = createLogger("attention");
var _context = {
  current_task: null,
  focus_domain: null,
  focus_files: [],
  attention_level: 0.5,
  // Start at neutral attention
  context_switches: 0,
  last_updated: now()
};
function updateAttention(event) {
  const previousDomain = _context.focus_domain;
  if (event.domain && previousDomain && event.domain !== previousDomain) {
    _context.context_switches++;
    _context.attention_level = Math.max(0.1, _context.attention_level - ATTENTION.DECAY_RATE * 2);
    logger6.debug("Context switch detected", {
      from: previousDomain,
      to: event.domain,
      switches: _context.context_switches
    });
  }
  if (event.domain) {
    _context.focus_domain = event.domain;
  }
  if (event.files.length > 0) {
    _context.focus_files = event.files;
  }
  if (event.task) {
    _context.current_task = event.task;
  }
  if (event.type === "error") {
    _context.attention_level = Math.min(1, _context.attention_level + ATTENTION.ERROR_SPIKE);
    logger6.debug("Attention spike on error", { level: _context.attention_level });
  } else {
    _context.attention_level = Math.max(0.1, _context.attention_level - ATTENTION.DECAY_RATE * 0.5);
  }
  _context.last_updated = now();
  return { ..._context };
}
function getSignificanceModifier(event) {
  if (!_context.focus_domain) return 1;
  const domainMatch = event.domains.includes(_context.focus_domain);
  const fileMatch = event.files.length > 0 && _context.focus_files.length > 0 && event.files.some((f) => _context.focus_files.includes(f));
  if (domainMatch || fileMatch) {
    return ATTENTION.FOCUS_BOOST;
  }
  const penalty = ATTENTION.DEFOCUS_PENALTY + (1 - ATTENTION.DEFOCUS_PENALTY) * (1 - _context.attention_level);
  return penalty;
}
function getRetrievalAdjustment() {
  if (_context.attention_level > 0.7) {
    return {
      hop_adjustment: ATTENTION.FOCUSED_MAX_HOPS,
      // -1 hop
      threshold_adjustment: ATTENTION.FOCUSED_THRESHOLD_BOOST
      // +0.05 threshold
    };
  }
  if (_context.attention_level < 0.3) {
    return {
      hop_adjustment: ATTENTION.EXPLORATORY_HOP_BONUS,
      // +1 hop
      threshold_adjustment: -ATTENTION.FOCUSED_THRESHOLD_BOOST
      // -0.05 threshold
    };
  }
  return { hop_adjustment: 0, threshold_adjustment: 0 };
}
function resetAttention() {
  _context = {
    current_task: null,
    focus_domain: null,
    focus_files: [],
    attention_level: 0.5,
    context_switches: 0,
    last_updated: now()
  };
  logger6.debug("Attention state reset");
}

// src/engines/working-memory.ts
var logger7 = createLogger("working-memory");
var _buffer = [];
function addToWorkingMemory(memoryId, priority) {
  const existing = _buffer.find((item2) => item2.memory_id === memoryId);
  if (existing) {
    existing.activation = Math.min(existing.activation + WORKING_MEMORY.REHEARSAL_BOOST, 1);
    existing.access_count++;
    existing.added_at = now();
    logger7.debug("Rehearsed in working memory", { memory_id: memoryId, activation: existing.activation });
    return;
  }
  const mem = getMemory(memoryId);
  const itemPriority = priority ?? (mem?.type === "antipattern" ? WORKING_MEMORY.PRIORITY_ANTIPATTERN : WORKING_MEMORY.PRIORITY_DEFAULT);
  const item = {
    memory_id: memoryId,
    activation: 1,
    added_at: now(),
    access_count: 1,
    priority: itemPriority
  };
  _buffer.push(item);
  if (_buffer.length > WORKING_MEMORY.MAX_CAPACITY) {
    evictLowestPriority();
  }
  logger7.debug("Added to working memory", {
    memory_id: memoryId,
    priority: itemPriority,
    buffer_size: _buffer.length
  });
}
function queryWorkingMemory(query) {
  if (_buffer.length === 0) return [];
  const results = [];
  const queryLower = query.toLowerCase();
  const queryWords = new Set(queryLower.split(/\s+/).filter((w) => w.length > 2));
  for (const item of _buffer) {
    const mem = getMemory(item.memory_id);
    if (!mem) continue;
    const contentLower = mem.content.toLowerCase();
    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matches++;
    }
    if (matches > 0 || queryWords.size === 0) {
      const relevance = queryWords.size > 0 ? matches / queryWords.size : 0.5;
      results.push({
        memory: mem,
        activation: item.activation * Math.max(relevance, 0.3),
        source: "working_memory",
        hops: 0,
        somatic_marker: false
      });
      item.access_count++;
      item.activation = Math.min(item.activation + WORKING_MEMORY.REHEARSAL_BOOST * 0.5, 1);
    }
  }
  return results;
}
function getWorkingMemorySize() {
  return _buffer.length;
}
function flushWorkingMemory() {
  let flushed = 0;
  let boosted = 0;
  for (const item of _buffer) {
    if (item.access_count > 1) {
      const mem = getMemory(item.memory_id);
      if (mem) {
        const boost = WORKING_MEMORY.REHEARSAL_BOOST * Math.min(item.access_count, 5);
        const newStrength = Math.min(mem.encoding_strength + boost, 1);
        updateMemory(item.memory_id, {
          encoding_strength: newStrength,
          access_count: mem.access_count + item.access_count,
          last_accessed: now()
        });
        boosted++;
      }
    }
    flushed++;
  }
  logger7.info("Flushed working memory", { flushed, boosted });
  _buffer = [];
  return { flushed, boosted };
}
function clearWorkingMemory() {
  const size = _buffer.length;
  _buffer = [];
  logger7.debug("Cleared working memory", { items_cleared: size });
}
var _primedNodes = /* @__PURE__ */ new Map();
function primeNeighbors(memoryIds) {
  let primed = 0;
  const currentTime = now();
  cleanExpiredPrimes();
  for (const memId of memoryIds) {
    if (_primedNodes.size >= PRIMING.MAX_PRIMED) break;
    const neighbors = getNeighborhood(memId);
    const sorted = neighbors.filter((n) => n.strength >= PRIMING.MIN_CONNECTION_STRENGTH).sort((a, b) => b.strength - a.strength).slice(0, PRIMING.MAX_NEIGHBORS_PER_MEMORY);
    for (const neighbor of sorted) {
      if (_primedNodes.size >= PRIMING.MAX_PRIMED) break;
      const existing = _primedNodes.get(neighbor.id);
      if (existing) {
        existing.primed_at = currentTime;
        existing.activation = Math.max(existing.activation, PRIMING.BASE_ACTIVATION * neighbor.strength);
        continue;
      }
      if (_buffer.some((item) => item.memory_id === neighbor.id)) continue;
      _primedNodes.set(neighbor.id, {
        memory_id: neighbor.id,
        activation: PRIMING.BASE_ACTIVATION * neighbor.strength,
        primed_at: currentTime
      });
      primed++;
    }
  }
  if (primed > 0) {
    logger7.debug("Primed neighbors", { newly_primed: primed, total_primed: _primedNodes.size });
  }
  return primed;
}
function getPrimedBoost(memoryId) {
  const primed = _primedNodes.get(memoryId);
  if (!primed) return 0;
  const ageMinutes = (Date.now() - new Date(primed.primed_at).getTime()) / (1e3 * 60);
  const decayFactor = Math.pow(0.5, ageMinutes / PRIMING.HALF_LIFE_MINUTES);
  const boost = PRIMING.BOOST * decayFactor;
  if (boost < PRIMING.DECAY_FLOOR) {
    _primedNodes.delete(memoryId);
    return 0;
  }
  return boost;
}
function getPrimedNodeCount() {
  return _primedNodes.size;
}
function getPrimedNodeIds() {
  return Array.from(_primedNodes.keys());
}
function clearPrimedNodes() {
  const count = _primedNodes.size;
  _primedNodes = /* @__PURE__ */ new Map();
  if (count > 0) {
    logger7.debug("Cleared primed nodes", { count });
  }
}
function cleanExpiredPrimes() {
  const now3 = Date.now();
  for (const [id, primed] of _primedNodes) {
    const ageMinutes = (now3 - new Date(primed.primed_at).getTime()) / (1e3 * 60);
    const decayFactor = Math.pow(0.5, ageMinutes / PRIMING.HALF_LIFE_MINUTES);
    if (PRIMING.BOOST * decayFactor < PRIMING.DECAY_FLOOR) {
      _primedNodes.delete(id);
    }
  }
}
function evictLowestPriority() {
  if (_buffer.length === 0) return;
  const currentTime = new Date(now()).getTime();
  let worstIdx = 0;
  let worstScore = Infinity;
  for (let i = 0; i < _buffer.length; i++) {
    const item = _buffer[i];
    const ageMinutes = (currentTime - new Date(item.added_at).getTime()) / (1e3 * 60);
    const stalenessPenalty = ageMinutes > WORKING_MEMORY.STALENESS_MINUTES ? 0.5 : 1;
    const score = item.priority * item.activation * stalenessPenalty;
    if (score < worstScore) {
      worstScore = score;
      worstIdx = i;
    }
  }
  const evicted = _buffer.splice(worstIdx, 1)[0];
  logger7.debug("Evicted from working memory", {
    memory_id: evicted.memory_id,
    priority: evicted.priority,
    activation: evicted.activation
  });
}

// src/engines/retrieval.ts
var logger8 = createLogger("retrieval");
function isRecallNoise(content, type, tags) {
  if (content.startsWith("User intent:")) return true;
  if (content.startsWith("User instruction:")) return true;
  if (content.startsWith("Session progress:")) return true;
  if (content.startsWith("Reasoning insight:")) return true;
  if (type !== "episodic") return false;
  if (content.startsWith("Investigated:")) return true;
  if (content.startsWith("Refined hypothesis")) return true;
  if (content.startsWith("Pivoted hypothesis")) return true;
  if (content.startsWith("Narrowed search:")) return true;
  if (content.startsWith("debug chain")) return true;
  if (content.startsWith("Command:")) return true;
  if (content.startsWith("Delegated:")) return true;
  if (content.startsWith("Decision: Delegated:")) return true;
  if (content.startsWith("File ") && content.includes("contains") && content.includes("definitions")) return true;
  if (content.startsWith("[ENGRAM UNDERSTANDING]")) return true;
  if (content.startsWith("Pre-compaction session summary")) return true;
  if (content.startsWith("Claude is waiting")) return true;
  if (/^Error '.{5,60}' resolved\./.test(content)) return true;
  if (content.startsWith("Subagent") && content.includes("completed")) {
    if (content.includes("Discovery:") || content.includes("Conclusion:") || content.includes("Lesson:")) return false;
    if (tags && (tags.includes("has_lesson") || tags.includes("has_cognition"))) return false;
    return true;
  }
  return false;
}
var _preWarmedNodes = /* @__PURE__ */ new Map();
function preWarmActivation(context) {
  _preWarmedNodes = /* @__PURE__ */ new Map();
  const result = {
    memories_preloaded: 0,
    antipatterns_preloaded: 0,
    domains_covered: []
  };
  if (!context.framework) {
    return result;
  }
  const domainsCovered = /* @__PURE__ */ new Set();
  const antipatterns = getAntipatterns(context.framework);
  for (const ap of antipatterns) {
    _preWarmedNodes.set(ap.id, ANTICIPATORY.PRELOAD_ACTIVATION);
    result.antipatterns_preloaded++;
    for (const d of ap.domains) {
      domainsCovered.add(d);
    }
  }
  const domainMemories = getMemoriesByDomain(context.framework, ANTICIPATORY.MAX_PRELOAD);
  for (const mem of domainMemories) {
    if (mem.confidence >= ANTICIPATORY.MIN_PRELOAD_CONFIDENCE && !_preWarmedNodes.has(mem.id)) {
      _preWarmedNodes.set(mem.id, ANTICIPATORY.DOMAIN_BOOST);
      result.memories_preloaded++;
      for (const d of mem.domains) {
        domainsCovered.add(d);
      }
      if (_preWarmedNodes.size >= ANTICIPATORY.MAX_PRELOAD) break;
    }
  }
  result.domains_covered = Array.from(domainsCovered);
  logger8.info("Pre-warmed activation", {
    framework: context.framework,
    antipatterns: result.antipatterns_preloaded,
    memories: result.memories_preloaded,
    total_nodes: _preWarmedNodes.size
  });
  return result;
}
function clearPreWarmedNodes() {
  _preWarmedNodes = /* @__PURE__ */ new Map();
}
function recall(query, config) {
  const tokenBudget = query.max_tokens || config.default_token_budget;
  const modifier = getRetrievalModifier();
  let effectiveConfig = modifier !== 1 ? {
    ...config,
    max_seeds: Math.ceil(config.max_seeds * modifier),
    max_hops: Math.ceil(config.max_hops * Math.min(modifier, 1.5))
  } : { ...config };
  const attentionAdj = getRetrievalAdjustment();
  if (attentionAdj.hop_adjustment !== 0 || attentionAdj.threshold_adjustment !== 0) {
    effectiveConfig = {
      ...effectiveConfig,
      max_hops: Math.max(1, effectiveConfig.max_hops + attentionAdj.hop_adjustment),
      activation_threshold: Math.max(0.01, effectiveConfig.activation_threshold + attentionAdj.threshold_adjustment)
    };
  }
  const workingMemoryResults = queryWorkingMemory(query.query);
  const seeds = seedActivation(query, effectiveConfig);
  if (seeds.length === 0 && workingMemoryResults.length === 0) {
    return {
      memories: [],
      total_tokens: 0,
      query_seeds: [],
      activation_stats: {
        seeds_found: 0,
        nodes_activated: 0,
        nodes_returned: 0,
        max_hops_used: 0
      }
    };
  }
  const activated = spreadActivation(seeds, effectiveConfig, query.context);
  const inhibited = applyLateralInhibition(activated);
  for (const wm of workingMemoryResults) {
    if (!inhibited.has(wm.memory.id)) {
      inhibited.set(wm.memory.id, wm);
    }
  }
  const selected = applyContextBudget(inhibited, tokenBudget);
  const result = buildPayload(selected, seeds, effectiveConfig);
  for (const act of result.memories.slice(0, 5)) {
    addToWorkingMemory(act.memory.id);
  }
  primeNeighbors(result.memories.slice(0, 5).map((m) => m.memory.id));
  return result;
}
function lightweightRecall(query, domain, config, version = null) {
  if (!query || query.length < LIGHTWEIGHT_RECALL.MIN_PROMPT_LENGTH) return [];
  const context = domain || version ? {
    project: null,
    framework: domain,
    version,
    task_type: null,
    current_error: null,
    current_files: []
  } : null;
  const seeds = [];
  const seenIds = /* @__PURE__ */ new Set();
  try {
    const ftsResults = searchMemories(query, LIGHTWEIGHT_RECALL.MAX_SEEDS);
    for (const mem of ftsResults) {
      if (!seenIds.has(mem.id)) {
        seenIds.add(mem.id);
        seeds.push({
          memory: mem,
          activation: 1,
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
    return [];
  }
  if (seeds.length === 0) return [];
  if (context) {
    for (const seed of seeds) {
      seed.activation *= contextualBoost(seed.memory, context);
    }
  }
  const lightConfig = {
    ...config,
    max_hops: LIGHTWEIGHT_RECALL.MAX_HOPS,
    max_seeds: LIGHTWEIGHT_RECALL.MAX_SEEDS
  };
  const activated = spreadActivation(seeds, lightConfig, context);
  const selected = applyContextBudget(activated, LIGHTWEIGHT_RECALL.TOKEN_BUDGET);
  return selected.slice(0, LIGHTWEIGHT_RECALL.MAX_RESULTS);
}
function computeActivationProfile(memories) {
  if (memories.length === 0) {
    return { peak_activation: 0, mean_activation: 0, cluster_count: 0, dominant_domains: [], has_causal_chain: false };
  }
  let peak = 0;
  let sum = 0;
  const hopCounts = /* @__PURE__ */ new Set();
  const domainScores = /* @__PURE__ */ new Map();
  for (const m of memories) {
    if (m.activation > peak) peak = m.activation;
    sum += m.activation;
    hopCounts.add(m.hops);
    for (const d of m.memory.domains) {
      domainScores.set(d, (domainScores.get(d) ?? 0) + m.activation);
    }
  }
  const sortedDomains = [...domainScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d);
  const hasCausal = memories.some((m) => m.hops > 0 && m.source === "spread");
  return {
    peak_activation: peak,
    mean_activation: sum / memories.length,
    cluster_count: hopCounts.size,
    dominant_domains: sortedDomains,
    has_causal_chain: hasCausal
  };
}
function contextualRecall(query, context, config) {
  const emptyResult = {
    memories: [],
    schemas: [],
    intuitions: [],
    insights: [],
    somatic_signals: [],
    procedural: [],
    total_tokens: 0,
    confidence: null,
    scaffolding: null,
    analogies: []
  };
  if (!query || query.length < CONTEXTUAL_RECALL.MIN_PROMPT_LENGTH) return emptyResult;
  const recallContext = {
    project: context.domain ? context.project : null,
    framework: context.domain,
    version: context.version,
    task_type: context.task_type,
    current_error: context.recent_errors.length > 0 ? context.recent_errors[0] : null,
    current_files: context.current_files
  };
  const seeds = [];
  const seenIds = /* @__PURE__ */ new Set();
  try {
    const ftsResults = context.domain ? searchMemoriesByDomain(query, context.domain, CONTEXTUAL_RECALL.MAX_FTS_SEEDS, 3, context.project ?? void 0) : searchMemories(query, CONTEXTUAL_RECALL.MAX_FTS_SEEDS, context.project ?? void 0);
    for (const mem of ftsResults) {
      if (!seenIds.has(mem.id)) {
        seenIds.add(mem.id);
        seeds.push({
          memory: mem,
          activation: 1,
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
  }
  try {
    const queryEmbedding = generateEmbedding(query);
    const candidates = getEmbeddedMemories(context.domain, CONTEXTUAL_RECALL.TFIDF_SCAN_LIMIT);
    const tfidfScored = [];
    for (const cand of candidates) {
      if (seenIds.has(cand.id)) continue;
      const candVec = bufferToEmbedding(cand.embedding);
      const score = cosineSimilarity(queryEmbedding, candVec);
      if (score >= EMBEDDING.MIN_COSINE_SIMILARITY) {
        tfidfScored.push({ id: cand.id, score });
      }
    }
    tfidfScored.sort((a, b) => b.score - a.score);
    const tfidfSlots = Math.max(RETRIEVAL.MIN_TFIDF_SLOTS, CONTEXTUAL_RECALL.MAX_FTS_SEEDS - seeds.length);
    for (const scored of tfidfScored.slice(0, tfidfSlots)) {
      const mem = getMemory(scored.id);
      if (mem) {
        seenIds.add(scored.id);
        seeds.push({
          memory: mem,
          activation: scored.score * EMBEDDING.TFIDF_SEED_ACTIVATION,
          source: "tfidf",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
    logger8.debug("Contextual recall: TF-IDF seeding skipped");
  }
  if (context.domain) {
    const antipatterns = getAntipatterns(context.domain);
    let apCount = 0;
    for (const ap of antipatterns) {
      if (apCount >= RETRIEVAL.MAX_ANTIPATTERN_SEEDS) break;
      if (context.version && ap.version && ap.version !== context.version) continue;
      const apFramework = ap.encoding_context?.framework;
      if (apFramework && apFramework !== context.domain && !ap.domains.includes("*")) continue;
      if (!seenIds.has(ap.id)) {
        seenIds.add(ap.id);
        seeds.push({
          memory: ap,
          activation: 0.9,
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
        apCount++;
      }
    }
  }
  if (seeds.length === 0) return emptyResult;
  for (const seed of seeds) {
    seed.activation *= contextualBoost(seed.memory, recallContext);
    seed.activation *= rewardModifier(seed.memory);
  }
  seeds.sort((a, b) => b.activation - a.activation);
  const cappedSeeds = seeds.slice(0, CONTEXTUAL_RECALL.MAX_FTS_SEEDS);
  const lightConfig = {
    ...config,
    max_hops: CONTEXTUAL_RECALL.MAX_HOPS,
    max_seeds: CONTEXTUAL_RECALL.MAX_FTS_SEEDS
  };
  const activated = spreadActivation(cappedSeeds, lightConfig, recallContext);
  const somatic_signals = extractSomaticMarkers(activated);
  let schemas = matchSchemas(query, context.domain);
  if (schemas.length > 0) {
    boostSchemaInstanceActivation(activated, schemas);
  }
  const selected = applyContextBudget(activated, CONTEXTUAL_RECALL.TOKEN_BUDGET);
  let memories = selected.slice(0, CONTEXTUAL_RECALL.MAX_RESULTS);
  let intuitions = surfaceSchemaIntuitions(schemas);
  const insights = surfaceCreativeInsights(query, context.domain);
  let procedural = matchProcedural(query, context.task_type, seenIds);
  let scaffolding = null;
  let analogies = [];
  try {
    scaffolding = getScaffoldingConfig(context.domain);
    memories = applyScaffolding(memories, scaffolding);
    schemas = schemas.slice(0, scaffolding.max_schemas);
    intuitions = intuitions.slice(0, scaffolding.max_schemas);
    procedural = procedural.slice(0, scaffolding.max_procedural);
    analogies = findCrossDomainAnalogies(query, scaffolding);
  } catch {
    logger8.debug("Scaffolding unavailable, continuing without mastery-aware filtering");
  }
  let totalTokens = 0;
  for (const m of memories) totalTokens += m.memory.summary_token_count || m.memory.token_count;
  for (const p of procedural) totalTokens += p.memory.summary_token_count || p.memory.token_count;
  for (const a of analogies) totalTokens += a.memory.summary_token_count || a.memory.token_count;
  let confidence = null;
  try {
    confidence = assessConfidence(memories, context.domain, context.version);
  } catch {
  }
  return { memories, schemas, intuitions, insights, somatic_signals, procedural, total_tokens: totalTokens, confidence, scaffolding, analogies };
}
function matchSchemas(query, domain) {
  try {
    const schemas = domain ? getSchemasForDomain(domain) : getAllSchemas();
    const matches = [];
    for (const schema of schemas) {
      if (schema.confidence < CONTEXTUAL_RECALL.MIN_SCHEMA_CONFIDENCE) continue;
      const schemaText = `${schema.name} ${schema.description ?? ""} ${(schema.instances ?? []).join(" ")}`;
      const relevance = keywordSimilarity(query, schemaText);
      if (relevance >= CONTEXTUAL_RECALL.SCHEMA_MATCH_THRESHOLD) {
        matches.push({ schema, relevance });
      }
    }
    matches.sort((a, b) => b.relevance - a.relevance);
    return matches.slice(0, CONTEXTUAL_RECALL.MAX_SCHEMAS);
  } catch {
    return [];
  }
}
function boostSchemaInstanceActivation(activated, schemas) {
  for (const match of schemas) {
    const boost = SCHEMA_SURFACING.INSTANCE_ACTIVATION_BOOST * match.relevance;
    for (const instanceId of match.schema.instances) {
      const existing = activated.get(instanceId);
      if (existing) {
        existing.activation = Math.min(1, existing.activation + boost);
      }
    }
  }
}
function classifyIntuitionStrength(schema) {
  if (schema.confidence >= SCHEMA_SURFACING.STRONG_CONFIDENCE || schema.status === "principle" || schema.status === "mature") {
    return "strong";
  }
  if (schema.confidence >= SCHEMA_SURFACING.MODERATE_CONFIDENCE || schema.status === "established") {
    return "moderate";
  }
  return "weak";
}
function generateSchemaDescription(schema) {
  if (schema.description) return schema.description;
  const parts = schema.name.split(":");
  const domain = parts[0] ?? "unknown";
  const keywords = (parts[1] ?? "").split("_").filter((k) => k.length > 0);
  const instanceCount = schema.instances.length;
  const domainCount = schema.domains_seen_in.length;
  if (keywords.length === 0) {
    return `Pattern in ${domain} with ${instanceCount} instances`;
  }
  const keywordPhrase = keywords.join(", ");
  const crossDomain = domainCount > 1 ? ` across ${domainCount} domains (${schema.domains_seen_in.slice(0, 3).join(", ")})` : "";
  return `Recurring pattern involving ${keywordPhrase} \u2014 seen ${instanceCount} times${crossDomain}`;
}
function generateActionableHint(schema) {
  for (const instanceId of schema.instances.slice(0, SCHEMA_SURFACING.INSTANCE_SAMPLE_COUNT)) {
    try {
      const mem = getMemory(instanceId);
      if (!mem) continue;
      if (mem.type === "antipattern" && mem.type_data && "fix" in mem.type_data) {
        const fix = mem.type_data.fix;
        if (fix) return fix.substring(0, SCHEMA_SURFACING.MAX_DESCRIPTION_LENGTH);
      }
      if (mem.type === "episodic" && mem.type_data && "lesson" in mem.type_data) {
        const lesson = mem.type_data.lesson;
        if (lesson) return lesson.substring(0, SCHEMA_SURFACING.MAX_DESCRIPTION_LENGTH);
      }
    } catch {
    }
  }
  return null;
}
function surfaceSchemaIntuitions(schemas) {
  const intuitions = [];
  for (const match of schemas) {
    const { schema, relevance } = match;
    if (schema.instances.length < SCHEMA_SURFACING.MIN_INSTANCES) continue;
    const strength = classifyIntuitionStrength(schema);
    if (strength === "weak" && relevance < SCHEMA_SURFACING.WEAK_MIN_RELEVANCE) continue;
    const description = generateSchemaDescription(schema);
    const actionableHint = generateActionableHint(schema);
    intuitions.push({
      schema,
      relevance,
      strength,
      description,
      instance_count: schema.instances.length,
      domain_count: schema.domains_seen_in.length,
      actionable_hint: actionableHint
    });
  }
  return intuitions.slice(0, SCHEMA_SURFACING.MAX_INTUITIONS);
}
function surfaceCreativeInsights(query, domain) {
  try {
    const candidates = getInsightMemories(domain, CREATIVE_INSIGHT.MAX_CANDIDATES);
    if (candidates.length === 0) return [];
    const insights = [];
    for (const mem of candidates) {
      const relevance = keywordSimilarity(query, mem.content);
      if (relevance < CREATIVE_INSIGHT.MIN_RELEVANCE) continue;
      const { sourceDomain, targetDomain } = parseInsightDomains(mem);
      insights.push({
        memory: mem,
        source_domain: sourceDomain,
        target_domain: targetDomain,
        relevance,
        description: mem.summary ?? mem.content.substring(0, 200)
      });
    }
    insights.sort((a, b) => b.relevance - a.relevance);
    return insights.slice(0, CREATIVE_INSIGHT.MAX_INSIGHTS);
  } catch {
    logger8.debug("Creative insight surfacing skipped");
    return [];
  }
}
function parseInsightDomains(mem) {
  const match = mem.content.match(/from (\S+) may apply to (\S+)/);
  if (match) {
    return {
      sourceDomain: match[1].replace(/[.,]$/, ""),
      targetDomain: match[2].replace(/[.,]$/, "")
    };
  }
  return {
    sourceDomain: mem.domains[0] ?? "unknown",
    targetDomain: mem.domains[1] ?? mem.domains[0] ?? "unknown"
  };
}
function extractSomaticMarkers(activated) {
  const signals = [];
  for (const [, act] of activated) {
    if (!isEpisodicData(act.memory.type_data)) continue;
    const content = act.memory.content;
    if (content.startsWith("Investigated:") || content.startsWith("Refined hypothesis:") || content.startsWith("Pivoted hypothesis:") || content.startsWith("Command:") || content.startsWith("Subagent") || content.startsWith("Delegated") || content.startsWith("[ENGRAM UNDERSTANDING]")) continue;
    const td = act.memory.type_data;
    if (td.emotional_weight < SOMATIC_MARKERS.MIN_EMOTIONAL_WEIGHT) continue;
    const minConf = td.outcome === "negative" ? SOMATIC_MARKERS.MIN_CONFIDENCE_NEGATIVE : SOMATIC_MARKERS.MIN_CONFIDENCE;
    if (act.memory.confidence < minConf) continue;
    if (act.activation < SOMATIC_MARKERS.MIN_ACTIVATION) continue;
    const valence = td.outcome === "negative" ? "negative" : "positive";
    const intensity = td.emotional_weight * act.memory.confidence;
    const description = generateSomaticDescription(act.memory, valence, td.lesson);
    signals.push({
      memory: act.memory,
      valence,
      intensity,
      description,
      lesson: td.lesson
    });
  }
  signals.sort((a, b) => b.intensity - a.intensity);
  return signals.slice(0, SOMATIC_MARKERS.MAX_SIGNALS);
}
function generateSomaticDescription(memory, valence, lesson) {
  const contentSnippet = (memory.summary ?? memory.content).substring(0, 100);
  if (valence === "negative") {
    const lessonPart2 = lesson ? ` Lesson: ${lesson.substring(0, 80)}` : "";
    return `${SOMATIC_MARKERS.NEGATIVE_PREFIX}. See: ${contentSnippet}${lessonPart2}`;
  }
  const lessonPart = lesson ? ` (${lesson.substring(0, 80)})` : "";
  return `${SOMATIC_MARKERS.POSITIVE_PREFIX}. ${contentSnippet}${lessonPart}`;
}
function matchProcedural(query, taskType, excludeIds) {
  try {
    const procedurals = getMemoriesByType("procedural", 20);
    const scored = [];
    for (const mem of procedurals) {
      if (excludeIds.has(mem.id)) continue;
      const sim = keywordSimilarity(query, mem.content);
      if (sim >= 0.15) {
        scored.push({ memory: mem, score: sim });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, CONTEXTUAL_RECALL.MAX_PROCEDURAL).map((s) => ({
      memory: s.memory,
      activation: s.score,
      source: "seed",
      hops: 0,
      somatic_marker: false
    }));
  } catch {
    return [];
  }
}
function codeContextRecall(code, filePath, context, config) {
  const emptyResult = {
    patterns: [],
    procedural: [],
    conventions: [],
    total_tokens: 0,
    scaffolding: null
  };
  if (!code || code.length < CODE_CONTEXT_RECALL.MIN_CONTENT_LENGTH) return emptyResult;
  const codeContext = extractCodeContext(code, filePath);
  if (codeContext.queryTerms.length === 0) return emptyResult;
  const query = codeContext.queryTerms.join(" ");
  const recallContext = {
    project: context.project,
    framework: context.domain,
    version: context.version,
    task_type: null,
    current_error: null,
    current_files: filePath ? [filePath] : []
  };
  const seeds = [];
  const seenIds = /* @__PURE__ */ new Set();
  try {
    const ftsResults = context.domain ? searchMemoriesByDomain(query, context.domain, CODE_CONTEXT_RECALL.MAX_FTS_SEEDS, 3, context.project ?? void 0) : searchMemories(query, CODE_CONTEXT_RECALL.MAX_FTS_SEEDS, context.project ?? void 0);
    for (const mem of ftsResults) {
      if (!seenIds.has(mem.id)) {
        seenIds.add(mem.id);
        seeds.push({
          memory: mem,
          activation: 1,
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
  }
  try {
    const queryEmbedding = generateEmbedding(query);
    const candidates = getEmbeddedMemories(context.domain, CODE_CONTEXT_RECALL.TFIDF_SCAN_LIMIT);
    const scored = [];
    for (const cand of candidates) {
      if (seenIds.has(cand.id)) continue;
      const candVec = bufferToEmbedding(cand.embedding);
      const score = cosineSimilarity(queryEmbedding, candVec);
      if (score >= EMBEDDING.MIN_COSINE_SIMILARITY) {
        scored.push({ id: cand.id, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const slots = Math.max(RETRIEVAL.MIN_TFIDF_SLOTS, CODE_CONTEXT_RECALL.MAX_FTS_SEEDS - seeds.length);
    for (const s of scored.slice(0, slots)) {
      const mem = getMemory(s.id);
      if (mem) {
        seenIds.add(s.id);
        seeds.push({
          memory: mem,
          activation: s.score * EMBEDDING.TFIDF_SEED_ACTIVATION,
          source: "tfidf",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
    logger8.debug("Code context recall: TF-IDF skipped");
  }
  if (seeds.length === 0) return emptyResult;
  for (const seed of seeds) {
    seed.activation *= contextualBoost(seed.memory, recallContext);
    seed.activation *= rewardModifier(seed.memory);
  }
  seeds.sort((a, b) => b.activation - a.activation);
  const cappedSeeds = seeds.slice(0, CODE_CONTEXT_RECALL.MAX_FTS_SEEDS);
  const lightConfig = {
    ...config,
    max_hops: 1,
    max_seeds: CODE_CONTEXT_RECALL.MAX_FTS_SEEDS
  };
  const activated = spreadActivation(cappedSeeds, lightConfig, recallContext);
  const selected = applyContextBudget(activated, CODE_CONTEXT_RECALL.TOKEN_BUDGET);
  const patterns = [];
  const conventions = [];
  for (const act of selected.slice(0, CODE_CONTEXT_RECALL.MAX_RESULTS)) {
    if (isSemanticData(act.memory.type_data) && (act.memory.type_data.knowledge_type === "convention" || act.memory.type_data.knowledge_type === "constraint")) {
      conventions.push(act);
    } else {
      patterns.push(act);
    }
  }
  let procedural = matchProceduralForCode(query, codeContext.language, seenIds);
  let scaffolding = null;
  try {
    scaffolding = getScaffoldingConfig(context.domain);
    const scaffoldedPatterns = applyScaffolding(patterns, scaffolding);
    patterns.length = 0;
    patterns.push(...scaffoldedPatterns);
    procedural = procedural.slice(0, scaffolding.max_procedural);
  } catch {
  }
  let totalTokens = 0;
  for (const m of [...patterns, ...conventions, ...procedural]) {
    totalTokens += m.memory.summary_token_count || m.memory.token_count;
  }
  return {
    patterns: patterns.slice(0, CODE_CONTEXT_RECALL.MAX_RESULTS),
    procedural: procedural.slice(0, CODE_CONTEXT_RECALL.MAX_PROCEDURAL),
    conventions: conventions.slice(0, CODE_CONTEXT_RECALL.MAX_CONVENTIONS),
    total_tokens: totalTokens,
    scaffolding
  };
}
function extractCodeContext(code, filePath) {
  const identifiers = [];
  const language = detectLanguage(code, filePath);
  if (language === "python" || !language) {
    for (const m of code.matchAll(/\bdef\s+(\w+)\s*\(/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bclass\s+(\w+)/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bfrom\s+([\w.]+)\s+import/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bimport\s+(\w+)/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/@(\w+)/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bself\.(\w+)\s*\(/g)) identifiers.push(m[1]);
  }
  if (language === "typescript" || language === "javascript" || !language) {
    for (const m of code.matchAll(/\bfunction\s+(\w+)\s*\(/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bclass\s+(\w+)/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      const segment = m[1].split("/").pop() ?? m[1];
      identifiers.push(segment.replace(/\.\w+$/, ""));
    }
    for (const m of code.matchAll(/\bexport\s+(?:function|class|const|let|interface|type)\s+(\w+)/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/\b(?:const|let)\s+(\w+)\s*=/g)) identifiers.push(m[1]);
  }
  if (language === "xml" || !language) {
    for (const m of code.matchAll(/model=['"]([^'"]+)['"]/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/<field\s+name=['"]model['"]>([^<]+)<\/field>/g)) identifiers.push(m[1].trim());
    for (const m of code.matchAll(/widget=['"]([^'"]+)['"]/g)) identifiers.push(m[1]);
    for (const m of code.matchAll(/t-name=['"]([^'"]+)['"]/g)) identifiers.push(m[1]);
  }
  if (filePath) {
    const parts = filePath.split(/[/\\]/);
    const fileName = parts.pop();
    if (fileName) {
      const baseName = fileName.replace(/\.\w+$/, "");
      identifiers.push(baseName);
    }
    const parentDir = parts.pop();
    if (parentDir && parentDir !== "src" && parentDir !== "lib") {
      identifiers.push(parentDir);
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const SKIP_TERMS = /* @__PURE__ */ new Set([
    "self",
    "this",
    "None",
    "True",
    "False",
    "null",
    "undefined",
    "return",
    "const",
    "let",
    "var",
    "if",
    "else",
    "for",
    "while",
    "init",
    "main",
    "test",
    "get",
    "set",
    "new",
    "api",
    "app"
  ]);
  const uniqueTerms = [];
  for (const id of identifiers) {
    const lower = id.toLowerCase();
    if (lower.length < 3 || SKIP_TERMS.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    uniqueTerms.push(id);
    if (uniqueTerms.length >= CODE_CONTEXT_RECALL.MAX_CODE_KEYWORDS) break;
  }
  return {
    queryTerms: uniqueTerms,
    language,
    identifiers: uniqueTerms
  };
}
function extractModuleFromPath(filePath) {
  const parts = filePath.split(/[/\\]/).filter(Boolean);
  const markers = ["addons", "custom-addons", "extra-addons", "packages", "apps"];
  for (let i = 0; i < parts.length - 1; i++) {
    if (markers.includes(parts[i]) && i + 1 < parts.length) {
      return parts[i + 1];
    }
  }
  if (parts.length >= 3) {
    return parts[parts.length - 3];
  }
  return null;
}
function detectLanguage(code, filePath) {
  if (filePath) {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py":
        return "python";
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "xml":
        return "xml";
      case "json":
        return "json";
      case "css":
      case "scss":
        return "css";
    }
  }
  if (code.includes("def ") && code.includes("self")) return "python";
  if (code.includes("import ") && code.includes("from ")) return "python";
  if (code.includes("function ") || code.includes("=>")) return "javascript";
  if (code.includes(": string") || code.includes(": number")) return "typescript";
  if (code.includes("<?xml") || code.includes("<record")) return "xml";
  return null;
}
function matchProceduralForCode(query, language, excludeIds) {
  try {
    const procedurals = getMemoriesByType("procedural", 15);
    const scored = [];
    for (const mem of procedurals) {
      if (excludeIds.has(mem.id)) continue;
      let sim = keywordSimilarity(query, mem.content);
      if (language && mem.domains.some((d) => d === language || d.includes(language))) {
        sim *= 1.3;
      }
      if (sim >= CODE_CONTEXT_RECALL.PROCEDURAL_MATCH_THRESHOLD) {
        scored.push({ memory: mem, score: sim });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, CODE_CONTEXT_RECALL.MAX_PROCEDURAL).map((s) => ({
      memory: s.memory,
      activation: s.score,
      source: "seed",
      hops: 0,
      somatic_marker: false
    }));
  } catch {
    return [];
  }
}
function seedActivation(query, config) {
  const seeds = [];
  const seenIds = /* @__PURE__ */ new Set();
  try {
    const ftsResults = searchMemories(query.query, config.fts_result_limit);
    for (const mem of ftsResults) {
      if (!seenIds.has(mem.id)) {
        seenIds.add(mem.id);
        seeds.push({
          memory: mem,
          activation: 1,
          // Seeds start at full activation
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
  }
  if (query.context?.framework) {
    const antipatterns = getAntipatterns(query.context.framework);
    const queryVersion = query.context.version ?? null;
    let apCount = 0;
    for (const ap of antipatterns) {
      if (apCount >= RETRIEVAL.MAX_ANTIPATTERN_SEEDS) break;
      if (queryVersion && ap.version && ap.version !== queryVersion) continue;
      if (!seenIds.has(ap.id)) {
        seenIds.add(ap.id);
        seeds.push({
          memory: ap,
          activation: 0.9,
          // Antipatterns start high (immune priority)
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
        apCount++;
      }
    }
  }
  try {
    const queryEmbedding = generateEmbedding(query.query);
    const domain = query.context?.framework ?? null;
    const candidates = getEmbeddedMemories(domain, config.tfidf_scan_limit);
    const tfidfScored = [];
    for (const cand of candidates) {
      if (seenIds.has(cand.id)) continue;
      const candVec = bufferToEmbedding(cand.embedding);
      const score = cosineSimilarity(queryEmbedding, candVec);
      if (score >= EMBEDDING.MIN_COSINE_SIMILARITY) {
        tfidfScored.push({ id: cand.id, score, embedding: cand.embedding });
      }
    }
    tfidfScored.sort((a, b) => b.score - a.score);
    const remainingSlots = Math.max(RETRIEVAL.MIN_TFIDF_SLOTS, config.max_seeds - seeds.length);
    for (const scored of tfidfScored.slice(0, remainingSlots)) {
      const mem = getMemory(scored.id);
      if (mem) {
        seenIds.add(scored.id);
        seeds.push({
          memory: mem,
          activation: scored.score * EMBEDDING.TFIDF_SEED_ACTIVATION,
          source: "tfidf",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  } catch {
    logger8.debug("TF-IDF seeding skipped (no embeddings or error)");
  }
  if (seeds.length < 3 && query.context?.framework) {
    const domainMems = getMemoriesByDomain(query.context.framework, 10);
    for (const mem of domainMems) {
      if (!seenIds.has(mem.id)) {
        seenIds.add(mem.id);
        seeds.push({
          memory: mem,
          activation: 0.5,
          // Domain backup seeds start lower
          source: "seed",
          hops: 0,
          somatic_marker: false
        });
      }
    }
  }
  if (query.context) {
    for (const seed of seeds) {
      seed.activation *= contextualBoost(seed.memory, query.context);
    }
  }
  for (const seed of seeds) {
    seed.activation *= rewardModifier(seed.memory);
  }
  for (const seed of seeds) {
    const primingBoost = getPrimedBoost(seed.memory.id);
    if (primingBoost > 0) {
      seed.activation += primingBoost;
    }
  }
  for (const seed of seeds) {
    seenIds.add(seed.memory.id);
  }
  const primedIds = getPrimedNodeIds();
  for (const primedId of primedIds) {
    if (seenIds.has(primedId)) continue;
    const boost = getPrimedBoost(primedId);
    if (boost <= 0) continue;
    const mem = getMemory(primedId);
    if (mem) {
      seenIds.add(primedId);
      seeds.push({
        memory: mem,
        activation: boost,
        source: "seed",
        hops: 0,
        somatic_marker: false
      });
    }
  }
  if (_preWarmedNodes.size > 0) {
    for (const [memId, activation] of _preWarmedNodes) {
      if (!seenIds.has(memId)) {
        const mem = getMemory(memId);
        if (mem) {
          seenIds.add(memId);
          seeds.push({
            memory: mem,
            activation,
            source: "seed",
            hops: 0,
            somatic_marker: false
          });
        }
      }
    }
    _preWarmedNodes = /* @__PURE__ */ new Map();
  }
  seeds.sort((a, b) => b.activation - a.activation);
  return seeds.slice(0, config.max_seeds);
}
function spreadActivation(seeds, config, context) {
  const activationMap = /* @__PURE__ */ new Map();
  for (const seed of seeds) {
    activationMap.set(seed.memory.id, seed);
  }
  const traversedPairs = [];
  for (let hop = 1; hop <= config.max_hops; hop++) {
    const newActivations = [];
    for (const [memId, activated] of activationMap) {
      if (activated.hops !== hop - 1) continue;
      const neighbors = getNeighborhood(memId);
      for (const neighbor of neighbors) {
        const spreadAmount = activated.activation * config.decay_per_hop * neighbor.strength;
        if (spreadAmount < config.activation_threshold) continue;
        const typeBonus = connectionTypeWeight(neighbor.type);
        const finalActivation = spreadAmount * typeBonus;
        if (finalActivation < config.activation_threshold) continue;
        const existing = activationMap.get(neighbor.id);
        if (existing) {
          if (finalActivation > existing.activation) {
            existing.activation = finalActivation;
          }
          continue;
        }
        const mem = getMemory(neighbor.id);
        if (!mem) continue;
        let emotionalActivation = finalActivation;
        if (isEpisodicData(mem.type_data)) {
          emotionalActivation += mem.type_data.emotional_weight * EMOTIONAL.SPREAD_FACTOR;
        }
        if (context) {
          emotionalActivation *= contextualBoost(mem, context);
        }
        emotionalActivation *= rewardModifier(mem);
        newActivations.push({
          memory: mem,
          activation: emotionalActivation,
          source: "spread",
          hops: hop,
          somatic_marker: false
        });
        traversedPairs.push([memId, neighbor.id]);
      }
    }
    if (newActivations.length === 0) break;
    for (const act of newActivations) {
      activationMap.set(act.memory.id, act);
    }
  }
  if (traversedPairs.length > 0) {
    try {
      const seen = /* @__PURE__ */ new Set();
      const uniquePairs = traversedPairs.filter(([a, b]) => {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      bulkIncrementCoActivation(uniquePairs);
    } catch {
    }
  }
  return activationMap;
}
function connectionTypeWeight(type) {
  return RETRIEVAL.CONNECTION_WEIGHT[type] ?? RETRIEVAL.DEFAULT_CONNECTION_WEIGHT;
}
function contextualBoost(memory, context) {
  if (!context) return 1;
  const enc = memory.encoding_context;
  if (!enc) return 1;
  let boost = 0;
  if (context.project && enc.project && context.project === enc.project) {
    boost += CONTEXTUAL.PROJECT_BOOST;
  }
  if (context.current_files.length > 0 && enc.files.length > 0) {
    const overlap = context.current_files.filter((f) => enc.files.includes(f)).length;
    boost += Math.min(overlap * CONTEXTUAL.FILE_BOOST_PER_MATCH, CONTEXTUAL.FILE_BOOST_CAP);
    if (overlap === 0) {
      const currentModules = context.current_files.map(extractModuleFromPath).filter(Boolean);
      const memModules = enc.files.map(extractModuleFromPath).filter(Boolean);
      if (currentModules.length > 0 && memModules.length > 0) {
        const moduleOverlap = currentModules.some((m) => memModules.includes(m));
        if (moduleOverlap) {
          boost += CONTEXTUAL.MODULE_PROXIMITY_BOOST;
        } else {
          return (1 + boost) * CONTEXTUAL.MODULE_MISMATCH_PENALTY;
        }
      }
    }
  }
  if (context.current_error && enc.error_context) {
    const errorKeywords = context.current_error.toLowerCase().split(/\s+/).slice(0, 10);
    const encErrorKeywords = enc.error_context.toLowerCase().split(/\s+/).slice(0, 10);
    const overlap = errorKeywords.filter((k) => encErrorKeywords.includes(k)).length;
    if (overlap >= 2) boost += CONTEXTUAL.ERROR_CONTEXT_BOOST;
  }
  if (context.task_type && enc.task_type && context.task_type === enc.task_type) {
    boost += CONTEXTUAL.TASK_TYPE_BOOST;
  }
  if (context.version && memory.version) {
    if (memory.version === context.version) {
      boost += CONTEXTUAL.VERSION_BOOST;
    } else {
      return (1 + boost) * CONTEXTUAL.VERSION_MISMATCH_PENALTY;
    }
  }
  if (context.framework && enc.framework && context.framework !== enc.framework) {
    return (1 + boost) * CONTEXTUAL.DOMAIN_MISMATCH_PENALTY;
  }
  if (context.project && enc.project && context.project !== enc.project) {
    const isProjectScoped = memory.type === "episodic" || memory.type === "semantic" && memory.tags.includes("user-intent");
    if (isProjectScoped) {
      return (1 + boost) * CONTEXTUAL.PROJECT_MISMATCH_PENALTY;
    }
  }
  if (isEpisodicData(memory.type_data) && memory.type_data.outcome === "negative" && memory.type_data.lesson) {
    boost += CONTEXTUAL.FAILURE_EXPERIENCE_BOOST;
  }
  return 1 + boost;
}
function rewardModifier(memory) {
  const rDelta = memory.reinforcement - REWARD.NEUTRAL_REINFORCEMENT;
  const cDelta = memory.confidence - REWARD.NEUTRAL_CONFIDENCE;
  const reward = rDelta * REWARD.REINFORCEMENT_WEIGHT + cDelta * REWARD.CONFIDENCE_WEIGHT;
  if (reward > 0) {
    return 1 + Math.min(reward * REWARD.POSITIVE_BOOST, REWARD.POSITIVE_BOOST);
  } else if (reward < 0) {
    return Math.max(1 + reward * REWARD.NEGATIVE_PENALTY, 0.3);
  }
  return 1;
}
function applyLateralInhibition(activated) {
  const result = new Map(activated);
  const groups = /* @__PURE__ */ new Map();
  for (const act of result.values()) {
    for (const domain of act.memory.domains) {
      const key = `${domain}:${act.memory.type}`;
      const group = groups.get(key) ?? [];
      group.push(act);
      groups.set(key, group);
    }
  }
  for (const [_key, group] of groups) {
    if (group.length < 2) continue;
    group.sort((a, b) => b.activation - a.activation);
    for (let i = 1; i < group.length; i++) {
      const current = group[i];
      const inhibitionFactor = 0.7;
      const inhibited = result.get(current.memory.id);
      if (inhibited) {
        inhibited.activation *= inhibitionFactor;
      }
    }
  }
  return result;
}
function applyContextBudget(activated, tokenBudget) {
  const sorted = Array.from(activated.values()).sort((a, b) => b.activation - a.activation);
  const selected = [];
  let tokensUsed = 0;
  for (const act of sorted) {
    if (act.memory.type === "antipattern") {
      const tokens = act.memory.summary_token_count || act.memory.token_count;
      if (tokensUsed + tokens <= tokenBudget) {
        selected.push(act);
        tokensUsed += tokens;
      }
    }
  }
  for (const act of sorted) {
    if (act.memory.type === "antipattern") continue;
    const tokens = act.memory.summary_token_count || act.memory.token_count;
    if (tokensUsed + tokens <= tokenBudget) {
      selected.push(act);
      tokensUsed += tokens;
    }
    if (tokensUsed >= tokenBudget) break;
  }
  return selected;
}
function buildPayload(selected, seeds, config) {
  let totalTokens = 0;
  let maxHops = 0;
  for (const act of selected) {
    totalTokens += act.memory.summary_token_count || act.memory.token_count;
    if (act.hops > maxHops) maxHops = act.hops;
    if (isEpisodicData(act.memory.type_data) && act.memory.type_data.emotional_weight >= EMOTIONAL.SOMATIC_THRESHOLD) {
      act.somatic_marker = true;
    }
  }
  return {
    memories: selected,
    total_tokens: totalTokens,
    query_seeds: seeds.map((s) => s.memory.id),
    activation_stats: {
      seeds_found: seeds.length,
      nodes_activated: selected.length + seeds.length,
      nodes_returned: selected.length,
      max_hops_used: maxHops
    }
  };
}
function findSimilarDecisions(query, context, maxResults = DECISION.MAX_SURFACED) {
  if (!query || query.length < 10) return [];
  const results = [];
  try {
    const candidates = searchMemories(query, 20);
    if (context.domain) {
      const domainCandidates = getMemoriesByDomain(context.domain, 20);
      for (const dc of domainCandidates) {
        if (!candidates.find((c) => c.id === dc.id)) {
          candidates.push(dc);
        }
      }
    }
    for (const candidate of candidates) {
      if (!isDecisionData(candidate.type_data)) continue;
      const decisionData = candidate.type_data;
      const kwSim = keywordSimilarity(query, candidate.content);
      let fileBonus = 0;
      if (context.files.length > 0 && candidate.encoding_context?.files) {
        const overlap = context.files.filter(
          (f) => candidate.encoding_context.files.includes(f)
        ).length;
        fileBonus = overlap > 0 ? 0.15 : 0;
      }
      const similarity = Math.min(1, kwSim + fileBonus);
      if (similarity >= DECISION.SIMILAR_DECISION_THRESHOLD) {
        results.push({
          memory: candidate,
          decision: decisionData,
          similarity
        });
      }
    }
    if (results.length < maxResults) {
      try {
        const queryEmb = generateEmbedding(query);
        const embCandidates = getEmbeddedMemories(context.domain, 30);
        for (const cand of embCandidates) {
          if (results.find((r) => r.memory.id === cand.id)) continue;
          const mem = getMemory(cand.id);
          if (!mem || !isDecisionData(mem.type_data)) continue;
          const candVec = bufferToEmbedding(cand.embedding);
          const embSim = cosineSimilarity(queryEmb, candVec);
          if (embSim >= DECISION.SIMILAR_DECISION_THRESHOLD) {
            results.push({
              memory: mem,
              decision: mem.type_data,
              similarity: embSim
            });
          }
        }
      } catch {
        logger8.debug("Decision retrieval: embedding search skipped");
      }
    }
  } catch (e) {
    logger8.error("Failed to find similar decisions", { error: String(e) });
    return [];
  }
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, maxResults);
}
function formatDecisionInjection(decision) {
  const d = decision.decision;
  const parts = [];
  parts.push(`[ENGRAM DECISION] Past decision (${d.decision_type}):`);
  parts.push(`  Chose: ${d.chosen}`);
  if (d.rationale) {
    parts.push(`  Reason: ${d.rationale}`);
  }
  if (d.alternatives.length > 0) {
    const altDescs = d.alternatives.map((a) => a.description).join(", ");
    parts.push(`  Rejected: ${altDescs}`);
  }
  if (d.outcome !== "pending") {
    parts.push(`  Outcome: ${d.outcome}${d.outcome_detail ? ` \u2014 ${d.outcome_detail}` : ""}`);
  }
  if (d.lesson) {
    parts.push(`  Lesson: ${d.lesson}`);
  }
  return parts.join("\n");
}
function findSimilarChains(query, context, maxResults = REASONING_CHAIN.MAX_SURFACED) {
  if (!query || query.length < 10) return [];
  const results = [];
  try {
    const textCandidates = searchReasoningChains(query, 20);
    if (context.domain) {
      const domainCandidates = getCompletedChainsByDomain(context.domain, 20);
      for (const dc of domainCandidates) {
        if (!textCandidates.find((c) => c.id === dc.id)) {
          textCandidates.push(dc);
        }
      }
    }
    for (const chain of textCandidates) {
      const kwSim = keywordSimilarity(query, chain.trigger + " " + (chain.conclusion ?? ""));
      let fileBonus = 0;
      if (context.files.length > 0) {
        const chainFiles = chain.steps.flatMap((s) => s.files);
        const overlap = context.files.filter((f) => chainFiles.includes(f)).length;
        fileBonus = overlap > 0 ? 0.15 : 0;
      }
      const queryLower = query.toLowerCase();
      let typeBonus = 0;
      const typePatterns = REASONING_CHAIN.TYPE_PATTERNS;
      for (const [type, keywords] of Object.entries(typePatterns)) {
        if (type === chain.chain_type && keywords.some((kw) => queryLower.includes(kw))) {
          typeBonus = 0.1;
          break;
        }
      }
      const similarity = Math.min(1, kwSim + fileBonus + typeBonus);
      if (similarity >= REASONING_CHAIN.SIMILAR_CHAIN_THRESHOLD) {
        results.push({ chain, similarity });
      }
    }
  } catch (e) {
    logger8.error("Failed to find similar chains", { error: String(e) });
    return [];
  }
  results.sort((a, b) => b.similarity - a.similarity);
  const surfaced = results.slice(0, maxResults);
  for (const r of surfaced) {
    try {
      incrementChainReuse(r.chain.id);
    } catch {
    }
  }
  return surfaced;
}
function formatChainInjection(similar) {
  const chain = similar.chain;
  const parts = [];
  parts.push(`[ENGRAM CHAIN] Past ${chain.chain_type} chain${chain.validated ? " (validated)" : ""}:`);
  parts.push(`  Trigger: ${chain.trigger}`);
  const stepSummary = chain.steps.map((s) => {
    const marker = s.was_dead_end ? " [dead end]" : "";
    return `${s.order}. ${s.action}${marker}`;
  }).join("\n  ");
  parts.push(`  Steps:
  ${stepSummary}`);
  const deadEnds = chain.steps.filter((s) => s.was_dead_end);
  if (deadEnds.length > 0) {
    parts.push(`  Dead ends to avoid: ${deadEnds.map((d) => d.action).join(", ")}`);
  }
  if (chain.conclusion) {
    parts.push(`  Conclusion: ${chain.conclusion}`);
  }
  parts.push(`  Confidence: ${(chain.confidence * 100).toFixed(0)}% | Reused ${chain.reuse_count}x`);
  return parts.join("\n");
}
function selectDiverseSurface(candidates, maxResults) {
  const result = [];
  let antipatternCount = 0;
  let decisionCount = 0;
  for (const mem of candidates) {
    if (result.length >= maxResults) break;
    if (mem.type === "antipattern") {
      if (antipatternCount >= 1) continue;
      antipatternCount++;
    } else if (isDecisionData(mem.type_data)) {
      if (decisionCount >= 1) continue;
      decisionCount++;
    }
    result.push(mem);
  }
  return result;
}

// src/engines/dedup.ts
var logger9 = createLogger("dedup");
function findDuplicate(content, type, domains, threshold = DEDUP.ENCODE_THRESHOLD) {
  try {
    const candidates = searchMemories(content, 10);
    for (const candidate of candidates) {
      if (candidate.type !== type) continue;
      const hasDomainOverlap = domains.length === 0 || candidate.domains.length === 0 || domains.some((d) => candidate.domains.includes(d));
      if (!hasDomainOverlap) continue;
      const similarity = keywordSimilarity(content, candidate.content);
      if (similarity >= threshold) {
        logger9.info("Duplicate detected", {
          existing_id: candidate.id,
          type: candidate.type,
          similarity: similarity.toFixed(3)
        });
        return candidate;
      }
    }
  } catch {
  }
  return null;
}
function strengthenExisting(memory) {
  updateMemory(memory.id, {
    reinforcement: Math.min(memory.reinforcement * 1.1, 5),
    confidence: Math.min(memory.confidence + 0.02, 1)
  });
  logger9.info("Strengthened existing instead of duplicate", {
    memory_id: memory.id,
    type: memory.type,
    new_reinforcement: Math.min(memory.reinforcement * 1.1, 5).toFixed(3)
  });
}

// src/engines/identity.ts
var logger10 = createLogger("identity");
function getSelfModel2() {
  const existing = getSelfModel();
  if (existing) return existing;
  const timestamp = now();
  const defaultModel = {
    id: "singleton",
    strengths: [],
    weaknesses: [],
    preferred_approaches: [],
    user_preferences: [],
    communication_style: "",
    trust_level: IDENTITY.INITIAL_TRUST,
    common_tasks: [],
    session_count: 0,
    total_turns: 0,
    frustration_triggers: [],
    satisfaction_triggers: [],
    last_session_summary: "",
    ongoing_context: "",
    relationship: createDefaultRelationshipProfile(),
    created_at: timestamp,
    updated_at: timestamp
  };
  return upsertSelfModel(defaultModel);
}
function updateSelfModelFromSession(sessionState) {
  const model = getSelfModel2();
  model.session_count++;
  model.total_turns += sessionState.total_turns;
  if (sessionState.narrative_text) {
    model.last_session_summary = truncate(
      sessionState.narrative_text,
      IDENTITY.MAX_SESSION_SUMMARY_LENGTH
    );
  } else {
    const summaryParts = [];
    if (sessionState.active_task) summaryParts.push(sessionState.active_task);
    if (sessionState.active_domain) summaryParts.push(`Domain: ${sessionState.active_domain}`);
    if (sessionState.active_project) summaryParts.push(`Project: ${sessionState.active_project}`);
    if (sessionState.session_files && sessionState.session_files.length > 0) {
      summaryParts.push(`Files: ${sessionState.session_files.length}`);
    }
    summaryParts.push(`Turns: ${sessionState.total_turns}`);
    if (sessionState.recent_errors && sessionState.recent_errors.length > 0) {
      summaryParts.push(`Errors: ${sessionState.recent_errors.length}`);
    }
    model.last_session_summary = truncate(
      summaryParts.join(". "),
      IDENTITY.MAX_SESSION_SUMMARY_LENGTH
    );
  }
  const contextParts = [];
  if (sessionState.active_project) contextParts.push(`Project: ${sessionState.active_project}`);
  if (sessionState.active_task) contextParts.push(`Last task: ${sessionState.active_task}`);
  if (sessionState.active_version) contextParts.push(`Version: ${sessionState.active_version}`);
  if (contextParts.length > 0) {
    model.ongoing_context = truncate(
      contextParts.join(". "),
      IDENTITY.MAX_ONGOING_CONTEXT_LENGTH
    );
  }
  if (sessionState.active_task) {
    model.common_tasks = updateFrequencyList(
      model.common_tasks,
      sessionState.active_task,
      IDENTITY.MAX_COMMON_TASKS
    );
  }
  if (sessionState.active_domain) {
    recalculateDomainProficiency(model, sessionState.active_domain);
  }
  try {
    const topics = [];
    if (sessionState.active_domain) topics.push(sessionState.active_domain);
    if (sessionState.active_task) {
      const taskKeywords = extractKeywords(sessionState.active_task).slice(0, 3);
      for (const kw of taskKeywords) {
        if (!topics.includes(kw)) topics.push(kw);
      }
    }
    updateRelationshipFromSession(model, {
      feedback_signals: sessionState.feedback_signals ?? { approval: 0, correction: 0, frustration: 0, instruction: 0 },
      total_turns: sessionState.total_turns,
      topics
    });
    detectBehavioralPreferences(model.relationship);
    if (sessionState.message_stats) {
      updateCommunicationStyle(model, sessionState.message_stats);
    }
  } catch (e) {
    logger10.error("Failed to update relationship profile", { error: String(e) });
  }
  upsertSelfModel(model);
  logger10.info("Self-model updated from session", {
    session_count: model.session_count,
    total_turns: model.total_turns,
    relationship_depth: model.relationship.relationship_depth
  });
}
function updateFromFeedback(feedback, signal) {
  const model = getSelfModel2();
  switch (signal) {
    case "approval": {
      const boost = IDENTITY.APPROVAL_TRUST_BOOST * (1 - model.trust_level);
      model.trust_level = Math.min(IDENTITY.TRUST_CEILING, model.trust_level + boost);
      break;
    }
    case "correction": {
      model.trust_level = Math.max(IDENTITY.TRUST_FLOOR, model.trust_level * IDENTITY.CORRECTION_TRUST_DECAY);
      break;
    }
    case "frustration": {
      model.trust_level = Math.max(IDENTITY.TRUST_FLOOR, model.trust_level * IDENTITY.FRUSTRATION_TRUST_DECAY);
      const triggerText = truncate(feedback.content ?? "unknown frustration", 100);
      if (!model.frustration_triggers.includes(triggerText)) {
        model.frustration_triggers.push(triggerText);
        if (model.frustration_triggers.length > IDENTITY.MAX_FRUSTRATION_TRIGGERS) {
          model.frustration_triggers.shift();
        }
      }
      break;
    }
    case "instruction": {
      const instrBoost = IDENTITY.APPROVAL_TRUST_BOOST * 0.5 * (1 - model.trust_level);
      model.trust_level = Math.min(IDENTITY.TRUST_CEILING, model.trust_level + instrBoost);
      break;
    }
    case "satisfaction": {
      const satText = truncate(feedback.content ?? "unknown satisfaction", 100);
      if (!model.satisfaction_triggers.includes(satText)) {
        model.satisfaction_triggers.push(satText);
        if (model.satisfaction_triggers.length > IDENTITY.MAX_SATISFACTION_TRIGGERS) {
          model.satisfaction_triggers.shift();
        }
      }
      const satBoost = IDENTITY.APPROVAL_TRUST_BOOST * (1 - model.trust_level);
      model.trust_level = Math.min(IDENTITY.TRUST_CEILING, model.trust_level + satBoost);
      break;
    }
  }
  upsertSelfModel(model);
  logger10.debug("Self-model trust updated", { signal, trust: model.trust_level });
}
function updateFromInstruction(content) {
  if (!content || content.length < 5) return;
  const model = getSelfModel2();
  const keywords = extractKeywords(content);
  const contentHash = content.substring(0, 60).replace(/\s+/g, "_").substring(0, 30);
  const key = `${keywords.slice(0, 3).join("_")}_${contentHash}` || content.substring(0, 30).replace(/\s+/g, "_");
  const existingIdx = model.user_preferences.findIndex((p) => p.key === key);
  const timestamp = now();
  if (existingIdx >= 0) {
    const existing = model.user_preferences[existingIdx];
    existing.strength = Math.min(1, existing.strength + IDENTITY.PREFERENCE_REINFORCE_BOOST);
    existing.last_reinforced = timestamp;
  } else {
    const pref = {
      key,
      description: truncate(content, IDENTITY.MAX_PREFERENCE_DESCRIPTION_LENGTH),
      source: "instruction",
      strength: IDENTITY.PREFERENCE_INITIAL_STRENGTH,
      first_seen: timestamp,
      last_reinforced: timestamp
    };
    model.user_preferences.push(pref);
    if (model.user_preferences.length > IDENTITY.MAX_USER_PREFERENCES) {
      model.user_preferences.sort((a, b) => a.strength - b.strength);
      model.user_preferences.shift();
      model.user_preferences.sort((a, b) => b.strength - a.strength);
    }
  }
  upsertSelfModel(model);
  logger10.info("User preference captured", { key, total: model.user_preferences.length });
}
function formatSelfModelInjection(tokenBudget) {
  const model = getSelfModel();
  if (!model || model.session_count === 0) return null;
  const maxItems = IDENTITY.MAX_INJECTION_ITEMS;
  const sections = [];
  const header = `[Engram Identity] Sessions: ${model.session_count} | Trust: ${Math.round(model.trust_level * 100)}%`;
  sections.push(header);
  const classifiedStrengths = model.strengths.filter(
    (s) => s.task_count >= IDENTITY.MIN_TASKS_FOR_CLASSIFICATION && s.proficiency >= IDENTITY.STRENGTH_THRESHOLD
  );
  if (classifiedStrengths.length > 0) {
    const top = classifiedStrengths.slice(0, maxItems);
    sections.push(`  Strengths: ${top.map((s) => `${s.domain}(${Math.round(s.proficiency * 100)}%)`).join(", ")}`);
  }
  if (model.weaknesses.length > 0) {
    const top = model.weaknesses.slice(0, maxItems);
    sections.push(`  Weaknesses: ${top.map((w) => `${w.domain}(${Math.round(w.proficiency * 100)}%)`).join(", ")}`);
  }
  if (model.user_preferences.length > 0) {
    const sorted = [...model.user_preferences].sort((a, b) => b.strength - a.strength);
    const top = sorted.slice(0, maxItems);
    sections.push(`  User prefers: ${top.map((p) => p.description).join("; ")}`);
  }
  if (model.communication_style) {
    sections.push(`  Style: ${model.communication_style}`);
  }
  if (model.ongoing_context) {
    sections.push(`  Context: ${model.ongoing_context}`);
  }
  if (model.last_session_summary) {
    sections.push(`  Last session: ${model.last_session_summary}`);
  }
  if (model.relationship && model.relationship.interaction_count > 0) {
    const rel = model.relationship;
    const depthLabel = rel.relationship_depth >= 0.7 ? "mature" : rel.relationship_depth >= 0.4 ? "developing" : "new";
    const relParts = [`Relationship: ${depthLabel} (${Math.round(rel.relationship_depth * 100)}%)`];
    if (rel.topic_affinities.length > 0) {
      const topTopics = rel.topic_affinities.slice(0, 3).map((t) => t.topic);
      relParts.push(`topics: ${topTopics.join(", ")}`);
    }
    if (rel.communication_style) {
      relParts.push(`style: ${rel.communication_style.verbosity}/${rel.communication_style.technical_level}`);
    }
    if (rel.correction_frequency > 0.1) {
      relParts.push("high correction rate \u2014 verify before acting");
    }
    sections.push(`  ${relParts.join(" | ")}`);
  }
  try {
    const masteryLine = formatMasteryInjection();
    if (masteryLine) {
      sections.push(`  ${masteryLine}`);
    }
  } catch {
  }
  let result = sections.join("\n");
  while (estimateTokens(result) > tokenBudget && sections.length > 1) {
    sections.pop();
    result = sections.join("\n");
  }
  return result;
}
function recordDomainOutcome(domain, outcome) {
  if (!domain) return;
  const model = getSelfModel2();
  let prof = findProficiency(model, domain);
  const timestamp = now();
  if (!prof) {
    prof = {
      domain,
      proficiency: 0.3,
      task_count: 0,
      success_count: 0,
      failure_count: 0,
      last_outcome: outcome,
      last_outcome_at: timestamp,
      evidence: ""
    };
  }
  prof.task_count++;
  if (outcome === "positive") prof.success_count++;
  if (outcome === "negative") prof.failure_count++;
  prof.last_outcome = outcome;
  prof.last_outcome_at = timestamp;
  prof.proficiency = computeProficiency(prof, domain);
  classifyProficiency(model, prof);
  upsertSelfModel(model);
  logger10.debug("Domain outcome recorded", { domain, outcome, proficiency: prof.proficiency });
}
function updateOngoingContext(context) {
  const model = getSelfModel2();
  model.ongoing_context = truncate(context, IDENTITY.MAX_ONGOING_CONTEXT_LENGTH);
  upsertSelfModel(model);
}
function findProficiency(model, domain) {
  const fromStrengths = model.strengths.find((s) => s.domain === domain);
  if (fromStrengths) return fromStrengths;
  const fromWeaknesses = model.weaknesses.find((w) => w.domain === domain);
  if (fromWeaknesses) return fromWeaknesses;
  return null;
}
function removeProficiency(model, domain) {
  model.strengths = model.strengths.filter((s) => s.domain !== domain);
  model.weaknesses = model.weaknesses.filter((w) => w.domain !== domain);
}
function computeProficiency(prof, domain) {
  let avgConfidence = 0.5;
  try {
    const domainMemories = getMemoriesByDomain(domain, 100);
    const qualityMemories = domainMemories.filter(
      (m) => m.type === "semantic" || m.type === "procedural" || m.type === "antipattern" || m.type === "episodic" && isEpisodicData(m.type_data) && m.type_data.lesson && m.type_data.lesson.length > 10
    );
    if (qualityMemories.length > 0) {
      avgConfidence = qualityMemories.reduce((sum, m) => sum + m.confidence, 0) / qualityMemories.length;
    }
  } catch {
  }
  const successRatio = prof.task_count > 0 ? prof.success_count / prof.task_count : 0.5;
  return IDENTITY.MEMORY_CONFIDENCE_WEIGHT * avgConfidence + IDENTITY.SUCCESS_RATIO_WEIGHT * successRatio;
}
function classifyProficiency(model, prof) {
  removeProficiency(model, prof.domain);
  if (prof.task_count >= IDENTITY.MIN_TASKS_FOR_CLASSIFICATION && prof.proficiency <= IDENTITY.WEAKNESS_THRESHOLD) {
    model.weaknesses.push(prof);
    model.weaknesses.sort((a, b) => a.proficiency - b.proficiency);
    if (model.weaknesses.length > IDENTITY.MAX_WEAKNESSES) {
      model.weaknesses = model.weaknesses.slice(0, IDENTITY.MAX_WEAKNESSES);
    }
  } else {
    model.strengths.push(prof);
    model.strengths.sort((a, b) => b.proficiency - a.proficiency);
    if (model.strengths.length > IDENTITY.MAX_STRENGTHS) {
      model.strengths = model.strengths.slice(0, IDENTITY.MAX_STRENGTHS);
    }
  }
}
function recalculateDomainProficiency(model, domain) {
  const prof = findProficiency(model, domain);
  if (!prof) return;
  prof.proficiency = computeProficiency(prof, domain);
  classifyProficiency(model, prof);
}
function updateFrequencyList(list, item, cap) {
  const normalized = item.substring(0, 100).trim();
  if (!normalized) return list;
  const filtered = list.filter((t) => t !== normalized);
  filtered.unshift(normalized);
  return filtered.slice(0, cap);
}
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + "...";
}
function createDefaultRelationshipProfile() {
  return {
    correction_frequency: 0,
    interaction_count: 0,
    relationship_depth: 0,
    trust_trajectory: [],
    topic_affinities: [],
    session_interactions: [],
    communication_style: null,
    behavioral_preferences: [],
    taught_concepts: []
  };
}
function updateRelationshipFromSession(model, data) {
  const rel = model.relationship;
  const timestamp = now();
  const snapshot = {
    trust_level: model.trust_level,
    session_number: model.session_count,
    timestamp
  };
  rel.trust_trajectory.push(snapshot);
  if (rel.trust_trajectory.length > RELATIONSHIP.MAX_TRUST_SNAPSHOTS) {
    rel.trust_trajectory = rel.trust_trajectory.slice(-RELATIONSHIP.MAX_TRUST_SNAPSHOTS);
  }
  const totalSignals = data.feedback_signals.approval + data.feedback_signals.correction + data.feedback_signals.frustration + data.feedback_signals.instruction;
  const satisfactionScore = totalSignals > 0 ? Math.max(0, Math.min(
    1,
    (data.feedback_signals.approval - data.feedback_signals.frustration * 2 - data.feedback_signals.correction * 0.5) / Math.max(totalSignals, 1) * 0.5 + 0.5
  )) : 0.5;
  const interaction = {
    session_number: model.session_count,
    timestamp,
    correction_count: data.feedback_signals.correction,
    approval_count: data.feedback_signals.approval,
    frustration_count: data.feedback_signals.frustration,
    instruction_count: data.feedback_signals.instruction,
    turn_count: data.total_turns,
    topics: data.topics.slice(0, 5),
    satisfaction_score: satisfactionScore
  };
  rel.session_interactions.push(interaction);
  if (rel.session_interactions.length > RELATIONSHIP.MAX_SESSION_INTERACTIONS) {
    rel.session_interactions = rel.session_interactions.slice(-RELATIONSHIP.MAX_SESSION_INTERACTIONS);
  }
  const correctionRate = data.total_turns > 0 ? data.feedback_signals.correction / data.total_turns : 0;
  rel.correction_frequency = rel.interaction_count === 0 ? correctionRate : RELATIONSHIP.CORRECTION_EMA_ALPHA * correctionRate + (1 - RELATIONSHIP.CORRECTION_EMA_ALPHA) * rel.correction_frequency;
  updateTopicAffinities(rel, data.topics);
  rel.interaction_count++;
  rel.relationship_depth = computeRelationshipDepth(rel, model.trust_level);
}
function updateTopicAffinities(rel, topics) {
  for (const aff of rel.topic_affinities) {
    aff.recency_weight *= RELATIONSHIP.TOPIC_RECENCY_DECAY;
  }
  const timestamp = now();
  for (const topic of topics) {
    if (!topic) continue;
    const normalized = topic.toLowerCase().trim();
    const existing = rel.topic_affinities.find((a) => a.topic === normalized);
    if (existing) {
      existing.frequency++;
      existing.recency_weight = Math.min(1, existing.recency_weight + 0.5);
      existing.last_seen = timestamp;
    } else {
      rel.topic_affinities.push({
        topic: normalized,
        frequency: 1,
        recency_weight: 1,
        first_seen: timestamp,
        last_seen: timestamp
      });
    }
  }
  rel.topic_affinities = rel.topic_affinities.filter(
    (a) => a.recency_weight >= RELATIONSHIP.TOPIC_MIN_WEIGHT || a.frequency >= 3
  );
  rel.topic_affinities.sort(
    (a, b) => b.frequency * b.recency_weight - a.frequency * a.recency_weight
  );
  if (rel.topic_affinities.length > RELATIONSHIP.MAX_TOPIC_AFFINITIES) {
    rel.topic_affinities = rel.topic_affinities.slice(0, RELATIONSHIP.MAX_TOPIC_AFFINITIES);
  }
}
function computeRelationshipDepth(rel, currentTrust) {
  const sessionFactor = 1 / (1 + Math.exp(-(rel.interaction_count - RELATIONSHIP.DEPTH_SESSION_MIDPOINT) / 5));
  let trustStability = 1;
  if (rel.trust_trajectory.length >= 3) {
    const trusts = rel.trust_trajectory.map((t) => t.trust_level);
    const mean = trusts.reduce((s, v) => s + v, 0) / trusts.length;
    const variance = trusts.reduce((s, v) => s + (v - mean) ** 2, 0) / trusts.length;
    trustStability = Math.max(0, 1 - variance * 10);
  }
  const topicDiversity = Math.min(1, rel.topic_affinities.length / 10);
  let qualityFactor = 0.5;
  if (rel.session_interactions.length > 0) {
    qualityFactor = rel.session_interactions.reduce((s, i) => s + i.satisfaction_score, 0) / rel.session_interactions.length;
  }
  return RELATIONSHIP.DEPTH_SESSION_WEIGHT * sessionFactor + RELATIONSHIP.DEPTH_TRUST_STABILITY_WEIGHT * trustStability + RELATIONSHIP.DEPTH_TOPIC_DIVERSITY_WEIGHT * topicDiversity + RELATIONSHIP.DEPTH_QUALITY_WEIGHT * qualityFactor;
}
function detectBehavioralPreferences(rel) {
  if (rel.session_interactions.length < RELATIONSHIP.MIN_PATTERN_SESSIONS) return;
  const timestamp = now();
  const detected = [];
  const interactions = rel.session_interactions;
  const count = interactions.length;
  const avgTurns = interactions.reduce((s, i) => s + i.turn_count, 0) / count;
  if (avgTurns < 10 && count >= RELATIONSHIP.MIN_PATTERN_SESSIONS) {
    detected.push({
      pattern: "Prefers short, focused sessions",
      confidence: Math.min(1, count / 10),
      evidence_sessions: count,
      first_detected: interactions[0].timestamp,
      last_confirmed: timestamp
    });
  } else if (avgTurns > 30 && count >= RELATIONSHIP.MIN_PATTERN_SESSIONS) {
    detected.push({
      pattern: "Engages in long, deep sessions",
      confidence: Math.min(1, count / 10),
      evidence_sessions: count,
      first_detected: interactions[0].timestamp,
      last_confirmed: timestamp
    });
  }
  const avgInstructions = interactions.reduce((s, i) => s + i.instruction_count, 0) / count;
  if (avgInstructions >= 2 && count >= RELATIONSHIP.MIN_PATTERN_SESSIONS) {
    detected.push({
      pattern: "Sets clear directives",
      confidence: Math.min(1, avgInstructions / 5),
      evidence_sessions: count,
      first_detected: interactions[0].timestamp,
      last_confirmed: timestamp
    });
  }
  const avgApprovals = interactions.reduce((s, i) => s + i.approval_count, 0) / count;
  const avgCorrections = interactions.reduce((s, i) => s + i.correction_count, 0) / count;
  if (avgApprovals > avgCorrections * 3 && avgApprovals >= 1 && count >= RELATIONSHIP.MIN_PATTERN_SESSIONS) {
    detected.push({
      pattern: "Frequently approves work",
      confidence: Math.min(1, avgApprovals / 3),
      evidence_sessions: count,
      first_detected: interactions[0].timestamp,
      last_confirmed: timestamp
    });
  }
  if (avgCorrections >= 2 && count >= RELATIONSHIP.MIN_PATTERN_SESSIONS) {
    detected.push({
      pattern: "Provides frequent corrections",
      confidence: Math.min(1, avgCorrections / 4),
      evidence_sessions: count,
      first_detected: interactions[0].timestamp,
      last_confirmed: timestamp
    });
  }
  for (const newPref of detected) {
    const existingIdx = rel.behavioral_preferences.findIndex((p) => p.pattern === newPref.pattern);
    if (existingIdx >= 0) {
      rel.behavioral_preferences[existingIdx] = newPref;
    } else {
      rel.behavioral_preferences.push(newPref);
    }
  }
  const detectedPatterns = new Set(detected.map((d) => d.pattern));
  rel.behavioral_preferences = rel.behavioral_preferences.filter(
    (p) => detectedPatterns.has(p.pattern) || p.evidence_sessions >= RELATIONSHIP.MIN_PATTERN_SESSIONS * 2
  );
  if (rel.behavioral_preferences.length > RELATIONSHIP.MAX_BEHAVIORAL_PREFERENCES) {
    rel.behavioral_preferences.sort((a, b) => b.confidence - a.confidence);
    rel.behavioral_preferences = rel.behavioral_preferences.slice(0, RELATIONSHIP.MAX_BEHAVIORAL_PREFERENCES);
  }
}
function updateCommunicationStyle(model, stats) {
  const rel = model.relationship;
  if (rel.interaction_count < RELATIONSHIP.MIN_SESSIONS_FOR_STYLE) return;
  const existingCount = rel.communication_style?.evidence_sessions ?? 0;
  const totalSessions = existingCount + 1;
  const verbosity = stats.avg_length < RELATIONSHIP.CONCISE_THRESHOLD ? "concise" : stats.avg_length > RELATIONSHIP.VERBOSE_THRESHOLD ? "verbose" : "moderate";
  const technical_level = stats.jargon_ratio > RELATIONSHIP.ADVANCED_JARGON_THRESHOLD ? "advanced" : stats.jargon_ratio > RELATIONSHIP.ADVANCED_JARGON_THRESHOLD / 2 ? "intermediate" : "beginner";
  const directness = stats.question_ratio > 0.5 ? "exploratory" : stats.question_ratio < 0.2 ? "direct" : "collaborative";
  const code_heavy = stats.code_ratio > RELATIONSHIP.CODE_HEAVY_THRESHOLD;
  rel.communication_style = {
    verbosity,
    technical_level,
    directness,
    code_heavy,
    evidence_sessions: totalSessions,
    last_updated: now()
  };
}
function assembleTeachingContext(signal, domain) {
  if (!domain) return null;
  const scaffolding = getScaffoldingConfig(domain);
  const masteryOrder = MASTERY_LEVEL_ORDER[scaffolding.level];
  if (masteryOrder < TEACHING.MIN_MASTERY_ORDER) return null;
  const model = getSelfModel2();
  const rel = model.relationship;
  const taughtConcepts = rel.taught_concepts ?? [];
  const previouslyTaught = [];
  for (const tc of taughtConcepts) {
    if (tc.domain !== domain) continue;
    const sim = keywordSimilarity(signal.topic, tc.topic);
    if (sim >= TEACHING.TOPIC_MATCH_THRESHOLD) {
      previouslyTaught.push(tc);
    }
  }
  let suggestedDepth;
  const baseDepth = TEACHING.BASE_DEPTH[signal.type] ?? 1;
  if (previouslyTaught.length === 0) {
    suggestedDepth = baseDepth;
  } else {
    const bestMatch = previouslyTaught.reduce((a, b) => a.depth > b.depth ? a : b);
    const recentWindowMs = TEACHING.RECENT_WINDOW_MS;
    const timeSinceLastTaught = Date.now() - new Date(bestMatch.last_taught).getTime();
    if (timeSinceLastTaught < recentWindowMs) {
      suggestedDepth = Math.min(bestMatch.depth + 1, TEACHING.MAX_DEPTH);
    } else {
      suggestedDepth = bestMatch.depth;
    }
  }
  let relatedSchemas = [];
  try {
    const schemas = getSchemasForDomain(domain);
    relatedSchemas = schemas.filter((s) => keywordSimilarity(signal.topic, s.description ?? s.name) > 0.1).slice(0, 3).map((s) => (s.description ?? s.name).substring(0, 80));
  } catch {
  }
  return {
    signal,
    mastery_level: scaffolding.level,
    previously_taught: previouslyTaught,
    suggested_depth: suggestedDepth,
    related_schemas: relatedSchemas
  };
}
function recordTaughtConcept(topic, domain, depth) {
  if (!topic || !domain) return;
  const model = getSelfModel2();
  const rel = model.relationship;
  if (!rel.taught_concepts) {
    rel.taught_concepts = [];
  }
  const timestamp = now();
  const existingIdx = rel.taught_concepts.findIndex(
    (tc) => tc.domain === domain && keywordSimilarity(tc.topic, topic) >= TEACHING.TOPIC_MATCH_THRESHOLD
  );
  if (existingIdx >= 0) {
    const existing = rel.taught_concepts[existingIdx];
    existing.teach_count++;
    existing.depth = Math.max(existing.depth, depth);
    existing.last_taught = timestamp;
  } else {
    rel.taught_concepts.push({
      topic,
      domain,
      depth,
      first_taught: timestamp,
      last_taught: timestamp,
      teach_count: 1
    });
    if (rel.taught_concepts.length > TEACHING.MAX_TAUGHT_CONCEPTS) {
      rel.taught_concepts.sort(
        (a, b) => new Date(b.last_taught).getTime() - new Date(a.last_taught).getTime()
      );
      rel.taught_concepts = rel.taught_concepts.slice(0, TEACHING.MAX_TAUGHT_CONCEPTS);
    }
  }
  upsertSelfModel(model);
}
function formatTeachingHint(ctx) {
  if (!ctx) return null;
  const depthLabel = TEACHING.DEPTH_LABELS[ctx.suggested_depth] ?? "explanation";
  const depthGuidance = TEACHING.DEPTH_GUIDANCE[ctx.suggested_depth] ?? "provide examples";
  const parts = [];
  const signalLabel = ctx.signal.type.replace(/_/g, " ");
  parts.push(`${signalLabel} detected (depth: ${depthLabel}).`);
  parts.push(`Guide: ${depthGuidance}.`);
  if (ctx.previously_taught.length > 0) {
    const topics = ctx.previously_taught.map((tc) => `"${tc.topic}" (depth ${tc.depth}, ${tc.teach_count}x)`).slice(0, 3).join(", ");
    parts.push(`Previously covered: ${topics} \u2014 go deeper.`);
  }
  if (ctx.related_schemas.length > 0) {
    parts.push(`Related patterns: ${ctx.related_schemas.join("; ")}.`);
  }
  const hint = parts.join(" ");
  return hint.length > 0 ? hint : null;
}

// src/engines/synthesis.ts
var log2 = createLogger("synthesis");
function synthesizeDomainKnowledge(domain) {
  if (!domain || domain.trim().length === 0) return null;
  const memories = getMemoriesByDomain(domain, 100);
  if (memories.length < SYNTHESIS.MIN_DOMAIN_MEMORIES) {
    log2.debug("insufficient memories for synthesis", { domain, count: memories.length });
    return null;
  }
  const masteryProfiles = getMasteryForDomain(domain);
  let masterySummary;
  if (masteryProfiles.length === 0) {
    masterySummary = "No mastery data";
  } else {
    const totalPractice = masteryProfiles.reduce((s, p) => s + p.practice_count, 0);
    const totalSuccess = masteryProfiles.reduce((s, p) => s + p.success_count, 0);
    const overallRate = totalPractice > 0 ? Math.round(totalSuccess / totalPractice * 100) : 0;
    const levelCounts = /* @__PURE__ */ new Map();
    for (const p of masteryProfiles) {
      levelCounts.set(p.level, (levelCounts.get(p.level) ?? 0) + 1);
    }
    const levelSummary = [...levelCounts.entries()].sort((a, b) => b[1] - a[1]).map(([level, count]) => `${count} ${level}`).join(", ");
    masterySummary = `${masteryProfiles.length} skills (${levelSummary}), ${overallRate}% success across ${totalPractice} tasks`;
  }
  const keyPatterns = extractTopPatterns(memories, domain);
  const designPrinciples = extractDesignPrinciples(domain);
  const conceptClusters = buildConceptualGraph(domain);
  const openQuestions = memories.filter((m) => {
    if (m.confidence >= 0.5) return false;
    if (m.tags.includes("subagent") || m.tags.includes("auto_encoded")) return false;
    const content = m.summary ?? m.content;
    const looksLikeQuestion = /\?|how to|why does|unresolved|unknown|todo|investigate|need to/i.test(content);
    const hasLesson = m.tags.includes("has_lesson");
    return looksLikeQuestion || hasLesson;
  }).map((m) => m.summary ?? m.content.substring(0, 120)).slice(0, 10);
  log2.debug("domain synthesis complete", {
    domain,
    patterns: keyPatterns.length,
    principles: designPrinciples.length,
    clusters: conceptClusters.length,
    questions: openQuestions.length
  });
  return {
    domain,
    key_patterns: keyPatterns,
    design_principles: designPrinciples,
    concept_clusters: conceptClusters,
    mastery_summary: masterySummary,
    open_questions: openQuestions,
    generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function extractTopPatterns(memories, domain) {
  const totalDocs = memories.length;
  if (totalDocs === 0) return [];
  const termFreq = /* @__PURE__ */ new Map();
  const docFreq = /* @__PURE__ */ new Map();
  const domainLower = domain.toLowerCase();
  for (const mem of memories) {
    const keywords = extractKeywords(mem.content);
    const filteredTags = mem.tags.filter((tag) => {
      const lower = tag.toLowerCase();
      if (SYNTHESIS.SYSTEM_TAGS.has(lower)) return false;
      if (SYNTHESIS.SYSTEM_TAG_PREFIXES.some((p) => lower.startsWith(p))) return false;
      return true;
    });
    const allTerms = [...keywords, ...filteredTags.map((t) => t.toLowerCase())];
    const seen = /* @__PURE__ */ new Set();
    for (const term of allTerms) {
      if (term === domainLower) continue;
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
      if (!seen.has(term)) {
        seen.add(term);
        docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
      }
    }
  }
  const maxDf = Math.floor(totalDocs * SYNTHESIS.MAX_DOCUMENT_FREQUENCY_RATIO);
  const scored = [];
  for (const [term, tf] of termFreq) {
    const df = docFreq.get(term) ?? 1;
    if (df > maxDf) continue;
    const idf = Math.log(totalDocs / df);
    scored.push([term, tf * idf]);
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, SYNTHESIS.MAX_KEY_PATTERNS).map(([term]) => term);
}
function extractDesignPrinciples(domain) {
  if (!domain || domain.trim().length === 0) return [];
  const decisionMemories = searchMemories(domain, SYNTHESIS.MAX_DECISIONS_SCANNED).filter((m) => isDecisionData(m.type_data));
  if (decisionMemories.length === 0) return [];
  const groupedByType = /* @__PURE__ */ new Map();
  for (const mem of decisionMemories) {
    const data = mem.type_data;
    const dtype = data.decision_type;
    const group = groupedByType.get(dtype);
    if (group) {
      group.push(mem);
    } else {
      groupedByType.set(dtype, [mem]);
    }
  }
  const principles = [];
  for (const [, decisions] of groupedByType) {
    if (decisions.length < 2) continue;
    const rationaleKeywords = /* @__PURE__ */ new Map();
    for (const mem of decisions) {
      const data = mem.type_data;
      const keywords = extractKeywords(data.rationale);
      for (const kw of keywords) {
        const lower = kw.toLowerCase();
        rationaleKeywords.set(lower, (rationaleKeywords.get(lower) ?? 0) + 1);
      }
    }
    const threshold = decisions.length / 2;
    const themeKeywords = [...rationaleKeywords.entries()].filter(([, count]) => count >= threshold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([kw]) => kw);
    if (themeKeywords.length === 0) continue;
    const principle = themeKeywords.join(", ");
    const avgConfidence = decisions.reduce((sum, m) => sum + m.confidence, 0) / decisions.length;
    principles.push({
      principle,
      evidence_count: decisions.length,
      confidence: avgConfidence,
      decision_ids: decisions.map((m) => m.id)
    });
  }
  principles.sort((a, b) => {
    const evDiff = b.evidence_count - a.evidence_count;
    if (evDiff !== 0) return evDiff;
    return b.confidence - a.confidence;
  });
  return principles;
}
function buildConceptualGraph(domain) {
  if (!domain || domain.trim().length === 0) return [];
  const memories = getMemoriesByDomain(domain, 100);
  if (memories.length === 0) return [];
  const memoryMap = /* @__PURE__ */ new Map();
  const adjacency = /* @__PURE__ */ new Map();
  for (const mem of memories) {
    memoryMap.set(mem.id, mem);
    adjacency.set(mem.id, /* @__PURE__ */ new Set());
  }
  for (const mem of memories) {
    const connections = getConnections(mem.id);
    for (const conn of connections) {
      if (conn.co_activation_count < SYNTHESIS.CO_ACTIVATION_THRESHOLD) continue;
      const otherId = conn.source_id === mem.id ? conn.target_id : conn.source_id;
      if (!memoryMap.has(otherId)) continue;
      adjacency.get(mem.id).add(otherId);
      const otherAdj = adjacency.get(otherId);
      if (otherAdj) {
        otherAdj.add(mem.id);
      }
    }
  }
  const visited = /* @__PURE__ */ new Set();
  const clusters = [];
  for (const mem of memories) {
    if (visited.has(mem.id)) continue;
    const neighbors = adjacency.get(mem.id);
    if (!neighbors || neighbors.size === 0) continue;
    const clusterIds = [];
    const queue = [mem.id];
    visited.add(mem.id);
    while (queue.length > 0 && clusterIds.length < SYNTHESIS.MAX_CLUSTER_SIZE) {
      const currentId = queue.shift();
      clusterIds.push(currentId);
      const adj = adjacency.get(currentId);
      if (!adj) continue;
      for (const neighborId of adj) {
        if (visited.has(neighborId)) continue;
        if (clusterIds.length >= SYNTHESIS.MAX_CLUSTER_SIZE) break;
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
    if (clusterIds.length < 2) continue;
    const clusterMemories = clusterIds.map((id) => memoryMap.get(id)).filter((m) => m !== void 0);
    const avgConfidence = clusterMemories.reduce((s, m) => s + m.confidence, 0) / clusterMemories.length;
    let edgeCount = 0;
    for (const id of clusterIds) {
      const adj = adjacency.get(id);
      if (!adj) continue;
      for (const nid of adj) {
        if (clusterIds.includes(nid)) edgeCount++;
      }
    }
    edgeCount /= 2;
    const possibleEdges = clusterIds.length * (clusterIds.length - 1) / 2;
    const connectionDensity = possibleEdges > 0 ? edgeCount / possibleEdges : 0;
    const allContent = clusterMemories.map((m) => m.content).join(" ");
    const keywords = extractKeywords(allContent);
    const label = keywords.slice(0, 3).join(", ") || "unnamed cluster";
    clusters.push({
      label,
      memory_ids: clusterIds,
      avg_confidence: avgConfidence,
      connection_density: connectionDensity
    });
  }
  clusters.sort((a, b) => b.avg_confidence - a.avg_confidence);
  return clusters.slice(0, SYNTHESIS.MAX_CLUSTERS);
}
function composeKnowledgeNarrative(synthesis) {
  const charBudget = SYNTHESIS.NARRATIVE_TOKEN_BUDGET * 4;
  const sections = [];
  sections.push(`## ${synthesis.domain} \u2014 Knowledge Summary`);
  sections.push(`Mastery: ${synthesis.mastery_summary}`);
  sections.push(`Generated: ${synthesis.generated_at}`);
  if (synthesis.key_patterns.length > 0) {
    sections.push("");
    sections.push("### Key Patterns");
    for (const pattern of synthesis.key_patterns) {
      sections.push(`- ${pattern}`);
    }
  }
  if (synthesis.design_principles.length > 0) {
    sections.push("");
    sections.push("### Design Principles");
    for (const dp of synthesis.design_principles) {
      sections.push(`- ${dp.principle} (${dp.evidence_count} decisions, confidence: ${dp.confidence.toFixed(2)})`);
    }
  }
  if (synthesis.concept_clusters.length > 0) {
    sections.push("");
    sections.push("### Concept Clusters");
    for (const cluster of synthesis.concept_clusters) {
      sections.push(`- ${cluster.label} (${cluster.memory_ids.length} memories, density: ${cluster.connection_density.toFixed(2)})`);
    }
  }
  if (synthesis.open_questions.length > 0) {
    sections.push("");
    sections.push("### Open Questions");
    for (const q of synthesis.open_questions) {
      sections.push(`- ${q}`);
    }
  }
  let narrative = sections.join("\n");
  if (narrative.length > charBudget) {
    narrative = narrative.substring(0, charBudget - 3) + "...";
  }
  return narrative;
}

// src/engines/codemap.ts
import { existsSync as existsSync3, readFileSync as readFileSync2, statSync as statSync2, readdirSync as readdirSync2 } from "fs";
import { extname, join as join3, relative } from "path";
import { createHash as createHash2 } from "crypto";
var logger11 = createLogger("codemap");
function detectFileType(filePath) {
  const ext = extname(filePath).toLowerCase().replace(".", "");
  const map = {
    py: "py",
    ts: "ts",
    tsx: "ts",
    js: "js",
    jsx: "js",
    xml: "xml",
    json: "json",
    css: "css",
    scss: "css",
    md: "md",
    rst: "md"
  };
  return map[ext] ?? "other";
}
function parsePython(content) {
  const parts = [];
  const nameMatch = content.match(/_name\s*=\s*['"]([^'"]+)['"]/);
  if (nameMatch) parts.push(`model:${nameMatch[1]}`);
  const inheritMatches = content.match(/_inherit\s*=\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])/);
  if (inheritMatches) {
    const inh = (inheritMatches[1] ?? inheritMatches[2]).replace(/['"]/g, "").trim();
    parts.push(`inh:${inh}`);
  }
  const fieldRegex = /^\s*(\w+)\s*=\s*fields\.(Char|Text|Boolean|Integer|Float|Date|Datetime|Selection|Many2one|One2many|Many2many|Binary|Html|Monetary|Reference)\b/gm;
  const fields = [];
  let fm;
  while ((fm = fieldRegex.exec(content)) !== null) {
    fields.push(`${fm[1]}:${fm[2]}`);
  }
  if (fields.length > 0) {
    parts.push(`fld:[${fields.slice(0, 10).join(",")}]`);
  }
  const defRegex = /^\s*(?:async\s+)?def\s+(\w+)\s*\(/gm;
  const methods = [];
  let dm;
  while ((dm = defRegex.exec(content)) !== null) {
    if (!dm[1].startsWith("__") || dm[1] === "__init__") {
      methods.push(dm[1]);
    }
  }
  if (methods.length > 0) {
    parts.push(`def:[${methods.slice(0, 10).join(",")}]`);
  }
  if (!nameMatch) {
    const classRegex = /^class\s+(\w+)/gm;
    const classes = [];
    let cm;
    while ((cm = classRegex.exec(content)) !== null) {
      classes.push(cm[1]);
    }
    if (classes.length > 0) {
      parts.push(`cls:[${classes.slice(0, 5).join(",")}]`);
    }
  }
  const STDLIB = /* @__PURE__ */ new Set(["os", "sys", "json", "re", "typing", "datetime", "logging", "pathlib", "collections", "functools", "itertools", "abc", "copy", "io", "math", "hashlib", "uuid", "unittest", "dataclasses"]);
  const importRegex = /^(?:from\s+(\S+)\s+import|import\s+(\S+))/gm;
  const imports = [];
  let im;
  while ((im = importRegex.exec(content)) !== null) {
    const mod = (im[1] ?? im[2]).split(".").pop();
    if (!STDLIB.has(mod)) {
      imports.push(mod);
    }
  }
  if (imports.length > 0) {
    parts.push(`imp:[${[...new Set(imports)].slice(0, 8).join(",")}]`);
  }
  return parts.join(" ");
}
function parseTypeScript(content) {
  const parts = [];
  const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  const funcs = [];
  let fm;
  while ((fm = funcRegex.exec(content)) !== null) {
    funcs.push(fm[1]);
  }
  if (funcs.length > 0) {
    parts.push(`fn:[${funcs.slice(0, 10).join(",")}]`);
  }
  const classRegex = /export\s+(?:abstract\s+)?class\s+(\w+)/g;
  const classes = [];
  let cm;
  while ((cm = classRegex.exec(content)) !== null) {
    classes.push(cm[1]);
  }
  if (classes.length > 0) {
    parts.push(`cls:[${classes.slice(0, 5).join(",")}]`);
  }
  const typeRegex = /export\s+(?:interface|type)\s+(\w+)/g;
  const types = [];
  let tm;
  while ((tm = typeRegex.exec(content)) !== null) {
    types.push(tm[1]);
  }
  if (types.length > 0) {
    parts.push(`type:[${types.slice(0, 10).join(",")}]`);
  }
  const constRegex = /export\s+const\s+(\w+)/g;
  const consts = [];
  let km;
  while ((km = constRegex.exec(content)) !== null) {
    consts.push(km[1]);
  }
  if (consts.length > 0) {
    parts.push(`const:[${consts.slice(0, 10).join(",")}]`);
  }
  const NODE_BUILTINS = /* @__PURE__ */ new Set(["node:fs", "node:path", "node:crypto", "node:os", "node:url", "node:util", "node:child_process", "node:stream", "node:buffer", "vitest"]);
  const impRegex = /import\s+(?:type\s+)?(?:\{[^}]+\}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let im;
  while ((im = impRegex.exec(content)) !== null) {
    if (!NODE_BUILTINS.has(im[1])) {
      const mod = im[1].split("/").pop().replace(/\.js$/, "");
      imports.push(mod);
    }
  }
  if (imports.length > 0) {
    parts.push(`imp:[${[...new Set(imports)].slice(0, 8).join(",")}]`);
  }
  return parts.join(" ");
}
function parseXml(content) {
  const parts = [];
  const recordRegex = /<record\s+[^>]*id=["']([^"']+)["'][^>]*model=["']([^"']+)["']/g;
  const records = [];
  let rm;
  while ((rm = recordRegex.exec(content)) !== null) {
    records.push(`${rm[2]}#${rm[1]}`);
  }
  const recordRegex2 = /<record\s+[^>]*model=["']([^"']+)["'][^>]*id=["']([^"']+)["']/g;
  while ((rm = recordRegex2.exec(content)) !== null) {
    records.push(`${rm[1]}#${rm[2]}`);
  }
  if (records.length > 0) {
    parts.push(`rec:[${records.slice(0, 8).join(",")}]`);
  }
  const viewTypes = /* @__PURE__ */ new Set();
  const viewRegex = /<field\s+name=["']arch["'][^>]*>[\s\S]*?<(form|list|tree|kanban|search|calendar|pivot|graph|gantt)\b/g;
  let vm;
  while ((vm = viewRegex.exec(content)) !== null) {
    viewTypes.add(vm[1] === "tree" ? "list" : vm[1]);
  }
  if (viewTypes.size > 0) {
    parts.push(`vw:[${[...viewTypes].join(",")}]`);
  }
  const menuRegex = /<menuitem\s+[^>]*id=["']([^"']+)["']/g;
  const menus = [];
  let mm;
  while ((mm = menuRegex.exec(content)) !== null) {
    menus.push(mm[1]);
  }
  if (menus.length > 0) {
    parts.push(`menu:[${menus.slice(0, 5).join(",")}]`);
  }
  const inheritRegex = /<field\s+name=["']inherit_id["']\s+ref=["']([^"']+)["']/g;
  const refs = [];
  let ir;
  while ((ir = inheritRegex.exec(content)) !== null) {
    refs.push(ir[1]);
  }
  if (refs.length > 0) {
    parts.push(`ref:[${refs.slice(0, 5).join(",")}]`);
  }
  return parts.join(" ");
}
function parseJson(content) {
  try {
    const obj = JSON.parse(content);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      const keys = Object.keys(obj).slice(0, 15);
      return `keys:[${keys.join(",")}]`;
    }
  } catch {
  }
  return "";
}
function parseFile(filePath, content) {
  const fileType = detectFileType(filePath);
  let skeleton;
  switch (fileType) {
    case "py":
      skeleton = parsePython(content);
      break;
    case "ts":
    case "js":
      skeleton = parseTypeScript(content);
      break;
    case "xml":
      skeleton = parseXml(content);
      break;
    case "json":
      skeleton = parseJson(content);
      break;
    default:
      skeleton = "";
  }
  return skeleton.substring(0, CODEMAP.MAX_SKELETON_LENGTH);
}
function updateFileInMap(projectPath, filePath) {
  try {
    const absPath = filePath.startsWith(projectPath) ? filePath : join3(projectPath, filePath);
    if (!existsSync3(absPath)) return false;
    const stat = statSync2(absPath);
    if (stat.size > CODEMAP.MAX_FILE_SIZE_BYTES) return false;
    const fileType = detectFileType(absPath);
    if (fileType === "other") return false;
    const content = readFileSync2(absPath, "utf-8");
    const hash = createHash2("sha256").update(content).digest("hex").substring(0, CODEMAP.HASH_LENGTH);
    const relPath = relative(projectPath, absPath).replace(/\\/g, "/");
    const existing = getProjectMapEntry(projectPath, relPath);
    if (existing && existing.file_hash === hash) return false;
    const skeleton = parseFile(absPath, content);
    upsertProjectMapEntry({
      project_path: projectPath,
      file_path: relPath,
      file_type: fileType,
      skeleton,
      file_hash: hash,
      last_parsed: now()
    });
    logger11.debug("Updated codemap entry", { relPath, skeleton: skeleton.substring(0, 80) });
    return true;
  } catch (err) {
    logger11.debug("Failed to update codemap entry", { filePath, error: String(err) });
    return false;
  }
}
function scanProject(projectPath) {
  let count = 0;
  const extensions = new Set(CODEMAP.PARSEABLE_EXTENSIONS);
  function walk(dir) {
    if (count >= CODEMAP.MAX_FILES_PER_PROJECT) return;
    let entries;
    try {
      entries = readdirSync2(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (count >= CODEMAP.MAX_FILES_PER_PROJECT) return;
      const fullPath = join3(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || ["node_modules", "__pycache__", "dist", "build", ".git", "venv", "env"].includes(entry.name)) {
          continue;
        }
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase().replace(".", "");
      if (!extensions.has(ext)) continue;
      if (updateFileInMap(projectPath, fullPath)) {
        count++;
      }
    }
  }
  walk(projectPath);
  logger11.info("Project scan complete", { projectPath, filesUpdated: count });
  return count;
}
function formatProjectMap(projectPath, tokenBudget) {
  const entries = getProjectMap(projectPath);
  if (entries.length === 0) return "";
  const lines = ["[Codemap]"];
  let tokens = estimateTokens(lines[0]);
  for (const entry of entries) {
    if (!entry.skeleton) continue;
    const line = `  ${entry.file_path}: ${entry.skeleton}`;
    const lineTokens = estimateTokens(line);
    if (tokens + lineTokens > tokenBudget) break;
    lines.push(line);
    tokens += lineTokens;
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
}

// src/engines/error-learning.ts
var logger12 = createLogger("error-learning");
function extractErrorFingerprint(output) {
  if (!output) return null;
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const pyMatch = trimmed.match(/^(\w*(?:Error|Exception|Warning))\s*:\s*(.+)/);
    if (pyMatch) {
      return normalizeFingerprint(pyMatch[1], pyMatch[2]);
    }
    const nodeMatch = trimmed.match(/^(?:Uncaught\s+)?(\w*Error)\s*:\s*(.+)/);
    if (nodeMatch) {
      return normalizeFingerprint(nodeMatch[1], nodeMatch[2]);
    }
    const genericMatch = trimmed.match(/^(?:error|ERROR|FAILED|fatal)\s*[:\-]\s*(.+)/i);
    if (genericMatch) {
      return normalizeFingerprint("Error", genericMatch[1]);
    }
    const odooMatch = trimmed.match(/odoo\.[\w.]+\.(ParseError|ValidationError|UserError|AccessError|MissingError)\s*:\s*(.+)/);
    if (odooMatch) {
      return normalizeFingerprint(odooMatch[1], odooMatch[2]);
    }
  }
  return null;
}
function normalizeFingerprint(errorType, message) {
  const truncatedMsg = message.substring(0, ERROR_LEARNING.MAX_ERROR_MESSAGE_LENGTH);
  const normalized = truncatedMsg.replace(/['"][^'"]{0,100}['"]/g, "'_STR_'").replace(/(?:\/[\w.\-/]+)+/g, "_PATH_").replace(/\bline\s+\d+/gi, "line _N_").replace(/\b\d{4,}\b/g, "_NUM_").replace(/0x[0-9a-f]+/gi, "_HEX_").replace(/\s+/g, " ").trim().toLowerCase();
  const fingerprint = `${errorType.toLowerCase()}:${normalized}`;
  return {
    fingerprint,
    error_type: errorType,
    error_message: truncatedMsg
  };
}
function recordError(output, command, filePath, projectPath) {
  const extracted = extractErrorFingerprint(output);
  if (!extracted) return null;
  const { fingerprint, error_type, error_message } = extracted;
  const existing = findErrorByFingerprint(fingerprint);
  if (existing) {
    updateErrorCandidate(existing.id, {
      occurrences: existing.occurrences + 1,
      last_seen: now(),
      file_path: filePath ?? existing.file_path,
      project_path: projectPath ?? existing.project_path
    });
    logger12.debug("Incremented error candidate", { id: existing.id, occurrences: existing.occurrences + 1 });
    return existing.id;
  }
  const candidate = createErrorCandidate({
    fingerprint,
    error_type,
    error_message,
    file_path: filePath,
    occurrences: 1,
    fix_content: null,
    fix_file_path: null,
    fix_command: command,
    graduated: false,
    graduated_memory_id: null,
    first_seen: now(),
    last_seen: now(),
    project_path: projectPath
  });
  logger12.debug("Created error candidate", { id: candidate.id, fingerprint });
  pruneErrorCandidates(ERROR_LEARNING.MAX_CANDIDATES);
  return candidate.id;
}
function recordFix(filePath, command, fixContent, projectPath) {
  if (!filePath && !command) return;
  const candidates = getRecentErrorCandidates(10);
  for (const candidate of candidates) {
    const matchesFile = filePath && candidate.file_path && candidate.file_path === filePath;
    const matchesProject = projectPath && candidate.project_path === projectPath;
    if (matchesFile || matchesProject && !candidate.fix_content) {
      const truncatedFix = fixContent ? fixContent.substring(0, ERROR_LEARNING.MAX_FIX_LENGTH) : null;
      updateErrorCandidate(candidate.id, {
        fix_content: truncatedFix ?? candidate.fix_content,
        fix_file_path: filePath ?? candidate.fix_file_path,
        fix_command: command ?? candidate.fix_command
      });
      logger12.debug("Attached fix to error candidate", { id: candidate.id });
      return;
    }
  }
}
function graduateErrorCandidates() {
  const candidates = getUngraduatedErrorCandidates();
  let graduated = 0;
  for (const candidate of candidates) {
    const isCritical = ERROR_LEARNING.CRITICAL_PATTERNS.some(
      (p) => candidate.error_type.toLowerCase().includes(p) || candidate.error_message.toLowerCase().includes(p)
    );
    const threshold = isCritical ? ERROR_LEARNING.GRADUATION_THRESHOLD_CRITICAL : ERROR_LEARNING.GRADUATION_THRESHOLD_DEFAULT;
    if (candidate.occurrences < threshold) continue;
    const content = `Recurring ${candidate.error_type}: ${candidate.error_message}`;
    const fix = candidate.fix_content ?? candidate.fix_command ?? `Avoid the pattern that causes: ${candidate.error_type}`;
    const domains = candidate.project_path ? extractKeywords(candidate.project_path).slice(0, 3) : [];
    const encodingContext = {
      project: candidate.project_path,
      framework: null,
      version: null,
      task_type: null,
      files: candidate.file_path ? [candidate.file_path] : [],
      error_context: candidate.error_message,
      session_id: "",
      significance_score: 0.7
    };
    try {
      const memory = createAntipatternFromExperience(
        content,
        fix,
        isCritical ? "critical" : "high",
        domains,
        null,
        // version
        extractKeywords(candidate.error_message).slice(0, 8),
        encodingContext
      );
      updateErrorCandidate(candidate.id, {
        graduated: true,
        graduated_memory_id: memory.id
      });
      graduated++;
      logger12.info("Graduated error to antipattern", {
        candidateId: candidate.id,
        memoryId: memory.id,
        occurrences: candidate.occurrences
      });
    } catch (err) {
      logger12.warn("Failed to graduate error candidate", {
        id: candidate.id,
        error: String(err)
      });
    }
  }
  return graduated;
}
function formatRecentErrors(tokenBudget) {
  const candidates = getRecentErrorCandidates(20);
  if (candidates.length === 0) return "";
  const lines = ["[Error Patterns]"];
  let tokens = estimateTokens(lines[0]);
  for (const c of candidates) {
    const fixNote = c.fix_content ? ` fix:${c.fix_content.substring(0, 60)}` : "";
    const line = `  ${c.error_type}(x${c.occurrences}): ${c.error_message.substring(0, 80)}${fixNote}`;
    const lineTokens = estimateTokens(line);
    if (tokens + lineTokens > tokenBudget) break;
    lines.push(line);
    tokens += lineTokens;
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
}

// src/engines/architecture.ts
import { readFileSync as readFileSync3, existsSync as existsSync4 } from "fs";
import { join as join4, relative as relative2, basename as basename2, extname as extname2 } from "path";
var logger13 = createLogger("architecture");
function analyzePython(content) {
  const result = {
    model_name: null,
    inherits: [],
    imports: [],
    class_name: null,
    methods: [],
    is_controller: false,
    is_wizard: false,
    is_cron: false,
    is_mixin: false
  };
  const nameMatch = content.match(/_name\s*=\s*['"]([^'"]+)['"]/);
  if (nameMatch) result.model_name = nameMatch[1];
  const classMatch = content.match(/^class\s+(\w+)\s*[:(]/m);
  if (classMatch) result.class_name = classMatch[1];
  const inheritMatch = content.match(/_inherit\s*=\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])/);
  if (inheritMatch) {
    const raw = inheritMatch[1] ?? inheritMatch[2];
    result.inherits = raw.split(",").map((s) => s.replace(/['"]/g, "").trim()).filter(Boolean);
  }
  const STDLIB = /* @__PURE__ */ new Set([
    "os",
    "sys",
    "json",
    "re",
    "typing",
    "datetime",
    "logging",
    "pathlib",
    "collections",
    "functools",
    "itertools",
    "abc",
    "copy",
    "io",
    "math",
    "hashlib",
    "uuid",
    "unittest",
    "dataclasses",
    "time",
    "subprocess",
    "shlex",
    "hmac",
    "base64",
    "secrets",
    "tempfile",
    "contextlib",
    "textwrap",
    "traceback",
    "threading",
    "shutil",
    "urllib",
    "pprint",
    "string",
    "struct",
    "zipfile"
  ]);
  const importRegex = /^(?:from\s+(\S+)\s+import|import\s+(\S+))/gm;
  let im;
  while ((im = importRegex.exec(content)) !== null) {
    const mod = (im[1] ?? im[2]).split(".")[0];
    if (!STDLIB.has(mod) && mod !== "odoo") {
      result.imports.push(im[1] ?? im[2]);
    }
  }
  const defRegex = /^\s*def\s+(\w+)\s*\(/gm;
  let dm;
  while ((dm = defRegex.exec(content)) !== null) {
    if (!dm[1].startsWith("__") || dm[1] === "__init__") {
      result.methods.push(dm[1]);
    }
  }
  result.is_controller = /class\s+\w+\s*\(\s*(?:http\.Controller|Controller)/.test(content) || /route\s*\(/.test(content);
  result.is_wizard = /TransientModel/.test(content);
  result.is_cron = /ir\.cron/.test(content) || /_cron/.test(content);
  result.is_mixin = /\.mixin/.test(result.model_name ?? "") || /AbstractModel/.test(content);
  return result;
}
function classifyPythonNode(analysis, filePath) {
  if (analysis.is_controller) return "controller";
  if (analysis.is_mixin) return "mixin";
  if (filePath.includes("/services/")) return "service";
  if (analysis.model_name) return "model";
  return "service";
}
function describePythonNode(analysis) {
  const parts = [];
  if (analysis.model_name) parts.push(analysis.model_name);
  if (analysis.inherits.length > 0) parts.push(`inherits ${analysis.inherits.join(", ")}`);
  if (analysis.methods.length > 0) {
    const key = analysis.methods.filter((m) => m.startsWith("action_") || m.startsWith("_compute_")).slice(0, 3);
    if (key.length > 0) parts.push(key.join(", "));
  }
  const desc = parts.join(" \u2014 ");
  return desc.substring(0, ARCHITECTURE.MAX_DESCRIPTION_LENGTH);
}
function analyzeTypeScript(content, filePath) {
  const result = {
    class_name: null,
    interfaces: [],
    imports: [],
    exports: [],
    functions: [],
    is_component: false,
    is_test: false,
    is_config: false
  };
  const classRegex = /(?:export\s+)?class\s+(\w+)/;
  const classMatch = classRegex.exec(content);
  if (classMatch) result.class_name = classMatch[1];
  const ifaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
  let ifm;
  while ((ifm = ifaceRegex.exec(content)) !== null) {
    result.interfaces.push(ifm[1]);
  }
  const importRegex = /import\s+(?:type\s+)?(?:(?:\{([^}]+)\}|(\w+))\s+from\s+)?['"]([^'"]+)['"]/g;
  let imp;
  while ((imp = importRegex.exec(content)) !== null) {
    const names = imp[1] ? imp[1].split(",").map((n) => n.replace(/\s+as\s+\w+/, "").trim()).filter(Boolean) : imp[2] ? [imp[2]] : [];
    const source = imp[3];
    if (!source.startsWith("node:")) {
      result.imports.push({ source, names });
    }
  }
  const exportRegex = /export\s+(?:(?:async\s+)?function|const|let|type|enum|class|interface|abstract\s+class)\s+(\w+)/g;
  let exp;
  while ((exp = exportRegex.exec(content)) !== null) {
    result.exports.push(exp[1]);
  }
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
  let fm;
  while ((fm = funcRegex.exec(content)) !== null) {
    const name = fm[1] ?? fm[2];
    if (name) result.functions.push(name);
  }
  result.is_component = /(?:Component|owl\.Component)/.test(content) || /(?:useState|useEffect|useRef|useService)/.test(content) || /\.template\s*=/.test(content) || /extends\s+Component/.test(content) || filePath.endsWith(".tsx") && /return\s*\(?\s*</.test(content);
  result.is_test = /\.(?:test|spec)\./.test(filePath) || /(?:describe|it|test)\s*\(/.test(content);
  result.is_config = /config|tsconfig|\.config\./.test(filePath);
  return result;
}
function classifyTSNode(analysis, filePath) {
  if (analysis.is_component) return "view";
  if (filePath.includes("/services/") || filePath.includes("/engines/")) return "service";
  if (filePath.includes("/storage/") || filePath.includes("/repository")) return "model";
  if (filePath.includes("/controllers/") || filePath.includes("/routes/")) return "controller";
  if (analysis.class_name) return "service";
  return "service";
}
function describeTSNode(analysis) {
  const parts = [];
  if (analysis.class_name) parts.push(analysis.class_name);
  if (analysis.interfaces.length > 0) parts.push(`interfaces: ${analysis.interfaces.slice(0, 3).join(", ")}`);
  const exportCount = analysis.exports.length;
  if (exportCount > 0) parts.push(`${exportCount} exports`);
  const desc = parts.join(" \u2014 ");
  return desc.substring(0, ARCHITECTURE.MAX_DESCRIPTION_LENGTH);
}
function inferTSRole(nodeType, filePath, analysis) {
  if (nodeType === "controller") return "api-gateway";
  if (nodeType === "view" || analysis.is_component) return "ui";
  if (filePath.includes("/storage/") || filePath.includes("/repository")) return "data-access";
  if (filePath.includes("/utils/") || filePath.includes("/helpers/")) return "infrastructure";
  if (filePath.includes("/engines/")) return "business-logic";
  if (analysis.exports.length > 10) return "orchestrator";
  return null;
}
function analyzeManifest(content) {
  const result = { name: "", depends: [] };
  const nameMatch = content.match(/['"]name['"]\s*:\s*['"]([^'"]+)['"]/);
  if (nameMatch) result.name = nameMatch[1];
  const depsMatch = content.match(/['"]depends['"]\s*:\s*\[([^\]]*)\]/s);
  if (depsMatch) {
    result.depends = depsMatch[1].split(",").map((s) => s.replace(/['"]/g, "").trim()).filter(Boolean);
  }
  return result;
}
function updateArchitectureFromFile(projectPath, filePath) {
  try {
    const absPath = filePath.startsWith(projectPath) ? filePath : join4(projectPath, filePath);
    if (!existsSync4(absPath)) return false;
    const relPath = relative2(projectPath, absPath).replace(/\\/g, "/");
    const ext = extname2(absPath).toLowerCase();
    if (basename2(absPath) === "__manifest__.py") {
      return updateFromManifest(projectPath, relPath, absPath);
    }
    if (ext === ".py") {
      return updateFromPythonFile(projectPath, relPath, absPath);
    }
    if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") {
      return updateFromTSFile(projectPath, relPath, absPath);
    }
    return false;
  } catch (err) {
    logger13.debug("Failed to update architecture from file", { filePath, error: String(err) });
    return false;
  }
}
function updateFromPythonFile(projectPath, relPath, absPath) {
  const content = readFileSync3(absPath, "utf-8");
  const analysis = analyzePython(content);
  const fileName = basename2(relPath);
  if (fileName === "__init__.py" || relPath.includes("/tests/")) return false;
  const nodeName = analysis.class_name ?? analysis.model_name;
  if (!nodeName) return false;
  const pathParts = relPath.split("/");
  const module = pathParts[0];
  const nodeType = classifyPythonNode(analysis, relPath);
  const description = describePythonNode(analysis);
  const node = upsertArchNode({
    type: nodeType,
    name: nodeName,
    module,
    file_path: relPath,
    description,
    role: inferRole(nodeType, relPath, analysis),
    project_path: projectPath
  });
  for (const parent of analysis.inherits) {
    const parentNodes = findNodeByModelName(projectPath, parent);
    for (const parentNode of parentNodes) {
      upsertArchEdge(node.id, parentNode.id, "inherits", null, ARCHITECTURE.STATIC_INITIAL_STRENGTH);
    }
  }
  for (const imp of analysis.imports) {
    if (imp.startsWith(".")) {
      const parts = imp.split(".");
      const targetModule = parts.length > 1 ? parts[1] : null;
      if (targetModule) {
        const targetNodes = getArchNodesByModule(projectPath, module).filter((n) => n.file_path.includes(targetModule));
        for (const target of targetNodes) {
          upsertArchEdge(node.id, target.id, "depends_on", null, ARCHITECTURE.STATIC_INITIAL_STRENGTH);
        }
      }
    }
  }
  const moduleNode = findArchNode(projectPath, module, "module", module);
  if (moduleNode) {
    upsertArchEdge(moduleNode.id, node.id, "contains", null, ARCHITECTURE.STATIC_INITIAL_STRENGTH);
  }
  logger13.debug("Updated architecture from Python file", { relPath, node: nodeName, type: nodeType });
  return true;
}
function updateFromTSFile(projectPath, relPath, absPath) {
  const content = readFileSync3(absPath, "utf-8");
  const analysis = analyzeTypeScript(content, relPath);
  if (analysis.is_test || analysis.is_config) return false;
  const nodeName = analysis.class_name ?? basename2(relPath, extname2(relPath));
  if (!nodeName || analysis.exports.length === 0) return false;
  const pathParts = relPath.split("/");
  const module = pathParts.length > 1 ? pathParts[0] : "root";
  const nodeType = classifyTSNode(analysis, relPath);
  const description = describeTSNode(analysis);
  const node = upsertArchNode({
    type: nodeType,
    name: nodeName,
    module,
    file_path: relPath,
    description,
    role: inferTSRole(nodeType, relPath, analysis),
    project_path: projectPath
  });
  for (const imp of analysis.imports) {
    if (imp.source.startsWith(".") || imp.source.startsWith("/")) {
      const targetNodes = getArchNodesByModule(projectPath, module).filter((n) => imp.source.includes(basename2(n.file_path, extname2(n.file_path))));
      for (const target of targetNodes) {
        upsertArchEdge(node.id, target.id, "depends_on", null, ARCHITECTURE.STATIC_INITIAL_STRENGTH);
      }
    }
  }
  logger13.debug("Updated architecture from TS/JS file", { relPath, node: nodeName, type: nodeType });
  return true;
}
function updateFromManifest(projectPath, relPath, absPath) {
  const content = readFileSync3(absPath, "utf-8");
  const analysis = analyzeManifest(content);
  const pathParts = relPath.split("/");
  const module = pathParts[0];
  const moduleNode = upsertArchNode({
    type: "module",
    name: module,
    module,
    file_path: relPath,
    description: (analysis.name || module).substring(0, ARCHITECTURE.MAX_DESCRIPTION_LENGTH),
    role: null,
    project_path: projectPath
  });
  for (const dep of analysis.depends) {
    const depNode = findArchNode(projectPath, dep, "module", dep);
    if (depNode) {
      upsertArchEdge(moduleNode.id, depNode.id, "depends_on", null, ARCHITECTURE.STATIC_INITIAL_STRENGTH);
    }
  }
  logger13.debug("Updated architecture from manifest", { module, depends: analysis.depends.length });
  return true;
}
function findNodeByModelName(projectPath, modelName) {
  const allNodes = getArchNodesByProject(projectPath);
  return allNodes.filter(
    (n) => n.name === modelName || n.description.includes(modelName)
  );
}
function getComponentGraph(projectPath, module) {
  const nodes = getArchNodesByModule(projectPath, module);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = [];
  for (const node of nodes) {
    const outgoing = getArchEdgesFrom(node.id);
    const incoming = getArchEdgesTo(node.id);
    for (const e of [...outgoing, ...incoming]) {
      if (nodeIds.has(e.source_id) || nodeIds.has(e.target_id)) {
        if (!edges.some(
          (ex) => ex.source_id === e.source_id && ex.target_id === e.target_id && ex.type === e.type
        )) {
          edges.push(e);
        }
      }
    }
  }
  return { nodes, edges };
}
function getImpactAnalysis(projectPath, filePath) {
  const relPath = filePath.startsWith(projectPath) ? relative2(projectPath, filePath).replace(/\\/g, "/") : filePath;
  const nodes = getArchNodesByFile(projectPath, relPath);
  const primaryNode = nodes[0] ?? null;
  const result = {
    file_path: relPath,
    node: primaryNode,
    callers: [],
    callees: [],
    downstream: [],
    cron_jobs: [],
    total_callers: 0,
    total_downstream: 0,
    risk_level: "low"
  };
  if (!primaryNode) return result;
  result.callers = getArchEdgesTo(primaryNode.id).filter((e) => e.type === "calls" || e.type === "depends_on" || e.type === "triggers");
  result.callees = getArchEdgesFrom(primaryNode.id).filter((e) => e.type === "calls" || e.type === "depends_on");
  const visited = /* @__PURE__ */ new Set([primaryNode.id]);
  const queue = result.callees.map((e) => ({ id: e.target_id, depth: 1 }));
  while (queue.length > 0) {
    const item = queue.shift();
    if (visited.has(item.id) || item.depth > ARCHITECTURE.MAX_IMPACT_HOPS) continue;
    visited.add(item.id);
    const node = getArchNode(item.id);
    if (node) {
      result.downstream.push(node);
      const further = getArchEdgesFrom(item.id).filter((e) => e.type === "calls" || e.type === "depends_on");
      for (const e of further) {
        queue.push({ id: e.target_id, depth: item.depth + 1 });
      }
    }
  }
  result.cron_jobs = getArchEdgesTo(primaryNode.id).filter((e) => e.type === "triggers").map((e) => getArchNode(e.source_id)).filter((n) => n !== null && n.type === "cron");
  result.total_callers = result.callers.length;
  result.total_downstream = result.downstream.length;
  const totalConnections = result.total_callers + result.total_downstream;
  if (totalConnections >= ARCHITECTURE.HIGH_RISK_THRESHOLD) {
    result.risk_level = "high";
  } else if (totalConnections >= ARCHITECTURE.MEDIUM_RISK_THRESHOLD) {
    result.risk_level = "medium";
  }
  return result;
}
function formatArchitectureInjection(projectPath, module, tokenBudget) {
  const { nodes, edges } = getComponentGraph(projectPath, module);
  if (nodes.length === 0) return "";
  const lines = [`[Architecture] ${module}:`];
  let tokens = estimateTokens(lines[0]);
  const edgeMap = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    const list = edgeMap.get(edge.source_id) ?? [];
    list.push(edge);
    edgeMap.set(edge.source_id, list);
  }
  const displayNodes = nodes.filter((n) => n.type !== "module").slice(0, ARCHITECTURE.MAX_INJECTION_NODES);
  for (const node of displayNodes) {
    const outEdges = edgeMap.get(node.id) ?? [];
    const targets = outEdges.filter((e) => e.type === "calls" || e.type === "depends_on").map((e) => {
      const target = nodes.find((n) => n.id === e.target_id);
      const label = e.label ? ` (${e.label})` : "";
      return target ? `${target.name}${label}` : null;
    }).filter(Boolean);
    let line;
    if (targets.length > 0) {
      const roleStr = node.role ? ` (${node.role})` : "";
      line = `  ${node.name}${roleStr} \u2192 ${targets.join(", ")}`;
    } else {
      line = `  ${node.name}: ${node.description || node.type}`;
    }
    const lineTokens = estimateTokens(line);
    if (tokens + lineTokens > tokenBudget) break;
    lines.push(line);
    tokens += lineTokens;
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
}
function formatImpactAnalysis(impact) {
  if (!impact.node) return "";
  const lines = [`[ENGRAM ARCH] Editing ${impact.file_path}`];
  if (impact.callers.length > 0) {
    const callerNames = impact.callers.map((e) => getArchNode(e.source_id)?.name).filter(Boolean).slice(0, 5);
    lines.push(`  Called by: ${callerNames.join(", ")}`);
  }
  if (impact.callees.length > 0) {
    const calleeNames = impact.callees.map((e) => getArchNode(e.target_id)?.name).filter(Boolean).slice(0, 5);
    lines.push(`  Calls: ${calleeNames.join(", ")}`);
  }
  if (impact.cron_jobs.length > 0) {
    lines.push(`  Cron triggers: ${impact.cron_jobs.map((n) => n.name).join(", ")}`);
  }
  if (impact.total_downstream > 0) {
    lines.push(`  Changes here may affect: ${impact.total_downstream} downstream component${impact.total_downstream > 1 ? "s" : ""}`);
  }
  if (impact.risk_level !== "low") {
    lines.push(`  Risk: ${impact.risk_level} (${impact.total_callers} callers, ${impact.total_downstream} downstream)`);
  }
  return lines.length > 1 ? lines.join("\n") : "";
}
function pruneArchitectureGraph() {
  const { decayed, pruned: edgesPruned } = decayStaleArchEdges(
    ARCHITECTURE.EDGE_DECAY_DAYS,
    ARCHITECTURE.EDGE_DECAY_FACTOR,
    ARCHITECTURE.EDGE_PRUNE_THRESHOLD
  );
  const nodesPruned = pruneOrphanArchNodes();
  logger13.info("Architecture graph pruned", {
    edges_decayed: decayed,
    edges_pruned: edgesPruned,
    nodes_pruned: nodesPruned
  });
  return { edges_decayed: decayed, edges_pruned: edgesPruned, nodes_pruned: nodesPruned };
}
function inferRole(nodeType, filePath, analysis) {
  if (nodeType === "controller") return "api-gateway";
  if (filePath.includes("/services/")) return "business-logic";
  if (filePath.includes("/utils/") || filePath.includes("/helpers/")) return "infrastructure";
  if (analysis.is_cron) return "scheduler";
  const hasActions = analysis.methods.some((m) => m.startsWith("action_"));
  const hasCompute = analysis.methods.some((m) => m.startsWith("_compute_"));
  if (hasActions && analysis.methods.length > 5) return "orchestrator";
  if (hasCompute && !hasActions) return "data-access";
  return null;
}

// src/engines/curator.ts
import { existsSync as existsSync5, readFileSync as readFileSync4, writeFileSync, realpathSync as realpathSync2, lstatSync as lstatSync2, renameSync } from "fs";
import { join as join5, dirname as dirname3 } from "path";
import { homedir as homedir3 } from "os";
var logger14 = createLogger("curator");
var lastBridgeWriteTime = 0;
function discoverMemoryDir(cwd) {
  const envDir = process.env.CLAUDE_MEMORY_DIR;
  if (envDir && existsSync5(envDir)) {
    return envDir;
  }
  const home = homedir3();
  const projectsBase = join5(home, ".claude", "projects");
  if (!existsSync5(projectsBase)) {
    return null;
  }
  const mangled = manglePath(cwd);
  const memoryDir = join5(projectsBase, mangled, "memory");
  if (existsSync5(memoryDir)) {
    return memoryDir;
  }
  let parent = dirname3(cwd);
  let depth = 0;
  while (parent !== cwd && depth < 5) {
    const parentMangled = manglePath(parent);
    const parentMemoryDir = join5(projectsBase, parentMangled, "memory");
    if (existsSync5(parentMemoryDir)) {
      return parentMemoryDir;
    }
    cwd = parent;
    parent = dirname3(cwd);
    depth++;
  }
  return null;
}
function manglePath(p) {
  return p.replace(/\//g, "-");
}
function composeBridgeContent(options) {
  const content = {
    warnings: [],
    context: {
      domain: options.domain,
      version: options.version,
      project: options.project,
      task: options.task,
      files_modified: 0,
      recent_files: options.recent_files?.slice(0, 10) ?? [],
      recent_errors: options.recent_errors?.slice(0, 3) ?? []
    },
    cognitive: {
      approach: options.cognitive?.approach ?? null,
      phase: options.cognitive?.phase ?? null,
      hypothesis: options.cognitive?.hypothesis ?? null,
      discovery: options.cognitive?.discovery ?? null
    },
    active_decisions: [],
    lessons: [],
    insights: [],
    codemap_summary: null,
    architecture_summary: null,
    stats: { total_memories: 0, total_antipatterns: 0, total_schemas: 0 },
    generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const stats = getStats();
    content.stats = {
      total_memories: stats.total_memories,
      total_antipatterns: stats.by_type.antipattern ?? 0,
      total_schemas: stats.total_schemas
    };
  } catch (e) {
    logger14.error("Bridge stats failed", { error: String(e) });
  }
  try {
    const antipatterns = getAntipatterns(options.domain ?? void 0);
    const criticalOrHigh = antipatterns.filter((m) => {
      const td = isAntipatternData(m.type_data) ? m.type_data : null;
      return td?.severity === "critical" || td?.severity === "high";
    }).slice(0, CURATOR.MAX_BRIDGE_WARNINGS);
    for (const m of criticalOrHigh) {
      const td = isAntipatternData(m.type_data) ? m.type_data : null;
      content.warnings.push({
        severity: td?.severity ?? "high",
        text: m.content.substring(0, 200),
        fix: td?.fix ?? null
      });
    }
  } catch (e) {
    logger14.error("Bridge antipatterns failed", { error: String(e) });
  }
  try {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CURATOR.MAX_INSIGHT_AGE_DAYS);
    const cutoffIso = cutoffDate.toISOString();
    const candidates = getRecentMemories(50).filter(
      (m) => m.confidence >= 0.6 && m.created_at >= cutoffIso && m.type !== "antipattern" && // antipatterns already in warnings
      !isRecallNoise(m.content, m.type, m.tags)
    );
    const prioritized = candidates.sort((a, b) => {
      const typeOrder = (m) => {
        if (m.type === "semantic") return 0;
        if (m.tags.includes("synthesis")) return 1;
        if (m.type === "procedural") return 2;
        if (m.type === "episodic" && m.tags.includes("has_lesson")) return 3;
        return 4;
      };
      const diff = typeOrder(a) - typeOrder(b);
      if (diff !== 0) return diff;
      return b.confidence - a.confidence;
    });
    for (const m of prioritized.slice(0, CURATOR.MAX_BRIDGE_INSIGHTS)) {
      content.insights.push({
        text: m.content.substring(0, 200),
        type: m.type,
        confidence: m.confidence
      });
    }
  } catch (e) {
    logger14.error("Bridge insights failed", { error: String(e) });
  }
  try {
    if (options.domain) {
      const decisions = getDecisionMemoriesForDomain(options.domain, 5);
      for (const m of decisions) {
        const td = m.type_data;
        if (td && "kind" in td && td.kind === "decision") {
          const d = td;
          content.active_decisions.push({
            chosen: d.chosen?.substring(0, 150) ?? "",
            rationale: d.rationale?.substring(0, 150) ?? "",
            type: d.decision_type ?? "approach"
          });
        }
      }
    }
  } catch (e) {
    logger14.error("Bridge decisions failed", { error: String(e) });
  }
  try {
    const recentWithLessons = getRecentMemories(50).filter(
      (m) => m.type === "episodic" && m.tags.includes("has_lesson") && m.confidence >= 0.5 && !isRecallNoise(m.content, m.type, m.tags)
    ).slice(0, 5);
    for (const m of recentWithLessons) {
      if (isEpisodicData(m.type_data) && m.type_data.lesson) {
        content.lessons.push({
          text: m.type_data.lesson.substring(0, 200),
          confidence: m.confidence
        });
      }
    }
  } catch (e) {
    logger14.error("Bridge lessons failed", { error: String(e) });
  }
  try {
    const codemapText = formatProjectMap(options.cwd, 200);
    if (codemapText) {
      content.codemap_summary = codemapText;
    }
  } catch (e) {
    logger14.error("Bridge codemap failed", { error: String(e) });
  }
  try {
    const domain = options.domain;
    if (domain) {
      const archText = formatArchitectureInjection(options.cwd, domain, 200);
      if (archText) {
        content.architecture_summary = archText;
      }
    }
  } catch (e) {
    logger14.error("Bridge architecture failed", { error: String(e) });
  }
  try {
    if (options.domain) {
      const synthesis = synthesizeDomainKnowledge(options.domain);
      if (synthesis) {
        const narrative = composeKnowledgeNarrative(synthesis);
        if (narrative) {
          content.insights.push({
            text: `[Synthesis] ${narrative.substring(0, 800)}`,
            type: "synthesis",
            confidence: 0.7
          });
        }
      }
    }
  } catch (e) {
    logger14.error("Bridge synthesis failed", { error: String(e) });
  }
  return content;
}
function formatBridgeMarkdown(content) {
  const lines = [];
  const ctx = content.context;
  lines.push(`# Project: ${ctx.project ?? "unknown"}`);
  lines.push(`> Last updated: ${content.generated_at}`);
  lines.push("");
  lines.push("## What You're Working On");
  if (ctx.task) lines.push(`- **Task:** ${ctx.task}`);
  if (content.cognitive.approach) lines.push(`- **Approach:** ${content.cognitive.approach}`);
  if (content.cognitive.phase) lines.push(`- **Phase:** ${content.cognitive.phase}`);
  if (content.cognitive.hypothesis) lines.push(`- **Hypothesis:** ${content.cognitive.hypothesis}`);
  if (content.cognitive.discovery) lines.push(`- **Discovery:** ${content.cognitive.discovery}`);
  if (ctx.domain) lines.push(`- **Domain:** ${ctx.domain}${ctx.version ? ` v${ctx.version}` : ""}`);
  if (ctx.recent_files.length > 0) lines.push(`- **Files:** ${ctx.recent_files.slice(0, 8).join(", ")}`);
  if (ctx.recent_errors.length > 0) {
    lines.push(`- **Errors:** ${ctx.recent_errors.length}`);
    for (const err of ctx.recent_errors.slice(0, 2)) {
      lines.push(`  - ${err.substring(0, 120)}`);
    }
  }
  lines.push("");
  if (content.warnings.length > 0) {
    lines.push("## Watch Out For");
    for (const w of content.warnings) {
      const fixHint = w.fix ? ` \u2192 ${w.fix}` : "";
      lines.push(`- **[${w.severity.toUpperCase()}]** ${w.text}${fixHint}`);
    }
    lines.push("");
  }
  lines.push("## What You Know");
  if (content.architecture_summary) {
    lines.push(content.architecture_summary);
    lines.push("");
  }
  if (content.codemap_summary) {
    lines.push(content.codemap_summary);
    lines.push("");
  }
  const synthInsights = content.insights.filter((i) => i.type === "synthesis");
  if (synthInsights.length > 0) {
    for (const ins of synthInsights) {
      lines.push(ins.text);
    }
    lines.push("");
  }
  const nonSynth = content.insights.filter((i) => i.type !== "synthesis");
  if (nonSynth.length > 0) {
    for (const ins of nonSynth) {
      lines.push(`- ${ins.text}`);
    }
    lines.push("");
  }
  if (content.active_decisions.length > 0) {
    lines.push("## Active Decisions");
    for (const d of content.active_decisions) {
      lines.push(`- **${d.type}:** ${d.chosen}`);
      if (d.rationale) lines.push(`  Rationale: ${d.rationale}`);
    }
    lines.push("");
  }
  if (content.lessons.length > 0) {
    lines.push("## Key Lessons");
    for (const l of content.lessons) {
      lines.push(`- ${l.text}`);
    }
    lines.push("");
  }
  lines.push("## Memory");
  lines.push(`${content.stats.total_memories} memories | ${content.stats.total_antipatterns} antipatterns | ${content.stats.total_schemas} schemas`);
  lines.push("Use `engram_recall` for deeper search, `engram_encode`/`engram_learn` to store knowledge.");
  return lines.join("\n");
}
function writeContextBridge(memoryDir, content) {
  const now3 = Date.now();
  if (now3 - lastBridgeWriteTime < CURATOR.BRIDGE_MIN_INTERVAL_MS) {
    logger14.info("Bridge write skipped (rate limited)");
    return false;
  }
  try {
    const realDir = realpathSync2(memoryDir);
    if (existsSync5(join5(realDir, CURATOR.BRIDGE_FILENAME))) {
      const stat = lstatSync2(join5(realDir, CURATOR.BRIDGE_FILENAME));
      if (stat.isSymbolicLink()) {
        logger14.warn("Bridge file is a symlink \u2014 refusing to write");
        return false;
      }
    }
    const markdown = formatBridgeMarkdown(content);
    const filePath = join5(realDir, CURATOR.BRIDGE_FILENAME);
    writeFileSync(filePath, markdown, "utf-8");
    lastBridgeWriteTime = now3;
    logger14.info("Bridge file written", { path: filePath, tokens: estimateTokens(markdown) });
    return true;
  } catch (e) {
    logger14.error("Bridge file write failed", { error: String(e) });
    return false;
  }
}
function updateBridgeInsights(memoryDir, newInsights) {
  const now3 = Date.now();
  if (now3 - lastBridgeWriteTime < CURATOR.BRIDGE_MIN_INTERVAL_MS) {
    return false;
  }
  const filePath = join5(memoryDir, CURATOR.BRIDGE_FILENAME);
  if (!existsSync5(filePath)) {
    return false;
  }
  try {
    let content = readFileSync4(filePath, "utf-8");
    const filtered = newInsights.filter(
      (ins) => ins.confidence >= 0.6 && !isRecallNoise(ins.text, ins.type)
    );
    const lessonLines = ["## Key Lessons"];
    for (const ins of filtered.slice(0, CURATOR.MAX_BRIDGE_INSIGHTS)) {
      lessonLines.push(`- ${ins.text}`);
    }
    const lessonsRegex = /## Key Lessons[\s\S]*?(?=## Memory|## Active Decisions|$)/;
    const newSection = lessonLines.join("\n") + "\n\n";
    if (lessonsRegex.test(content)) {
      content = content.replace(lessonsRegex, newSection);
    } else {
      content = content.replace("## Memory", newSection + "## Memory");
    }
    content = content.replace(
      /(?:Last updated|Updated): .+$/m,
      `Last updated: ${(/* @__PURE__ */ new Date()).toISOString()}`
    );
    writeFileSync(filePath, content, "utf-8");
    lastBridgeWriteTime = now3;
    logger14.info("Bridge insights updated", { count: newInsights.length });
    return true;
  } catch (e) {
    logger14.error("Bridge insights update failed", { error: String(e) });
    return false;
  }
}
function ensureMemoryMdPointer(memoryDir) {
  const memoryMdPath = join5(memoryDir, "MEMORY.md");
  if (!existsSync5(memoryMdPath)) {
    return;
  }
  try {
    const content = readFileSync4(memoryMdPath, "utf-8");
    const pointerMarker = "## Engram Context Bridge";
    if (content.includes(pointerMarker)) {
      return;
    }
    const pointer = [
      "",
      "## Engram Context Bridge",
      `Engram maintains a curated context file at \`${CURATOR.BRIDGE_FILENAME}\` in this directory.`,
      "It contains active warnings, current context, architecture summary, and recent insights.",
      "This file is auto-updated by Engram and survives context compaction.",
      ""
    ].join("\n");
    writeFileSync(memoryMdPath, content + pointer, "utf-8");
    logger14.info("MEMORY.md pointer added");
  } catch (e) {
    logger14.error("MEMORY.md pointer failed", { error: String(e) });
  }
}
var MANAGED_START = "<!-- [MANAGED BY ENGRAM \u2014 do not edit between markers] -->";
var MANAGED_END = "<!-- [END ENGRAM MANAGEMENT] -->";
var MODELS_HEADER = "## Mental Models (Auto-Generated by Engram)";
function formatMentalModelMarkdown(model) {
  const lines = [];
  lines.push(`### Domain: ${model.domain}`);
  lines.push(MANAGED_START);
  lines.push("");
  lines.push(`**Understanding:** ${model.understanding}`);
  if (model.principles.length > 0) {
    lines.push("");
    lines.push("**Principles:**");
    for (const p of model.principles) {
      lines.push(`- ${p.statement} \u2014 ${p.rationale} (evidence: ${p.evidence_count})`);
    }
  }
  if (model.patterns.length > 0) {
    lines.push("");
    lines.push("**Patterns:**");
    for (const p of model.patterns) {
      lines.push(`- ${p.name}: ${p.description} (freq: ${p.frequency})`);
    }
  }
  if (model.pitfalls.length > 0) {
    lines.push("");
    lines.push("**Pitfalls:**");
    for (const p of model.pitfalls) {
      lines.push(`- ${p}`);
    }
  }
  if (model.trajectory) {
    lines.push("");
    lines.push(`**Trajectory:** ${model.trajectory}`);
  }
  lines.push("");
  lines.push(`*Confidence: ${model.confidence} | Memories: ${model.memory_count} | Updated: ${model.updated_at}*`);
  lines.push("");
  lines.push(MANAGED_END);
  return lines.join("\n");
}
function updateMemoryMdMentalModels(memoryDir, models) {
  const memoryMdPath = join5(memoryDir, "MEMORY.md");
  if (!existsSync5(memoryMdPath)) return false;
  try {
    const stat = lstatSync2(memoryMdPath);
    if (stat.isSymbolicLink()) {
      logger14.warn("MEMORY.md is a symlink \u2014 refusing to write");
      return false;
    }
    if (stat.size > 1e5) {
      logger14.warn("MEMORY.md too large for managed updates", { size: stat.size });
      return false;
    }
    const content = readFileSync4(memoryMdPath, "utf-8");
    const modelSections = models.map((m) => formatMentalModelMarkdown(m)).join("\n");
    const managedBlock = `${MODELS_HEADER}

${modelSections}`;
    let newContent;
    if (content.includes(MODELS_HEADER)) {
      const startIdx = content.indexOf(MODELS_HEADER);
      const afterHeader = content.indexOf(MANAGED_END, startIdx);
      let lastEnd = afterHeader;
      let searchFrom = afterHeader;
      while (searchFrom >= 0) {
        const next = content.indexOf(MANAGED_END, searchFrom + MANAGED_END.length);
        if (next < 0) break;
        if (content.indexOf(MANAGED_START, searchFrom + MANAGED_END.length) < next) {
          lastEnd = next;
          searchFrom = next;
        } else {
          break;
        }
      }
      if (lastEnd >= 0) {
        const endOfManaged = lastEnd + MANAGED_END.length;
        newContent = content.substring(0, startIdx) + managedBlock + content.substring(endOfManaged);
      } else {
        const endOfLine = content.indexOf("\n", startIdx);
        newContent = content.substring(0, startIdx) + managedBlock + content.substring(endOfLine);
      }
    } else {
      const bridgeIdx = content.indexOf("## Engram Context Bridge");
      if (bridgeIdx >= 0) {
        newContent = content.substring(0, bridgeIdx) + managedBlock + "\n\n" + content.substring(bridgeIdx);
      } else {
        newContent = content + "\n\n" + managedBlock + "\n";
      }
    }
    const tmpPath = memoryMdPath + ".tmp";
    writeFileSync(tmpPath, newContent, "utf-8");
    renameSync(tmpPath, memoryMdPath);
    logger14.info("MEMORY.md mental models updated", { domains: models.length });
    return true;
  } catch (e) {
    logger14.error("MEMORY.md mental model update failed", { error: String(e) });
    return false;
  }
}
var MASTERY_SCORES = {
  novice: 0,
  advanced_beginner: 0.2,
  competent: 0.4,
  proficient: 0.6,
  expert: 0.9
};
function getDomainMasteryScore(domain) {
  if (!domain) return 0;
  try {
    const profiles = getMasteryForDomain(domain);
    if (profiles.length === 0) return 0;
    const total = profiles.reduce((sum, p) => sum + (MASTERY_SCORES[p.level] ?? 0), 0);
    return total / profiles.length;
  } catch {
    return 0;
  }
}
function determineInjectionLevel(domain, totalTurns, recentErrors, isPostCompact) {
  if (isPostCompact && ADAPTIVE.POST_COMPACT_ALWAYS_HIGH) {
    return "high";
  }
  if (!domain) {
    return "high";
  }
  if (recentErrors.length > 0) {
    return "high";
  }
  const masteryScore = getDomainMasteryScore(domain);
  if (masteryScore === 0 && ADAPTIVE.NEW_DOMAIN_ALWAYS_HIGH) {
    return "high";
  }
  if (masteryScore < ADAPTIVE.MASTERY_MEDIUM_THRESHOLD) {
    return "high";
  }
  if (masteryScore >= ADAPTIVE.MASTERY_LOW_THRESHOLD && totalTurns >= ADAPTIVE.MIN_TURNS_FOR_REDUCTION) {
    return "low";
  }
  return "medium";
}
function refreshBridge(options) {
  const memoryDir = discoverMemoryDir(options.cwd);
  if (!memoryDir) {
    logger14.info("No Claude memory dir found \u2014 bridge skipped");
    return false;
  }
  try {
    const content = composeBridgeContent(options);
    const success = writeContextBridge(memoryDir, content);
    if (success) {
      ensureMemoryMdPointer(memoryDir);
    }
    return success;
  } catch (e) {
    logger14.error("Bridge refresh failed", { error: String(e) });
    return false;
  }
}
function refreshBridgeInsights(cwd, insights) {
  const memoryDir = discoverMemoryDir(cwd);
  if (!memoryDir) return false;
  return updateBridgeInsights(memoryDir, insights);
}

// src/engines/versioning.ts
function resolveVersionChain(domain, version) {
  return getVersionChain(domain, version);
}
function getActiveOverrides(domain, version) {
  const chain = resolveVersionChain(domain, version);
  const allOverrides = [];
  const seen = /* @__PURE__ */ new Set();
  for (const ver of chain) {
    for (const override of ver.overrides) {
      const key = `${override.type}:${override.old ?? ""}:${override.new_value ?? ""}:${override.feature ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        allOverrides.push(override);
      }
    }
  }
  return allOverrides;
}
function getVersionKnowledge(domain, version, limit = 50) {
  const chain = resolveVersionChain(domain, version);
  const overrides = getActiveOverrides(domain, version);
  const chainVersions = chain.map((v) => v.version);
  const allMemories = getMemoriesByDomain(domain, limit * 2);
  const versionSet = new Set(chainVersions);
  const relevant = allMemories.filter((mem) => {
    if (!mem.version) return true;
    return versionSet.has(mem.version);
  });
  relevant.sort((a, b) => {
    const aIdx = a.version ? chainVersions.indexOf(a.version) : chainVersions.length;
    const bIdx = b.version ? chainVersions.indexOf(b.version) : chainVersions.length;
    return aIdx - bIdx;
  });
  return {
    memories: relevant.slice(0, limit),
    overrides,
    chain: chainVersions
  };
}
function registerVersion(domain, version, parentVersion, overrides = []) {
  const timestamp = now();
  return createVersion({
    domain,
    version,
    parent_version: parentVersion,
    overrides,
    antipatterns: [],
    created_at: timestamp,
    updated_at: timestamp
  });
}
function detectVersionFromManifest(manifestContent, domain) {
  switch (domain.toLowerCase()) {
    case "odoo": {
      const versionMatch = manifestContent.match(/['"]version['"]:\s*['"](\d+)\.\d+/);
      if (versionMatch) return versionMatch[1];
      break;
    }
    case "node":
    case "nodejs": {
      const engineMatch = manifestContent.match(/"node":\s*"[>=^~]*(\d+)/);
      if (engineMatch) return engineMatch[1];
      break;
    }
    case "python": {
      const pyMatch = manifestContent.match(/python_requires\s*=\s*['"][>=]*(\d+\.\d+)/);
      if (pyMatch) return pyMatch[1];
      break;
    }
    case "react": {
      const reactMatch = manifestContent.match(/"react":\s*"[^"]*?(\d+)\./);
      if (reactMatch) return reactMatch[1];
      break;
    }
    default:
      break;
  }
  return null;
}
function getMigrationKnowledge(domain, fromVersion, toVersion) {
  const toChain = resolveVersionChain(domain, toVersion);
  const fromChain = resolveVersionChain(domain, fromVersion);
  const fromSet = new Set(fromChain.map((v) => v.version));
  const newVersions = toChain.filter((v) => !fromSet.has(v.version));
  const allOverrides = [];
  for (const ver of newVersions) {
    allOverrides.push(...ver.overrides);
  }
  const breakingChanges = allOverrides.filter(
    (o) => o.type === "breaking_change" || o.type === "removal" || o.type === "deprecation"
  );
  return { overrides: allOverrides, breakingChanges };
}

// src/engines/decay.ts
function isDecayExempt(memory) {
  if (memory.type === "antipattern") return true;
  if (memory.pinned) return true;
  if (memory.storage_tier === "cold") return true;
  return false;
}
function evaluateDecayCandidates(memories, getConnectionCountFn, config) {
  const candidates = [];
  for (const memory of memories) {
    if (isDecayExempt(memory)) continue;
    const connectionCount = getConnectionCountFn(memory.id);
    const durability = calculateDurability(memory.encoding_strength, memory.reinforcement);
    const stability = calculateStability(
      durability,
      connectionCount,
      memory.access_count,
      config.base_stability,
      config.connection_bonus,
      config.retrieval_bonus
    );
    const lastRelevantTime = memory.last_accessed ?? memory.created_at;
    const elapsed = daysElapsed(lastRelevantTime, now());
    const retention = calculateRetention(elapsed, stability);
    const shouldPrune = retention < config.prune_threshold;
    let suggestedAction = "keep";
    if (shouldPrune) {
      suggestedAction = config.archive_instead_of_delete ? "archive" : "delete";
    }
    candidates.push({
      memory,
      retention,
      stability,
      connectionCount,
      shouldPrune,
      suggestedAction
    });
  }
  candidates.sort((a, b) => a.retention - b.retention);
  return candidates;
}
function retrievalReinforcement(currentReinforcement) {
  const boost = 0.15 / (1 + currentReinforcement * 0.1);
  return currentReinforcement + boost;
}
function adjustConfidence(currentConfidence, validated) {
  if (validated) {
    const boost = 0.05 * (1 - currentConfidence);
    return Math.min(currentConfidence + boost, 1);
  } else {
    return Math.max(currentConfidence * 0.85, 0.05);
  }
}
function calculateConnectionDecay(currentStrength, daysSinceActivated, decayRate = CONNECTION_DECAY.DECAY_RATE, gracePeriodDays = CONNECTION_DECAY.GRACE_PERIOD_DAYS) {
  if (daysSinceActivated <= gracePeriodDays) return currentStrength;
  const effectiveDays = daysSinceActivated - gracePeriodDays;
  return currentStrength * Math.pow(1 - decayRate, effectiveDays);
}
function evaluateConnectionDecay(connections) {
  const currentTime = now();
  return connections.map((conn) => {
    const lastTime = conn.last_activated ?? conn.created_at;
    const days = daysElapsed(lastTime, currentTime);
    const decayedStrength = calculateConnectionDecay(conn.strength, days);
    return {
      connection: conn,
      daysSinceActivated: days,
      decayedStrength,
      shouldPrune: decayedStrength < CONNECTION_DECAY.PRUNE_THRESHOLD
    };
  });
}
function calculateReviewInterval(accessCount, confidence) {
  if (accessCount < SPACED_REPETITION.MIN_ACCESS_FOR_SCHEDULING) {
    return SPACED_REPETITION.BASE_INTERVAL;
  }
  const raw = SPACED_REPETITION.BASE_INTERVAL * Math.pow(SPACED_REPETITION.INTERVAL_MULTIPLIER, accessCount) * confidence;
  return Math.min(raw, SPACED_REPETITION.MAX_REVIEW_INTERVAL);
}
function getReviewSchedule(memory) {
  const interval = calculateReviewInterval(memory.access_count, memory.confidence);
  const lastAccess = memory.last_accessed ?? memory.created_at;
  const lastAccessDate = new Date(lastAccess);
  const nextReviewDate = new Date(lastAccessDate.getTime() + interval * 24 * 60 * 60 * 1e3);
  const overdueDays = daysElapsed(nextReviewDate.toISOString(), now());
  const priority = overdueDays > 0 ? overdueDays / Math.max(interval, 0.1) : 0;
  return {
    memory_id: memory.id,
    next_review_date: nextReviewDate.toISOString(),
    interval_days: interval,
    access_count: memory.access_count,
    confidence: memory.confidence,
    overdue_days: overdueDays,
    priority
  };
}
function spacedRepetitionBoost(currentReinforcement, isOverdue) {
  const boost = isOverdue ? SPACED_REPETITION.ACCESS_BOOST * 1.2 : SPACED_REPETITION.ACCESS_BOOST;
  return currentReinforcement * boost;
}
function reconsolidate(confidence, reinforcement, confirmed) {
  if (confirmed) {
    return {
      confidence: Math.min(1, confidence * SPACED_REPETITION.CONFIRMATION_BOOST),
      reinforcement: reinforcement * SPACED_REPETITION.ACCESS_BOOST
    };
  }
  return {
    confidence: Math.max(0.01, confidence * SPACED_REPETITION.CONTRADICTION_DECAY),
    reinforcement
  };
}

// src/engines/mental-model.ts
var logger15 = createLogger("mental-model");
function composeUnderstanding(domain, memoryCount, topSemantics, masteryScore, episodicWithLessons = [], allMemories = []) {
  const masteryLabel = masteryScore >= 0.6 ? "proficient" : masteryScore >= 0.4 ? "competent" : masteryScore >= 0.2 ? "developing" : "early";
  const sessionNarratives = allMemories.filter((m) => m.tags.includes("session-narrative"));
  const sessionCount = sessionNarratives.length;
  const antipatternCount = allMemories.filter((m) => m.type === "antipattern").length;
  const semanticCount = allMemories.filter((m) => m.type === "semantic").length;
  const validatedLessonCount = episodicWithLessons.filter(
    (m) => isEpisodicData(m.type_data) && m.type_data.lesson_validated
  ).length;
  const successCount = allMemories.filter(
    (m) => isEpisodicData(m.type_data) && m.type_data.outcome === "positive"
  ).length;
  const failureCount = allMemories.filter(
    (m) => isEpisodicData(m.type_data) && m.type_data.outcome === "negative"
  ).length;
  if (sessionCount >= MENTAL_MODEL.MIN_SESSIONS_FOR_RICH) {
    const parts = [];
    const depthParts = [`${sessionCount} sessions`];
    if (validatedLessonCount > 0) depthParts.push(`${validatedLessonCount} validated lessons`);
    if (antipatternCount > 0) depthParts.push(`${antipatternCount} known pitfalls`);
    parts.push(`${domain} \u2014 ${depthParts.join(", ")}. ${masteryLabel} mastery.`);
    const knowledgeAreas = [];
    for (const m of topSemantics.slice(0, 3)) {
      const summary = m.summary ?? m.content;
      const dot = summary.indexOf(".");
      const snippet = dot > 0 && dot < 100 ? summary.substring(0, dot + 1) : summary.substring(0, 100);
      const cleaned = snippet.trim();
      if (cleaned.length >= 15) knowledgeAreas.push(cleaned);
    }
    if (knowledgeAreas.length > 0) {
      parts.push(`Know: ${knowledgeAreas.join("; ")}`);
    }
    const recentNarratives = sessionNarratives.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
    const recentFocus = [];
    const noiseTaskPatterns = ["session_end", "No task", "session_start"];
    for (const m of recentNarratives) {
      if (!isEpisodicData(m.type_data)) continue;
      const task = m.type_data.context?.task;
      if (task && !noiseTaskPatterns.includes(task) && !recentFocus.includes(task)) {
        recentFocus.push(task);
      } else if (recentFocus.length < 3) {
        const content = m.content;
        const workedOnMatch = content.match(/^Worked on:\s*(.+?)(?:\.|$)/);
        if (workedOnMatch) {
          const topic = workedOnMatch[1].trim().substring(0, 60);
          if (topic.length >= 10 && !recentFocus.includes(topic)) {
            recentFocus.push(topic);
          }
        }
      }
    }
    if (recentFocus.length > 0) {
      parts.push(`Recent: ${recentFocus.slice(0, 3).join("; ")}`);
    }
    const validatedLessons = episodicWithLessons.filter((m) => isEpisodicData(m.type_data) && m.type_data.lesson_validated).sort((a, b) => b.confidence + b.reinforcement - (a.confidence + a.reinforcement));
    const lessonSnippets = [];
    for (const m of validatedLessons.slice(0, 3)) {
      if (!isEpisodicData(m.type_data)) continue;
      const lesson = cleanLesson(m.type_data.lesson ?? "");
      if (lesson.length < 20) continue;
      const dot = lesson.indexOf(".");
      const snippet = dot > 0 && dot < 80 ? lesson.substring(0, dot + 1) : lesson.substring(0, 80);
      if (!lessonSnippets.includes(snippet.trim())) lessonSnippets.push(snippet.trim());
    }
    if (lessonSnippets.length === 0) {
      for (const m of episodicWithLessons.slice(0, 2)) {
        if (!isEpisodicData(m.type_data)) continue;
        const lesson = cleanLesson(m.type_data.lesson ?? "");
        if (lesson.length < 20) continue;
        const dot = lesson.indexOf(".");
        const snippet = dot > 0 && dot < 80 ? lesson.substring(0, dot + 1) : lesson.substring(0, 80);
        lessonSnippets.push(snippet.trim());
      }
    }
    if (lessonSnippets.length > 0) {
      parts.push(`Learned: ${lessonSnippets.join("; ")}`);
    }
    if (successCount + failureCount >= 3) {
      parts.push(`Track: ${successCount} successes, ${failureCount} failures.`);
    }
    return parts.join(" ").substring(0, MENTAL_MODEL.UNDERSTANDING_MAX_LENGTH);
  }
  const areas = [];
  for (const m of topSemantics) {
    const summary = m.summary ?? m.content;
    const dot = summary.indexOf(".");
    const snippet = dot > 0 && dot < 80 ? summary.substring(0, dot + 1) : summary.substring(0, 80);
    areas.push(snippet.trim());
  }
  for (const m of episodicWithLessons.slice(0, 2)) {
    if (!isEpisodicData(m.type_data)) continue;
    const lesson = cleanLesson(m.type_data.lesson ?? "");
    if (lesson.length < 20) continue;
    const dot = lesson.indexOf(".");
    const snippet = dot > 0 && dot < 70 ? lesson.substring(0, dot + 1) : lesson.substring(0, 70);
    areas.push(`Learned: ${snippet.trim()}`);
  }
  const areaText = areas.length > 0 ? ` Covers: ${areas.join("; ")}` : "";
  const text = `${domain} \u2014 ${memoryCount} memories, ${masteryLabel} mastery.${areaText}`;
  return text.substring(0, MENTAL_MODEL.UNDERSTANDING_MAX_LENGTH);
}
function cleanLesson(raw) {
  let s = raw;
  s = s.replace(/^User correction:\s*/i, "");
  s = s.replace(/^\d+[.)]\s*/, "");
  s = s.replace(/^(Decision|Delegated):\s*/i, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
function extractPrinciples(decisions, episodicMemories) {
  const principles = [];
  if (decisions.length >= MENTAL_MODEL.MIN_DECISIONS_FOR_PRINCIPLES) {
    const groups = /* @__PURE__ */ new Map();
    for (const m of decisions) {
      if (!isDecisionData(m.type_data)) continue;
      const key = m.type_data.decision_type ?? "general";
      const group = groups.get(key) ?? [];
      group.push(m);
      groups.set(key, group);
    }
    for (const [, group] of groups) {
      const best = group.reduce((a, b) => a.confidence > b.confidence ? a : b);
      if (!isDecisionData(best.type_data)) continue;
      const td = best.type_data;
      const statement = td.chosen.substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH);
      const rationale = td.rationale.substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH);
      if (statement && rationale) {
        principles.push({
          statement,
          rationale,
          evidence_count: group.length
        });
      }
    }
  }
  const lessonMemories = episodicMemories.filter((m) => {
    if (!isEpisodicData(m.type_data)) return false;
    const td = m.type_data;
    return td.lesson && td.lesson.length >= 20 && td.lesson_validated && m.confidence >= 0.6;
  });
  const lessonGroups = [];
  for (const m of lessonMemories) {
    if (!isEpisodicData(m.type_data)) continue;
    const mLesson = m.type_data.lesson ?? "";
    let placed = false;
    for (const group of lessonGroups) {
      const rep = group[0];
      if (!isEpisodicData(rep.type_data)) continue;
      const repLesson = rep.type_data.lesson ?? "";
      const sim = keywordSimilarity(mLesson, repLesson);
      if (sim >= 0.3) {
        group.push(m);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lessonGroups.push([m]);
    }
  }
  for (const group of lessonGroups) {
    const best = group.reduce((a, b) => {
      const scoreA = a.confidence + (a.created_at > b.created_at ? 0.1 : 0);
      const scoreB = b.confidence + (b.created_at > a.created_at ? 0.1 : 0);
      return scoreA >= scoreB ? a : b;
    });
    if (!isEpisodicData(best.type_data) || !best.type_data.lesson) continue;
    const lesson = cleanLesson(best.type_data.lesson);
    if (lesson.length < 15) continue;
    const detail = best.type_data.outcome_detail ?? best.content.substring(0, 100);
    principles.push({
      statement: lesson.substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH),
      rationale: cleanLesson(detail).substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH),
      evidence_count: group.length
    });
  }
  if (principles.length < MENTAL_MODEL.MAX_PRINCIPLES) {
    const strongUnvalidated = episodicMemories.filter((m) => {
      if (!isEpisodicData(m.type_data)) return false;
      const td = m.type_data;
      return td.lesson && td.lesson.length >= 20 && !td.lesson_validated && m.confidence >= 0.65 && m.reinforcement >= 2;
    });
    for (const m of strongUnvalidated.slice(0, 3)) {
      if (!isEpisodicData(m.type_data) || !m.type_data.lesson) continue;
      const lesson = cleanLesson(m.type_data.lesson);
      if (lesson.length < 15) continue;
      if (principles.some((p) => p.statement === lesson.substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH))) continue;
      principles.push({
        statement: lesson.substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH),
        rationale: cleanLesson(m.type_data.outcome_detail ?? m.content).substring(0, MENTAL_MODEL.PRINCIPLE_MAX_LENGTH),
        evidence_count: 1
      });
    }
  }
  principles.sort((a, b) => b.evidence_count - a.evidence_count);
  return principles.slice(0, MENTAL_MODEL.MAX_PRINCIPLES);
}
function isNoisySchema(name, description) {
  const combined = `${name} ${description ?? ""}`;
  const noisyPatterns = [
    /hypothesis.*root/i,
    /\.claude/i,
    /opt.*engram.*need/i,
    /error.*resolved.*investigation/i,
    /subagent.*completed/i,
    /^[\w]+:[\w]+_\./,
    // path-based: "node:hypothesis_root_.claude"
    /^[\w]+:(opt|src|dist|node_modules)/i
  ];
  return noisyPatterns.some((p) => p.test(combined));
}
function extractPatterns(domain) {
  const schemas = getSchemasForDomain(domain);
  const patterns = [];
  const qualified = schemas.filter(
    (s) => s.status === "established" || s.status === "mature" || s.status === "principle"
  );
  for (const schema of qualified) {
    if (!schema.description && !schema.name) continue;
    if (isNoisySchema(schema.name, schema.description)) continue;
    patterns.push({
      name: schema.name,
      description: schema.description ?? schema.name,
      frequency: schema.instances.length
    });
  }
  if (patterns.length === 0) {
    const forming = schemas.filter(
      (s) => (s.status === "forming" || s.status === "candidate") && s.confidence >= 0.65 && !isNoisySchema(s.name, s.description)
    );
    for (const schema of forming.slice(0, MENTAL_MODEL.MAX_PATTERNS)) {
      patterns.push({
        name: schema.name,
        description: schema.description ?? schema.name,
        frequency: schema.instances.length
      });
    }
  }
  patterns.sort((a, b) => b.frequency - a.frequency);
  return patterns.slice(0, MENTAL_MODEL.MAX_PATTERNS);
}
function extractPitfalls(domain) {
  const memories = getMemoriesByDomain(domain, 30);
  const antipatterns = memories.filter((m) => m.type === "antipattern");
  antipatterns.sort((a, b) => b.reinforcement - a.reinforcement);
  const pitfalls = [];
  for (const m of antipatterns.slice(0, MENTAL_MODEL.MAX_PITFALLS)) {
    const severity = isAntipatternData(m.type_data) ? `[${m.type_data.severity.toUpperCase()}] ` : "";
    const content = m.content.length > 120 ? m.content.substring(0, 117) + "..." : m.content;
    pitfalls.push(`${severity}${content}`);
  }
  return pitfalls;
}
function detectTrajectory(domain) {
  const memories = getMemoriesByDomain(domain, 50);
  const episodic = memories.filter((m) => m.type === "episodic" || isDecisionData(m.type_data)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (episodic.length < 6) return null;
  const earlySlice = episodic.slice(0, 3);
  const lateSlice = episodic.slice(-3);
  const earlyKeywords = /* @__PURE__ */ new Set();
  const lateKeywords = /* @__PURE__ */ new Set();
  for (const m of earlySlice) {
    for (const k of extractKeywords(m.content)) earlyKeywords.add(k);
  }
  for (const m of lateSlice) {
    for (const k of extractKeywords(m.content)) lateKeywords.add(k);
  }
  const earlyOnly = [...earlyKeywords].filter((k) => !lateKeywords.has(k)).slice(0, 3);
  const lateOnly = [...lateKeywords].filter((k) => !earlyKeywords.has(k)).slice(0, 3);
  if (earlyOnly.length < 2 && lateOnly.length < 2) return null;
  const earlyText = earlyOnly.join(", ") || "general exploration";
  const lateText = lateOnly.join(", ") || "current focus";
  const lessonsWithKeywords = memories.filter((m) => isEpisodicData(m.type_data) && m.type_data.lesson && m.type_data.lesson.length >= 20).map((m) => isEpisodicData(m.type_data) ? m.type_data.lesson ?? "" : "");
  if (lessonsWithKeywords.length >= 5) {
    const lessonKeywordCounts = /* @__PURE__ */ new Map();
    for (const lesson of lessonsWithKeywords) {
      const seen = /* @__PURE__ */ new Set();
      for (const kw of extractKeywords(lesson)) {
        if (!seen.has(kw)) {
          seen.add(kw);
          lessonKeywordCounts.set(kw, (lessonKeywordCounts.get(kw) ?? 0) + 1);
        }
      }
    }
    const recurringThemes = [...lessonKeywordCounts.entries()].filter(([, count]) => count >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([kw, count]) => `${kw}(${count}x)`);
    if (recurringThemes.length > 0) {
      return `Evolved from ${earlyText} to ${lateText}. Recurring expertise: ${recurringThemes.join(", ")}`;
    }
  }
  return `Evolved from ${earlyText} to ${lateText}`;
}
function compileMentalModel(domain, projectPath) {
  const allMemories = getMemoriesByDomain(domain, 200);
  if (allMemories.length < MENTAL_MODEL.MIN_MEMORIES_FOR_MODEL) {
    logger15.debug("Insufficient memories for mental model", { domain, count: allMemories.length });
    return null;
  }
  const topSemantics = getTopDomainMemories(domain, 5, [], projectPath ?? void 0);
  const semanticOnly = topSemantics.filter((m) => m.type === "semantic" || m.type === "procedural");
  const episodicWithLessons = allMemories.filter(
    (m) => m.type === "episodic" && isEpisodicData(m.type_data) && m.type_data.lesson && m.type_data.lesson.length >= 20
  ).sort((a, b) => b.confidence - a.confidence);
  const decisions = getDecisionMemoriesForDomain(domain, 20);
  const masteryScore = getDomainMasteryScore(domain);
  const understanding = composeUnderstanding(domain, allMemories.length, semanticOnly.slice(0, 3), masteryScore, episodicWithLessons, allMemories);
  const principles = extractPrinciples(decisions, episodicWithLessons);
  const patterns = extractPatterns(domain);
  const pitfalls = extractPitfalls(domain);
  const trajectory = detectTrajectory(domain);
  const confidences = allMemories.map((m) => m.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const model = {
    domain,
    project_path: projectPath,
    understanding,
    principles,
    patterns,
    pitfalls,
    trajectory,
    confidence: Math.round(avgConfidence * 100) / 100,
    memory_count: allMemories.length,
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const result = upsertMentalModel(model);
  logger15.info("Mental model compiled", {
    domain,
    projectPath,
    memories: allMemories.length,
    principles: principles.length,
    patterns: patterns.length,
    pitfalls: pitfalls.length
  });
  return result;
}
function composeProjectUnderstanding(projectPath, domain, model) {
  try {
    const parts = [];
    const mapEntries = getProjectMap(projectPath);
    if (mapEntries.length === 0) return null;
    const fileTypes = /* @__PURE__ */ new Map();
    for (const entry of mapEntries) {
      const count = fileTypes.get(entry.file_type) ?? 0;
      fileTypes.set(entry.file_type, count + 1);
    }
    const typesSummary = [...fileTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, count]) => `${count} ${type}`).join(", ");
    parts.push(`${mapEntries.length} files (${typesSummary})`);
    try {
      const graph = getComponentGraph(projectPath, domain);
      if (graph.nodes.length > 0) {
        const roleGroups = /* @__PURE__ */ new Map();
        for (const node of graph.nodes) {
          const count = roleGroups.get(node.role) ?? 0;
          roleGroups.set(node.role, count + 1);
        }
        const archSummary = [...roleGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([role, count]) => `${count} ${role}${count > 1 ? "s" : ""}`).join(", ");
        parts.push(`Architecture: ${archSummary}`);
        const connectionCounts = /* @__PURE__ */ new Map();
        for (const edge of graph.edges) {
          connectionCounts.set(edge.source_id, (connectionCounts.get(edge.source_id) ?? 0) + 1);
          connectionCounts.set(edge.target_id, (connectionCounts.get(edge.target_id) ?? 0) + 1);
        }
        const coreNodes = graph.nodes.map((n) => ({ name: n.name, file: n.file_path, connections: connectionCounts.get(n.id) ?? 0 })).sort((a, b) => b.connections - a.connections).slice(0, 3);
        if (coreNodes.length > 0) {
          const coreText = coreNodes.map((n) => n.name).join(", ");
          parts.push(`Core: ${coreText}`);
        }
      }
    } catch {
    }
    if (model.pitfalls.length > 0) {
      parts.push(`Watch: ${model.pitfalls[0]}`);
    }
    if (parts.length === 0) return null;
    return parts.join(". ");
  } catch {
    return null;
  }
}
function formatMentalModelInjection(model) {
  const parts = [];
  parts.push(`[ENGRAM MODEL] ${model.understanding}`);
  const isExpert = model.confidence >= 0.6 && model.memory_count >= 50;
  if (model.principles.length > 0) {
    const maxPrinciples = isExpert ? 3 : model.principles.length;
    const principleTexts = model.principles.slice(0, maxPrinciples).map(
      (p) => `${p.statement} (because ${p.rationale})`
    );
    parts.push(`  Principles: ${principleTexts.join(" | ")}`);
  }
  if (!isExpert && model.patterns.length > 0) {
    const patternTexts = model.patterns.map(
      (p) => `${p.name}: ${p.description}`
    );
    parts.push(`  Patterns: ${patternTexts.join(" | ")}`);
  }
  if (model.pitfalls.length > 0) {
    const maxPitfalls = isExpert ? 3 : model.pitfalls.length;
    parts.push(`  Pitfalls: ${model.pitfalls.slice(0, maxPitfalls).join(" | ")}`);
  }
  if (model.trajectory) {
    parts.push(`  Trajectory: ${model.trajectory}`);
  }
  let result = parts.join("\n");
  if (Buffer.byteLength(result, "utf-8") > MENTAL_MODEL.INJECTION_MAX_BYTES) {
    result = parts.slice(0, Math.max(2, parts.length - 1)).join("\n");
    if (Buffer.byteLength(result, "utf-8") > MENTAL_MODEL.INJECTION_MAX_BYTES) {
      result = parts[0];
    }
  }
  return result;
}

// src/engines/observation.ts
var logger16 = createLogger("observation");
var _buffer2 = [];
var _patterns = /* @__PURE__ */ new Map();
function isObservationEnabled(config) {
  if (config?.observation_enabled !== void 0) return config.observation_enabled;
  return OBSERVATION.ENABLED;
}
function recordObservation(action, domain, config) {
  if (!isObservationEnabled(config)) return;
  if (OBSERVATION.ABSTRACT_ONLY && action.length > 200) {
    action = action.substring(0, 200);
  }
  _buffer2.push({
    action,
    domain,
    timestamp: now()
  });
  if (_buffer2.length > OBSERVATION.BUFFER_SIZE) {
    _buffer2 = _buffer2.slice(-OBSERVATION.BUFFER_SIZE);
  }
  logger16.debug("Observation recorded", { action: action.substring(0, 50), domain });
}
function extractPatterns2() {
  if (_buffer2.length < OBSERVATION.MIN_REPETITIONS) return [];
  const sequenceCounts = /* @__PURE__ */ new Map();
  for (let i = 0; i <= _buffer2.length - OBSERVATION.SEQUENCE_WINDOW; i++) {
    const window = _buffer2.slice(i, i + OBSERVATION.SEQUENCE_WINDOW);
    const key = window.map((o) => o.action).join("\u2192");
    const existing = sequenceCounts.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = window[window.length - 1].timestamp;
    } else {
      sequenceCounts.set(key, {
        count: 1,
        domain: window[0].domain,
        actions: window.map((o) => o.action),
        firstSeen: window[0].timestamp,
        lastSeen: window[window.length - 1].timestamp
      });
    }
  }
  const newPatterns = [];
  for (const [key, data] of sequenceCounts) {
    if (data.count < OBSERVATION.MIN_REPETITIONS) continue;
    let type = "workflow";
    if (data.actions.some((a) => a.includes("correction") || a.includes("fix"))) {
      type = "correction";
    } else if (data.actions.some((a) => a.includes("preference") || a.includes("choice"))) {
      type = "preference";
    }
    const pattern = {
      type,
      sequence: data.actions,
      domain: data.domain,
      repetition_count: data.count,
      first_seen: data.firstSeen,
      last_seen: data.lastSeen
    };
    const existingPattern = _patterns.get(key);
    if (existingPattern) {
      existingPattern.repetition_count += data.count;
      existingPattern.last_seen = data.lastSeen;
    } else {
      _patterns.set(key, pattern);
    }
    newPatterns.push(pattern);
  }
  logger16.debug("Patterns extracted", { new_patterns: newPatterns.length, total_patterns: _patterns.size });
  return newPatterns;
}
function flushObservations() {
  const patterns = extractPatterns2();
  const size = _buffer2.length;
  _buffer2 = [];
  logger16.info("Observations flushed", {
    buffer_size: size,
    patterns_extracted: patterns.length
  });
  return patterns;
}
function clearObservations() {
  _buffer2 = [];
  _patterns = /* @__PURE__ */ new Map();
  logger16.debug("Observation state cleared");
}

export {
  CONSOLIDATION,
  HEBBIAN,
  ACTIVATION_DRIVEN,
  HOOKS,
  CONNECTION_DECAY,
  COMPACTION,
  PRE_COMPACTION,
  CONTEXT_PRESSURE,
  TRANSCRIPT_REASONING,
  DISTILLATION,
  ACTIVE_CONTEXT,
  SYNTHESIS,
  CONTEXTUAL_RECALL,
  PROACTIVE_RECALL,
  MEMORY_SURFACE,
  RETRIEVAL_FEEDBACK,
  CODE_CONTEXT_RECALL,
  DEDUP,
  SCHEMA_LIFECYCLE,
  TRANSFER,
  REASONING_TRACE,
  FEEDBACK,
  DISCOVERY,
  CONVERSATION,
  CONFIDENCE_GATING,
  LEARNING_GOALS,
  IDENTITY,
  SESSION_NARRATIVE,
  TEACHING,
  ARCHITECTURE,
  DECISION,
  REASONING_CHAIN,
  EMOTIONAL,
  CREATIVE,
  CREATIVE_INSIGHT,
  EMBEDDING,
  HOUSEKEEPING,
  INPUT,
  CODEMAP,
  ERROR_LEARNING,
  TASK_JOURNAL,
  TEST_TRACKING,
  OUTPUT_BUDGET,
  PREWRITE_BLOCKING,
  WATCHER,
  PROJECT,
  CURATOR,
  ADAPTIVE,
  COGNITIVE,
  SESSION_HANDOFF,
  ensureEngramDir,
  getEnvLogLevel,
  loadConfig,
  inferProjectPath,
  deriveProjectDbPath,
  initDatabase,
  getDatabase,
  closeDatabase,
  getDatabaseSizeBytes,
  initProjectDatabase,
  isProjectDbAttached,
  getProjectDbPath,
  attachTemporary,
  detachTemporary,
  listProjectDatabases,
  getProjectDatabaseInfo,
  generateId,
  safeErrorStr,
  now,
  daysElapsed,
  estimateTokens,
  extractKeywords,
  keywordSimilarity,
  clamp,
  setLogLevel,
  createLogger,
  log,
  getAutonomicState,
  recordEvent,
  resetAutonomicState,
  createMemory,
  getMemory,
  updateMemory,
  deleteMemory,
  searchMemories,
  getMemoriesByDomain,
  getPreCompactMemories,
  getSynthesisMemories,
  getAntipatterns,
  getRecentMemories,
  getSessionMemories,
  getTopDomainMemories,
  createConnection,
  getConnections,
  batchGetConnections,
  findResolutionForError,
  batchGetEmbeddings,
  incrementConnectionActivation,
  getStaleConnections,
  bulkUpdateConnectionStrengths,
  bulkDeleteConnections,
  createSchema,
  updateSchema,
  getAllSchemas,
  getVersion,
  archiveMemory,
  logConsolidation,
  getStats,
  globalDownscale,
  getConsolidationCandidates,
  getConnectionCount,
  batchGetConnectionCounts,
  createPattern,
  getPatternsByMemory,
  getPatternsByDomain,
  createProspectiveMemory,
  getActiveProspectiveMemories,
  getAllProspectiveMemories,
  getStaleMemoryCount,
  getOrphanConnectionCount,
  getSpeculativeConnections,
  storeEmbedding,
  getEmbedding,
  getUnembeddedMemories,
  deleteFlaggedMemories,
  evictColdStorage,
  pruneConsolidationLog,
  pruneMetrics,
  pruneStaleVocabulary,
  getDecayScanCandidates,
  vacuumDatabase,
  optimizeFts,
  getHousekeepingStats,
  getProjectMap,
  findErrorByFingerprint,
  createTask,
  getActiveTasks,
  getIncompleteTasks,
  updateTask,
  createTestRun,
  getRecentTestRuns,
  pruneTestRuns,
  createLearningGoal,
  getActiveLearningGoals,
  getAllLearningGoals,
  getLearningGoalByDomainTopic,
  updateSelfModelField,
  getArchNodesByFile,
  createReasoningChain,
  getReasoningChain,
  updateReasoningChain,
  getActiveReasoningChains,
  getMentalModel,
  isAntipatternData,
  isEpisodicData,
  isSemanticData,
  isProceduralData,
  isDecisionData,
  validateMultiPerspective,
  checkProspectiveMemories,
  createReminder,
  autoCreateFromAntipattern,
  autoCreateFromLesson,
  checkAntipattern,
  createAntipatternFromExperience,
  vaccinate,
  handleFalsePositive,
  strengthenAntipattern,
  updateAttention,
  getSignificanceModifier,
  resetAttention,
  addToWorkingMemory,
  getWorkingMemorySize,
  flushWorkingMemory,
  clearWorkingMemory,
  getPrimedNodeCount,
  clearPrimedNodes,
  recordRecallOutcome,
  recordImmuneOutcome,
  recordCalibration,
  recordRetrievalUtility,
  evaluateSystemHealth,
  detectBlindSpots,
  generateLearningGoals,
  refreshLearningGoals,
  recordPractice,
  getMasteryForDomain,
  getProfilesDueForReview,
  evaluateAllMastery,
  classifyError,
  inferPrerequisites,
  buildLearningPathFromPrereqs,
  formatZPDInjection,
  recordProgressionOutcome,
  recordDomainMasteryOutcome,
  porterStem,
  refreshIdfCache,
  generateEmbedding,
  cosineSimilarity,
  recomputeIdf,
  embeddingToBuffer,
  bufferToEmbedding,
  isRecallNoise,
  preWarmActivation,
  clearPreWarmedNodes,
  recall,
  lightweightRecall,
  computeActivationProfile,
  contextualRecall,
  codeContextRecall,
  extractModuleFromPath,
  findSimilarDecisions,
  formatDecisionInjection,
  findSimilarChains,
  formatChainInjection,
  selectDiverseSurface,
  isObservationEnabled,
  recordObservation,
  flushObservations,
  clearObservations,
  findDuplicate,
  strengthenExisting,
  getSelfModel2 as getSelfModel,
  updateSelfModelFromSession,
  updateFromFeedback,
  updateFromInstruction,
  formatSelfModelInjection,
  recordDomainOutcome,
  updateOngoingContext,
  assembleTeachingContext,
  recordTaughtConcept,
  formatTeachingHint,
  synthesizeDomainKnowledge,
  composeKnowledgeNarrative,
  updateFileInMap,
  scanProject,
  formatProjectMap,
  extractErrorFingerprint,
  recordError,
  recordFix,
  graduateErrorCandidates,
  formatRecentErrors,
  updateArchitectureFromFile,
  getImpactAnalysis,
  formatArchitectureInjection,
  formatImpactAnalysis,
  pruneArchitectureGraph,
  discoverMemoryDir,
  updateMemoryMdMentalModels,
  determineInjectionLevel,
  refreshBridge,
  refreshBridgeInsights,
  getVersionKnowledge,
  registerVersion,
  detectVersionFromManifest,
  getMigrationKnowledge,
  evaluateDecayCandidates,
  retrievalReinforcement,
  adjustConfidence,
  evaluateConnectionDecay,
  getReviewSchedule,
  spacedRepetitionBoost,
  reconsolidate,
  compileMentalModel,
  composeProjectUnderstanding,
  formatMentalModelInjection
};
//# sourceMappingURL=chunk-FQ4MRL3Q.js.map