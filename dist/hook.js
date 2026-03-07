#!/usr/bin/env node
import {
  ACTIVATION_DRIVEN,
  ACTIVE_CONTEXT,
  ADAPTIVE,
  ARCHITECTURE,
  CODEMAP,
  CODE_CONTEXT_RECALL,
  COGNITIVE,
  COMPACTION,
  CONFIDENCE_GATING,
  CONTEXTUAL_RECALL,
  CONTEXT_PRESSURE,
  CONVERSATION,
  CURATOR,
  DECISION,
  DISCOVERY,
  DISTILLATION,
  ERROR_LEARNING,
  FEEDBACK,
  HEBBIAN,
  HOOKS,
  IDENTITY,
  INPUT,
  LEARNING_GOALS,
  MEMORY_SURFACE,
  OUTPUT_BUDGET,
  PREWRITE_BLOCKING,
  PRE_COMPACTION,
  PROACTIVE_RECALL,
  PROCEDURAL_WORKFLOW,
  REASONING_CHAIN,
  REASONING_TRACE,
  RETRIEVAL_FEEDBACK,
  SESSION_HANDOFF,
  SESSION_NARRATIVE,
  SYNTHESIS,
  TASK_JOURNAL,
  TEACHING,
  TEST_TRACKING,
  TRANSCRIPT_REASONING,
  WATCHER,
  assembleTeachingContext,
  autoCreateFromAntipattern,
  autoCreateFromLesson,
  bufferToEmbedding,
  buildLearningPathFromPrereqs,
  checkAntipattern,
  checkProspectiveMemories,
  clamp,
  classifyError,
  clearObservations,
  clearPreWarmedNodes,
  clearPrimedNodes,
  clearWorkingMemory,
  closeDatabase,
  codeContextRecall,
  compileMentalModel,
  composeKnowledgeNarrative,
  composeProjectUnderstanding,
  computeActivationProfile,
  contextualRecall,
  cosineSimilarity,
  createAntipatternFromExperience,
  createConnection,
  createLogger,
  createMemory,
  createProspectiveMemory,
  createReasoningChain,
  createTask,
  createTestRun,
  daysElapsed,
  deriveProjectDbPath,
  detectBlindSpots,
  detectVersionFromManifest,
  determineInjectionLevel,
  discoverMemoryDir,
  embeddingToBuffer,
  ensureEngramDir,
  estimateTokens,
  extractErrorFingerprint,
  extractKeywords,
  extractModuleFromPath,
  findDuplicate,
  findErrorByFingerprint,
  findResolutionForError,
  findSimilarChains,
  findSimilarDecisions,
  flushObservations,
  flushWorkingMemory,
  formatArchitectureInjection,
  formatChainInjection,
  formatDecisionInjection,
  formatImpactAnalysis,
  formatMentalModelInjection,
  formatProjectMap,
  formatRecentErrors,
  formatSelfModelInjection,
  formatTeachingHint,
  formatZPDInjection,
  generateEmbedding,
  generateId,
  generateLearningGoals,
  getActiveReasoningChains,
  getActiveTasks,
  getAntipatterns,
  getArchNodesByFile,
  getAutonomicState,
  getConnections,
  getEmbedding,
  getEnvLogLevel,
  getImpactAnalysis,
  getIncompleteTasks,
  getMemoriesByDomain,
  getMemory,
  getMentalModel,
  getPreCompactMemories,
  getProjectMap,
  getReasoningChain,
  getRecentMemories,
  getRecentTestRuns,
  getSessionMemories,
  getSignificanceModifier,
  getStats,
  getSynthesisMemories,
  getTopDomainMemories,
  getVersion,
  incrementConnectionActivation,
  inferPrerequisites,
  inferProjectPath,
  initDatabase,
  initProjectDatabase,
  isAntipatternData,
  isDecisionData,
  isEpisodicData,
  isObservationEnabled,
  isRecallNoise,
  keywordSimilarity,
  lightweightRecall,
  loadConfig,
  log,
  now,
  preWarmActivation,
  pruneTestRuns,
  recordDomainMasteryOutcome,
  recordDomainOutcome,
  recordError,
  recordEvent,
  recordFix,
  recordObservation,
  recordRetrievalUtility,
  recordTaughtConcept,
  refreshBridge,
  refreshBridgeInsights,
  refreshLearningGoals,
  registerVersion,
  resetAttention,
  resetAutonomicState,
  retrievalReinforcement,
  safeErrorStr,
  scanProject,
  searchMemories,
  selectDiverseSurface,
  setLogLevel,
  storeEmbedding,
  strengthenExisting,
  synthesizeDomainKnowledge,
  updateArchitectureFromFile,
  updateAttention,
  updateFileInMap,
  updateFromFeedback,
  updateFromInstruction,
  updateMemory,
  updateReasoningChain,
  updateSelfModelFromSession,
  updateTask
} from "./chunk-O3ZP4K3T.js";

// src/hook.ts
import { readFileSync, writeFileSync, existsSync, renameSync, statSync, readdirSync, unlinkSync, openSync, readSync, closeSync } from "fs";
import { join, basename, resolve } from "path";
import { homedir } from "os";

// src/engines/significance.ts
function evaluateSignificance(event, context, existingMemories, config2, matchingGoals) {
  const goalRelevance = calculateGoalRelevance(event, context);
  const predictionError = calculatePredictionError(event, existingMemories);
  const emotionalWeight = calculateEmotionalWeight(event);
  const weighted = goalRelevance * config2.goal_relevance_weight + predictionError * config2.prediction_error_weight + emotionalWeight * config2.emotional_weight;
  const gate = Math.min(
    goalRelevance < config2.min_goal_relevance ? 0.3 : 1,
    predictionError < config2.min_prediction_error ? 0.5 : 1
  );
  const total = clamp(weighted * gate, 0, 1);
  let threshold = config2.adaptive_threshold ? adaptiveThreshold(config2.base_threshold, context.recent_encoding_rate, config2.target_encoding_rate) : config2.base_threshold;
  if (matchingGoals && matchingGoals.length > 0) {
    const bestGoal = matchingGoals[0];
    threshold = threshold * LEARNING_GOALS.SIGNIFICANCE_BOOST;
    if (bestGoal.priority >= LEARNING_GOALS.USER_PRIORITY) {
      threshold = threshold * 0.8;
    }
    threshold = clamp(threshold, 0.05, 0.8);
  }
  return {
    total,
    goal_relevance: goalRelevance,
    prediction_error: predictionError,
    emotional_weight: emotionalWeight,
    should_encode: total >= threshold
  };
}
function calculateGoalRelevance(event, context) {
  let relevance = 0.1;
  if (context.current_domain && event.domains.includes(context.current_domain)) {
    relevance += 0.3;
  }
  if (context.current_version && event.version === context.current_version) {
    relevance += 0.1;
  }
  if (context.current_goals.length > 0) {
    const eventKeywords = extractKeywords(event.content);
    const goalKeywords = context.current_goals.flatMap((g) => extractKeywords(g));
    const goalSet = new Set(goalKeywords);
    let matches = 0;
    for (const kw of eventKeywords) {
      if (goalSet.has(kw)) matches++;
    }
    const goalOverlap = goalKeywords.length > 0 ? matches / goalKeywords.length : 0;
    relevance += goalOverlap * 0.4;
  }
  if (event.event_type === "error") relevance += 0.15;
  if (event.event_type === "correction") relevance += 0.2;
  if (event.event_type === "decision") relevance += 0.1;
  if (event.event_type === "preference") relevance += 0.1;
  return clamp(relevance, 0, 1);
}
function calculatePredictionError(event, existingMemories) {
  if (existingMemories.length === 0) {
    return event.is_correction ? 0.9 : 0.7;
  }
  let maxSimilarity = 0;
  for (const mem of existingMemories) {
    const sim = keywordSimilarity(event.content, mem.content);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }
  let predictionError = 1 - maxSimilarity;
  if (event.is_correction) {
    predictionError = Math.max(predictionError, 0.8);
  }
  if (event.outcome === "negative") {
    predictionError = Math.max(predictionError, 0.6);
  }
  return clamp(predictionError, 0, 1);
}
function calculateEmotionalWeight(event) {
  let weight = 0.2;
  if (event.error_severity === "critical") weight = 0.95;
  else if (event.error_severity === "high") weight = 0.8;
  else if (event.error_severity === "medium") weight = 0.5;
  switch (event.event_type) {
    case "error":
      weight = Math.max(weight, 0.6);
      break;
    case "correction":
      weight = Math.max(weight, 0.7);
      break;
    case "success":
      weight = Math.max(weight, 0.3);
      break;
    case "discovery":
      weight = Math.max(weight, 0.5);
      break;
    case "decision":
      weight = Math.max(weight, 0.35);
      break;
    case "preference":
      weight = Math.max(weight, 0.3);
      break;
    default:
      break;
  }
  if (event.outcome === "negative") {
    weight = Math.max(weight, 0.55);
  }
  return clamp(weight, 0, 1);
}
function adaptiveThreshold(baseThreshold, recentRate, targetRate) {
  if (targetRate <= 0) return baseThreshold;
  const ratio = recentRate / targetRate;
  if (ratio > 1.5) {
    return clamp(baseThreshold * 1.2, 0.1, 0.8);
  } else if (ratio < 0.5) {
    return clamp(baseThreshold * 0.8, 0.1, 0.8);
  }
  return baseThreshold;
}

