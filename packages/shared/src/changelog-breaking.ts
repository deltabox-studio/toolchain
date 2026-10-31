/**
 * Typed `changelog.breaking` configuration. The runtime implementation lives in
 * `@deltabox/toolchain-changelog`; these shapes are shared so `dbx.config.*`
 * gets callback-aware types without a package cycle.
 */

/** The subset of a commit used to decide whether it is a breaking change. */
export interface ChangelogBreakingCommit {
    /** The Conventional-Commits subject. */
    subject: string;
    /** The commit body (including any footers). */
    body: string;
}

/**
 * How breaking changes are detected.
 *
 * - `conventional` (default): a `!` before the subject colon, or a
 *   `BREAKING CHANGE:` / `BREAKING-CHANGE:` footer line.
 * - `any`: legacy loose detection (any mention anywhere in the subject/body).
 * - `false`: disable breaking-change detection.
 * - `{ pattern }` / `{ match }`: a custom regex/substring against the subject
 *   and body.
 * - a callback: a custom predicate (TS/JS configs only).
 */
export type ChangelogBreakingSetting =
    | boolean
    | 'conventional'
    | 'any'
    | { pattern?: string; match?: string }
    | ((commit: ChangelogBreakingCommit) => boolean);
