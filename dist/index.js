#!/usr/bin/env node
import {
  ARCHITECTURE,
  COGNITIVE,
  CONNECTION_DECAY,
  CONSOLIDATION,
  CREATIVE,
  CREATIVE_INSIGHT,
  DEDUP,
  EMBEDDING,
  EMOTIONAL,
  HOUSEKEEPING,
  IDENTITY,
  INPUT,
  LEARNING_GOALS,
  PROJECT,
  SCHEMA_LIFECYCLE,
  SYNTHESIS,
  TRANSFER,
  addToWorkingMemory,
  adjustConfidence,
  archiveMemory,
  attachTemporary,
  autoCreateFromAntipattern,
  autoCreateFromLesson,
  batchGetConnectionCounts,
  batchGetConnections,
  batchGetEmbeddings,
  bufferToEmbedding,
  bulkDeleteConnections,
  bulkUpdateConnectionStrengths,
  checkAntipattern,
  closeDatabase,
  compileMentalModel,
  composeKnowledgeNarrative,
  cosineSimilarity,
  createAntipatternFromExperience,
  createConnection,
  createLearningGoal,
  createLogger,
  createMemory,
  createPattern,
  createReminder,
  createSchema,
  daysElapsed,
  deleteFlaggedMemories,
  deleteMemory,
  deriveProjectDbPath,
  detachTemporary,
  discoverMemoryDir,
  embeddingToBuffer,
  ensureEngramDir,
  evaluateAllMastery,
  evaluateConnectionDecay,
  evaluateDecayCandidates,
  evaluateSystemHealth,
  evictColdStorage,
  extractKeywords,
  findDuplicate,
  findResolutionForError,
  generateEmbedding,
  generateId,
  getActiveLearningGoals,
  getActiveProspectiveMemories,
  getAllLearningGoals,
  getAllProspectiveMemories,
  getAllSchemas,
  getAntipatterns,
  getAutonomicState,
  getConnectionCount,
  getConnections,
  getConsolidationCandidates,
  getDatabase,
  getDatabaseSizeBytes,
  getDecayScanCandidates,
  getEnvLogLevel,
  getHousekeepingStats,
  getLearningGoalByDomainTopic,
  getMasteryForDomain,
  getMemoriesByDomain,
  getMemory,
  getMentalModel,
  getMigrationKnowledge,
  getOrphanConnectionCount,
  getPatternsByDomain,
  getPatternsByMemory,
  getPrimedNodeCount,
  getProfilesDueForReview,
  getProjectDatabaseInfo,
  getProjectDbPath,
  getReviewSchedule,
  getSelfModel,
  getSpeculativeConnections,
  getStaleConnections,
  getStaleMemoryCount,
  getStats,
  getSynthesisMemories,
  getUnembeddedMemories,
  getVersion,
  getVersionKnowledge,
  getWorkingMemorySize,
  globalDownscale,
  graduateErrorCandidates,
  handleFalsePositive,
  incrementConnectionActivation,
  inferProjectPath,
  initDatabase,
  initProjectDatabase,
  isAntipatternData,
  isEpisodicData,
  isObservationEnabled,
  isProceduralData,
  isProjectDbAttached,
  isRecallNoise,
  isSemanticData,
  keywordSimilarity,
  listProjectDatabases,
  loadConfig,
  log,
  logConsolidation,
  now,
  optimizeFts,
  preWarmActivation,
  pruneArchitectureGraph,
  pruneConsolidationLog,
  pruneMetrics,
  pruneStaleVocabulary,
  recall,
  recomputeIdf,
  reconsolidate,
  recordCalibration,
  recordDomainOutcome,
  recordImmuneOutcome,
  recordObservation,
  recordPractice,
  recordProgressionOutcome,
  recordRecallOutcome,
  refreshIdfCache,
  registerVersion,
  retrievalReinforcement,
  setLogLevel,
  spacedRepetitionBoost,
  storeEmbedding,
  strengthenAntipattern,
  strengthenExisting,
  synthesizeDomainKnowledge,
  updateFromInstruction,
  updateMemory,
  updateMemoryMdMentalModels,
  updateOngoingContext,
  updateSchema,
  updateSelfModelField,
  vaccinate,
  vacuumDatabase,
  validateMultiPerspective
} from "./chunk-IBN6XTSK.js";

// src/index.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// src/engines/consolidation.ts
import Database from "better-sqlite3";
import { statSync, rmSync } from "fs";

