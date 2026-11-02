/** Shared types for the changelog pipeline. */

import type {
    ChangelogAuthorInfo,
    ChangelogBreakingCommit,
    ChangelogBreakingSetting,
    ChangelogBumpRuleCallbackContext,
    ChangelogBumpRuleContext,
    ChangelogCommitFormatContext,
    ChangelogCommitFormatOptions,
    ChangelogCommitRecord,
    ChangelogGroupConfig,
    ChangelogGroupContext,
    ChangelogGroupEntry,
    ChangelogGroupHidden,
    ChangelogGroupItem,
    ChangelogGroupOrder,
    ChangelogGroupsContext,
    ChangelogGroupsSetting,
    ChangelogGroupTitle,
    ChangelogIssueInfo,
    ChangelogProvider,
    ChangelogProviderContext,
    ChangelogProviderSetting,
} from '@deltabox/toolchain-shared';

export type {
    ChangelogAuthorInfo,
    ChangelogBreakingCommit,
    ChangelogBreakingSetting,
    ChangelogBumpRuleCallbackContext,
    ChangelogBumpRuleContext,
    ChangelogCommitFormatContext,
    ChangelogCommitFormatOptions,
    ChangelogCommitRecord,
    ChangelogGroupConfig,
    ChangelogGroupContext,
    ChangelogGroupEntry,
    ChangelogGroupHidden,
    ChangelogGroupItem,
    ChangelogGroupOrder,
    ChangelogGroupsContext,
    ChangelogGroupsSetting,
    ChangelogGroupTitle,
    ChangelogIssueInfo,
    ChangelogProvider,
    ChangelogProviderContext,
    ChangelogProviderSetting,
};

export type BumpType = 'major' | 'minor' | 'patch';

export type ProcessingMethod = 'latest' | 'all' | string;

export type CommitRecord = ChangelogCommitRecord;

export type AuthorInfo = ChangelogAuthorInfo;

export type IssueInfo = ChangelogIssueInfo;

export interface CliOptions {
    range: string;
    dryRun: boolean;
    version?: string;
    baseVersion?: string;
    /** Print the release body for this version (and exit). */
    releaseNotes?: string;
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
export type CommitFormatOptions = ChangelogCommitFormatOptions;

export type CommitFormatContext = ChangelogCommitFormatContext;

/** A `## <version>` section parsed out of an existing changelog. */
export interface ExistingEntry {
    version: string;
    bullets: string[];
}
