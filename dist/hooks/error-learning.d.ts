import Database from 'better-sqlite3';

/**
 * Engram v2 PostToolUseFailure Hook — Error Learning
 *
 * Auto-encodes errors as pitfalls. Detects repeated mistakes.
 * Injects corrective context via additionalContext.
 */

interface ErrorLearningInput {
    tool_name: string;
    tool_input: Record<string, unknown>;
    error: string;
    is_interrupt: boolean;
    cwd: string;
    session_id?: string;
}
interface ErrorLearningOutput {
    additionalContext?: string;
    encoded?: boolean;
    strengthened?: boolean;
}
declare function run(input: ErrorLearningInput, db: Database.Database): ErrorLearningOutput;
declare function isNoiseError(error: string): boolean;
declare function classifyError(error: string): 'compilation' | 'test_failure' | 'runtime' | null;

export { type ErrorLearningInput, type ErrorLearningOutput, classifyError, isNoiseError, run };
