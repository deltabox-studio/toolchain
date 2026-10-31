/** Shared types for the changelog pipeline. */

import type {
    ChangelogGroupConfig,
    ChangelogGroupContext,
    ChangelogGroupEntry,
    ChangelogGroupHidden,
    ChangelogGroupItem,
    ChangelogGroupOrder,
    ChangelogGroupsContext,
    ChangelogGroupsSetting,
    ChangelogGroupTitle,
} from '@deltabox/toolchain-shared';

export type {
    ChangelogGroupConfig,
    ChangelogGroupContext,
    ChangelogGroupEntry,
    ChangelogGroupHidden,
    ChangelogGroupItem,
    ChangelogGroupOrder,
    ChangelogGroupsContext,
    ChangelogGroupsSetting,
    ChangelogGroupTitle,
};

export type BumpType = 'major' | 'minor' | 'patch';

export type ProcessingMethod = 'latest' | 'all' | string;

export interface CommitRecord {
    hash: string;
    subject: string;
    body: string;
    author: string;
    authorEmail: string;
}

export interface AuthorInfo {
    name: string;
    url?: string;
}

export interface IssueInfo {
    number: number;
    title?: string;
    url?: string;
}

export interface CliOptions {
    range: string;
    dryRun: boolean;
    version?: string;
    baseVersion?: string;
    processingMethod: ProcessingMethod;
    formatOnly: boolean;
    /** Include the `### Package changes` footer (disable with --no-package-changes-section). */
    packageChanges: boolean;
}

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
export interface CommitFormatOptions {
    /** Include the `by <author>` credit (default true). */
    author?: boolean;
    /** Include the commit hash link (default true). */
    commitSha?: boolean;
    /** Include issue/fixes links (default true). */
    issues?: boolean;
    /** Prefix the author with their GitHub avatar (default false). */
    authorAvatar?: boolean;
    /** Fully custom commit line formatter. */
    format?: (ctx: CommitFormatContext) => string;
}

export interface CommitFormatContext {
    commit: CommitRecord;
    repo?: string;
    author: AuthorInfo;
    issues: IssueInfo[];
    options: CommitFormatOptions;
}

/** A custom changelog provider. */
export interface ChangelogProviderContext {
    cwd: string;
    changelog?: unknown;
    records: CommitRecord[];
}

export interface ChangelogProvider {
    id: string;
    run: (ctx: ChangelogProviderContext) => string | void;
}

/** A `## <version>` section parsed out of an existing changelog. */
export interface ExistingEntry {
    version: string;
    bullets: string[];
}
