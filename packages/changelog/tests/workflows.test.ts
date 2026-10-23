import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
    DEFAULT_WORKFLOW_TOKENS,
    renderWorkflow,
    renderWorkflows,
    WORKFLOW_FILENAMES,
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

    it('aggregates every changelog entry since the last tag in the release notes', () => {
        const release = renderWorkflow('release', { tokens: {} })!;
        // Not the marker-only extraction (which only ever yields the latest entry).
        expect(release).not.toContain('<!-- release:start -->');
        expect(release).toContain('git describe --tags --abbrev=0');
        expect(release).toContain('last_version');
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

    it('renderWorkflows omits disabled workflows', () => {
        const files = renderWorkflows({}, { issues: false, ci: { pushBranches: ['main'] } });
        expect(files['ci.yml']).toBeDefined();
        expect(files['issues.yml']).toBeUndefined();
    });
});
