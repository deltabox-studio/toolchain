import { sectionConfig, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { generateTsconfigs } from '../cli/generate/index.js';

/**
 * The `tsconfig` command. Defaults come from `dbx.config.tsconfig.*;
 * (via the command context); any CLI flag overrides them.
 */
export function tsconfigCommands(): ToolchainCommand[] {
    return [
        {
            name: 'tsconfig',
            description:
                'Generate workspace tsconfig.json files from tsconfig.default.json (aliases + references).',
            options: [
                { flags: '--cwd <dir>', description: 'Repo root to scan (default: cwd).' },
                { flags: '--no-aliases', description: 'Skip path aliases.' },
                { flags: '--composite', description: 'Emit composite + references.' },
                { flags: '--refs', description: 'Wire project references.' },
                { flags: '-i, --indent <n>', description: 'JSON indentation.' },
                { flags: '--glob <glob>', description: 'Glob for tsconfig.default.json files.' },
                { flags: '--app-glob <glob>', description: 'Glob for app override workspaces.' },
                { flags: '--root-file <file>', description: 'Monorepo tsconfig file name.' },
            ],
            run: (opts, context) => {
                const t = sectionConfig(context.config.tsconfig) ?? {};
                generateTsconfigs({
                    cwd: context.cwd,
                    aliases: (opts.aliases as boolean | undefined) ?? t.aliases ?? true,
                    composite: (opts.composite as boolean | undefined) ?? t.composite ?? false,
                    refs: (opts.refs as boolean | undefined) ?? t.refs ?? false,
                    indent:
                        opts.indent !== undefined
                            ? Number.parseInt(String(opts.indent), 10)
                            : t.indent,
                    glob: (opts.glob as string | undefined) ?? t.glob ?? '**/tsconfig.default.json',
                    appGlob:
                        (opts.appGlob as string | undefined) ??
                        t.appGlob ??
                        'apps/**/tsconfig.default.json',
                    monorepoTsconfigFilename:
                        (opts.rootFile as string | undefined) ??
                        t.rootFile ??
                        'tsconfig.monorepo.json',
                });
            },
        },
    ];
}
