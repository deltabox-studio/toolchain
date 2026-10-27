import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Where a template source is loaded from. */
export const templateSourceTypeSchema = z
    .enum(['builtin', 'local', 'npm', 'git', 'vite-plus'])
    .describe('How to load the source.')
    .meta({ id: 'ToolchainTemplateSourceType' });

/** What a template produces. */
export const templateKindSchema = z
    .enum(['project', 'workspace', 'application', 'folder', 'tooling', 'pipeline'])
    .describe('What the template produces.')
    .meta({ id: 'ToolchainTemplateKind' });

/** A source a template registry loads templates from (offline or online). */
export const templateSourceSchema = z
    .object({
        type: templateSourceTypeSchema.describe('How to load the source.'),
        locate: z.string().describe('A builtin id, local dir, npm scope, git URL or Vite+ id.'),
        id: z.string().describe('Stable id (defaults to the basename/scope).').optional(),
        name: z.string().describe('Display name override.').optional(),
        description: z.string().describe('Description override.').optional(),
        kind: templateKindSchema.describe('What the template produces.').optional(),
        ref: z.string().describe('Git branch/tag/commit.').optional(),
        subdir: z
            .string()
            .describe('Subdirectory within the source that holds the template.')
            .optional(),
        tags: z.array(z.string()).describe('Free-form tags.').optional(),
        online: z.boolean().describe('Whether the source needs network access.').optional(),
    })
    .describe('A template source: builtin, local, npm, git or Vite+.')
    .meta({ id: 'ToolchainTemplateSource' });

/** Template sources / scaffolding. */
export const templatesConfigSchema = withEnabled(
    z.object({
        sources: z
            .array(templateSourceSchema)
            .describe('Extra sources on top of the builtin + registry sources.')
            .optional(),
    })
)
    .describe('Template sources / scaffolding.')
    .meta({ id: 'ToolchainTemplatesConfig' });
