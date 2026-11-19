/** Options parsed from the `dbx changelog` command line. */
export interface CliOptions {
    range: string;
    /** Whether `--range` (or a positional range) was passed explicitly. */
    rangeExplicit: boolean;
    dryRun: boolean;
    version?: string;
    baseVersion?: string;
    /** Print the release body for this version (and exit). */
    releaseNotes?: string;
    processingMethod: ProcessingMethod;
    formatOnly: boolean;
    /** Release mode (uses the **Release notes** details wrapper). */
    release: boolean;
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
