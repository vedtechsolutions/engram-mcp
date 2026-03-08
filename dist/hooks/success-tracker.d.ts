import Database from 'better-sqlite3';

/**
 * Engram v2 PostToolUse Hook — Success Tracker
 *
 * Tracks successful Write/Edit operations after pitfalls were surfaced.
 * Boosts pitfall confidence on successful avoidance.
 * Detects self-corrections (same file edited twice quickly).
 * Runs async — does not block tool execution.
 */

interface SuccessTrackerInput {
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_response: unknown;
    cwd: string;
    session_id?: string;
}
interface SuccessTrackerOutput {
    selfCorrection?: boolean;
    pitfallsBoosted?: number;
}
interface EditRecord {
    filePath: string;
    timestamp: number;
}
declare function run(input: SuccessTrackerInput, db: Database.Database, lastEdit?: EditRecord): SuccessTrackerOutput;

export { type SuccessTrackerInput, type SuccessTrackerOutput, run };