// src/engines/transfer.ts
function extractPattern(memory, level) {
  const keywords = extractKeywords(memory.content);
  const domains = memory.domains;
  let relations = buildConcreteRelations(keywords);
  if (level >= 1) {
    relations = abstractDomainTerms(relations, domains);
  }
  if (level >= 2) {
    relations = stripToPositionalLabels(relations);
  }
  if (level >= 3) {
    relations = relations.filter((r) => r.order >= 2);
  }
  return {
    id: generateId(),
    memory_id: memory.id,
    relations,
    abstraction_level: level,
    confidence: memory.confidence
  };
}
function buildConcreteRelations(keywords) {
  const relations = [];
  const unique = [...new Set(keywords)];
  for (let i = 0; i < unique.length - 1; i++) {
    relations.push({
      type: "uses",
      args: [unique[i], unique[i + 1]],
      order: 1
    });
  }
  for (let i = 0; i < unique.length - 2; i += 2) {
    relations.push({
      type: "composes",
      args: [unique[i], unique[i + 1], unique[i + 2]],
      order: 2
    });
  }
  return relations;
}
function abstractDomainTerms(relations, domains) {
  const domainSet = new Set(domains.map((d) => d.toLowerCase()));
  const replacements = /* @__PURE__ */ new Map();
  let counter = 0;
  function getPlaceholder(term) {
    const lower = term.toLowerCase();
    if (domainSet.has(lower)) {
      if (!replacements.has(lower)) {
        replacements.set(lower, `framework_${String.fromCharCode(65 + counter++)}`);
      }
      return replacements.get(lower);
    }
    return term;
  }
  return relations.map((r) => ({
    type: r.type,
    args: r.args.map(getPlaceholder),
    order: r.order
  }));
}
function stripToPositionalLabels(relations) {
  const entityMap = /* @__PURE__ */ new Map();
  let entityCounter = 0;
  function getPositionalLabel(arg) {
    if (!entityMap.has(arg)) {
      entityMap.set(arg, `entity_${entityCounter++}`);
    }
    return entityMap.get(arg);
  }
  return relations.map((r) => ({
    type: r.type,
    args: r.args.map(getPositionalLabel),
    order: r.order
  }));
}
function alignPatterns(source, target) {
  const mappings = [];
  const entityMap = /* @__PURE__ */ new Map();
  const reverseEntityMap = /* @__PURE__ */ new Map();
  const matchedTargetIndices = /* @__PURE__ */ new Set();
  let systematicityScore = 0;
  const sortedSource = [...source.relations].sort((a, b) => b.order - a.order);
  for (const srcRel of sortedSource) {
    let bestTargetIdx = -1;
    let bestScore = -1;
    for (let ti = 0; ti < target.relations.length; ti++) {
      if (matchedTargetIndices.has(ti)) continue;
      const tgtRel = target.relations[ti];
      let typeScore = 0;
      if (srcRel.type === tgtRel.type) {
        typeScore = 1;
      } else {
        typeScore = relationTypeSimilarity(srcRel.type, tgtRel.type);
        if (typeScore < TRANSFER.RELATION_MATCH_THRESHOLD) continue;
      }
      if (!isConsistentMapping(srcRel.args, tgtRel.args, entityMap, reverseEntityMap)) {
        continue;
      }
      if (typeScore > bestScore) {
        bestScore = typeScore;
        bestTargetIdx = ti;
      }
    }
    if (bestTargetIdx >= 0) {
      const tgtRel = target.relations[bestTargetIdx];
      matchedTargetIndices.add(bestTargetIdx);
      for (let ai = 0; ai < srcRel.args.length && ai < tgtRel.args.length; ai++) {
        const srcEntity = srcRel.args[ai];
        const tgtEntity = tgtRel.args[ai];
        if (!entityMap.has(srcEntity)) {
          entityMap.set(srcEntity, tgtEntity);
          reverseEntityMap.set(tgtEntity, srcEntity);
          mappings.push({
            source_entity: srcEntity,
            target_entity: tgtEntity,
            relation_type: srcRel.type
          });
        }
      }
      systematicityScore += 1 + TRANSFER.SYSTEMATICITY_BONUS * srcRel.order;
    }
  }
  const maxPossible = source.relations.reduce(
    (sum, r) => sum + 1 + TRANSFER.SYSTEMATICITY_BONUS * r.order,
    0
  );
  const alignmentScore = maxPossible > 0 ? systematicityScore / maxPossible : 0;
  return {
    source_pattern: source,
    target_pattern: target,
    mappings,
    alignment_score: alignmentScore,
    systematicity_score: systematicityScore
  };
}
function isConsistentMapping(srcArgs, tgtArgs, entityMap, reverseEntityMap) {
  if (srcArgs.length !== tgtArgs.length) return false;
  for (let i = 0; i < srcArgs.length; i++) {
    const src = srcArgs[i];
    const tgt = tgtArgs[i];
    if (entityMap.has(src) && entityMap.get(src) !== tgt) return false;
    if (reverseEntityMap.has(tgt) && reverseEntityMap.get(tgt) !== src) return false;
  }
  return true;
}
function relationTypeSimilarity(typeA, typeB) {
  if (typeA === typeB) return 1;
  const a = new Set(typeA.split(""));
  const b = new Set(typeB.split(""));
  let intersection = 0;
  for (const c of a) {
    if (b.has(c)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
function attemptTransfer(sourceMemory, sourcePattern, targetDomain, existingPatterns) {
  if (existingPatterns.length === 0) return null;
  const candidates = existingPatterns.slice(0, TRANSFER.MAX_ALIGNMENT_CANDIDATES);
  let bestAlignment = null;
  let bestScore = 0;
  for (const targetPattern of candidates) {
    const alignment = alignPatterns(sourcePattern, targetPattern);
    if (alignment.alignment_score > bestScore) {
      bestScore = alignment.alignment_score;
      bestAlignment = alignment;
    }
  }
  if (!bestAlignment || bestAlignment.alignment_score < TRANSFER.MIN_ALIGNMENT_SCORE) {
    return null;
  }
  const transferredContent = generateTransferredContent(
    sourceMemory.content,
    bestAlignment.mappings,
    targetDomain
  );
  const minConfidence = Math.min(
    sourceMemory.confidence,
    bestAlignment.target_pattern.confidence
  );
  const confidence = bestAlignment.alignment_score * minConfidence * TRANSFER.TRANSFER_DISCOUNT;
  return {
    source_memory_id: sourceMemory.id,
    target_domain: targetDomain,
    alignment: bestAlignment,
    transferred_content: transferredContent,
    confidence,
    created_memory_id: null
    // Caller decides whether to persist
  };
}
function generateTransferredContent(sourceContent, mappings, targetDomain) {
  let content = sourceContent;
  const sorted = [...mappings].sort(
    (a, b) => b.source_entity.length - a.source_entity.length
  );
  for (const mapping of sorted) {
    const escaped = mapping.source_entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    content = content.replace(regex, mapping.target_entity);
  }
  return `[Transferred to ${targetDomain}] ${content}`;
}

// src/engines/consolidation.ts
var logger = createLogger("consolidation");
function runConsolidation(type, consolConfig, decayConfig) {
  const startedAt = now();
  const result = {
    type,
    started_at: startedAt,
    completed_at: "",
    // filled at end
    memories_replayed: 0,
    connections_created: 0,
    connections_strengthened: 0,
    memories_promoted: 0,
    memories_pruned: 0,
    memories_archived: 0,
    schemas_formed: 0,
    global_downscale_factor: type === "light" ? 1 : consolConfig.global_downscale_factor,
    connections_decayed: 0,
    connections_pruned: 0,
    speculative_connections_created: 0,
    speculative_connections_promoted: 0,
    speculative_connections_pruned: 0,
    creative_insights: 0
  };
  maintainEmbeddings();
  const candidates = getConsolidationCandidates(consolConfig.max_memories_per_cycle);
  result.memories_replayed = candidates.length;
  replayAndStrengthen(candidates, result);
  decayConnections(result);
  if (type === "full" || type === "deep") {
    const affected = globalDownscale(consolConfig.global_downscale_factor);
    result.global_downscale_factor = consolConfig.global_downscale_factor;
    promoteMemories(candidates, consolConfig, result);
    pruneMemories(candidates, decayConfig, result);
    pruneExtendedDecay(candidates, decayConfig, result);
    deduplicateAntipatterns(result);
    graduateErrors(result);
    evaluateMastery(result);
    if (ARCHITECTURE.PRUNE_ON_CONSOLIDATION) {
      try {
        pruneArchitectureGraph();
      } catch {
      }
    }
  }
  detectPatterns(candidates, consolConfig, result);
  if (type === "deep") {
    assimilateIntoSchemas(candidates, result);
    extractAndTransferPatterns(candidates, result);
    dreamPhase(candidates, result);
    try {
      const promoted = crossProjectPatternScan(candidates);
      result.memories_promoted += promoted;
    } catch (e) {
      logger.error("Phase 9.0 cross-project scan failed", { error: String(e) });
    }
    try {
      const domains = /* @__PURE__ */ new Set();
      for (const m of candidates) {
        for (const d of m.domains) {
          if (d) domains.add(d);
        }
      }
      for (const domain of domains) {
        const synthesis = synthesizeDomainKnowledge(domain);
        if (synthesis) {
          const narrative = composeKnowledgeNarrative(synthesis);
          const oldSyntheses = getSynthesisMemories(domain);
          const isDuplicate = oldSyntheses.some((old) => old.content === narrative);
          if (isDuplicate) continue;
          const newMem = createMemory({
            content: narrative,
            type: "semantic",
            summary: `Domain synthesis: ${domain}`,
            encoding_strength: SYNTHESIS.ENCODING_STRENGTH,
            reinforcement: 1,
            confidence: SYNTHESIS.ENCODING_CONFIDENCE,
            domains: [domain],
            version: null,
            tags: ["synthesis", "domain-knowledge", "deep-consolidation"],
            storage_tier: "long_term",
            pinned: false,
            encoding_context: {
              project: null,
              project_path: null,
              framework: domain,
              version: null,
              task_type: null,
              files: [],
              error_context: null,
              session_id: "consolidation",
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
            updateMemory(old.id, { superseded_by: newMem.id });
          }
          result.creative_insights++;
          logger.info("Domain synthesis created in deep consolidation", { domain, superseded: oldSyntheses.length });
        }
      }
    } catch (e) {
      logger.error("Phase 9.1 synthesis failed", { error: String(e) });
    }
    try {
      const deleted = cleanupStaleProjectDatabases();
      if (deleted > 0) {
        logger.info("Phase 9.2: deleted stale project DBs", { count: deleted });
      }
    } catch (e) {
      logger.error("Phase 9.2 stale DB cleanup failed", { error: String(e) });
    }
  }
  if (type === "full" || type === "deep") {
    try {
      const modelDomains = /* @__PURE__ */ new Set();
      for (const m of candidates) {
        for (const d of m.domains) {
          if (d) modelDomains.add(d);
        }
      }
      for (const domain of modelDomains) {
        compileMentalModel(domain, null);
      }
      const currentProjectPath = getProjectDbPath();
      if (currentProjectPath) {
        for (const domain of modelDomains) {
          compileMentalModel(domain, currentProjectPath);
        }
      }
      try {
        const memDir = discoverMemoryDir(process.cwd());
        if (memDir) {
          const compiledModels = [];
          for (const domain of modelDomains) {
            const m = getMentalModel(domain);
            if (m) compiledModels.push(m);
          }
          if (compiledModels.length > 0) {
            updateMemoryMdMentalModels(memDir, compiledModels);
          }
        }
      } catch (e) {
        logger.debug("Phase 9.3: MEMORY.md export skipped", { error: String(e) });
      }
      logger.info("Phase 9.3: mental models compiled", { domains: modelDomains.size });
    } catch (e) {
      logger.error("Phase 9.3 mental model compilation failed", { error: String(e) });
    }
  }
  if (type === "full" || type === "deep") {
    runHousekeeping();
  }
  result.completed_at = now();
  logConsolidation(result);
  return result;
}
function inferRelationType(memA, memB, domainOverlap, cosineSim) {
  if (isEpisodicData(memA.type_data) && isEpisodicData(memB.type_data)) {
    const outcomeA = memA.type_data.outcome;
    const outcomeB = memB.type_data.outcome;
    if (outcomeA === "failure" && outcomeB === "success" && memB.created_at > memA.created_at) {
      const ageMs = new Date(memB.created_at).getTime() - new Date(memA.created_at).getTime();
      if (ageMs < CONSOLIDATION.CAUSED_BY_MAX_AGE_DIFF_HOURS * 36e5) {
        return "caused_by";
      }
    }
    if (outcomeB === "failure" && outcomeA === "success" && memA.created_at > memB.created_at) {
      const ageMs = new Date(memA.created_at).getTime() - new Date(memB.created_at).getTime();
      if (ageMs < CONSOLIDATION.CAUSED_BY_MAX_AGE_DIFF_HOURS * 36e5) {
        return "caused_by";
      }
    }
    if (cosineSim != null && cosineSim > CONSOLIDATION.CONTRADICTS_COSINE_THRESHOLD) {
      if (outcomeA === "success" && outcomeB === "failure" || outcomeA === "failure" && outcomeB === "success") {
        return "contradicts";
      }
    }
  }
  if (cosineSim != null && cosineSim > CONSOLIDATION.SUPERSEDES_COSINE_THRESHOLD && memA.type === memB.type) {
    const newer = memA.created_at > memB.created_at ? memA : memB;
    const older = newer === memA ? memB : memA;
    if (newer.confidence > older.confidence) {
      return "supersedes";
    }
  }
  const kwA = new Set(extractKeywords(memA.content));
  const kwB = new Set(extractKeywords(memB.content));
  if (kwA.size > 0 && kwB.size > 0) {
    const aInB = [...kwA].filter((k) => kwB.has(k)).length;
    const bInA = [...kwB].filter((k) => kwA.has(k)).length;
    if (kwA.size < kwB.size && aInB / kwA.size >= 0.7) {
      return "part_of";
    }
    if (kwB.size < kwA.size && bInA / kwB.size >= 0.7) {
      return "part_of";
    }
  }
  if (memA.type === "procedural" && memB.type === "procedural") {
    return "depends_on";
  }
  if (!domainOverlap) {
    return "cross_domain";
  }
  return "related";
}
function replayAndStrengthen(memories, result) {
  const allIds = memories.map((m) => m.id);
  const connectionMap = batchGetConnections(allIds);
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const memA = memories[i];
      const memB = memories[j];
      const similarity = keywordSimilarity(memA.content, memB.content);
      if (similarity < 0.15) continue;
      const domainOverlap = memA.domains.some((d) => memB.domains.includes(d));
      if (similarity > 0.3 || similarity > 0.15 && domainOverlap) {
        const existing = connectionMap.get(`${memA.id}|${memB.id}`) ?? connectionMap.get(`${memB.id}|${memA.id}`);
        if (existing) {
          incrementConnectionActivation(existing.source_id, existing.target_id, 0.05);
          result.connections_strengthened++;
        } else {
          let connectionStrength = similarity * (domainOverlap ? 1.2 : 0.8);
          const emotionalWeightA = isEpisodicData(memA.type_data) ? memA.type_data.emotional_weight : 0;
          const emotionalWeightB = isEpisodicData(memB.type_data) ? memB.type_data.emotional_weight : 0;
          const maxEmotional = Math.max(emotionalWeightA, emotionalWeightB);
          if (maxEmotional > 0) {
            connectionStrength += maxEmotional * EMOTIONAL.CONNECTION_BONUS;
          }
          createConnection({
            source_id: memA.id,
            target_id: memB.id,
            strength: Math.min(connectionStrength, 1),
            type: inferRelationType(memA, memB, domainOverlap)
          });
          result.connections_created++;
        }
      }
    }
  }
  try {
    const embeddings = batchGetEmbeddings(allIds);
    if (embeddings.size >= 2) {
      let embeddingConnectionsCreated = 0;
      const maxEmbConns = CONSOLIDATION.MAX_EMBEDDING_CONNECTIONS_PER_CYCLE;
      for (let i = 0; i < memories.length && embeddingConnectionsCreated < maxEmbConns; i++) {
        const embA = embeddings.get(memories[i].id);
        if (!embA) continue;
        const vecA = bufferToEmbedding(embA);
        for (let j = i + 1; j < memories.length && embeddingConnectionsCreated < maxEmbConns; j++) {
          const embB = embeddings.get(memories[j].id);
          if (!embB) continue;
          if (connectionMap.has(`${memories[i].id}|${memories[j].id}`) || connectionMap.has(`${memories[j].id}|${memories[i].id}`)) continue;
          const vecB = bufferToEmbedding(embB);
          const sim = cosineSimilarity(vecA, vecB);
          if (sim >= CONSOLIDATION.EMBEDDING_CONNECTION_THRESHOLD) {
            const domainOverlap = memories[i].domains.some((d) => memories[j].domains.includes(d));
            createConnection({
              source_id: memories[i].id,
              target_id: memories[j].id,
              strength: Math.min(sim, 1),
              type: inferRelationType(memories[i], memories[j], domainOverlap, sim)
            });
            embeddingConnectionsCreated++;
            result.connections_created++;
          }
        }
      }
      if (embeddingConnectionsCreated > 0) {
        logger.info("Embedding-based connections created", { count: embeddingConnectionsCreated });
      }
    }
  } catch {
    logger.debug("Embedding-based connection pass skipped");
  }
}
function maintainEmbeddings() {
  try {
    recomputeIdf();
    const unembedded = getUnembeddedMemories(EMBEDDING.REEMBED_BATCH_SIZE);
    let backfilled = 0;
    for (const mem of unembedded) {
      try {
        const embedding = generateEmbedding(mem.content);
        storeEmbedding(mem.id, embeddingToBuffer(embedding));
        backfilled++;
      } catch {
      }
    }
    if (backfilled > 0) {
      logger.info("Embedding backfill complete", { backfilled, total_unembedded: unembedded.length });
    }
  } catch {
    logger.debug("Embedding maintenance skipped");
  }
}
function decayConnections(result) {
  const stale = getStaleConnections(CONNECTION_DECAY.GRACE_PERIOD_DAYS);
  if (stale.length === 0) return;
  const candidates = evaluateConnectionDecay(stale);
  const toUpdate = [];
  const toDelete = [];
  for (const c of candidates) {
    if (c.shouldPrune) {
      toDelete.push({ source_id: c.connection.source_id, target_id: c.connection.target_id });
    } else if (c.decayedStrength < c.connection.strength) {
      toUpdate.push({
        source_id: c.connection.source_id,
        target_id: c.connection.target_id,
        strength: c.decayedStrength
      });
    }
  }
  if (toUpdate.length > 0) {
    result.connections_decayed += bulkUpdateConnectionStrengths(toUpdate);
  }
  if (toDelete.length > 0) {
    result.connections_pruned += bulkDeleteConnections(toDelete);
  }
}
function promoteMemories(memories, config2, result) {
  for (const memory of memories) {
    if (memory.type !== "episodic") continue;
    const typeData = memory.type_data;
    if (typeData.kind !== "episodic") continue;
    const hasLesson = typeData.lesson !== null && typeData.lesson.length > 0;
    const emotionalReduction = typeData.emotional_weight * EMOTIONAL.PROMOTION_THRESHOLD_REDUCTION;
    const effectiveThreshold = config2.promotion_confidence - emotionalReduction;
    const highConfidence = memory.confidence >= effectiveThreshold;
    const wellAccessed = memory.access_count >= config2.promotion_access_count;
    const wellConnected = getConnectionCount(memory.id) >= 2;
    if (hasLesson && highConfidence && wellAccessed && wellConnected) {
      const semanticData = {
        kind: "semantic",
        knowledge_type: "pattern",
        source: "experience",
        source_episodes: [memory.id],
        applicable_versions: memory.version ? [memory.version] : null,
        deprecated_in: null
      };
      updateMemory(memory.id, {
        storage_tier: "long_term",
        type: "semantic",
        type_data: semanticData,
        content: typeData.lesson ?? memory.content
      });
      result.memories_promoted++;
      if (typeData.lesson) {
        try {
          autoCreateFromLesson(memory.id, typeData.lesson, memory.domains[0] ?? null);
        } catch {
        }
      }
    }
  }
}
function pruneMemories(memories, config2, result) {
  const connectionCounts = batchGetConnectionCounts(memories.map((m) => m.id));
  const candidates = evaluateDecayCandidates(
    memories,
    (id) => connectionCounts.get(id) ?? 0,
    config2
  );
  for (const candidate of candidates) {
    if (!candidate.shouldPrune) continue;
    if (candidate.suggestedAction === "archive") {
      archiveMemory(candidate.memory, "decay_below_threshold");
      result.memories_archived++;
    } else {
      updateMemory(candidate.memory.id, { flagged_for_pruning: true });
    }
    result.memories_pruned++;
  }
}
function pruneExtendedDecay(mainCandidates, config2, result) {
  const mainIds = mainCandidates.map((m) => m.id);
  const extra = getDecayScanCandidates(HOUSEKEEPING.DECAY_SCAN_EXTRA, mainIds);
  if (extra.length === 0) return;
  const connectionCounts = batchGetConnectionCounts(extra.map((m) => m.id));
  const candidates = evaluateDecayCandidates(
    extra,
    (id) => connectionCounts.get(id) ?? 0,
    config2
  );
  for (const candidate of candidates) {
    if (!candidate.shouldPrune) continue;
    if (candidate.suggestedAction === "archive") {
      archiveMemory(candidate.memory, "extended_decay_scan");
      result.memories_archived++;
    } else {
      updateMemory(candidate.memory.id, { flagged_for_pruning: true });
    }
    result.memories_pruned++;
  }
  if (candidates.some((c) => c.shouldPrune)) {
    logger.info("Extended decay scan pruned memories", {
      scanned: extra.length,
      pruned: candidates.filter((c) => c.shouldPrune).length
    });
  }
}
function deduplicateAntipatterns(result) {
  const antipatterns = getAntipatterns();
  if (antipatterns.length < 2) return;
  const byDomain = /* @__PURE__ */ new Map();
  for (const ap of antipatterns) {
    const domain = ap.domains[0] ?? "_global";
    const group = byDomain.get(domain) ?? [];
    group.push(ap);
    byDomain.set(domain, group);
  }
  let dedupCount = 0;
  const archived = /* @__PURE__ */ new Set();
  for (const [, group] of byDomain) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      if (archived.has(group[i].id)) continue;
      for (let j = i + 1; j < group.length; j++) {
        if (archived.has(group[j].id)) continue;
        const sim = keywordSimilarity(group[i].content, group[j].content);
        if (sim >= DEDUP.CONSOLIDATION_THRESHOLD) {
          const [keep, dup] = group[i].confidence >= group[j].confidence ? [group[i], group[j]] : [group[j], group[i]];
          try {
            createConnection({
              source_id: keep.id,
              target_id: dup.id,
              strength: sim,
              type: "supersedes"
            });
          } catch {
          }
          archiveMemory(dup, "dedup_consolidation");
          archived.add(dup.id);
          result.memories_archived++;
          dedupCount++;
        }
      }
    }
  }
  if (dedupCount > 0) {
    logger.info("Antipattern deduplication completed", { merged: dedupCount });
  }
}
function graduateErrors(result) {
  try {
    const graduated = graduateErrorCandidates();
    if (graduated > 0) {
      logger.info("Error graduation completed", { graduated });
      result.memories_promoted += graduated;
    }
  } catch (err) {
    logger.warn("Error graduation failed", { error: String(err) });
  }
}
function evaluateMastery(result) {
  try {
    const changed = evaluateAllMastery();
    if (changed > 0) {
      logger.info("Mastery evaluation completed", { profiles_changed: changed });
    }
  } catch (err) {
    logger.warn("Mastery evaluation failed", { error: String(err) });
  }
}
function runHousekeeping() {
  try {
    const stats = getHousekeepingStats();
    let totalCleaned = 0;
    if (stats.flagged > 0) {
      const cleaned = deleteFlaggedMemories(HOUSEKEEPING.FLAGGED_PRUNE_BATCH);
      totalCleaned += cleaned;
      if (cleaned > 0) logger.info("Deleted flagged memories", { count: cleaned });
    }
    if (stats.cold > HOUSEKEEPING.MAX_COLD_ROWS * 0.8) {
      const evicted = evictColdStorage(HOUSEKEEPING.MAX_COLD_ROWS, HOUSEKEEPING.COLD_MAX_AGE_DAYS);
      totalCleaned += evicted;
      if (evicted > 0) logger.info("Evicted cold storage", { count: evicted });
    }
    if (stats.logs > HOUSEKEEPING.MAX_CONSOLIDATION_LOGS) {
      const pruned = pruneConsolidationLog(HOUSEKEEPING.MAX_CONSOLIDATION_LOGS);
      totalCleaned += pruned;
      if (pruned > 0) logger.info("Pruned consolidation logs", { count: pruned });
    }
    if (stats.metrics > HOUSEKEEPING.MAX_METRICS_ROWS) {
      const pruned = pruneMetrics(HOUSEKEEPING.MAX_METRICS_ROWS);
      totalCleaned += pruned;
      if (pruned > 0) logger.info("Pruned metrics", { count: pruned });
    }
    const staleVocab = pruneStaleVocabulary();
    totalCleaned += staleVocab;
    if (staleVocab > 0) logger.info("Pruned stale vocabulary", { count: staleVocab });
    optimizeFts();
    if (totalCleaned >= HOUSEKEEPING.VACUUM_DELETE_THRESHOLD) {
      vacuumDatabase();
      logger.info("VACUUM completed", { rows_freed: totalCleaned });
    }
    if (totalCleaned > 0) {
      logger.info("Housekeeping complete", { total_cleaned: totalCleaned });
    }
  } catch (e) {
    logger.error("Housekeeping failed", { error: String(e) });
  }
}
function assimilateMemory(memory, schemas) {
  if (schemas.length === 0) return null;
  let bestSchema = null;
  let bestSimilarity = 0;
  for (const schema of schemas) {
    const sim = keywordSimilarity(memory.content, schema.name);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestSchema = schema;
    }
  }
  if (!bestSchema) return null;
  if (bestSchema.instances.includes(memory.id)) return null;
  if (bestSimilarity >= SCHEMA_LIFECYCLE.ASSIMILATION_THRESHOLD) {
    const isCrossDomain = !bestSchema.domains_seen_in.some((d) => memory.domains.includes(d));
    let newConfidence = Math.min(1, bestSchema.confidence * SCHEMA_LIFECYCLE.ASSIMILATION_BOOST);
    if (isCrossDomain) {
      newConfidence = Math.min(1, newConfidence * SCHEMA_LIFECYCLE.CROSS_DOMAIN_BOOST);
    }
    const newInstances = [...bestSchema.instances, memory.id];
    const newDomains = [.../* @__PURE__ */ new Set([...bestSchema.domains_seen_in, ...memory.domains])];
    updateSchema(bestSchema.id, {
      instances: newInstances,
      domains_seen_in: newDomains,
      confidence: newConfidence,
      validation_count: bestSchema.validation_count + 1,
      last_validated: now()
    });
    const recentInstances = bestSchema.instances.slice(-5);
    for (const instanceId of recentInstances) {
      const existing = getConnections(memory.id).find(
        (c) => c.source_id === memory.id && c.target_id === instanceId || c.source_id === instanceId && c.target_id === memory.id
      );
      if (!existing) {
        createConnection({
          source_id: memory.id,
          target_id: instanceId,
          strength: 0.6,
          type: "same_schema"
        });
      }
    }
    return {
      schema_id: bestSchema.id,
      memory_id: memory.id,
      action: "assimilated",
      confidence_delta: newConfidence - bestSchema.confidence,
      cross_domain: isCrossDomain
    };
  }
  if (bestSimilarity >= SCHEMA_LIFECYCLE.ACCOMMODATION_THRESHOLD) {
    const newConfidence = bestSchema.confidence * SCHEMA_LIFECYCLE.ACCOMMODATION_DECAY;
    const newInstances = [...bestSchema.instances, memory.id];
    const newDomains = [.../* @__PURE__ */ new Set([...bestSchema.domains_seen_in, ...memory.domains])];
    updateSchema(bestSchema.id, {
      instances: newInstances,
      domains_seen_in: newDomains,
      confidence: newConfidence,
      last_validated: now()
    });
    const recentInstances = bestSchema.instances.slice(-3);
    for (const instanceId of recentInstances) {
      const existing = getConnections(memory.id).find(
        (c) => c.source_id === memory.id && c.target_id === instanceId || c.source_id === instanceId && c.target_id === memory.id
      );
      if (!existing) {
        createConnection({
          source_id: memory.id,
          target_id: instanceId,
          strength: 0.4,
          type: "same_schema"
        });
      }
    }
    return {
      schema_id: bestSchema.id,
      memory_id: memory.id,
      action: "accommodated",
      confidence_delta: newConfidence - bestSchema.confidence,
      cross_domain: false
    };
  }
  return null;
}
function evaluateSchemaPromotion(schema) {
  if (schema.status === "principle") return false;
  const fpRate = schema.validation_count > 0 ? schema.false_positive_count / schema.validation_count : 0;
  if (schema.validation_count >= SCHEMA_LIFECYCLE.PROMOTION_MIN_VALIDATIONS && schema.domains_seen_in.length >= SCHEMA_LIFECYCLE.PROMOTION_MIN_DOMAINS && schema.confidence >= SCHEMA_LIFECYCLE.PROMOTION_MIN_CONFIDENCE && fpRate < SCHEMA_LIFECYCLE.PROMOTION_MAX_FP_RATE) {
    updateSchema(schema.id, {
      status: "principle",
      abstraction_level: 3,
      confidence: Math.min(1, schema.confidence * 1.1)
    });
    logger.info("Schema promoted to principle", {
      schema_id: schema.id,
      name: schema.name,
      validations: schema.validation_count,
      domains: schema.domains_seen_in.length
    });
    return true;
  }
  return false;
}
function assimilateIntoSchemas(memories, _result) {
  const allSchemas = getAllSchemas();
  if (allSchemas.length === 0) return;
  for (const mem of memories) {
    const relevantSchemas = allSchemas.filter(
      (s) => s.domains_seen_in.some((d) => mem.domains.includes(d)) || mem.domains.length === 0
    );
    if (relevantSchemas.length > 0) {
      assimilateMemory(mem, relevantSchemas);
    }
  }
  const updatedSchemas = getAllSchemas();
  for (const schema of updatedSchemas) {
    evaluateSchemaPromotion(schema);
  }
}
function detectPatterns(memories, config2, result) {
  const existingSchemas = getAllSchemas();
  const existingInstanceSets = new Set(
    existingSchemas.flatMap((s) => s.instances)
  );
  const qualityMemories = memories.filter((mem) => {
    if (mem.type === "semantic" || mem.type === "procedural") return true;
    if (mem.tags.includes("subagent") && !mem.tags.includes("has_lesson") && !mem.tags.includes("has_cognition")) return false;
    if (mem.content.startsWith("Command:") && mem.content.includes("Output: {")) return false;
    return mem.confidence >= 0.45 || mem.tags.includes("has_lesson");
  });
  const byDomain = /* @__PURE__ */ new Map();
  for (const mem of qualityMemories) {
    for (const domain of mem.domains) {
      const group = byDomain.get(domain) ?? [];
      group.push(mem);
      byDomain.set(domain, group);
    }
  }
  for (const [domain, domainMemories] of byDomain) {
    if (domainMemories.length < config2.pattern_min_instances) continue;
    const clusters = [];
    const assigned = /* @__PURE__ */ new Set();
    for (let i = 0; i < domainMemories.length; i++) {
      if (assigned.has(domainMemories[i].id)) continue;
      const cluster = [domainMemories[i]];
      assigned.add(domainMemories[i].id);
      for (let j = i + 1; j < domainMemories.length; j++) {
        if (assigned.has(domainMemories[j].id)) continue;
        const sim = keywordSimilarity(domainMemories[i].content, domainMemories[j].content);
        if (sim > CONSOLIDATION.PATTERN_SIMILARITY_THRESHOLD) {
          cluster.push(domainMemories[j]);
          assigned.add(domainMemories[j].id);
        }
      }
      if (cluster.length >= config2.pattern_min_instances) {
        clusters.push(cluster);
      }
    }
    for (const cluster of clusters) {
      const instanceIds = cluster.map((m) => m.id);
      const allExisting = instanceIds.every((id) => existingInstanceSets.has(id));
      if (allExisting) continue;
      const allKeywords = cluster.map((m) => extractKeywords(m.content));
      const commonKeywords = findCommonKeywords(allKeywords);
      const schemaName = commonKeywords.length > 0 ? `${domain}:${commonKeywords.slice(0, 3).join("_")}` : `${domain}:pattern_${generateId().substring(0, 8)}`;
      const domainsSeen = /* @__PURE__ */ new Set();
      for (const mem of cluster) {
        for (const d of mem.domains) domainsSeen.add(d);
      }
      const avgConfidence = cluster.reduce((sum, m) => sum + m.confidence, 0) / cluster.length;
      const description = generateSchemaDescriptionFromCluster(cluster, commonKeywords, domain);
      try {
        createSchema({
          name: schemaName,
          description,
          pattern_id: "",
          instances: instanceIds,
          domains_seen_in: Array.from(domainsSeen),
          confidence: avgConfidence,
          formation_date: now()
        });
        for (let i = 0; i < cluster.length; i++) {
          for (let j = i + 1; j < cluster.length; j++) {
            const existing = getConnections(cluster[i].id).find(
              (c) => c.source_id === cluster[i].id && c.target_id === cluster[j].id || c.source_id === cluster[j].id && c.target_id === cluster[i].id
            );
            if (!existing) {
              createConnection({
                source_id: cluster[i].id,
                target_id: cluster[j].id,
                strength: 0.6,
                type: "same_schema"
              });
              result.connections_created++;
            }
          }
        }
        result.schemas_formed++;
        logger.info("Schema formed", { name: schemaName, instances: instanceIds.length, domain });
      } catch (err) {
        logger.error("Failed to create schema", { error: String(err), domain });
      }
    }
  }
}
function findCommonKeywords(keywordSets) {
  if (keywordSets.length === 0) return [];
  const counts = /* @__PURE__ */ new Map();
  for (const kws of keywordSets) {
    const unique = new Set(kws);
    for (const kw of unique) {
      counts.set(kw, (counts.get(kw) ?? 0) + 1);
    }
  }
  const threshold = Math.ceil(keywordSets.length * CONSOLIDATION.COMMON_KEYWORD_THRESHOLD);
  return Array.from(counts.entries()).filter(([_, count]) => count >= threshold).sort((a, b) => b[1] - a[1]).map(([kw]) => kw);
}
function extractAndTransferPatterns(memories, result) {
  for (const memory of memories) {
    const existingPatterns = getPatternsByMemory(memory.id);
    if (existingPatterns.length > 0) continue;
    const pattern = extractPattern(memory, 0);
    if (pattern.relations.length === 0) continue;
    try {
      createPattern(pattern);
    } catch (err) {
      logger.error("Failed to create pattern", { error: String(err), memory_id: memory.id });
      continue;
    }
    const connections = getConnections(memory.id);
    const crossDomainConns = connections.filter((c) => c.type === "cross_domain");
    if (crossDomainConns.length === 0) continue;
    const targetDomains = /* @__PURE__ */ new Set();
    for (const conn of crossDomainConns) {
      const neighborId = conn.source_id === memory.id ? conn.target_id : conn.source_id;
      const neighbor = memories.find((m) => m.id === neighborId);
      if (neighbor) {
        for (const d of neighbor.domains) {
          if (!memory.domains.includes(d)) {
            targetDomains.add(d);
          }
        }
      }
    }
    for (const targetDomain of targetDomains) {
      const domainPatterns = getPatternsByDomain(targetDomain, TRANSFER.MAX_ALIGNMENT_CANDIDATES);
      if (domainPatterns.length === 0) continue;
      const transferResult = attemptTransfer(memory, pattern, targetDomain, domainPatterns);
      if (transferResult) {
        logger.info("Cross-domain transfer succeeded", {
          source_id: memory.id,
          target_domain: targetDomain,
          alignment_score: transferResult.alignment.alignment_score,
          confidence: transferResult.confidence
        });
      }
    }
  }
}
function dreamPhase(candidates, result) {
  if (candidates.length < 2) return;
  const pairs = [];
  const maxPairs = Math.min(CREATIVE.MAX_PAIRS, Math.floor(candidates.length / 2));
  for (let attempt = 0; attempt < maxPairs * 3 && pairs.length < maxPairs; attempt++) {
    const idxA = Math.floor(Math.random() * candidates.length);
    let idxB = Math.floor(Math.random() * candidates.length);
    if (idxA === idxB) continue;
    const memA = candidates[idxA];
    const memB = candidates[idxB];
    const differentDomain = !memA.domains.some((d) => memB.domains.includes(d));
    if (!differentDomain && Math.random() > 0.3) continue;
    pairs.push([memA, memB]);
  }
  for (const [memA, memB] of pairs) {
    const similarity = keywordSimilarity(memA.content, memB.content);
    if (similarity < CREATIVE.SIMILARITY_THRESHOLD) continue;
    const existing = getConnections(memA.id).find(
      (c) => c.source_id === memA.id && c.target_id === memB.id || c.source_id === memB.id && c.target_id === memA.id
    );
    if (existing) continue;
    createConnection({
      source_id: memA.id,
      target_id: memB.id,
      strength: CREATIVE.SPECULATIVE_STRENGTH,
      type: "speculative"
    });
    result.speculative_connections_created++;
  }
  const speculative = getSpeculativeConnections();
  for (const conn of speculative) {
    if (conn.strength >= CREATIVE.INSIGHT_STRENGTH_THRESHOLD) {
      bulkDeleteConnections([{ source_id: conn.source_id, target_id: conn.target_id }]);
      createConnection({
        source_id: conn.source_id,
        target_id: conn.target_id,
        strength: conn.strength,
        type: "cross_domain"
      });
      result.speculative_connections_promoted++;
      createInsightFromPromotion(conn.source_id, conn.target_id, conn.strength);
      result.creative_insights++;
      logger.info("Creative insight: speculative connection promoted", {
        source: conn.source_id,
        target: conn.target_id,
        strength: conn.strength
      });
      continue;
    }
    const ageInDays = Math.abs(
      (new Date(now()).getTime() - new Date(conn.created_at).getTime()) / (1e3 * 60 * 60 * 24)
    );
    const ageCycles = Math.floor(ageInDays / 7);
    if (ageCycles >= CREATIVE.MAX_SPECULATIVE_AGE && conn.co_activation_count === 0) {
      bulkDeleteConnections([{ source_id: conn.source_id, target_id: conn.target_id }]);
      result.speculative_connections_pruned++;
    }
  }
  if (result.speculative_connections_created > 0 || result.speculative_connections_promoted > 0) {
    logger.info("Dream phase complete", {
      created: result.speculative_connections_created,
      promoted: result.speculative_connections_promoted,
      pruned: result.speculative_connections_pruned,
      insights: result.creative_insights
    });
  }
}
function createInsightFromPromotion(sourceId, targetId, connectionStrength) {
  const sourceMem = getMemory(sourceId);
  const targetMem = getMemory(targetId);
  if (!sourceMem || !targetMem) return;
  const sourceDomain = sourceMem.domains[0] ?? "unknown";
  const targetDomain = targetMem.domains[0] ?? "unknown";
  const sourceSnippet = extractFirstSentence(sourceMem.content);
  const targetSnippet = extractFirstSentence(targetMem.content);
  const content = `Cross-domain insight: A pattern from ${sourceDomain} may apply to ${targetDomain}. Source: ${sourceSnippet} \u2192 Target: ${targetSnippet}`;
  const allDomains = [.../* @__PURE__ */ new Set([...sourceMem.domains, ...targetMem.domains])];
  try {
    const insightMemory = createMemory({
      type: "semantic",
      content,
      summary: `Insight: ${sourceDomain} pattern applies to ${targetDomain}`,
      encoding_strength: CREATIVE_INSIGHT.ENCODING_STRENGTH,
      reinforcement: 1,
      confidence: CREATIVE_INSIGHT.INITIAL_CONFIDENCE,
      domains: allDomains,
      version: null,
      tags: [CREATIVE_INSIGHT.TAG, CREATIVE_INSIGHT.CROSS_DOMAIN_TAG],
      storage_tier: "medium_term",
      pinned: false,
      encoding_context: {
        project: null,
        project_path: null,
        framework: null,
        version: null,
        task_type: null,
        files: [],
        error_context: null,
        session_id: "consolidation",
        significance_score: connectionStrength
      },
      type_data: {
        kind: "semantic",
        knowledge_type: "convention",
        source: "transferred",
        source_episodes: [sourceId, targetId],
        applicable_versions: null,
        deprecated_in: null
      }
    });
    createConnection({
      source_id: insightMemory.id,
      target_id: sourceId,
      strength: connectionStrength,
      type: "related"
    });
    createConnection({
      source_id: insightMemory.id,
      target_id: targetId,
      strength: connectionStrength,
      type: "related"
    });
    try {
      const triggerKeywords = extractKeywords(content).slice(0, 8).join(" ");
      autoCreateFromLesson(
        insightMemory.id,
        `Creative insight available: ${sourceDomain} pattern may help in ${targetDomain}. ${sourceSnippet}`,
        targetDomain
      );
    } catch {
    }
    logger.info("Insight memory created", {
      insight_id: insightMemory.id,
      source_domain: sourceDomain,
      target_domain: targetDomain,
      connection_strength: connectionStrength
    });
  } catch (err) {
    logger.warn("Failed to create insight memory", { error: String(err) });
  }
}
function extractFirstSentence(content) {
  const match = content.match(/^[^.!?\n]+[.!?]?/);
  const sentence = match ? match[0] : content.substring(0, 120);
  return sentence.substring(0, 120);
}
function generateSchemaDescriptionFromCluster(cluster, commonKeywords, domain) {
  const MAX_DESC = 200;
  const MAX_SAMPLE = 5;
  const keywordPhrase = commonKeywords.length > 0 ? commonKeywords.slice(0, 4).join(", ") : "mixed topics";
  const samples = cluster.slice(0, MAX_SAMPLE);
  const contentSnippets = [];
  for (const mem of samples) {
    const firstSentence = mem.content.match(/^[^.!?\n]+[.!?]?/);
    if (firstSentence) {
      contentSnippets.push(firstSentence[0].substring(0, 100));
    }
  }
  const types = new Set(cluster.map((m) => m.type));
  const hasAntipatterns = types.has("antipattern");
  const hasEpisodic = types.has("episodic");
  let desc = `Recurring pattern involving ${keywordPhrase}`;
  if (hasAntipatterns) {
    desc += " \u2014 includes known pitfalls";
  } else if (hasEpisodic) {
    desc += " \u2014 learned from experience";
  }
  if (contentSnippets.length > 0) {
    const representative = contentSnippets[0];
    const remaining = MAX_DESC - desc.length - 4;
    if (remaining > 30 && representative.length > 0) {
      desc += `. ${representative.substring(0, remaining)}`;
    }
  }
  return desc.substring(0, MAX_DESC);
}
function crossProjectPatternScan(candidates) {
  const projectDbs = listProjectDatabases();
  const currentProjectDb = getProjectDbPath();
  const otherDbs = projectDbs.filter((p) => p !== currentProjectDb).slice(0, CONSOLIDATION.MAX_PROJECT_DBS_TO_SCAN);
  if (otherDbs.length === 0) {
    logger.debug("Cross-project scan: no other project DBs to scan");
    return 0;
  }
  const seeds = candidates.filter((m) => m.type === "episodic" && m.content.length > 40);
  if (seeds.length === 0) {
    logger.debug("Cross-project scan: no episodic seeds");
    return 0;
  }
  const seedEmbeddings = /* @__PURE__ */ new Map();
  for (const seed of seeds) {
    try {
      seedEmbeddings.set(seed.id, generateEmbedding(seed.content));
    } catch {
    }
  }
  if (seedEmbeddings.size === 0) return 0;
  let promoted = 0;
  const db = getDatabase();
  const threshold = CONSOLIDATION.CROSS_PROJECT_SIMILARITY_THRESHOLD;
  const minOccurrences = CONSOLIDATION.CROSS_PROJECT_MIN_OCCURRENCES;
  const crossProjectMatches = /* @__PURE__ */ new Map();
  for (const otherDbPath of otherDbs) {
    const alias = `xproj_${generateId().slice(0, 8)}`;
    try {
      attachTemporary(otherDbPath, alias);
      const rows = db.prepare(
        `SELECT id, content FROM "${alias}".memories WHERE type = 'episodic' AND length(content) > 40 LIMIT 500`
      ).all();
      for (const row of rows) {
        let otherEmb;
        try {
          otherEmb = generateEmbedding(row.content);
        } catch {
          continue;
        }
        for (const [seedId, seedEmb] of seedEmbeddings) {
          const sim = cosineSimilarity(seedEmb, otherEmb);
          if (sim >= threshold) {
            if (!crossProjectMatches.has(seedId)) {
              crossProjectMatches.set(seedId, /* @__PURE__ */ new Set());
            }
            crossProjectMatches.get(seedId).add(otherDbPath);
          }
        }
      }
    } catch (e) {
      logger.warn("Cross-project scan: failed to scan project DB", { path: otherDbPath, error: String(e) });
    } finally {
      detachTemporary(alias);
    }
  }
  for (const [seedId, projectPaths] of crossProjectMatches) {
    const totalProjects = projectPaths.size + 1;
    if (totalProjects < minOccurrences) continue;
    const seed = seeds.find((s) => s.id === seedId);
    if (!seed) continue;
    const existingEmb = seedEmbeddings.get(seedId);
    const existingShared = getConsolidationCandidates(200).filter((m) => m.type === "semantic" && m.tags.includes("cross-project"));
    let alreadyExists = false;
    for (const existing of existingShared) {
      try {
        const emb = generateEmbedding(existing.content);
        if (cosineSimilarity(existingEmb, emb) > 0.8) {
          alreadyExists = true;
          updateMemory(existing.id, {
            reinforcement: existing.reinforcement + 0.2,
            confidence: Math.min(1, existing.confidence + 0.1)
          });
          break;
        }
      } catch {
        continue;
      }
    }
    if (alreadyExists) continue;
    const sourceProjects = Array.from(projectPaths).map((p) => {
      const parts = p.split("/");
      return parts[parts.length - 2] || "unknown";
    });
    const promotedMem = createMemory({
      type: "semantic",
      content: seed.content,
      summary: `Cross-project pattern (${totalProjects} projects)`,
      encoding_strength: 0.7,
      reinforcement: 1.5,
      confidence: 0.6,
      domains: seed.domains,
      version: null,
      tags: ["cross-project", "promoted", "auto-consolidated"],
      storage_tier: "long_term",
      pinned: false,
      encoding_context: {
        project: null,
        project_path: null,
        framework: null,
        version: null,
        task_type: null,
        files: [],
        error_context: null,
        session_id: "consolidation",
        significance_score: 0.7
      },
      type_data: {
        kind: "semantic",
        knowledge_type: "convention",
        source: "transferred",
        source_episodes: [seedId],
        applicable_versions: null,
        deprecated_in: null,
        source_projects: sourceProjects
      }
    });
    if (promotedMem) {
      createConnection({
        source_id: promotedMem.id,
        target_id: seedId,
        strength: CONSOLIDATION.CROSS_PROJECT_CONNECTION_STRENGTH,
        type: "cross_domain"
      });
    }
    promoted++;
    logger.info("Cross-project pattern promoted", {
      seedId,
      projects: totalProjects,
      content: seed.content.slice(0, 80)
    });
  }
  logger.info("Cross-project scan complete", { scanned: otherDbs.length, promoted });
  return promoted;
}
function cleanupStaleProjectDatabases() {
  const projectDbs = listProjectDatabases();
  const currentProjectDb = getProjectDbPath();
  const cutoffMs = Date.now() - PROJECT.STALE_DB_DAYS * 24 * 60 * 60 * 1e3;
  let deleted = 0;
  for (const dbPath of projectDbs) {
    if (dbPath === currentProjectDb) continue;
    try {
      const stat = statSync(dbPath);
      if (stat.mtimeMs > cutoffMs) continue;
      const projDb = new Database(dbPath, { readonly: true });
      let memCount = 0;
      try {
        const row = projDb.prepare("SELECT COUNT(*) as cnt FROM memories").get();
        memCount = row?.cnt ?? 0;
      } finally {
        projDb.close();
      }
      if (memCount >= PROJECT.STALE_DB_MIN_MEMORIES) continue;
      const dir = dbPath.replace(/\/project\.db$/, "");
      rmSync(dir, { recursive: true, force: true });
      deleted++;
      logger.info("Deleted stale project DB", { path: dbPath, memories: memCount });
    } catch (e) {
      logger.warn("Failed to evaluate project DB for cleanup", { path: dbPath, error: String(e) });
    }
  }
  return deleted;
}

