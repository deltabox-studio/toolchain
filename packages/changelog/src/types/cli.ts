/** Options parsed from the `dbx changelog` command line. */
export interface CliOptions {
    range: string;
    /** Whether `--range` (or a positional range) was passed explicitly. */
    rangeExplicit: boolean;
    dryRun: boolean;
    version?: string;
    baseVersion?: string;
    /** Print the release body for this version (and exit). */
    releaseBody?: string;
    /** Group every version since the previous published release into one body. */
    releaseGroup?: boolean;
    /** Explicit lower boundary version/tag for a grouped release body. */
    releaseSince?: string;
    /** Let prerelease versions bound a grouped release body. */
    releaseIncludePrereleases?: boolean;
    processingMethod: ProcessingMethod;
    formatOnly: boolean;
    /** Wrap the generated entry in the **Release notes** details block. */
    releaseBodyWrap: boolean;
    /** Include the `### Package changes` footer (disable with --no-package-changes-section). */
    packageChanges: boolean;
    /** Inline intro text for the new entry. */
    intro?: string;
    /** File containing the intro text for the new entry. */
    introFile?: string;
    /** Inline outro text for the new entry. */
    outro?: string;
    /** File containing the outro text for the new entry. */
    outroFile?: string;
}

export type ProcessingMethod = 'latest' | 'all' | string;
