import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ToolchainConfig } from '@deltabox/toolchain-shared';

import {
    providerCli,
    resolveWorkflowTarget,
    runWorkflows,
    workflowRunCommand,
    workflowTargets,
} from '../src/run-workflows.js';

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
                    provider: 'github',
                    file: 'checks.yaml',
                    path: '.github/custom/checks.yaml',
                },
                {
                    id: 'deploy',
                    custom: true,
                    provider: 'github',
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

    it('lists GitLab and Azure workflows with their provider and paths', () => {
        const targets = workflowTargets({
            ci: {
                ci: {
                    provider: 'gitlab',
                    workflow: { stages: ['test'] },
                },
                release: {
                    provider: 'azure',
                    workflow: { steps: [] },
                },
                custom: {
                    deploy: {
                        provider: 'gitlab',
                        workflow: { stages: ['deploy'] },
                        filename: 'deploy.yml',
                        dir: 'ci',
                    },
                },
            },
        });
        expect(targets).toEqual(
            expect.arrayContaining([
                {
                    id: 'ci',
                    custom: false,
                    provider: 'gitlab',
                    file: '.gitlab-ci.yml',
                    path: '.gitlab-ci.yml',
                },
                {
                    id: 'release',
                    custom: false,
                    provider: 'azure',
                    file: 'azure-pipelines.yml',
                    path: 'azure-pipelines.yml',
                    pipeline: 'azure-pipelines',
                },
                {
                    id: 'deploy',
                    custom: true,
                    provider: 'gitlab',
                    file: 'deploy.yml',
                    path: 'ci/deploy.yml',
                },
            ])
        );
    });
});

describe('workflowRunCommand', () => {
    const target = (provider: 'github' | 'gitlab' | 'azure') => ({
        id: 'ci',
        custom: false,
        provider,
        file:
            provider === 'gitlab'
                ? '.gitlab-ci.yml'
                : provider === 'azure'
                  ? 'azure-pipelines.yml'
                  : 'ci.yml',
        path:
            provider === 'gitlab'
                ? '.gitlab-ci.yml'
                : provider === 'azure'
                  ? 'azure-pipelines.yml'
                  : '.github/workflows/ci.yml',
        ...(provider === 'azure' ? { pipeline: 'azure-pipelines' } : {}),
    });

    it('uses the matching vendor CLI and arguments', () => {
        expect(workflowRunCommand(target('github'), { ref: 'main' })).toEqual({
            command: 'gh',
            args: ['workflow', 'run', 'ci.yml', '--ref', 'main'],
        });
        expect(workflowRunCommand(target('gitlab'), { ref: 'main' })).toEqual({
            command: 'glab',
            args: ['ci', 'run', '--branch', 'main'],
        });
        expect(workflowRunCommand(target('azure'), { ref: 'main' })).toEqual({
            command: 'az',
            args: ['pipelines', 'run', '--name', 'azure-pipelines', '--branch', 'main'],
        });
    });

    it('honours executable overrides and omits the ref when unset', () => {
        expect(workflowRunCommand(target('gitlab'), { glab: 'yarn glab' })).toEqual({
            command: 'yarn glab',
            args: ['ci', 'run'],
        });
        expect(workflowRunCommand(target('azure'), { az: 'az.cmd' })).toEqual({
            command: 'az.cmd',
            args: ['pipelines', 'run', '--name', 'azure-pipelines'],
        });
    });

    it('names the vendor CLI', () => {
        expect(providerCli('github')).toBe('gh');
        expect(providerCli('gitlab')).toBe('glab');
        expect(providerCli('azure')).toBe('az');
    });
});

describe('runWorkflows', () => {
    const dirs: string[] = [];

    afterEach(() => {
        for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reports a missing vendor CLI instead of aborting', async () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-workflow-'));
        dirs.push(cwd);
        fs.writeFileSync(path.join(cwd, '.gitlab-ci.yml'), 'stages: [test]\n');

        const result = await runWorkflows({
            cwd,
            config: {
                ci: {
                    ci: { provider: 'gitlab', workflow: { stages: ['test'] } },
                },
            },
            glab: 'dbx-definitely-missing-cli',
        });

        expect(result.ran).toHaveLength(1);
        expect(result.ran[0]?.provider).toBe('gitlab');
        expect(result.ran[0]?.code).toBe(1);
        expect(result.ran[0]?.error).toContain('`glab` CLI');
    });
});