// src/engines/scheduler.ts
var logger2 = createLogger("scheduler");
var _timer = null;
var _runCount = 0;
function startScheduler(config2, intervalSeconds) {
  if (_timer) {
    logger2.warn("Scheduler already running, stopping previous instance");
    stopScheduler();
  }
  _runCount = 0;
  const intervalMs = intervalSeconds * 1e3;
  _timer = setInterval(() => {
    runScheduledConsolidation(config2);
  }, intervalMs);
  if (_timer && typeof _timer === "object" && "unref" in _timer) {
    _timer.unref();
  }
  logger2.info("Scheduler started", { interval_s: intervalSeconds });
}
function stopScheduler() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    logger2.info("Scheduler stopped", { total_runs: _runCount });
  }
}
function isSchedulerRunning() {
  return _timer !== null;
}
function getSchedulerRunCount() {
  return _runCount;
}
function runScheduledConsolidation(config2) {
  _runCount++;
  let type = "light";
  if (_runCount % 30 === 0) {
    type = "deep";
  } else if (_runCount % 7 === 0) {
    type = "full";
  }
  logger2.info("Running scheduled consolidation", { type, run_number: _runCount });
  try {
    const result = runConsolidation(type, config2.consolidation, config2.decay);
    logger2.info("Scheduled consolidation complete", {
      type: result.type,
      replayed: result.memories_replayed,
      connections: result.connections_created,
      pruned: result.memories_pruned
    });
  } catch (err) {
    logger2.error("Scheduled consolidation failed", { error: String(err) });
  }
}

