import Database from 'better-sqlite3';

/**
 * Engram v2 PreToolUse Hook — Pitfall Check
 *
 * Surfaces relevant pitfalls before Write/Edit/Bash executes.
 * Advisory only — never blocks tool calls.
 */

interface PitfallCheckInput {
    tool_name: string;
    tool_input: Record<string, unknown>;
    cwd: string;
    session_id?: string;
}
interface PitfallCheckOutput {
    permissionDecision: 'allow';
    additionalContext?: string;
}
declare function run(input: PitfallCheckInput, db: Database.Database): PitfallCheckOutput;

export { type PitfallCheckInput, type PitfallCheckOutput, run };
