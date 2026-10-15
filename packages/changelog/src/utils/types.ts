/** Shared types for the changelog pipeline. */

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
    text: string;
    /** Description paragraphs; each becomes one nested bullet with wrapped continuations. */
    bodyParagraphs: string[][];
}

/** A `## <version>` section parsed out of an existing changelog. */
export interface ExistingEntry {
    version: string;
    bullets: string[];
}
