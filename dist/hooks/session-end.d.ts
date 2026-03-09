import Database from 'better-sqlite3';
import { S as SessionEndInput } from '../types-DvdQR6w6.js';

/**
 * Engram v2 SessionEnd Hook
 *
 * Fires on session exit. Transitions in_progress steps to blocked,
 * closes session record, cleans up old snapshots.
 */

declare function run(input: SessionEndInput, db: Database.Database): void;

export { run };
