import type { TsConfigJson } from 'type-fest';
import { z } from 'zod';

import { externalConfigSchema } from './external.js';
import { withEnabled } from './meta.js';

const tsconfigOverride = (description: string) =>
    externalConfigSchema<TsConfigJson>(description, 'TsConfigJson');

/** Include/exclude globs for an auto-wiring switch. */
const tsconfigAutoFilters = z
    .object({
        include: z
            .array(z.string())
            .describe(
                'Only auto-wire entries matching these globs (`auto`: workspace dirs; ' +
                    '`aliasAuto`: rewritten alias keys; `refsAuto`: reference paths).'
            )
            .optional(),
        exclude: z
            .array(z.string())
            .describe('Skip entries matching these globs (same targets as `include`).')
            .optional(),
    })
    .meta({ id: 'ToolchainTsconfigAutoSetting' });

/**
 * A URL-rewrite-style rewrite of generated alias keys. JSON configs can only
 * express the string-pattern forms; `RegExp` patterns are available from TS/JS
 * configs (the generated types/docs use the `tsType` below).
 */
const tsconfigAliasRewrite = z
    .union([
        z.record(z.string(), z.string()),
        z.array(
            z.object({
                pattern: z.union([z.string(), z.array(z.string())]),
                replacement: z.string(),
            })
        ),
    ])
    .describe(
        'Rewrite the alias keys auto-wiring generates (custom keys are preserved). Patterns are ' +
            'URL-rewrite style: a string is a regular-expression source and replacements support ' +
            '`$1`, `$2`, ... capture groups. Examples: `{ "^@acme/(.+)$": "@acme/pkg/$1" }` ' +
            '(string patterns), `[{ pattern: /^@acme\\/(.+)$/, replacement: "@acme/pkg/$1" }]` ' +
            '(RegExp patterns), `[{ pattern: ["^@acme/a$", "^@acme/b$"], replacement: "@acme/x" }]` ' +
            '(an array of keys), and an array of such rules (applied in order; the first matching ' +
            'rule wins). `RegExp` patterns are only available from TS/JS configs; JSON configs use ' +
            'string patterns.'
    )
    .meta({ tsType: 'ToolchainTsconfigAliasRewrite' });

/** Include/exclude globs plus an alias rewrite for alias auto-wiring. */
const tsconfigAliasAutoFilters = tsconfigAutoFilters
    .extend({
        rewriteAlias: tsconfigAliasRewrite.optional(),
    })
    .meta({ id: 'ToolchainTsconfigAliasAutoSetting' });

/** A switch that can also carry include/exclude globs (relative to the repo root). */
const tsconfigAutoSetting = (description: string) =>
    z.union([z.boolean(), tsconfigAutoFilters]).describe(description);

/** An alias auto-wiring switch (include/exclude globs plus `rewriteAlias`). */
const tsconfigAliasAutoSetting = (description: string) =>
    z.union([z.boolean(), tsconfigAliasAutoFilters]).describe(description);

/** Workspace tsconfig generation (aliases + project references). */
export const tsconfigConfigSchema = withEnabled(
    z.object({
        glob: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) for the workspace default tsconfig files. Defaults to matching ' +
                    'every `defaultFile` recursively.'
            )
            .optional(),
        exclude: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) to exclude from `glob`. Defaults to the common ignored paths ' +
                    '(`node_modules`, `.dbx`, `dist`, `build`, ...).'
            )
            .optional(),
        gitignore: z
            .boolean()
            .describe(
                'Also respect `.gitignore` files (root + nested) when matching `glob` ' +
                    '(default true).'
            )
            .optional(),
        refs: z.boolean().describe('Wire project references (default false).').optional(),
        composite: z.boolean().describe('Emit `composite: true` (default false).').optional(),
        aliases: z.boolean().describe('Inject path aliases (default true).').optional(),
        auto: tsconfigAliasAutoSetting(
            'Auto-generate the root workspaces tsconfig paths/references from the project graph ' +
                '(default false). Set true to derive them from the project graph; set false to ' +
                'only use the entries you define yourself.'
        ).optional(),
        aliasAuto: tsconfigAliasAutoSetting(
            'Auto-generate path aliases (defaults to `auto`; `aliases` must also be enabled). ' +
                'Accepts the same `include`/`exclude`/`rewriteAlias` object as `auto`.'
        ).optional(),
        refsAuto: tsconfigAutoSetting(
            'Auto-generate project references (defaults to `auto`; `refs` must also be enabled).'
        ).optional(),
        autoSrcDir: z
            .string()
            .describe(
                'Source directory used to resolve workspace entry points when `package.json` ' +
                    "does not declare `exports`/`main`/`types` (default: the workspace's " +
                    'final tsconfig `rootDir`/`baseUrl`, falling back to `src`).'
            )
            .meta({ tsType: "'src' | '.' | (string & {})" })
            .optional(),
        indent: z.number().describe('JSON indentation (default 4).').optional(),
        rootFile: z
            .string()
            .describe(
                'The workspaces tsconfig file name that holds `paths` + `references` ' +
                    '(default `tsconfig.workspaces.json`).'
            )
            .optional(),
        defaultFile: z
            .string()
            .describe(
                'The workspace default tsconfig file name that the generator expands ' +
                    '(default `tsconfig.default.json`).'
            )
            .optional(),
        buildFile: z
            .string()
            .describe('The workspace build tsconfig file name (default `tsconfig.build.json`).')
            .optional(),
        baseFile: z
            .string()
            .describe('The root base tsconfig file name (default `tsconfig.base.json`).')
            .optional(),
        extends: z
            .object({
                base: z
                    .union([z.string(), z.array(z.string()), z.literal(false)])
                    .describe(
                        '`extends` written into scaffolded `tsconfig.base.json` files ' +
                            '(or `false` to remove the field).'
                    )
                    .optional(),
                default: z
                    .union([z.string(), z.array(z.string()), z.literal(false)])
                    .describe(
                        '`extends` written into scaffolded `tsconfig.default.json` files ' +
                            '(or `false` to remove the field).'
                    )
                    .optional(),
                build: z
                    .union([z.string(), z.array(z.string()), z.literal(false)])
                    .describe(
                        '`extends` written into scaffolded `tsconfig.build.json` files. ' +
                            'Default `./tsconfig.default.json`; use `./tsconfig.json` to ' +
                            'let builds reuse the path aliases (at the cost of pulling ' +
                            'workspace source into the build).'
                    )
                    .optional(),
            })
            .describe('Per-file `extends` overrides for generated/scaffolded tsconfig templates.')
            .optional(),
        overrides: z
            .object({
                base: tsconfigOverride(
                    'Deep-merged into the root base tsconfig (`baseFile`) during sync.'
                ).optional(),
                default: tsconfigOverride(
                    'Deep-merged into every workspace default tsconfig (`defaultFile`) during sync.'
                ).optional(),
                build: tsconfigOverride(
                    'Deep-merged into every workspace build tsconfig (`buildFile`) during sync.'
                ).optional(),
                root: tsconfigOverride(
                    'Deep-merged into the root workspaces tsconfig (`rootFile`) during sync.'
                ).optional(),
            })
            .describe(
                'Managed overrides deep-merged into the base/root/default/build tsconfig files ' +
                    'during sync. The originals are snapshotted in the manifest, so removing a ' +
                    'key reverts it (restoring the original value when the file defined one).'
            )
            .meta({ id: 'ToolchainTsconfigOverrides' })
            .optional(),
    })
)
    .describe('Workspace tsconfig generation (path aliases + project references).')
    .meta({ id: 'ToolchainTsconfigConfig' });
