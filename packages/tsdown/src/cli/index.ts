import type { ToolchainCommand } from '@deltabox/toolchain-shared';

import { cleanup } from '../cleanup.js';

/**
 * The cleanup commands (`cleanup`, `cleanup:turbo`). The working directory
 * comes from `context.cwd` (the root the config was loaded from).
 */
export function cleanupCommands(): ToolchainCommand[] {
    return [
        {
            name: 'cleanup',
            description: 'Remove build artifacts (*.tsbuildinfo, dist/).',
            options: [
                { flags: '--cwd <dir>', description: 'Directory to clean (default: cwd).' },
                { flags: '--pattern <glob...>', description: 'Override the match globs.' },
            ],
            run: (opts, context) => {
                const patterns =
                    Array.isArray(opts.pattern) && opts.pattern.length
                        ? (opts.pattern as string[])
                        : ['**/*.tsbuildinfo', '**/dist/'];
                cleanup('build', patterns, { cwd: context.cwd });
            },
        },
        {
            name: 'cleanup:turbo',
            description: 'Remove the turbo cache (.turbo/).',
            options: [{ flags: '--cwd <dir>', description: 'Directory to clean (default: cwd).' }],
            run: (_opts, context) => {
                cleanup('turbo cache', ['**/.turbo/'], { cwd: context.cwd });
            },
        },
    ];
}