// src/engines/cleanup.ts
function classifyNoise(mem) {
  const content = mem.content;
  const tags = mem.tags;
  const typeData = mem.type_data;
  const hasLesson = tags.includes("has_lesson") || tags.includes("has_cognition");
  const lesson = typeData && "lesson" in typeData ? typeData.lesson : void 0;
  const hasRealLesson = lesson != null && lesson.length > 0 && !lesson.startsWith("Investigation across") && !lesson.startsWith("Narrowed search:") && !lesson.startsWith("Changed direction:") && !lesson.startsWith("File ") && !(lesson.startsWith("Error '") && /resolved\./.test(lesson));
  if (mem.pinned || mem.confidence >= 0.8) return null;
  if (mem.type === "antipattern" || mem.type === "semantic" || mem.type === "procedural") return null;
  if (tags.includes("subagent")) {
    if (hasLesson || hasRealLesson) return null;
    const first200 = content.substring(0, 200);
    const isBoilerplate = COGNITIVE.SUBAGENT_BOILERPLATE_PATTERNS.some((p) => p.test(first200));
    if (isBoilerplate) return "subagent_boilerplate";
    if (/^Subagent \([^)]*\) completed[\.:]\s*(Perfect|Excellent|Great|Now|Good)/i.test(first200)) {
      return "subagent_boilerplate";
    }
  }
  if (/^Investigated:/.test(content)) {
    if (hasRealLesson) return null;
    return "investigation_breadcrumb";
  }
  if (/^(Decision: )?Delegated:/.test(content)) {
    if (hasRealLesson) return null;
    return "delegation_log";
  }
  if (content.startsWith("[ENGRAM UNDERSTANDING]")) {
    return "engram_understanding_dump";
  }
  if (content.startsWith("Pre-compaction session summary") || content.startsWith("Claude is waiting")) {
    return "session_summary_noise";
  }
  if (/^Command:/.test(content)) {
    if (hasRealLesson) return null;
    return "command_output_log";
  }
  if (/^File .+contain.+code definitions/.test(content)) {
    return "file_definition_log";
  }
  if (/^(Refined hypothesis:|Narrowed search:|Pivoted hypothesis:)/.test(content)) {
    if (hasRealLesson) return null;
    return "hypothesis_breadcrumb";
  }
  if (/^Error '/.test(content) && /resolved\./.test(content)) {
    if (hasRealLesson) return null;
    return "error_resolved_breadcrumb";
  }
  if (/^debug chain:/.test(content)) {
    const isStepList = lesson != null && /^\d+\.\s*(Read|Bash|Grep|Glob):/.test(lesson);
    if (isStepList || !hasRealLesson) return "debug_chain_steps";
  }
  if (tags.includes("auto_encoded") && mem.confidence < 0.45 && !hasLesson && !hasRealLesson) {
    if (content.length < 100 || /^(Investigation across|Narrowed search|File )/.test(content)) {
      return "low_quality_auto_encoded";
    }
  }
  return null;
}
function runCleanup(dryRun = true) {
  const db = getDatabase();
  const result = {
    dry_run: dryRun,
    scanned: 0,
    deleted: 0,
    categories: {},
    samples: {},
    kept_with_value: 0
  };
  const rows = db.prepare(`
    SELECT * FROM memories
    WHERE type = 'episodic'
      AND pinned = 0
      AND flagged_for_pruning = 0
    ORDER BY created_at ASC
  `).all();
  const memories = rows.map((row) => rowToMemory(row));
  result.scanned = memories.length;
  for (const mem of memories) {
    const category = classifyNoise(mem);
    if (category == null) {
      result.kept_with_value++;
      continue;
    }
    result.categories[category] = (result.categories[category] ?? 0) + 1;
    if (!result.samples[category]) result.samples[category] = [];
    if (result.samples[category].length < 3) {
      result.samples[category].push(mem.content.substring(0, 120));
    }
    if (!dryRun) {
      deleteMemory(mem.id);
      result.deleted++;
    }
  }
  const synthRows = db.prepare(`
    SELECT * FROM memories
    WHERE type = 'semantic'
      AND tags LIKE '%"synthesis"%'
      AND tags LIKE '%"domain-knowledge"%'
      AND pinned = 0
    ORDER BY created_at DESC
  `).all();
  const synthMemories = synthRows.map((row) => rowToMemory(row));
  result.scanned += synthMemories.length;
  const newestByDomain = /* @__PURE__ */ new Map();
  for (const mem of synthMemories) {
    const domain = mem.domains[0] ?? "unknown";
    if (!newestByDomain.has(domain)) {
      newestByDomain.set(domain, mem);
      result.kept_with_value++;
    } else {
      result.categories["stale_synthesis"] = (result.categories["stale_synthesis"] ?? 0) + 1;
      if (!result.samples["stale_synthesis"]) result.samples["stale_synthesis"] = [];
      if (result.samples["stale_synthesis"].length < 3) {
        result.samples["stale_synthesis"].push(mem.content.substring(0, 120));
      }
      if (!dryRun) {
        deleteMemory(mem.id);
        result.deleted++;
      }
    }
  }
  if (isProjectDbAttached()) {
    try {
      const projRows = db.prepare(`
        SELECT * FROM project.memories
        WHERE type = 'episodic'
          AND pinned = 0
          AND flagged_for_pruning = 0
        ORDER BY created_at ASC
      `).all();
      const projMemories = projRows.map((row) => rowToMemory(row));
      result.scanned += projMemories.length;
      for (const mem of projMemories) {
        const category = classifyNoise(mem);
        if (category == null) {
          result.kept_with_value++;
          continue;
        }
        result.categories[category] = (result.categories[category] ?? 0) + 1;
        if (!result.samples[category]) result.samples[category] = [];
        if (result.samples[category].length < 3) {
          result.samples[category].push(`[project] ${mem.content.substring(0, 110)}`);
        }
        if (!dryRun) {
          db.prepare("DELETE FROM project.memories WHERE id = ?").run(mem.id);
          result.deleted++;
        }
      }
    } catch (e) {
      try {
        log.warn("Project DB cleanup pass failed", { error: String(e) });
      } catch {
      }
    }
  }
  if (!dryRun) {
    try {
      log.info(`Retroactive cleanup: deleted ${result.deleted}/${result.scanned} memories`);
    } catch {
    }
  }
  return result;
}
function rowToMemory(row) {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    summary: row.summary ?? void 0,
    token_count: row.token_count,
    summary_token_count: row.summary_token_count ?? 0,
    encoding_strength: row.encoding_strength,
    reinforcement: row.reinforcement,
    confidence: row.confidence,
    validation_count: row.validation_count,
    contradiction_count: row.contradiction_count,
    last_accessed: row.last_accessed,
    access_count: row.access_count,
    domains: JSON.parse(row.domains),
    version: row.version ?? void 0,
    tags: JSON.parse(row.tags),
    storage_tier: row.storage_tier,
    flagged_for_pruning: row.flagged_for_pruning === 1,
    pinned: row.pinned === 1,
    superseded_by: row.superseded_by ?? void 0,
    transformed_to: row.transformed_to ?? void 0,
    encoding_context: row.encoding_context ? JSON.parse(row.encoding_context) : void 0,
    type_data: row.type_data ? JSON.parse(row.type_data) : void 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    embedding: void 0
    // Don't load embedding for cleanup
  };
}

