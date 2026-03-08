import Database from 'better-sqlite3';
import { a as SessionStartInput } from '../types-DvdQR6w6.js';

/**
 * Engram v2 SessionStart Hook
 *
 * Compiles and injects briefing on session start.
 * Handles: startup, compact, resume, clear.
 * Detects interrupted sessions.
 */

declare function run(input: SessionStartInput, db: Database.Database): string;

export { run };
