import Database from 'better-sqlite3';
import { S as SessionEndInput } from '../types-DvdQR6w6.js';

/**
 * Engram v2 SessionEnd Hook
 *
 * Fires on session exit. Transitions in_progress steps to blocked,
 * closes session record, cleans up old snapshots.
 */

declare function run(input: SessionEndInput, db: Database.Database): void;
/**
 * Promote project-scoped pitfalls to global (project=NULL) after they've
 * been validated across multiple sessions. A pitfall qualifies when:
 * 1. It belongs to this project (not already global)
 * 2. It has been recalled in N+ distinct sessions
 * 3. Its confidence is above the promotion threshold
 *
 * Also auto-merges: if the same pitfall was discovered independently
 * in another project, merge them into a single global pitfall.
 */
declare function promotePitfalls(db: Database.Database, project: string): number;

export { promotePitfalls, run };
