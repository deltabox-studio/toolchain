import { describe, expect, it } from 'vitest';

import type { ToolchainConfig } from '@deltabox/toolchain-shared';

import { resolveWorkflowTarget, workflowTargets } from '../src/run-workflows.js';

describe('workflowTargets', () => {
    const config: ToolchainConfig = {
        ci: {
            ci: { filename: 'checks.yaml', dir: '.github/custom' },
            custom: {
                deploy: {
                    triggers: { workflow_dispatch: {} },
                    filename: 'deploy.yaml',
                    dir: '.github/custom',
                    jobs: {
                        deploy: {
                            'runs-on': 'ubuntu-latest',
                            steps: [{ run: 'echo deploy' }],
                        },
                    },
                },
            },
        },
    };

    it('uses the generated path (including dir/filename) for built-ins and custom workflows', () => {
        const targets = workflowTargets(config);
        expect(targets).toEqual(
            expect.arrayContaining([
                {
                    id: 'ci',
                    custom: false,
                    file: 'checks.yaml',
                    path: '.github/custom/checks.yaml',
                },
                {
                    id: 'deploy',
                    custom: true,
                    file: 'deploy.yaml',
                    path: '.github/custom/deploy.yaml',
                },
            ])
        );
    });

    it('resolves ids, custom ids, file names and paths', () => {
        const targets = workflowTargets(config);
        expect(resolveWorkflowTarget('ci', targets)?.path).toBe('.github/custom/checks.yaml');
        expect(resolveWorkflowTarget('checks.yaml', targets)?.id).toBe('ci');
        expect(resolveWorkflowTarget('deploy', targets)?.path).toBe('.github/custom/deploy.yaml');
        expect(resolveWorkflowTarget('deploy.yaml', targets)?.id).toBe('deploy');
        expect(resolveWorkflowTarget('.github/custom/deploy.yaml', targets)?.id).toBe('deploy');
        expect(resolveWorkflowTarget('missing', targets)).toBeUndefined();
    });

    it('returns nothing when ci is absent or disabled', () => {
        expect(workflowTargets({})).toEqual([]);
        expect(workflowTargets({ ci: false })).toEqual([]);
    });
});
