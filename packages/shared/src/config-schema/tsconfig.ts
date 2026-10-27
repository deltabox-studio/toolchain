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
    })
)
    .describe('Workspace tsconfig generation (path aliases + project references).')
    .meta({ id: 'ToolchainTsconfigConfig' });
