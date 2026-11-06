import {
    logger,
    sectionConfig,
    type ToolchainCommand,
    type ToolchainTsconfigConfig,
    warningMessage,
} from '@deltabox/toolchain/shared';

import { generateWorkspaceTsconfigs } from '../cli/generate/index.js';
import {
    hasOverrideKeys,
    TSCONFIG_OVERRIDE_KINDS,
    type TsconfigOverrideKind,
    type TsconfigOverrides,
} from '../overrides.js';
import { resolveTsconfig } from '../resolve.js';
import { restoreTsconfigOverrides } from '../snapshots.js';

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
                {
                    flags: '--auto',
                    description:
                        'Auto-wire the root workspaces tsconfig paths/references from the project graph (default false).',
                },
                {
                    flags: '--no-auto',
                    description:
                        'Only use the paths/references already in the root workspaces tsconfig.',
                },
                {
                    flags: '--auto-aliases',
                    description: 'Auto-wire path aliases (defaults to --auto).',
                },
                {
                    flags: '--no-auto-aliases',
                    description: 'Do not auto-wire path aliases.',
                },
                {
                    flags: '--auto-refs',
                    description: 'Auto-wire project references (defaults to --auto).',
                },
                {
                    flags: '--no-auto-refs',
                    description: 'Do not auto-wire project references.',
                },
                {
                    flags: '--auto-src-dir <dir>',
                    description:
                        'Source directory for auto entry points (default: the workspace tsconfig rootDir/baseUrl, then src).',
                },
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
                {
                    flags: '--tsconfig <file>',
                    description: 'Resolve this tsconfig instead of <root>/tsconfig.json.',
                },
                {
                    flags: '--root <dir>',
                    description: 'Root used to detect/resolve the tsconfig (default: cwd).',
                },
                {
                    flags: '--json',
                    description: 'Print the resolved { alias, paths, references } object.',
                },
                {
                    flags: '--alias',
                    description: 'Print only the resolved Vite/Vitest aliases.',
                },
                { flags: '--paths', description: 'Print only the resolved compilerOptions.paths.' },
                {
                    flags: '--references',
                    description: 'Print only the resolved project references.',
                },
                {
                    flags: '--no-extends',
                    description: 'Do not follow the tsconfig extends chain.',
                },
                {
                    flags: '--restore [kind]',
                    description:
                        'Remove the applied tsconfig overrides (all, or base|root|default|build) using the manifest snapshots.',
                },
            ],
            run: async (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const root = (opts.root as string | undefined) ?? cwd;
                const t = sectionConfig(context.config.tsconfig) ?? {};
                const defaultFile =
                    (opts.defaultFile as string | undefined) ??
                    t.defaultFile ??
                    'tsconfig.default.json';
                const buildFile =
                    (opts.buildFile as string | undefined) ?? t.buildFile ?? 'tsconfig.build.json';
                const rootFile =
                    (opts.rootFile as string | undefined) ??
                    t.rootFile ??
                    'tsconfig.workspaces.json';
                const selectors = (['alias', 'paths', 'references'] as const).filter(
                    key => opts[key] === true
                );

                const restore = opts.restore;
                if (restore !== undefined && restore !== false) {
                    const kind =
                        typeof restore === 'string' ? (restore as TsconfigOverrideKind) : undefined;
                    if (kind !== undefined && !TSCONFIG_OVERRIDE_KINDS.includes(kind)) {
                        throw new Error(
                            `invalid --restore kind "${kind}" (expected ${TSCONFIG_OVERRIDE_KINDS.join('|')}).`
                        );
                    }
                    const result = restoreTsconfigOverrides({
                        cwd,
                        ...(kind ? { kind } : {}),
                        warn: (message, id) => logger.warn(message, id),
                    });
                    logger.info(
                        result.restored.length > 0
                            ? `Restored ${result.restored.length} tsconfig file(s): ${result.restored.join(', ')}.`
                            : 'No tsconfig overrides to restore.'
                    );
                    // A still-configured override is applied again by the next sync.
                    const overrides: TsconfigOverrides = t.overrides ?? {};
                    const reapplied = result.kinds.filter(k => hasOverrideKeys(overrides[k]));
                    if (reapplied.length > 0) {
                        logger.warn(
                            warningMessage('tsconfig.restore-reapply', {
                                kinds: reapplied.join(', '),
                            }),
                            'tsconfig.restore-reapply'
                        );
                    }
                    return;
                }

                if (opts.json === true || selectors.length > 0) {
                    const resolved = resolveTsconfig({
                        cwd,
                        root,
                        ...(opts.tsconfig ? { tsconfig: opts.tsconfig as string } : {}),
                        ...(opts.extends === false ? { extends: false } : {}),
                    });
                    const output =
                        selectors.length === 0
                            ? resolved
                            : selectors.length === 1
                              ? resolved[selectors[0] as keyof typeof resolved]
                              : Object.fromEntries(selectors.map(key => [key, resolved[key]]));
                    logger.raw(
                        JSON.stringify(
                            output,
                            (_key, value) => (value instanceof RegExp ? String(value) : value),
                            4
                        )
                    );
                    return;
                }

                const overrides: Partial<ToolchainTsconfigConfig> = {};
                if (opts.aliases !== undefined) overrides.aliases = Boolean(opts.aliases);
                if (opts.composite !== undefined) overrides.composite = Boolean(opts.composite);
                if (opts.refs !== undefined) overrides.refs = Boolean(opts.refs);
                if (opts.auto !== undefined) overrides.auto = Boolean(opts.auto);
                if (opts.autoAliases !== undefined) {
                    overrides.aliasAuto = Boolean(opts.autoAliases);
                }
                if (opts.autoRefs !== undefined) overrides.refsAuto = Boolean(opts.autoRefs);
                if (opts.autoSrcDir !== undefined) overrides.autoSrcDir = String(opts.autoSrcDir);
                if (opts.indent !== undefined) {
                    overrides.indent = Number.parseInt(String(opts.indent), 10);
                }
                if (opts.glob !== undefined) overrides.glob = opts.glob as string[];
                if (opts.exclude !== undefined) overrides.exclude = opts.exclude as string[];
                if (opts.gitignore !== undefined) overrides.gitignore = Boolean(opts.gitignore);
                overrides.defaultFile = defaultFile;
                overrides.buildFile = buildFile;
                overrides.rootFile = rootFile;

                const generated = await generateWorkspaceTsconfigs({
                    cwd,
                    config: context.config,
                    overrides,
                });
                if (generated.skipped) {
                    logger.warn(
                        'toolchain.tsconfig is not enabled in dbx.config; skipping the tsconfig task.'
                    );
                }
            },
        },
    ];
}