// src/tools/handlers.ts
function validateStringLength(value, maxLength) {
  if (!value) return null;
  if (value.length > maxLength) return null;
  return value;
}
function textResult(text) {
  return { content: [{ type: "text", text }] };
}
function jsonResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function handleRecall(args, config2) {
  const query = validateStringLength(args.query, INPUT.MAX_CONTENT_LENGTH);
  if (!query) return textResult("Query is required.");
  const maxTokens = Math.min(
    Math.max(args.max_tokens ?? config2.retrieval.default_token_budget, 1),
    INPUT.MAX_TOKEN_BUDGET
  );
  const result = recall(
    {
      query,
      context: args.context ? {
        project: args.context.project ?? null,
        framework: args.context.framework ?? null,
        version: args.context.version ?? null,
        task_type: args.context.task_type ?? null,
        current_error: args.context.current_error ?? null,
        current_files: args.context.current_files ?? []
      } : null,
      max_tokens: maxTokens
    },
    config2.retrieval
  );
  if (result.memories.length > 0) {
    for (const activated of result.memories) {
      const mem = activated.memory;
      const newReinforcement = retrievalReinforcement(mem.reinforcement);
      if (newReinforcement !== mem.reinforcement) {
        updateMemory(mem.id, {
          reinforcement: newReinforcement,
          last_accessed: now(),
          access_count: mem.access_count + 1
        });
      }
    }
  }
  recordRecallOutcome(
    result.activation_stats.seeds_found,
    result.memories.length,
    args.context?.framework ?? null
  );
  if (isObservationEnabled(config2)) {
    const domain = args.context?.framework ?? null;
    recordObservation("recall", domain, config2);
  }
  const filtered = result.memories.filter(
    (m) => !isRecallNoise(m.memory.content, m.memory.type, m.memory.tags)
  );
  if (filtered.length === 0) {
    return textResult("No relevant memories found.");
  }
  const sections = [];
  const antipatterns = filtered.filter((m) => m.memory.type === "antipattern");
  const semantic = filtered.filter((m) => m.memory.type === "semantic");
  const episodic = filtered.filter((m) => m.memory.type === "episodic");
  const procedural = filtered.filter((m) => m.memory.type === "procedural");
  if (antipatterns.length > 0) {
    sections.push("## Warnings (Antipatterns)\n" + antipatterns.map((m) => {
      const td = isAntipatternData(m.memory.type_data) ? m.memory.type_data : null;
      return `- [${td?.severity?.toUpperCase() ?? "WARN"}] ${m.memory.content}
  Fix: ${td?.fix ?? "N/A"}`;
    }).join("\n"));
  }
  if (semantic.length > 0) {
    sections.push("## Knowledge\n" + semantic.map((m) => {
      const td = isSemanticData(m.memory.type_data) ? m.memory.type_data : null;
      const srcProjects = td?.source_projects;
      const provenance = srcProjects && srcProjects.length > 0 ? ` (from: ${srcProjects.join(", ")})` : "";
      return `- ${m.memory.content} (confidence: ${m.memory.confidence.toFixed(2)})${provenance}`;
    }).join("\n"));
  }
  if (episodic.length > 0) {
    sections.push("## Relevant Experiences\n" + episodic.map((m) => {
      const td = m.memory.type_data;
      let line = `- ${m.memory.content}${td.lesson ? `
  Lesson: ${td.lesson}` : ""}`;
      if (td.outcome === "negative" && !td.lesson) {
        try {
          const resolution = findResolutionForError(m.memory.id);
          if (resolution) {
            const resLesson = isEpisodicData(resolution.type_data) && resolution.type_data.lesson;
            line += `
  Resolution: ${resLesson || resolution.content.substring(0, 200)}`;
          }
        } catch {
        }
      }
      try {
        const conns = getConnections(m.memory.id);
        const contradictions = conns.filter((c) => c.type === "contradicts");
        if (contradictions.length > 0) {
          const altId = contradictions[0].source_id === m.memory.id ? contradictions[0].target_id : contradictions[0].source_id;
          const alt = filtered.find((f) => f.memory.id === altId);
          if (alt) {
            line += `
  Alternative: ${alt.memory.content.substring(0, 150)}`;
          }
        }
      } catch {
      }
      return line;
    }).join("\n"));
  }
  if (procedural.length > 0) {
    sections.push("## Procedures\n" + procedural.map((m) => `- ${m.memory.content}`).join("\n"));
  }
  const header = `# Engram Memory (${filtered.length} memories, ${result.total_tokens} tokens)
`;
  return textResult(header + sections.join("\n\n"));
}
function handleEncode(args, config2, sessionId2) {
  const content = validateStringLength(args.content, INPUT.MAX_CONTENT_LENGTH);
  if (!content) return textResult("Content is required.");
  const memType = args.type;
  const domains = (args.domains ?? []).slice(0, INPUT.MAX_ARRAY_ITEMS);
  const version = args.version ?? null;
  const encodingStrength = args.encoding_strength ?? 0.7;
  const encodingContext = {
    project: null,
    framework: domains[0] ?? null,
    version,
    task_type: null,
    files: [],
    error_context: null,
    session_id: sessionId2,
    significance_score: encodingStrength
  };
  let typeData;
  switch (memType) {
    case "semantic":
      typeData = {
        kind: "semantic",
        knowledge_type: "convention",
        source: "user_instruction",
        source_episodes: [],
        applicable_versions: null,
        deprecated_in: null
      };
      break;
    case "antipattern":
      return handleEncodeAntipattern(args, config2, sessionId2);
    case "episodic":
      typeData = {
        kind: "episodic",
        context: { project: "", task: "", framework: "", version: "", files: [], models: [] },
        outcome: "neutral",
        outcome_detail: "",
        lesson: null,
        lesson_validated: false,
        emotional_weight: 0.3
      };
      break;
    default:
      typeData = {
        kind: "procedural",
        steps: [],
        preconditions: [],
        postconditions: [],
        practice_count: 0,
        automaticity: 0,
        variants: [],
        skill_metadata: null
      };
  }
  const existing = findDuplicate(content, memType, domains);
  if (existing) {
    strengthenExisting(existing);
    return jsonResult({
      status: "deduplicated",
      existing_memory_id: existing.id,
      message: "Similar memory already exists; strengthened instead of creating duplicate."
    });
  }
  const memory = createMemory({
    type: memType,
    content,
    summary: content.length > 100 ? content.substring(0, 100) + "..." : null,
    encoding_strength: encodingStrength,
    reinforcement: 1,
    confidence: 0.7,
    domains,
    version,
    tags: [],
    storage_tier: "short_term",
    pinned: false,
    encoding_context: encodingContext,
    type_data: typeData
  });
  if (args.version && domains.length > 0) {
    try {
      if (!getVersion(domains[0], args.version)) {
        registerVersion(domains[0], args.version, null);
      }
    } catch {
    }
  }
  try {
    const embedding = generateEmbedding(memory.content);
    storeEmbedding(memory.id, embeddingToBuffer(embedding));
  } catch {
  }
  if (isObservationEnabled(config2)) {
    recordObservation("encode", domains[0] ?? null, config2);
  }
  addToWorkingMemory(memory.id);
  const preview = content.length > 80 ? content.substring(0, 80) + "..." : content;
  const recallHint = domains.length > 0 ? ` domain:${domains[0]}` : "";
  return jsonResult({
    status: "encoded",
    memory_id: memory.id,
    type: memory.type,
    encoding_strength: memory.encoding_strength,
    confirmation: `Encoded: "${preview}". This is now in long-term memory. Recall via engram_recall("${content.split(/[.!?\n]/)[0].substring(0, 50)}"${recallHint}).`
  });
}
function handleEncodeAntipattern(args, config2, sessionId2) {
  const severity = args.severity ?? "medium";
  const domains = args.domains ?? [];
  const memory = createAntipatternFromExperience(
    args.content,
    "See antipattern description for fix.",
    severity,
    domains,
    args.version ?? null,
    [],
    {
      project: null,
      framework: domains[0] ?? null,
      version: args.version ?? null,
      task_type: null,
      files: [],
      error_context: null,
      session_id: sessionId2,
      significance_score: 1
    }
  );
  try {
    const td = memory.type_data;
    autoCreateFromAntipattern(memory.id, td.trigger_keywords, domains[0] ?? "general", severity);
  } catch {
  }
  if (isObservationEnabled(config2)) {
    recordObservation("encode_antipattern", domains[0] ?? null, config2);
  }
  return jsonResult({
    status: "antipattern_created",
    memory_id: memory.id,
    severity: isAntipatternData(memory.type_data) ? memory.type_data.severity : "medium"
  });
}
function handleLearn(args, config2, sessionId2) {
  const action = validateStringLength(args.action, INPUT.MAX_CONTENT_LENGTH);
  if (!action) return textResult("Action is required.");
  const lesson = validateStringLength(args.lesson, INPUT.MAX_CONTENT_LENGTH);
  if (!lesson) return textResult("Lesson is required.");
  const outcome = args.outcome;
  const domains = [];
  let version = null;
  if (args.context) {
    if (args.context.framework) domains.push(args.context.framework);
    version = args.context.version ?? null;
  }
  const content = `${action}
Outcome: ${args.outcome}${args.outcome_detail ? ` \u2014 ${args.outcome_detail}` : ""}
Lesson: ${lesson}`;
  const typeData = {
    kind: "episodic",
    context: {
      project: args.context?.project ?? "",
      task: action,
      framework: args.context?.framework ?? "",
      version: version ?? "",
      files: args.context?.files ?? [],
      models: []
    },
    outcome: outcome === "success" ? "positive" : outcome === "failure" ? "negative" : "neutral",
    outcome_detail: args.outcome_detail ?? "",
    lesson,
    // Gap B fix: validate lessons when user explicitly reports success or failure
    // (they're telling us the outcome — that IS validation)
    lesson_validated: outcome === "success" || outcome === "failure",
    emotional_weight: outcome === "failure" ? 0.8 : outcome === "success" ? 0.4 : 0.3
  };
  const memory = createMemory({
    type: "episodic",
    content,
    summary: lesson,
    encoding_strength: outcome === "failure" ? 0.9 : 0.7,
    reinforcement: 1,
    confidence: 0.6,
    domains,
    version,
    tags: ["lesson", outcome],
    storage_tier: "short_term",
    pinned: false,
    encoding_context: {
      project: args.context?.project ?? null,
      project_path: null,
      framework: domains[0] ?? null,
      version,
      task_type: null,
      files: args.context?.files ?? [],
      error_context: outcome === "failure" ? args.outcome_detail ?? null : null,
      session_id: sessionId2,
      significance_score: outcome === "failure" ? 0.9 : 0.7
    },
    type_data: typeData
  });
  try {
    const embedding = generateEmbedding(memory.content);
    storeEmbedding(memory.id, embeddingToBuffer(embedding));
  } catch {
  }
  if (isObservationEnabled(config2)) {
    recordObservation("learn", domains[0] ?? null, config2);
  }
  addToWorkingMemory(memory.id);
  const result = {
    status: "learned",
    memory_id: memory.id,
    lesson,
    outcome
  };
  if (args.create_antipattern && outcome === "failure") {
    const ap = createAntipatternFromExperience(
      action,
      lesson,
      "high",
      domains,
      version,
      [],
      memory.encoding_context
    );
    result.antipattern_id = ap.id;
    result.antipattern_created = true;
    try {
      const td = ap.type_data;
      autoCreateFromAntipattern(ap.id, td.trigger_keywords, domains[0] ?? "general", "high");
    } catch {
    }
  }
  if (outcome === "failure" && lesson) {
    try {
      autoCreateFromLesson(memory.id, lesson, domains[0] ?? null);
    } catch {
    }
  }
  if (domains.length > 0) {
    try {
      const outcomeMap = { success: "positive", failure: "negative", partial: "neutral" };
      recordProgressionOutcome(domains[0], action, outcomeMap[outcome], args.outcome_detail ?? void 0);
    } catch {
    }
  }
  if (domains.length > 0 && outcome !== "partial") {
    try {
      const domainOutcome = outcome === "success" ? "positive" : "negative";
      recordDomainOutcome(domains[0], domainOutcome);
    } catch {
    }
  }
  const recallHint = domains.length > 0 ? ` domain:${domains[0]}` : "";
  const lessonPreview = lesson.length > 80 ? lesson.substring(0, 80) + "..." : lesson;
  result.confirmation = `Learned: "${lessonPreview}". This lesson is now in long-term memory. Recall via engram_recall("${action.substring(0, 40)}"${recallHint}).`;
  return jsonResult(result);
}
function handleImmuneCheck(args, config2) {
  const content = args.code ?? args.action ?? "";
  if (!content) {
    return textResult("No code or action provided to check.");
  }
  const result = checkAntipattern(
    content,
    args.domain ?? null,
    args.version ?? null,
    config2.immune
  );
  for (const match of result.matches) {
    recordImmuneOutcome(match.memory_id, true, args.domain ?? null);
  }
  if (isObservationEnabled(config2)) {
    recordObservation("immune_check", args.domain ?? null, config2);
  }
  if (!result.triggered) {
    return textResult("No antipattern matches found. Proceed safely.");
  }
  const warnings = result.matches.map(
    (m) => `[${m.severity.toUpperCase()}] ${m.trigger}
Fix: ${m.fix}
Confidence: ${m.confidence.toFixed(2)}
Domain: ${m.domain}`
  ).join("\n\n");
  const consensus = validateMultiPerspective(content, args.domain ?? null, args.version ?? null);
  const consensusLine = `
Validation Consensus: ${consensus.decision} (${(consensus.consensus * 100).toFixed(0)}% agreement, weighted confidence: ${consensus.weighted_confidence.toFixed(2)})`;
  return textResult(`## Antipattern Warnings

${warnings}${consensusLine}`);
}
function handleExperience(args, config2) {
  const topicFilter = args.topic?.toLowerCase() ?? null;
  try {
    if (args.from_version && !getVersion(args.domain, args.from_version)) {
      registerVersion(args.domain, args.from_version, null);
    }
    if (!getVersion(args.domain, args.version)) {
      registerVersion(args.domain, args.version, args.from_version ?? null);
    }
  } catch {
  }
  if (args.from_version) {
    const migration = getMigrationKnowledge(args.domain, args.from_version, args.version);
    let overrides = migration.overrides;
    let breakingChanges = migration.breakingChanges;
    if (topicFilter) {
      overrides = overrides.filter((o) => o.description.toLowerCase().includes(topicFilter));
      breakingChanges = breakingChanges.filter((o) => o.description.toLowerCase().includes(topicFilter));
    }
    if (overrides.length === 0 && breakingChanges.length === 0) {
      return textResult(`No migration knowledge found for ${args.domain} ${args.from_version} \u2192 ${args.version}${topicFilter ? ` (topic: ${args.topic})` : ""}.`);
    }
    const sections2 = [];
    if (breakingChanges.length > 0) {
      sections2.push("## Breaking Changes\n" + breakingChanges.map(
        (o) => `- [${o.type.toUpperCase()}] ${o.description}${o.old ? ` (was: ${o.old})` : ""}${o.new_value ? ` (now: ${o.new_value})` : ""}`
      ).join("\n"));
    }
    const nonBreaking = overrides.filter(
      (o) => o.type !== "breaking_change" && o.type !== "removal" && o.type !== "deprecation"
    );
    if (nonBreaking.length > 0) {
      sections2.push("## Other Changes\n" + nonBreaking.map((o) => `- [${o.type.toUpperCase()}] ${o.description}`).join("\n"));
    }
    if (isObservationEnabled(config2)) {
      recordObservation("experience", args.domain, config2);
    }
    return textResult(`# Migration: ${args.domain} ${args.from_version} \u2192 ${args.version}${topicFilter ? ` (topic: ${args.topic})` : ""}

${sections2.join("\n\n")}`);
  }
  const knowledge = getVersionKnowledge(args.domain, args.version);
  let filteredOverrides = knowledge.overrides;
  let filteredMemories = knowledge.memories;
  if (topicFilter) {
    filteredOverrides = filteredOverrides.filter((o) => o.description.toLowerCase().includes(topicFilter));
    filteredMemories = filteredMemories.filter((m) => m.content.toLowerCase().includes(topicFilter));
  }
  if (filteredMemories.length === 0 && filteredOverrides.length === 0) {
    return textResult(`No version knowledge found for ${args.domain} ${args.version}${topicFilter ? ` (topic: ${args.topic})` : ""}.`);
  }
  const sections = [];
  if (filteredOverrides.length > 0) {
    sections.push("## Version-Specific Changes\n" + filteredOverrides.map((o) => `- [${o.type.toUpperCase()}] ${o.description}`).join("\n"));
  }
  if (filteredMemories.length > 0) {
    sections.push("## Knowledge Base\n" + filteredMemories.map((m) => `- ${m.content} (v${m.version ?? "any"}, confidence: ${m.confidence.toFixed(2)})`).join("\n"));
  }
  if (isObservationEnabled(config2)) {
    recordObservation("experience", args.domain, config2);
  }
  return textResult(`# ${args.domain} v${args.version} (chain: ${knowledge.chain.join(" \u2192 ")})${topicFilter ? ` [topic: ${args.topic}]` : ""}

${sections.join("\n\n")}`);
}
function handleStrengthen(args, config2) {
  const memory = getMemory(args.memory_id);
  if (!memory) {
    return textResult(`Memory ${args.memory_id} not found.`);
  }
  if (memory.type === "antipattern") {
    const updated2 = strengthenAntipattern(args.memory_id);
    if (!updated2) return textResult("Failed to strengthen antipattern.");
    recordCalibration(args.memory_id, memory.confidence, true);
    return jsonResult({
      status: "antipattern_confirmed",
      memory_id: args.memory_id,
      confidence: { old: memory.confidence, new: updated2.confidence }
    });
  }
  const schedule = getReviewSchedule(memory);
  const isOverdue = schedule.overdue_days > 0;
  const newReinforcement = spacedRepetitionBoost(memory.reinforcement, isOverdue);
  const recon = reconsolidate(memory.confidence, newReinforcement, true);
  let updatedTypeData = memory.type_data;
  if (isEpisodicData(memory.type_data) && memory.type_data.lesson && !memory.type_data.lesson_validated) {
    updatedTypeData = { ...memory.type_data, lesson_validated: true };
  }
  const updated = updateMemory(args.memory_id, {
    reinforcement: recon.reinforcement,
    confidence: recon.confidence,
    validation_count: memory.validation_count + 1,
    last_accessed: now(),
    access_count: memory.access_count + 1,
    type_data: updatedTypeData
  });
  recordCalibration(args.memory_id, memory.confidence, true);
  if (isProceduralData(memory.type_data)) {
    recordPractice(args.memory_id, true);
  }
  if (isObservationEnabled(config2)) {
    recordObservation("strengthen", memory.domains[0] ?? null, config2);
  }
  return jsonResult({
    status: "strengthened",
    memory_id: args.memory_id,
    reinforcement: { old: memory.reinforcement, new: recon.reinforcement },
    confidence: { old: memory.confidence, new: recon.confidence }
  });
}
function handleWeaken(args, config2, sessionId2) {
  const memory = getMemory(args.memory_id);
  if (!memory) {
    return textResult(`Memory ${args.memory_id} not found.`);
  }
  if (memory.type === "antipattern") {
    const updated2 = handleFalsePositive(args.memory_id, args.correction ?? "", args.reason, config2.immune);
    if (!updated2) return textResult("Failed to weaken antipattern.");
    recordCalibration(args.memory_id, memory.confidence, false);
    return jsonResult({
      status: "antipattern_false_positive",
      memory_id: args.memory_id,
      reason: args.reason,
      confidence: { old: memory.confidence, new: updated2.confidence }
    });
  }
  const newConfidence = adjustConfidence(memory.confidence, false);
  const newReinforcement = Math.max(memory.reinforcement * 0.9, 0.1);
  const updated = updateMemory(args.memory_id, {
    reinforcement: newReinforcement,
    confidence: newConfidence,
    contradiction_count: memory.contradiction_count + 1
  });
  recordCalibration(args.memory_id, memory.confidence, false);
  if (isProceduralData(memory.type_data)) {
    recordPractice(args.memory_id, false);
  }
  if (isObservationEnabled(config2)) {
    recordObservation("weaken", memory.domains[0] ?? null, config2);
  }
  const result = {
    status: "weakened",
    memory_id: args.memory_id,
    reason: args.reason,
    confidence: { old: memory.confidence, new: newConfidence },
    reinforcement: { old: memory.reinforcement, new: newReinforcement }
  };
  if (args.correction) {
    const correctionMem = createMemory({
      type: "semantic",
      content: args.correction,
      summary: null,
      encoding_strength: 0.8,
      reinforcement: 1,
      confidence: 0.7,
      domains: memory.domains,
      version: memory.version,
      tags: ["correction"],
      storage_tier: "short_term",
      pinned: false,
      encoding_context: {
        project: null,
        project_path: null,
        framework: memory.domains[0] ?? null,
        version: memory.version,
        task_type: null,
        files: [],
        error_context: null,
        session_id: sessionId2,
        significance_score: 0.8
      },
      type_data: {
        kind: "semantic",
        knowledge_type: "convention",
        source: "user_instruction",
        source_episodes: [],
        applicable_versions: null,
        deprecated_in: null
      }
    });
    updateMemory(args.memory_id, { superseded_by: correctionMem.id });
    try {
      createConnection({
        source_id: correctionMem.id,
        target_id: args.memory_id,
        strength: 0.8,
        type: "supersedes"
      });
      createConnection({
        source_id: args.memory_id,
        target_id: correctionMem.id,
        strength: 0.6,
        type: "contradicts"
      });
    } catch {
    }
    result.correction_id = correctionMem.id;
  }
  return jsonResult(result);
}
function handleConsolidate(args, config2) {
  const type = args.type ?? "light";
  const result = runConsolidation(type, config2.consolidation, config2.decay);
  if (isObservationEnabled(config2)) {
    recordObservation(`consolidate_${type}`, null, config2);
  }
  return jsonResult({
    status: "consolidation_complete",
    type: result.type,
    duration_ms: new Date(result.completed_at).getTime() - new Date(result.started_at).getTime(),
    memories_replayed: result.memories_replayed,
    connections_created: result.connections_created,
    connections_strengthened: result.connections_strengthened,
    memories_promoted: result.memories_promoted,
    memories_pruned: result.memories_pruned,
    memories_archived: result.memories_archived,
    schemas_formed: result.schemas_formed
  });
}
function handleStats(args, config2, startTime2) {
  const stats = getStats();
  const detail = args.detail ?? "summary";
  if (detail === "summary") {
    return textResult(
      `Engram Memory Stats:
  Total memories: ${stats.total_memories}
  Connections: ${stats.total_connections}
  Schemas: ${stats.total_schemas}
  Avg confidence: ${stats.average_confidence.toFixed(2)}
  Cold storage: ${stats.cold_storage_count}
  Last consolidation: ${stats.last_consolidation ?? "never"}`
    );
  }
  if (detail === "health") {
    const health = buildHealthStats(stats, config2);
    if (startTime2) {
      health.uptime_s = Math.floor((Date.now() - startTime2) / 1e3);
    }
    const systemHealth = evaluateSystemHealth();
    const wmSize = getWorkingMemorySize();
    const primedCount = getPrimedNodeCount();
    const schedRunning = isSchedulerRunning();
    const schedRuns = getSchedulerRunCount();
    const statusIcon = health.status === "healthy" ? "OK" : health.status === "degraded" ? "WARN" : "CRIT";
    return textResult(
      `Engram Health Report [${statusIcon}]:
  Status: ${health.status}
  DB size: ${(health.db_size_bytes / 1024 / 1024).toFixed(1)}MB / ${(health.db_size_limit_bytes / 1024 / 1024).toFixed(0)}MB (${health.db_utilization_pct.toFixed(1)}%)
  Memories: ${health.memory_count} (${health.antipattern_count} antipatterns)
  Avg confidence: ${health.avg_confidence.toFixed(2)}
  Stale memories: ${health.stale_memory_count}
  Orphan connections: ${health.orphan_connection_count}
  Consolidation overdue: ${health.consolidation_overdue ? "YES" : "no"}
  Autonomic mode: ${health.autonomic_mode}
  Uptime: ${(health.uptime_s / 3600).toFixed(1)}h
  Recall hit rate: ${(systemHealth.recall_hit_rate * 100).toFixed(0)}%
  False positive rate: ${(systemHealth.false_positive_rate * 100).toFixed(0)}%
  Confidence calibration: ${systemHealth.confidence_calibration.toFixed(2)}
  Blind spots: ${systemHealth.blind_spots.length > 0 ? systemHealth.blind_spots.join(", ") : "none"}` + (systemHealth.retrieval_utility_rate >= 0 ? `
  Retrieval utility: ${(systemHealth.retrieval_utility_rate * 100).toFixed(0)}%` : "") + (systemHealth.recommendations.length > 0 ? `
  Recommendations:
${systemHealth.recommendations.map((r) => `    - ${r}`).join("\n")}` : "") + `
  Working memory: ${wmSize} items
  Primed nodes: ${primedCount}
  Scheduler: ${schedRunning ? "running" : "stopped"} (${schedRuns} runs)` + formatProjectSection()
    );
  }
  return jsonResult(stats);
}
function buildHealthStats(stats, config2) {
  const dbSize = getDatabaseSizeBytes(config2.storage.db_path);
  const dbLimit = config2.storage.max_db_size_mb * 1024 * 1024;
  const utilization = dbLimit > 0 ? dbSize / dbLimit * 100 : 0;
  const autonomic = getAutonomicState();
  const consolOverdue = stats.last_consolidation ? daysElapsed(stats.last_consolidation, now()) > 7 : stats.total_memories > 0;
  let status = "healthy";
  if (utilization > 90 || consolOverdue) status = "degraded";
  if (utilization > 95 || stats.average_confidence < 0.2) status = "critical";
  if (autonomic.mode === "sympathetic") status = status === "healthy" ? "degraded" : status;
  return {
    status,
    db_size_bytes: dbSize,
    db_size_limit_bytes: dbLimit,
    db_utilization_pct: utilization,
    memory_count: stats.total_memories,
    antipattern_count: stats.by_type.antipattern ?? 0,
    avg_confidence: stats.average_confidence,
    avg_retention: stats.average_durability,
    stale_memory_count: getStaleMemoryCount(),
    orphan_connection_count: getOrphanConnectionCount(),
    last_consolidation: stats.last_consolidation,
    consolidation_overdue: consolOverdue,
    autonomic_mode: autonomic.mode,
    uptime_s: 0
    // Filled by caller if needed
  };
}
function formatProjectSection() {
  try {
    const projects = getProjectDatabaseInfo();
    if (projects.length === 0) return "\n  Projects: none";
    const currentPath = getProjectDbPath();
    const totalSize = projects.reduce((sum, p) => sum + p.size_bytes, 0);
    const staleDays = 180;
    const staleCount = projects.filter((p) => {
      const age = Date.now() - new Date(p.last_modified).getTime();
      return age > staleDays * 24 * 60 * 60 * 1e3;
    }).length;
    const currentName = currentPath ? projects.find((p) => p.path === currentPath)?.name ?? "unknown" : "none";
    return `
  Projects: ${projects.length} (current: ${currentName}, total: ${(totalSize / 1024 / 1024).toFixed(1)}MB, stale: ${staleCount})`;
  } catch {
    return "";
  }
}
function handleRemind(args) {
  const trigger = validateStringLength(args.trigger_pattern, INPUT.MAX_CONTENT_LENGTH);
  if (!trigger) return textResult("Trigger pattern is required.");
  const action = validateStringLength(args.action, INPUT.MAX_CONTENT_LENGTH);
  if (!action) return textResult("Action is required.");
  const reminderParams = {
    trigger_pattern: trigger,
    action
  };
  if (args.domain !== void 0) reminderParams.domain = args.domain;
  if (args.priority !== void 0) reminderParams.priority = args.priority;
  if (args.max_fires !== void 0) reminderParams.max_fires = args.max_fires;
  const pm = createReminder(reminderParams);
  return jsonResult({
    status: "reminder_created",
    id: pm.id,
    trigger_pattern: pm.trigger_pattern,
    action: pm.action,
    domain: pm.domain,
    max_fires: pm.max_fires
  });
}
function handleListReminders(args) {
  const reminders = args.active_only === false ? getAllProspectiveMemories(args.domain ?? void 0) : getActiveProspectiveMemories(args.domain ?? void 0);
  const label = args.active_only === false ? "All" : "Active";
  if (reminders.length === 0) {
    return textResult(`No ${label.toLowerCase()} reminders.`);
  }
  const lines = reminders.map(
    (r) => `- [${r.id.substring(0, 8)}]${r.active ? "" : " (inactive)"} "${r.trigger_pattern}" \u2192 ${r.action}` + (r.domain ? ` (${r.domain})` : "") + ` fires: ${r.fire_count}${r.max_fires > 0 ? `/${r.max_fires}` : "/\u221E"}`
  );
  return textResult(`# ${label} Reminders (${reminders.length})
${lines.join("\n")}`);
}
function handleSetGoal(args) {
  const domain = validateStringLength(args.domain, INPUT.MAX_SHORT_STRING_LENGTH);
  const topic = validateStringLength(args.topic, INPUT.MAX_SHORT_STRING_LENGTH);
  if (!domain) return textResult("Domain is required.");
  if (!topic) return textResult("Topic is required.");
  const existing = getLearningGoalByDomainTopic(domain, topic);
  if (existing) {
    return textResult(`Goal already exists for "${domain}: ${topic}" (id: ${existing.id}, status: ${existing.status}).`);
  }
  const active = getActiveLearningGoals();
  if (active.length >= LEARNING_GOALS.MAX_ACTIVE_GOALS) {
    return textResult(`Maximum active goals (${LEARNING_GOALS.MAX_ACTIVE_GOALS}) reached. Complete or abandon existing goals first.`);
  }
  let currentConfidence = 0;
  try {
    const memories = getMemoriesByDomain(domain, 200);
    if (memories.length > 0) {
      currentConfidence = memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length;
    }
  } catch {
  }
  const goal = createLearningGoal({
    domain,
    topic,
    priority: args.priority ?? LEARNING_GOALS.USER_PRIORITY,
    reason: args.reason ?? "user_requested",
    target_confidence: args.target_confidence ?? LEARNING_GOALS.DEFAULT_TARGET_CONFIDENCE,
    current_confidence: currentConfidence,
    status: "active"
  });
  const progress = goal.target_confidence > 0 ? Math.min(100, Math.round(goal.current_confidence / goal.target_confidence * 100)) : 0;
  return textResult(
    `Learning goal created:
  Domain: ${goal.domain}
  Topic: ${goal.topic}
  Priority: ${goal.priority}
  Progress: ${progress}% \u2192 ${(goal.target_confidence * 100).toFixed(0)}%
  ID: ${goal.id}

Content matching this goal will be encoded more aggressively.`
  );
}
function handleListGoals(args) {
  let goals;
  if (args.include_completed) {
    goals = getAllLearningGoals();
    if (args.domain) {
      goals = goals.filter((g) => g.domain === args.domain);
    }
  } else {
    goals = getActiveLearningGoals(args.domain ?? void 0);
  }
  if (goals.length === 0) {
    return textResult("No learning goals found.");
  }
  const lines = goals.map((g) => {
    const progress = g.target_confidence > 0 ? Math.min(100, Math.round(g.current_confidence / g.target_confidence * 100)) : 0;
    const statusIcon = g.status === "achieved" ? "\u2713" : g.status === "abandoned" ? "\u2717" : "\u25CB";
    return `${statusIcon} [${g.id.substring(0, 8)}] ${g.domain}: ${g.topic} (${progress}% \u2192 ${(g.target_confidence * 100).toFixed(0)}%) p=${g.priority.toFixed(1)} [${g.reason}]`;
  });
  return textResult(`# Learning Goals (${goals.length})
${lines.join("\n")}`);
}
function handleSelf(args) {
  const { action, content } = args;
  switch (action) {
    case "view": {
      const model = getSelfModel();
      const lines = [
        `# Self-Model`,
        `Sessions: ${model.session_count} | Turns: ${model.total_turns} | Trust: ${Math.round(model.trust_level * 100)}%`
      ];
      const classifiedStrengths = model.strengths.filter(
        (s) => s.task_count >= IDENTITY.MIN_TASKS_FOR_CLASSIFICATION && s.proficiency >= IDENTITY.STRENGTH_THRESHOLD
      );
      if (classifiedStrengths.length > 0) {
        lines.push(`
## Strengths`);
        for (const s of classifiedStrengths) {
          lines.push(`- ${s.domain}: ${Math.round(s.proficiency * 100)}% (${s.success_count}/${s.task_count} tasks)`);
        }
      }
      if (model.weaknesses.length > 0) {
        lines.push(`
## Weaknesses`);
        for (const w of model.weaknesses) {
          lines.push(`- ${w.domain}: ${Math.round(w.proficiency * 100)}% (${w.success_count}/${w.task_count} tasks)`);
        }
      }
      if (model.user_preferences.length > 0) {
        lines.push(`
## User Preferences`);
        for (const p of model.user_preferences) {
          lines.push(`- [${p.source}] ${p.description} (strength: ${p.strength.toFixed(2)})`);
        }
      }
      if (model.communication_style) {
        lines.push(`
## Communication Style
${model.communication_style}`);
      }
      if (model.common_tasks.length > 0) {
        lines.push(`
## Common Tasks
${model.common_tasks.join(", ")}`);
      }
      if (model.ongoing_context) {
        lines.push(`
## Ongoing Context
${model.ongoing_context}`);
      }
      if (model.last_session_summary) {
        lines.push(`
## Last Session
${model.last_session_summary}`);
      }
      if (model.frustration_triggers.length > 0) {
        lines.push(`
## Frustration Triggers
${model.frustration_triggers.join("; ")}`);
      }
      if (model.satisfaction_triggers.length > 0) {
        lines.push(`
## Satisfaction Triggers
${model.satisfaction_triggers.join("; ")}`);
      }
      if (model.relationship && model.relationship.interaction_count > 0) {
        const rel = model.relationship;
        lines.push(`
## Relationship Profile`);
        const depthPct = Math.round(rel.relationship_depth * 100);
        const depthLabel = depthPct >= 70 ? "mature" : depthPct >= 40 ? "developing" : "new";
        lines.push(`Depth: ${depthPct}% (${depthLabel}) | Interactions: ${rel.interaction_count} | Correction rate: ${rel.correction_frequency.toFixed(3)}`);
        if (rel.topic_affinities.length > 0) {
          lines.push(`
### Topic Affinities`);
          for (const t of rel.topic_affinities.slice(0, 10)) {
            lines.push(`- ${t.topic}: freq=${t.frequency}, weight=${t.recency_weight.toFixed(2)}`);
          }
        }
        if (rel.communication_style) {
          const cs = rel.communication_style;
          lines.push(`
### Communication Style`);
          lines.push(`Verbosity: ${cs.verbosity} | Technical: ${cs.technical_level} | Directness: ${cs.directness} | Code-heavy: ${cs.code_heavy} (${cs.evidence_sessions} sessions)`);
        }
        if (rel.behavioral_preferences.length > 0) {
          lines.push(`
### Behavioral Patterns`);
          for (const p of rel.behavioral_preferences) {
            lines.push(`- ${p.pattern} (confidence: ${p.confidence.toFixed(2)}, ${p.evidence_sessions} sessions)`);
          }
        }
        if (rel.trust_trajectory.length >= 3) {
          const recent = rel.trust_trajectory.slice(-5);
          const first = recent[0].trust_level;
          const last = recent[recent.length - 1].trust_level;
          const trend = last > first + 0.02 ? "rising" : last < first - 0.02 ? "falling" : "stable";
          lines.push(`
### Trust Trajectory: ${trend} (${first.toFixed(2)} \u2192 ${last.toFixed(2)} over last ${recent.length} sessions)`);
        }
      }
      try {
        const masteryProfiles = getMasteryForDomain();
        if (masteryProfiles.length > 0) {
          lines.push(`
## Mastery Profiles (${masteryProfiles.length})`);
          for (const p of masteryProfiles.slice(0, 15)) {
            const level = p.level.replace("_", " ");
            lines.push(`- ${p.domain}/${p.skill}: ${level} (${Math.round(p.success_rate * 100)}% over ${p.practice_count} practices)`);
          }
          const overdue = getProfilesDueForReview();
          if (overdue.length > 0) {
            lines.push(`
### Due for Review (${overdue.length})`);
            for (const p of overdue.slice(0, 5)) {
              lines.push(`- ${p.domain}/${p.skill} (${p.level.replace("_", " ")}, last: ${p.last_practiced.substring(0, 10)})`);
            }
          }
        }
      } catch {
      }
      return textResult(lines.join("\n"));
    }
    case "set_preference": {
      if (!content) return textResult("Error: content is required for set_preference");
      updateFromInstruction(content);
      return textResult(`Preference recorded: "${content.substring(0, 100)}"`);
    }
    case "set_context": {
      if (!content) return textResult("Error: content is required for set_context");
      updateOngoingContext(content);
      return textResult(`Ongoing context updated: "${content.substring(0, 100)}"`);
    }
    case "set_style": {
      if (!content) return textResult("Error: content is required for set_style");
      getSelfModel();
      const truncated = content.substring(0, IDENTITY.MAX_STYLE_LENGTH);
      updateSelfModelField("communication_style", truncated);
      return textResult(`Communication style updated: "${truncated}"`);
    }
    default:
      return textResult(`Unknown action: ${action}. Valid: view, set_preference, set_context, set_style`);
  }
}
function handleVaccinate(args, config2, sessionId2) {
  const warning = validateStringLength(args.warning, INPUT.MAX_CONTENT_LENGTH);
  if (!warning) return textResult("Warning text is required.");
  const fix = validateStringLength(args.fix, INPUT.MAX_CONTENT_LENGTH);
  if (!fix) return textResult("Fix description is required.");
  const severity = args.severity;
  if (!["critical", "high", "medium"].includes(severity)) {
    return textResult("Severity must be: critical, high, or medium.");
  }
  const domains = (args.domains ?? []).slice(0, INPUT.MAX_ARRAY_ITEMS);
  if (domains.length === 0) return textResult("At least one domain is required.");
  const memory = vaccinate(warning, fix, severity, domains, args.version ?? null, sessionId2);
  if (isObservationEnabled(config2)) {
    recordObservation("vaccinate", domains[0] ?? null, config2);
  }
  return jsonResult({
    status: "vaccinated",
    memory_id: memory.id,
    severity,
    domains: memory.domains,
    confidence: memory.confidence
  });
}
function handleCleanup(args) {
  const dryRun = args.dry_run !== false;
  const result = runCleanup(dryRun);
  const totalNoise = Object.values(result.categories).reduce((a, b) => a + b, 0);
  return jsonResult({
    status: dryRun ? "dry_run_complete" : "cleanup_complete",
    scanned: result.scanned,
    noise_found: totalNoise,
    deleted: result.deleted,
    kept_with_value: result.kept_with_value,
    categories: result.categories,
    samples: result.samples
  });
}