// src/engines/hooks.ts
var logger = createLogger("hooks");
function processHookEvent(event, config2, sessionId2) {
  const isError = event.type === "error";
  recordEvent(isError);
  updateAttention({
    type: event.type,
    domain: event.metadata.framework ?? null,
    files: event.metadata.files ?? [],
    task: event.metadata.task ?? null
  });
  if (event.type === "session_start") {
    resetAttention();
    clearWorkingMemory();
    clearPrimedNodes();
    clearObservations();
    const anticipationContext = {
      framework: event.metadata.framework ?? null,
      version: event.metadata.version ?? null,
      project: event.metadata.project ?? null,
      task_type: event.metadata.task_type ?? null
    };
    preWarmActivation(anticipationContext);
    logger.info("Anticipatory loading triggered", {
      framework: anticipationContext.framework
    });
  }
  if (event.type === "session_end") {
    flushWorkingMemory();
    const patterns = flushObservations();
    if (patterns.length > 0) {
      for (const pattern of patterns.slice(0, 3)) {
        try {
          createMemory({
            type: "semantic",
            content: `Workflow pattern: ${pattern.sequence.join(" \u2192 ")} (observed ${pattern.repetition_count}x)`,
            summary: `[PATTERN] ${pattern.sequence.join("\u2192")}`,
            encoding_strength: Math.min(0.3 + pattern.repetition_count * 0.1, 0.8),
            reinforcement: 1,
            confidence: Math.min(0.5 + pattern.repetition_count * 0.05, 0.9),
            domains: pattern.domain ? [pattern.domain] : [],
            version: null,
            tags: ["workflow_pattern", "auto_observed"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: { project: null, project_path: null, framework: null, version: null, task_type: null, files: [], error_context: null, session_id: sessionId2, significance_score: 0.5 },
            type_data: { kind: "semantic", knowledge_type: "convention", source: "observed", source_episodes: [], applicable_versions: null, deprecated_in: null }
          });
        } catch {
        }
      }
    }
    clearPreWarmedNodes();
    clearPrimedNodes();
    logger.info("Session end: volatile state flushed", { patterns_encoded: patterns.length });
  }
  if (event.type === "session_start" || event.type === "session_end") {
    return null;
  }
  if (event.type === "tool_result" && event.content.startsWith("File modified:")) {
    return null;
  }
  if (event.type === "tool_result" && event.content.startsWith("Command:")) {
    return null;
  }
  if (event.type === "notification" && event.content.startsWith("Claude is waiting")) {
    return null;
  }
  const significanceEvent = mapToSignificanceEvent(event);
  const significance = evaluateSignificance(significanceEvent, {
    current_goals: [],
    current_domain: event.metadata.framework ?? null,
    current_version: event.metadata.version ?? null,
    recent_encoding_rate: 0,
    session_id: sessionId2
  }, [], config2.significance);
  if (isObservationEnabled(config2)) {
    recordObservation(
      event.type,
      event.metadata.framework ?? null,
      config2
    );
  }
  const attentionModifier = getSignificanceModifier({
    domains: event.metadata.domains ?? [],
    files: event.metadata.files ?? []
  });
  const adjustedTotal = significance.total * attentionModifier;
  const autonomicModifier = getAutonomicState().significance_threshold_modifier;
  const shouldEncode = autonomicModifier === 1 ? significance.should_encode : adjustedTotal >= config2.significance.base_threshold * autonomicModifier;
  if (!shouldEncode) {
    logger.debug("Event below significance threshold", {
      type: event.type,
      score: adjustedTotal.toFixed(3),
      autonomicModifier: autonomicModifier !== 1 ? autonomicModifier : void 0
    });
    return null;
  }
  const memoryId = encodeFromEvent(event, adjustedTotal, config2, sessionId2);
  logger.info("Event encoded as memory", {
    type: event.type,
    memory_id: memoryId,
    significance: significance.total.toFixed(3)
  });
  return memoryId;
}
function mapToSignificanceEvent(event) {
  const eventTypeMap = {
    error: "error",
    correction: "correction",
    tool_result: "general",
    user_message: "general",
    notification: "general",
    session_start: "general",
    session_end: "general"
  };
  return {
    content: event.content,
    event_type: eventTypeMap[event.type] ?? "general",
    domains: event.metadata.domains ?? [],
    version: event.metadata.version ?? null,
    error_severity: event.metadata.severity ?? null,
    is_correction: event.type === "correction",
    outcome: event.type === "error" ? "negative" : null
  };
}
function encodeFromEvent(event, significance, config2, sessionId2) {
  const domains = event.metadata.domains ?? [];
  const version = event.metadata.version ?? null;
  const framework = event.metadata.framework ?? domains[0] ?? null;
  const encodingContext = {
    project: event.metadata.project ?? null,
    framework,
    version,
    task_type: event.metadata?.task_type ?? null,
    files: event.metadata.files ?? [],
    error_context: event.type === "error" ? event.content : null,
    session_id: sessionId2,
    significance_score: significance
  };
  let memType = "episodic";
  if (event.type === "error" && significance > HOOKS.ERROR_ANTIPATTERN_THRESHOLD) {
    const ap = createAntipatternFromExperience(
      event.content,
      event.metadata.fix ?? "Avoid this pattern",
      "high",
      domains,
      version,
      [],
      encodingContext
    );
    try {
      const td = ap.type_data;
      autoCreateFromAntipattern(ap.id, td.trigger_keywords, domains[0] ?? "general", "high");
    } catch {
    }
    return ap.id;
  }
  const typeData = {
    kind: "episodic",
    context: {
      project: encodingContext.project ?? "",
      task: event.type,
      framework: framework ?? "",
      version: version ?? "",
      files: encodingContext.files,
      models: []
    },
    outcome: event.type === "error" ? "negative" : "neutral",
    outcome_detail: event.content,
    lesson: event.metadata.lesson ?? null,
    lesson_validated: false,
    emotional_weight: HOOKS.EMOTIONAL_WEIGHT[event.type] ?? HOOKS.EMOTIONAL_WEIGHT.default
  };
  const memory = createMemory({
    type: memType,
    content: event.content,
    summary: event.content.length > 100 ? event.content.substring(0, 100) + "..." : null,
    encoding_strength: Math.min(significance + HOOKS.ENCODING_STRENGTH_BUFFER, 1),
    reinforcement: 1,
    confidence: 0.6,
    domains,
    version,
    tags: ["auto_encoded", event.type],
    storage_tier: "short_term",
    pinned: false,
    encoding_context: encodingContext,
    type_data: typeData
  });
  if (event.type === "error" && encodingContext.files.length > 0) {
    try {
      const fileQuery = encodingContext.files.join(" ");
      const related = searchMemories(fileQuery, 5);
      for (const candidate of related) {
        if (candidate.id === memory.id) continue;
        const candidateFiles = candidate.encoding_context?.files ?? [];
        const hasFileOverlap = encodingContext.files.some(
          (f) => candidateFiles.includes(f) || candidate.content.includes(f)
        );
        if (!hasFileOverlap) continue;
        const existing = getConnections(memory.id).find(
          (c) => c.source_id === memory.id && c.target_id === candidate.id || c.source_id === candidate.id && c.target_id === memory.id
        );
        if (!existing) {
          createConnection({
            source_id: memory.id,
            target_id: candidate.id,
            strength: 0.5,
            type: "caused_by"
          });
        }
      }
    } catch {
    }
  }
  return memory.id;
}
function detectReasoningPattern(buffer) {
  if (buffer.length < 2) return null;
  const cutoff = new Date(
    Date.now() - REASONING_TRACE.SEQUENCE_WINDOW_MINUTES * 60 * 1e3
  ).toISOString();
  const recent = buffer.filter((t) => t.timestamp >= cutoff);
  if (recent.length < 2) return null;
  const searchTools = recent.filter(
    (t) => REASONING_TRACE.SEARCH_TOOLS.includes(t.tool)
  );
  if (searchTools.length >= REASONING_TRACE.MIN_INVESTIGATION_TOOLS) {
    const allFiles = [...new Set(searchTools.flatMap((t) => t.files))];
    const topic = extractInvestigationTopic(searchTools);
    return {
      type: "investigation",
      description: `Investigated: ${topic}`,
      tools: searchTools,
      files: allFiles,
      lesson: `Investigation across ${searchTools.length} searches: ${topic}`
    };
  }
  const latest = recent[recent.length - 1];
  if (latest && REASONING_TRACE.DECISION_TOOLS.includes(latest.tool) && latest.input_summary.length >= REASONING_TRACE.MIN_AGENT_PROMPT_LENGTH) {
    return {
      type: "delegation",
      description: `Delegated: ${latest.input_summary.substring(0, 150)}`,
      tools: [latest],
      files: latest.files,
      lesson: `Strategic delegation: ${latest.input_summary.substring(0, 200)}`
    };
  }
  const validationIdx = recent.findIndex(
    (t, i) => i >= 2 && REASONING_TRACE.VALIDATION_TOOLS.includes(t.tool) && !t.output_summary.toLowerCase().includes("error") && !t.output_summary.toLowerCase().includes("failed")
  );
  if (validationIdx >= 2) {
    const sequence = recent.slice(Math.max(0, validationIdx - 4), validationIdx + 1);
    const hasSearch = sequence.some((t) => REASONING_TRACE.SEARCH_TOOLS.includes(t.tool));
    if (hasSearch) {
      const allFiles = [...new Set(sequence.flatMap((t) => t.files))];
      const searchTerms = sequence.filter((t) => REASONING_TRACE.SEARCH_TOOLS.includes(t.tool)).map((t) => t.input_summary).join(", ");
      return {
        type: "approach_validation",
        description: `Validated approach: searched ${searchTerms}, then verified`,
        tools: sequence,
        files: allFiles,
        lesson: `Successful approach: ${searchTerms} \u2192 verified`
      };
    }
  }
  if (searchTools.length >= 2) {
    const queries = searchTools.map((t) => t.input_summary);
    let narrowing = true;
    for (let i = 1; i < queries.length; i++) {
      const overlap = keywordSimilarity(queries[i], queries[i - 1]);
      if (overlap < 0.2 || overlap > 0.8) {
        narrowing = false;
        break;
      }
    }
    if (narrowing && queries.length >= 2) {
      const allFiles = [...new Set(searchTools.flatMap((t) => t.files))];
      return {
        type: "hypothesis_refinement",
        description: `Refined hypothesis: ${queries.join(" \u2192 ")}`,
        tools: searchTools,
        files: allFiles,
        lesson: `Narrowed search: ${queries[0]} \u2192 ${queries[queries.length - 1]}`
      };
    }
    if (queries.length >= 2) {
      const divergence = 1 - keywordSimilarity(queries[0], queries[queries.length - 1]);
      if (divergence >= 0.7) {
        const allFiles = [...new Set(searchTools.flatMap((t) => t.files))];
        return {
          type: "hypothesis_pivot",
          description: `Pivoted hypothesis: from ${queries[0]} to ${queries[queries.length - 1]}`,
          tools: searchTools,
          files: allFiles,
          lesson: `Changed direction: ${queries[0]} \u2192 ${queries[queries.length - 1]}`
        };
      }
    }
  }
  return null;
}
function encodeReasoningTrace(pattern, config2, sessionId2, context, cognitiveState) {
  try {
    if (isRecallNoise(pattern.description, "episodic")) {
      logger.info("Reasoning trace skipped (noise filter)", { type: pattern.type });
      return null;
    }
    if (pattern.description.length < 120 && !pattern.lesson) {
      logger.info("Reasoning trace skipped (too short, no lesson)", { type: pattern.type, len: pattern.description.length });
      return null;
    }
    const domains = context.domain ? [context.domain] : [];
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: pattern.files.slice(0, 15),
      error_context: null,
      session_id: sessionId2,
      significance_score: REASONING_TRACE.ENCODING_STRENGTH
    };
    const emotionalWeight = pattern.type === "approach_validation" ? 0.4 : pattern.type === "delegation" ? 0.35 : pattern.type === "hypothesis_refinement" ? 0.35 : pattern.type === "hypothesis_pivot" ? 0.4 : 0.3;
    let enrichedDescription = pattern.description;
    if (cognitiveState) {
      const contextParts = [];
      if (cognitiveState.current_approach) contextParts.push(`Approach: ${cognitiveState.current_approach}`);
      if (cognitiveState.active_hypothesis) contextParts.push(`Hypothesis: ${cognitiveState.active_hypothesis}`);
      if (cognitiveState.session_phase !== "exploration") contextParts.push(`Phase: ${cognitiveState.session_phase}`);
      if (contextParts.length > 0) {
        enrichedDescription = `${pattern.description}
Context: ${contextParts.join("; ")}`;
      }
    }
    let distilledLesson = pattern.lesson;
    if (!distilledLesson) {
      if (pattern.type === "hypothesis_pivot" && cognitiveState?.active_hypothesis) {
        distilledLesson = `Approach didn't work: ${cognitiveState.active_hypothesis}`;
      } else if (pattern.type === "hypothesis_refinement" && cognitiveState?.active_hypothesis) {
        distilledLesson = `Refined understanding: ${cognitiveState.active_hypothesis}`;
      } else if (pattern.type === "delegation" && pattern.description.length >= 30) {
        const firstSentence = pattern.description.split(".")[0];
        distilledLesson = `Delegated: ${firstSentence}`;
      }
    }
    const typeData = {
      kind: "episodic",
      context: {
        project: context.project ?? "",
        task: context.task ?? pattern.type,
        framework: context.domain ?? "",
        version: context.version ?? "",
        files: pattern.files.slice(0, 10),
        models: []
      },
      outcome: pattern.type === "approach_validation" ? "positive" : pattern.type === "hypothesis_pivot" ? "negative" : "neutral",
      outcome_detail: enrichedDescription,
      lesson: distilledLesson,
      lesson_validated: pattern.type === "approach_validation",
      emotional_weight: emotionalWeight
    };
    try {
      const existingDup = findDuplicate(enrichedDescription, "episodic", domains);
      if (existingDup) {
        strengthenExisting(existingDup);
        logger.info("Reasoning trace deduplicated", { existing_id: existingDup.id, type: pattern.type });
        return null;
      }
    } catch {
    }
    const memory = createMemory({
      type: "episodic",
      content: enrichedDescription,
      summary: pattern.description.length > 100 ? pattern.description.substring(0, 100) + "..." : null,
      encoding_strength: REASONING_TRACE.ENCODING_STRENGTH,
      reinforcement: 1,
      confidence: REASONING_TRACE.CONFIDENCE,
      domains,
      version: context.version,
      tags: ["reasoning_trace", `rt_${pattern.type}`, "auto_encoded"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: encodingContext,
      type_data: typeData
    });
    if (pattern.files.length > 0) {
      try {
        const fileQuery = pattern.files.slice(0, 5).join(" ");
        const related = searchMemories(fileQuery, 3);
        for (const candidate of related) {
          if (candidate.id === memory.id) continue;
          const candidateFiles = candidate.encoding_context?.files ?? [];
          const hasOverlap = pattern.files.some(
            (f) => candidateFiles.includes(f) || candidate.content.includes(f)
          );
          if (!hasOverlap) continue;
          const existing = getConnections(memory.id).find(
            (c) => c.source_id === memory.id && c.target_id === candidate.id || c.source_id === candidate.id && c.target_id === memory.id
          );
          if (!existing) {
            createConnection({
              source_id: memory.id,
              target_id: candidate.id,
              strength: 0.4,
              type: "related"
            });
          }
        }
      } catch {
      }
    }
    if (pattern.type === "hypothesis_pivot" && pattern.lesson) {
      try {
        autoCreateFromLesson(memory.id, pattern.lesson, context.domain);
      } catch {
      }
    }
    if (context.domain) {
      try {
        const outcome = pattern.type === "approach_validation" ? "positive" : "neutral";
        if (outcome === "positive") recordDomainOutcome(context.domain, outcome);
      } catch {
      }
    }
    logger.info("Reasoning trace encoded", {
      type: pattern.type,
      memory_id: memory.id,
      files: pattern.files.length,
      tools: pattern.tools.length
    });
    return memory.id;
  } catch (e) {
    logger.error("Failed to encode reasoning trace", { error: String(e) });
    return null;
  }
}
function encodeDecision(decision, config2, sessionId2, context, affectedComponents) {
  try {
    const domains = context.domain ? [context.domain] : [];
    const contentParts = [`Decision: ${decision.chosen_approach}`];
    if (decision.rationale) contentParts.push(`Rationale: ${decision.rationale}`);
    if (decision.alternatives.length > 0) {
      contentParts.push(`Alternatives: ${decision.alternatives.map((a) => a.description).join(", ")}`);
    }
    if (decision.constraints.length > 0) {
      contentParts.push(`Constraints: ${decision.constraints.join(", ")}`);
    }
    const content = contentParts.join(". ");
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: decision.files.slice(0, 15),
      error_context: null,
      session_id: sessionId2,
      significance_score: DECISION.ENCODING_STRENGTH
    };
    const typeData = {
      kind: "decision",
      context: {
        project: context.project ?? "",
        task: context.task ?? "decision",
        framework: context.domain ?? "",
        version: context.version ?? "",
        files: decision.files.slice(0, 10),
        models: []
      },
      outcome: "pending",
      outcome_detail: "",
      lesson: null,
      lesson_validated: false,
      emotional_weight: 0.5,
      decision_type: decision.decision_type,
      chosen: decision.chosen_approach.substring(0, DECISION.MAX_CHOSEN_LENGTH),
      alternatives: decision.alternatives.slice(0, DECISION.MAX_ALTERNATIVES),
      rationale: decision.rationale.substring(0, DECISION.MAX_RATIONALE_LENGTH),
      constraints: decision.constraints.slice(0, DECISION.MAX_CONSTRAINTS),
      affected_components: (affectedComponents ?? []).slice(0, DECISION.MAX_AFFECTED_COMPONENTS),
      revisited: false,
      decision_superseded_by: null
    };
    const memory = createMemory({
      type: "episodic",
      content,
      summary: decision.description.length > 100 ? decision.description.substring(0, 100) + "..." : null,
      encoding_strength: DECISION.ENCODING_STRENGTH,
      reinforcement: 1,
      confidence: DECISION.ENCODING_CONFIDENCE,
      domains,
      version: context.version,
      tags: ["decision", `decision_${decision.decision_type}`, "auto_encoded"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: encodingContext,
      type_data: typeData
    });
    if (decision.files.length > 0) {
      try {
        const fileQuery = decision.files.slice(0, 5).join(" ");
        const related = searchMemories(fileQuery, 3);
        for (const candidate of related) {
          if (candidate.id === memory.id) continue;
          const candidateFiles = candidate.encoding_context?.files ?? [];
          const hasOverlap = decision.files.some(
            (f) => candidateFiles.includes(f) || candidate.content.includes(f)
          );
          if (!hasOverlap) continue;
          const existing = getConnections(memory.id).find(
            (c) => c.source_id === memory.id && c.target_id === candidate.id || c.source_id === candidate.id && c.target_id === memory.id
          );
          if (!existing) {
            createConnection({
              source_id: memory.id,
              target_id: candidate.id,
              strength: 0.5,
              type: "related"
            });
          }
        }
      } catch {
      }
    }
    logger.info("Decision encoded", {
      type: decision.decision_type,
      memory_id: memory.id,
      chosen: decision.chosen_approach.substring(0, 60),
      alternatives: decision.alternatives.length
    });
    return memory.id;
  } catch (e) {
    logger.error("Failed to encode decision", { error: String(e) });
    return null;
  }
}
function updateDecisionOutcome(memoryId, outcome, outcomeDetail, lesson) {
  try {
    const memory = getMemory(memoryId);
    if (!memory) return false;
    if (!memory.type_data || memory.type_data.kind !== "decision") return false;
    const decisionData = { ...memory.type_data };
    decisionData.outcome = outcome;
    decisionData.outcome_detail = outcomeDetail.substring(0, 300);
    if (lesson) {
      decisionData.lesson = lesson;
      decisionData.lesson_validated = outcome === "positive";
    }
    updateMemory(memory.id, {
      type_data: decisionData
    });
    logger.info("Decision outcome updated", { memory_id: memoryId, outcome });
    return true;
  } catch (e) {
    logger.error("Failed to update decision outcome", { error: String(e) });
    return false;
  }
}
function extractInvestigationTopic(tools) {
  const inputs = tools.map((t) => t.input_summary).join(" ");
  const keywords = extractKeywords(inputs);
  const freq = /* @__PURE__ */ new Map();
  for (const kw of keywords) {
    freq.set(kw, (freq.get(kw) ?? 0) + 1);
  }
  const topKeywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([kw]) => kw);
  if (topKeywords.length > 0) return topKeywords.join(", ");
  const files = [...new Set(tools.flatMap((t) => t.files))];
  if (files.length > 0) {
    return files.slice(0, 3).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
  }
  return "multiple searches";
}
function detectChainTrigger(content, isError = false) {
  if (!content || content.length < 10) return null;
  const lower = content.toLowerCase();
  for (const pattern of REASONING_CHAIN.TRIGGER_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const trigger = match[1].substring(0, REASONING_CHAIN.MAX_TRIGGER_LENGTH);
      const chainType = inferChainType(lower);
      return { chain_type: chainType, trigger };
    }
  }
  if (isError || lower.includes("error") || lower.includes("traceback") || lower.includes("exception")) {
    const errorLine = content.split("\n")[0]?.substring(0, REASONING_CHAIN.MAX_TRIGGER_LENGTH) ?? content.substring(0, REASONING_CHAIN.MAX_TRIGGER_LENGTH);
    if (errorLine.length >= REASONING_CHAIN.MIN_CHAIN_ERROR_LENGTH) {
      return { chain_type: "debug", trigger: errorLine };
    }
  }
  return null;
}
function inferChainType(lowerText) {
  const patterns = REASONING_CHAIN.TYPE_PATTERNS;
  let bestType = "investigation";
  let bestCount = 0;
  for (const [type, keywords] of Object.entries(patterns)) {
    const count = keywords.filter((kw) => lowerText.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestType = type;
    }
  }
  return bestType;
}
function buildChainStep(params) {
  const { toolName, input, output, order, inference, files: providedFiles } = params;
  const lower = (input + " " + output).toLowerCase();
  const action = (toolName ? `${toolName}: ` : "") + input.substring(0, REASONING_CHAIN.MAX_ACTION_LENGTH);
  const observation = output.substring(0, REASONING_CHAIN.MAX_OBSERVATION_LENGTH) || "no output";
  const wasDeadEnd = REASONING_CHAIN.DEAD_END_DETECTION && REASONING_CHAIN.DEAD_END_PATTERNS.some((p) => lower.includes(p));
  const files = providedFiles?.slice(0, REASONING_CHAIN.MAX_FILES_PER_STEP) ?? extractFilesFromText(input + " " + output).slice(0, REASONING_CHAIN.MAX_FILES_PER_STEP);
  return {
    order,
    action: action.substring(0, REASONING_CHAIN.MAX_ACTION_LENGTH),
    observation: observation.substring(0, REASONING_CHAIN.MAX_OBSERVATION_LENGTH),
    inference: (inference ?? "").substring(0, REASONING_CHAIN.MAX_INFERENCE_LENGTH),
    tool: toolName,
    files,
    was_dead_end: wasDeadEnd,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function extractFilesFromText(text) {
  const files = [];
  const pathMatches = text.match(/(?:\/[\w.-]+)+\.\w{1,10}/g);
  if (pathMatches) {
    for (const p of pathMatches) {
      if (!files.includes(p) && files.length < REASONING_CHAIN.MAX_FILES_PER_STEP) {
        files.push(p);
      }
    }
  }
  return files;
}
function detectChainCompletion(content, chain) {
  if (!content) return null;
  const combined = content.toLowerCase();
  for (const pattern of REASONING_CHAIN.COMPLETION_PATTERNS) {
    if (pattern.test(combined)) {
      const conclusion = content.substring(0, REASONING_CHAIN.MAX_CONCLUSION_LENGTH) || "Resolved successfully";
      const deadEnds = chain.steps.filter((s) => s.was_dead_end).length;
      const confidence = Math.max(0.3, Math.min(0.95, 0.7 + chain.steps.length * 0.03 - deadEnds * 0.1));
      return { status: "completed", conclusion, confidence };
    }
  }
  if (chain.steps.length >= 4) {
    const recentSteps = chain.steps.slice(-3);
    const allErrors = recentSteps.every(
      (s) => s.observation.toLowerCase().includes("error") || s.was_dead_end
    );
    if (allErrors) {
      return {
        status: "failed",
        conclusion: `Failed after ${chain.steps.length} steps \u2014 persistent errors`,
        confidence: 0.3
      };
    }
  }
  return null;
}
function completeReasoningChain(chainId, status, conclusion, confidence, config2, sessionId2, context) {
  const chain = getReasoningChain(chainId);
  if (!chain) return { chainId, memoryId: null };
  if (chain.steps.length < REASONING_CHAIN.MIN_STEPS_TO_STORE) {
    updateReasoningChain(chainId, { status: "interrupted", conclusion: "Too few steps to store" });
    return { chainId, memoryId: null };
  }
  updateReasoningChain(chainId, { status, conclusion, confidence });
  let memoryId = null;
  if (status === "completed" || status === "failed") {
    const deadEnds = chain.steps.filter((s) => s.was_dead_end);
    const stepSummary = chain.steps.map((s) => `${s.order}. ${s.action}${s.was_dead_end ? " [dead end]" : ""}`).join(" \u2192 ");
    const content = [
      `${chain.chain_type} chain: ${chain.trigger}`,
      `Steps (${chain.steps.length}): ${stepSummary}`,
      deadEnds.length > 0 ? `Dead ends: ${deadEnds.map((d) => d.action).join(", ")}` : null,
      `Conclusion: ${conclusion}`
    ].filter(Boolean).join("\n");
    const files = [...new Set(chain.steps.flatMap((s) => s.files))];
    const tags = [`chain:${chain.chain_type}`, `status:${status}`];
    if (context.domain) tags.push(`domain:${context.domain}`);
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: files.slice(0, 15),
      error_context: null,
      session_id: sessionId2,
      significance_score: REASONING_CHAIN.ENCODING_STRENGTH
    };
    const episodicData = {
      kind: "episodic",
      context: {
        project: context.project ?? "",
        task: context.task ?? chain.chain_type,
        framework: context.domain ?? "",
        version: context.version ?? "",
        files: files.slice(0, 10),
        models: []
      },
      outcome: status === "completed" ? "positive" : "negative",
      outcome_detail: conclusion.substring(0, 300),
      lesson: chain.steps.length >= 3 ? stepSummary.substring(0, 300) : null,
      lesson_validated: status === "completed",
      emotional_weight: status === "completed" ? 0.6 : 0.4
    };
    const memory = createMemory({
      type: "episodic",
      content: content.substring(0, 2e3),
      summary: `${chain.chain_type} chain: ${chain.trigger.substring(0, 100)}`,
      encoding_strength: REASONING_CHAIN.ENCODING_STRENGTH,
      reinforcement: 0,
      confidence,
      domains: context.domain ? [context.domain] : [],
      version: context.version,
      tags,
      storage_tier: "short_term",
      pinned: false,
      encoding_context: encodingContext,
      type_data: episodicData
    });
    memoryId = memory.id;
    updateReasoningChain(chainId, { memory_id: memoryId });
    logger.info("Reasoning chain encoded as memory", { chain_id: chainId, memory_id: memoryId, type: chain.chain_type, steps: chain.steps.length });
  }
  return { chainId, memoryId };
}
function timeoutStaleChains() {
  const active = getActiveReasoningChains();
  const cutoff = new Date(Date.now() - REASONING_CHAIN.CHAIN_TIMEOUT_MINUTES * 60 * 1e3).toISOString();
  let count = 0;
  for (const chain of active) {
    if (chain.updated_at < cutoff) {
      updateReasoningChain(chain.id, {
        status: "interrupted",
        conclusion: `Timed out after ${REASONING_CHAIN.CHAIN_TIMEOUT_MINUTES} minutes of inactivity`
      });
      count++;
    }
  }
  if (count > 0) {
    logger.info("Timed out stale reasoning chains", { count });
  }
  return count;
}
function detectFeedbackSignal(prompt) {
  const neutral = {
    signal: "neutral",
    intensity: 0,
    content: prompt,
    keywords: []
  };
  if (!prompt || prompt.length < FEEDBACK.MIN_PROMPT_LENGTH) return neutral;
  const lower = prompt.toLowerCase().trim();
  const antiScore = countPatternMatches(lower, FEEDBACK.ANTI_PATTERNS);
  const isRequestStyle = /^(can you|could you|would you|please |i need|i want|help me)/.test(lower);
  const effectiveAntiScore = isRequestStyle ? antiScore + 2 : antiScore;
  if (effectiveAntiScore >= 3) return neutral;
  const lengthPenalty = prompt.length > 300 ? 0.4 : prompt.length > 150 ? 0.7 : 1;
  const instructionScore = countPatternMatches(lower, FEEDBACK.INSTRUCTION_PATTERNS);
  if (instructionScore > 0) {
    return {
      signal: "instruction",
      intensity: Math.min(0.5 + instructionScore * 0.25, 1),
      content: prompt,
      keywords: extractKeywords(prompt).slice(0, 10)
    };
  }
  const frustrationScore = countPatternMatches(lower, FEEDBACK.FRUSTRATION_PATTERNS);
  if (frustrationScore > 0) {
    return {
      signal: "frustration",
      intensity: Math.min(0.6 + frustrationScore * 0.2, 1) * lengthPenalty,
      content: prompt,
      keywords: extractKeywords(prompt).slice(0, 10)
    };
  }
  const correctionScore = countPatternMatches(lower, FEEDBACK.CORRECTION_PATTERNS);
  if (correctionScore > 0 && correctionScore > effectiveAntiScore) {
    return {
      signal: "correction",
      intensity: Math.min(0.4 + correctionScore * 0.2, 1) * lengthPenalty,
      content: prompt,
      keywords: extractKeywords(prompt).slice(0, 10)
    };
  }
  const approvalScore = countPatternMatches(lower, FEEDBACK.APPROVAL_PATTERNS);
  if (approvalScore > 0 && approvalScore >= effectiveAntiScore) {
    return {
      signal: "approval",
      intensity: Math.min(0.3 + approvalScore * 0.2, 1) * lengthPenalty,
      content: prompt,
      keywords: extractKeywords(prompt).slice(0, 10)
    };
  }
  return neutral;
}
function detectTeachingSignal(prompt) {
  if (!prompt || prompt.length < TEACHING.MIN_PROMPT_LENGTH) return null;
  const lower = prompt.toLowerCase().trim();
  if (lower.includes("```")) return null;
  const antiScore = countPatternMatches(lower, TEACHING.TASK_ANTI_PATTERNS);
  if (antiScore >= TEACHING.ANTI_PATTERN_THRESHOLD) return null;
  const checks = [
    { type: "explanation_request", patterns: TEACHING.EXPLANATION_PATTERNS },
    { type: "reasoning_question", patterns: TEACHING.REASONING_PATTERNS },
    { type: "concept_question", patterns: TEACHING.CONCEPT_PATTERNS },
    { type: "comparison_request", patterns: TEACHING.COMPARISON_PATTERNS }
  ];
  for (const { type, patterns } of checks) {
    const score = countPatternMatches(lower, patterns);
    if (score > 0) {
      const keywords = extractKeywords(prompt);
      const topic = keywords.slice(0, 5).join(" ");
      return {
        type,
        topic,
        intensity: Math.min(0.3 + score * 0.25, 1),
        domain: null
        // Filled in by the pipeline from watcher state
      };
    }
  }
  const isQuestion2 = lower.endsWith("?") || /^(how|what|why|when|where|which|who|does|do|is|are|can|could|would|should)\b/.test(lower);
  if (isQuestion2) {
    const keywords = extractKeywords(prompt);
    if (keywords.length >= 2) {
      return {
        type: "progressive_question",
        topic: keywords.slice(0, 5).join(" "),
        intensity: 0.3,
        domain: null
      };
    }
  }
  return null;
}
function processFeedbackSignal(feedback, config2, sessionId2, context) {
  if (feedback.signal === "neutral") return null;
  const domains = context.domain ? [context.domain] : [];
  switch (feedback.signal) {
    case "approval":
      return handleApproval(feedback, domains);
    case "correction":
      return handleCorrection(feedback, config2, sessionId2, context, domains);
    case "frustration":
      return handleFrustration(feedback, config2, sessionId2, context, domains);
    case "instruction":
      return handleInstruction(feedback, config2, sessionId2, context, domains);
    default:
      return null;
  }
}
function handleApproval(feedback, domains) {
  try {
    const recent = getRecentMemories(FEEDBACK.MAX_AFFECTED_MEMORIES).filter((m) => m.type !== "antipattern");
    let strengthened = 0;
    for (const memory of recent) {
      const newConfidence = Math.min(
        memory.confidence + FEEDBACK.APPROVAL_CONFIDENCE_BOOST * (1 - memory.confidence),
        1
      );
      const newReinforcement = memory.reinforcement * FEEDBACK.APPROVAL_REINFORCEMENT_BOOST;
      updateMemory(memory.id, {
        confidence: newConfidence,
        reinforcement: newReinforcement
      });
      strengthened++;
    }
    logger.info("Approval feedback processed", {
      intensity: feedback.intensity.toFixed(2),
      memories_strengthened: strengthened
    });
    return null;
  } catch (e) {
    logger.error("Failed to process approval", { error: String(e) });
    return null;
  }
}
function handleCorrection(feedback, config2, sessionId2, context, domains) {
  try {
    const recent = getRecentMemories(FEEDBACK.MAX_AFFECTED_MEMORIES).filter((m) => m.type !== "antipattern");
    for (const memory2 of recent) {
      const newConfidence = memory2.confidence * FEEDBACK.CORRECTION_CONFIDENCE_DECAY;
      updateMemory(memory2.id, { confidence: newConfidence });
    }
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: [],
      error_context: null,
      session_id: sessionId2,
      significance_score: FEEDBACK.CORRECTION_ENCODING_STRENGTH
    };
    const typeData = {
      kind: "episodic",
      context: {
        project: context.project ?? "",
        task: "user_correction",
        framework: context.domain ?? "",
        version: context.version ?? "",
        files: [],
        models: []
      },
      outcome: "negative",
      outcome_detail: feedback.content,
      lesson: `User correction: ${feedback.content.substring(0, 200)}`,
      lesson_validated: true,
      // User said it, so it's validated
      emotional_weight: 0.6
    };
    const memory = createMemory({
      type: "episodic",
      content: `User correction: ${feedback.content}`,
      summary: feedback.content.length > 100 ? feedback.content.substring(0, 100) + "..." : null,
      encoding_strength: FEEDBACK.CORRECTION_ENCODING_STRENGTH,
      reinforcement: 1,
      confidence: 0.8,
      domains,
      version: context.version,
      tags: ["user_feedback", "correction", "auto_encoded"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: encodingContext,
      type_data: typeData
    });
    logger.info("Correction feedback encoded", {
      memory_id: memory.id,
      intensity: feedback.intensity.toFixed(2)
    });
    return memory.id;
  } catch (e) {
    logger.error("Failed to process correction", { error: String(e) });
    return null;
  }
}
function handleFrustration(feedback, config2, sessionId2, context, domains) {
  try {
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: [],
      error_context: feedback.content,
      session_id: sessionId2,
      significance_score: FEEDBACK.FRUSTRATION_ENCODING_STRENGTH
    };
    const ap = createAntipatternFromExperience(
      `User frustration: ${feedback.content}`,
      `Avoid repeating this mistake. User expressed frustration: "${feedback.content.substring(0, 150)}"`,
      "high",
      domains,
      context.version,
      feedback.keywords,
      encodingContext
    );
    try {
      const td = ap.type_data;
      autoCreateFromAntipattern(ap.id, td.trigger_keywords, domains[0] ?? "general", "high");
    } catch {
    }
    const recent = getRecentMemories(FEEDBACK.MAX_AFFECTED_MEMORIES).filter((m) => m.type !== "antipattern");
    for (const memory of recent) {
      const newConfidence = memory.confidence * FEEDBACK.CORRECTION_CONFIDENCE_DECAY;
      updateMemory(memory.id, { confidence: newConfidence });
    }
    logger.info("Frustration feedback encoded as antipattern", {
      memory_id: ap.id,
      intensity: feedback.intensity.toFixed(2)
    });
    return ap.id;
  } catch (e) {
    logger.error("Failed to process frustration", { error: String(e) });
    return null;
  }
}
function handleInstruction(feedback, config2, sessionId2, context, domains) {
  try {
    const encodingContext = {
      project: context.project,
      framework: context.domain,
      version: context.version,
      task_type: null,
      files: [],
      error_context: null,
      session_id: sessionId2,
      significance_score: FEEDBACK.INSTRUCTION_ENCODING_STRENGTH
    };
    const typeData = {
      kind: "semantic",
      knowledge_type: "convention",
      source: "user_instruction",
      source_episodes: [],
      applicable_versions: null,
      deprecated_in: null
    };
    const memory = createMemory({
      type: "semantic",
      content: `User instruction: ${feedback.content}`,
      summary: feedback.content.length > 100 ? feedback.content.substring(0, 100) + "..." : null,
      encoding_strength: FEEDBACK.INSTRUCTION_ENCODING_STRENGTH,
      reinforcement: 1.5,
      // Extra reinforcement — user directive
      confidence: FEEDBACK.INSTRUCTION_CONFIDENCE,
      domains,
      version: context.version,
      tags: ["user_feedback", "instruction", "user_directive", "auto_encoded"],
      storage_tier: "long_term",
      // Instructions go straight to long-term
      pinned: true,
      // Exempt from decay — user said it explicitly
      encoding_context: encodingContext,
      type_data: typeData
    });
    try {
      createProspectiveMemory({
        trigger_pattern: feedback.keywords.slice(0, 5).join(" "),
        action: feedback.content.substring(0, 300),
        domain: domains[0] ?? null,
        priority: 0.9,
        // High priority — user directive
        max_fires: 0,
        // Unlimited — always remind
        source_memory_id: memory.id
      });
    } catch {
    }
    logger.info("Instruction feedback encoded as pinned semantic memory", {
      memory_id: memory.id,
      intensity: feedback.intensity.toFixed(2),
      has_prospective: true
    });
    return memory.id;
  } catch (e) {
    logger.error("Failed to process instruction", { error: String(e) });
    return null;
  }
}
function countPatternMatches(lower, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    if (lower.includes(pattern)) count++;
  }
  return count;
}
function detectDiscovery(toolName, toolInput, toolOutput, sessionFiles, recentErrors, reasoningBuffer) {
  if (!toolOutput || toolOutput.length < 50) return null;
  switch (toolName) {
    case "Bash":
      return detectErrorResolutionDiscovery(toolInput, toolOutput, recentErrors, reasoningBuffer);
    case "Grep":
    case "Glob":
      return detectPatternFoundDiscovery(toolName, toolInput, toolOutput);
    case "Read":
      return detectArchitectureInsightDiscovery(toolInput, toolOutput, sessionFiles);
    default:
      return null;
  }
}
function encodeDiscovery(discovery, config2, sessionId2, context) {
  try {
    if (isRecallNoise(discovery.insight, "episodic")) {
      logger.info("Discovery skipped (noise filter)", { type: discovery.type });
      return null;
    }
    const fileDomains = inferDomainsFromFiles(discovery.files);
    const domains = fileDomains.length > 0 ? fileDomains : context.domain ? [context.domain] : [];
    const encodingContext = {
      project: context.project,
      framework: context.domain ?? domains[0] ?? null,
      version: context.version,
      task_type: null,
      files: discovery.files.slice(0, 15),
      error_context: discovery.type === "error_resolution" ? discovery.description : null,
      session_id: sessionId2,
      significance_score: DISCOVERY.ENCODING_STRENGTH
    };
    const emotionalWeight = discovery.type === "error_resolution" ? 0.5 : discovery.type === "architecture_insight" ? 0.35 : 0.3;
    const typeData = {
      kind: "episodic",
      context: {
        project: context.project ?? "",
        task: context.task ?? discovery.type,
        framework: context.domain ?? domains[0] ?? "",
        version: context.version ?? "",
        files: discovery.files.slice(0, 10),
        models: []
      },
      outcome: discovery.type === "error_resolution" ? "positive" : "neutral",
      outcome_detail: discovery.description,
      lesson: discovery.insight,
      lesson_validated: discovery.type === "error_resolution",
      emotional_weight: emotionalWeight
    };
    try {
      const existingDup = findDuplicate(discovery.insight, "episodic", domains);
      if (existingDup) {
        strengthenExisting(existingDup);
        logger.info("Discovery deduplicated", { existing_id: existingDup.id, type: discovery.type });
        return null;
      }
    } catch {
    }
    const memory = createMemory({
      type: "episodic",
      content: discovery.insight,
      summary: discovery.insight.length > 100 ? discovery.insight.substring(0, 100) + "..." : null,
      encoding_strength: DISCOVERY.ENCODING_STRENGTH,
      reinforcement: 1,
      confidence: DISCOVERY.CONFIDENCE,
      domains,
      version: context.version,
      tags: ["discovery", `disc_${discovery.type}`, "auto_encoded"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: encodingContext,
      type_data: typeData
    });
    if (discovery.files.length > 0) {
      try {
        const fileQuery = discovery.files.slice(0, 5).join(" ");
        const related = searchMemories(fileQuery, 3);
        for (const candidate of related) {
          if (candidate.id === memory.id) continue;
          const candidateFiles = candidate.encoding_context?.files ?? [];
          const hasOverlap = discovery.files.some(
            (f) => candidateFiles.includes(f) || candidate.content.includes(f)
          );
          if (!hasOverlap) continue;
          const existing = getConnections(memory.id).find(
            (c) => c.source_id === memory.id && c.target_id === candidate.id || c.source_id === candidate.id && c.target_id === memory.id
          );
          if (!existing) {
            createConnection({
              source_id: memory.id,
              target_id: candidate.id,
              strength: 0.5,
              type: "related"
            });
          }
        }
      } catch {
      }
    }
    const discoveryDomain = context.domain ?? domains[0];
    if (discoveryDomain) {
      try {
        const outcome = discovery.type === "error_resolution" ? "positive" : "neutral";
        if (outcome === "positive") recordDomainOutcome(discoveryDomain, outcome);
      } catch {
      }
    }
    logger.info("Discovery encoded", {
      type: discovery.type,
      memory_id: memory.id,
      files: discovery.files.length,
      tool: discovery.trigger_tool
    });
    return memory.id;
  } catch (e) {
    logger.error("Failed to encode discovery", { error: String(e) });
    return null;
  }
}
function detectErrorResolutionDiscovery(toolInput, toolOutput, recentErrors, reasoningBuffer) {
  if (recentErrors.length === 0) return null;
  const lower = toolOutput.toLowerCase();
  if (lower.includes("error") || lower.includes("traceback") || lower.includes("failed") || lower.includes("exception")) {
    return null;
  }
  const searches = reasoningBuffer.filter(
    (t) => REASONING_TRACE.SEARCH_TOOLS.includes(t.tool)
  );
  if (searches.length < DISCOVERY.MIN_INVESTIGATION_SEARCHES) return null;
  const command2 = toolInput?.command ?? "";
  const errorSummary = recentErrors[recentErrors.length - 1] ?? "unknown error";
  const investigationFiles = [...new Set(searches.flatMap((s) => s.files))];
  const investigationTopics = searches.slice(-3).map((s) => s.input_summary).filter((s) => s.length > 0);
  return {
    type: "error_resolution",
    description: `Resolved error after ${searches.length} investigation steps`,
    insight: `Error '${errorSummary.substring(0, 100)}' resolved. Investigation: ${investigationTopics.join("; ").substring(0, 200)}. Fix: ${command2.substring(0, 100)}`,
    files: investigationFiles.slice(0, 10),
    trigger_tool: "Bash"
  };
}
function detectPatternFoundDiscovery(toolName, toolInput, toolOutput) {
  const searchPattern = toolInput?.pattern ?? "";
  if (searchPattern.length < DISCOVERY.MIN_PATTERN_LENGTH) return null;
  const fileMatches = toolOutput.match(/^\/[^\s:]+/gm) ?? [];
  const uniqueFiles = [...new Set(fileMatches)];
  if (uniqueFiles.length < DISCOVERY.MIN_PATTERN_FILES) return null;
  if (uniqueFiles.length > DISCOVERY.MAX_PATTERN_FILES) return null;
  const fileNames = uniqueFiles.slice(0, 5).map((f) => f.split("/").pop() ?? f);
  return {
    type: "pattern_found",
    description: `Pattern '${searchPattern.substring(0, 80)}' found in ${uniqueFiles.length} files`,
    insight: `Pattern '${searchPattern}' exists across ${uniqueFiles.length} files: ${fileNames.join(", ")}`,
    files: uniqueFiles.slice(0, 10),
    trigger_tool: toolName
  };
}
function detectArchitectureInsightDiscovery(toolInput, toolOutput, sessionFiles) {
  const filePath = toolInput?.file_path ?? "";
  if (!filePath) return null;
  if (sessionFiles.includes(filePath)) return null;
  const isArchPath = DISCOVERY.ARCHITECTURE_PATHS.some((p) => filePath.includes(p));
  if (!isArchPath) return null;
  const scanOutput = toolOutput.substring(0, DISCOVERY.MAX_SCAN_LENGTH);
  const defRegex = /(?:^|[\s\u2192])(?:export\s+)?(?:class|def|function|interface|type)\s+(\w+)/gmi;
  const defNames = [];
  let defCount = 0;
  let match;
  while ((match = defRegex.exec(scanOutput)) !== null && defCount < 100) {
    defCount++;
    if (match[1] && defNames.length < 10) {
      defNames.push(match[1]);
    }
  }
  if (defCount < DISCOVERY.MIN_CODE_DEFINITIONS) return null;
  const fileName = filePath.split("/").pop() ?? filePath;
  const nameList = defNames.slice(0, 5).join(", ");
  return {
    type: "architecture_insight",
    description: `Architecture: ${fileName} has ${defCount} definitions: ${nameList}`,
    insight: `File ${filePath} contains ${defCount} code definitions: ${nameList}`,
    files: [filePath],
    trigger_tool: "Read"
  };
}
function inferDomainsFromFiles(files) {
  const domains = /* @__PURE__ */ new Set();
  for (const file of files) {
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    const domain = DISCOVERY.EXTENSION_DOMAIN_MAP[ext];
    if (domain) domains.add(domain);
  }
  return [...domains];
}
function extractConversationTopic(prompt) {
  if (!prompt || prompt.length < CONVERSATION.MIN_PROMPT_LENGTH) return null;
  const keywords = extractKeywords(prompt);
  if (keywords.length === 0) return null;
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const kw of keywords) {
    if (!seen.has(kw)) {
      seen.add(kw);
      unique.push(kw);
    }
    if (unique.length >= CONVERSATION.MAX_TOPIC_KEYWORDS) break;
  }
  return unique.join(", ");
}
function hasTopicChanged(currentTopic, newTopic) {
  if (!currentTopic && !newTopic) return false;
  if (!currentTopic || !newTopic) return true;
  const similarity = keywordSimilarity(currentTopic, newTopic);
  return similarity < CONVERSATION.TOPIC_CHANGE_THRESHOLD;
}
function updateConversationState(state, prompt) {
  const newTopic = extractConversationTopic(prompt);
  if (!newTopic) {
    if (state.current_topic) {
      const lastEntry = state.topic_history[state.topic_history.length - 1];
      if (lastEntry) lastEntry.turn_count++;
    }
    return state;
  }
  if (hasTopicChanged(state.current_topic, newTopic)) {
    if (state.current_topic) {
      const lastEntry = state.topic_history[state.topic_history.length - 1];
      if (lastEntry && lastEntry.turn_count < CONVERSATION.MIN_TOPIC_TURNS) {
        state.topic_history.pop();
      }
    }
    state.topic_history.push({
      topic: newTopic,
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      turn_count: 1
    });
    if (state.topic_history.length > CONVERSATION.MAX_TOPIC_HISTORY) {
      state.topic_history = state.topic_history.slice(-CONVERSATION.MAX_TOPIC_HISTORY);
    }
    state.current_topic = newTopic;
    logger.debug("Topic changed", { new_topic: newTopic });
  } else {
    const lastEntry = state.topic_history[state.topic_history.length - 1];
    if (lastEntry) {
      lastEntry.turn_count++;
    } else {
      state.topic_history.push({
        topic: newTopic,
        started_at: (/* @__PURE__ */ new Date()).toISOString(),
        turn_count: 1
      });
      state.current_topic = newTopic;
    }
  }
  detectOpenQuestions(state, prompt);
  return state;
}
function detectDecisionPoint(toolName, inputSummary, files) {
  if (!inputSummary || inputSummary.length < 20) return null;
  const lower = inputSummary.toLowerCase();
  const hasDecisionLanguage = CONVERSATION.DECISION_PATTERNS.some((p) => lower.includes(p));
  const isStrategicDelegation = toolName === "Agent" && inputSummary.length >= 50;
  const hasRefactorLanguage = DECISION.REFACTOR_PATTERNS.some((p) => lower.includes(p));
  const choiceMatch = extractChoicePattern(inputSummary);
  const comparisonMatch = extractComparisonPattern(inputSummary);
  if (!hasDecisionLanguage && !isStrategicDelegation && !hasRefactorLanguage && !choiceMatch && !comparisonMatch) {
    return null;
  }
  let chosen;
  let rationale = "";
  const alternatives = [];
  const constraints = [];
  if (choiceMatch) {
    chosen = choiceMatch.chosen.substring(0, DECISION.MAX_CHOSEN_LENGTH);
    rationale = choiceMatch.rationale.substring(0, DECISION.MAX_RATIONALE_LENGTH);
    if (choiceMatch.rejected) {
      alternatives.push({
        description: choiceMatch.rejected.substring(0, DECISION.MAX_CHOSEN_LENGTH),
        rejected_reason: rationale
      });
    }
  } else if (comparisonMatch) {
    chosen = comparisonMatch.options[0]?.substring(0, DECISION.MAX_CHOSEN_LENGTH) ?? inputSummary.substring(0, DECISION.MAX_CHOSEN_LENGTH);
    for (const opt of comparisonMatch.options.slice(1, DECISION.MAX_ALTERNATIVES + 1)) {
      alternatives.push({
        description: opt.substring(0, DECISION.MAX_CHOSEN_LENGTH),
        rejected_reason: "Alternative considered"
      });
    }
  } else if (isStrategicDelegation) {
    chosen = `Delegated: ${inputSummary.substring(0, 120)}`;
  } else {
    chosen = inputSummary.substring(0, DECISION.MAX_CHOSEN_LENGTH);
  }
  const decision_type = inferDecisionType(lower);
  const constraintPatterns = [
    /(?:because of|due to|limited by|constraint|requirement)[:]\s*(.{5,100})/gi,
    /(?:can't|cannot|must not|shouldn't)\s+(.{5,80})/gi
  ];
  for (const pat of constraintPatterns) {
    const m = pat.exec(inputSummary);
    if (m?.[1] && constraints.length < DECISION.MAX_CONSTRAINTS) {
      constraints.push(m[1].trim().substring(0, 100));
    }
  }
  const description = isStrategicDelegation ? `Delegated: ${inputSummary.substring(0, 120)}` : choiceMatch ? `Chose ${chosen}` : hasRefactorLanguage ? `Refactoring: ${inputSummary.substring(0, 130)}` : inputSummary.substring(0, 150);
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    description,
    chosen_approach: chosen,
    alternatives,
    rationale,
    constraints,
    decision_type,
    files: files.slice(0, 10)
  };
}
function extractChoicePattern(text) {
  const optedMatch = /opted\s+for\s+(.{5,80}?)\s+(?:over|instead\s+of)\s+(.{5,80})/i.exec(text);
  if (optedMatch?.[1] && optedMatch?.[2]) {
    return {
      chosen: optedMatch[1].trim(),
      rationale: `Preferred over ${optedMatch[2].trim()}`,
      rejected: optedMatch[2].trim()
    };
  }
  for (const pattern of DECISION.CHOICE_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1] && match?.[2]) {
      return {
        chosen: match[1].trim(),
        rationale: match[2].trim(),
        rejected: null
      };
    }
  }
  return null;
}
function extractComparisonPattern(text) {
  for (const pattern of DECISION.COMPARISON_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const options = [match[1], match[2]].filter(Boolean).map((s) => s.trim());
      if (options.length >= 1) {
        return { options };
      }
    }
  }
  return null;
}
function inferDecisionType(lowerText) {
  let bestType = "approach";
  let bestScore = 0;
  for (const [type, keywords] of Object.entries(DECISION.TYPE_PATTERNS)) {
    const score = keywords.filter((kw) => lowerText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  return bestType;
}
function detectOpenQuestions(state, prompt) {
  const lower = prompt.toLowerCase().trim();
  const isTaskRequest = CONVERSATION.QUESTION_ANTI_PATTERNS.some((p) => lower.startsWith(p));
  if (isTaskRequest) return;
  const isQuestion2 = CONVERSATION.QUESTION_INDICATORS.some((p) => lower.includes(p));
  if (!isQuestion2) {
    if (state.open_questions.length > 0) {
      state.open_questions = state.open_questions.filter((q) => {
        const similarity = keywordSimilarity(prompt, q);
        return similarity < 0.4;
      });
    }
    return;
  }
  const question = prompt.length > 120 ? prompt.substring(0, 120) + "..." : prompt;
  const isDuplicate = state.open_questions.some((existing) => {
    return keywordSimilarity(question, existing) > 0.5;
  });
  if (!isDuplicate) {
    state.open_questions.push(question);
    if (state.open_questions.length > CONVERSATION.MAX_OPEN_QUESTIONS) {
      state.open_questions.shift();
    }
  }
}
function createEmptyConversationState() {
  return {
    current_topic: null,
    topic_history: [],
    decision_points: [],
    open_questions: []
  };
}
function composeSessionNarrative(params) {
  if (params.total_turns < SESSION_NARRATIVE.MIN_TURNS_FOR_NARRATIVE) {
    return null;
  }
  const goal = extractGoal({
    ...params,
    cognitive_state: params.cognitive_state,
    session_files: params.session_files
  });
  const approach = params.cognitive_state?.current_approach ?? extractApproach(params.conversation);
  const challenges = extractChallenges(params);
  const baseLessons = extractLessons(params);
  const lessons = [...baseLessons];
  if (params.cognitive_state?.recent_discovery && !lessons.includes(params.cognitive_state.recent_discovery)) {
    lessons.push(params.cognitive_state.recent_discovery);
  }
  if (params.cognitive_state?.active_hypothesis && !lessons.includes(params.cognitive_state.active_hypothesis)) {
    lessons.push(`Hypothesis: ${params.cognitive_state.active_hypothesis}`);
  }
  const userSentiment = deriveSentiment(params.feedback_signals);
  const unfinished = extractUnfinished(params.conversation);
  const emotionalWeight = computeEmotionalWeight(params);
  const isRich = params.total_turns >= SESSION_NARRATIVE.MIN_TURNS_FOR_RICH_NARRATIVE;
  const narrativeText = composeNarrativeText({
    goal,
    approach,
    challenges,
    lessons,
    userSentiment,
    unfinished,
    isRich,
    params
  });
  return {
    goal,
    approach,
    challenges,
    lessons,
    user_sentiment: userSentiment,
    unfinished,
    emotional_weight: emotionalWeight,
    narrative_text: narrativeText
  };
}
function extractGoal(params) {
  if (params.active_task) return params.active_task;
  if (params.cognitive_state?.current_approach) {
    return params.cognitive_state.current_approach;
  }
  if (params.cognitive_state?.recent_discovery && params.session_files && params.session_files.length > 0) {
    const topFiles = params.session_files.slice(-3).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
    return `${params.cognitive_state.recent_discovery} (${topFiles})`;
  }
  if (params.session_files && params.session_files.length > 0) {
    const topFiles = params.session_files.slice(-5).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
    return `modifying ${topFiles}`;
  }
  if (params.conversation.topic_history.length > 0) {
    const topic = params.conversation.topic_history[0].topic;
    const commaCount = (topic.match(/,/g) || []).length;
    const wordCount = topic.split(/\s+/).length;
    const isVagueKeywordList = commaCount >= 2 && wordCount <= commaCount + 2;
    if (!isVagueKeywordList) {
      return topic;
    }
  }
  return null;
}
function extractApproach(conversation) {
  const topics = conversation.topic_history.filter((t) => t.turn_count >= 1).map((t) => t.topic);
  if (topics.length === 0) return null;
  if (topics.length === 1) return topics[0];
  const arc = topics.slice(0, 5);
  if (arc.length === 2) {
    return `${arc[0]}, then ${arc[1]}`;
  }
  return `${arc.slice(0, -1).join(", ")}, then ${arc[arc.length - 1]}`;
}
function extractChallenges(params) {
  const challenges = [];
  for (const err of params.recent_errors.slice(-SESSION_NARRATIVE.MAX_CHALLENGES)) {
    const truncated = err.length > SESSION_NARRATIVE.MAX_CHALLENGE_LENGTH ? err.substring(0, SESSION_NARRATIVE.MAX_CHALLENGE_LENGTH - 3) + "..." : err;
    challenges.push(truncated);
  }
  if (params.feedback_signals.correction > 0) {
    challenges.push(
      `Received ${params.feedback_signals.correction} correction${params.feedback_signals.correction > 1 ? "s" : ""} from user`
    );
  }
  if (params.feedback_signals.frustration > 0) {
    challenges.push(
      `User expressed frustration ${params.feedback_signals.frustration} time${params.feedback_signals.frustration > 1 ? "s" : ""}`
    );
  }
  return challenges.slice(0, SESSION_NARRATIVE.MAX_CHALLENGES);
}
function extractLessons(params) {
  const lessons = [];
  for (const dp of params.conversation.decision_points.slice(-3)) {
    const text = dp.description.length > SESSION_NARRATIVE.MAX_LESSON_LENGTH ? dp.description.substring(0, SESSION_NARRATIVE.MAX_LESSON_LENGTH - 3) + "..." : dp.description;
    lessons.push(text);
  }
  if (params.discovery_encoded_count > 0) {
    lessons.push(
      `Made ${params.discovery_encoded_count} ${params.discovery_encoded_count > 1 ? "discoveries" : "discovery"}`
    );
  }
  if (params.feedback_signals.instruction > 0) {
    lessons.push(
      `Received ${params.feedback_signals.instruction} new instruction${params.feedback_signals.instruction > 1 ? "s" : ""} from user`
    );
  }
  return lessons.slice(0, SESSION_NARRATIVE.MAX_LESSONS);
}
function deriveSentiment(signals) {
  const positive = signals.approval;
  const negative = signals.correction + signals.frustration * 2;
  if (positive === 0 && negative === 0) return "neutral";
  if (negative === 0 && positive > 0) return "positive";
  if (positive === 0 && negative > 0) return "negative";
  return "mixed";
}
function extractUnfinished(conversation) {
  return conversation.open_questions.slice(-SESSION_NARRATIVE.MAX_UNFINISHED).map(
    (q) => q.length > SESSION_NARRATIVE.MAX_LESSON_LENGTH ? q.substring(0, SESSION_NARRATIVE.MAX_LESSON_LENGTH - 3) + "..." : q
  );
}
function computeEmotionalWeight(params) {
  let weight = SESSION_NARRATIVE.BASE_EMOTIONAL_WEIGHT;
  weight += Math.min(params.recent_errors.length, 5) * SESSION_NARRATIVE.ERROR_WEIGHT_BOOST;
  weight += params.feedback_signals.correction * SESSION_NARRATIVE.CORRECTION_WEIGHT_BOOST;
  weight += params.feedback_signals.frustration * SESSION_NARRATIVE.FRUSTRATION_WEIGHT_BOOST;
  weight -= params.feedback_signals.approval * SESSION_NARRATIVE.APPROVAL_WEIGHT_REDUCE;
  return Math.max(
    SESSION_NARRATIVE.MIN_EMOTIONAL_WEIGHT,
    Math.min(SESSION_NARRATIVE.MAX_EMOTIONAL_WEIGHT, weight)
  );
}
function composeNarrativeText(ctx) {
  const parts = [];
  const durationMin = Math.round(
    (Date.now() - new Date(ctx.params.session_start).getTime()) / 6e4
  );
  const opening = [];
  if (ctx.params.active_project) opening.push(ctx.params.active_project);
  if (ctx.params.active_domain) opening.push(ctx.params.active_domain);
  const contextStr = opening.length > 0 ? ` (${opening.join(", ")})` : "";
  const turnWord = ctx.params.total_turns === 1 ? "turn" : "turns";
  if (ctx.goal) {
    parts.push(`Worked on: ${ctx.goal}${contextStr}. ${durationMin}min, ${ctx.params.total_turns} ${turnWord}.`);
  } else {
    parts.push(`Session${contextStr}: ${durationMin}min, ${ctx.params.total_turns} ${turnWord}.`);
  }
  if (ctx.approach && ctx.isRich) {
    parts.push(`Approach: ${ctx.approach}.`);
  }
  if (ctx.challenges.length > 0) {
    if (ctx.isRich) {
      parts.push(`Challenges: ${ctx.challenges.join("; ")}.`);
    } else {
      parts.push(`${ctx.challenges.length} challenge${ctx.challenges.length > 1 ? "s" : ""} encountered.`);
    }
  }
  if (ctx.lessons.length > 0) {
    if (ctx.isRich) {
      parts.push(`Learned: ${ctx.lessons.join("; ")}.`);
    } else {
      parts.push(`${ctx.lessons.length} lesson${ctx.lessons.length > 1 ? "s" : ""} captured.`);
    }
  }
  const sentimentMap = {
    positive: "User was satisfied.",
    mixed: "User had mixed reactions \u2014 some corrections alongside approvals.",
    negative: "User was unsatisfied \u2014 corrections or frustration expressed.",
    neutral: ""
    // Don't mention neutral — it's the default
  };
  const sentimentText = sentimentMap[ctx.userSentiment];
  if (sentimentText) parts.push(sentimentText);
  if (ctx.params.session_files.length > 0) {
    const fileNames = ctx.params.session_files.slice(-10).map((f) => f.split(/[/\\]/).pop() ?? f);
    parts.push(`Files: ${fileNames.join(", ")}.`);
  }
  if (ctx.unfinished.length > 0) {
    parts.push(`Unfinished: ${ctx.unfinished.join("; ")}.`);
  }
  let text = parts.join(" ");
  if (text.length > SESSION_NARRATIVE.MAX_NARRATIVE_LENGTH) {
    text = text.substring(0, SESSION_NARRATIVE.MAX_NARRATIVE_LENGTH - 3) + "...";
  }
  return text;
}

// src/engines/compaction.ts
var logger2 = createLogger("compaction");
function buildPostCompactionPayload(context, config2) {
  const sections = [];
  let totalTokens = 0;
  const budget = context.token_budget || config2.retrieval.default_token_budget;
  if (context.domain) {
    const allAntipatterns = getAntipatterns(context.domain);
    if (allAntipatterns.length > 0) {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...allAntipatterns].sort((a, b) => {
        const aSev = isAntipatternData(a.type_data) ? a.type_data.severity : "medium";
        const bSev = isAntipatternData(b.type_data) ? b.type_data.severity : "medium";
        return (severityOrder[aSev] ?? 3) - (severityOrder[bSev] ?? 3);
      });
      const capped = sorted.slice(0, COMPACTION.MAX_ANTIPATTERNS_IN_PAYLOAD);
      const section = buildSection("Antipatterns", capped, budget - totalTokens);
      sections.push(section);
      totalTokens += section.tokens;
    }
  }
  if (context.recent_errors.length > 0 && totalTokens < budget) {
    const errorQuery = context.recent_errors.join(" ");
    const errorMemories = searchMemories(errorQuery, 5).filter((m) => {
      const c = m.content;
      if (c.startsWith("<analysis>") || c.startsWith("<summary>")) return false;
      if (c.startsWith("Command:") || c.includes("Claude is waiting")) return false;
      if (c.includes("subagent") || c.includes("Subagent")) {
        if (!c.includes("Discovery:") && !c.includes("Conclusion:") && !c.includes("Lesson:")) return false;
      }
      return true;
    });
    if (errorMemories.length > 0) {
      const section = buildSection("Error Context", errorMemories, budget - totalTokens);
      sections.push(section);
      totalTokens += section.tokens;
    }
  }
  if (context.active_task && totalTokens < budget) {
    const taskMemories = searchMemories(context.active_task, 5).filter((m) => m.type === "procedural" || m.type === "semantic");
    if (taskMemories.length > 0) {
      const section = buildSection("Task Knowledge", taskMemories, budget - totalTokens);
      sections.push(section);
      totalTokens += section.tokens;
    }
  }
  if (context.domain && totalTokens < budget) {
    const domainMemories = getMemoriesByDomain(context.domain, 10).filter((m) => m.confidence > COMPACTION.DOMAIN_MEMORY_CONFIDENCE_THRESHOLD).filter((m) => !sections.some((s) => s.memories.some((sm) => sm.id === m.id)));
    if (domainMemories.length > 0) {
      const section = buildSection("Domain Knowledge", domainMemories, budget - totalTokens);
      sections.push(section);
      totalTokens += section.tokens;
    }
  }
  logger2.info("Built compaction payload", {
    sections: sections.length,
    total_tokens: totalTokens,
    budget
  });
  return { sections, total_tokens: totalTokens };
}
function formatCompactionPayload(payload) {
  if (payload.sections.length === 0) {
    return "";
  }
  const parts = ["# Engram Memory Context\n"];
  for (const section of payload.sections) {
    parts.push(`## ${section.title}`);
    if (section.text) {
      parts.push(section.text);
    } else {
      for (const mem of section.memories) {
        const apData = isAntipatternData(mem.type_data) ? mem.type_data : null;
        const prefix = mem.type === "antipattern" ? `[${(apData?.severity ?? "WARN").toUpperCase()}]` : `[${mem.type}]`;
        parts.push(`- ${prefix} ${mem.summary ?? mem.content}`);
        if (mem.type === "antipattern") {
          parts.push(`  Fix: ${apData?.fix ?? "N/A"}`);
        }
      }
    }
    parts.push("");
  }
  return parts.join("\n");
}
function buildUnderstandingSnapshot(input) {
  let architectureDelta = null;
  if (input.project_path && input.session_files.length > 0) {
    const filesToQuery = input.session_files.slice(0, PRE_COMPACTION.MAX_ARCH_DELTA_FILES);
    const seenNodes = /* @__PURE__ */ new Set();
    const nodeDescriptions = [];
    for (const file of filesToQuery) {
      try {
        const nodes = getArchNodesByFile(input.project_path, file);
        for (const node of nodes) {
          const key = `${node.name}:${node.type}`;
          if (!seenNodes.has(key)) {
            seenNodes.add(key);
            nodeDescriptions.push(`${node.name} (${node.role})`);
          }
        }
      } catch {
      }
    }
    if (nodeDescriptions.length > 0) {
      architectureDelta = `Components explored: ${nodeDescriptions.join(", ")}`;
    }
  }
  const keyDecisions = [];
  const decisionIds = input.decision_memory_ids.slice(0, PRE_COMPACTION.MAX_KEY_DECISIONS);
  for (const id of decisionIds) {
    try {
      const mem = getMemory(id);
      if (mem && isDecisionData(mem.type_data)) {
        const td = mem.type_data;
        keyDecisions.push(`Chose ${td.chosen} because ${td.rationale}`);
      }
    } catch {
    }
  }
  if (keyDecisions.length === 0 && input.conversation.decision_points.length > 0) {
    for (const dp of input.conversation.decision_points.slice(-3)) {
      const rationale = dp.rationale ? ` because ${dp.rationale.slice(0, 100)}` : "";
      keyDecisions.push(`Chose ${dp.chosen_approach.slice(0, 80)}${rationale}`);
    }
  }
  const activeChains = [];
  const chainIds = input.active_chain_ids.slice(0, PRE_COMPACTION.MAX_ACTIVE_CHAINS);
  for (const id of chainIds) {
    try {
      const chain = getReasoningChain(id);
      if (chain) {
        const deadEnds = chain.steps.filter((s) => s.was_dead_end).length;
        activeChains.push(`${chain.chain_type}: ${chain.trigger} (${chain.steps.length} steps, ${deadEnds} dead ends)`);
      }
    } catch {
    }
  }
  let problemModel = null;
  if (input.active_task) {
    problemModel = input.active_task;
    const lastTopic = input.conversation.topic_history.length > 0 ? input.conversation.topic_history[input.conversation.topic_history.length - 1] : null;
    if (lastTopic && !problemModel.includes(lastTopic.topic)) {
      problemModel = `${problemModel} \u2014 exploring: ${lastTopic.topic}`;
    }
    if (problemModel.length > PRE_COMPACTION.MAX_PROBLEM_MODEL_LENGTH) {
      problemModel = problemModel.slice(0, PRE_COMPACTION.MAX_PROBLEM_MODEL_LENGTH);
    }
  }
  const confidenceMap = {};
  for (const entry of input.conversation.topic_history) {
    confidenceMap[entry.topic] = Math.min(
      entry.turn_count * PRE_COMPACTION.CONFIDENCE_PER_TOPIC_TURN,
      PRE_COMPACTION.MAX_TOPIC_CONFIDENCE
    );
  }
  const openQuestions = [];
  for (const dp of input.conversation.decision_points) {
    if (!dp.chosen_approach || dp.chosen_approach === "") {
      openQuestions.push(dp.description);
      if (openQuestions.length >= PRE_COMPACTION.MAX_OPEN_QUESTIONS) break;
    }
  }
  const snapshot = {
    architecture_delta: architectureDelta,
    key_decisions: keyDecisions,
    active_chains: activeChains,
    problem_model: problemModel,
    confidence_map: confidenceMap,
    open_questions: openQuestions
  };
  if (input.active_domain) {
    try {
      const synthesis = synthesizeDomainKnowledge(input.active_domain);
      if (synthesis) {
        snapshot.synthesis_narrative = composeKnowledgeNarrative(synthesis);
        snapshot.key_patterns = synthesis.key_patterns;
        snapshot.concept_clusters = synthesis.concept_clusters;
      }
    } catch {
    }
  }
  return snapshot;
}
function buildRecoveryContext(input) {
  const mustRecallIds = input.decision_memory_ids.slice(0, PRE_COMPACTION.MAX_MUST_RECALL_IDS);
  const topicSet = /* @__PURE__ */ new Set();
  const stopwords = COMPACTION.STOPWORDS;
  if (input.active_task) {
    const words = input.active_task.split(/\s+/).filter((w) => w.length > 3).map((w) => w.toLowerCase());
    for (const w of words) {
      if (!stopwords.has(w)) topicSet.add(w);
    }
  }
  if (input.active_domain) {
    topicSet.add(input.active_domain);
  }
  for (const entry of input.conversation.topic_history) {
    const parts = entry.topic.split(",").map((w) => w.trim().toLowerCase()).filter((w) => w.length > 2);
    for (const p of parts) {
      if (!stopwords.has(p)) topicSet.add(p);
    }
  }
  const projectFiles = input.active_project ? input.session_files.filter((f) => f.toLowerCase().includes(input.active_project.toLowerCase())) : input.session_files;
  for (const file of projectFiles.slice(-10)) {
    const name = file.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") ?? "";
    if (name.length > 2 && !stopwords.has(name.toLowerCase())) topicSet.add(name);
  }
  const highValueTopics = Array.from(topicSet).slice(0, PRE_COMPACTION.MAX_HIGH_VALUE_TOPICS);
  let continuationHint = null;
  const live = input.cognitive_state;
  if (live && (live.current_approach || live.active_hypothesis || live.recent_discovery || live.search_intent)) {
    const hintParts = [];
    if (input.active_task) {
      const taskShort = input.active_task.split(/[.;!\n]/)[0]?.trim() ?? input.active_task;
      hintParts.push(`Task: ${taskShort.slice(0, 150)}`);
    }
    if (live.current_approach) hintParts.push(`Approach: ${live.current_approach}`);
    if (live.active_hypothesis) hintParts.push(`Investigating: ${live.active_hypothesis}`);
    if (live.recent_discovery) hintParts.push(`Found: ${live.recent_discovery}`);
    if (live.search_intent) hintParts.push(`Next: ${live.search_intent}`);
    const errors = input.recent_errors ?? [];
    if (errors.length > 0 && errors[errors.length - 1]) {
      hintParts.push(`Blocker: ${errors[errors.length - 1]}`);
    }
    continuationHint = hintParts.join(". ");
  } else if (input.active_task) {
    const taskShort = input.active_task.split(/[.;!\n]/)[0]?.trim() ?? input.active_task;
    const parts = [`Task: ${taskShort.slice(0, 150)}`];
    const resolvedDecision = input.conversation.decision_points.find((dp) => dp.chosen_approach && dp.chosen_approach !== "");
    if (resolvedDecision) {
      parts.push(`Approach: ${resolvedDecision.chosen_approach}`);
    }
    const lastTopic = input.conversation.topic_history.length > 0 ? input.conversation.topic_history[input.conversation.topic_history.length - 1]?.topic : null;
    if (lastTopic) parts.push(`Exploring: ${lastTopic}`);
    const errors = input.recent_errors ?? [];
    if (errors.length > 0 && errors[errors.length - 1]) {
      parts.push(`Blocker: ${errors[errors.length - 1]}`);
    }
    const firstOpen = input.conversation.open_questions.length > 0 ? input.conversation.open_questions[0] : null;
    if (firstOpen) parts.push(`Unresolved: ${firstOpen}`);
    continuationHint = parts.join(". ");
  }
  if (continuationHint && continuationHint.length > PRE_COMPACTION.MAX_CONTINUATION_HINT_LENGTH) {
    continuationHint = continuationHint.slice(0, PRE_COMPACTION.MAX_CONTINUATION_HINT_LENGTH);
  }
  const activeBlockers = [];
  const reasoningTrailParts = [];
  for (const chainId of (input.active_chain_ids ?? []).slice(0, 3)) {
    try {
      const chain = getReasoningChain(chainId);
      if (chain && chain.status === "active") {
        const lastStep = chain.steps.length > 0 ? chain.steps[chain.steps.length - 1] : null;
        const stepSummary = lastStep ? ` \u2192 last: ${lastStep.action.slice(0, 80)}` : "";
        activeBlockers.push(`${chain.chain_type}: ${chain.trigger.slice(0, 100)}${stepSummary}`);
        for (const step of chain.steps.slice(-5)) {
          const action = step.action.slice(0, 60);
          const inference = step.inference ? ` \u2192 ${step.inference.slice(0, 80)}` : "";
          reasoningTrailParts.push(`${action}${inference}`);
        }
      }
    } catch {
    }
  }
  for (const err of (input.recent_errors ?? []).slice(-2)) {
    activeBlockers.push(err);
  }
  let inferredApproach = null;
  if (!live?.current_approach) {
    const latestDecision = [...input.conversation.decision_points].reverse().find((dp) => dp.chosen_approach && dp.chosen_approach !== "");
    if (latestDecision) {
      inferredApproach = `${latestDecision.chosen_approach} \u2014 ${latestDecision.description}`.slice(0, 200);
    }
  }
  let inferredDiscovery = null;
  if (!live?.recent_discovery) {
    const deepTopics = input.conversation.topic_history.filter((t) => t.turn_count >= 3);
    if (deepTopics.length > 0) {
      const latest = deepTopics[deepTopics.length - 1];
      inferredDiscovery = `Deep exploration of ${latest.topic} (${latest.turn_count} turns)`;
    }
  }
  let inferredNextStep = null;
  if (!live?.search_intent) {
    if (input.conversation.open_questions.length > 0) {
      inferredNextStep = `Resolve: ${input.conversation.open_questions[0]}`;
    } else if (input.conversation.topic_history.length > 0) {
      const last = input.conversation.topic_history[input.conversation.topic_history.length - 1];
      inferredNextStep = `Continue: ${last.topic}`;
    }
  }
  let inferredHypothesis = null;
  if (!live?.active_hypothesis) {
    for (const chainId of (input.active_chain_ids ?? []).slice(0, 3)) {
      try {
        const chain = getReasoningChain(chainId);
        if (chain && chain.steps.length > 0) {
          const lastStep = chain.steps[chain.steps.length - 1];
          if (lastStep.inference) {
            inferredHypothesis = lastStep.inference.slice(0, 200);
            break;
          }
        }
      } catch {
      }
    }
  }
  const cognitiveContext = {
    current_approach: live?.current_approach ?? inferredApproach,
    recent_discovery: live?.recent_discovery ?? inferredDiscovery,
    planned_next_step: live?.search_intent ?? inferredNextStep,
    active_hypothesis: live?.active_hypothesis ?? inferredHypothesis
  };
  const workingState = {
    current_files: projectFiles.slice(-5),
    current_task_step: input.conversation.open_questions.length > 0 ? input.conversation.open_questions[0] : input.conversation.topic_history.length > 0 ? input.conversation.topic_history[input.conversation.topic_history.length - 1]?.topic ?? null : null,
    recent_tool_names: (input.recent_tool_names ?? []).slice(-10),
    error_context: (input.recent_errors ?? []).length > 0 ? (input.recent_errors ?? [])[input.recent_errors.length - 1] ?? null : null,
    active_blockers: activeBlockers,
    cognitive_context: cognitiveContext
  };
  return {
    must_recall_ids: mustRecallIds,
    high_value_topics: highValueTopics,
    continuation_hint: continuationHint,
    reasoning_trail: reasoningTrailParts.length > 0 ? reasoningTrailParts.slice(0, 10) : void 0,
    working_state: workingState
  };
}
function composeUnderstandingNarrative(understanding, recovery, sessionOutcomes) {
  const maxChars = PRE_COMPACTION.NARRATIVE_TOKEN_BUDGET * 4;
  const lines = ["[ENGRAM UNDERSTANDING]"];
  if (understanding.problem_model) {
    lines.push(`Task: ${understanding.problem_model}`);
  }
  if (sessionOutcomes && sessionOutcomes.length > 0) {
    lines.push(`Completed: ${sessionOutcomes.join("; ")}`);
  }
  const cogCtx = recovery.working_state?.cognitive_context;
  if (cogCtx) {
    if (cogCtx.current_approach) {
      lines.push(`Approach: ${cogCtx.current_approach}`);
    } else if (understanding.key_decisions.length > 0) {
      lines.push(`Approach: ${understanding.key_decisions[0]}`);
    }
    if (cogCtx.active_hypothesis) lines.push(`Hypothesis: ${cogCtx.active_hypothesis}`);
    if (cogCtx.recent_discovery) lines.push(`Discovery: ${cogCtx.recent_discovery}`);
    if (cogCtx.planned_next_step) lines.push(`Intent: ${cogCtx.planned_next_step}`);
  } else if (understanding.key_decisions.length > 0) {
    lines.push(`Approach: ${understanding.key_decisions[0]}`);
  }
  const extraDecisions = cogCtx?.current_approach ? understanding.key_decisions : understanding.key_decisions.slice(1);
  if (extraDecisions.length > 0) {
    lines.push(`Also decided: ${extraDecisions.join("; ")}`);
  }
  if (understanding.architecture_delta && understanding.architecture_delta !== cogCtx?.recent_discovery) {
    lines.push(`Discovered: ${understanding.architecture_delta}`);
  }
  if (understanding.active_chains.length > 0) {
    lines.push(`Investigating: ${understanding.active_chains.join("; ")}`);
  }
  if (recovery.reasoning_trail && recovery.reasoning_trail.length > 0) {
    lines.push(`Reasoning trail: ${recovery.reasoning_trail.slice(0, 5).join("; ")}`);
  }
  if (recovery.working_state?.cognitive_context) {
    const tools = recovery.working_state.recent_tool_names;
    if (tools.length > 0) {
      const toolSummary = tools.slice(-5).join(" \u2192 ");
      lines.push(`Recent tools: ${toolSummary}`);
    }
  }
  if (recovery.continuation_hint) {
    lines.push(`Next: ${recovery.continuation_hint}`);
  }
  if (recovery.working_state?.active_blockers && recovery.working_state.active_blockers.length > 0) {
    lines.push(`Blockers: ${recovery.working_state.active_blockers.join("; ")}`);
  }
  if (understanding.open_questions.length > 0) {
    lines.push(`Open: ${understanding.open_questions.join("; ")}`);
  }
  const confEntries = Object.entries(understanding.confidence_map);
  if (confEntries.length > 0) {
    const high = confEntries.filter(([, v]) => v >= 0.6).map(([k]) => k);
    const medium = confEntries.filter(([, v]) => v >= 0.3 && v < 0.6).map(([k]) => k);
    const confParts = [];
    if (high.length > 0) confParts.push(`high: ${high.join(", ")}`);
    if (medium.length > 0) confParts.push(`medium: ${medium.join(", ")}`);
    if (confParts.length > 0) {
      lines.push(`Confidence: ${confParts.join("; ")}`);
    }
  }
  if (recovery.working_state?.current_files && recovery.working_state.current_files.length > 0) {
    const fileNames = recovery.working_state.current_files.map((f) => f.split(/[/\\]/).pop() ?? f);
    lines.push(`Files: ${fileNames.join(", ")}`);
  }
  if (understanding.synthesis_narrative) {
    lines.push(`Synthesis: ${understanding.synthesis_narrative}`);
  }
  if (understanding.key_patterns && understanding.key_patterns.length > 0) {
    lines.push(`Patterns: ${understanding.key_patterns.join(", ")}`);
  }
  let result = lines.join("\n");
  if (result.length > maxChars) {
    result = result.slice(0, maxChars);
  }
  return result;
}
function buildEnhancedPostCompactionPayload(context, config2) {
  const baseContext = {
    domain: context.domain,
    version: context.version,
    active_task: context.active_task,
    recent_errors: context.recent_errors,
    token_budget: context.token_budget
  };
  const payload = buildPostCompactionPayload(baseContext, config2);
  if (context.understanding) {
    const recovery = context.recovery ?? {
      must_recall_ids: [],
      high_value_topics: [],
      continuation_hint: null
    };
    const narrative = composeUnderstandingNarrative(context.understanding, recovery);
    if (narrative.length > 0) {
      const narrativeTokens = estimateTokens(narrative);
      payload.sections.push({
        title: "Session Understanding",
        memories: [],
        tokens: narrativeTokens,
        text: narrative
      });
      payload.total_tokens += narrativeTokens;
    }
  }
  if (context.recovery && context.recovery.must_recall_ids.length > 0) {
    const recoveryMemories = [];
    for (const id of context.recovery.must_recall_ids) {
      try {
        const mem = getMemory(id);
        if (mem) recoveryMemories.push(mem);
      } catch {
      }
    }
    if (recoveryMemories.length > 0) {
      const section = buildSection("Recovery", recoveryMemories, 500);
      payload.sections.push(section);
      payload.total_tokens += section.tokens;
    }
  }
  logger2.info("Built enhanced compaction payload", {
    sections: payload.sections.length,
    total_tokens: payload.total_tokens,
    has_understanding: !!context.understanding,
    has_recovery: !!context.recovery
  });
  return payload;
}
function buildSection(title, memories, tokenBudget) {
  const selected = [];
  let tokens = 0;
  for (const mem of memories) {
    const memTokens = mem.summary_token_count || mem.token_count;
    if (tokens + memTokens > tokenBudget) break;
    selected.push(mem);
    tokens += memTokens;
  }
  return { title, memories: selected, tokens };
}

// src/engines/task-journal.ts
var logger3 = createLogger("task-journal");
function findOrCreateTask(description, projectPath, domain, sessionId2) {
  const truncatedDesc = description.substring(0, TASK_JOURNAL.MAX_DESCRIPTION_LENGTH);
  const activeTasks = getActiveTasks(projectPath ?? void 0);
  let bestMatch = null;
  let bestScore = 0;
  for (const task2 of activeTasks) {
    const score = keywordSimilarity(truncatedDesc, task2.description);
    if (score > bestScore && score >= TASK_JOURNAL.MATCH_THRESHOLD) {
      bestScore = score;
      bestMatch = task2;
    }
  }
  if (!bestMatch && activeTasks.length > 0) {
    const descEmbedding = generateEmbedding(truncatedDesc);
    for (const task2 of activeTasks) {
      const taskEmbedding = generateEmbedding(task2.description);
      const sim = cosineSimilarity(descEmbedding, taskEmbedding);
      if (sim > bestScore && sim >= TASK_JOURNAL.SEMANTIC_MATCH_THRESHOLD) {
        bestScore = sim;
        bestMatch = task2;
      }
    }
  }
  if (bestMatch) {
    const updated = updateTask(bestMatch.id, {
      session_count: bestMatch.session_count + 1,
      last_session_id: sessionId2
    });
    logger3.info("Matched existing task", {
      id: bestMatch.id,
      similarity: bestScore.toFixed(2),
      sessions: bestMatch.session_count + 1
    });
    return updated ?? bestMatch;
  }
  if (activeTasks.length >= TASK_JOURNAL.MAX_ACTIVE_TASKS) {
    logger3.warn("Max active tasks reached, not creating new task", {
      max: TASK_JOURNAL.MAX_ACTIVE_TASKS
    });
    return activeTasks[0];
  }
  const keywords = extractKeywords(truncatedDesc);
  const task = createTask({
    description: truncatedDesc,
    keywords,
    status: "active",
    files_touched: [],
    blockers: [],
    progress_pct: 0,
    session_count: 1,
    last_session_id: sessionId2,
    project_path: projectPath,
    domain,
    completed_at: null
  });
  logger3.info("Created new task", { id: task.id, description: truncatedDesc });
  return task;
}
function addFileToTask(projectPath, filePath) {
  const tasks = getActiveTasks(projectPath);
  if (tasks.length === 0) return;
  const task = tasks[0];
  const files = [...task.files_touched];
  if (files.includes(filePath)) return;
  if (files.length >= TASK_JOURNAL.MAX_FILES_PER_TASK) return;
  files.push(filePath);
  updateTask(task.id, { files_touched: files });
  logger3.debug("Added file to task", { taskId: task.id, filePath });
}
function addBlockerToTask(projectPath, blocker) {
  const tasks = getActiveTasks(projectPath);
  if (tasks.length === 0) return;
  const task = tasks[0];
  const blockers = [...task.blockers];
  for (const existing of blockers) {
    if (keywordSimilarity(blocker, existing) > TASK_JOURNAL.BLOCKER_DEDUP_THRESHOLD) return;
  }
  if (blockers.length >= TASK_JOURNAL.MAX_BLOCKERS_PER_TASK) {
    blockers.shift();
  }
  blockers.push(blocker.substring(0, 200));
  updateTask(task.id, { blockers });
  logger3.debug("Added blocker to task", { taskId: task.id, blocker: blocker.substring(0, 60) });
}
function pauseStaleTasks(projectPath) {
  const tasks = getIncompleteTasks(projectPath);
  const timestamp = now();
  let affected = 0;
  for (const task of tasks) {
    const daysSinceUpdate = daysElapsed(task.updated_at, timestamp);
    if (task.status === "active" && daysSinceUpdate >= TASK_JOURNAL.AUTO_ABANDON_DAYS) {
      updateTask(task.id, { status: "abandoned" });
      affected++;
      logger3.info("Auto-abandoned stale task", { id: task.id, days: daysSinceUpdate.toFixed(0) });
    } else if (task.status === "active" && daysSinceUpdate >= TASK_JOURNAL.AUTO_PAUSE_DAYS) {
      updateTask(task.id, { status: "paused" });
      affected++;
      logger3.info("Auto-paused stale task", { id: task.id, days: daysSinceUpdate.toFixed(0) });
    }
  }
  return affected;
}
function completeTask(taskId) {
  return updateTask(taskId, {
    status: "completed",
    progress_pct: 100,
    completed_at: now()
  });
}
function formatTaskSummary(projectPath, tokenBudget) {
  const tasks = getIncompleteTasks(projectPath ?? void 0);
  if (tasks.length === 0) return "";
  const lines = ["[Tasks]"];
  let tokens = estimateTokens(lines[0]);
  for (const task of tasks) {
    const status = task.status.toUpperCase();
    const files = task.files_touched.length > 0 ? ` files:${task.files_touched.length}` : "";
    const blockers = task.blockers.length > 0 ? ` blockers:${task.blockers.length}` : "";
    const sessions = task.session_count > 1 ? ` sessions:${task.session_count}` : "";
    const line = `  ${status}: ${task.description}${files}${blockers}${sessions}`;
    const lineTokens = estimateTokens(line);
    if (tokens + lineTokens > tokenBudget) break;
    lines.push(line);
    tokens += lineTokens;
    if (task.blockers.length > 0) {
      const blockerLine = `    blocker: ${task.blockers[task.blockers.length - 1]}`;
      const blockerTokens = estimateTokens(blockerLine);
      if (tokens + blockerTokens <= tokenBudget) {
        lines.push(blockerLine);
        tokens += blockerTokens;
      }
    }
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
}

// src/engines/test-tracking.ts
var logger4 = createLogger("test-tracking");
function isTestCommand(command2) {
  const lower = command2.toLowerCase();
  return TEST_TRACKING.TEST_COMMAND_PATTERNS.some((p) => lower.includes(p));
}
function parseTestOutput(output) {
  const isVitest = /Test Files\s/.test(output) || /vitest/i.test(output);
  if (isVitest) {
    const testsLine = output.match(/^\s*Tests\s+.*$/m);
    const vitestPassed = testsLine ? testsLine[0].match(/(\d+)\s+passed/) : null;
    const vitestFailed = testsLine ? testsLine[0].match(/(\d+)\s+failed/) : null;
    const vitestSkipped = testsLine ? testsLine[0].match(/(\d+)\s+skipped/) : null;
    const vitestDuration = output.match(/Duration\s+(\d+\.?\d*)s/);
    if (vitestPassed) {
      const passed = parseInt(vitestPassed[1], 10);
      const failed = vitestFailed ? parseInt(vitestFailed[1], 10) : 0;
      const skipped = vitestSkipped ? parseInt(vitestSkipped[1], 10) : 0;
      const duration = vitestDuration ? parseFloat(vitestDuration[1]) * 1e3 : 0;
      const failedTests = extractFailedTestNames(output);
      return {
        total: passed + failed + skipped,
        passed,
        failed,
        skipped,
        duration_ms: Math.round(duration),
        failed_tests: failedTests,
        framework: "vitest"
      };
    }
  }
  const pytestMatch = output.match(/(\d+)\s+passed(?:.*?(\d+)\s+failed)?(?:.*?(\d+)\s+error)?(?:.*?in\s+(\d+\.?\d*)s)?/);
  const isPytest = /pytest/i.test(output) || /===.*===/.test(output);
  if (isPytest && pytestMatch) {
    const passed = parseInt(pytestMatch[1], 10);
    const failed = pytestMatch[2] ? parseInt(pytestMatch[2], 10) : 0;
    const errors = pytestMatch[3] ? parseInt(pytestMatch[3], 10) : 0;
    const duration = pytestMatch[4] ? parseFloat(pytestMatch[4]) * 1e3 : 0;
    const pytestSkipped = output.match(/(\d+)\s+skipped/);
    const skipped = pytestSkipped ? parseInt(pytestSkipped[1], 10) : 0;
    const failedTests = extractFailedTestNames(output);
    return {
      total: passed + failed + errors + skipped,
      passed,
      failed: failed + errors,
      skipped,
      duration_ms: Math.round(duration),
      failed_tests: failedTests,
      framework: "pytest"
    };
  }
  const jestTests = output.match(/Tests:\s+(?:(\d+)\s+failed,\s*)?(\d+)\s+passed/);
  const jestTime = output.match(/Time:\s+(\d+\.?\d*)\s*s/);
  const isJest = /jest/i.test(output) || jestTests !== null;
  if (isJest && jestTests) {
    const failed = jestTests[1] ? parseInt(jestTests[1], 10) : 0;
    const passed = parseInt(jestTests[2], 10);
    const jestSkipped = output.match(/(\d+)\s+skipped/);
    const skipped = jestSkipped ? parseInt(jestSkipped[1], 10) : 0;
    const duration = jestTime ? parseFloat(jestTime[1]) * 1e3 : 0;
    const failedTests = extractFailedTestNames(output);
    return {
      total: passed + failed + skipped,
      passed,
      failed,
      skipped,
      duration_ms: Math.round(duration),
      failed_tests: failedTests,
      framework: "jest"
    };
  }
  return null;
}
function extractFailedTestNames(output) {
  const names = [];
  const failRegex = /FAIL[:\s]\s*(.+)/g;
  let m;
  while ((m = failRegex.exec(output)) !== null) {
    const name = m[1].trim().substring(0, 100);
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  const pytestRegex = /FAILED\s+\S+::(\S+)/g;
  while ((m = pytestRegex.exec(output)) !== null) {
    const name = m[1].trim();
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  return names.slice(0, 20);
}
function recordTestRun(command2, output, projectPath, sessionId2) {
  const parsed = parseTestOutput(output);
  if (!parsed) return null;
  const outcome = parsed.failed > 0 ? "fail" : "pass";
  const run = createTestRun({
    command: command2,
    total: parsed.total,
    passed: parsed.passed,
    failed: parsed.failed,
    skipped: parsed.skipped,
    duration_ms: parsed.duration_ms,
    outcome,
    failed_tests: parsed.failed_tests,
    session_id: sessionId2,
    project_path: projectPath
  });
  if (projectPath) {
    pruneTestRuns(projectPath, TEST_TRACKING.MAX_RUNS_PER_PROJECT);
  }
  logger4.info("Recorded test run", {
    framework: parsed.framework,
    total: parsed.total,
    passed: parsed.passed,
    failed: parsed.failed,
    outcome
  });
  return run;
}
function detectFlakyTests(projectPath) {
  const runs = getRecentTestRuns(projectPath, 20);
  if (runs.length < 2) return [];
  const testHistory = /* @__PURE__ */ new Map();
  for (const run of runs) {
    for (const name of run.failed_tests) {
      if (!testHistory.has(name)) testHistory.set(name, []);
      testHistory.get(name).push("fail");
    }
  }
  const flaky = [];
  for (const [name, outcomes] of testHistory) {
    const totalRuns = runs.length;
    const failCount = outcomes.length;
    const passCount = totalRuns - failCount;
    if (passCount > 0 && failCount > 0) {
      const flipFlops = Math.min(passCount, failCount);
      if (flipFlops >= TEST_TRACKING.FLAKY_THRESHOLD) {
        flaky.push({
          name,
          flipFlops,
          lastOutcome: outcomes[0]
        });
      }
    }
  }
  return flaky;
}
function formatTestHealth(projectPath, tokenBudget) {
  const runs = getRecentTestRuns(projectPath, 10);
  if (runs.length === 0) return "";
  const lines = ["[Test Health]"];
  let tokens = estimateTokens(lines[0]);
  const latest = runs[0];
  const durationStr = latest.duration_ms > 0 ? ` (${(latest.duration_ms / 1e3).toFixed(1)}s)` : "";
  const framework = detectFramework(latest.command);
  const lastLine = `  Last: ${latest.passed} pass, ${latest.failed} fail${durationStr}${framework ? " " + framework : ""}`;
  const lastTokens = estimateTokens(lastLine);
  if (tokens + lastTokens > tokenBudget) return "";
  lines.push(lastLine);
  tokens += lastTokens;
  const recentOutcomes = runs.slice(0, 5).map((r) => r.failed === 0 ? "green" : "red");
  const greenCount = recentOutcomes.filter((o) => o === "green").length;
  const trendLine = `  Trend: ${greenCount}/${recentOutcomes.length} green`;
  const trendTokens = estimateTokens(trendLine);
  if (tokens + trendTokens <= tokenBudget) {
    lines.push(trendLine);
    tokens += trendTokens;
  }
  const flaky = detectFlakyTests(projectPath);
  for (const f of flaky.slice(0, 3)) {
    const flakyLine = `  Flaky: ${f.name} (${f.flipFlops} flip-flops)`;
    const flakyTokens = estimateTokens(flakyLine);
    if (tokens + flakyTokens > tokenBudget) break;
    lines.push(flakyLine);
    tokens += flakyTokens;
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
}
function detectFramework(command2) {
  const lower = command2.toLowerCase();
  if (lower.includes("vitest")) return "vitest";
  if (lower.includes("pytest")) return "pytest";
  if (lower.includes("jest")) return "jest";
  return "";
}

// src/engines/cognitive.ts
function inferSessionPhase(recentTools) {
  if (recentTools.length === 0) return "exploration";
  const window = recentTools.slice(-COGNITIVE.PHASE_WINDOW_SIZE);
  const votes = {};
  for (const tool of window) {
    const phase = COGNITIVE.PHASE_WEIGHTS[tool];
    if (phase) {
      votes[phase] = (votes[phase] ?? 0) + 1;
    }
  }
  let maxPhase = "exploration";
  let maxCount = 0;
  for (const [phase, count] of Object.entries(votes)) {
    if (count > maxCount) {
      maxCount = count;
      maxPhase = phase;
    }
  }
  return maxPhase;
}
function inferHypothesis(currentQuery, previousQueries, currentHypothesis) {
  if (previousQueries.length === 0) {
    return { hypothesis: currentQuery, type: "new" };
  }
  const lastQuery = previousQueries[previousQueries.length - 1];
  const overlap = keywordSimilarity(currentQuery, lastQuery);
  if (overlap >= COGNITIVE.SEARCH_PIVOT_THRESHOLD) {
    if (currentHypothesis) {
      return { hypothesis: currentHypothesis, type: "maintained" };
    }
    return { hypothesis: currentQuery, type: "maintained" };
  }
  if (overlap <= COGNITIVE.SEARCH_CONTINUITY_THRESHOLD) {
    return { hypothesis: currentQuery, type: "pivoted" };
  }
  return {
    hypothesis: currentQuery,
    type: "refined"
  };
}
function extractApproachFromPrompt(prompt) {
  if (prompt.length < COGNITIVE.MIN_AGENT_PROMPT_FOR_COGNITION) return null;
  for (const pattern of COGNITIVE.APPROACH_PATTERNS) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      return match[1].trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
    }
  }
  if (prompt.length >= COGNITIVE.MIN_AGENT_PROMPT_FOR_COGNITION * 2) {
    const firstSentence = prompt.match(/^(.{30,200}?)(?:\.\s|$)/);
    if (firstSentence?.[1]) {
      return firstSentence[1].trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
    }
  }
  return null;
}
function extractSubagentCognition(message) {
  const result = {
    discovery: null,
    conclusion: null,
    lesson: null,
    approach: null
  };
  if (message.length < COGNITIVE.MIN_SUBAGENT_MESSAGE_FOR_LESSON) {
    return result;
  }
  for (const pattern of COGNITIVE.DISCOVERY_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) {
      result.discovery = match[1].trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
      break;
    }
  }
  for (const pattern of COGNITIVE.CONCLUSION_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) {
      result.conclusion = match[1].trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
      break;
    }
  }
  for (const pattern of COGNITIVE.APPROACH_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) {
      result.approach = match[1].trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
      break;
    }
  }
  if (result.discovery || result.conclusion) {
    const parts = [];
    if (result.discovery) parts.push(result.discovery);
    if (result.conclusion) parts.push(result.conclusion);
    result.lesson = parts.join("; ").slice(0, COGNITIVE.MAX_FIELD_LENGTH);
  }
  return result;
}
function extractSearchIntent(query) {
  return query.trim().slice(0, COGNITIVE.MAX_FIELD_LENGTH);
}
function updateCognitiveState(current, signal, recentTools, recentErrors) {
  const updated = { ...current };
  updated.last_updated = (/* @__PURE__ */ new Date()).toISOString();
  const recentWindow = recentTools.slice(-3);
  const hasRecentErrorContext = recentErrors.length > 0 && recentWindow.some((t) => t === "Bash") && recentWindow.length >= 2;
  updated.session_phase = hasRecentErrorContext ? "debugging" : inferSessionPhase(recentTools);
  switch (signal.type) {
    case "tool_call":
      break;
    case "search_query": {
      const result = inferHypothesis(signal.query, signal.previousQueries, current.active_hypothesis);
      updated.active_hypothesis = result.hypothesis;
      break;
    }
    case "agent_prompt": {
      const approach = extractApproachFromPrompt(signal.prompt);
      if (approach) {
        updated.current_approach = approach;
      }
      break;
    }
    case "subagent_result": {
      const cognition = extractSubagentCognition(signal.message);
      if (cognition.discovery) {
        updated.recent_discovery = cognition.discovery;
      }
      if (cognition.approach) {
        updated.current_approach = cognition.approach;
      }
      break;
    }
    case "recall_query":
      updated.search_intent = extractSearchIntent(signal.query);
      break;
    case "error_detected":
      updated.session_phase = "debugging";
      break;
  }
  return updated;
}
function createDefaultCognitiveState() {
  return {
    current_approach: null,
    active_hypothesis: null,
    recent_discovery: null,
    search_intent: null,
    session_phase: "exploration",
    last_updated: null
  };
}

