import fs from 'node:fs';
import path from 'node:path';

import {
    logger,
    regenerateEnabled,
    resolveToolchainEnabled,
    sectionConfig,
    type ToolchainCommand,
    type ToolchainTsconfigConfig,
    warningMessage,
    withSpinner,
} from '@deltabox/toolchain/shared';

import { generateWorkspaceTsconfigs, parseTsconfigIndent } from '../cli/generate/index.js';
import { hasOverrideKeys, TSCONFIG_OVERRIDE_KINDS } from '../overrides.js';
import { resolveTsconfigAsync, serializeTsconfigAlias } from '../resolve.js';
import { restoreTsconfigOverrides } from '../snapshots.js';
import type { TsconfigOverrideKind, TsconfigOverrides } from '../types/index.js';

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
                    flags: '--flatten-remote-extends',
                    description:
                        'Inline compiler options inherited from a remote http(s) extends chain (existing settings win).',
                },
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
                // Validate eagerly so an invalid value never reaches
                // `JSON.stringify` (NaN produces minified output).
                const indent =
                    opts.indent !== undefined
                        ? parseTsconfigIndent(String(opts.indent))
                        : undefined;

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

                if (
                    opts.json !== true &&
                    selectors.length === 0 &&
                    (opts.root !== undefined ||
                        opts.tsconfig !== undefined ||
                        opts.extends === false)
                ) {
                    throw new Error(
                        '`--root`, `--tsconfig` and `--no-extends` require `--json`, `--alias`, `--paths` or `--references`.'
                    );
                }

                if (opts.json === true || selectors.length > 0) {
                    const configuredRoot = fs.existsSync(path.resolve(cwd, rootFile))
                        ? rootFile
                        : undefined;
                    const resolved = await resolveTsconfigAsync({
                        cwd,
                        root,
                        ...(opts.tsconfig
                            ? { tsconfig: opts.tsconfig as string }
                            : configuredRoot
                              ? { tsconfig: configuredRoot }
                              : {}),
                        ...(opts.extends === false ? { extends: false } : {}),
                        ...(t.overrides?.root ? { overrides: t.overrides.root } : {}),
                    });
                    const alias = resolved.alias.map(serializeTsconfigAlias);
                    const pick = (key: 'alias' | 'paths' | 'references') =>
                        key === 'alias' ? alias : resolved[key];
                    const output =
                        selectors.length === 0
                            ? {
                                  alias,
                                  paths: resolved.paths,
                                  references: resolved.references,
                              }
                            : selectors.length === 1
                              ? pick(selectors[0] as 'alias' | 'paths' | 'references')
                              : Object.fromEntries(
                                    selectors.map(key => [
                                        key,
                                        pick(key as 'alias' | 'paths' | 'references'),
                                    ])
                                );
                    logger.raw(JSON.stringify(output, null, 4));
                    return;
                }

                const overrides: Partial<ToolchainTsconfigConfig> = {};
                if (opts.aliases !== undefined) overrides.aliases = Boolean(opts.aliases);
                if (opts.composite !== undefined) overrides.composite = Boolean(opts.composite);
                if (opts.refs !== undefined) overrides.refs = Boolean(opts.refs);
                if (opts.flattenRemoteExtends !== undefined) {
                    overrides.flattenRemoteExtends = Boolean(opts.flattenRemoteExtends);
                }
                if (opts.auto !== undefined) overrides.auto = Boolean(opts.auto);
                if (opts.autoAliases !== undefined) {
                    overrides.aliasAuto = Boolean(opts.autoAliases);
                }
                if (opts.autoRefs !== undefined) overrides.refsAuto = Boolean(opts.autoRefs);
                if (opts.autoSrcDir !== undefined) overrides.autoSrcDir = String(opts.autoSrcDir);
                if (indent !== undefined) overrides.indent = indent;
                if (opts.glob !== undefined) overrides.glob = opts.glob as string[];
                if (opts.exclude !== undefined) overrides.exclude = opts.exclude as string[];
                if (opts.gitignore !== undefined) overrides.gitignore = Boolean(opts.gitignore);
                overrides.defaultFile = defaultFile;
                overrides.buildFile = buildFile;
                overrides.rootFile = rootFile;

                if (opts.restore === undefined) {
                    if (!resolveToolchainEnabled(context.config).enabled) {
                        logger.warn('toolchain is disabled; skipping tsconfig generation.');
                        return;
                    }
                    if (!regenerateEnabled(context.config.tsconfig)) {
                        logger.warn(
                            'toolchain.tsconfig.regenerate is false; skipping tsconfig generation.'
                        );
                        return;
                    }
                }

                const generated = await withSpinner(
                    () =>
                        generateWorkspaceTsconfigs({
                            cwd,
                            config: context.config,
                            overrides,
                        }),
                    {
                        start: 'Generating workspace tsconfigs...',
                        success: 'Generated workspace tsconfigs.',
                    }
                );
                if (generated.skipped) {
                    logger.warn(
                        'toolchain.tsconfig is not enabled in dbx.config; skipping the tsconfig task.'
                    );
                }
            },
        },
    ];
}