// src/index.ts
setLogLevel(getEnvLogLevel());
var config = loadConfig();
ensureEngramDir();
initDatabase(config.storage);
try {
  const projectRoot = inferProjectPath(process.cwd());
  const projectDbPath = deriveProjectDbPath(projectRoot);
  initProjectDatabase(projectDbPath);
  log.info("Project database attached", { project: projectRoot });
} catch (e) {
  log.warn("Failed to attach project database, continuing with global DB only", { error: String(e) });
}
refreshIdfCache();
var sessionId = generateId();
var startTime = Date.now();
log.info("Engram v0.1.0 starting", { session: sessionId, db: config.storage.db_path });
var preWarm = preWarmActivation({
  framework: null,
  version: null,
  project: null,
  task_type: null
});
if (preWarm.memories_preloaded > 0 || preWarm.antipatterns_preloaded > 0) {
  log.info("Anticipatory pre-warm complete", {
    memories: preWarm.memories_preloaded,
    antipatterns: preWarm.antipatterns_preloaded
  });
}
if (config.auto_consolidate) {
  const intervalS = config.consolidation_interval_s ?? 3600;
  startScheduler(config, intervalS);
  log.info("Auto-consolidation enabled", { interval_s: intervalS });
}
var server = new McpServer(
  {
    name: "engram",
    version: "0.1.0"
  },
  {
    capabilities: {
      logging: {},
      resources: {},
      tools: {}
    }
  }
);
server.registerTool(
  "engram_recall",
  {
    title: "Recall Memories",
    description: "Retrieve relevant memories based on current context using spreading activation",
    inputSchema: z.object({
      query: z.string().describe("What you need to know. Be specific about domain, task, and version."),
      context: z.object({
        project: z.string().optional(),
        framework: z.string().optional(),
        version: z.string().optional(),
        task_type: z.enum(["debugging", "building", "refactoring", "reviewing", "migrating"]).optional(),
        current_error: z.string().optional(),
        current_files: z.array(z.string()).optional()
      }).optional(),
      max_tokens: z.number().optional().describe("Maximum tokens to return. Default: 2000")
    })
  },
  async (args) => handleRecall(args, config)
);
server.registerTool(
  "engram_encode",
  {
    title: "Encode Memory",
    description: "Encode a new memory with specified type and domain",
    inputSchema: z.object({
      content: z.string().describe("The knowledge to remember"),
      type: z.enum(["semantic", "episodic", "procedural", "antipattern"]).describe("Memory type"),
      domains: z.array(z.string()).optional().describe('Relevant domains (e.g., ["odoo", "python"])'),
      version: z.string().optional().describe("Framework version if applicable"),
      severity: z.enum(["critical", "high", "medium"]).optional().describe("For antipatterns: threat severity"),
      encoding_strength: z.number().min(0).max(1).optional().describe("Override significance score (0.0-1.0)")
    })
  },
  async (args) => handleEncode(args, config, sessionId)
);
server.registerTool(
  "engram_learn",
  {
    title: "Learn from Experience",
    description: "Record an experience: what happened and what was learned",
    inputSchema: z.object({
      action: z.string().describe("What was done"),
      outcome: z.enum(["success", "failure", "partial"]).describe("What happened"),
      outcome_detail: z.string().optional().describe("Specific details of the outcome"),
      lesson: z.string().describe("The generalized takeaway"),
      context: z.object({
        project: z.string().optional(),
        framework: z.string().optional(),
        version: z.string().optional(),
        files: z.array(z.string()).optional()
      }).optional(),
      create_antipattern: z.boolean().optional().describe("Whether to create an antipattern from this failure")
    })
  },
  async (args) => handleLearn(args, config, sessionId)
);
server.registerTool(
  "engram_immune_check",
  {
    title: "Immune Check",
    description: "Check code or action against known antipatterns (immune memory)",
    inputSchema: z.object({
      code: z.string().optional().describe("Code snippet to check"),
      action: z.string().optional().describe("Proposed action to check"),
      domain: z.string().optional().describe("Domain context for the check"),
      version: z.string().optional().describe("Version context")
    })
  },
  async (args) => handleImmuneCheck(args, config)
);
server.registerTool(
  "engram_experience",
  {
    title: "Version Experience",
    description: "Get version-specific knowledge, deprecations, and migration info",
    inputSchema: z.object({
      domain: z.string().describe('Framework/language (e.g., "odoo", "python")'),
      version: z.string().describe("Target version"),
      from_version: z.string().optional().describe("Source version (for migration guides)"),
      topic: z.string().optional().describe("Specific topic to query")
    })
  },
  async (args) => handleExperience(args, config)
);
server.registerTool(
  "engram_strengthen",
  {
    title: "Strengthen Memory",
    description: "Reinforce a memory that was correctly applied (reconsolidation)",
    inputSchema: z.object({
      memory_id: z.string().describe("ID of the memory to strengthen"),
      reason: z.string().optional().describe("Why this memory was correct")
    })
  },
  async (args) => handleStrengthen(args, config)
);
server.registerTool(
  "engram_weaken",
  {
    title: "Weaken Memory",
    description: "Reduce confidence in a memory that was found incorrect",
    inputSchema: z.object({
      memory_id: z.string().describe("ID of the memory to weaken"),
      reason: z.string().describe("Why this memory was incorrect"),
      correction: z.string().optional().describe("The correct information")
    })
  },
  async (args) => handleWeaken(args, config, sessionId)
);
server.registerTool(
  "engram_consolidate",
  {
    title: "Consolidate",
    description: "Run a consolidation cycle (light/full/deep)",
    inputSchema: z.object({
      type: z.enum(["light", "full", "deep"]).optional().describe("Consolidation depth. Default: light")
    })
  },
  async (args) => handleConsolidate(args, config)
);
server.registerTool(
  "engram_stats",
  {
    title: "Memory Stats",
    description: "Get memory system health and statistics",
    inputSchema: z.object({
      detail: z.enum(["summary", "detailed", "health"]).optional().describe("Detail level. Default: summary")
    })
  },
  async (args) => handleStats(args, config, startTime)
);
server.registerTool(
  "engram_remind",
  {
    title: "Create Reminder",
    description: 'Create a prospective memory: "when I see X, remind me to do Y"',
    inputSchema: z.object({
      trigger_pattern: z.string().describe("Keywords/pattern that should trigger this reminder"),
      action: z.string().describe("What to remind about when triggered"),
      domain: z.string().optional().describe("Domain scope (only fires in this domain)"),
      priority: z.number().min(0).max(1).optional().describe("Priority 0-1. Default: 0.5"),
      max_fires: z.number().optional().describe("Max times to fire. 0 = unlimited. Default: 0")
    })
  },
  async (args) => handleRemind(args)
);
server.registerTool(
  "engram_list_reminders",
  {
    title: "List Reminders",
    description: "List active prospective memories (reminders)",
    inputSchema: z.object({
      domain: z.string().optional().describe("Filter by domain"),
      active_only: z.boolean().optional().describe("Only show active reminders. Default: true")
    })
  },
  async (args) => handleListReminders(args)
);
server.registerTool(
  "engram_set_goal",
  {
    title: "Set Learning Goal",
    description: "Create a learning goal to prioritize knowledge acquisition in a domain/topic. Content matching learning goals gets encoded more aggressively.",
    inputSchema: z.object({
      domain: z.string().describe('Domain to learn about (e.g., "odoo", "typescript", "docker")'),
      topic: z.string().describe('Specific topic within the domain (e.g., "OWL components", "async patterns")'),
      priority: z.number().min(0).max(1).optional().describe("Priority 0-1. Default: 1.0 (user goals)"),
      target_confidence: z.number().min(0).max(1).optional().describe("Target confidence to achieve. Default: 0.7"),
      reason: z.string().optional().describe("Why this goal matters")
    })
  },
  async (args) => handleSetGoal(args)
);
server.registerTool(
  "engram_list_goals",
  {
    title: "List Learning Goals",
    description: "View active learning goals and their progress",
    inputSchema: z.object({
      domain: z.string().optional().describe("Filter by domain"),
      include_completed: z.boolean().optional().describe("Include achieved/abandoned goals. Default: false")
    })
  },
  async (args) => handleListGoals(args)
);
server.registerTool(
  "engram_self",
  {
    title: "Self-Model",
    description: "View or update the persistent self-model (identity, preferences, trust, context)",
    inputSchema: z.object({
      action: z.enum(["view", "set_preference", "set_context", "set_style"]).describe("Action: view the self-model, or set preference/context/style"),
      content: z.string().optional().describe("Content for set_* actions (preference text, context description, or style description)")
    })
  },
  async (args) => handleSelf(args)
);
server.registerTool(
  "engram_vaccinate",
  {
    title: "Vaccinate",
    description: "Create an antipattern from known bad patterns or documentation warnings. Proactive immune learning without experiencing the error first.",
    inputSchema: z.object({
      warning: z.string().describe("The bad pattern or mistake to warn about"),
      fix: z.string().describe("How to fix or avoid the antipattern"),
      severity: z.enum(["critical", "high", "medium"]).describe("Threat severity"),
      domains: z.array(z.string()).describe('Relevant domains (e.g., ["odoo", "python"])'),
      version: z.string().optional().describe("Framework version if applicable")
    })
  },
  async (args) => handleVaccinate(args, config, sessionId)
);
server.registerTool(
  "engram_cleanup",
  {
    title: "Cleanup",
    description: "Retroactive noise removal. Scans existing memories and removes low-quality entries (subagent boilerplate, investigation breadcrumbs, raw command logs). Safe by default: dry_run=true shows what would be deleted.",
    inputSchema: z.object({
      dry_run: z.boolean().optional().describe("Preview mode (default true). Set to false to actually delete.")
    })
  },
  async (args) => handleCleanup(args)
);
function param(params, key) {
  const v = params[key];
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}
server.registerResource(
  "domain-context",
  new ResourceTemplate("engram://context/{domain}", {
    list: async () => ({ resources: [] })
  }),
  {
    title: "Domain Context",
    description: "Automatically retrieved memories for a domain",
    mimeType: "text/plain"
  },
  async (uri, params) => {
    const domain = param(params, "domain");
    const memories = getMemoriesByDomain(domain, 20);
    const text = memories.length > 0 ? memories.map((m) => `[${m.type}] ${m.content} (confidence: ${m.confidence.toFixed(2)})`).join("\n") : `No memories found for domain: ${domain}`;
    return { contents: [{ uri: uri.href, text, mimeType: "text/plain" }] };
  }
);
server.registerResource(
  "domain-antipatterns",
  new ResourceTemplate("engram://antipatterns/{domain}", {
    list: async () => ({ resources: [] })
  }),
  {
    title: "Domain Antipatterns",
    description: "All known antipatterns for a domain",
    mimeType: "text/plain"
  },
  async (uri, params) => {
    const domain = param(params, "domain");
    const antipatterns = getAntipatterns(domain);
    const text = antipatterns.length > 0 ? antipatterns.map((m) => {
      const td = isAntipatternData(m.type_data) ? m.type_data : null;
      return `[${td?.severity?.toUpperCase() ?? "WARN"}] ${m.content}
Fix: ${td?.fix ?? "N/A"}`;
    }).join("\n\n") : `No antipatterns found for domain: ${domain}`;
    return { contents: [{ uri: uri.href, text, mimeType: "text/plain" }] };
  }
);
server.registerResource(
  "version-knowledge",
  new ResourceTemplate("engram://version/{domain}/{version}", {
    list: async () => ({ resources: [] })
  }),
  {
    title: "Version Knowledge",
    description: "Version-specific knowledge including deprecations and changes",
    mimeType: "text/plain"
  },
  async (uri, params) => {
    const domain = param(params, "domain");
    const version = param(params, "version");
    const knowledge = getVersionKnowledge(domain, version);
    const parts = [];
    if (knowledge.overrides.length > 0) {
      parts.push("Overrides:\n" + knowledge.overrides.map((o) => `- [${o.type}] ${o.description}`).join("\n"));
    }
    if (knowledge.memories.length > 0) {
      parts.push("Knowledge:\n" + knowledge.memories.map((m) => `- ${m.content}`).join("\n"));
    }
    const text = parts.length > 0 ? `${domain} v${version} (chain: ${knowledge.chain.join(" \u2192 ")})

${parts.join("\n\n")}` : `No version knowledge found for ${domain} ${version}`;
    return { contents: [{ uri: uri.href, text, mimeType: "text/plain" }] };
  }
);
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Engram MCP server running on stdio");
}
function shutdown() {
  log.info("Engram shutting down...");
  stopScheduler();
  closeDatabase();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
if (process.platform === "win32") {
  process.on("SIGHUP", shutdown);
  process.stdin.on("end", shutdown);
  process.stdin.resume();
}
main().catch((error) => {
  log.error("Fatal error", { error: String(error) });
  stopScheduler();
  closeDatabase();
  process.exit(1);
});
//# sourceMappingURL=index.js.map