import fs from 'node:fs';
import path from 'node:path';

import { createConfigEngine, type ConfigEngineCliProgram } from '@deltabox/toolchain/config';
import {
    logger,
    regenerateEnabled,
    resolveToolchainEnabled,
    section,
    sectionConfig,
    tsconfigConfigSchema,
    type ToolchainCommandContext,
    type ToolchainTsconfigConfig,
    warningMessage,
    withSpinner,
} from '@deltabox/toolchain/shared';

import { generateWorkspaceTsconfigs } from '../cli/generate/index.js';
import { hasOverrideKeys, TSCONFIG_OVERRIDE_KINDS } from '../overrides.js';
import { resolveTsconfigAsync, serializeTsconfigAlias } from '../resolve/index.js';
import { restoreTsconfigOverrides } from '../snapshots.js';
import type { TsconfigOverrideKind, TsconfigOverrides } from '../types/index.js';

/** The engine the `tsconfig` command derives config-backed flags from. */
const tsconfigCommandSchema = { tsconfig: section(tsconfigConfigSchema) };
const tsconfigCliEngine = createConfigEngine({
    schema: tsconfigCommandSchema,
    envPrefix: 'DBX_',
});
const tsconfigCliProgram: ConfigEngineCliProgram<
    typeof tsconfigCommandSchema,
    ToolchainCommandContext
> = tsconfigCliEngine.cli.program;

/**
 * The `tsconfig` command. Defaults come from `dbx.config.tsconfig.*`
 * (via the command context); any CLI flag overrides them.
 */
export function tsconfigCommands() {
    return tsconfigCliProgram.create(cmd => [
        cmd('tsconfig')
            .description(
                'Generate workspace tsconfig.json files from the default tsconfig (aliases + references).'
            )
            .option({ flags: '--cwd <dir>', description: 'Repo root to scan (default: cwd).' })
            .option({
                flags: '--auto',
                description:
                    'Auto-wire the root workspaces tsconfig paths/references from the project graph (default false).',
            })
            .option({
                flags: '--no-auto',
                description:
                    'Only use the paths/references already in the root workspaces tsconfig.',
            })
            .option({
                flags: '--auto-aliases',
                description: 'Auto-wire path aliases (defaults to --auto).',
            })
            .option({
                flags: '--no-auto-aliases',
                description: 'Do not auto-wire path aliases.',
            })
            .option({
                flags: '--auto-refs',
                description: 'Auto-wire project references (defaults to --auto).',
            })
            .option({
                flags: '--no-auto-refs',
                description: 'Do not auto-wire project references.',
            })
            .option({
                flags: '--tsconfig <file>',
                description: 'Resolve this tsconfig instead of <root>/tsconfig.json.',
            })
            .option({
                flags: '--root <dir>',
                description: 'Root used to detect/resolve the tsconfig (default: cwd).',
            })
            .option({
                flags: '--json',
                description: 'Print the resolved { alias, paths, references } object.',
            })
            .option({
                flags: '--alias',
                description: 'Print only the resolved Vite/Vitest aliases.',
            })
            .option({
                flags: '--paths',
                description: 'Print only the resolved compilerOptions.paths.',
            })
            .option({
                flags: '--references',
                description: 'Print only the resolved project references.',
            })
            .option({
                flags: '--no-extends',
                description: 'Do not follow the tsconfig extends chain.',
            })
            .option({
                flags: '--restore [kind]',
                description:
                    'Remove the applied tsconfig overrides (all, or base|root|default|build) using the manifest snapshots.',
            })
            .run(async ({ config, values: opts, context }) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const root = (opts.root as string | undefined) ?? cwd;
                const t = sectionConfig(config) ?? {};
                const defaultFile = t.defaultFile ?? 'tsconfig.default.json';
                const buildFile = t.buildFile ?? 'tsconfig.build.json';
                const rootFile = t.rootFile ?? 'tsconfig.workspaces.json';
                const selectors = (['alias', 'paths', 'references'] as const).filter(
                    key => opts[key] === true
                );

                const restore = opts.restore;
                if (typeof restore === 'string' || restore === true) {
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

                // The program already resolved config → env → CLI for the
                // schema-backed fields, so `t` carries the effective values.
                // Only the runtime `--auto*` switches still need mapping.
                const overrides: Partial<ToolchainTsconfigConfig> = { ...t };
                if (opts.auto !== undefined) overrides.auto = Boolean(opts.auto);
                if (opts.autoAliases !== undefined) {
                    overrides.aliasAuto = Boolean(opts.autoAliases);
                }
                if (opts.autoRefs !== undefined) overrides.refsAuto = Boolean(opts.autoRefs);
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
            }),
    ]).commands;
}
