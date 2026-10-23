import type { Template, TemplateAction, TemplateVariable } from './types.js';

/** The `name` input every builtin project template prompts for. */
const NAME_VAR: TemplateVariable = {
    name: 'name',
    prompt: 'Project name',
    default: 'app',
    required: true,
};

/** The optional `scope` input (eg. `@acme`). */
const SCOPE_VAR: TemplateVariable = {
    name: 'scope',
    prompt: 'npm scope (optional)',
    default: '',
};

/** The package manager to scaffold for (drives `packageManager` + the catalog). */
const PACKAGE_MANAGER_VAR: TemplateVariable = {
    name: 'packageManager',
    prompt: 'Package manager',
    default: 'yarn',
    options: ['yarn', 'pnpm', 'npm', 'bun'],
};

/** Whether to write a `dbx.config.ts` (a select, to exercise the input pipeline). */
const CONFIG_VAR: TemplateVariable = {
    name: 'includeConfig',
    prompt: 'Include a dbx.config.ts?',
    default: 'yes',
    options: ['yes', 'no'],
};

/** The shared inputs for the project/workspace builtins. */
const PROJECT_VARIABLES: TemplateVariable[] = [
    NAME_VAR,
    SCOPE_VAR,
    PACKAGE_MANAGER_VAR,
    CONFIG_VAR,
];

/**
 * The opt-in **Install dependencies?** step. Off by default (a scaffold never
 * installs unless asked); it runs `<packageManager> install` in the output dir.
 */
const INSTALL_ACTION: TemplateAction = {
    id: 'install',
    prompt: 'Install dependencies?',
    default: false,
    builtin: 'install',
};

/** The actions the project/workspace builtins declare. */
const PROJECT_ACTIONS: TemplateAction[] = [INSTALL_ACTION];

/**
 * The built-in, offline templates. They map onto the local generators in
 * `@deltabox/toolchain-project`, so they need no files on disk or network.
 *
 * The Vite+ entries (`vite-plus*`) delegate to `vp create` and need network
 * access; the rest are fully offline.
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
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'application',
        name: 'Application',
        description: 'A runnable application package (tsconfig, tsdown, biome).',
        kind: 'application',
        builtin: 'application',
        source: { type: 'builtin', locate: 'application' },
        tags: ['application', 'app'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'folder',
        name: 'Folder',
        description: 'A bare folder (a README) to drop files into.',
        kind: 'folder',
        builtin: 'folder',
        source: { type: 'builtin', locate: 'folder' },
        tags: ['folder'],
        variables: [NAME_VAR],
    },
    {
        id: 'monorepo',
        name: 'Monorepo',
        description: 'A monorepo root (workspaces + monorepo tsconfig), no example package.',
        kind: 'project',
        builtin: 'monorepo-root',
        source: { type: 'builtin', locate: 'monorepo' },
        tags: ['monorepo'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'monorepo-example',
        name: 'Monorepo (with example)',
        description: 'A monorepo root plus one example workspace package.',
        kind: 'project',
        builtin: 'monorepo-example',
        source: { type: 'builtin', locate: 'monorepo-example' },
        tags: ['monorepo'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'workspace',
        name: 'Monorepo workspace',
        description: 'A workspace package added to an existing monorepo root.',
        kind: 'workspace',
        builtin: 'monorepo-workspace',
        source: { type: 'builtin', locate: 'workspace' },
        tags: ['monorepo', 'workspace'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'vite-plus',
        name: 'Vite+ (interactive)',
        description: 'Create a new project through `vp create` (interactive or templated).',
        kind: 'project',
        source: { type: 'vite-plus', locate: '' },
        tags: ['vite', 'vite-plus'],
        online: true,
        variables: [NAME_VAR],
    },
    {
        id: 'vite-plus-monorepo',
        name: 'Vite+ Monorepo',
        description: 'Create a Vite+ monorepo through `vp create vite:monorepo`.',
        kind: 'project',
        source: { type: 'vite-plus', locate: 'vite:monorepo' },
        tags: ['vite', 'vite-plus', 'monorepo'],
        online: true,
        variables: [NAME_VAR],
    },
    {
        id: 'vite-plus-application',
        name: 'Vite+ Application',
        description: 'Create a Vite+ application through `vp create vite:application`.',
        kind: 'application',
        source: { type: 'vite-plus', locate: 'vite:application' },
        tags: ['vite', 'vite-plus', 'application'],
        online: true,
        variables: [NAME_VAR],
    },
    {
        id: 'vite-plus-library',
        name: 'Vite+ Library',
        description: 'Create a Vite+ library through `vp create vite:library`.',
        kind: 'project',
        source: { type: 'vite-plus', locate: 'vite:library' },
        tags: ['vite', 'vite-plus', 'library'],
        online: true,
        variables: [NAME_VAR],
    },
    {
        id: 'vite-plus-generator',
        name: 'Vite+ Generator',
        description: 'Scaffold a Vite+ code generator (`vp create vite:generator`, monorepo only).',
        kind: 'project',
        source: { type: 'vite-plus', locate: 'vite:generator' },
        tags: ['vite', 'vite-plus', 'generator'],
        online: true,
        variables: [NAME_VAR],
    },
];
