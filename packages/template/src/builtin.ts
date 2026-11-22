import type { Template, TemplateAction, TemplateVariable } from './types/index.js';

/** The `name` input every builtin project template prompts for. */
const NAME_VAR: TemplateVariable = {
    name: 'name',
    prompt: 'Project name',
    default: 'app',
    required: true,
};

/** The optional `scope` input (eg. `@org`). */
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

/** Whether to write the toolchain (Vite plugin) + Oxc config (exercises inputs). */
const CONFIG_VAR: TemplateVariable = {
    name: 'includeConfig',
    prompt: 'Include the toolchain config (Vite plugin + Oxc)?',
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
        description: 'A single-package TypeScript project (tsconfig, Vite+ plugin).',
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
        description: 'A runnable application package (tsconfig, Vite+).',
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
        id: 'vitepress',
        name: 'VitePress docs',
        description: 'A VitePress documentation site with a starter guide and sidebar.',
        kind: 'project',
        builtin: 'vitepress',
        source: { type: 'builtin', locate: 'vitepress' },
        tags: ['docs', 'documentation', 'vitepress', 'static-site'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'express',
        name: 'Express server',
        description: 'An Express 5 API server with JSON parsing and a health check.',
        kind: 'application',
        builtin: 'express',
        source: { type: 'builtin', locate: 'express' },
        tags: ['server', 'http', 'api', 'express'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'bun',
        name: 'Bun server',
        description: 'A Bun HTTP server using the built-in `Bun.serve` runtime.',
        kind: 'application',
        builtin: 'bun',
        source: { type: 'builtin', locate: 'bun' },
        tags: ['server', 'http', 'api', 'bun'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'fastify',
        name: 'Fastify server',
        description: 'A Fastify 5 API server with a health check.',
        kind: 'application',
        builtin: 'fastify',
        source: { type: 'builtin', locate: 'fastify' },
        tags: ['server', 'http', 'api', 'fastify'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'orpc',
        name: 'oRPC server',
        description: 'A type-safe oRPC API served over Node HTTP.',
        kind: 'application',
        builtin: 'orpc',
        source: { type: 'builtin', locate: 'orpc' },
        tags: ['server', 'http', 'api', 'rpc', 'orpc'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'file-server',
        name: 'Local file server',
        description: 'A dependency-free file server for a local directory.',
        kind: 'application',
        builtin: 'file-server',
        source: { type: 'builtin', locate: 'file-server' },
        tags: ['server', 'files', 'static'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'file-server-s3',
        name: 'S3 file server',
        description: 'An AWS S3 file server (list, download, upload).',
        kind: 'application',
        builtin: 'file-server-s3',
        source: { type: 'builtin', locate: 'file-server-s3' },
        tags: ['server', 'files', 's3', 'aws'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'file-server-bun-s3',
        name: 'Bun S3 file server',
        description: 'A Bun file server backed by S3 through the built-in S3 client.',
        kind: 'application',
        builtin: 'file-server-bun-s3',
        source: { type: 'builtin', locate: 'file-server-bun-s3' },
        tags: ['server', 'files', 's3', 'bun'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'file-server-minio',
        name: 'MinIO file server',
        description: 'A MinIO / S3-compatible file server with local defaults.',
        kind: 'application',
        builtin: 'file-server-minio',
        source: { type: 'builtin', locate: 'file-server-minio' },
        tags: ['server', 'files', 's3', 'minio'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'file-server-rclone',
        name: 'rclone file server',
        description: 'A file server that exposes an rclone remote over HTTP.',
        kind: 'application',
        builtin: 'file-server-rclone',
        source: { type: 'builtin', locate: 'file-server-rclone' },
        tags: ['server', 'files', 'rclone', 'cloud'],
        variables: PROJECT_VARIABLES,
        actions: PROJECT_ACTIONS,
    },
    {
        id: 'ollama-chat',
        name: 'Ollama chat UI',
        description: 'A local chat web UI for Ollama with streaming responses.',
        kind: 'application',
        builtin: 'ollama-chat',
        source: { type: 'builtin', locate: 'ollama-chat' },
        tags: ['app', 'llm', 'ollama', 'chat', 'vite'],
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
