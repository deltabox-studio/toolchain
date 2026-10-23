import { sectionConfig, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { generateTsconfigs } from '../cli/generate/index.js';

/**
 * The `tsconfig` command. Defaults come from `dbx.config.tsconfig.*`
 * (via the command context); any CLI flag overrides them.
 */
export function tsconfigCommands(): ToolchainCommand[] {
    return [
        {
            name: 'tsconfig',
            description:
                'Generate workspace tsconfig.json files from the default tsconfig (aliases + references).',
            options: [
                { flags: '--cwd <dir>', description: 'Repo root to scan (default: cwd).' },
                { flags: '--no-aliases', description: 'Skip path aliases.' },
                { flags: '--composite', description: 'Emit composite + references.' },
                { flags: '--refs', description: 'Wire project references.' },
                { flags: '-i, --indent <n>', description: 'JSON indentation.' },
                {
                    flags: '--glob <glob...>',
                    description: 'Glob(s) for the default tsconfig files.',
                },
                {
                    flags: '--exclude <glob...>',
                    description: 'Glob(s) to exclude (on top of the common ignored paths).',
                },
                { flags: '--no-gitignore', description: 'Do not respect .gitignore files.' },
                { flags: '--default-file <file>', description: 'Default tsconfig file name.' },
                { flags: '--build-file <file>', description: 'Build tsconfig file name.' },
                { flags: '--root-file <file>', description: 'Workspaces tsconfig file name.' },
            ],
            run: (opts, context) => {
                const t = sectionConfig(context.config.tsconfig) ?? {};
                const glob = opts.glob as string[] | string | undefined;
                generateTsconfigs({
                    cwd: context.cwd,
                    aliases: (opts.aliases as boolean | undefined) ?? t.aliases ?? true,
                    composite: (opts.composite as boolean | undefined) ?? t.composite ?? false,
                    refs: (opts.refs as boolean | undefined) ?? t.refs ?? false,
                    indent:
                        opts.indent !== undefined
                            ? Number.parseInt(String(opts.indent), 10)
                            : t.indent,
                    glob: glob ?? t.glob ?? '**/tsconfig.default.json',
                    exclude: (opts.exclude as string[] | string | undefined) ?? t.exclude,
                    gitignore: (opts.gitignore as boolean | undefined) ?? t.gitignore,
                    defaultFile:
                        (opts.defaultFile as string | undefined) ??
                        t.defaultFile ??
                        'tsconfig.default.json',
                    buildFile:
                        (opts.buildFile as string | undefined) ??
                        t.buildFile ??
                        'tsconfig.build.json',
                    monorepoTsconfigFilename:
                        (opts.rootFile as string | undefined) ??
                        t.rootFile ??
                        'tsconfig.workspaces.json',
                });
            },
        },
    ];
}
