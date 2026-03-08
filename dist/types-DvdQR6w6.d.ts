/**
 * Engram v2 Types
 *
 * Simple types, fewer bugs (Principle #5).
 * 5 memory kinds. 3 sources. That's it.
 */

type HookSessionType = 'startup' | 'resume' | 'clear' | 'compact';
interface SessionStartInput {
    session_id: string;
    type: HookSessionType;
    cwd: string;
    transcript_path?: string;
}
interface PreCompactInput {
    session_id: string;
    cwd: string;
    transcript_path: string;
    trigger: 'manual' | 'auto';
    custom_instructions?: string;
}
interface SessionEndInput {
    session_id: string;
    cwd: string;
    reason: 'clear' | 'logout' | 'prompt_input_exit' | 'other';
}

export type { PreCompactInput as P, SessionEndInput as S, SessionStartInput as a };
