import { parseArgs } from 'node:util';

import type { CliOptions } from './types.js';

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
            'no-package-changes-section': { type: 'boolean', default: false },
        },
    });

    const processingMethod =
        values['processing-method']?.trim() ||
        process.env.CHANGELOG_PROCESSING_METHOD?.trim() ||
        'latest';

    return {
        range: values.range ?? (positionals[0] as string | undefined) ?? 'HEAD',
        dryRun: values['dry-run'] ?? false,
        version: values.version,
        baseVersion: values['base-version'],
        releaseNotes: values['release-notes'],
        processingMethod,
        formatOnly: values['format-only'] ?? false,
        packageChanges: !(values['no-package-changes-section'] ?? false),
    };
}
