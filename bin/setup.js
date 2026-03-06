#!/usr/bin/env node

/**
 * Engram MCP Setup Script
 *
 * Configures Claude Code to use Engram as its cognitive memory system.
 * Run: npx engram-setup
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

const ENGRAM_DIR = join(homedir(), '.engram');
const ENGRAM_DB = join(ENGRAM_DIR, 'engram.db');
const CLAUDE_DIR = join(homedir(), '.claude');
const CLAUDE_SETTINGS = join(CLAUDE_DIR, 'settings.json');

const INDEX_JS = resolve(packageRoot, 'dist', 'index.js');
const HOOK_JS = resolve(packageRoot, 'dist', 'hook.js');

// ============================================================
// Helpers
// ============================================================

function log(msg) { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function info(msg) { console.log(`  → ${msg}`); }

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJsonFile(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ============================================================
// Setup Steps
// ============================================================

console.log('\n🧠 Engram MCP — Setup\n');

// 1. Create ~/.engram directory
if (!existsSync(ENGRAM_DIR)) {
  mkdirSync(ENGRAM_DIR, { recursive: true });
  log(`Created ${ENGRAM_DIR}`);
} else {
  log(`${ENGRAM_DIR} already exists`);
}

// 2. Verify dist files exist
if (!existsSync(INDEX_JS)) {
  console.error(`\n  ✗ Cannot find ${INDEX_JS}`);
  console.error('    Make sure engram-mcp is properly installed.\n');
  process.exit(1);
}
log('Dist files verified');

// 3. Create/update Claude Code settings
if (!existsSync(CLAUDE_DIR)) {
  mkdirSync(CLAUDE_DIR, { recursive: true });
  log(`Created ${CLAUDE_DIR}`);
}

let settings = readJsonFile(CLAUDE_SETTINGS) || {};

// 3a. Add MCP server config
if (!settings.mcpServers) settings.mcpServers = {};

if (settings.mcpServers.engram) {
  warn('MCP server "engram" already configured — updating path');
}

settings.mcpServers.engram = {
  command: 'node',
  args: [INDEX_JS],
  env: {
    ENGRAM_DB_PATH: ENGRAM_DB,
    ENGRAM_LOG_LEVEL: 'info',
    ENGRAM_AUTO_CONSOLIDATE: 'true',
    ENGRAM_CONSOLIDATION_INTERVAL: '86400',
  },
};
log('MCP server configured');

// 3b. Add hook entries
if (!settings.hooks) settings.hooks = {};

const hookEvents = [
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'SubagentStop',
];

const stdinHookEvents = [
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'PreCompact',
  'PostCompact',
];

// Build hook command
const hookCmd = `node ${HOOK_JS}`;

for (const event of hookEvents) {
  if (!settings.hooks[event]) settings.hooks[event] = [];
  const existing = settings.hooks[event].find(h =>
    h.command && h.command.includes('engram') || h.command && h.command.includes('hook.js')
  );
  if (!existing) {
    settings.hooks[event].push({
      type: 'command',
      command: `${hookCmd} ${event.replace(/([A-Z])/g, (m, c, i) => i > 0 ? '-' + c.toLowerCase() : c.toLowerCase())}`,
    });
  }
}

for (const event of stdinHookEvents) {
  if (!settings.hooks[event]) settings.hooks[event] = [];
  const existing = settings.hooks[event].find(h =>
    h.command && h.command.includes('engram') || h.command && h.command.includes('hook.js')
  );
  if (!existing) {
    settings.hooks[event].push({
      type: 'command',
      command: `${hookCmd} ${event.replace(/([A-Z])/g, (m, c, i) => i > 0 ? '-' + c.toLowerCase() : c.toLowerCase())}`,
      input: 'stdin',
    });
  }
}

log('Hook entries configured');

// 4. Write settings
writeJsonFile(CLAUDE_SETTINGS, settings);
log(`Settings written to ${CLAUDE_SETTINGS}`);

// 5. Print summary
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Engram is ready.

  Database:   ${ENGRAM_DB}
  MCP Server: ${INDEX_JS}
  Hook:       ${HOOK_JS}

  Start a new Claude Code session to activate.
  Engram will automatically:
    • Recall relevant memories on each prompt
    • Encode errors, decisions, and discoveries
    • Surface antipattern warnings before writes
    • Preserve context across compactions
    • Learn from cross-session error resolution

  Tools available in Claude Code:
    engram_recall    — search your memory
    engram_encode    — store knowledge
    engram_learn     — record an experience
    engram_stats     — check memory health

  For more: https://github.com/vedtechsolutions/engram-mcp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
