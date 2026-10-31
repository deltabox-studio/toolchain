import { changelogWorkflowSettingSchema } from './changelog.js';
import { withEnabled } from './meta.js';
import { workflowConfigSchema } from './workflow.js';

/**
 * GitHub Actions workflows written to `.github/workflows`. The section is
 * opt-in by presence, and so is every workflow inside it: omit a workflow (or
 * set it to `false`) to leave it unmanaged. `enabled: false` disables the whole
 * section.
 */
export const ciConfigSchema = withEnabled(
    workflowConfigSchema.extend({
        changelog: changelogWorkflowSettingSchema
            .describe(
                'The changelog/version workflow (`changelog.yml`) plus the changelog ' +
                    'pipeline config (versioning, VS Code settings, commitlint).'
            )
            .optional(),
    })
)
    .describe('GitHub Actions workflows to generate (CI, release, issues, changelog, sync).')
    .meta({ id: 'ToolchainCiConfig' });
