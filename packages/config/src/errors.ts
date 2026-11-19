/** A validation problem raised by the runtime config parser. */
export class ConfigParseError extends Error {
    /** The schema issues / collected problems, when available. */
    readonly issues: unknown[];

    constructor(message: string, issues: unknown[] = []) {
        super(message);
        this.name = 'ConfigParseError';
        this.issues = issues;
    }
}
