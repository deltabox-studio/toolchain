import { z } from 'zod';

import { withEnabled } from './meta.js';

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
                base: z
                    .record(z.string(), z.unknown())
                    .describe('Deep-merged into the root base tsconfig (`baseFile`) during sync.')
                    .optional(),
                default: z
                    .record(z.string(), z.unknown())
                    .describe(
                        'Deep-merged into every workspace default tsconfig (`defaultFile`) during sync.'
                    )
                    .optional(),
                build: z
                    .record(z.string(), z.unknown())
                    .describe(
                        'Deep-merged into every workspace build tsconfig (`buildFile`) during sync.'
                    )
                    .optional(),
                root: z
                    .record(z.string(), z.unknown())
                    .describe(
                        'Deep-merged into the root workspaces tsconfig (`rootFile`) during sync.'
                    )
                    .optional(),
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
