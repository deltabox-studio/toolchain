import { describe, expect, it } from 'vitest';

import { parseWorkflowTargets, workflowQuickPickItems } from '../src/workflows.js';

describe('parseWorkflowTargets', () => {
    it('parses vendor workflows and keeps their provider', () => {
        const stdout = JSON.stringify([
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
                provider: 'github',
                file: 'deploy.yml',
                path: '.github/workflows/deploy.yml',
            },
        ]);
        expect(parseWorkflowTargets(stdout)).toEqual([
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
            },
            {
                id: 'deploy',
                custom: true,
                provider: 'github',
                file: 'deploy.yml',
                path: '.github/workflows/deploy.yml',
            },
        ]);
    });

    it('defaults a missing provider to github', () => {
        expect(parseWorkflowTargets(JSON.stringify([{ id: 'ci', path: 'ci.yml' }]))).toEqual([
            { id: 'ci', path: 'ci.yml', provider: 'github' },
        ]);
    });

    it('ignores invalid JSON and invalid entries', () => {
        expect(parseWorkflowTargets('not json')).toEqual([]);
        expect(parseWorkflowTargets('{}')).toEqual([]);
        expect(
            parseWorkflowTargets(
                JSON.stringify([
                    { id: 'ci' },
                    { path: 'ci.yml' },
                    null,
                    { id: 'ci', path: 'ci.yml' },
                ])
            )
        ).toEqual([{ id: 'ci', path: 'ci.yml', provider: 'github' }]);
    });
});

describe('workflowQuickPickItems', () => {
    it('shows the provider and path for each workflow', () => {
        expect(
            workflowQuickPickItems([
                { id: 'ci', path: '.gitlab-ci.yml', provider: 'gitlab' },
                {
                    id: 'deploy',
                    path: '.github/workflows/deploy.yml',
                    provider: 'github',
                    custom: true,
                },
            ])
        ).toEqual([
            {
                label: 'ci',
                description: 'gitlab · .gitlab-ci.yml',
                detail: 'Built-in workflow (`ci.ci`)',
                target: { id: 'ci', path: '.gitlab-ci.yml', provider: 'gitlab' },
            },
            {
                label: 'deploy',
                description: 'github · .github/workflows/deploy.yml',
                detail: 'Custom workflow (`ci.custom`)',
                target: {
                    id: 'deploy',
                    path: '.github/workflows/deploy.yml',
                    provider: 'github',
                    custom: true,
                },
            },
        ]);
    });
});
