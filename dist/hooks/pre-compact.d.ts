import Database from 'better-sqlite3';
import { P as PreCompactInput } from '../types-DvdQR6w6.js';

/**
 * Engram v2 PreCompact Hook
 *
 * Fires before context compaction. Extracts transcript data,
 * saves compaction snapshot, updates plan step notes.
 */

declare function run(input: PreCompactInput, db: Database.Database): void;

export { run };
