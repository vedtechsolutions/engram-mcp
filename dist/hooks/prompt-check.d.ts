import Database from 'better-sqlite3';

/**
 * Engram v2 UserPromptSubmit Hook — Prompt Check
 *
 * Detects user corrections and auto-encodes them.
 * Surfaces relevant pitfalls for the user's task.
 */

interface PromptCheckInput {
    content?: string;
    prompt?: string;
    cwd: string;
    session_id?: string;
}
interface PromptCheckOutput {
    additionalContext?: string;
    correctionEncoded?: boolean;
}
declare function run(input: PromptCheckInput, db: Database.Database): PromptCheckOutput;
declare function isCorrection(prompt: string): boolean;

export { type PromptCheckInput, type PromptCheckOutput, isCorrection, run };
