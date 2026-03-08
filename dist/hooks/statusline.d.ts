/**
 * Engram v2 StatusLine Script
 *
 * NOT a hook — configured in settings.json statusLine.
 * Reads context_window data, calculates mode, writes state file,
 * outputs display text for the CLI status bar.
 */
interface StatusLineInput {
    cwd?: string;
    session_id?: string;
    context_window?: {
        used_percentage?: number;
        context_window_size?: number;
    };
}
declare function run(input: StatusLineInput): string;

export { type StatusLineInput, run };
