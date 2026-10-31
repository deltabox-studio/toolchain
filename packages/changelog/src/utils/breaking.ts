import type { ChangelogBreakingSetting } from '@deltabox/toolchain-shared';

/** The commit fields breaking detection needs. */
export interface BreakingCommit {
    subject: string;
    body: string;
}

/** Conventional Commits: `type!:` or `type(scope)!:`. */
const SUBJECT_BREAKING = /^[a-zA-Z][a-zA-Z0-9]*(\([^)]*\))?!:/;

/** Conventional Commits: a `BREAKING CHANGE:` / `BREAKING-CHANGE:` footer line. */
const FOOTER_BREAKING = /^BREAKING[ -]CHANGE:/m;

/** Legacy loose detection, kept for `breaking: 'any'`. */
const ANY_BREAKING = /BREAKING[ -]CHANGE/i;

/**
 * Whether a commit is breaking, using the Conventional-Commits rules by default.
 * The `setting` lets a changelog config override the detection strategy.
 */
export function isBreakingCommit(
    commit: BreakingCommit,
    setting?: ChangelogBreakingSetting
): boolean {
    if (setting === false) return false;
    if (setting === undefined || setting === true || setting === 'conventional') {
        return SUBJECT_BREAKING.test(commit.subject) || FOOTER_BREAKING.test(commit.body);
    }
    if (setting === 'any') {
        return ANY_BREAKING.test(`${commit.subject}\n${commit.body}`);
    }
    if (typeof setting === 'function') {
        return Boolean(setting({ subject: commit.subject, body: commit.body }));
    }
    if (setting && typeof setting === 'object') {
        const text = `${commit.subject}\n${commit.body}`;
        if (typeof setting.pattern === 'string') {
            try {
                return new RegExp(setting.pattern, 'm').test(text);
            } catch {
                return false;
            }
        }
        if (typeof setting.match === 'string') return text.includes(setting.match);
    }
    return false;
}