// src/hook.ts
function readStdin() {
  return new Promise((resolve2) => {
    if (process.stdin.isTTY) {
      resolve2("");
      return;
    }
    let data = "";
    const MAX_STDIN_BYTES = 10 * 1024 * 1024;
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_STDIN_BYTES) {
        data = data.slice(0, MAX_STDIN_BYTES);
        process.stdin.destroy();
        resolve2(data);
      }
    });
    process.stdin.on("end", () => resolve2(data));
    process.stdin.on("error", () => resolve2(""));
    setTimeout(() => resolve2(data), 2e3);
  });
}
function validateTranscriptPath(p) {
  if (!p || typeof p !== "string") return null;
  const resolved = resolve(p);
  const allowed = join(homedir(), ".claude", "projects");
  if (!resolved.startsWith(allowed + "/") || !resolved.endsWith(".jsonl")) return null;
  return resolved;
}
function validateSessionId(sid) {
  if (!sid || typeof sid !== "string") return null;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sid)) return null;
  return sid;
}
function validateCwd(cwd) {
  if (!cwd || typeof cwd !== "string") return null;
  if (!cwd.startsWith("/")) return null;
  if (cwd.includes("\0") || cwd.length > 1e3) return null;
  return cwd;
}
function distillLesson(context) {
  const parts = [];
  if (context.errors && context.errors.length > 0 && context.fix) {
    const errorBrief = context.errors.slice(-1).map((e) => truncate(e, 60))[0];
    parts.push(`When "${errorBrief}" occurs, fix with: ${truncate(context.fix, 100)}`);
  }
  if (context.prevApproach && context.newApproach) {
    parts.push(`"${truncate(context.prevApproach, 60)}" didn't work; "${truncate(context.newApproach, 60)}" succeeded`);
  }
  if (context.discovery) {
    parts.push(`Key insight: ${truncate(context.discovery, 100)}`);
  }
  if (parts.length === 0) return null;
  return parts.join(". ").slice(0, 300);
}
function linkResolutionToErrors(resolutionMemoryId, recentErrors, domain) {
  try {
    for (const errorSummary of recentErrors.slice(-3)) {
      const errorSnippet = errorSummary.substring(0, 200);
      const pastErrors = searchMemories(errorSnippet, 5).filter((m) => m.type === "episodic" && isEpisodicData(m.type_data) && m.type_data.outcome === "negative" && m.id !== resolutionMemoryId);
      for (const errorMem of pastErrors) {
        const existing = getConnections(errorMem.id);
        if (existing.some((c) => c.type === "caused_by" && (c.source_id === resolutionMemoryId || c.target_id === resolutionMemoryId))) {
          continue;
        }
        createConnection({
          source_id: errorMem.id,
          target_id: resolutionMemoryId,
          type: "caused_by",
          strength: 0.7
        });
        if (isEpisodicData(errorMem.type_data) && !errorMem.type_data.lesson) {
          const resolution = getMemory(resolutionMemoryId);
          if (resolution) {
            const lesson = isEpisodicData(resolution.type_data) && resolution.type_data.lesson ? resolution.type_data.lesson : `Resolution: ${truncate(resolution.content, 200)}`;
            updateMemory(errorMem.id, {
              type_data: { ...errorMem.type_data, lesson, lesson_validated: true }
            });
          }
        }
        log.info("Cross-session resolution linked", { error_id: errorMem.id, resolution_id: resolutionMemoryId });
      }
    }
  } catch {
  }
}
function truncateToBytes(str, maxBytes) {
  if (maxBytes <= 0) return "";
  if (Buffer.byteLength(str, "utf-8") <= maxBytes) return str;
  let lo = 0;
  let hi = str.length;
  while (lo < hi) {
    const mid = lo + hi + 1 >> 1;
    if (Buffer.byteLength(str.substring(0, mid), "utf-8") <= maxBytes) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return str.substring(0, lo);
}
function makeBridgeOptions(state, overrides) {
  return {
    domain: state.active_domain,
    version: state.active_version,
    project: state.active_project,
    task: state.active_task,
    cwd: process.cwd(),
    isPostCompact: overrides?.isPostCompact ?? false,
    tokenBudget: CURATOR.BRIDGE_TOKEN_BUDGET,
    cognitive: {
      approach: state.cognitive_state.current_approach ?? null,
      phase: state.cognitive_state.session_phase ?? null,
      hypothesis: state.cognitive_state.active_hypothesis ?? null,
      discovery: state.cognitive_state.recent_discovery ?? null
    },
    recent_files: state.session_files.slice(-10),
    recent_errors: state.recent_errors.slice(-3)
  };
}
var OutputBudget = class {
  sections = [];
  consumed = 0;
  _evicted = [];
  maxBytes;
  constructor(maxBytes = OUTPUT_BUDGET.MAX_STDOUT_BYTES) {
    this.maxBytes = maxBytes;
  }
  /**
   * Append content under a priority tag.
   * Returns true if the content was added (possibly truncated), false if completely skipped.
   * When budget is exceeded, evicts lower-priority sections to make room.
   *
   * @param tag - Section tag (maps to SECTION_PRIORITY for base priority)
   * @param content - Content to append
   * @param domainRelevance - Optional 0-1 domain relevance boost (effective priority += domainRelevance * 2)
   */
  append(tag, content, domainRelevance = 0) {
    if (!content || content.length === 0) return false;
    const basePriority = OUTPUT_BUDGET.SECTION_PRIORITY[tag] ?? OUTPUT_BUDGET.SECTION_PRIORITY.other ?? 0;
    const priority = basePriority + domainRelevance * 2;
    const contentBytes = Buffer.byteLength(content, "utf-8");
    const remaining = this.maxBytes - this.consumed;
    if (contentBytes <= remaining) {
      this.sections.push({ tag, content, bytes: contentBytes, priority });
      this.consumed += contentBytes;
      return true;
    }
    const evictable = this.sections.map((s, idx) => ({ ...s, idx })).filter((s) => s.priority < priority).sort((a, b) => a.priority - b.priority);
    let freed = 0;
    const toEvict = [];
    for (const s of evictable) {
      toEvict.push(s.idx);
      freed += s.bytes;
      if (this.consumed - freed + contentBytes <= this.maxBytes) break;
    }
    if (this.consumed - freed + contentBytes <= this.maxBytes) {
      for (const idx of toEvict.sort((a, b) => b - a)) {
        this._evicted.push(this.sections[idx].tag);
        this.consumed -= this.sections[idx].bytes;
        this.sections.splice(idx, 1);
      }
      this.sections.push({ tag, content, bytes: contentBytes, priority });
      this.consumed += contentBytes;
      return true;
    }
    const availableAfterEvict = this.maxBytes - (this.consumed - freed);
    const markerBytes = Buffer.byteLength(OUTPUT_BUDGET.TRUNCATION_MARKER, "utf-8");
    if (availableAfterEvict <= markerBytes + OUTPUT_BUDGET.MIN_SECTION_BYTES) {
      return false;
    }
    for (const idx of toEvict.sort((a, b) => b - a)) {
      this._evicted.push(this.sections[idx].tag);
      this.consumed -= this.sections[idx].bytes;
      this.sections.splice(idx, 1);
    }
    const truncated = truncateToBytes(content, availableAfterEvict - markerBytes) + OUTPUT_BUDGET.TRUNCATION_MARKER;
    const truncBytes = Buffer.byteLength(truncated, "utf-8");
    this.sections.push({ tag, content: truncated, bytes: truncBytes, priority });
    this.consumed += truncBytes;
    return true;
  }
  /** Total bytes consumed so far */
  get bytesUsed() {
    return this.consumed;
  }
  /** How many bytes remain in the budget */
  get bytesRemaining() {
    return Math.max(0, this.maxBytes - this.consumed);
  }
  /** Get list of evicted section tags (for debugging/logging) */
  getEvicted() {
    return [...this._evicted];
  }
  /**
   * Render all sections as a single string, joined by newlines.
   * Sections are output in insertion order (not re-sorted by priority).
   */
  toString() {
    if (this.sections.length === 0) return "";
    return this.sections.map((s) => s.content).join("\n");
  }
  /**
   * Flush the budget to stdout.
   * Only writes if there's content.
   */
  flush() {
    const output = this.toString();
    if (output) {
      process.stdout.write(output + "\n");
    }
  }
};
function getWatcherPath(sid) {
  return join(homedir(), ".engram", WATCHER.SESSIONS_DIR, `${sid}.json`);
}
var activeSessionId = generateId();
function loadWatcherState() {
  const watcherPath = getWatcherPath(activeSessionId);
  try {
    if (existsSync(watcherPath)) {
      const raw = JSON.parse(readFileSync(watcherPath, "utf-8"));
      const safeStr = (v, maxLen) => typeof v === "string" ? v.slice(0, maxLen) : null;
      const safeNum = (v, def) => typeof v === "number" && Number.isFinite(v) ? v : def;
      const safeArr = (v, maxLen) => Array.isArray(v) ? v.slice(0, maxLen) : [];
      return {
        turns_since_engram: safeNum(raw.turns_since_engram, 0),
        total_turns: safeNum(raw.total_turns, 0),
        last_engram_tool: safeStr(raw.last_engram_tool, 100),
        last_engram_time: safeStr(raw.last_engram_time, 30),
        session_files: safeArr(raw.session_files, 50),
        session_start: safeStr(raw.session_start, 30) ?? (/* @__PURE__ */ new Date()).toISOString(),
        active_domain: safeStr(raw.active_domain, 100),
        active_project: safeStr(raw.active_project, 200),
        active_project_path: safeStr(raw.active_project_path, 500),
        active_task: safeStr(raw.active_task, 500),
        active_version: safeStr(raw.active_version, 50),
        recent_errors: safeArr(raw.recent_errors, 10),
        reasoning_buffer: raw.reasoning_buffer ?? [],
        reasoning_encoded_count: raw.reasoning_encoded_count ?? 0,
        last_reasoning_encode_time: raw.last_reasoning_encode_time ?? null,
        feedback_encoded_count: raw.feedback_encoded_count ?? 0,
        last_feedback_encode_time: raw.last_feedback_encode_time ?? null,
        discovery_encoded_count: raw.discovery_encoded_count ?? 0,
        last_discovery_encode_time: raw.last_discovery_encode_time ?? null,
        conversation: raw.conversation ?? createEmptyConversationState(),
        feedback_signals: raw.feedback_signals ?? { approval: 0, correction: 0, frustration: 0, instruction: 0 },
        message_lengths: raw.message_lengths ?? [],
        message_has_code: raw.message_has_code ?? [],
        message_jargon_count: raw.message_jargon_count ?? [],
        message_is_question: raw.message_is_question ?? [],
        decision_encoded_count: raw.decision_encoded_count ?? 0,
        last_decision_encode_time: raw.last_decision_encode_time ?? null,
        decision_memory_ids: raw.decision_memory_ids ?? [],
        active_chain_ids: raw.active_chain_ids ?? [],
        chain_encoded_count: raw.chain_encoded_count ?? 0,
        last_chain_step_time: raw.last_chain_step_time ?? null,
        injection_level: raw.injection_level ?? "high",
        milestone_encoded_count: raw.milestone_encoded_count ?? 0,
        recovery_context: raw.recovery_context ?? null,
        understanding_snapshot: raw.understanding_snapshot ?? null,
        proactive_injection_ids: raw.proactive_injection_ids ?? [],
        proactive_injection_turns: raw.proactive_injection_turns ?? {},
        recalled_memory_ids: raw.recalled_memory_ids ?? [],
        used_memory_ids: raw.used_memory_ids ?? [],
        surface_injection_turns: raw.surface_injection_turns ?? {},
        test_completion_encoded: raw.test_completion_encoded ?? false,
        recent_tool_names: raw.recent_tool_names ?? [],
        prewrite_file_counts: raw.prewrite_file_counts ?? {},
        last_chain_injection_turn: raw.last_chain_injection_turn ?? 0,
        cognitive_state: raw.cognitive_state ?? createDefaultCognitiveState(),
        search_queries: raw.search_queries ?? [],
        session_outcomes: raw.session_outcomes ?? [],
        pending_error_warnings: safeArr(raw.pending_error_warnings, 5),
        last_reasoning_extraction_turn: raw.last_reasoning_extraction_turn ?? 0,
        reasoning_extraction_count: raw.reasoning_extraction_count ?? 0,
        last_distillation_turn: raw.last_distillation_turn ?? 0,
        last_context_remaining: raw.last_context_remaining ?? null,
        recall_queries: raw.recall_queries ?? 0,
        recall_misses: raw.recall_misses ?? 0,
        last_status_turn: raw.last_status_turn ?? 0,
        offload_message_sent: raw.offload_message_sent ?? false,
        summary_injection_mode: raw.summary_injection_mode ?? false,
        recent_commands: raw.recent_commands ?? [],
        procedural_encoded_count: raw.procedural_encoded_count ?? 0,
        recent_actions: raw.recent_actions ?? [],
        continuation_brief: raw.continuation_brief ?? null,
        recent_prompts: raw.recent_prompts ?? []
      };
    }
  } catch {
  }
  return {
    turns_since_engram: 0,
    total_turns: 0,
    last_engram_tool: null,
    last_engram_time: null,
    session_files: [],
    session_start: (/* @__PURE__ */ new Date()).toISOString(),
    active_domain: null,
    active_project: null,
    active_project_path: null,
    active_task: null,
    active_version: null,
    recent_errors: [],
    reasoning_buffer: [],
    reasoning_encoded_count: 0,
    last_reasoning_encode_time: null,
    feedback_encoded_count: 0,
    last_feedback_encode_time: null,
    discovery_encoded_count: 0,
    last_discovery_encode_time: null,
    conversation: createEmptyConversationState(),
    feedback_signals: { approval: 0, correction: 0, frustration: 0, instruction: 0 },
    message_lengths: [],
    message_has_code: [],
    message_jargon_count: [],
    message_is_question: [],
    decision_encoded_count: 0,
    last_decision_encode_time: null,
    decision_memory_ids: [],
    active_chain_ids: [],
    chain_encoded_count: 0,
    last_chain_step_time: null,
    injection_level: "high",
    milestone_encoded_count: 0,
    recovery_context: null,
    understanding_snapshot: null,
    proactive_injection_ids: [],
    proactive_injection_turns: {},
    recalled_memory_ids: [],
    used_memory_ids: [],
    surface_injection_turns: {},
    test_completion_encoded: false,
    recent_tool_names: [],
    prewrite_file_counts: {},
    last_chain_injection_turn: 0,
    cognitive_state: createDefaultCognitiveState(),
    search_queries: [],
    session_outcomes: [],
    pending_error_warnings: [],
    last_reasoning_extraction_turn: 0,
    reasoning_extraction_count: 0,
    last_distillation_turn: 0,
    last_context_remaining: null,
    recall_queries: 0,
    recall_misses: 0,
    last_status_turn: 0,
    offload_message_sent: false,
    summary_injection_mode: false,
    recent_commands: [],
    procedural_encoded_count: 0,
    recent_actions: [],
    continuation_brief: null,
    recent_prompts: []
  };
}
function saveWatcherState(state) {
  sanitizeCognitiveState(state);
  const watcherPath = getWatcherPath(activeSessionId);
  try {
    const tmpPath = watcherPath + ".tmp";
    writeFileSync(tmpPath, JSON.stringify(state), "utf-8");
    renameSync(tmpPath, watcherPath);
  } catch {
  }
}
function sanitizeCognitiveState(state) {
  const cog = state.cognitive_state;
  if (!cog) return;
  const placeholders = ["X", "X.", "Y", "Y.", "Z", "Z."];
  const templatePatterns = [
    /^X[\.\s]/,
    // Starts with X. or X<space>
    /^Approach:\s*X/i,
    // "Approach: X..."
    /Hypothesis:\s*[XYZ][\.\s]/,
    // Contains "Hypothesis: X."
    /Discovery:\s*[XYZ][\.\s]/,
    // Contains "Discovery: Z."
    /^[XYZ]\.\s+(?:Hypothesis|Discovery|Approach):/i
    // "X. Hypothesis: Y..."
  ];
  const isPlaceholderValue = (val) => {
    if (placeholders.includes(val)) return true;
    return templatePatterns.some((p) => p.test(val));
  };
  if (cog.current_approach && isPlaceholderValue(cog.current_approach)) {
    cog.current_approach = null;
  }
  if (cog.active_hypothesis && isPlaceholderValue(cog.active_hypothesis)) {
    cog.active_hypothesis = null;
  }
  if (cog.recent_discovery && isPlaceholderValue(cog.recent_discovery)) {
    cog.recent_discovery = null;
  }
  if (cog.active_hypothesis && cog.active_hypothesis.startsWith("/")) {
    cog.active_hypothesis = null;
  }
  if (cog.search_intent && cog.search_intent.startsWith("/")) {
    cog.search_intent = null;
  }
  if (cog.current_approach && cog.current_approach.length < 5) {
    cog.current_approach = null;
  }
  const templatePrefixes = ["Pre-compaction", "chronologically analyze", "This session is being continued"];
  if (cog.current_approach) {
    for (const prefix of templatePrefixes) {
      if (cog.current_approach.startsWith(prefix)) {
        cog.current_approach = null;
        break;
      }
    }
  }
  if (cog.recent_discovery) {
    for (const prefix of templatePrefixes) {
      if (cog.recent_discovery.startsWith(prefix)) {
        cog.recent_discovery = null;
        break;
      }
    }
  }
  if (cog.recent_discovery && cog.recent_discovery.length < 15 && !cog.recent_discovery.includes(" ")) {
    cog.recent_discovery = null;
  }
  if (cog.recent_discovery && /^that\s/i.test(cog.recent_discovery) && cog.recent_discovery.length < 40) {
    cog.recent_discovery = null;
  }
  if (state.active_task && state.active_task.startsWith("<")) {
    state.active_task = null;
  }
  if (state.active_task) {
    const conversationalPatterns = [
      /^i have another/i,
      /^just letting you/i,
      /^just a quick/i,
      /^now tell me/i,
      /^do another final/i,
      /^reviewing$/i
      // Generic tool-inferred task, not specific
    ];
    if (conversationalPatterns.some((p) => p.test(state.active_task))) {
      state.active_task = null;
    }
  }
  if (!state.active_task || state.active_task === "unknown task") {
    const editedFiles = state.recent_actions.filter((a) => a.tool === "Edit" || a.tool === "Write").map((a) => {
      const arrowIdx = a.target.indexOf(" \u2192");
      const path = arrowIdx > 0 ? a.target.slice(0, arrowIdx) : a.target;
      return path.split(/[/\\]/).pop() ?? path;
    });
    const uniqueFiles = [...new Set(editedFiles)].slice(-5);
    if (uniqueFiles.length > 0) {
      if (cog.current_approach && cog.current_approach.length >= 10) {
        state.active_task = cog.current_approach.slice(0, 150);
      } else {
        state.active_task = `Working on ${uniqueFiles.join(", ")}`;
      }
    }
    if (!state.active_task && state.recent_prompts && state.recent_prompts.length > 0) {
      const taskVerbs = /^(fix|add|create|update|implement|remove|refactor|build|change|move|write|make|set|run|deploy|test|commit|push|install|configure|debug|solve|enable|disable|start|stop|check|verify|analyze|review|audit|optimize|clean|delete|migrate|upgrade|publish|get|do|finish)/i;
      for (let i = state.recent_prompts.length - 1; i >= 0; i--) {
        const prompt = state.recent_prompts[i];
        const first = prompt.split(/[.!?\n]/)[0]?.trim();
        if (first && first.length >= 15 && first.length <= 200 && taskVerbs.test(first)) {
          state.active_task = first;
          break;
        }
      }
    }
  }
  if (state.session_files.length > 0) {
    state.session_files = state.session_files.filter((f) => {
      if (f.length < 3 || f.length > 500) return false;
      if (!f.includes("/") && !f.includes("\\")) return false;
      if (f.includes("/../") || f.startsWith("../")) return false;
      if (/^\/?\d+\.\d+/.test(f)) return false;
      if (f === "/root/.ssh" || f.includes("/etc/cron")) return false;
      return true;
    });
  }
}
function deleteSessionState() {
  const watcherPath = getWatcherPath(activeSessionId);
  try {
    if (existsSync(watcherPath)) {
      unlinkSync(watcherPath);
    }
  } catch {
  }
}
function writeSessionHandoff(state, narrative) {
  const memoryDir = discoverMemoryDir(process.cwd());
  const handoffDir = memoryDir ?? join(homedir(), ".engram");
  const handoffPath = join(handoffDir, SESSION_HANDOFF.FILENAME);
  const decisions = [];
  for (const memId of state.decision_memory_ids.slice(0, SESSION_HANDOFF.MAX_DECISIONS)) {
    try {
      const mem = getMemory(memId);
      if (mem && isDecisionData(mem.type_data)) {
        const td = mem.type_data;
        decisions.push(`${td.chosen} \u2014 ${td.rationale}`.substring(0, SESSION_HANDOFF.MAX_LESSON_LENGTH));
      }
    } catch {
    }
  }
  const lessons = [];
  if (narrative?.lessons) {
    for (const l of narrative.lessons.slice(0, SESSION_HANDOFF.MAX_LESSONS)) {
      lessons.push(l.substring(0, SESSION_HANDOFF.MAX_LESSON_LENGTH));
    }
  }
  const reasoningTrail = [];
  for (const chainId of state.active_chain_ids.slice(0, 3)) {
    try {
      const chain = getReasoningChain(chainId);
      if (!chain) continue;
      const steps = chain.steps.slice(-5);
      for (const step of steps) {
        const deadEnd = step.was_dead_end ? " [dead end]" : "";
        const trail = `${step.action} \u2192 ${step.inference}${deadEnd}`.substring(0, SESSION_HANDOFF.MAX_LESSON_LENGTH);
        reasoningTrail.push(trail);
      }
      if (chain.conclusion) {
        reasoningTrail.push(`Concluded: ${chain.conclusion}`.substring(0, SESSION_HANDOFF.MAX_LESSON_LENGTH));
      }
    } catch {
    }
  }
  if (reasoningTrail.length === 0 && state.search_queries.length > 0) {
    const queries = state.search_queries.slice(-5);
    reasoningTrail.push(`Investigated: ${queries.join(" \u2192 ")}`);
  }
  const brief = state.continuation_brief ?? buildContinuationBrief(state);
  const handoff = {
    ended_at: (/* @__PURE__ */ new Date()).toISOString(),
    project: state.active_project,
    domain: state.active_domain,
    task: brief.task !== "unknown task" ? brief.task : state.active_task,
    approach: (state.cognitive_state.current_approach ?? narrative?.approach ?? null)?.substring(0, SESSION_HANDOFF.MAX_APPROACH_LENGTH) ?? null,
    hypothesis: state.cognitive_state.active_hypothesis?.substring(0, SESSION_HANDOFF.MAX_APPROACH_LENGTH) ?? null,
    discoveries: state.cognitive_state.recent_discovery ? [state.cognitive_state.recent_discovery.substring(0, SESSION_HANDOFF.MAX_LESSON_LENGTH)] : [],
    decisions: decisions.length > 0 ? decisions : brief.decisions,
    unfinished: narrative?.unfinished && narrative.unfinished.length > 0 ? narrative.unfinished.join("; ").substring(0, SESSION_HANDOFF.MAX_UNFINISHED_LENGTH) : brief.next_steps.length > 0 ? brief.next_steps.join("; ").substring(0, SESSION_HANDOFF.MAX_UNFINISHED_LENGTH) : null,
    blockers: state.recent_errors.slice(0, SESSION_HANDOFF.MAX_BLOCKERS).map((e) => e.substring(0, 200)),
    files: brief.key_files.length > 0 ? brief.key_files.slice(-SESSION_HANDOFF.MAX_FILES) : state.session_files.slice(-SESSION_HANDOFF.MAX_FILES).map((f) => f.split(/[/\\]/).pop() ?? f),
    lessons,
    phase: state.cognitive_state.session_phase ?? null,
    turns: state.total_turns,
    reasoning_trail: reasoningTrail.slice(0, 10)
  };
  try {
    const serialized = JSON.stringify(handoff, null, 2);
    if (serialized.length > 65536) {
      log.warn("Session handoff too large, truncating", { size: serialized.length });
      handoff.reasoning_trail = handoff.reasoning_trail.slice(0, 3);
      handoff.lessons = handoff.lessons.slice(0, 3);
    }
    const tmpPath = handoffPath + ".tmp";
    writeFileSync(tmpPath, JSON.stringify(handoff, null, 2), "utf-8");
    renameSync(tmpPath, handoffPath);
    log.info("Session handoff written", { path: handoffPath });
  } catch (e) {
    log.error("Failed to write session handoff", { error: safeErrorStr(e) });
  }
}
function readSessionHandoff(currentProject) {
  const memoryDir = discoverMemoryDir(process.cwd());
  const handoffDir = memoryDir ?? join(homedir(), ".engram");
  const handoffPath = join(handoffDir, SESSION_HANDOFF.FILENAME);
  try {
    if (!existsSync(handoffPath)) return null;
    const raw = JSON.parse(readFileSync(handoffPath, "utf-8"));
    if (!raw.ended_at || typeof raw.ended_at !== "string") return null;
    const age = Date.now() - new Date(raw.ended_at).getTime();
    const maxAge = SESSION_HANDOFF.MAX_AGE_HOURS * 60 * 60 * 1e3;
    if (age > maxAge) {
      log.info("Session handoff stale, ignoring", { age_hours: (age / 36e5).toFixed(1) });
      return null;
    }
    if (currentProject && raw.project && raw.project !== currentProject) {
      log.info("Session handoff project mismatch", { handoff: raw.project, current: currentProject });
      return null;
    }
    if (!Array.isArray(raw.reasoning_trail)) raw.reasoning_trail = [];
    return raw;
  } catch {
    return null;
  }
}
function formatHandoffInjection(handoff) {
  const lines = [];
  const ago = Date.now() - new Date(handoff.ended_at).getTime();
  const agoHours = Math.round(ago / 36e5);
  const agoText = agoHours < 1 ? "just now" : agoHours < 24 ? `${agoHours}h ago` : `${Math.round(agoHours / 24)}d ago`;
  lines.push(`[ENGRAM HANDOFF] Last session (${handoff.turns} turns, ${agoText}):`);
  if (handoff.task) {
    lines.push(`  Task: ${handoff.task}`);
  }
  if (handoff.approach) {
    lines.push(`  Approach: ${handoff.approach}`);
  }
  if (handoff.hypothesis) {
    lines.push(`  Hypothesis: ${handoff.hypothesis}`);
  }
  if (handoff.decisions.length > 0) {
    lines.push(`  Decided: ${handoff.decisions.join("; ")}`);
  }
  if (handoff.discoveries.length > 0) {
    lines.push(`  Discovered: ${handoff.discoveries.join("; ")}`);
  }
  if (handoff.lessons.length > 0) {
    lines.push(`  Lessons: ${handoff.lessons.join("; ")}`);
  }
  if (handoff.unfinished) {
    lines.push(`  Unfinished: ${handoff.unfinished}`);
  }
  if (handoff.blockers.length > 0) {
    lines.push(`  Blockers: ${handoff.blockers.map((b) => b.substring(0, 100)).join("; ")}`);
  }
  if (handoff.reasoning_trail && handoff.reasoning_trail.length > 0) {
    lines.push(`  Reasoning: ${handoff.reasoning_trail.join("; ")}`);
  }
  if (handoff.files.length > 0) {
    lines.push(`  Files: ${handoff.files.join(", ")}`);
  }
  return lines.join("\n");
}
function cleanupStaleSessions() {
  const sessionsDir = join(homedir(), ".engram", WATCHER.SESSIONS_DIR);
  try {
    if (!existsSync(sessionsDir)) return;
    const maxAgeMs = WATCHER.MAX_SESSION_AGE_HOURS * 60 * 60 * 1e3;
    const cutoff = Date.now() - maxAgeMs;
    for (const file of readdirSync(sessionsDir)) {
      if (!file.endsWith(".json")) continue;
      const filePath = join(sessionsDir, file);
      try {
        const stat = statSync(filePath);
        if (stat.mtimeMs < cutoff) {
          unlinkSync(filePath);
          log.info("Cleaned up stale session file", { file });
        }
      } catch {
      }
    }
  } catch {
  }
}
function migrateLegacyWatcherState() {
  const legacyPath = join(homedir(), ".engram", WATCHER.STATE_FILE);
  const sessionsDir = join(homedir(), ".engram", WATCHER.SESSIONS_DIR);
  try {
    if (!existsSync(legacyPath)) return;
    if (existsSync(sessionsDir)) {
      const files = readdirSync(sessionsDir).filter((f) => f.endsWith(".json"));
      if (files.length > 0) {
        unlinkSync(legacyPath);
        return;
      }
    }
    const content = readFileSync(legacyPath, "utf-8");
    const newPath = getWatcherPath(activeSessionId);
    writeFileSync(newPath, content, "utf-8");
    unlinkSync(legacyPath);
    log.info("Migrated legacy watcher.json to per-session state");
  } catch {
  }
}
setLogLevel(getEnvLogLevel());
var config = loadConfig();
ensureEngramDir();
initDatabase(config.storage);
var sessionId = process.env.ENGRAM_SESSION_ID ?? generateId();
var [command, ...args] = process.argv.slice(2);
async function main() {
  const stdinRaw = await readStdin();
  const stdinJson = safeParse(stdinRaw);
  const validatedSessionId = validateSessionId(stdinJson?.session_id);
  if (validatedSessionId) {
    activeSessionId = validatedSessionId;
  } else if (process.env.ENGRAM_SESSION_ID) {
    const envSessionId = validateSessionId(process.env.ENGRAM_SESSION_ID);
    if (envSessionId) activeSessionId = envSessionId;
  }
  migrateLegacyWatcherState();
  try {
    const cwdForDb = validateCwd(stdinJson?.cwd) ?? process.cwd();
    const projectRoot = inferProjectPath(cwdForDb);
    const projectDbPath = deriveProjectDbPath(projectRoot);
    initProjectDatabase(projectDbPath);
  } catch (e) {
    log.error("Failed to attach project database", { error: safeErrorStr(e) });
  }
  switch (command) {
    case "pre-write":
      handlePreWrite(stdinJson?.tool_input, args[0]);
      break;
    case "post-bash":
      handlePostBash(stdinJson, args[0], args[1]);
      break;
    case "post-write":
      handlePostWrite(stdinJson?.tool_input, args[0]);
      break;
    case "post-tool":
      handlePostToolGeneric(stdinJson);
      break;
    case "notification": {
      const notifType = stdinJson?.notification_type ?? args[0] ?? "general";
      const notifMessage = stdinJson?.message ?? args[1] ?? "";
      handleNotification(notifType, notifMessage);
      break;
    }
    case "session-start":
      handleSessionStart(stdinJson, args[0]);
      break;
    case "session-end":
      handleSessionEnd();
      break;
    case "stop-watch":
    case "stop-nudge":
      handleStopWatch();
      break;
    case "engram-used":
      handleEngramUsed(stdinJson, args[0]);
      break;
    case "pre-compact":
      handlePreCompact();
      break;
    case "prompt-check":
      handlePromptCheck(stdinJson, args[0]);
      break;
    case "subagent-stop":
      handleSubagentStop(stdinJson);
      break;
    case "pre-bash":
      handlePreBash(stdinJson);
      break;
    case "post-compact":
      handlePostCompact(stdinJson);
      break;
    default:
      log.error("Unknown hook command", { command });
      process.exit(1);
  }
}
main().catch((err) => {
  log.error("Hook main failed", { error: String(err) });
}).finally(() => {
  closeDatabase();
});
function handlePreWrite(toolInput, argFallback) {
  try {
    const input = toolInput ?? safeParse(argFallback ?? "");
    const content = input?.content ?? input?.new_string ?? argFallback ?? "";
    const filePath = input?.file_path ?? input?.path ?? null;
    if (!content || typeof content !== "string") return;
    const prewriteMode = process.env[PREWRITE_BLOCKING.MODE_ENV_VAR] ?? PREWRITE_BLOCKING.DEFAULT_MODE;
    if (prewriteMode === "off") return;
    const watcherState = loadWatcherState();
    const immuneResult = checkAntipattern(content, watcherState.active_domain, watcherState.active_version, config.immune);
    const criticalMatches = immuneResult.matches.filter(
      (m) => PREWRITE_BLOCKING.BLOCK_ON_SEVERITY.includes(m.severity) && m.confidence >= PREWRITE_BLOCKING.MIN_MATCH_CONFIDENCE
    );
    if (prewriteMode === "block" && criticalMatches.length > 0) {
      const reasons = criticalMatches.map(
        (m) => `[ENGRAM BLOCKED] Critical antipattern: ${m.trigger}
  Severity: ${m.severity}
  Fix: ${m.fix ?? "Review this pattern"}`
      );
      const output = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reasons.join("\n\n")
        }
      };
      process.stdout.write(JSON.stringify(output) + "\n");
      return;
    }
    const contextLines = [];
    const warnMatches = immuneResult.matches.filter(
      (m) => (PREWRITE_BLOCKING.WARN_ON_SEVERITY.includes(m.severity) || PREWRITE_BLOCKING.BLOCK_ON_SEVERITY.includes(m.severity)) && m.confidence >= PREWRITE_BLOCKING.MIN_MATCH_CONFIDENCE
    );
    for (const m of warnMatches) {
      contextLines.push(
        `[ENGRAM WARNING] Antipattern detected: ${m.trigger}
  Severity: ${m.severity}
  Fix: ${m.fix ?? "Review this pattern"}`
      );
    }
    if (filePath) {
      try {
        const impact = getImpactAnalysis(process.cwd(), filePath);
        const impactBlock = formatImpactAnalysis(impact);
        if (impactBlock) {
          contextLines.push(impactBlock);
        }
      } catch {
      }
    }
    let skipCodeRecall = false;
    if (filePath) {
      const fileCount = (watcherState.prewrite_file_counts[filePath] ?? 0) + 1;
      watcherState.prewrite_file_counts[filePath] = fileCount;
      skipCodeRecall = fileCount % CODE_CONTEXT_RECALL.PREWRITE_COOLDOWN_PER_FILE !== 1;
      saveWatcherState(watcherState);
    }
    if (!skipCodeRecall && content.length >= CODE_CONTEXT_RECALL.MIN_CONTENT_LENGTH) {
      try {
        const codeResult = codeContextRecall(content, filePath, {
          domain: watcherState.active_domain,
          version: watcherState.active_version,
          project: watcherState.active_project
        }, config.retrieval);
        const activeDomain = watcherState.active_domain;
        const currentModule = filePath ? extractModuleFromPath(filePath) : null;
        const isModuleMismatch = (mem) => {
          if (!currentModule) return false;
          const memFiles = mem.memory.encoding_context?.files;
          if (!memFiles || memFiles.length === 0) return false;
          const memModules = memFiles.map(extractModuleFromPath).filter(Boolean);
          if (memModules.length === 0) return false;
          return !memModules.includes(currentModule);
        };
        for (const p of codeResult.patterns) {
          if (p.activation < CODE_CONTEXT_RECALL.MIN_PREWRITE_ACTIVATION) continue;
          if (p.memory.type === "episodic") continue;
          if (activeDomain && p.memory.encoding_context?.framework && p.memory.encoding_context.framework !== activeDomain) continue;
          if (isModuleMismatch(p)) continue;
          contextLines.push(`[ENGRAM PATTERN] ${truncate(p.memory.content, 200)}`);
        }
        for (const c of codeResult.conventions) {
          if (c.activation < CODE_CONTEXT_RECALL.MIN_PREWRITE_ACTIVATION) continue;
          if (activeDomain && c.memory.encoding_context?.framework && c.memory.encoding_context.framework !== activeDomain) continue;
          if (isModuleMismatch(c)) continue;
          contextLines.push(`[ENGRAM CONVENTION] ${truncate(c.memory.content, 200)}`);
        }
        for (const p of codeResult.procedural) {
          if (isModuleMismatch(p)) continue;
          contextLines.push(`[ENGRAM HOW-TO] ${truncate(p.memory.content, 200)}`);
        }
      } catch (e) {
        log.error("Code context recall failed", { error: safeErrorStr(e) });
      }
    }
    if (contextLines.length > 0) {
      const budget = new OutputBudget();
      budget.append("antipatterns", contextLines.join("\n\n"));
      const contextText = budget.toString();
      const output = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          additionalContext: contextText
        }
      };
      process.stdout.write(JSON.stringify(output) + "\n");
    }
  } catch (e) {
    log.error("handlePreWrite failed", { error: safeErrorStr(e) });
  }
}
function handlePostBash(stdinJson, argInput, argOutput) {
  const toolInput = stdinJson?.tool_input;
  const rawResponse = stdinJson?.tool_response;
  const toolOutput = typeof rawResponse === "string" ? rawResponse : rawResponse != null ? JSON.stringify(rawResponse) : argOutput ?? "";
  const cmd = toolInput?.command ?? truncate(argInput ?? "", 200);
  const isError = containsError(toolOutput);
  const eventType = isError ? "error" : "tool_result";
  if (!isError && toolOutput.length < 100) return;
  const event = {
    type: eventType,
    content: `Command: ${cmd}
Output: ${truncate(toolOutput, 500)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    metadata: {
      tool: "Bash",
      command: cmd,
      is_error: isError
    }
  };
  processHookEvent(event, config, sessionId);
  const state = loadWatcherState();
  let stateChanged = false;
  state.recent_tool_names.push("Bash");
  if (state.recent_tool_names.length > 10) {
    state.recent_tool_names = state.recent_tool_names.slice(-10);
  }
  state.recent_actions.push({
    tool: "Bash",
    target: truncate(cmd, 120),
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (state.recent_actions.length > 15) {
    state.recent_actions = state.recent_actions.slice(-15);
  }
  stateChanged = true;
  let testRun = null;
  if (isTestCommand(cmd)) {
    try {
      testRun = recordTestRun(cmd, toolOutput, process.cwd(), sessionId);
    } catch {
    }
  }
  if (testRun && testRun.outcome === "pass" && state.session_files.length > 0 && !state.test_completion_encoded) {
    try {
      const files = state.session_files.slice(-5).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
      const content = `Task completion: tests passed (${testRun.passed}/${testRun.total}) after modifying ${files}.`;
      createMemory({
        type: "episodic",
        content,
        summary: null,
        encoding_strength: 0.7,
        reinforcement: 1,
        confidence: 0.7,
        storage_tier: "working",
        pinned: false,
        tags: ["task-completion", "tests-passed", "auto-encoded"],
        domains: state.active_domain ? [state.active_domain] : [],
        version: state.active_version,
        encoding_context: {
          project: state.active_project,
          project_path: state.active_project_path,
          framework: state.active_domain,
          version: state.active_version,
          files: state.session_files.slice(-5),
          task_type: null,
          error_context: null,
          session_id: sessionId,
          significance_score: 0.7
        },
        type_data: {
          kind: "episodic",
          context: {
            project: state.active_project ?? "",
            task: state.active_task ?? "test run",
            framework: state.active_domain ?? "",
            version: state.active_version ?? "",
            files: state.session_files.slice(-5),
            models: []
          },
          outcome: "positive",
          outcome_detail: `${testRun.passed}/${testRun.total} tests passed`,
          lesson: `Tests passed after modifying ${files}`,
          lesson_validated: false,
          emotional_weight: 0.5
        }
      });
      state.test_completion_encoded = true;
      stateChanged = true;
      if (state.active_domain) {
        try {
          recordDomainOutcome(state.active_domain, "positive");
        } catch {
        }
        try {
          recordDomainMasteryOutcome(state.active_domain, "positive", "test_pass");
        } catch {
        }
      }
      log.info("Auto-encoded test pass completion", { passed: testRun.passed, total: testRun.total });
    } catch {
    }
  }
  if (testRun && testRun.outcome === "fail" && state.session_files.length > 0) {
    try {
      const files = state.session_files.slice(-5).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
      const failedCount = testRun.failed ?? testRun.total - testRun.passed;
      const failMatch = toolOutput.match(/(?:FAIL|Error|AssertionError|expected|✗|×)[^\n]{0,200}/i);
      const failHint = failMatch ? ` Failure: ${failMatch[0].substring(0, 150)}` : "";
      const content = `Test failure: ${failedCount} tests failed (${testRun.passed}/${testRun.total} passed) while modifying ${files}.${failHint}`;
      const domains = state.active_domain ? [state.active_domain] : [];
      const existing = findDuplicate(content, "episodic", domains);
      if (!existing) {
        createMemory({
          type: "episodic",
          content,
          summary: null,
          encoding_strength: 0.8,
          reinforcement: 1,
          confidence: 0.7,
          storage_tier: "working",
          pinned: false,
          tags: ["test-failure", "auto-encoded"],
          domains,
          version: state.active_version,
          encoding_context: {
            project: state.active_project,
            project_path: state.active_project_path,
            framework: state.active_domain,
            version: state.active_version,
            files: state.session_files.slice(-5),
            task_type: null,
            error_context: failHint || null,
            session_id: sessionId,
            significance_score: 0.8
          },
          type_data: {
            kind: "episodic",
            context: {
              project: state.active_project ?? "",
              task: state.active_task ?? "test run",
              framework: state.active_domain ?? "",
              version: state.active_version ?? "",
              files: state.session_files.slice(-5),
              models: []
            },
            outcome: "negative",
            outcome_detail: `${failedCount} tests failed`,
            lesson: null,
            lesson_validated: false,
            emotional_weight: 0.6
          }
        });
        stateChanged = true;
        log.info("Auto-encoded test failure", { failed: failedCount, total: testRun.total });
      }
    } catch {
    }
  }
  if (!isError && toolOutput.length >= 100 && state.recalled_memory_ids.length > 0) {
    try {
      const outputEmbedding = generateEmbedding(toolOutput.slice(0, RETRIEVAL_FEEDBACK.USAGE_EMBEDDING_MAX_CHARS));
      const outputKeywords = extractKeywords(toolOutput);
      for (const recalledId of state.recalled_memory_ids) {
        if (state.used_memory_ids.includes(recalledId)) continue;
        try {
          const mem = getMemory(recalledId);
          if (!mem) continue;
          const kwSim = keywordSimilarity(toolOutput, mem.content);
          if (kwSim >= RETRIEVAL_FEEDBACK.MIN_USAGE_SIMILARITY) {
            state.used_memory_ids.push(recalledId);
            const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.REINFORCEMENT_BONUS;
            updateMemory(recalledId, { reinforcement: newR });
            stateChanged = true;
            continue;
          }
          const embBuf = getEmbedding(recalledId);
          if (embBuf) {
            const memEmbedding = bufferToEmbedding(embBuf);
            const embSim = cosineSimilarity(outputEmbedding, memEmbedding);
            if (embSim >= RETRIEVAL_FEEDBACK.MIN_EMBEDDING_USAGE_SIMILARITY) {
              state.used_memory_ids.push(recalledId);
              const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.REINFORCEMENT_BONUS;
              updateMemory(recalledId, { reinforcement: newR });
              stateChanged = true;
              continue;
            }
          }
          const memKeywords = extractKeywords(mem.content);
          if (memKeywords.length > 0 && outputKeywords.length > 0) {
            const overlap = memKeywords.filter((kw) => outputKeywords.includes(kw)).length;
            const overlapRatio = overlap / memKeywords.length;
            if (overlapRatio >= RETRIEVAL_FEEDBACK.MIN_PARTIAL_KEYWORD_OVERLAP) {
              state.used_memory_ids.push(recalledId);
              const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.PARTIAL_USAGE_BONUS;
              updateMemory(recalledId, { reinforcement: newR });
              stateChanged = true;
            }
          }
        } catch {
        }
      }
    } catch {
    }
  }
  if (isError) {
    const errorSummary = truncate(`${cmd}: ${toolOutput}`, 200);
    state.recent_errors.push(errorSummary);
    if (state.recent_errors.length > 5) {
      state.recent_errors = state.recent_errors.slice(-5);
    }
    stateChanged = true;
    try {
      const filePath = extractFilePath(cmd);
      const extracted = extractErrorFingerprint(toolOutput);
      if (extracted) {
        const priorCandidate = findErrorByFingerprint(extracted.fingerprint);
        if (priorCandidate && priorCandidate.occurrences >= 1) {
          const fixHint = priorCandidate.fix_content ?? priorCandidate.fix_command ?? null;
          const warning = fixHint ? `Recurring ${extracted.error_type} (seen ${priorCandidate.occurrences + 1}x): ${truncate(extracted.error_message, 100)}. Prior fix: ${truncate(fixHint, 120)}` : `Recurring ${extracted.error_type} (seen ${priorCandidate.occurrences + 1}x): ${truncate(extracted.error_message, 120)}. Check prior approach.`;
          state.pending_error_warnings.push(warning);
          if (state.pending_error_warnings.length > 3) {
            state.pending_error_warnings = state.pending_error_warnings.slice(-3);
          }
        }
      }
      recordError(toolOutput, cmd, filePath, process.cwd());
      addBlockerToTask(process.cwd(), errorSummary);
      if (state.active_domain) {
        try {
          recordDomainOutcome(state.active_domain, "negative");
        } catch {
        }
        try {
          recordDomainMasteryOutcome(state.active_domain, "negative", "bash_error");
        } catch {
        }
      }
      if (!extracted || !findErrorByFingerprint(extracted.fingerprint)?.occurrences) {
        try {
          const errorSnippet = errorSummary.substring(0, 200);
          const pastNegatives = searchMemories(errorSnippet, 5).filter((m) => !isRecallNoise(m.content, m.type, m.tags)).filter((m) => m.type === "episodic" && isEpisodicData(m.type_data) && m.type_data.outcome === "negative");
          if (pastNegatives.length > 0) {
            const best = pastNegatives[0];
            const resolution = findResolutionForError(best.id);
            const lesson = isEpisodicData(best.type_data) && best.type_data.lesson;
            let warning;
            if (resolution) {
              const resLesson = isEpisodicData(resolution.type_data) && resolution.type_data.lesson;
              warning = resLesson ? `Similar past error resolved: ${truncate(best.content, 60)}. Fix: ${truncate(resLesson, 150)}` : `Similar past error resolved: ${truncate(best.content, 60)}. Resolution: ${truncate(resolution.content, 150)}`;
            } else if (lesson) {
              warning = `Similar past error found: ${truncate(best.content, 80)}. Lesson: ${truncate(lesson, 120)}`;
            } else {
              warning = `Similar past error found: ${truncate(best.content, 150)}`;
            }
            state.pending_error_warnings.push(warning);
            if (state.pending_error_warnings.length > 3) {
              state.pending_error_warnings = state.pending_error_warnings.slice(-3);
            }
          }
        } catch {
        }
      }
    } catch {
    }
    try {
      if (state.active_domain) {
        classifyError(toolOutput, state.active_domain);
      }
    } catch {
    }
    try {
      refreshBridge(makeBridgeOptions(state));
    } catch {
    }
    try {
      if (state.active_chain_ids.length > 0) {
        for (const chainId of [...state.active_chain_ids]) {
          const chain = getReasoningChain(chainId);
          if (!chain || chain.status !== "active") {
            state.active_chain_ids = state.active_chain_ids.filter((id) => id !== chainId);
            continue;
          }
          if (chain.steps.length < REASONING_CHAIN.MAX_STEPS_PER_CHAIN) {
            const step = buildChainStep({
              toolName: "Bash",
              input: truncate(cmd, REASONING_CHAIN.MAX_ACTION_LENGTH),
              output: truncate(toolOutput, REASONING_CHAIN.MAX_OBSERVATION_LENGTH),
              order: chain.steps.length + 1
            });
            updateReasoningChain(chainId, { steps: [...chain.steps, step] });
          }
        }
      }
      if (state.active_chain_ids.length < REASONING_CHAIN.MAX_ACTIVE_CHAINS && state.chain_encoded_count < REASONING_CHAIN.MAX_PER_SESSION) {
        const trigger = detectChainTrigger(toolOutput, true);
        if (trigger) {
          const chain = createReasoningChain({
            chain_type: trigger.chain_type,
            trigger: trigger.trigger,
            domain: state.active_domain
          });
          state.active_chain_ids.push(chain.id);
          log.info("Debug chain started from bash error", { chain_id: chain.id, trigger: trigger.trigger.substring(0, 60) });
        }
      }
      stateChanged = true;
    } catch {
    }
  } else {
    try {
      const filePath = extractFilePath(cmd);
      if (filePath) {
        recordFix(filePath, cmd, null, process.cwd());
      }
    } catch {
    }
    if (canEncodeDiscovery(state) && state.recent_errors.length > 0) {
      const discovery = detectDiscovery(
        "Bash",
        toolInput,
        toolOutput,
        state.session_files,
        state.recent_errors,
        state.reasoning_buffer
      );
      if (discovery) {
        const memoryId = encodeDiscovery(discovery, config, sessionId, {
          domain: state.active_domain,
          version: state.active_version,
          project: state.active_project,
          task: state.active_task
        });
        if (memoryId) {
          state.discovery_encoded_count++;
          state.last_discovery_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          linkResolutionToErrors(memoryId, state.recent_errors, state.active_domain);
          state.recent_errors = [];
          stateChanged = true;
          log.info("Discovery encoded from post-bash", {
            type: discovery.type,
            memory_id: memoryId
          });
        }
      } else if (state.recent_errors.length >= 2 && canEncodeReasoning(state)) {
        const errorSummaries = state.recent_errors.slice(-3).map((e) => truncate(e, 80)).join("; ");
        const fixCmd = truncate(cmd, 100);
        const narrativeContent = `Error resolution: fixed ${state.recent_errors.length} errors (${errorSummaries}) with: ${fixCmd}`;
        const existing = findDuplicate(narrativeContent, "episodic", state.active_domain ? [state.active_domain] : []);
        if (!existing) {
          const mem = createMemory({
            type: "episodic",
            content: narrativeContent,
            summary: null,
            encoding_strength: 0.5,
            reinforcement: 1,
            confidence: 0.55,
            domains: state.active_domain ? [state.active_domain] : [],
            version: state.active_version,
            tags: ["error_narrative", "auto_encoded"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: {
              framework: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              project_path: state.active_project_path,
              task_type: null,
              files: state.session_files.slice(-5),
              error_context: state.recent_errors[0] ?? null,
              session_id: state.session_start,
              significance_score: 0.5
            },
            type_data: {
              kind: "episodic",
              context: {
                project: state.active_project ?? "",
                task: state.active_task ?? "",
                framework: state.active_domain ?? "",
                version: state.active_version ?? "",
                files: state.session_files.slice(-5),
                models: []
              },
              outcome: "positive",
              outcome_detail: `Resolved ${state.recent_errors.length} errors: ${errorSummaries}`,
              emotional_weight: 0.4,
              lesson: distillLesson({
                errors: state.recent_errors,
                fix: fixCmd,
                discovery: state.cognitive_state.recent_discovery
              }),
              lesson_validated: false
            }
          });
          linkResolutionToErrors(mem.id, state.recent_errors, state.active_domain);
          state.reasoning_encoded_count++;
          state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          log.info("Error narrative encoded (fallback)", { error_count: state.recent_errors.length });
        }
        state.recent_errors = [];
        stateChanged = true;
      }
    }
    try {
      if (state.active_chain_ids.length > 0) {
        for (const chainId of [...state.active_chain_ids]) {
          const chain = getReasoningChain(chainId);
          if (!chain || chain.status !== "active") {
            state.active_chain_ids = state.active_chain_ids.filter((id) => id !== chainId);
            continue;
          }
          if (chain.steps.length < REASONING_CHAIN.MAX_STEPS_PER_CHAIN) {
            const step = buildChainStep({
              toolName: "Bash",
              input: truncate(cmd, REASONING_CHAIN.MAX_ACTION_LENGTH),
              output: truncate(toolOutput, REASONING_CHAIN.MAX_OBSERVATION_LENGTH),
              order: chain.steps.length + 1
            });
            const updatedSteps = [...chain.steps, step];
            updateReasoningChain(chainId, { steps: updatedSteps });
            const completion = detectChainCompletion(toolOutput, { ...chain, steps: updatedSteps });
            if (completion) {
              const result = completeReasoningChain(chainId, completion.status, completion.conclusion, completion.confidence, config, sessionId, {
                domain: state.active_domain,
                version: state.active_version,
                project: state.active_project,
                task: state.active_task
              });
              state.active_chain_ids = state.active_chain_ids.filter((id) => id !== chainId);
              if (result.memoryId) state.chain_encoded_count++;
            }
          }
        }
        stateChanged = true;
      }
    } catch {
    }
  }
  try {
    const cmdLower = cmd.toLowerCase();
    const exitCode = stdinJson?.tool_response_metadata;
    const cmdSuccess = !isError;
    state.recent_commands.push({ cmd: truncate(cmd, 200), success: cmdSuccess, time: (/* @__PURE__ */ new Date()).toISOString() });
    if (state.recent_commands.length > PROCEDURAL_WORKFLOW.MAX_TRACKED_COMMANDS) {
      state.recent_commands = state.recent_commands.slice(-PROCEDURAL_WORKFLOW.MAX_TRACKED_COMMANDS);
    }
    stateChanged = true;
    if (cmdSuccess && state.procedural_encoded_count < PROCEDURAL_WORKFLOW.MAX_PER_SESSION) {
      const successCmds = state.recent_commands.filter((c) => c.success);
      if (successCmds.length >= PROCEDURAL_WORKFLOW.MIN_COMMANDS) {
        for (const [workflowName, keywords] of Object.entries(PROCEDURAL_WORKFLOW.WORKFLOW_PATTERNS)) {
          const matching = successCmds.filter((c) => {
            const cl = c.cmd.toLowerCase();
            return keywords.some((kw) => cl.includes(kw));
          });
          if (matching.length >= PROCEDURAL_WORKFLOW.MIN_COMMANDS) {
            const steps = matching.slice(-6).map((c, i) => `${i + 1}. ${truncate(c.cmd, 120)}`).join("\n");
            const content = `${workflowName} workflow (${matching.length} steps):
${steps}`;
            const domains = state.active_domain ? [state.active_domain] : [];
            const existing = findDuplicate(content, "procedural", domains);
            if (!existing) {
              createMemory({
                type: "procedural",
                content,
                summary: `${workflowName} workflow: ${matching.slice(-3).map((c) => truncate(c.cmd, 40)).join(" \u2192 ")}`,
                encoding_strength: 0.7,
                reinforcement: 1.2,
                confidence: PROCEDURAL_WORKFLOW.MIN_CONFIDENCE,
                storage_tier: "short_term",
                pinned: false,
                tags: ["workflow", `workflow-${workflowName}`, "auto-encoded"],
                domains,
                version: state.active_version,
                encoding_context: {
                  project: state.active_project,
                  project_path: state.active_project_path,
                  framework: state.active_domain,
                  version: state.active_version,
                  files: state.session_files.slice(-5),
                  task_type: workflowName === "build" ? "building" : null,
                  error_context: null,
                  session_id: sessionId,
                  significance_score: 0.7
                },
                type_data: {
                  kind: "procedural",
                  steps: matching.map((c) => c.cmd),
                  preconditions: [],
                  postconditions: [],
                  practice_count: 1,
                  automaticity: 0.3,
                  variants: [],
                  skill_metadata: null
                }
              });
              state.procedural_encoded_count++;
              stateChanged = true;
              log.info("Auto-encoded procedural workflow", { type: workflowName, steps: matching.length });
              const matchedTimes = new Set(matching.map((c) => c.time));
              state.recent_commands = state.recent_commands.filter((c) => !matchedTimes.has(c.time));
            }
            break;
          }
        }
      }
    }
  } catch {
  }
  if (stateChanged) {
    saveWatcherState(state);
  }
}
function handlePostWrite(toolInput, argFallback) {
  const input = toolInput ?? safeParse(argFallback ?? "");
  const filePath = input?.file_path ?? input?.path ?? "";
  if (!filePath) return;
  const state = loadWatcherState();
  {
    const newStr = input?.new_string ?? "";
    const firstNewLine = newStr.split("\n").find((l) => l.trim().length > 0) ?? "";
    const actionTarget = firstNewLine ? `${filePath} \u2192 ${firstNewLine}`.slice(0, 250) : filePath;
    state.recent_actions.push({
      tool: "Edit",
      target: actionTarget,
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (state.recent_actions.length > 15) {
      state.recent_actions = state.recent_actions.slice(-15);
    }
  }
  if (typeof filePath === "string" && !state.session_files.includes(filePath)) {
    state.session_files.push(filePath);
    if (state.session_files.length > 50) {
      state.session_files = state.session_files.slice(-50);
    }
    saveWatcherState(state);
    if (state.session_files.length > 3 && state.session_files.length % 3 === 1) {
      try {
        refreshBridge(makeBridgeOptions(state));
      } catch {
      }
    }
  }
  try {
    updateFileInMap(process.cwd(), filePath);
    if (ARCHITECTURE.STATIC_ANALYSIS_ON_WRITE) {
      updateArchitectureFromFile(process.cwd(), filePath);
    }
    recordFix(filePath, null, null, process.cwd());
    addFileToTask(process.cwd(), filePath);
  } catch {
  }
  const fileBasename = basename(filePath);
  const resolvedFilePath = resolve(filePath);
  const cwdPath = process.cwd();
  if ((fileBasename === "__manifest__.py" || fileBasename === "package.json" || fileBasename === "pyproject.toml") && resolvedFilePath.startsWith(cwdPath + "/")) {
    try {
      const manifestContent = readFileSync(resolvedFilePath, "utf-8");
      const domain = fileBasename === "package.json" ? "node" : fileBasename === "pyproject.toml" ? "python" : "odoo";
      const detectedVersion = detectVersionFromManifest(manifestContent, domain);
      if (detectedVersion && detectedVersion !== state.active_version) {
        state.active_version = detectedVersion;
        if (!getVersion(domain, detectedVersion)) {
          registerVersion(domain, detectedVersion, null);
        }
        saveWatcherState(state);
      }
    } catch {
    }
  }
  const event = {
    type: "tool_result",
    content: `File modified: ${filePath}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    metadata: {
      tool: "Write",
      files: [filePath]
    }
  };
  processHookEvent(event, config, sessionId);
  try {
    const cog = state.cognitive_state;
    if (cog.current_approach && cog.current_approach.length > 10 && state.session_files.length >= 2 && canEncodeDiscovery(state)) {
      const rationale = [
        `Modified ${basename(filePath)}`,
        cog.current_approach ? `Approach: ${cog.current_approach}` : null,
        cog.recent_discovery ? `After discovering: ${truncate(cog.recent_discovery, 100)}` : null,
        state.active_task ? `Task: ${state.active_task}` : null
      ].filter(Boolean).join(". ");
      const existing = findDuplicate(rationale, "episodic", state.active_domain ? [state.active_domain] : []);
      if (!existing) {
        createMemory({
          type: "episodic",
          content: rationale,
          summary: null,
          encoding_strength: 0.45,
          reinforcement: 1,
          confidence: 0.55,
          domains: state.active_domain ? [state.active_domain] : [],
          version: state.active_version,
          tags: ["edit_rationale", "auto_encoded"],
          storage_tier: "short_term",
          pinned: false,
          encoding_context: {
            framework: state.active_domain,
            version: state.active_version,
            project: state.active_project,
            project_path: state.active_project_path,
            task_type: null,
            files: [filePath],
            error_context: null,
            session_id: state.session_start,
            significance_score: 0.4
          },
          type_data: {
            kind: "episodic",
            context: {
              project: state.active_project ?? "",
              task: state.active_task ?? "",
              framework: state.active_domain ?? "",
              version: state.active_version ?? "",
              files: [filePath],
              models: []
            },
            outcome: "positive",
            outcome_detail: `Modified ${basename(filePath)}`,
            emotional_weight: 0.2,
            lesson: distillLesson({
              errors: state.recent_errors.length > 0 ? state.recent_errors : void 0,
              discovery: cog.recent_discovery
            }),
            lesson_validated: false
          }
        });
        state.discovery_encoded_count++;
        state.last_discovery_encode_time = (/* @__PURE__ */ new Date()).toISOString();
        saveWatcherState(state);
        log.info("Edit rationale encoded", { file: filePath });
      }
    }
  } catch {
  }
}
function handlePostToolGeneric(stdinJson) {
  if (!stdinJson) return;
  const toolName = stdinJson.tool_name ?? "";
  const toolInput = stdinJson.tool_input;
  const rawResponse = stdinJson.tool_response;
  const toolOutput = typeof rawResponse === "string" ? rawResponse : rawResponse != null ? JSON.stringify(rawResponse) : "";
  if (!toolName) return;
  if (toolOutput.length < REASONING_TRACE.MIN_OUTPUT_LENGTH) return;
  const call = {
    tool: toolName,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    input_summary: summarizeToolInput(toolName, toolInput),
    output_summary: summarizeToolOutput(toolName, toolOutput),
    files: extractFilesFromToolCall(toolName, toolInput, toolOutput)
  };
  const state = loadWatcherState();
  if (call.files.length > 0) {
    for (const f of call.files) {
      if (typeof f === "string" && f.startsWith("/") && !state.session_files.includes(f)) {
        state.session_files.push(f);
      }
    }
    if (state.session_files.length > 50) {
      state.session_files = state.session_files.slice(-50);
    }
  }
  state.recent_tool_names.push(toolName);
  if (state.recent_tool_names.length > 10) {
    state.recent_tool_names = state.recent_tool_names.slice(-10);
  }
  if (toolName !== "Read" && toolName !== "Glob" && toolName !== "Grep") {
    state.recent_actions.push({
      tool: toolName,
      target: call.input_summary ?? "",
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (state.recent_actions.length > 15) {
      state.recent_actions = state.recent_actions.slice(-15);
    }
  }
  state.reasoning_buffer.push(call);
  if (state.reasoning_buffer.length > REASONING_TRACE.MAX_BUFFER_SIZE) {
    state.reasoning_buffer = state.reasoning_buffer.slice(-REASONING_TRACE.MAX_BUFFER_SIZE);
  }
  try {
    const isSearchTool = REASONING_TRACE.SEARCH_TOOLS.includes(toolName);
    if (isSearchTool) {
      state.search_queries.push(call.input_summary);
      if (state.search_queries.length > COGNITIVE.SEARCH_HISTORY_SIZE) {
        state.search_queries = state.search_queries.slice(-COGNITIVE.SEARCH_HISTORY_SIZE);
      }
      state.cognitive_state = updateCognitiveState(
        state.cognitive_state,
        { type: "search_query", query: call.input_summary, previousQueries: state.search_queries.slice(0, -1) },
        state.recent_tool_names,
        state.recent_errors
      );
    } else if (REASONING_TRACE.DECISION_TOOLS.includes(toolName) && call.input_summary.length >= COGNITIVE.MIN_AGENT_PROMPT_FOR_COGNITION) {
      const prevApproach = state.cognitive_state.current_approach;
      state.cognitive_state = updateCognitiveState(
        state.cognitive_state,
        { type: "agent_prompt", prompt: call.input_summary },
        state.recent_tool_names,
        state.recent_errors
      );
      const newApproach = state.cognitive_state.current_approach;
      if (prevApproach && newApproach && prevApproach !== newApproach && keywordSimilarity(prevApproach, newApproach) < 0.3 && canEncodeReasoning(state)) {
        const pivotContent = `Approach pivot: from "${truncate(prevApproach, 120)}" to "${truncate(newApproach, 120)}"` + (state.recent_errors.length > 0 ? `. Triggered by errors: ${state.recent_errors.slice(-1).map((e) => truncate(e, 80)).join("; ")}` : "");
        const existing = findDuplicate(pivotContent, "episodic", state.active_domain ? [state.active_domain] : []);
        if (!existing) {
          createMemory({
            type: "episodic",
            content: pivotContent,
            summary: null,
            encoding_strength: 0.6,
            reinforcement: 1,
            confidence: 0.6,
            domains: state.active_domain ? [state.active_domain] : [],
            version: state.active_version,
            tags: ["approach_pivot", "auto_encoded"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: {
              framework: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              project_path: state.active_project_path,
              task_type: null,
              files: state.session_files.slice(-5),
              error_context: state.recent_errors[0] ?? null,
              session_id: state.session_start,
              significance_score: 0.55
            },
            type_data: {
              kind: "episodic",
              context: {
                project: state.active_project ?? "",
                task: state.active_task ?? "",
                framework: state.active_domain ?? "",
                version: state.active_version ?? "",
                files: state.session_files.slice(-5),
                models: []
              },
              outcome: "neutral",
              outcome_detail: `Approach changed from "${truncate(prevApproach, 80)}" to "${truncate(newApproach, 80)}"`,
              emotional_weight: 0.4,
              lesson: distillLesson({
                errors: state.recent_errors,
                prevApproach,
                newApproach,
                discovery: state.cognitive_state.recent_discovery
              }),
              lesson_validated: false
            }
          });
          state.reasoning_encoded_count++;
          state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          log.info("Approach pivot encoded", { from: prevApproach.substring(0, 40), to: newApproach.substring(0, 40) });
          if (state.recent_errors.length > 0) {
            try {
              const errorContext = state.recent_errors.slice(-2).map((e) => truncate(e, 80)).join("; ");
              const apContent = `Don't use approach "${truncate(prevApproach, 150)}" when encountering: ${errorContext}`;
              const apFix = `Instead try: ${truncate(newApproach, 200)}`;
              const ap = createAntipatternFromExperience(
                apContent,
                apFix,
                "medium",
                state.active_domain ? [state.active_domain] : [],
                state.active_version,
                [],
                // auto-extract keywords
                {
                  framework: state.active_domain,
                  version: state.active_version,
                  project: state.active_project,
                  project_path: state.active_project_path,
                  task_type: null,
                  files: state.session_files.slice(-5),
                  error_context: errorContext,
                  session_id: state.session_start,
                  significance_score: 0.6
                }
              );
              autoCreateFromAntipattern(ap.id, [], state.active_domain ?? "general", "medium");
              log.info("Approach-level antipattern created", { id: ap.id });
            } catch {
            }
          }
        }
      }
    } else {
      state.cognitive_state = updateCognitiveState(
        state.cognitive_state,
        { type: "tool_call", toolName, inputSummary: call.input_summary },
        state.recent_tool_names,
        state.recent_errors
      );
    }
  } catch {
  }
  if (canEncodeReasoning(state)) {
    const pattern = detectReasoningPattern(state.reasoning_buffer);
    if (pattern) {
      const memoryId = encodeReasoningTrace(pattern, config, sessionId, {
        domain: state.active_domain,
        version: state.active_version,
        project: state.active_project,
        task: state.active_task
      }, state.cognitive_state);
      if (memoryId) {
        state.reasoning_encoded_count++;
        state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
        const encodedTimestamps = new Set(pattern.tools.map((t) => t.timestamp));
        state.reasoning_buffer = state.reasoning_buffer.filter(
          (t) => !encodedTimestamps.has(t.timestamp)
        );
        log.info("Reasoning trace encoded from post-tool", {
          type: pattern.type,
          memory_id: memoryId,
          tools: pattern.tools.length
        });
      }
    }
  }
  if (canEncodeDiscovery(state)) {
    const discovery = detectDiscovery(
      toolName,
      toolInput,
      toolOutput,
      state.session_files,
      state.recent_errors,
      state.reasoning_buffer
    );
    if (discovery) {
      const memoryId = encodeDiscovery(discovery, config, sessionId, {
        domain: state.active_domain,
        version: state.active_version,
        project: state.active_project,
        task: state.active_task
      });
      if (memoryId) {
        state.discovery_encoded_count++;
        state.last_discovery_encode_time = (/* @__PURE__ */ new Date()).toISOString();
        log.info("Discovery encoded from post-tool", {
          type: discovery.type,
          memory_id: memoryId
        });
      }
    }
  }
  if (toolOutput.length >= 100 && state.recalled_memory_ids.length > 0) {
    try {
      const outputEmbedding = generateEmbedding(toolOutput.slice(0, RETRIEVAL_FEEDBACK.USAGE_EMBEDDING_MAX_CHARS));
      const outputKeywords = extractKeywords(toolOutput);
      for (const recalledId of state.recalled_memory_ids) {
        if (state.used_memory_ids.includes(recalledId)) continue;
        try {
          const mem = getMemory(recalledId);
          if (!mem) continue;
          const kwSim = keywordSimilarity(toolOutput, mem.content);
          if (kwSim >= RETRIEVAL_FEEDBACK.MIN_USAGE_SIMILARITY) {
            state.used_memory_ids.push(recalledId);
            const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.REINFORCEMENT_BONUS;
            updateMemory(recalledId, { reinforcement: newR });
            continue;
          }
          const embBuf = getEmbedding(recalledId);
          if (embBuf) {
            const memEmbedding = bufferToEmbedding(embBuf);
            const embSim = cosineSimilarity(outputEmbedding, memEmbedding);
            if (embSim >= RETRIEVAL_FEEDBACK.MIN_EMBEDDING_USAGE_SIMILARITY) {
              state.used_memory_ids.push(recalledId);
              const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.REINFORCEMENT_BONUS;
              updateMemory(recalledId, { reinforcement: newR });
              continue;
            }
          }
          const memKeywords = extractKeywords(mem.content);
          if (memKeywords.length > 0 && outputKeywords.length > 0) {
            const overlap = memKeywords.filter((kw) => outputKeywords.includes(kw)).length;
            const overlapRatio = overlap / memKeywords.length;
            if (overlapRatio >= RETRIEVAL_FEEDBACK.MIN_PARTIAL_KEYWORD_OVERLAP) {
              state.used_memory_ids.push(recalledId);
              const newR = retrievalReinforcement(mem.reinforcement) * RETRIEVAL_FEEDBACK.PARTIAL_USAGE_BONUS;
              updateMemory(recalledId, { reinforcement: newR });
            }
          }
        } catch {
        }
      }
    } catch {
    }
  }
  try {
    const decision = detectDecisionPoint(toolName, call.input_summary, call.files);
    if (decision) {
      state.conversation.decision_points.push(decision);
      if (state.conversation.decision_points.length > CONVERSATION.MAX_DECISION_POINTS) {
        state.conversation.decision_points = state.conversation.decision_points.slice(-CONVERSATION.MAX_DECISION_POINTS);
      }
      if (canEncodeDecision(state)) {
        let affectedComponents = [];
        try {
          const projectPath = state.active_project ?? "";
          for (const file of decision.files.slice(0, 5)) {
            const nodes = getArchNodesByFile(projectPath, file);
            for (const node of nodes) {
              if (!affectedComponents.includes(node.name)) {
                affectedComponents.push(node.name);
              }
            }
          }
          affectedComponents = affectedComponents.slice(0, DECISION.MAX_AFFECTED_COMPONENTS);
        } catch {
        }
        const memoryId = encodeDecision(decision, config, sessionId, {
          domain: state.active_domain,
          version: state.active_version,
          project: state.active_project,
          task: state.active_task
        }, affectedComponents);
        if (memoryId) {
          state.decision_encoded_count++;
          state.last_decision_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          state.decision_memory_ids.push(memoryId);
          if (state.decision_memory_ids.length > DECISION.MAX_PER_SESSION) {
            state.decision_memory_ids = state.decision_memory_ids.slice(-DECISION.MAX_PER_SESSION);
          }
        }
      }
      log.info("Decision point recorded", { tool: toolName, description: decision.description.substring(0, 80) });
    }
  } catch {
  }
  try {
    const inputText = call.input_summary;
    const outputText = call.output_summary;
    if (state.active_chain_ids.length > 0) {
      for (const chainId of [...state.active_chain_ids]) {
        const chain = getReasoningChain(chainId);
        if (!chain || chain.status !== "active") {
          state.active_chain_ids = state.active_chain_ids.filter((id) => id !== chainId);
          continue;
        }
        if (chain.steps.length < REASONING_CHAIN.MAX_STEPS_PER_CHAIN) {
          const step = buildChainStep({
            toolName,
            input: inputText,
            output: outputText,
            order: chain.steps.length + 1,
            files: call.files
          });
          const updatedSteps = [...chain.steps, step];
          updateReasoningChain(chainId, { steps: updatedSteps });
          const completion = detectChainCompletion(outputText, { ...chain, steps: updatedSteps });
          if (completion) {
            const result = completeReasoningChain(chainId, completion.status, completion.conclusion, completion.confidence, config, sessionId, {
              domain: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              task: state.active_task
            });
            state.active_chain_ids = state.active_chain_ids.filter((id) => id !== chainId);
            if (result.memoryId) state.chain_encoded_count++;
            log.info("Reasoning chain completed", { chain_id: chainId, status: completion.status });
          }
        }
      }
      state.last_chain_step_time = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (state.active_chain_ids.length < REASONING_CHAIN.MAX_ACTIVE_CHAINS && state.chain_encoded_count < REASONING_CHAIN.MAX_PER_SESSION) {
      const trigger = detectChainTrigger(inputText + " " + outputText, toolOutput.toLowerCase().includes("error"));
      if (trigger) {
        const chain = createReasoningChain({
          chain_type: trigger.chain_type,
          trigger: trigger.trigger,
          domain: state.active_domain
        });
        state.active_chain_ids.push(chain.id);
        log.info("Reasoning chain started", { chain_id: chain.id, type: trigger.chain_type, trigger: trigger.trigger.substring(0, 60) });
      }
    }
  } catch {
  }
  saveWatcherState(state);
}
function canEncodeReasoning(state) {
  if (state.reasoning_encoded_count >= REASONING_TRACE.MAX_PER_SESSION) {
    return false;
  }
  if (state.last_reasoning_encode_time) {
    const elapsed = Date.now() - new Date(state.last_reasoning_encode_time).getTime();
    if (elapsed < REASONING_TRACE.COOLDOWN_MINUTES * 60 * 1e3) {
      return false;
    }
  }
  return true;
}
function canEncodeDecision(state) {
  if (state.decision_encoded_count >= DECISION.MAX_PER_SESSION) {
    return false;
  }
  if (state.last_decision_encode_time) {
    const elapsed = Date.now() - new Date(state.last_decision_encode_time).getTime();
    if (elapsed < DECISION.COOLDOWN_MINUTES * 60 * 1e3) {
      return false;
    }
  }
  return true;
}
function canEncodeFeedback(state) {
  if (state.feedback_encoded_count >= FEEDBACK.MAX_PER_SESSION) {
    return false;
  }
  if (state.last_feedback_encode_time) {
    const elapsed = Date.now() - new Date(state.last_feedback_encode_time).getTime();
    if (elapsed < FEEDBACK.COOLDOWN_SECONDS * 1e3) {
      return false;
    }
  }
  return true;
}
function canEncodeDiscovery(state) {
  if (state.discovery_encoded_count >= DISCOVERY.MAX_PER_SESSION) {
    return false;
  }
  if (state.last_discovery_encode_time) {
    const elapsed = Date.now() - new Date(state.last_discovery_encode_time).getTime();
    if (elapsed < DISCOVERY.COOLDOWN_MINUTES * 60 * 1e3) {
      return false;
    }
  }
  return true;
}
function summarizeToolInput(tool, input) {
  if (!input) return "";
  switch (tool) {
    case "Read":
      return truncate(input.file_path ?? "", 200);
    case "Grep":
      return truncate(
        `pattern=${input.pattern ?? ""} path=${input.path ?? ""}`,
        200
      );
    case "Glob":
      return truncate(
        `pattern=${input.pattern ?? ""} path=${input.path ?? ""}`,
        200
      );
    case "Edit": {
      const filePath = input.file_path ?? "";
      const newStr = input.new_string ?? "";
      const firstNewLine = newStr.split("\n").find((l) => l.trim().length > 0) ?? "";
      return truncate(`${filePath} \u2192 ${firstNewLine}`, 250);
    }
    case "Write":
      return truncate(input.file_path ?? "", 200);
    case "Agent":
      return truncate(input.prompt ?? "", 300);
    case "WebSearch":
      return truncate(input.query ?? "", 200);
    case "WebFetch":
      return truncate(input.url ?? "", 200);
    default:
      return truncate(
        input.command ?? input.query ?? input.prompt ?? JSON.stringify(input).substring(0, 200),
        200
      );
  }
}
function summarizeToolOutput(tool, output) {
  if (!output) return "";
  const isSearchTool = ["Read", "Grep", "Glob"].includes(tool);
  const maxSummary = isSearchTool ? 500 : 250;
  if (output.length > 500) {
    const hasError = containsError(output);
    const lineCount = output.split("\n").length;
    return truncate(
      `${hasError ? "ERROR: " : ""}${lineCount} lines. ${output.substring(0, isSearchTool ? 350 : 150)}`,
      maxSummary
    );
  }
  return truncate(output, maxSummary);
}
function extractFilesFromToolCall(tool, input, output) {
  const files = [];
  const MAX_PATH_LEN = 500;
  if (input) {
    const filePath = input.file_path ?? input.path;
    if (filePath && typeof filePath === "string") files.push(filePath.slice(0, MAX_PATH_LEN));
  }
  if (output && (tool === "Grep" || tool === "Glob")) {
    const pathMatches = output.match(/^\/[^\s:]+/gm);
    if (pathMatches) {
      for (const p of pathMatches.slice(0, 10)) {
        const truncated = p.slice(0, MAX_PATH_LEN);
        if (!files.includes(truncated)) files.push(truncated);
      }
    }
  }
  return files.slice(0, 10);
}
function handleNotification(type, data) {
  try {
    log.info("Notification received", { type, data: truncate(data, 300) });
    const isContextWarning = type === "context_window" || type === "context" || /context.*(low|full|limit|running out|compact)/i.test(data) || /remaining.*context/i.test(data);
    if (isContextWarning) {
      log.info("Context pressure detected \u2014 proactive offload triggered", { type, data });
      try {
        proactiveOffload();
      } catch (e) {
        log.error("Proactive offload failed", { error: safeErrorStr(e) });
      }
    }
    const eventType = type === "error" ? "error" : type === "correction" ? "correction" : "notification";
    const event = {
      type: eventType,
      content: truncate(data, 500),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: {}
    };
    processHookEvent(event, config, sessionId);
    if (type === "error" && data) {
      try {
        recordError(data, "notification", null, process.cwd());
      } catch {
      }
    }
  } catch (e) {
    log.error("handleNotification failed", { error: safeErrorStr(e) });
  }
}
function proactiveOffload() {
  const state = loadWatcherState();
  const cog = state.cognitive_state;
  const cogParts = [];
  if (cog.current_approach) cogParts.push(`Approach: ${cog.current_approach}`);
  if (cog.active_hypothesis) cogParts.push(`Hypothesis: ${cog.active_hypothesis}`);
  if (cog.recent_discovery) cogParts.push(`Discovery: ${cog.recent_discovery}`);
  if (cog.search_intent) cogParts.push(`Investigating: ${cog.search_intent}`);
  if (cogParts.length > 0) {
    const content = `Pre-compaction cognitive snapshot: ${cogParts.join(". ")}`;
    const domains = state.active_domain ? [state.active_domain] : [];
    try {
      const existing = findDuplicate(content, "semantic", domains);
      if (!existing) {
        createMemory({
          type: "semantic",
          content,
          summary: null,
          encoding_strength: 0.6,
          reinforcement: 1,
          confidence: 0.6,
          domains,
          version: state.active_version,
          tags: ["pre-compact", "cognitive-snapshot", "proactive-offload"],
          storage_tier: "short_term",
          pinned: false,
          encoding_context: {
            framework: state.active_domain,
            version: state.active_version,
            project: state.active_project,
            project_path: state.active_project_path,
            task_type: null,
            files: state.session_files.slice(-5),
            error_context: null,
            session_id: state.session_start,
            significance_score: 0.5
          },
          type_data: {
            kind: "semantic",
            knowledge_type: "convention",
            source: "experience",
            source_episodes: [],
            applicable_versions: null,
            deprecated_in: null
          }
        });
        log.info("Proactive offload: cognitive snapshot encoded");
      }
    } catch {
    }
  }
}
function estimateContextRemaining(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  try {
    const stats = statSync(transcriptPath);
    const tailSize = Math.min(stats.size, 1e5);
    const fd = openSync(transcriptPath, "r");
    const buf = Buffer.alloc(tailSize);
    readSync(fd, buf, 0, tailSize, Math.max(0, stats.size - tailSize));
    closeSync(fd);
    const tail = buf.toString("utf8");
    const scanLines = tail.split("\n").slice(-CONTEXT_PRESSURE.TRANSCRIPT_SCAN_LINES);
    let lastUsage = null;
    for (let i = scanLines.length - 1; i >= 0; i--) {
      const line = scanLines[i];
      if (!line || !line.includes('"assistant"')) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type === "assistant" && obj.message?.usage) {
          const u = obj.message.usage;
          lastUsage = {
            cache_read: u.cache_read_input_tokens ?? 0,
            input: u.input_tokens ?? 0,
            cache_creation: u.cache_creation_input_tokens ?? 0
          };
          break;
        }
      } catch {
        continue;
      }
    }
    if (!lastUsage) return null;
    const totalUsed = (lastUsage.cache_read ?? 0) + (lastUsage.input ?? 0) + (lastUsage.cache_creation ?? 0);
    if (totalUsed === 0) return null;
    const remaining = Math.max(0, 100 - totalUsed / CONTEXT_PRESSURE.DEFAULT_CONTEXT_WINDOW * 100);
    return Math.round(remaining);
  } catch {
    return null;
  }
}
function extractReasoningFromTranscript(transcriptPath, maxMessages) {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  const messageCap = maxMessages ?? TRANSCRIPT_REASONING.MAX_MESSAGES_TO_SCAN;
  try {
    const stats = statSync(transcriptPath);
    const tailBytes = maxMessages ? Math.min(stats.size, TRANSCRIPT_REASONING.TAIL_BYTES * 3) : Math.min(stats.size, TRANSCRIPT_REASONING.TAIL_BYTES);
    const fd = openSync(transcriptPath, "r");
    const buf = Buffer.alloc(tailBytes);
    readSync(fd, buf, 0, tailBytes, Math.max(0, stats.size - tailBytes));
    closeSync(fd);
    const tail = buf.toString("utf8");
    const lines = tail.split("\n");
    const snippets = [];
    let messagesScanned = 0;
    for (let i = lines.length - 1; i >= 0 && messagesScanned < messageCap; i--) {
      const line = lines[i];
      if (!line || !line.includes('"assistant"')) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type !== "assistant") continue;
        messagesScanned++;
        const content = obj.message?.content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
          if (block.type !== "text" || !block.text) continue;
          const text = block.text;
          if (text.length < TRANSCRIPT_REASONING.MIN_REASONING_LENGTH) continue;
          for (const pattern of TRANSCRIPT_REASONING.REASONING_PATTERNS) {
            const match = text.match(pattern);
            if (match?.[1]) {
              const snippet = match[1].trim();
              if (snippet.length >= TRANSCRIPT_REASONING.MIN_REASONING_LENGTH) {
                snippets.push(snippet.slice(0, TRANSCRIPT_REASONING.MAX_REASONING_SNIPPET));
              }
            }
          }
        }
      } catch {
        continue;
      }
    }
    return snippets;
  } catch {
    return [];
  }
}
function findUndistilledMemories(maxAge) {
  try {
    const cutoff = new Date(Date.now() - maxAge * 6e4).toISOString();
    const recent = getRecentMemories(20).filter(
      (m) => m.type === "episodic" && m.tags.includes("auto_encoded") && m.created_at > cutoff && isEpisodicData(m.type_data) && !m.type_data.lesson && m.content.length > 40
    );
    return recent.slice(0, DISTILLATION.MAX_MEMORIES_PER_PROMPT).map((m) => ({
      id: m.id,
      content: m.content
    }));
  } catch {
    return [];
  }
}
function handleSessionStart(stdinJson, argFallback) {
  const metadata = stdinJson ?? safeParse(argFallback ?? "{}") ?? {};
  const isPostCompact = metadata.source === "compact" || metadata.matcher === "compact";
  if (!isPostCompact) {
    cleanupStaleSessions();
  }
  const prevState = isPostCompact ? loadWatcherState() : null;
  let inferredDomain = prevState?.active_domain ?? metadata.framework ?? null;
  let inferredVersion = prevState?.active_version ?? metadata.version ?? null;
  if (!inferredVersion) {
    const projectHint = inferVersionFromProject();
    if (projectHint) {
      inferredVersion = projectHint.version;
      if (!inferredDomain) inferredDomain = projectHint.domain;
    }
  }
  const inferredProject = prevState?.active_project ?? metadata.project ?? inferProjectFromCwd();
  const stdinCwd = stdinJson?.cwd ?? null;
  const cwdForProject = stdinCwd ?? process.cwd();
  const inferredProjectPath = prevState?.active_project_path ?? inferProjectPath(cwdForProject);
  const injectionLevel = determineInjectionLevel(
    inferredDomain,
    prevState?.total_turns ?? 0,
    prevState?.recent_errors ?? [],
    isPostCompact
  );
  saveWatcherState({
    turns_since_engram: 0,
    total_turns: isPostCompact ? prevState?.total_turns ?? 0 : 0,
    last_engram_tool: null,
    last_engram_time: null,
    session_files: isPostCompact ? prevState?.session_files ?? [] : [],
    session_start: isPostCompact ? prevState?.session_start ?? (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    active_domain: inferredDomain,
    active_project: inferredProject,
    active_project_path: inferredProjectPath,
    active_task: prevState?.active_task ?? null,
    active_version: inferredVersion,
    recent_errors: isPostCompact ? prevState?.recent_errors ?? [] : [],
    reasoning_buffer: [],
    reasoning_encoded_count: 0,
    last_reasoning_encode_time: null,
    feedback_encoded_count: 0,
    last_feedback_encode_time: null,
    discovery_encoded_count: 0,
    last_discovery_encode_time: null,
    conversation: isPostCompact ? prevState?.conversation ?? createEmptyConversationState() : createEmptyConversationState(),
    feedback_signals: isPostCompact ? prevState?.feedback_signals ?? { approval: 0, correction: 0, frustration: 0, instruction: 0 } : { approval: 0, correction: 0, frustration: 0, instruction: 0 },
    message_lengths: [],
    message_has_code: [],
    message_jargon_count: [],
    message_is_question: [],
    decision_encoded_count: 0,
    last_decision_encode_time: null,
    decision_memory_ids: isPostCompact ? prevState?.decision_memory_ids ?? [] : [],
    active_chain_ids: [],
    chain_encoded_count: 0,
    last_chain_step_time: null,
    injection_level: injectionLevel,
    milestone_encoded_count: 0,
    recovery_context: isPostCompact ? prevState?.recovery_context ?? null : null,
    understanding_snapshot: isPostCompact ? prevState?.understanding_snapshot ?? null : null,
    proactive_injection_ids: [],
    proactive_injection_turns: {},
    recalled_memory_ids: [],
    used_memory_ids: [],
    surface_injection_turns: {},
    test_completion_encoded: false,
    recent_tool_names: isPostCompact ? prevState?.recent_tool_names ?? [] : [],
    prewrite_file_counts: {},
    last_chain_injection_turn: 0,
    cognitive_state: isPostCompact ? prevState?.cognitive_state ?? createDefaultCognitiveState() : createDefaultCognitiveState(),
    search_queries: isPostCompact ? prevState?.search_queries ?? [] : [],
    session_outcomes: isPostCompact ? prevState?.session_outcomes ?? [] : [],
    pending_error_warnings: isPostCompact ? prevState?.pending_error_warnings ?? [] : [],
    last_reasoning_extraction_turn: isPostCompact ? prevState?.last_reasoning_extraction_turn ?? 0 : 0,
    reasoning_extraction_count: isPostCompact ? prevState?.reasoning_extraction_count ?? 0 : 0,
    last_distillation_turn: isPostCompact ? prevState?.last_distillation_turn ?? 0 : 0,
    last_context_remaining: isPostCompact ? prevState?.last_context_remaining ?? null : null,
    recall_queries: isPostCompact ? prevState?.recall_queries ?? 0 : 0,
    recall_misses: isPostCompact ? prevState?.recall_misses ?? 0 : 0,
    last_status_turn: 0,
    offload_message_sent: false,
    summary_injection_mode: false,
    recent_commands: isPostCompact ? prevState?.recent_commands ?? [] : [],
    procedural_encoded_count: isPostCompact ? prevState?.procedural_encoded_count ?? 0 : 0,
    recent_actions: isPostCompact ? prevState?.recent_actions ?? [] : [],
    continuation_brief: isPostCompact ? prevState?.continuation_brief ?? null : null,
    recent_prompts: isPostCompact ? prevState?.recent_prompts ?? [] : []
  });
  const source = metadata.source;
  if (!source || source === "startup") {
    resetAutonomicState();
  }
  const event = {
    type: "session_start",
    content: "Session starting",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    metadata: {
      framework: metadata.framework ?? null,
      version: metadata.version ?? null,
      project: metadata.project ?? null,
      task_type: metadata.task_type ?? null
    }
  };
  processHookEvent(event, config, sessionId);
  let bridgeWritten = false;
  try {
    const cogState = prevState?.cognitive_state;
    const bridgeOpts = {
      domain: inferredDomain,
      version: inferredVersion,
      project: inferredProject,
      task: prevState?.active_task ?? null,
      cwd: process.cwd(),
      isPostCompact,
      tokenBudget: CURATOR.BRIDGE_TOKEN_BUDGET,
      cognitive: cogState ? {
        approach: cogState.current_approach ?? null,
        phase: cogState.session_phase ?? null,
        hypothesis: cogState.active_hypothesis ?? null,
        discovery: cogState.recent_discovery ?? null
      } : void 0,
      recent_files: prevState?.session_files?.slice(-10),
      recent_errors: prevState?.recent_errors?.slice(-3)
    };
    bridgeWritten = refreshBridge(bridgeOpts);
  } catch {
  }
  const budget = new OutputBudget(isPostCompact ? OUTPUT_BUDGET.POST_COMPACT_MAX_BYTES : void 0);
  try {
    const stats = getStats();
    budget.append("stats", `[Engram] ${stats.total_memories} memories | ${stats.by_type.antipattern ?? 0} antipatterns | ${stats.total_connections} connections`);
  } catch {
  }
  if (!isPostCompact) {
    try {
      const handoff = readSessionHandoff(inferredProject);
      if (handoff) {
        const handoffText = formatHandoffInjection(handoff);
        budget.append("handoff", handoffText, handoff.domain === inferredDomain ? 1 : 0);
        if (handoff.task && !prevState?.active_task) {
          const freshState = loadWatcherState();
          if (!freshState.active_task) {
            freshState.active_task = handoff.task;
            saveWatcherState(freshState);
          }
        }
      }
    } catch {
    }
  }
  if (isPostCompact && prevState) {
    try {
      const compactParts = [];
      if (prevState.recovery_context) {
        const enhancedCtx = {
          domain: prevState.active_domain,
          version: prevState.active_version,
          active_task: prevState.active_task,
          recent_errors: prevState.recent_errors,
          token_budget: 4500,
          understanding: prevState?.understanding_snapshot ?? null,
          recovery: prevState.recovery_context
        };
        const payload = buildEnhancedPostCompactionPayload(enhancedCtx, config);
        const payloadText = formatCompactionPayload(payload);
        if (payloadText) {
          compactParts.push("[Engram] Context restored after compaction:");
          compactParts.push(payloadText);
        }
        const recallProject = inferredProject ?? void 0;
        for (const topic of prevState.recovery_context.high_value_topics.slice(0, 3)) {
          try {
            const topicMemories = searchMemories(topic, 5, recallProject).filter((m) => !isRecallNoise(m.content, m.type, m.tags));
            for (const m of topicMemories.slice(0, 2)) {
              compactParts.push(`  [${m.type}] ${truncate(m.content, 120)}`);
            }
          } catch {
          }
        }
        if (prevState.recovery_context.continuation_hint) {
          compactParts.push(`[Engram] Continue: ${prevState.recovery_context.continuation_hint}`);
        }
        if (prevState.recovery_context.domain_synthesis_id) {
          try {
            const synthMem = getMemory(prevState.recovery_context.domain_synthesis_id);
            if (synthMem) {
              compactParts.push(`[ENGRAM SYNTHESIS] ${truncate(synthMem.content, 300)}`);
            }
          } catch {
          }
        }
        if (prevState.recovery_context.key_patterns && prevState.recovery_context.key_patterns.length > 0) {
          compactParts.push(`[ENGRAM PATTERNS] ${prevState.recovery_context.key_patterns.join(", ")}`);
        }
      } else {
        const compactionCtx = {
          domain: prevState.active_domain,
          version: prevState.active_version,
          active_task: prevState.active_task,
          recent_errors: prevState.recent_errors,
          token_budget: 4500
        };
        const payload = buildPostCompactionPayload(compactionCtx, config);
        const payloadText = formatCompactionPayload(payload);
        if (payloadText) {
          compactParts.push("[Engram] Context restored after compaction:");
          compactParts.push(payloadText);
        }
      }
      if (prevState.active_task) {
        compactParts.push(`[Engram] Previous task: ${prevState.active_task}`);
      }
      if (prevState.active_domain) {
        compactParts.push(`[Engram] Domain: ${prevState.active_domain}`);
      }
      if (prevState.session_files.length > 0) {
        const files = prevState.session_files.slice(-10).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
        compactParts.push(`[Engram] Files modified before compaction: ${files}`);
      }
      if (compactParts.length > 0) {
        budget.append("compaction", compactParts.join("\n"), prevState.active_domain ? 1 : 0);
      }
    } catch {
    }
  } else if (injectionLevel !== "low") {
    try {
      const recent = getRecentMemories(10).filter((m) => m.confidence >= 0.5).slice(0, 5);
      if (recent.length > 0) {
        const memLines = ["Recent memories:"];
        for (const m of recent) {
          memLines.push(`  [${m.type}] ${truncate(m.content, 120)} (conf: ${m.confidence.toFixed(2)})`);
        }
        budget.append("memories", memLines.join("\n"));
      }
    } catch {
    }
  }
  if (injectionLevel === "low") {
    try {
      const antipatterns = getAntipatterns();
      const critical = antipatterns.filter((m) => {
        const td = isAntipatternData(m.type_data) ? m.type_data : null;
        return td?.severity === "critical";
      }).slice(0, 3);
      if (critical.length > 0) {
        const apLines = ["Active antipatterns:"];
        for (const m of critical) {
          apLines.push(`  [CRITICAL] ${truncate(m.content, 120)}`);
        }
        budget.append("antipatterns", apLines.join("\n"));
      }
    } catch {
    }
  } else {
    try {
      const antipatterns = getAntipatterns();
      const top = antipatterns.filter((m) => {
        const td = isAntipatternData(m.type_data) ? m.type_data : null;
        return td?.severity === "critical" || td?.severity === "high";
      }).slice(0, 5);
      if (top.length > 0) {
        const apLines = ["Active antipatterns:"];
        for (const m of top) {
          const td = isAntipatternData(m.type_data) ? m.type_data : null;
          apLines.push(`  [${(td?.severity ?? "warn").toUpperCase()}] ${truncate(m.content, 120)}`);
        }
        budget.append("antipatterns", apLines.join("\n"));
      }
    } catch {
    }
  }
  try {
    const cwd = process.cwd();
    const existingMap = getProjectMap(cwd);
    if (existingMap.length === 0) {
      scanProject(cwd);
    }
    const codemapBlock = formatProjectMap(cwd, CODEMAP.INJECTION_TOKEN_BUDGET);
    if (codemapBlock) budget.append("codemap", codemapBlock);
  } catch {
  }
  try {
    const cwd = process.cwd();
    const activeModule = inferredDomain ?? inferModuleFromCwd(cwd);
    if (activeModule) {
      const archBlock = formatArchitectureInjection(cwd, activeModule, ARCHITECTURE.INJECTION_TOKEN_BUDGET);
      if (archBlock) budget.append("architecture", archBlock);
    }
  } catch {
  }
  if (injectionLevel === "high" || injectionLevel === "medium") {
    try {
      pauseStaleTasks(process.cwd());
      const taskBlock = formatTaskSummary(process.cwd(), TASK_JOURNAL.INJECTION_TOKEN_BUDGET);
      if (taskBlock) budget.append("tasks", taskBlock);
    } catch {
    }
    try {
      const errorBlock = formatRecentErrors(ERROR_LEARNING.INJECTION_TOKEN_BUDGET);
      if (errorBlock) budget.append("errors", errorBlock);
    } catch {
    }
  }
  if (injectionLevel === "high") {
    try {
      const testBlock = formatTestHealth(process.cwd(), TEST_TRACKING.INJECTION_TOKEN_BUDGET);
      if (testBlock) budget.append("other", testBlock);
    } catch {
    }
    try {
      const report = detectBlindSpots(inferredDomain);
      const newGoals = generateLearningGoals(report);
      if (newGoals.length > 0) {
        log.info("Learning goals auto-generated", { count: newGoals.length });
      }
    } catch {
    }
    try {
      refreshLearningGoals();
    } catch {
    }
    try {
      const identityBlock = formatSelfModelInjection(IDENTITY.INJECTION_TOKEN_BUDGET);
      if (identityBlock) budget.append("identity", identityBlock);
    } catch {
    }
    try {
      const zpdBlock = formatZPDInjection(inferredDomain);
      if (zpdBlock) budget.append("other", zpdBlock);
    } catch {
    }
    if (inferredDomain) {
      try {
        const learningPath = buildLearningPathFromPrereqs(inferredDomain);
        if (learningPath && learningPath.steps.length > 0) {
          const pathText = learningPath.steps.slice(0, 5).map((s, i) => `${i + 1}. ${s.skill}`).join("\n");
          budget.append("learning_path", `[ENGRAM LEARNING PATH] ${learningPath.name}:
${pathText}`);
        }
      } catch {
      }
    }
  }
  const reminderParts = ["Engram tools: Use engram_recall before tasks, engram_encode/learn to store insights, engram_strengthen/weaken for feedback."];
  if (injectionLevel !== "high" && bridgeWritten) {
    reminderParts.push(`Context curated \u2192 ${CURATOR.BRIDGE_FILENAME} (check for warnings, architecture, insights).`);
  }
  budget.append("other", reminderParts.join("\n"));
  budget.flush();
  log.info("Session start processed", { session: sessionId, isPostCompact, injectionLevel, bridgeWritten, outputBytes: budget.bytesUsed });
}
function handleStopWatch() {
  const state = loadWatcherState();
  state.turns_since_engram++;
  state.total_turns++;
  state.injection_level = determineInjectionLevel(
    state.active_domain,
    state.total_turns,
    state.recent_errors,
    false
  );
  if (WATCHER.MILESTONE_TURNS.includes(state.total_turns) && state.milestone_encoded_count < WATCHER.MAX_MILESTONE_ENCODES && state.session_files.length > 0) {
    try {
      const snapshotParts = [];
      if (state.active_task) snapshotParts.push(`Task: ${state.active_task}`);
      if (state.active_domain) snapshotParts.push(`Domain: ${state.active_domain}`);
      if (state.session_files.length > 0) {
        snapshotParts.push(`Files: ${state.session_files.slice(-10).map((f) => basename(f)).join(", ")}`);
      }
      if (state.recent_errors.length > 0) {
        snapshotParts.push(`Recent errors: ${state.recent_errors.length}`);
      }
      snapshotParts.push(`Turn: ${state.total_turns}`);
      const content = `Session milestone (turn ${state.total_turns}): ${snapshotParts.join(". ")}`;
      const domains = state.active_domain ? [state.active_domain] : [];
      createMemory({
        type: "episodic",
        content,
        summary: null,
        encoding_strength: WATCHER.MILESTONE_ENCODING_STRENGTH,
        reinforcement: 1,
        confidence: 0.4,
        domains,
        version: state.active_version,
        tags: ["milestone", "auto_encoded"],
        storage_tier: "short_term",
        pinned: false,
        encoding_context: {
          project: state.active_project,
          project_path: state.active_project_path,
          framework: state.active_domain,
          version: state.active_version,
          task_type: null,
          files: state.session_files.slice(-5),
          error_context: null,
          session_id: state.session_start,
          significance_score: 0.3
        },
        type_data: {
          kind: "episodic",
          context: {
            project: state.active_project ?? "",
            task: state.active_task ?? "",
            framework: state.active_domain ?? "",
            version: state.active_version ?? "",
            files: state.session_files.slice(-10),
            models: []
          },
          outcome: "neutral",
          outcome_detail: `Milestone snapshot at turn ${state.total_turns}`,
          lesson: null,
          lesson_validated: false,
          emotional_weight: 0.2
        }
      });
      state.milestone_encoded_count++;
      log.info("Milestone auto-encode", { turn: state.total_turns });
    } catch (e) {
      log.error("Milestone auto-encode failed", { error: safeErrorStr(e) });
    }
  }
  saveWatcherState(state);
  const turns = state.turns_since_engram;
  const level = state.injection_level;
  const thresholds = ADAPTIVE.WATCHER_THRESHOLDS[level] ?? ADAPTIVE.WATCHER_THRESHOLDS.high;
  const [gentle, strong, urgent] = thresholds;
  const bridgeHint = level !== "high" ? ` Check ${CURATOR.BRIDGE_FILENAME} for curated insights, or use engram_recall for deeper search.` : "";
  const nudgeBudget = new OutputBudget();
  if (turns >= urgent) {
    nudgeBudget.append("other", buildContextualNudge(state, "urgent", bridgeHint));
  } else if (turns >= strong) {
    nudgeBudget.append("other", buildContextualNudge(state, "strong", bridgeHint));
  } else if (turns >= gentle) {
    nudgeBudget.append("other", buildContextualNudge(state, "gentle", bridgeHint));
  }
  nudgeBudget.flush();
}
function buildContextualNudge(state, intensity, bridgeHint) {
  const turns = state.turns_since_engram;
  const parts = [];
  if (intensity === "urgent") {
    parts.push(`[Engram] ${turns} turns without memory tools.`);
  } else if (intensity === "strong") {
    parts.push(`[Engram] ${turns} turns since last memory use.`);
  } else {
    parts.push(`[Engram] Memory tools available.`);
  }
  if (state.recent_errors.length > 0) {
    const errorSnippet = truncate(state.recent_errors[0], 80);
    parts.push(`  Recent error: "${errorSnippet}"`);
    parts.push(`  Suggested: engram_immune_check(action: "debug this error", domain: "${state.active_domain ?? "general"}")`);
  } else if (state.active_task) {
    const taskKeywords = state.active_task.substring(0, 100);
    parts.push(`  Working on: ${taskKeywords}`);
    if (state.active_domain) {
      parts.push(`  Suggested: engram_recall(query: "${taskKeywords}", context: {framework: "${state.active_domain}"})`);
    } else {
      parts.push(`  Suggested: engram_recall(query: "${taskKeywords}")`);
    }
  } else if (state.session_files.length > 5 && intensity !== "gentle") {
    parts.push(`  ${state.session_files.length} files modified this session.`);
    parts.push(`  Suggested: engram_encode(content: "describe what you built", type: "semantic", domains: ["${state.active_domain ?? "general"}"])`);
  } else if (state.active_domain) {
    parts.push(`  Suggested: engram_recall(query: "${state.active_domain} patterns and conventions", context: {framework: "${state.active_domain}"})`);
  } else {
    parts.push(`  Suggested: engram_recall(query: "relevant knowledge for current task")`);
  }
  if (bridgeHint) {
    parts.push(bridgeHint.trim());
  }
  return parts.join("\n");
}
function handleSubagentStop(stdinJson) {
  const agentType = stdinJson?.agent_type ?? "unknown";
  const lastMessage = stdinJson?.last_assistant_message ?? "";
  if (!lastMessage) return;
  const state = loadWatcherState();
  const fileMatches = lastMessage.match(/(?:\/[\w./+-]+\.\w+|[\w./+-]+\.(?:ts|js|py|xml|json|css|scss|md))/g);
  if (fileMatches) {
    for (const f of fileMatches) {
      if (!f.includes("/")) continue;
      if (f.includes("/../") || f.startsWith("../") || /^\/?\d+\.\d+/.test(f)) continue;
      if (f === "/root/.ssh" || f.includes("/etc/cron")) continue;
      if (!state.session_files.includes(f)) {
        state.session_files.push(f);
      }
    }
    if (state.session_files.length > 50) {
      state.session_files = state.session_files.slice(-50);
    }
  }
  const isMetaAnalysis = lastMessage.startsWith("<analysis>") || lastMessage.startsWith("<summary>") || /^#+\s/.test(lastMessage) || lastMessage.startsWith("Based on ") || /^(I now have|Perfect!|I have (sufficient|enough|comprehensive))/i.test(lastMessage) || /^(Here('s| is) (the|my|a) (comprehensive|complete|detailed|full))/i.test(lastMessage) || lastMessage.includes("## ") && lastMessage.length > 500;
  const hasError = !isMetaAnalysis && containsError(lastMessage);
  if (hasError) {
    state.recent_errors.push(truncate(lastMessage, 200));
    if (state.recent_errors.length > 5) {
      state.recent_errors = state.recent_errors.slice(-5);
    }
    try {
      const extracted = extractErrorFingerprint(lastMessage);
      if (extracted) {
        const priorCandidate = findErrorByFingerprint(extracted.fingerprint);
        if (priorCandidate && priorCandidate.occurrences >= 1 && priorCandidate.fix_content) {
          const warning = `Recurring ${extracted.error_type} (seen ${priorCandidate.occurrences + 1}x): ${truncate(extracted.error_message, 100)}. Prior fix: ${truncate(priorCandidate.fix_content, 120)}`;
          state.pending_error_warnings.push(warning);
          if (state.pending_error_warnings.length > 3) {
            state.pending_error_warnings = state.pending_error_warnings.slice(-3);
          }
        }
      }
      recordError(lastMessage, null, null, process.cwd());
    } catch {
    }
  }
  let cognition = null;
  try {
    cognition = extractSubagentCognition(lastMessage);
    state.cognitive_state = updateCognitiveState(
      state.cognitive_state,
      { type: "subagent_result", message: lastMessage },
      state.recent_tool_names,
      state.recent_errors
    );
  } catch {
  }
  saveWatcherState(state);
  let substance = lastMessage;
  for (const pattern of COGNITIVE.SUBAGENT_BOILERPLATE_PATTERNS) {
    substance = substance.replace(pattern, "").trim();
  }
  substance = substance.replace(/^[.:!?\s]+/, "").trim();
  const hasLesson = cognition?.lesson != null;
  const hasDiscovery = cognition?.discovery != null;
  const hasConclusion = cognition?.conclusion != null;
  const hasCognitiveValue = hasLesson || hasDiscovery || hasConclusion;
  if (substance.length < COGNITIVE.SUBAGENT_MIN_SUBSTANCE_LENGTH && !hasCognitiveValue && !hasError) {
    log.info("SubagentStop skipped (boilerplate)", { agent_type: agentType, substance_length: substance.length });
    return;
  }
  const summaryTruncated = truncate(lastMessage, 300);
  const contentParts = [`Subagent (${agentType}) completed`];
  if (cognition?.discovery) contentParts.push(`Discovery: ${cognition.discovery}`);
  if (cognition?.conclusion) contentParts.push(`Conclusion: ${cognition.conclusion}`);
  if (!cognition?.discovery && !cognition?.conclusion) contentParts.push(truncate(substance, 300));
  const enrichedContent = contentParts.join(". ");
  const enrichedTags = [...hasLesson ? ["has_lesson"] : [], ...hasCognitiveValue ? ["has_cognition"] : []];
  if (isRecallNoise(enrichedContent, "episodic", enrichedTags)) {
    log.info("SubagentStop skipped (recall noise)", { agent_type: agentType });
    return;
  }
  const domains = state.active_domain ? [state.active_domain] : [];
  try {
    const existing = findDuplicate(enrichedContent, "episodic", domains);
    if (existing) {
      strengthenExisting(existing);
      log.info("SubagentStop deduplicated", { agent_type: agentType, existing_id: existing.id });
      return;
    }
  } catch {
  }
  const encStrength = hasLesson ? COGNITIVE.ENRICHED_SUBAGENT_ENCODING_STRENGTH : hasCognitiveValue ? 0.45 : 0.3;
  const encConfidence = hasLesson ? COGNITIVE.ENRICHED_SUBAGENT_CONFIDENCE : hasCognitiveValue ? 0.5 : 0.35;
  try {
    createMemory({
      type: "episodic",
      content: enrichedContent,
      summary: null,
      encoding_strength: encStrength,
      reinforcement: 1,
      confidence: encConfidence,
      domains,
      version: state.active_version,
      tags: ["subagent", `subagent_${agentType}`, "auto_encoded", ...hasLesson ? ["has_lesson"] : [], ...hasCognitiveValue ? ["has_cognition"] : []],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: {
        project: state.active_project,
        project_path: state.active_project_path,
        framework: state.active_domain,
        version: state.active_version,
        task_type: null,
        files: fileMatches?.slice(0, 5) ?? [],
        error_context: hasError ? truncate(lastMessage, 100) : null,
        session_id: state.session_start,
        significance_score: hasLesson ? 0.5 : 0.3
      },
      type_data: {
        kind: "episodic",
        context: {
          project: state.active_project ?? "",
          task: state.active_task ?? "",
          framework: state.active_domain ?? "",
          version: state.active_version ?? "",
          files: fileMatches?.slice(0, 10) ?? [],
          models: []
        },
        outcome: hasError ? "negative" : "neutral",
        outcome_detail: `${agentType} subagent: ${summaryTruncated}`,
        lesson: cognition?.lesson ?? null,
        lesson_validated: false,
        emotional_weight: hasError ? 0.5 : hasLesson ? 0.35 : 0.2
      }
    });
    if (state.active_domain && !hasError) {
      try {
        recordDomainOutcome(state.active_domain, "positive");
      } catch {
      }
      try {
        recordDomainMasteryOutcome(state.active_domain, "positive", "subagent_completion");
      } catch {
      }
    }
    log.info("SubagentStop recorded", { agent_type: agentType, has_error: hasError, has_lesson: hasLesson, has_cognition: hasCognitiveValue });
  } catch (e) {
    log.error("SubagentStop encode failed", { error: safeErrorStr(e) });
  }
}
function handleEngramUsed(stdinJson, argFallback) {
  const toolName = stdinJson?.tool_name ?? argFallback ?? "unknown";
  const state = loadWatcherState();
  state.turns_since_engram = 0;
  state.last_engram_tool = toolName;
  state.last_engram_time = (/* @__PURE__ */ new Date()).toISOString();
  const toolInput = stdinJson?.tool_input;
  if (toolInput) {
    const context = toolInput.context;
    if (context?.framework && typeof context.framework === "string") {
      state.active_domain = context.framework;
    }
    if (context?.version && typeof context.version === "string") {
      state.active_version = context.version;
    }
    if (context?.project && typeof context.project === "string") {
      state.active_project = context.project;
    }
    if (context?.task_type && typeof context.task_type === "string") {
      state.active_task = context.task_type;
    }
  }
  if (toolName === "engram_recall") {
    try {
      const query = toolInput?.query;
      if (typeof query === "string" && query.length > 0) {
        state.cognitive_state = updateCognitiveState(
          state.cognitive_state,
          { type: "recall_query", query },
          state.recent_tool_names,
          state.recent_errors
        );
        state.search_queries.push(query.slice(0, COGNITIVE.MAX_FIELD_LENGTH));
        if (state.search_queries.length > COGNITIVE.SEARCH_HISTORY_SIZE) {
          state.search_queries = state.search_queries.slice(-COGNITIVE.SEARCH_HISTORY_SIZE);
        }
      }
    } catch {
    }
    const toolResponse = stdinJson?.tool_response;
    const responseText = typeof toolResponse === "string" ? toolResponse : toolResponse != null ? JSON.stringify(toolResponse) : "";
    if (responseText) {
      const scanText = responseText.length > INPUT.MAX_CONTENT_LENGTH ? responseText.slice(0, INPUT.MAX_CONTENT_LENGTH) : responseText;
      const existingIds = new Set(state.recalled_memory_ids);
      const maxIds = RETRIEVAL_FEEDBACK.MAX_RECALLED_IDS;
      const idMatches = scanText.matchAll(/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi);
      for (const match of idMatches) {
        if (state.recalled_memory_ids.length >= maxIds) break;
        if (!existingIds.has(match[1])) {
          existingIds.add(match[1]);
          state.recalled_memory_ids.push(match[1]);
        }
      }
      if (state.recalled_memory_ids.length > maxIds) {
        state.recalled_memory_ids = state.recalled_memory_ids.slice(-maxIds);
      }
    }
  }
  if (toolName === "engram_learn" && toolInput) {
    const action = typeof toolInput.action === "string" ? toolInput.action : "";
    const outcome = typeof toolInput.outcome === "string" ? toolInput.outcome : "";
    if (action && outcome) {
      const outcomeEntry = `${action} \u2192 ${outcome}`;
      state.session_outcomes.push(outcomeEntry);
      if (state.session_outcomes.length > 5) {
        state.session_outcomes = state.session_outcomes.slice(-5);
      }
    }
  }
  saveWatcherState(state);
}
function buildContinuationBrief(state) {
  const cog = state.cognitive_state;
  const task = state.active_task ?? cog.current_approach ?? (state.session_files.length > 0 ? `Working on ${state.session_files.slice(-3).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ")}` : "unknown task");
  const lastActions = state.recent_actions.slice(-8).map((a) => {
    if (a.tool === "Edit" || a.tool === "Write") {
      const shortPath = a.target.length > 60 ? "..." + a.target.slice(-57) : a.target;
      return `${a.tool}: ${shortPath}`;
    }
    if (a.tool === "Bash") {
      return `Bash: ${truncate(a.target, 100)}`;
    }
    const fileName = a.target.includes("/") ? a.target.split(/[/\\]/).pop() ?? a.target : a.target;
    return `${a.tool}: ${truncate(fileName, 80)}`;
  });
  const nextSteps = [];
  if (cog.recent_discovery && cog.recent_discovery.length > 10) {
    nextSteps.push(`Act on finding: ${truncate(cog.recent_discovery, 120)}`);
  }
  if (cog.search_intent && !nextSteps.some((s) => s.includes(cog.search_intent))) {
    nextSteps.push(`Investigate: ${cog.search_intent}`);
  }
  const lastAction = state.recent_actions[state.recent_actions.length - 1];
  if (lastAction && nextSteps.length === 0) {
    if (lastAction.tool === "Edit" || lastAction.tool === "Write") {
      nextSteps.push(`Continue editing ${lastAction.target.split(/[/\\]/).pop() ?? lastAction.target}, then run tests`);
    } else if (lastAction.tool === "Bash" && lastAction.target.includes("test")) {
      nextSteps.push("Review test results and commit if passing");
    } else if (lastAction.tool === "Bash" && lastAction.target.includes("push")) {
      nextSteps.push("Verify push succeeded, publish if needed");
    }
  }
  if (state.recent_errors.length > 0 && nextSteps.length < 3) {
    nextSteps.push(`Fix: ${truncate(state.recent_errors[state.recent_errors.length - 1], 120)}`);
  }
  if (cog.active_hypothesis && cog.active_hypothesis.length > 5) {
    nextSteps.push(`Testing hypothesis: ${truncate(cog.active_hypothesis, 120)}`);
  }
  const decisions = [];
  for (const id of state.decision_memory_ids.slice(-5)) {
    try {
      const mem = getMemory(id);
      if (mem) {
        const content = mem.content;
        if (/^Delegated:|^Decision:\s*Delegated/i.test(content)) continue;
        decisions.push(truncate(content, 150));
      }
    } catch {
    }
  }
  const triedFailed = (state.session_outcomes ?? []).filter((o) => o.includes("\u2192 fail") || o.includes("\u2192 dead end") || o.includes("\u2192 blocked")).slice(-5).map((o) => truncate(o, 120));
  const editActions = state.recent_actions.filter((a) => a.tool === "Edit" || a.tool === "Write");
  const keyFiles = [...new Set(editActions.map((a) => {
    const arrowIdx = a.target.indexOf(" \u2192");
    return arrowIdx > 0 ? a.target.slice(0, arrowIdx) : a.target;
  }))].slice(-10);
  const recentBash = state.recent_commands?.slice(-5) ?? [];
  if (recentBash.length > 0) {
    const bashSummary = recentBash.map((c) => truncate(c.cmd, 80));
    for (const cmd of bashSummary) {
      if (lastActions.length < 12) {
        lastActions.push(`Ran: ${cmd}`);
      }
    }
  }
  return {
    task: truncate(task, 300),
    phase: cog.session_phase ?? "unknown",
    last_actions: lastActions,
    next_steps: nextSteps.slice(0, 5),
    decisions,
    tried_failed: triedFailed,
    key_files: keyFiles.length > 0 ? keyFiles : state.session_files.slice(-10),
    blockers: state.recent_errors.slice(-3).map((e) => truncate(e, 150)),
    user_requests: state.recent_prompts.slice(-5).map((p) => truncate(p, 200))
  };
}
function handlePreCompact() {
  const state = loadWatcherState();
  if (!state.active_project) {
    const inferred = inferProjectFromCwd();
    if (inferred) state.active_project = inferred;
  }
  if (state.total_turns < WATCHER.PRECOMPACT_MIN_TURNS) return;
  const preCompactChainIds = [...state.active_chain_ids];
  for (const chainId of state.active_chain_ids) {
    try {
      completeReasoningChain(
        chainId,
        "interrupted",
        "Context compaction interrupted this chain",
        0.3,
        config,
        sessionId,
        {
          domain: state.active_domain,
          version: state.active_version,
          project: state.active_project,
          task: state.active_task
        }
      );
    } catch {
    }
  }
  state.active_chain_ids = [];
  const hasEnoughForUnderstanding = state.total_turns >= PRE_COMPACTION.MIN_TURNS_FOR_UNDERSTANDING;
  let understanding = null;
  if (hasEnoughForUnderstanding) {
    try {
      understanding = buildUnderstandingSnapshot({
        session_files: state.session_files,
        decision_memory_ids: state.decision_memory_ids,
        active_chain_ids: preCompactChainIds,
        active_task: state.active_task,
        active_domain: state.active_domain,
        conversation: state.conversation,
        project_path: state.active_project
      });
    } catch {
    }
  }
  let recovery = null;
  try {
    recovery = buildRecoveryContext({
      decision_memory_ids: state.decision_memory_ids,
      active_task: state.active_task,
      active_domain: state.active_domain,
      active_project: state.active_project,
      conversation: state.conversation,
      session_files: state.session_files,
      recent_tool_names: state.recent_tool_names,
      recent_errors: state.recent_errors,
      active_chain_ids: preCompactChainIds,
      cognitive_state: state.cognitive_state
    });
  } catch {
  }
  if (state.active_domain && recovery) {
    try {
      const synthesis = synthesizeDomainKnowledge(state.active_domain);
      if (synthesis) {
        const synthNarrative = composeKnowledgeNarrative(synthesis);
        const oldSyntheses = getSynthesisMemories(state.active_domain);
        for (const old of oldSyntheses) {
          updateMemory(old.id, { superseded_by: "pending" });
        }
        const synthMemory = createMemory({
          content: synthNarrative,
          type: "semantic",
          summary: `Domain synthesis: ${state.active_domain}`,
          encoding_strength: SYNTHESIS.ENCODING_STRENGTH,
          reinforcement: 1,
          confidence: SYNTHESIS.ENCODING_CONFIDENCE,
          domains: [state.active_domain],
          version: state.active_version,
          tags: ["synthesis", "domain-knowledge", "pre-compact"],
          storage_tier: "short_term",
          pinned: false,
          encoding_context: {
            project: state.active_project,
            project_path: state.active_project_path,
            framework: state.active_domain,
            version: state.active_version,
            task_type: null,
            files: [],
            error_context: null,
            session_id: sessionId,
            significance_score: 0.7
          },
          type_data: {
            kind: "semantic",
            knowledge_type: "convention",
            source: "transferred",
            source_episodes: [],
            applicable_versions: null,
            deprecated_in: null
          }
        });
        for (const old of oldSyntheses) {
          updateMemory(old.id, { superseded_by: synthMemory.id });
        }
        recovery.domain_synthesis_id = synthMemory.id;
        recovery.key_patterns = synthesis.key_patterns;
        log.info("Pre-compact synthesis stored", { memory_id: synthMemory.id, domain: state.active_domain, superseded: oldSyntheses.length });
      }
    } catch {
    }
  }
  let narrativeText = "";
  if (understanding && recovery) {
    try {
      narrativeText = composeUnderstandingNarrative(understanding, recovery, state.session_outcomes);
    } catch {
    }
  }
  const summaryParts = [];
  const startTime = new Date(state.session_start);
  const durationMin = Math.round((Date.now() - startTime.getTime()) / 6e4);
  summaryParts.push(`Session: ${durationMin}min, ${state.total_turns} turns`);
  if (state.active_domain) {
    summaryParts.push(`Domain: ${state.active_domain}${state.active_version ? ` v${state.active_version}` : ""}`);
  }
  if (state.active_task) {
    summaryParts.push(`Task: ${state.active_task}`);
  }
  if (state.session_files.length > 0) {
    const fileList = state.session_files.slice(-10).map((f) => f.split(/[/\\]/).pop() ?? f).join(", ");
    summaryParts.push(`Files: ${fileList}`);
  }
  if (state.recent_errors.length > 0) {
    summaryParts.push(`Errors: ${state.recent_errors.length}`);
  }
  const content = narrativeText ? `${narrativeText}
---
${summaryParts.join(". ")}` : `Pre-compaction session summary: ${summaryParts.join(". ")}`;
  const oldUnderstandingIds = [];
  if (hasEnoughForUnderstanding) {
    try {
      const oldUnderstandings = getPreCompactMemories(state.active_domain || void 0);
      for (const old of oldUnderstandings) {
        oldUnderstandingIds.push(old.id);
        updateMemory(old.id, { superseded_by: "pending" });
      }
    } catch {
    }
  }
  try {
    const memory = createMemory({
      content,
      type: "episodic",
      summary: null,
      encoding_strength: hasEnoughForUnderstanding ? PRE_COMPACTION.ENCODING_STRENGTH : 0.5,
      reinforcement: 0,
      confidence: hasEnoughForUnderstanding ? PRE_COMPACTION.ENCODING_CONFIDENCE : 0.5,
      domains: state.active_domain ? [state.active_domain] : [],
      version: state.active_version,
      tags: hasEnoughForUnderstanding ? ["pre-compact", "understanding"] : ["pre-compact", "session-summary"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: {
        project: state.active_project,
        project_path: state.active_project_path,
        framework: state.active_domain,
        version: state.active_version,
        task_type: null,
        files: state.session_files.slice(-10),
        error_context: state.recent_errors.length > 0 ? state.recent_errors.join("\n") : null,
        session_id: sessionId,
        significance_score: hasEnoughForUnderstanding ? 0.7 : 0.4
      },
      type_data: {
        kind: "episodic",
        context: {
          project: state.active_project ?? "",
          task: state.active_task ?? "context_compaction",
          framework: state.active_domain ?? "",
          version: state.active_version ?? "",
          files: state.session_files.slice(-10),
          models: []
        },
        outcome: state.session_outcomes.some((o) => o.includes("\u2192 success")) ? "positive" : "neutral",
        outcome_detail: `Session: ${state.total_turns} turns, ${state.session_files.length} files`,
        lesson: state.active_task ? `Working on: ${state.active_task}. ${state.session_files.length} files modified.` : `Session covered ${state.session_files.length} files over ${state.total_turns} turns`,
        lesson_validated: false,
        emotional_weight: 0.3
      }
    });
    if (oldUnderstandingIds.length > 0) {
      try {
        for (const oldId of oldUnderstandingIds) {
          updateMemory(oldId, { superseded_by: memory.id });
        }
      } catch {
      }
    }
    try {
      const embedding = generateEmbedding(content);
      storeEmbedding(memory.id, embeddingToBuffer(embedding));
    } catch {
    }
    log.info("Pre-compact summary saved", {
      memory_id: memory.id,
      turns: state.total_turns,
      files: state.session_files.length,
      has_understanding: !!understanding
    });
    const enhancedCtx = {
      domain: state.active_domain,
      version: state.active_version,
      active_task: state.active_task,
      recent_errors: state.recent_errors,
      token_budget: 4500,
      understanding,
      recovery
    };
    const payload = buildEnhancedPostCompactionPayload(enhancedCtx, config);
    const payloadText = formatCompactionPayload(payload);
    const compactBudget = new OutputBudget();
    compactBudget.append("stats", `[Engram] Session ${understanding ? "understanding" : "summary"} saved before compaction (${state.total_turns} turns, ${state.session_files.length} files).`);
    if (state.active_task) {
      compactBudget.append("tasks", `[Engram] Active task: ${state.active_task}`);
    }
    if (recovery?.continuation_hint) {
      compactBudget.append("understanding", `[Engram] Continue: ${recovery.continuation_hint}`);
    }
    if (payloadText) {
      compactBudget.append("compaction", payloadText);
    }
    const text = compactBudget.toString();
    if (text) {
      const output = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          additionalContext: text
        }
      });
      process.stdout.write(output + "\n");
    }
    try {
      state.continuation_brief = buildContinuationBrief(state);
    } catch {
    }
    state.recovery_context = recovery;
    state.understanding_snapshot = understanding;
    saveWatcherState(state);
    try {
      refreshBridge(makeBridgeOptions(state));
    } catch {
    }
  } catch (e) {
    log.error("Failed to save pre-compact summary", { error: safeErrorStr(e) });
  }
}
function handlePromptCheck(stdinJson, argFallback) {
  const rawContent = stdinJson?.content ?? stdinJson?.prompt ?? argFallback ?? "";
  if (!rawContent || typeof rawContent !== "string" || rawContent.length < 3) return;
  const content = rawContent.length > INPUT.MAX_CONTENT_LENGTH ? rawContent.slice(0, INPUT.MAX_CONTENT_LENGTH) : rawContent;
  const state = loadWatcherState();
  sanitizeCognitiveState(state);
  const budget = new OutputBudget();
  if (!state.active_project) {
    const inferred = inferProjectFromCwd();
    if (inferred) state.active_project = inferred;
  }
  try {
    if (state.total_turns > 0 && state.total_turns % CONTEXT_PRESSURE.MIN_TURNS_BETWEEN_CHECKS === 0) {
      const transcriptPath = validateTranscriptPath(stdinJson?.transcript_path);
      const remaining = estimateContextRemaining(transcriptPath);
      if (remaining !== null) {
        state.last_context_remaining = remaining;
        log.info("Context pressure check", { remaining_percent: remaining });
        if (state.total_turns >= ACTIVE_CONTEXT.THROTTLE_MIN_TURNS) {
          if (remaining <= ACTIVE_CONTEXT.THROTTLE_ESSENTIAL_THRESHOLD) {
            state.injection_level = "low";
            log.info("Context throttle: essential-only mode", { remaining });
          } else if (remaining <= ACTIVE_CONTEXT.THROTTLE_LOW_THRESHOLD) {
            if (state.injection_level === "high") state.injection_level = "medium";
          } else if (remaining <= ACTIVE_CONTEXT.THROTTLE_MEDIUM_THRESHOLD) {
            if (state.injection_level === "high") state.injection_level = "medium";
          }
        }
        if (remaining <= 50 && state.conversation.decision_points.length > 0) {
          try {
            const unrecordedDecisions = state.conversation.decision_points.filter((d) => !state.decision_memory_ids.some((id) => state.conversation.decision_points.indexOf(d) >= 0));
            for (const dp of unrecordedDecisions.slice(-3)) {
              const decContent = `Decision at ${remaining}% context: ${truncate(dp.description, 200)}. ${dp.rationale ? `Rationale: ${truncate(dp.rationale, 150)}` : ""}`;
              const existing = findDuplicate(decContent, "episodic", state.active_domain ? [state.active_domain] : []);
              if (!existing && canEncodeReasoning(state)) {
                createMemory({
                  type: "episodic",
                  content: decContent,
                  summary: null,
                  encoding_strength: 0.6,
                  reinforcement: 1,
                  confidence: 0.6,
                  domains: state.active_domain ? [state.active_domain] : [],
                  version: state.active_version,
                  tags: ["pressure_offload", "decision", "auto_encoded"],
                  storage_tier: "short_term",
                  pinned: false,
                  encoding_context: {
                    framework: state.active_domain,
                    version: state.active_version,
                    project: state.active_project,
                    project_path: state.active_project_path,
                    task_type: null,
                    files: dp.files.slice(0, 5),
                    error_context: null,
                    session_id: state.session_start,
                    significance_score: 0.5
                  },
                  type_data: {
                    kind: "episodic",
                    context: {
                      project: state.active_project ?? "",
                      task: dp.description,
                      framework: state.active_domain ?? "",
                      version: state.active_version ?? "",
                      files: dp.files.slice(0, 5),
                      models: []
                    },
                    outcome: "neutral",
                    outcome_detail: `Decision point captured during context pressure offload: ${dp.description}`,
                    emotional_weight: 0.3,
                    lesson: dp.rationale ? `Chose "${truncate(dp.chosen_approach, 80)}" because: ${truncate(dp.rationale, 150)}` : null,
                    lesson_validated: false
                  }
                });
                state.reasoning_encoded_count++;
                state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
              }
            }
            log.info("Stage 1 pressure offload: decisions encoded", { remaining_percent: remaining });
          } catch {
          }
        }
        if (remaining <= CONTEXT_PRESSURE.OFFLOAD_THRESHOLD_PERCENT) {
          log.info("Stage 2 pressure offload: full cognitive dump", { remaining_percent: remaining });
          try {
            proactiveOffload();
          } catch {
          }
        }
        if (remaining <= 50 && !state.offload_message_sent) {
          const taskHint = state.active_task ? ` Your task "${truncate(state.active_task, 60)}" is tracked.` : "";
          const approachHint = state.cognitive_state.current_approach ? ` Approach: "${truncate(state.cognitive_state.current_approach, 80)}".` : "";
          budget.append("offload", `[ENGRAM OFFLOAD] Context at ${remaining}%.${taskHint}${approachHint} Your state is encoded in Engram. You can safely focus on the immediate task. Use engram_recall if you need prior context. Bridge file has your full project understanding.`);
          state.offload_message_sent = true;
          try {
            refreshBridge(makeBridgeOptions(state));
          } catch {
          }
        }
        if (remaining <= 40) {
          state.summary_injection_mode = true;
        }
        if (remaining <= 60 && remaining > 25 && state.total_turns > 5) {
          const suggestions = [];
          const cog = state.cognitive_state;
          const unrecordedDecisions = state.conversation.decision_points.length - state.decision_memory_ids.length;
          if (unrecordedDecisions > 0) {
            suggestions.push(`${unrecordedDecisions} unrecorded decision${unrecordedDecisions > 1 ? "s" : ""}`);
          }
          if (cog.current_approach && state.reasoning_encoded_count < 1) {
            suggestions.push(`current approach ("${truncate(cog.current_approach, 50)}")`);
          }
          if (state.recent_errors.length > 2 && state.discovery_encoded_count < 1) {
            suggestions.push("recent error resolutions");
          }
          if (suggestions.length > 0) {
            budget.append("other", `[ENGRAM NUDGE] Context at ${remaining}%. Consider encoding: ${suggestions.join(", ")}. Use engram_encode or engram_learn to persist before context fills.`);
          }
        }
      }
    }
  } catch {
  }
  try {
    const THREAD_INTERVAL = 8;
    if (state.total_turns > 0 && state.total_turns % THREAD_INTERVAL === 0 && canEncodeReasoning(state)) {
      const cog = state.cognitive_state;
      const recentDecisions = state.conversation.decision_points.slice(-3);
      const threadParts = [];
      if (state.active_task) threadParts.push(`Task: ${state.active_task}`);
      if (cog.current_approach) threadParts.push(`Approach: ${cog.current_approach}`);
      if (recentDecisions.length > 0) {
        threadParts.push(`Decisions: ${recentDecisions.map((d) => truncate(d.description, 60)).join("; ")}`);
      }
      if (cog.recent_discovery) threadParts.push(`Discovery: ${truncate(cog.recent_discovery, 100)}`);
      if (state.recent_errors.length > 0) threadParts.push(`Errors: ${state.recent_errors.slice(-2).map((e) => truncate(e, 60)).join("; ")}`);
      threadParts.push(`Files: ${state.session_files.slice(-8).map((f) => basename(f)).join(", ")}`);
      threadParts.push(`Turn ${state.total_turns}`);
      if (threadParts.length >= 3) {
        const threadContent = `Session progress: ${threadParts.join(". ")}`;
        const existing = findDuplicate(threadContent, "episodic", state.active_domain ? [state.active_domain] : []);
        if (!existing) {
          createMemory({
            type: "episodic",
            content: threadContent,
            summary: null,
            encoding_strength: 0.5,
            reinforcement: 1,
            confidence: 0.55,
            domains: state.active_domain ? [state.active_domain] : [],
            version: state.active_version,
            tags: ["conversation_thread", "auto_encoded"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: {
              framework: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              project_path: state.active_project_path,
              task_type: null,
              files: state.session_files.slice(-5),
              error_context: state.recent_errors[0] ?? null,
              session_id: state.session_start,
              significance_score: 0.45
            },
            type_data: {
              kind: "episodic",
              context: {
                project: state.active_project ?? "",
                task: state.active_task ?? "",
                framework: state.active_domain ?? "",
                version: state.active_version ?? "",
                files: state.session_files.slice(-5),
                models: []
              },
              outcome: "neutral",
              outcome_detail: `Turn ${state.total_turns} progress snapshot`,
              emotional_weight: 0.15,
              lesson: distillLesson({
                errors: state.recent_errors.length > 0 ? state.recent_errors : void 0,
                task: state.active_task,
                discovery: cog.recent_discovery
              }),
              lesson_validated: false
            }
          });
          state.reasoning_encoded_count++;
          state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          log.info("Conversation thread encoded", { turn: state.total_turns });
        }
      }
    }
  } catch {
  }
  try {
    const transcriptPath2 = validateTranscriptPath(stdinJson?.transcript_path);
    if (transcriptPath2 && state.total_turns > 0 && state.total_turns - state.last_reasoning_extraction_turn >= TRANSCRIPT_REASONING.EXTRACTION_INTERVAL_TURNS && state.reasoning_extraction_count < TRANSCRIPT_REASONING.MAX_PER_SESSION && canEncodeReasoning(state)) {
      const reasoningSnippets = extractReasoningFromTranscript(transcriptPath2);
      for (const snippet of reasoningSnippets.slice(0, 2)) {
        const reasoningContent = `Reasoning insight: ${snippet}`;
        const existing = findDuplicate(reasoningContent, "episodic", state.active_domain ? [state.active_domain] : []);
        if (!existing) {
          createMemory({
            type: "episodic",
            content: reasoningContent,
            summary: null,
            encoding_strength: 0.55,
            reinforcement: 1,
            confidence: 0.6,
            domains: state.active_domain ? [state.active_domain] : [],
            version: state.active_version,
            tags: ["reasoning_extraction", "auto_encoded"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: {
              framework: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              project_path: state.active_project_path,
              task_type: null,
              files: state.session_files.slice(-5),
              error_context: null,
              session_id: state.session_start,
              significance_score: 0.55
            },
            type_data: {
              kind: "episodic",
              context: {
                project: state.active_project ?? "",
                task: state.active_task ?? "",
                framework: state.active_domain ?? "",
                version: state.active_version ?? "",
                files: state.session_files.slice(-5),
                models: []
              },
              outcome: "neutral",
              outcome_detail: "Extracted from assistant reasoning in transcript",
              emotional_weight: 0.3,
              lesson: snippet.length > 50 ? snippet.slice(0, 200) : null,
              lesson_validated: false
            }
          });
          state.reasoning_encoded_count++;
          state.reasoning_extraction_count++;
          state.last_reasoning_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          log.info("Transcript reasoning extracted and encoded", { length: snippet.length });
        }
      }
      state.last_reasoning_extraction_turn = state.total_turns;
    }
  } catch {
  }
  try {
    if (state.total_turns > 5 && state.total_turns - state.last_distillation_turn >= DISTILLATION.MIN_TURNS_BETWEEN_PROMPTS) {
      const undistilled = findUndistilledMemories(DISTILLATION.MIN_AGE_MINUTES);
      if (undistilled.length > 0) {
        const distillLines = undistilled.map(
          (m) => `  - ID: ${m.id}
    Content: ${m.content.slice(0, DISTILLATION.MAX_CONTENT_PREVIEW)}`
        ).join("\n");
        budget.append(
          "other",
          `[ENGRAM DISTILL] ${undistilled.length} recent memories need lesson refinement. Call engram_strengthen(id, reason) with a distilled lesson for each:
${distillLines}`
        );
        state.last_distillation_turn = state.total_turns;
        log.info("Distillation prompt injected", { count: undistilled.length });
      }
    }
  } catch {
  }
  try {
    const feedback = detectFeedbackSignal(content);
    if (feedback.signal !== "neutral") {
      if (canEncodeFeedback(state)) {
        const memoryId = processFeedbackSignal(feedback, config, sessionId, {
          domain: state.active_domain,
          version: state.active_version,
          project: state.active_project
        });
        if (memoryId || feedback.signal === "approval") {
          state.feedback_encoded_count++;
          state.last_feedback_encode_time = (/* @__PURE__ */ new Date()).toISOString();
          const sig = feedback.signal;
          if (sig in state.feedback_signals) {
            state.feedback_signals[sig]++;
          }
        }
        if (feedback.signal === "instruction") {
          budget.append("other", `[ENGRAM LEARNED] Instruction stored: "${truncate(content, 150)}"`);
        } else if (feedback.signal === "frustration") {
          budget.append("other", `[ENGRAM LEARNED] Antipattern created from feedback. Will avoid this in the future.`);
        }
        try {
          updateFromFeedback(feedback, feedback.signal);
          if (feedback.signal === "instruction") {
            updateFromInstruction(content);
          }
        } catch {
        }
      }
    }
  } catch (e) {
    log.error("Feedback detection failed", { error: safeErrorStr(e) });
  }
  let teachingContext = null;
  try {
    const teachingSignal = detectTeachingSignal(content);
    if (teachingSignal) {
      teachingSignal.domain = state.active_domain;
      teachingContext = assembleTeachingContext(teachingSignal, state.active_domain);
    }
  } catch (e) {
    log.error("Teaching detection failed", { error: safeErrorStr(e) });
  }
  const task = extractTask(content);
  const versionHint = extractVersion(content);
  if (task || versionHint) {
    if (task) state.active_task = task;
    if (versionHint) {
      state.active_version = versionHint.version;
      if (!state.active_domain) state.active_domain = versionHint.domain;
    }
    if (task) {
      try {
        findOrCreateTask(task, process.cwd(), state.active_domain, sessionId);
      } catch {
      }
    }
  }
  if (content.length >= 10 && !content.startsWith("<")) {
    state.recent_prompts.push(truncate(content, 300));
    if (state.recent_prompts.length > 8) {
      state.recent_prompts = state.recent_prompts.slice(-8);
    }
  }
  try {
    if (content.length >= 20 && !content.startsWith("<")) {
      const approach = extractApproachFromPrompt(content);
      if (approach) {
        const currentLen = state.cognitive_state.current_approach?.length ?? 0;
        if (!state.cognitive_state.current_approach || approach.length > currentLen * 1.5) {
          state.cognitive_state = updateCognitiveState(
            state.cognitive_state,
            { type: "agent_prompt", prompt: content },
            state.recent_tool_names,
            state.recent_errors
          );
        }
      }
      if (content.length >= 30 && content.length <= 500 && !content.startsWith("<")) {
        const firstSentence = content.split(/[.!?\n]/)[0]?.trim();
        const isTaskLike = firstSentence && /^(fix|add|create|update|implement|remove|refactor|build|change|move|write|make|set|run|deploy|test|commit|push|install|configure|debug|solve|close|merge|release|enable|disable|start|stop|check|verify|analyze|review|audit|optimize|clean|delete|migrate|upgrade|publish|get|do|finish)/i.test(firstSentence);
        if (isTaskLike && firstSentence.length >= 15 && firstSentence.length <= 200) {
          state.active_task = firstSentence;
        }
      }
    }
  } catch {
  }
  try {
    updateConversationState(state.conversation, content);
  } catch (e) {
    log.error("Conversation tracking failed", { error: safeErrorStr(e) });
  }
  try {
    const MAX_TRACKED_MESSAGES = 200;
    if (state.message_lengths.length < MAX_TRACKED_MESSAGES) {
      state.message_lengths.push(content.length);
      state.message_has_code.push(containsCode(content) ? 1 : 0);
      state.message_jargon_count.push(countJargon(content));
      state.message_is_question.push(isQuestion(content) ? 1 : 0);
    }
  } catch {
  }
  try {
    const prospDomain = versionHint?.domain ?? state.active_domain;
    if (prospDomain && !state.active_domain) {
      state.active_domain = prospDomain;
    }
    const fired = checkProspectiveMemories(content, prospDomain);
    if (fired.length > 0) {
      const reminders = fired.map(
        (m) => `[ENGRAM REMINDER] ${m.memory.content.substring(0, 200)}` + (m.memory.type === "antipattern" ? " (antipattern)" : "")
      );
      budget.append("antipatterns", reminders.join("\n"));
    }
  } catch (e) {
    process.stderr.write(`[engram] prospective check error: ${e}
`);
  }
  if (state.pending_error_warnings.length > 0) {
    const warnings = state.pending_error_warnings.map((w) => `[ENGRAM CAUTION] ${w}`).join("\n");
    budget.append("antipatterns", warnings);
    state.pending_error_warnings = [];
  }
  const surfacedIds = /* @__PURE__ */ new Set();
  try {
    const surfaceDomain = state.active_domain;
    if (surfaceDomain && surfaceDomain.length >= MEMORY_SURFACE.MIN_DOMAIN_LENGTH) {
      const excludeIds = [];
      for (const [id, turn] of Object.entries(state.surface_injection_turns)) {
        if (state.total_turns - turn < MEMORY_SURFACE.MIN_TURNS_BETWEEN_SAME) {
          excludeIds.push(id);
        }
      }
      for (const id of state.proactive_injection_ids) {
        if (!excludeIds.includes(id)) excludeIds.push(id);
      }
      const rawCandidates = getTopDomainMemories(surfaceDomain, MEMORY_SURFACE.CANDIDATE_POOL_SIZE, excludeIds, state.active_project ?? void 0);
      const candidates = rawCandidates.filter(
        (m) => m.confidence >= MEMORY_SURFACE.MIN_SURFACE_CONFIDENCE && m.reinforcement >= MEMORY_SURFACE.MIN_SURFACE_REINFORCEMENT && !isRecallNoise(m.content, m.type, m.tags) && !m.tags.includes("session-narrative")
        // narratives are for model composition, not surfacing
      );
      const surfaced = selectDiverseSurface(candidates, MEMORY_SURFACE.MAX_SURFACE_ITEMS);
      if (surfaced.length > 0) {
        const surfaceLines = [];
        for (const mem of surfaced) {
          if (mem.type === "antipattern") {
            const severity = isAntipatternData(mem.type_data) && mem.type_data.severity ? `[${mem.type_data.severity.toUpperCase()}] ` : "";
            surfaceLines.push(`[ENGRAM SURFACE] ${severity}${truncate(mem.content, 200)}`);
          } else if (isDecisionData(mem.type_data)) {
            const td = mem.type_data;
            surfaceLines.push(`[ENGRAM SURFACE] Decision: ${td.chosen} \u2014 ${td.rationale}`);
          } else {
            surfaceLines.push(`[ENGRAM SURFACE] ${truncate(mem.content, 200)}`);
          }
          state.surface_injection_turns[mem.id] = state.total_turns;
          state.proactive_injection_turns[mem.id] = state.total_turns;
          surfacedIds.add(mem.id);
        }
        budget.append("surface", surfaceLines.join("\n"));
      }
      const gcThreshold = MEMORY_SURFACE.MIN_TURNS_BETWEEN_SAME * 2;
      for (const id of Object.keys(state.surface_injection_turns)) {
        if (state.total_turns - state.surface_injection_turns[id] > gcThreshold) {
          delete state.surface_injection_turns[id];
        }
      }
      const proactiveGcThreshold = PROACTIVE_RECALL.MIN_TURNS_BETWEEN_SAME * 2;
      for (const id of Object.keys(state.proactive_injection_turns)) {
        if (state.total_turns - state.proactive_injection_turns[id] > proactiveGcThreshold) {
          delete state.proactive_injection_turns[id];
        }
      }
      if (state.proactive_injection_ids.length > 50) {
        state.proactive_injection_ids = state.proactive_injection_ids.slice(-50);
      }
    }
  } catch (e) {
    process.stderr.write(`[engram] memory surface error: ${e}
`);
  }
  try {
    const modelDomain = state.active_domain;
    if (modelDomain && modelDomain.length >= MEMORY_SURFACE.MIN_DOMAIN_LENGTH) {
      const model = getMentalModel(modelDomain, state.active_project ?? void 0);
      if (model) {
        const modelText = formatMentalModelInjection(model);
        budget.append("model", modelText);
        const cwd = process.cwd();
        const projectText = composeProjectUnderstanding(cwd, modelDomain, model);
        if (projectText) {
          budget.append("model", `[ENGRAM PROJECT] ${projectText}`);
        }
      }
    }
  } catch (e) {
    process.stderr.write(`[engram] mental model injection error: ${e}
`);
  }
  if (content.length >= CONTEXTUAL_RECALL.MIN_PROMPT_LENGTH) {
    try {
      const level = state.injection_level;
      const result = contextualRecall(content, {
        domain: state.active_domain,
        version: state.active_version,
        project: state.active_project,
        task_type: state.active_task,
        current_files: state.session_files.slice(-10),
        recent_errors: state.recent_errors
      }, config.retrieval);
      const outputLines = [];
      if (result.somatic_signals && result.somatic_signals.length > 0) {
        for (const signal of result.somatic_signals) {
          const emoji = signal.valence === "negative" ? "Warning" : "OK";
          outputLines.push(`[GUT ${emoji}] ${truncate(signal.description, 220)}`);
        }
      }
      const contextOutputIds = /* @__PURE__ */ new Set();
      if (level === "high" || level === "medium") {
        if (result.memories.length > 0) {
          const somaticIds = new Set(
            (result.somatic_signals ?? []).map((s) => s.memory.id)
          );
          for (const m of result.memories) {
            if (somaticIds.has(m.memory.id)) continue;
            if (surfacedIds.has(m.memory.id)) continue;
            if (isRecallNoise(m.memory.content, m.memory.type, m.memory.tags)) continue;
            if (m.memory.tags.includes("pre-compact")) continue;
            if (m.memory.tags.includes("session-narrative")) continue;
            if (m.memory.tags.includes("milestone") || m.memory.content.startsWith("Session milestone")) continue;
            if (state.active_project && m.memory.encoding_context?.project && m.memory.encoding_context.project !== state.active_project && (m.memory.type === "episodic" || m.memory.type === "semantic" && m.memory.domains.length > 0)) continue;
            const isFailure = m.memory.type === "episodic" && isEpisodicData(m.memory.type_data) && m.memory.type_data.outcome === "negative";
            const prefix = m.somatic_marker ? "[ENGRAM GUT]" : isFailure ? "[ENGRAM CAUTION]" : "[ENGRAM CONTEXT]";
            const outcomeHint = m.memory.type === "episodic" && (m.somatic_marker || isFailure) ? getEpisodicOutcomeHint(m.memory) : "";
            if (state.summary_injection_mode && !m.somatic_marker && !isFailure) {
              outputLines.push(`${prefix} ${truncate(m.memory.content, 80)}... \u2192 engram_recall("${truncate(m.memory.content.split(/[.!?\n]/)[0], 40)}")`);
            } else {
              outputLines.push(`${prefix} ${truncate(m.memory.content, 200)}${outcomeHint}`);
            }
            contextOutputIds.add(m.memory.id);
          }
        }
        if (result.intuitions.length > 0) {
          for (const intuition of result.intuitions) {
            const tag = intuition.strength === "strong" ? "[ENGRAM INTUITION]" : "[ENGRAM PATTERN]";
            const hint = intuition.actionable_hint ? ` Known approach: ${truncate(intuition.actionable_hint, 120)}` : "";
            outputLines.push(
              `${tag} ${intuition.description} (confidence: ${intuition.schema.confidence.toFixed(2)}).${hint}`
            );
          }
        } else if (result.schemas.length > 0) {
          for (const s of result.schemas) {
            const instances = s.schema.instances?.length ?? 0;
            const domains = s.schema.domains_seen_in?.length ?? 0;
            outputLines.push(
              `[ENGRAM PATTERN] "${s.schema.name}" (seen ${instances} times across ${domains} domain${domains !== 1 ? "s" : ""}, confidence: ${s.schema.confidence.toFixed(2)})`
            );
          }
        }
        if (result.confidence) {
          const conf = result.confidence;
          if (conf.gap_detected) {
            const domainLabel = state.active_domain ?? "this topic";
            outputLines.push(`[ENGRAM GAP] No prior knowledge of ${domainLabel}. First-time territory \u2014 consider verifying.`);
          } else if (conf.approach_confidence < CONFIDENCE_GATING.LOW_CONFIDENCE_THRESHOLD && conf.memory_count > 0) {
            const domainLabel = state.active_domain ?? "this area";
            outputLines.push(
              `[ENGRAM CONFIDENCE: LOW] Low confidence in ${domainLabel} (${(conf.approach_confidence * 100).toFixed(0)}%). Consider verifying with docs.`
            );
          }
          for (const c of conf.contradictions) {
            if (c.conflict_type === "version_mismatch") {
              outputLines.push(
                `[ENGRAM CONFLICT] Version mismatch: "${truncate(c.memory_a_summary, 80)}" vs "${truncate(c.memory_b_summary, 80)}". Check which version applies.`
              );
            } else {
              outputLines.push(
                `[ENGRAM CONFLICT] Conflicting knowledge: "${truncate(c.memory_a_summary, 80)}" vs "${truncate(c.memory_b_summary, 80)}". Verify which is current.`
              );
            }
          }
        }
      }
      if (level === "high") {
        if (result.insights && result.insights.length > 0) {
          for (const insight of result.insights) {
            outputLines.push(
              `[ENGRAM INSIGHT] A pattern from ${insight.source_domain} might help here: ${truncate(insight.description, 180)}`
            );
          }
        }
        if (result.procedural.length > 0) {
          for (const p of result.procedural) {
            outputLines.push(`[ENGRAM HOW-TO] ${truncate(p.memory.content, 200)}`);
          }
        }
        if (result.scaffolding) {
          const s = result.scaffolding;
          if ((s.level === "novice" || s.level === "advanced_beginner") && state.total_turns < 5) {
            const domainLabel = state.active_domain ?? "this domain";
            const label = s.level === "novice" ? "Novice" : "Beginner";
            outputLines.push(
              `[ENGRAM SCAFFOLD] ${label} in ${domainLabel} \u2014 showing expanded context with step-by-step guidance.`
            );
          }
        }
        if (result.analogies.length > 0) {
          for (const a of result.analogies) {
            outputLines.push(
              `[ENGRAM ANALOGY] From mastered domain "${a.source_domain}": ${truncate(a.memory.content, 200)}`
            );
          }
        }
      }
      if (teachingContext) {
        const hint = formatTeachingHint(teachingContext);
        if (hint) {
          outputLines.push(`[ENGRAM TEACH] ${truncate(hint, TEACHING.MAX_HINT_LENGTH)}`);
          try {
            recordTaughtConcept(
              teachingContext.signal.topic,
              teachingContext.signal.domain ?? "",
              teachingContext.suggested_depth
            );
          } catch {
          }
        }
      }
      if (level === "high" || level === "medium") {
        try {
          const similarDecisions = findSimilarDecisions(content, {
            domain: state.active_domain,
            files: state.session_files.slice(-10)
          });
          for (const sd of similarDecisions) {
            outputLines.push(formatDecisionInjection(sd));
          }
        } catch (e) {
          log.error("Decision surfacing failed", { error: safeErrorStr(e) });
        }
      }
      if ((level === "high" || level === "medium") && state.total_turns - state.last_chain_injection_turn >= 5) {
        try {
          const similarChains = findSimilarChains(content, {
            domain: state.active_domain,
            files: state.session_files.slice(-10)
          });
          if (similarChains.length > 0) {
            for (const sc of similarChains) {
              outputLines.push(formatChainInjection(sc));
            }
            state.last_chain_injection_turn = state.total_turns;
          }
        } catch (e) {
          log.error("Chain surfacing failed", { error: safeErrorStr(e) });
        }
      }
      if (level !== "high" && result.memories.length > 0) {
        try {
          const bridgeInsights = result.memories.slice(0, CURATOR.MAX_BRIDGE_INSIGHTS).map((m) => ({
            text: m.memory.content.substring(0, 200),
            type: m.memory.type,
            confidence: m.memory.confidence
          }));
          refreshBridgeInsights(process.cwd(), bridgeInsights);
        } catch {
        }
      }
      try {
        let proactiveCount = 0;
        for (const m of result.memories) {
          if (proactiveCount >= PROACTIVE_RECALL.MAX_INJECTIONS_PER_CHECK) break;
          const mem = m.memory;
          if (contextOutputIds.has(mem.id)) continue;
          if (isRecallNoise(mem.content, mem.type, mem.tags)) continue;
          if (mem.tags.includes("pre-compact")) continue;
          if (mem.tags.includes("session-narrative")) continue;
          if (mem.tags.includes("milestone") || mem.content.startsWith("Session milestone")) continue;
          if (state.active_project && mem.encoding_context?.project && mem.encoding_context.project !== state.active_project && (mem.type === "episodic" || mem.type === "semantic" && mem.domains.length > 0)) continue;
          const lastTurn = state.proactive_injection_turns[mem.id];
          if (lastTurn !== void 0 && state.total_turns - lastTurn < PROACTIVE_RECALL.MIN_TURNS_BETWEEN_SAME) continue;
          const domainMatch = !state.active_domain || mem.domains.includes(state.active_domain);
          if (mem.reinforcement >= PROACTIVE_RECALL.MIN_REINFORCEMENT && mem.confidence >= PROACTIVE_RECALL.MIN_CONFIDENCE && domainMatch) {
            outputLines.push(`[ENGRAM PROACTIVE] ${truncate(mem.content, 200)}`);
            state.proactive_injection_ids.push(mem.id);
            state.proactive_injection_turns[mem.id] = state.total_turns;
            proactiveCount++;
            continue;
          }
          if (isDecisionData(mem.type_data) && domainMatch && mem.confidence >= PROACTIVE_RECALL.MIN_CONFIDENCE) {
            const td = mem.type_data;
            if (td.chosen.startsWith("Delegated:") || td.chosen.startsWith("Delegated ")) continue;
            outputLines.push(`[ENGRAM DECISION] Previously: ${td.chosen} because ${td.rationale}`);
            state.proactive_injection_ids.push(mem.id);
            state.proactive_injection_turns[mem.id] = state.total_turns;
            proactiveCount++;
          }
        }
      } catch {
      }
      {
        const existingSet = new Set(state.recalled_memory_ids);
        const cap = RETRIEVAL_FEEDBACK.MAX_RECALLED_IDS;
        for (const m of result.memories) {
          if (state.recalled_memory_ids.length >= cap) break;
          if (!existingSet.has(m.memory.id)) {
            existingSet.add(m.memory.id);
            state.recalled_memory_ids.push(m.memory.id);
          }
        }
        if (state.recalled_memory_ids.length > cap) {
          state.recalled_memory_ids = state.recalled_memory_ids.slice(-cap);
        }
      }
      state.recall_queries++;
      const usefulResults = result.memories.filter((m) => !isRecallNoise(m.memory.content, m.memory.type, m.memory.tags));
      if (usefulResults.length === 0) {
        state.recall_misses++;
      }
      let phaseBoost = 0;
      const phase = state.cognitive_state.session_phase;
      const affinity = ACTIVE_CONTEXT.PHASE_MEMORY_AFFINITY[phase];
      if (affinity && (affinity.preferred_tags.length > 0 || affinity.preferred_types.length > 0)) {
        const phaseMatches = result.memories.filter((m) => affinity.preferred_types.includes(m.memory.type) || m.memory.tags.some((t) => affinity.preferred_tags.includes(t)));
        if (phaseMatches.length > 0) {
          phaseBoost = ACTIVE_CONTEXT.PHASE_PRIORITY_BOOST / 10;
        }
      }
      if (outputLines.length > 0) {
        const profile = computeActivationProfile(result.memories);
        const activationBoost = profile.peak_activation >= ACTIVATION_DRIVEN.MIN_PEAK_FOR_BOOST ? Math.min(profile.peak_activation * ACTIVATION_DRIVEN.PEAK_ACTIVATION_MULTIPLIER, ACTIVATION_DRIVEN.MAX_PRIORITY_BOOST) / ACTIVATION_DRIVEN.MAX_PRIORITY_BOOST : 0;
        budget.append("memories", outputLines.join("\n"), Math.max(activationBoost, phaseBoost));
      }
    } catch (e) {
      process.stderr.write(`[engram] contextual recall error, falling back: ${e}
`);
      fallbackLightweightRecall(content, budget);
    }
  }
  try {
    if (state.total_turns > 0 && state.total_turns % ACTIVE_CONTEXT.STATUS_INTERVAL_TURNS === 0) {
      const parts = [];
      if (state.last_context_remaining !== null) {
        const label = state.last_context_remaining <= ACTIVE_CONTEXT.THROTTLE_ESSENTIAL_THRESHOLD ? "CRITICAL" : state.last_context_remaining <= ACTIVE_CONTEXT.THROTTLE_LOW_THRESHOLD ? "LOW" : state.last_context_remaining <= ACTIVE_CONTEXT.THROTTLE_MEDIUM_THRESHOLD ? "MODERATE" : "OK";
        parts.push(`Context: ${state.last_context_remaining}% remaining (${label})`);
      }
      parts.push(`Injection: ${state.injection_level}`);
      if (state.recall_queries >= ACTIVE_CONTEXT.BLIND_SPOT_MIN_QUERIES) {
        const missRate = state.recall_misses / state.recall_queries;
        if (missRate >= ACTIVE_CONTEXT.BLIND_SPOT_MISS_THRESHOLD) {
          parts.push(`Recall: ${(missRate * 100).toFixed(0)}% miss rate \u2014 knowledge gaps detected`);
        }
      }
      parts.push(`Phase: ${state.cognitive_state.session_phase}`);
      budget.append("other", `[Engram] ${parts.join(" | ")}`);
      state.last_status_turn = state.total_turns;
      try {
        refreshBridge(makeBridgeOptions(state));
      } catch {
      }
    }
  } catch {
  }
  saveWatcherState(state);
  budget.flush();
}
function getEpisodicOutcomeHint(memory) {
  try {
    const td = memory.type_data;
    if (td?.kind === "episodic") {
      const outcome = td.outcome;
      const lesson = td.lesson;
      if (outcome === "negative" || outcome === "positive") {
        const hint = lesson ? ` | Lesson: ${truncate(lesson, 80)}` : "";
        return `
Outcome: ${outcome}${hint}`;
      }
    }
  } catch {
  }
  return "";
}
function fallbackLightweightRecall(content, sharedBudget) {
  try {
    const watcherState = loadWatcherState();
    const memories = lightweightRecall(content, watcherState.active_domain, config.retrieval, watcherState.active_version);
    if (memories.length > 0) {
      const lines = memories.map(
        (m) => `[ENGRAM CONTEXT] ${truncate(m.memory.content, 200)}`
      );
      if (sharedBudget) {
        sharedBudget.append("memories", lines.join("\n"));
      } else {
        const fallbackBudget = new OutputBudget();
        fallbackBudget.append("memories", lines.join("\n"));
        fallbackBudget.flush();
      }
    }
  } catch {
  }
}
function hebbianStrengthen(recalledIds) {
  const unique = [...new Set(recalledIds)];
  if (unique.length < 2) return 0;
  const freq = /* @__PURE__ */ new Map();
  for (const id of recalledIds) {
    freq.set(id, (freq.get(id) ?? 0) + 1);
  }
  let pairsProcessed = 0;
  for (let i = 0; i < unique.length && pairsProcessed < HEBBIAN.MAX_PAIRS_PER_SESSION; i++) {
    for (let j = i + 1; j < unique.length && pairsProcessed < HEBBIAN.MAX_PAIRS_PER_SESSION; j++) {
      const idA = unique[i];
      const idB = unique[j];
      const conns = getConnections(idA);
      const existing = conns.find(
        (c) => c.source_id === idA && c.target_id === idB || c.source_id === idB && c.target_id === idA
      );
      if (existing) {
        incrementConnectionActivation(
          existing.source_id,
          existing.target_id,
          HEBBIAN.BASELINE_INCREMENT
        );
        pairsProcessed++;
      } else {
        const freqA = freq.get(idA) ?? 0;
        const freqB = freq.get(idB) ?? 0;
        if (freqA >= HEBBIAN.MIN_CO_RETRIEVALS && freqB >= HEBBIAN.MIN_CO_RETRIEVALS) {
          createConnection({
            source_id: idA,
            target_id: idB,
            strength: HEBBIAN.BASELINE_INCREMENT,
            type: "related"
          });
          pairsProcessed++;
        }
      }
    }
  }
  return pairsProcessed;
}
function handleSessionEnd() {
  try {
    const event = {
      type: "session_end",
      content: "Session ending",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: {}
    };
    processHookEvent(event, config, sessionId);
    const state = loadWatcherState();
    try {
      if (state.recalled_memory_ids.length >= 2) {
        const hebbianCount = hebbianStrengthen(state.recalled_memory_ids);
        if (hebbianCount > 0) {
          log.info("Hebbian strengthening complete", { pairs: hebbianCount });
        }
      }
    } catch (e) {
      log.error("Hebbian strengthening failed", { error: safeErrorStr(e) });
    }
    let narrativeText = null;
    let sessionNarrative = null;
    if (state.total_turns >= SESSION_NARRATIVE.MIN_TURNS_FOR_NARRATIVE) {
      try {
        const fileList = state.session_files.slice(-15).map((f) => f.split(/[/\\]/).pop() ?? f);
        const narrative = composeSessionNarrative({
          total_turns: state.total_turns,
          session_start: state.session_start,
          active_task: state.active_task,
          active_domain: state.active_domain,
          active_project: state.active_project,
          active_version: state.active_version,
          session_files: state.session_files,
          recent_errors: state.recent_errors,
          conversation: state.conversation,
          feedback_signals: state.feedback_signals,
          discovery_encoded_count: state.discovery_encoded_count,
          reasoning_encoded_count: state.reasoning_encoded_count,
          cognitive_state: state.cognitive_state
        });
        const contentText = narrative ? narrative.narrative_text : `Session summary (${state.total_turns} turns). ${state.active_task ?? "No task"}`;
        narrativeText = contentText;
        if (narrative) {
          sessionNarrative = {
            approach: narrative.approach,
            lessons: narrative.lessons,
            unfinished: narrative.unfinished,
            challenges: narrative.challenges
          };
        }
        const outcomeMap = {
          positive: "positive",
          mixed: "neutral",
          negative: "negative",
          neutral: "neutral"
        };
        const outcome = narrative ? outcomeMap[narrative.user_sentiment] ?? "neutral" : "neutral";
        const lesson = narrative && narrative.lessons.length > 0 ? narrative.lessons[0] : null;
        const memory = createMemory({
          content: contentText,
          type: "episodic",
          summary: null,
          encoding_strength: narrative ? SESSION_NARRATIVE.ENCODING_STRENGTH : 0.5,
          reinforcement: 1,
          confidence: narrative ? SESSION_NARRATIVE.ENCODING_CONFIDENCE : 0.5,
          domains: state.active_domain ? [state.active_domain] : [],
          version: state.active_version,
          tags: narrative ? ["session-narrative", "auto-encoded", `sentiment-${narrative.user_sentiment}`] : ["session-summary", "auto-encoded"],
          storage_tier: "short_term",
          pinned: false,
          encoding_context: {
            project: state.active_project,
            project_path: state.active_project_path,
            framework: state.active_domain,
            version: state.active_version,
            task_type: null,
            files: state.session_files.slice(-15),
            error_context: null,
            session_id: sessionId,
            significance_score: narrative ? SESSION_NARRATIVE.ENCODING_STRENGTH : 0.5
          },
          type_data: {
            kind: "episodic",
            context: {
              project: state.active_project ?? "",
              task: state.active_task ?? "session_end",
              framework: state.active_domain ?? "",
              version: state.active_version ?? "",
              files: fileList,
              models: []
            },
            outcome,
            outcome_detail: narrative ? `${narrative.user_sentiment} session: ${narrative.challenges.length} challenges, ${narrative.lessons.length} lessons` : `${state.total_turns} turns, ${state.session_files.length} files`,
            lesson,
            lesson_validated: false,
            emotional_weight: narrative ? narrative.emotional_weight : 0.3
          }
        });
        try {
          const emb = generateEmbedding(contentText);
          storeEmbedding(memory.id, embeddingToBuffer(emb));
        } catch {
        }
        log.info("Session narrative auto-encoded", {
          memory_id: memory.id,
          turns: state.total_turns,
          sentiment: narrative?.user_sentiment ?? "unknown",
          emotional_weight: narrative?.emotional_weight
        });
      } catch (e) {
        log.error("Failed to auto-encode session narrative", { error: safeErrorStr(e) });
      }
    }
    try {
      const sessionUpdate = {
        total_turns: state.total_turns,
        session_files: state.session_files,
        recent_errors: state.recent_errors,
        feedback_encoded_count: state.feedback_encoded_count,
        feedback_signals: state.feedback_signals
      };
      if (state.active_domain) sessionUpdate.active_domain = state.active_domain;
      if (state.active_project) sessionUpdate.active_project = state.active_project;
      if (state.active_task) sessionUpdate.active_task = state.active_task;
      if (state.active_version) sessionUpdate.active_version = state.active_version;
      if (narrativeText) sessionUpdate.narrative_text = narrativeText;
      if (state.message_lengths.length > 0) {
        const msgCount = state.message_lengths.length;
        const avgLen = state.message_lengths.reduce((s, v) => s + v, 0) / msgCount;
        const codeRatio = state.message_has_code.reduce((s, v) => s + v, 0) / msgCount;
        const totalWords = state.message_lengths.reduce((s, v) => s + v, 0) / 5;
        const totalJargon = state.message_jargon_count.reduce((s, v) => s + v, 0);
        const jargonRatio = totalWords > 0 ? totalJargon / totalWords : 0;
        const questionRatio = state.message_is_question.reduce((s, v) => s + v, 0) / msgCount;
        sessionUpdate.message_stats = {
          avg_length: avgLen,
          code_ratio: codeRatio,
          jargon_ratio: Math.min(1, jargonRatio),
          question_ratio: questionRatio
        };
      }
      updateSelfModelFromSession(sessionUpdate);
    } catch (e) {
      log.error("Failed to update self-model", { error: safeErrorStr(e) });
    }
    if (state.active_domain && state.total_turns >= 3) {
      try {
        compileMentalModel(state.active_domain, state.active_project_path ?? null);
        log.info("Mental model recompiled at session-end", { domain: state.active_domain });
      } catch {
      }
    }
    try {
      if (state.decision_memory_ids.length > 0) {
        const hadErrors = state.recent_errors.length > 0;
        const netFeedback = (state.feedback_signals.approval ?? 0) - (state.feedback_signals.correction ?? 0) - (state.feedback_signals.frustration ?? 0);
        const sessionOutcome = netFeedback > 0 && !hadErrors ? "positive" : netFeedback < -1 || state.feedback_signals.frustration > 0 ? "negative" : "neutral";
        const outcomeDetail = `Session: ${state.total_turns} turns, ${state.recent_errors.length} errors, feedback: +${state.feedback_signals.approval}/-${state.feedback_signals.correction}`;
        for (const memoryId of state.decision_memory_ids) {
          updateDecisionOutcome(memoryId, sessionOutcome, outcomeDetail);
        }
        log.info("Decision outcomes updated", {
          count: state.decision_memory_ids.length,
          outcome: sessionOutcome
        });
      }
    } catch (e) {
      log.error("Failed to update decision outcomes", { error: safeErrorStr(e) });
    }
    try {
      if (state.active_chain_ids.length > 0) {
        for (const chainId of state.active_chain_ids) {
          completeReasoningChain(chainId, "interrupted", "Session ended before chain completion", 0.3, config, sessionId, {
            domain: state.active_domain,
            version: state.active_version,
            project: state.active_project,
            task: state.active_task
          });
        }
        log.info("Interrupted active reasoning chains on session end", { count: state.active_chain_ids.length });
      }
      timeoutStaleChains();
    } catch (e) {
      log.error("Failed to clean up reasoning chains", { error: safeErrorStr(e) });
    }
    if (state.active_domain) {
      try {
        inferPrerequisites(state.active_domain);
      } catch {
      }
    }
    if (state.active_task) {
      try {
        const tasks = getActiveTasks(process.cwd());
        for (const task of tasks) {
          if (task.status === "active" && task.description.includes(state.active_task)) {
            completeTask(task.id);
            break;
          }
        }
      } catch {
      }
    }
    try {
      const recalledCount = state.recalled_memory_ids.length;
      const usedCount = state.used_memory_ids.length;
      if (recalledCount > 0) {
        for (const id of state.used_memory_ids) {
          try {
            const mem = getMemory(id);
            if (mem) {
              const newConf = Math.min(1, mem.confidence + 0.02);
              updateMemory(id, { confidence: newConf });
            }
          } catch {
          }
        }
        recordRetrievalUtility(recalledCount, usedCount);
        log.info("Retrieval feedback processed", {
          recalled: recalledCount,
          used: usedCount,
          rate: (usedCount / recalledCount).toFixed(2)
        });
      }
    } catch (e) {
      log.error("Retrieval feedback failed", { error: safeErrorStr(e) });
    }
    try {
      const cog = state.cognitive_state;
      const hasUnrecordedCognition = cog.current_approach && cog.current_approach.length > 15 || cog.active_hypothesis && cog.active_hypothesis.length > 15 || cog.recent_discovery && cog.recent_discovery.length > 15;
      if (hasUnrecordedCognition && state.reasoning_encoded_count < 30) {
        const cogParts = [];
        if (cog.current_approach) cogParts.push(`Approach: ${truncate(cog.current_approach, 150)}`);
        if (cog.active_hypothesis) cogParts.push(`Hypothesis: ${truncate(cog.active_hypothesis, 150)}`);
        if (cog.recent_discovery) cogParts.push(`Discovery: ${truncate(cog.recent_discovery, 150)}`);
        if (cog.search_intent) cogParts.push(`Investigating: ${truncate(cog.search_intent, 100)}`);
        const cogContent = `Session-end cognitive state (${cog.session_phase}): ${cogParts.join(". ")}`;
        const existing = findDuplicate(cogContent, "episodic", state.active_domain ? [state.active_domain] : []);
        if (!existing) {
          createMemory({
            type: "episodic",
            content: cogContent,
            summary: null,
            encoding_strength: 0.5,
            reinforcement: 1,
            confidence: 0.55,
            domains: state.active_domain ? [state.active_domain] : [],
            version: state.active_version,
            tags: ["cognitive_flush", "auto_encoded"],
            storage_tier: "short_term",
            pinned: false,
            encoding_context: {
              framework: state.active_domain,
              version: state.active_version,
              project: state.active_project,
              project_path: state.active_project_path,
              task_type: null,
              files: state.session_files.slice(-5),
              error_context: null,
              session_id: state.session_start,
              significance_score: 0.5
            },
            type_data: {
              kind: "episodic",
              context: {
                project: state.active_project ?? "",
                task: state.active_task ?? "",
                framework: state.active_domain ?? "",
                version: state.active_version ?? "",
                files: state.session_files.slice(-5),
                models: []
              },
              outcome: "neutral",
              outcome_detail: `Final cognitive state at session end (${cog.session_phase} phase)`,
              emotional_weight: 0.2,
              lesson: distillLesson({
                errors: state.recent_errors.length > 0 ? state.recent_errors : void 0,
                discovery: cog.recent_discovery
              }),
              lesson_validated: false
            }
          });
          log.info("Session-end cognitive flush encoded");
        }
      }
    } catch {
    }
    try {
      writeSessionHandoff(state, sessionNarrative);
    } catch (e) {
      log.error("Session handoff write failed", { error: safeErrorStr(e) });
    }
    state.active_chain_ids = [];
    saveWatcherState(state);
    deleteSessionState();
    log.info("Session end processed", { session: sessionId });
  } catch (e) {
    log.error("handleSessionEnd failed", { error: safeErrorStr(e) });
  }
}
function handlePreBash(stdinJson) {
  try {
    const toolInput = stdinJson?.tool_input;
    const command2 = toolInput?.command ?? "";
    if (!command2 || typeof command2 !== "string" || command2.length < 3) return;
    const state = loadWatcherState();
    const immuneResult = checkAntipattern(command2, state.active_domain, state.active_version, config.immune);
    const warnMatches = immuneResult.matches.filter(
      (m) => m.confidence >= PREWRITE_BLOCKING.MIN_MATCH_CONFIDENCE
    );
    if (warnMatches.length === 0) return;
    const contextLines = warnMatches.map(
      (m) => `[ENGRAM WARNING] Bash antipattern: ${m.trigger} (${m.severity}). ${m.fix ?? "Review this command."}`
    );
    const bashBudget = new OutputBudget();
    bashBudget.append("context", contextLines.join("\n"));
    const additionalContext = bashBudget.toString();
    const output = {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        additionalContext
      }
    };
    process.stdout.write(JSON.stringify(output) + "\n");
  } catch (e) {
    log.error("handlePreBash failed", { error: safeErrorStr(e) });
  }
}
function handlePostCompact(stdinJson) {
  try {
    const state = loadWatcherState();
    const recovery = state.recovery_context;
    if (!recovery) return;
    const budget = new OutputBudget(OUTPUT_BUDGET.POST_COMPACT_MAX_BYTES);
    const lines = [];
    sanitizeCognitiveState(state);
    const brief = buildContinuationBrief(state);
    const briefUsable = brief.task !== "unknown task" || brief.last_actions.length > 0;
    if (briefUsable) {
      const mindLines = ["[Engram] Continue from where you left off:"];
      if (brief.task !== "unknown task") {
        mindLines.push(`  Task: ${brief.task}`);
      }
      mindLines.push(`  Phase: ${brief.phase}`);
      if (brief.last_actions.length > 0) {
        mindLines.push(`  Last actions:`);
        for (const a of brief.last_actions.slice(-5)) mindLines.push(`    - ${a}`);
      }
      if (brief.next_steps.length > 0) {
        mindLines.push(`  Next steps:`);
        for (const s of brief.next_steps) mindLines.push(`    - ${s}`);
      }
      if (brief.decisions.length > 0) {
        mindLines.push(`  Decisions made:`);
        for (const d of brief.decisions) mindLines.push(`    - ${d}`);
      }
      if (brief.tried_failed.length > 0) {
        mindLines.push(`  Already tried (didn't work):`);
        for (const t of brief.tried_failed) mindLines.push(`    - ${t}`);
      }
      if (brief.blockers.length > 0) {
        mindLines.push(`  Blockers: ${brief.blockers.join("; ")}`);
      }
      if (brief.key_files.length > 0) {
        const files = brief.key_files.map((f) => f.split(/[/\\]/).pop() ?? f);
        mindLines.push(`  Files: ${files.join(", ")}`);
      }
      if (brief.user_requests && brief.user_requests.length > 0) {
        mindLines.push(`  User asked:`);
        for (const req of brief.user_requests.slice(-3)) mindLines.push(`    - ${req}`);
      }
      lines.push(mindLines.join("\n"));
    } else {
      const cog = state.cognitive_state;
      const cogCtx = recovery.working_state?.cognitive_context;
      const hasAnyCognitive = cog?.current_approach || cog?.active_hypothesis || cog?.recent_discovery || cogCtx?.planned_next_step || recovery.continuation_hint;
      if (hasAnyCognitive) {
        const mindLines = ["[Engram] Before compaction, you were:"];
        if (state.active_task) mindLines.push(`  Task: ${truncate(state.active_task, 200)}`);
        if (cog?.session_phase) mindLines.push(`  Phase: ${cog.session_phase}`);
        if (cog?.current_approach) mindLines.push(`  Approach: ${truncate(cog.current_approach, 300)}`);
        if (cog?.active_hypothesis) mindLines.push(`  Hypothesis: ${truncate(cog.active_hypothesis, 300)}`);
        if (cog?.recent_discovery) mindLines.push(`  Discovery: ${truncate(cog.recent_discovery, 300)}`);
        if (cogCtx?.planned_next_step) mindLines.push(`  Next step: ${truncate(cogCtx.planned_next_step, 200)}`);
        if (recovery.continuation_hint) mindLines.push(`  Continue: ${truncate(recovery.continuation_hint, 300)}`);
        if (state.session_files.length > 0) {
          const files = state.session_files.slice(-8).map((f) => f.split(/[/\\]/).pop() ?? f);
          mindLines.push(`  Files: ${files.join(", ")}`);
        }
        lines.push(mindLines.join("\n"));
      }
    }
    try {
      const transcriptPath = validateTranscriptPath(stdinJson?.transcript_path);
      if (transcriptPath) {
        const reasoningSnippets = extractReasoningFromTranscript(transcriptPath, TRANSCRIPT_REASONING.POST_COMPACT_MAX_MESSAGES);
        if (reasoningSnippets.length > 0) {
          lines.push("[Engram] Pre-compaction reasoning (from your own analysis):");
          for (const snippet of reasoningSnippets.slice(0, 5)) {
            lines.push(`  - ${truncate(snippet, 250)}`);
          }
        }
      }
    } catch {
    }
    try {
      const threadMemories = getRecentMemories(20).filter((m) => m.tags.includes("conversation_thread"));
      if (threadMemories.length > 0) {
        const latest = threadMemories[0];
        lines.push(`[Engram] Last reasoning checkpoint: ${truncate(latest.content, 400)}`);
      }
    } catch {
    }
    try {
      const sessionMemories = getSessionMemories(state.session_start, 10).filter((m) => !m.tags.includes("conversation_thread"));
      if (sessionMemories.length > 0) {
        const valuable = sessionMemories.filter((m) => {
          const hasLesson = isEpisodicData(m.type_data) && m.type_data.lesson && m.type_data.lesson.length > 10;
          const hasRichTag = m.tags.some((t) => ["approach_pivot", "error_narrative", "reasoning_extraction", "cognitive_flush", "edit_rationale"].includes(t));
          return hasLesson || hasRichTag;
        }).slice(0, 4);
        if (valuable.length > 0) {
          lines.push("[Engram] Session insights (your earlier work this session):");
          for (const m of valuable) {
            const lesson = isEpisodicData(m.type_data) && m.type_data.lesson ? ` \u2192 ${truncate(m.type_data.lesson, 150)}` : "";
            lines.push(`  - ${truncate(m.content, 200)}${lesson}`);
          }
        }
      }
    } catch {
    }
    const cogCtx2 = recovery.working_state?.cognitive_context;
    const queryParts = [];
    if (brief?.task && brief.task !== "unknown task") {
      queryParts.push(brief.task.split(/[.;!\n]/)[0] ?? "");
    } else if (state.active_task) {
      queryParts.push(state.active_task.split(/[.;!\n]/)[0] ?? "");
    }
    if (cogCtx2?.current_approach && !queryParts.some((q) => q.includes(cogCtx2.current_approach.slice(0, 20)))) {
      queryParts.push(cogCtx2.current_approach);
    }
    if (brief?.key_files && brief.key_files.length > 0) {
      const fileNames = brief.key_files.slice(-3).map((f) => f.split(/[/\\]/).pop() ?? f).filter((f) => f.length > 2);
      if (fileNames.length > 0) {
        queryParts.push(fileNames.join(" "));
      }
    }
    if (queryParts.length < 1) {
      queryParts.push(...recovery.high_value_topics.slice(0, 6));
    }
    const query = queryParts.join(" ");
    if (query.length > 3) {
      try {
        const result = contextualRecall(query, {
          domain: state.active_domain,
          version: state.active_version,
          project: state.active_project,
          task_type: null,
          current_files: state.session_files.slice(-10),
          recent_errors: []
        }, config.retrieval);
        const useful = result.memories.filter((m) => !isRecallNoise(m.memory.content, m.memory.type, m.memory.tags));
        if (useful.length > 0) {
          lines.push("[Engram] Related knowledge:");
          for (const m of useful.slice(0, 5)) {
            const prefix = m.memory.type === "antipattern" ? "[WARN] " : "";
            lines.push(`  ${prefix}${truncate(m.memory.content, 350)}`);
          }
        }
      } catch {
        const memories = lightweightRecall(query, state.active_domain, config.retrieval, state.active_version);
        const useful = memories.filter((m) => !isRecallNoise(m.memory.content, m.memory.type, m.memory.tags));
        if (useful.length > 0) {
          lines.push("[Engram] Related knowledge:");
          for (const m of useful.slice(0, 5)) {
            lines.push(`  ${truncate(m.memory.content, 350)}`);
          }
        }
      }
    }
    if (recovery.reasoning_trail && recovery.reasoning_trail.length > 0) {
      lines.push("[Engram] Reasoning trail (your investigation steps):");
      for (const step of recovery.reasoning_trail.slice(0, 5)) {
        lines.push(`  - ${truncate(step, 200)}`);
      }
    }
    if (recovery.must_recall_ids.length > 0) {
      const recallLines = [];
      for (const id of recovery.must_recall_ids.slice(0, 5)) {
        try {
          const mem = getMemory(id);
          if (mem) {
            recallLines.push(`  ${truncate(mem.content, 350)}`);
          }
        } catch {
        }
      }
      if (recallLines.length > 0) {
        lines.push(`[Engram] Key decisions to preserve:
${recallLines.join("\n")}`);
      }
    }
    if (lines.length > 0) {
      budget.append("compaction", lines.join("\n"));
      budget.flush();
    }
    state.recovery_context = null;
    state.understanding_snapshot = null;
    saveWatcherState(state);
  } catch (e) {
    log.error("Post-compact handler failed", { error: safeErrorStr(e) });
  }
}
function extractTask(prompt) {
  if (!prompt || prompt.length < 10) return null;
  const imperative = prompt.match(
    /^(fix|implement|add|create|build|debug|refactor|update|remove|delete|migrate|test|deploy|configure|setup|install|write|modify|change|optimize|improve|resolve|upgrade|integrate|extend|review|check|verify|ensure)\s+(.{5,80})/i
  );
  if (imperative) return imperative[0].substring(0, 100);
  const request = prompt.match(
    /(?:(?:i need|i want|can you|could you|please|help me|let'?s)\s+(?:to\s+)?)((?:fix|implement|add|create|build|debug|refactor|update|remove|delete|migrate|test|deploy|configure|write|modify|change|optimize|improve|resolve|upgrade|integrate|extend)[^.;,\n]{5,80})/i
  );
  if (request) return request[1].substring(0, 100);
  const howTo = prompt.match(
    /how\s+(?:do\s+i|to|can\s+i|should\s+i)\s+(.{5,80})/i
  );
  if (howTo) return howTo[1].substring(0, 100);
  return null;
}
function extractVersion(prompt) {
  if (!prompt || prompt.length < 5) return null;
  const odoo = prompt.match(/\bodoo[\s\-_]*v?(\d{2})\b/i);
  if (odoo) return { domain: "odoo", version: odoo[1] };
  const react = prompt.match(/\breact[\s\-_]*v?(\d{2})\b/i);
  if (react) return { domain: "react", version: react[1] };
  const node = prompt.match(/\bnode(?:\.?js)?[\s\-_]*v?(\d{2})\b/i);
  if (node) return { domain: "node", version: node[1] };
  const python = prompt.match(/\bpython[\s\-_]*v?(\d+\.\d+)\b/i);
  if (python) return { domain: "python", version: python[1] };
  const django = prompt.match(/\bdjango[\s\-_]*v?(\d+(?:\.\d+)?)\b/i);
  if (django) return { domain: "django", version: django[1] };
  const frontend = prompt.match(/\b(angular|vue)[\s\-_]*v?(\d+)\b/i);
  if (frontend) return { domain: frontend[1].toLowerCase(), version: frontend[2] };
  return null;
}
function containsCode(content) {
  if (/```[\s\S]*```/.test(content)) return true;
  if (/^(?:\t| {4,}).*[{};=()]/m.test(content)) return true;
  if (/`[^`]+`/.test(content) && /\b(function|class|import|const|let|var|def|return)\b/.test(content)) return true;
  return false;
}
function countJargon(content) {
  const jargonPattern = /\b(api|orm|crud|sql|dom|css|html|regex|async|await|callback|promise|middleware|endpoint|schema|migration|refactor|deploy|webpack|docker|kubernetes|nginx|redis|postgres|mongodb|typescript|javascript|python|odoo|django|react|vue|angular|node|npm|git|ci|cd|ssh|ssl|tls|json|xml|yaml|csv|http|https|tcp|udp|dns|ip|url|uri|sdk|cli|gui|ide|mvp|prd|uml|agile|scrum|kanban|devops|aws|gcp|azure|graphql|rest|soap|grpc|jwt|oauth|cors|csrf|xss|sqli|idor|rbac|acl)\b/gi;
  const matches = content.match(jargonPattern);
  return matches ? matches.length : 0;
}
function isQuestion(content) {
  if (content.trim().endsWith("?")) return true;
  if (/^(how|what|why|where|when|which|who|can|could|would|should|is|are|do|does|did|will|have|has)\b/i.test(content.trim())) return true;
  return false;
}
function inferVersionFromProject() {
  try {
    const cwd = process.cwd();
    const manifestPath = join(cwd, "__manifest__.py");
    if (existsSync(manifestPath)) {
      const content = readFileSync(manifestPath, "utf-8");
      const match = content.match(/['"]version['"]:\s*['"](\d+)\.\d+/);
      if (match) return { domain: "odoo", version: match[1] };
    }
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath) && statSync(pkgPath).size < 1e6) {
      const content = readFileSync(pkgPath, "utf-8");
      const reactMatch = content.match(/"react":\s*"[^"]*?(\d+)\./);
      if (reactMatch) return { domain: "react", version: reactMatch[1] };
      const nodeMatch = content.match(/"node":\s*"[>=^~]*(\d+)/);
      if (nodeMatch) return { domain: "node", version: nodeMatch[1] };
    }
    const pyprojectPath = join(cwd, "pyproject.toml");
    if (existsSync(pyprojectPath)) {
      const content = readFileSync(pyprojectPath, "utf-8");
      const match = content.match(/python_requires\s*=\s*['"][>=]*(\d+\.\d+)/);
      if (match) return { domain: "python", version: match[1] };
    }
  } catch {
  }
  return null;
}
function inferProjectFromCwd() {
  try {
    const cwd = process.cwd();
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath) && statSync(pkgPath).size < 1e6) {
      const content = readFileSync(pkgPath, "utf-8");
      const parsed = JSON.parse(content);
      if (typeof parsed.name === "string" && parsed.name.length > 0) {
        return parsed.name.slice(0, 200);
      }
    }
    const pyprojectPath = join(cwd, "pyproject.toml");
    if (existsSync(pyprojectPath) && statSync(pyprojectPath).size < 1e6) {
      const content = readFileSync(pyprojectPath, "utf-8");
      const match = content.match(/^name\s*=\s*["']([^"']+)["']/m);
      if (match) return match[1];
    }
    if (existsSync(join(cwd, "__manifest__.py"))) {
      return basename(cwd);
    }
    const dirName = basename(cwd);
    if (dirName.length > 1 && dirName !== "/" && dirName !== "home" && dirName !== "root") {
      return dirName;
    }
  } catch {
  }
  return null;
}
function inferModuleFromCwd(cwd) {
  try {
    if (existsSync(join(cwd, "__manifest__.py"))) {
      return basename(cwd);
    }
    return null;
  } catch {
    return null;
  }
}
function safeParse(json) {
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
function truncate(s, max) {
  return Buffer.byteLength(s, "utf-8") > max ? truncateToBytes(s, max - 3) + "..." : s;
}
function extractFilePath(command2) {
  if (!command2) return null;
  const match = command2.match(/\b(?:python3?|node|cat|head|tail|less|vi|vim|nano|code)\s+(?:["'])?([^\s"'|>&;]+\.\w{1,5})/);
  if (match) return match[1];
  const cdMatch = command2.match(/\bcd\s+(?:["'])?([^\s"'|>&;]+)/);
  if (cdMatch) return cdMatch[1];
  return null;
}
function containsError(output) {
  const lower = output.toLowerCase();
  return lower.includes("error") || lower.includes("exception") || lower.includes("traceback") || lower.includes("failed") || lower.includes("fatal") || lower.includes("panic");
}
export {
  OutputBudget,
  isRecallNoise
};
//# sourceMappingURL=hook.js.map