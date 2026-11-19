import type {
    ChangelogAuthorInfo,
    ChangelogCommitFormatContext,
    ChangelogCommitFormatOptions,
    ChangelogCommitRecord,
    ChangelogIssueInfo,
} from './config.js';

/** A semver bump kind derived from a commit range. */
export type BumpType = 'major' | 'minor' | 'patch';

export type CommitRecord = ChangelogCommitRecord;

export type AuthorInfo = ChangelogAuthorInfo;

export type IssueInfo = ChangelogIssueInfo;

/** A Conventional-Commits subject parsed into its parts. */
export interface ParsedCommit {
    type: string;
    scope?: string;
    breaking: boolean;
    /** Everything after the `type(scope):` prefix (subject + link/author suffix). */
    rest: string;
}

/** A list of parsed commits grouped by CC rule, then by scope. */
export interface GroupedRule {
    /** The CC type (or `breaking`) this section covers. */
    type: string;
    title: string;
    ungrouped: GroupedItem[];
    scopes: Map<string, GroupedItem[]>;
}

export interface GroupedItem {
    parsed: ParsedCommit;
    /** Whether this commit is breaking (subject `!` or a BREAKING CHANGE footer). */
    breaking?: boolean;
    text: string;
    /** Description paragraphs; each becomes one nested bullet with wrapped continuations. */
    bodyParagraphs: string[][];
}

/** Options for rendering a commit bullet/credit line. */
export type CommitFormatOptions = ChangelogCommitFormatOptions;

export type CommitFormatContext = ChangelogCommitFormatContext;

/** A `## <version>` section parsed out of an existing changelog. */
export interface ExistingEntry {
    version: string;
    bullets: string[];
    /** Nested description lines for each bullet (parallel to `bullets`). */
    bodies?: string[][];
    /** Text rendered before `<!-- release:start -->`. */
    intro?: string;
    /** Text rendered after `<!-- release:end -->`. */
    outro?: string;
    /** The literal `(Month Year)` heading suffix, kept when it cannot be re-derived. */
    date?: string;
}
