import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
    DEFAULT_WORKFLOW_DIR,
    DEFAULT_WORKFLOW_TOKENS,
    renderCustomWorkflow,
    renderWorkflow,
    renderWorkflows,
    WORKFLOW_FILENAMES,
    workflowFilePath,
    type WorkflowId,
} from '../src/workflows.js';

const IDS = Object.keys(WORKFLOW_FILENAMES) as WorkflowId[];

describe('default workflows', () => {
    it('match the committed reference files', () => {
        for (const id of IDS) {
            const yaml = renderWorkflow(id, { tokens: DEFAULT_WORKFLOW_TOKENS });
            expect(yaml).toBeDefined();
            const file = fileURLToPath(
                new URL(`../src/ci/github/workflows/${WORKFLOW_FILENAMES[id]}`, import.meta.url)
            );
            expect(readFileSync(file, 'utf-8')).toBe(yaml);
        }
    });

    it('drives the published CLI and drops native builds', () => {
        expect(renderWorkflow('changelog', { tokens: {} })).toContain('yarn dbx changelog');
        const release = renderWorkflow('release', { tokens: {} })!;
        expect(release).toContain('Open release PR');
        expect(release).toContain('gh pr create');
        expect(release).not.toContain('build-native');
        expect(release).not.toContain('binaries');
    });

    it('aggregates every changelog entry since the last released version', () => {
        const release = renderWorkflow('release', { tokens: {} })!;
        // Not the marker-only extraction (which only ever yields the latest entry).
        expect(release).not.toContain('<!-- release:start -->');
        // The CLI resolves the last released version and guards first releases.
        expect(release).toContain('changelog --release-notes');
        expect(release).not.toContain('cat CHANGELOG.md');
    });
});

