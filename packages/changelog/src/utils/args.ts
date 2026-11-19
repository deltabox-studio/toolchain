import { parseArgs } from 'node:util';

import type { CliOptions } from '../types/index.js';

/** Parse the CLI argv into the pipeline options. */
export function parseArgsCli(argv: string[]): CliOptions {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            range: { type: 'string' },
            'dry-run': { type: 'boolean', default: false },
            version: { type: 'string' },
            'base-version': { type: 'string' },
            'release-notes': { type: 'string' },
            'processing-method': { type: 'string' },
            'format-only': { type: 'boolean', default: false },
            release: { type: 'boolean', default: false },
            'no-package-changes-section': { type: 'boolean', default: false },
            intro: { type: 'string' },
            'intro-file': { type: 'string' },
            outro: { type: 'string' },
            'outro-file': { type: 'string' },
        },
    });

    const processingMethod =
        values['processing-method']?.trim() ||
        process.env.CHANGELOG_PROCESSING_METHOD?.trim() ||
        'latest';

    const explicitRange = values.range ?? (positionals[0] as string | undefined);

    return {
        range: explicitRange ?? 'HEAD',
        rangeExplicit: explicitRange !== undefined,
        dryRun: values['dry-run'] ?? false,
        version: values.version,
        baseVersion: values['base-version'],
        releaseNotes: values['release-notes'],
        processingMethod,
        formatOnly: values['format-only'] ?? false,
        release: values.release ?? false,
        packageChanges: !(values['no-package-changes-section'] ?? false),
        ...(values.intro ? { intro: values.intro } : {}),
        ...(values['intro-file'] ? { introFile: values['intro-file'] } : {}),
        ...(values.outro ? { outro: values.outro } : {}),
        ...(values['outro-file'] ? { outroFile: values['outro-file'] } : {}),
    };
}
