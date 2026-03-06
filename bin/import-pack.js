#!/usr/bin/env node

/**
 * Engram Knowledge Pack Importer
 *
 * Usage:
 *   node bin/import-pack.js <pack-file-or-name>
 *   npx @vedtechsolutions/engram-mcp import-pack typescript-patterns
 *
 * Reads a JSON knowledge pack and imports memories into the Engram database.
 * Skips duplicates via content similarity check.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = join(__dirname, '..', 'packs');

function usage() {
  console.log(`
  Engram Knowledge Pack Importer

  Usage:
    engram-import-pack <pack>

  Where <pack> is one of:
    - A built-in pack name: claude-code-patterns, typescript-patterns, python-patterns
    - A path to a .json pack file

  Examples:
    engram-import-pack typescript-patterns
    engram-import-pack ./my-custom-pack.json
`);
  process.exit(1);
}

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === '--help' || arg === '-h') usage();

  // Resolve pack file path
  let packPath;
  if (existsSync(arg)) {
    packPath = resolve(arg);
  } else if (existsSync(join(PACKS_DIR, `${arg}.json`))) {
    packPath = join(PACKS_DIR, `${arg}.json`);
  } else {
    console.error(`  Error: Pack not found: ${arg}`);
    console.error(`  Available packs: ${listPacks().join(', ')}`);
    process.exit(1);
  }

  // Load pack
  let pack;
  try {
    pack = JSON.parse(readFileSync(packPath, 'utf-8'));
  } catch (e) {
    console.error(`  Error: Invalid JSON in ${packPath}: ${e.message}`);
    process.exit(1);
  }

  if (!pack.memories || !Array.isArray(pack.memories)) {
    console.error('  Error: Pack must have a "memories" array');
    process.exit(1);
  }

  console.log(`\n  Importing: ${pack.name ?? packPath}`);
  console.log(`  Memories: ${pack.memories.length}`);
  console.log();

  // Dynamic import of Engram modules (they need the DB initialized)
  const dbPath = resolve(
    process.env.ENGRAM_DB_PATH
    ?? join(process.env.HOME ?? '', '.engram', 'engram.db')
  );

  if (!existsSync(dirname(dbPath))) {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  // Initialize database
  const { initializeDatabase } = await import('../dist/chunk-AC6AZCP4.js');
  // Fallback: try to import from the compiled output
  let createMemory, searchMemories, generateEmbedding, embeddingToBuffer;
  try {
    const mod = await import('../dist/chunk-AC6AZCP4.js');
    createMemory = mod.createMemory;
    searchMemories = mod.searchMemories;
    generateEmbedding = mod.generateEmbedding;
    embeddingToBuffer = mod.embeddingToBuffer;
    // Init DB
    mod.initializeDatabase({ db_path: dbPath });
  } catch {
    console.error('  Error: Could not load Engram modules.');
    console.error('  Make sure you are running from the engram-mcp package directory.');
    process.exit(1);
  }

  let imported = 0;
  let skipped = 0;

  for (const entry of pack.memories) {
    const { type, content, domains, severity, tags } = entry;

    if (!type || !content) {
      console.log(`  SKIP (missing type or content): ${content?.substring(0, 60) ?? '(empty)'}`);
      skipped++;
      continue;
    }

    // Check for duplicates via keyword search
    try {
      const existing = searchMemories(content.substring(0, 100), 3);
      const isDuplicate = existing.some(m =>
        m.content === content ||
        (m.content.length > 50 && content.includes(m.content.substring(0, 50)))
      );
      if (isDuplicate) {
        console.log(`  SKIP (duplicate): ${content.substring(0, 60)}...`);
        skipped++;
        continue;
      }
    } catch { /* search failed, proceed with import */ }

    // Build type_data based on memory type
    let type_data;
    if (type === 'antipattern') {
      type_data = {
        kind: 'antipattern',
        pattern_description: content,
        correct_approach: null,
        severity: severity ?? 'medium',
        occurrences: 0,
        last_seen: null,
        auto_detected: false,
      };
    } else if (type === 'semantic') {
      type_data = {
        kind: 'semantic',
        knowledge_type: 'convention',
        source: 'knowledge_pack',
        source_episodes: [],
        applicable_versions: null,
        deprecated_in: null,
      };
    } else if (type === 'procedural') {
      type_data = {
        kind: 'procedural',
        steps: [],
        preconditions: [],
        postconditions: [],
        success_count: 0,
        failure_count: 0,
      };
    }

    try {
      createMemory({
        type,
        content,
        summary: null,
        encoding_strength: 0.7,
        reinforcement: 1.5,
        confidence: 0.8,
        domains: domains ?? [],
        version: null,
        tags: [...(tags ?? []), 'knowledge-pack', pack.name?.toLowerCase().replace(/\s+/g, '-') ?? 'custom'],
        storage_tier: 'long_term',
        pinned: false,
        type_data,
        encoding_context: {
          framework: domains?.[0] ?? null,
          version: null,
          project: null,
          project_path: null,
          task_type: null,
          files: [],
          error_context: null,
          session_id: `pack-import-${Date.now()}`,
          significance_score: 0.7,
        },
      });
      console.log(`  OK (${type}): ${content.substring(0, 60)}...`);
      imported++;
    } catch (e) {
      console.log(`  ERR: ${content.substring(0, 40)}... — ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n  Done. Imported: ${imported}, Skipped: ${skipped}`);
  console.log(`  Database: ${dbPath}\n`);
}

function listPacks() {
  try {
    const { readdirSync } = await import('node:fs');
    return readdirSync(PACKS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch {
    return ['claude-code-patterns', 'typescript-patterns', 'python-patterns'];
  }
}

main().catch(e => {
  console.error(`  Fatal: ${e.message}`);
  process.exit(1);
});
