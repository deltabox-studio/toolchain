/**
 * Typed `changelog` versioning/commit/provider callbacks. The runtime
 * implementation lives in `@deltabox/toolchain-changelog`; these shapes are
 * shared so `dbx.config.*` gets callback-aware types without a package cycle.
 */

import type { ChangelogBreakingSetting } from './changelog-breaking.js';
import type { Logger } from './logger.js';

/** The subset of a commit exposed to changelog callbacks. */
export interface ChangelogCommitRecord {
    hash: string;
    subject: string;
    body: string;
    author: string;
    authorEmail: string;
}

/** A resolved commit author. */
export interface ChangelogAuthorInfo {
    name: string;
    url?: string;
}

/** A resolved issue reference. */
export interface ChangelogIssueInfo {
    number: number;
    title?: string;
    url?: string;
}

/** Options for rendering a commit bullet/credit line. */
export interface ChangelogCommitFormatOptions {
    /** Include the `by <author>` credit (default true). */
    author?: boolean;
    /** Include the commit hash link (default true). */
    commitSha?: boolean;
    /** Include issue/fixes links (default true). */
    issues?: boolean;
    /** Prefix the author with their GitHub avatar (default false). */
    authorAvatar?: boolean;
    /** Fully custom commit line formatter (TS/JS configs only). */
    format?: (ctx: ChangelogCommitFormatContext) => string;
}

/** The context handed to a custom commit line formatter. */
export interface ChangelogCommitFormatContext {
    commit: ChangelogCommitRecord;
    repo?: string;
    author: ChangelogAuthorInfo;
    issues: ChangelogIssueInfo[];
    options: ChangelogCommitFormatOptions;
}

/** The context handed to a custom changelog provider. */
export interface ChangelogProviderContext {
    cwd: string;
    changelog?: unknown;
    records: ChangelogCommitRecord[];
}

/** A custom changelog provider. */
export interface ChangelogProvider {
    id: string;
    run: (ctx: ChangelogProviderContext) => string | void;
}

/** A built-in provider id, a custom provider, or a provider callback. */
export type ChangelogProviderSetting =
    | 'default'
    | 'changesets'
    | (string & {})
    | ChangelogProvider
    | ((ctx: ChangelogProviderContext) => string | void);

/** The context handed to custom bump-rule callbacks. */
export interface ChangelogBumpRuleContext {
    env: NodeJS.ProcessEnv;
    logger: Logger;
    packageJson?: Record<string, unknown>;
    /** How breaking changes are detected (default: Conventional Commits). */
    breaking?: ChangelogBreakingSetting;
}

/** The full context handed to a custom bump-rule callback. */
export interface ChangelogBumpRuleCallbackContext extends ChangelogBumpRuleContext {
    commit: ChangelogCommitRecord;
    level: 'major' | 'minor' | 'patch';
}