describe('workflow config', () => {
    it('overrides push branches', () => {
        const yaml = renderWorkflow('ci', {
            tokens: {},
            config: { pushBranches: ['main', 'next', 'v*'] },
        })!;
        expect(yaml).toContain('branches: [main, next, v*]');
    });

    it('overrides pull_request branches', () => {
        const yaml = renderWorkflow('ci', {
            tokens: {},
            config: { pullRequestBranches: ['main'] },
        })!;
        expect(yaml).toContain('pull_request:');
        expect(yaml).toContain('branches: [main]');
    });

    it('merges extra triggers and top-level keys', () => {
        const yaml = renderWorkflow('sync', {
            tokens: {},
            config: {
                triggers: { schedule: [{ cron: '0 6 * * *' }] },
                extra: { permissions: { contents: 'read' } },
            },
        })!;
        expect(yaml).toContain('schedule:');
        expect(yaml).toContain('cron: 0 6 * * *');
        expect(yaml).toContain('permissions:');
        expect(yaml).toContain('contents: read');
    });

    it('injects extra steps before/after a job', () => {
        const yaml = renderWorkflow('ci', {
            tokens: {},
            config: {
                steps: [
                    { job: 'ci', before: [{ name: 'Before', run: 'echo before' }] },
                    { job: 'ci', after: [{ name: 'After', run: 'echo after' }] },
                ],
            },
        })!;
        expect(yaml).toContain('name: Before');
        expect(yaml).toContain('name: After');
        expect(yaml.indexOf('name: Before')).toBeLessThan(yaml.indexOf('name: Checkout'));
    });

    it('merges extra jobs', () => {
        const yaml = renderWorkflow('ci', {
            tokens: {},
            config: {
                jobs: { extra: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] } },
            },
        })!;
        expect(yaml).toContain('extra:');
    });

    it('honours disabling a workflow', () => {
        expect(
            renderWorkflow('issues', { tokens: {}, config: { enabled: false } })
        ).toBeUndefined();
    });

    it('uses the overridden package manager version and legacy yarnVersion', () => {
        const pnpm = renderWorkflow('ci', {
            tokens: {
                packageManager: 'yarn',
                packageManagerVersion: '4.17.1',
                yarnVersion: '4.17.1',
            },
            config: { tokens: { packageManager: 'pnpm' } },
        })!;
        expect(pnpm).toContain('corepack prepare pnpm@10.11.1 --activate');
        expect(pnpm).toContain('pnpm install --frozen-lockfile');

        const legacy = renderWorkflow('ci', {
            tokens: {},
            config: { tokens: { yarnVersion: '4.0.0' } },
        })!;
        expect(legacy).toContain('corepack prepare yarn@4.0.0 --activate');
    });

    it('sets up pnpm, npm and bun installs', () => {
        const pnpm = renderWorkflow('ci', {
            tokens: { packageManager: 'pnpm', packageManagerVersion: '10.11.1' },
        })!;
        expect(pnpm).toContain('pnpm install --frozen-lockfile');
        expect(pnpm).toContain('pnpm exec dbx');

        const npm = renderWorkflow('ci', {
            tokens: { packageManager: 'npm', packageManagerVersion: '11.19.0' },
        })!;
        expect(npm).toContain('npm install -g npm@11.19.0');
        expect(npm).toContain('npm ci');
        expect(npm).toContain('npx dbx');

        const bun = renderWorkflow('ci', {
            tokens: { packageManager: 'bun', packageManagerVersion: '1.3.0' },
        })!;
        expect(bun).toContain('oven-sh/setup-bun@v2');
        expect(bun).toContain('bun install --frozen-lockfile');
        expect(bun).toContain('bunx dbx');
    });

    it('renderWorkflows omits disabled workflows', () => {
        const files = renderWorkflows({}, { issues: false, ci: { pushBranches: ['main'] } });
        expect(files['ci.yml']).toBeDefined();
        expect(files['issues.yml']).toBeUndefined();
    });

    it('writes a raw string workflow verbatim (no default merge)', () => {
        const raw =
            'name: Custom CI\non: [push]\njobs:\n  ci:\n    runs-on: ubuntu-latest\n    steps: []\n';
        const files = renderWorkflows({}, { ci: raw, issues: false, sync: true });
        expect(files['ci.yml']).toBe(raw);
        expect(files['issues.yml']).toBeUndefined();
        // A non-string setting still renders from the default.
        expect(files['sync.yml']).toContain('name: Toolchain sync');
    });

    it('treats an empty raw string as disabled', () => {
        expect(renderWorkflows({}, { ci: '' })['ci.yml']).toBeUndefined();
    });

    it('only renders the workflows that are opted in', () => {
        expect(renderWorkflows({}, {})).toEqual({});
        expect(Object.keys(renderWorkflows({}, { ci: true }))).toEqual(['ci.yml']);
    });

    it('builds a custom workflow from its settings', () => {
        const yaml = renderCustomWorkflow('deploy', {
            tokens: {},
            config: {
                triggers: { workflow_dispatch: {} },
                extra: { name: 'Deploy' },
                jobs: {
                    deploy: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo deploy' }] },
                },
            },
        });
        expect(yaml).toContain('name: Deploy');
        expect(yaml).toContain('workflow_dispatch:');
        expect(yaml).toContain('deploy:');
        expect(yaml).toContain('echo deploy');
    });

    it('resolves workflow file paths with filename/dir overrides', () => {
        expect(workflowFilePath('ci', true, 'ci.yml')).toBe(`${DEFAULT_WORKFLOW_DIR}/ci.yml`);
        expect(
            workflowFilePath('ci', { filename: 'checks.yaml', dir: '.github/custom' }, 'ci.yml')
        ).toBe('.github/custom/checks.yaml');
        expect(workflowFilePath('my-workflow', undefined)).toBe(
            `${DEFAULT_WORKFLOW_DIR}/my-workflow.yml`
        );
    });

    it('rejects unsafe workflow paths', () => {
        expect(() => workflowFilePath('ci', { filename: '../ci.yml' })).toThrow(
            'invalid workflow filename'
        );
        expect(() => workflowFilePath('ci', { dir: '../outside' })).toThrow(
            'invalid workflow directory'
        );
    });

    it('renders custom workflows and filename/dir overrides in renderWorkflows', () => {
        const files = renderWorkflows(
            {},
            { ci: { filename: 'checks.yaml', dir: '.github/custom' } },
            {
                custom: {
                    deploy: {
                        triggers: { workflow_dispatch: {} },
                        jobs: {
                            deploy: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ run: 'echo deploy' }],
                            },
                        },
                    },
                },
            }
        );
        expect(Object.keys(files).sort()).toEqual(['checks.yaml', 'deploy.yml']);
        expect(files['deploy.yml']).toContain('echo deploy');
    });

    it('rejects a custom workflow without triggers or jobs', () => {
        expect(() => renderCustomWorkflow('deploy', { tokens: {}, config: {} })).toThrow(
            'must define at least one trigger and one job'
        );
    });
});
