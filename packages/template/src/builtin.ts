import type { Template } from './types.js';

/**
 * The built-in, offline templates. They map onto the local generators in
 * `@deltabox/toolchain-project`, so they need no files on disk or network.
 */
export const BUILTIN_TEMPLATES: Template[] = [
    {
        id: 'project',
        name: 'TypeScript project',
        description: 'A single-package TypeScript project (tsconfig, tsdown, biome).',
        kind: 'project',
        builtin: 'single',
        source: { type: 'builtin', locate: 'project' },
        tags: ['typescript', 'library'],
    },
    {
        id: 'application',
        name: 'Application',
        description: 'A runnable application package (tsconfig, tsdown, biome).',
        kind: 'application',
        builtin: 'application',
        source: { type: 'builtin', locate: 'application' },
        tags: ['application', 'app'],
    },
    {
        id: 'folder',
        name: 'Folder',
        description: 'A bare folder (a README) to drop files into.',
        kind: 'folder',
        builtin: 'folder',
        source: { type: 'builtin', locate: 'folder' },
        tags: ['folder'],
    },
    {
        id: 'monorepo',
        name: 'Monorepo',
        description:
            'A monorepo root (workspaces, turbo, monorepo tsconfig) + one example package.',
        kind: 'project',
        builtin: 'monorepo-root',
        source: { type: 'builtin', locate: 'monorepo' },
        tags: ['monorepo', 'turbo'],
    },
    {
        id: 'workspace',
        name: 'Monorepo workspace',
        description: 'A workspace package added to an existing monorepo root.',
        kind: 'workspace',
        builtin: 'monorepo-workspace',
        source: { type: 'builtin', locate: 'workspace' },
        tags: ['monorepo', 'workspace'],
    },
    {
        id: 'vite-plus',
        name: 'Vite+ app',
        description: 'Create a new project through `vp create` (interactive or templated).',
        kind: 'project',
        source: { type: 'vite-plus', locate: '' },
        tags: ['vite', 'vite-plus'],
        online: true,
    },
];
