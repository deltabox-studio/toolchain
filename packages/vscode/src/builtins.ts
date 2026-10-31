import type { Provider, ProviderCommand } from './providers.js';
import type { Template } from './templates.js';

/**
 * The builtin providers and templates the extension always renders.
 *
 * The views normally load these from the resolved `dbx` CLI (`dbx providers
 * --json` / `dbx template:list --json`). When the CLI cannot be resolved or the
 * command fails, the extension still needs to show the builtins, so this module
 * mirrors the descriptors shipped by the toolchain. Custom project/global
 * entries are merged over these by the callers.
 */

const VITE_COMMANDS: ProviderCommand[] = [
    {
        name: 'vite:create',
        subcommand: 'create',
        description: 'Create a new project from a template.',
        group: 'start',
    },
    {
        name: 'vite:migrate',
        subcommand: 'migrate',
        description: 'Migrate an existing project to Vite+.',
        group: 'start',
    },
    {
        name: 'vite:config',
        subcommand: 'config',
        description: 'Configure hooks and agent integration.',
        group: 'start',
    },
    {
        name: 'vite:hooks',
        subcommand: 'hooks',
        description: 'Manage the Git hook dispatcher.',
        group: 'start',
    },
    {
        name: 'vite:staged',
        subcommand: 'staged',
        description: 'Run linters on staged files.',
        group: 'start',
    },
    {
        name: 'vite:install',
        subcommand: 'install',
        description: 'Install dependencies with the detected package manager.',
        group: 'start',
        aliases: ['i'],
    },
    {
        name: 'vite:env',
        subcommand: 'env',
        description: 'Manage Node.js and package managers.',
        group: 'start',
    },
    {
        name: 'vite:dev',
        subcommand: 'dev',
        description: 'Run the Vite development server.',
        group: 'develop',
    },
    {
        name: 'vite:check',
        subcommand: 'check',
        description: 'Run format, lint and type checks.',
        group: 'develop',
    },
    {
        name: 'vite:lint',
        subcommand: 'lint',
        description: 'Lint code with Oxlint.',
        group: 'develop',
    },
    {
        name: 'vite:fmt',
        subcommand: 'fmt',
        description: 'Format code with Oxfmt.',
        group: 'develop',
    },
    {
        name: 'vite:test',
        subcommand: 'test',
        description: 'Run tests through bundled Vitest.',
        group: 'develop',
    },
    {
        name: 'vite:run',
        subcommand: 'run',
        description: 'Run package scripts and monorepo tasks.',
        group: 'execute',
    },
    {
        name: 'vite:exec',
        subcommand: 'exec',
        description: 'Execute a binary from local node_modules.',
        group: 'execute',
    },
    {
        name: 'vite:node',
        subcommand: 'node',
        description: 'Run a Node.js script in the Vite+ env.',
        group: 'execute',
    },
    {
        name: 'vite:dlx',
        subcommand: 'dlx',
        description: 'Run a package binary without installing it.',
        group: 'execute',
    },
    {
        name: 'vite:cache',
        subcommand: 'cache',
        description: 'Manage the task cache.',
        group: 'execute',
    },
    {
        name: 'vite:build',
        subcommand: 'build',
        description: 'Build for production.',
        group: 'build',
    },
    {
        name: 'vite:pack',
        subcommand: 'pack',
        description: 'Build libraries for npm or standalone binaries.',
        group: 'build',
    },
    {
        name: 'vite:preview',
        subcommand: 'preview',
        description: 'Preview the production build.',
        group: 'build',
    },
    {
        name: 'vite:add',
        subcommand: 'add',
        description: 'Add packages to dependencies.',
        group: 'deps',
    },
    {
        name: 'vite:remove',
        subcommand: 'remove',
        description: 'Remove packages from dependencies.',
        group: 'deps',
        aliases: ['rm', 'un', 'uninstall'],
    },
    {
        name: 'vite:update',
        subcommand: 'update',
        description: 'Update packages.',
        group: 'deps',
        aliases: ['up'],
    },
    {
        name: 'vite:dedupe',
        subcommand: 'dedupe',
        description: 'Deduplicate dependencies.',
        group: 'deps',
    },
    {
        name: 'vite:outdated',
        subcommand: 'outdated',
        description: 'Check for outdated packages.',
        group: 'deps',
    },
    {
        name: 'vite:list',
        subcommand: 'list',
        description: 'List installed packages.',
        group: 'deps',
        aliases: ['ls'],
    },
    {
        name: 'vite:why',
        subcommand: 'why',
        description: 'Explain why a package is installed.',
        group: 'deps',
        aliases: ['explain'],
    },
    {
        name: 'vite:info',
        subcommand: 'info',
        description: 'View package metadata.',
        group: 'deps',
        aliases: ['view', 'show'],
    },
    {
        name: 'vite:link',
        subcommand: 'link',
        description: 'Link local packages.',
        group: 'deps',
        aliases: ['ln'],
    },
    {
        name: 'vite:unlink',
        subcommand: 'unlink',
        description: 'Unlink local packages.',
        group: 'deps',
    },
    {
        name: 'vite:rebuild',
        subcommand: 'rebuild',
        description: 'Rebuild native modules.',
        group: 'deps',
    },
    {
        name: 'vite:pm',
        subcommand: 'pm',
        description: 'Forward a command to the package manager.',
        group: 'deps',
    },
    {
        name: 'vite:toolchain',
        subcommand: 'toolchain',
        description: 'Show Vite+ tool versions.',
        group: 'maintain',
    },
    {
        name: 'vite:upgrade',
        subcommand: 'upgrade',
        description: 'Update `vp` itself.',
        group: 'maintain',
    },
    {
        name: 'vite:implode',
        subcommand: 'implode',
        description: 'Remove `vp` and all related data.',
        group: 'maintain',
    },
];

/** The builtin providers (always visible, even when the CLI is unavailable). */
export const BUILTIN_PROVIDERS: Provider[] = [
    {
        id: 'vite-plus',
        name: 'Vite+',
        description:
            'The unified web toolchain (Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown) via `vp`.',
        homepage: 'https://viteplus.dev',
        binary: 'vp',
        commands: VITE_COMMANDS,
    },
];

const PROJECT_TAGS = ['typescript'];

/** The builtin templates (always visible, even when the CLI is unavailable). */
export const BUILTIN_TEMPLATES: Template[] = [
    {
        id: 'project',
        name: 'TypeScript project',
        description: 'A single-package TypeScript project (tsconfig, tsdown, Vite+).',
        kind: 'project',
        type: 'builtin',
        tags: PROJECT_TAGS,
    },
    {
        id: 'application',
        name: 'Application',
        description: 'A runnable application package (tsconfig, Vite+).',
        kind: 'application',
        type: 'builtin',
        tags: ['application', 'app'],
    },
    {
        id: 'folder',
        name: 'Folder',
        description: 'A bare folder (a README) to drop files into.',
        kind: 'folder',
        type: 'builtin',
        tags: ['folder'],
    },
    {
        id: 'monorepo',
        name: 'Monorepo',
        description: 'A monorepo root (workspaces + monorepo tsconfig), no example package.',
        kind: 'project',
        type: 'builtin',
        tags: ['monorepo'],
    },
    {
        id: 'monorepo-example',
        name: 'Monorepo (with example)',
        description: 'A monorepo root plus one example workspace package.',
        kind: 'project',
        type: 'builtin',
        tags: ['monorepo'],
    },
    {
        id: 'workspace',
        name: 'Monorepo workspace',
        description: 'A workspace package added to an existing monorepo root.',
        kind: 'workspace',
        type: 'builtin',
        tags: ['monorepo', 'workspace'],
    },
    {
        id: 'vite-plus',
        name: 'Vite+ (interactive)',
        description: 'Create a new project through `vp create` (interactive or templated).',
        kind: 'project',
        type: 'vite-plus',
        tags: ['vite', 'vite-plus'],
        online: true,
    },
    {
        id: 'vite-plus-monorepo',
        name: 'Vite+ Monorepo',
        description: 'Create a Vite+ monorepo through `vp create vite:monorepo`.',
        kind: 'project',
        type: 'vite-plus',
        tags: ['vite', 'vite-plus', 'monorepo'],
        online: true,
    },
    {
        id: 'vite-plus-application',
        name: 'Vite+ Application',
        description: 'Create a Vite+ application through `vp create vite:application`.',
        kind: 'application',
        type: 'vite-plus',
        tags: ['vite', 'vite-plus', 'application'],
        online: true,
    },
    {
        id: 'vite-plus-library',
        name: 'Vite+ Library',
        description: 'Create a Vite+ library through `vp create vite:library`.',
        kind: 'project',
        type: 'vite-plus',
        tags: ['vite', 'vite-plus', 'library'],
        online: true,
    },
    {
        id: 'vite-plus-generator',
        name: 'Vite+ Generator',
        description: 'Scaffold a Vite+ code generator (`vp create vite:generator`, monorepo only).',
        kind: 'project',
        type: 'vite-plus',
        tags: ['vite', 'vite-plus', 'generator'],
        online: true,
    },
];

function dedupeById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        out.push(item);
    }
    return out;
}

/** Prepend the builtin providers, keeping the first entry for a duplicate id. */
export function withBuiltinProviders(providers: Provider[]): Provider[] {
    return dedupeById([...BUILTIN_PROVIDERS, ...providers]);
}

/** Prepend the builtin templates, keeping the first entry for a duplicate id. */
export function withBuiltinTemplates(templates: Template[]): Template[] {
    return dedupeById([...BUILTIN_TEMPLATES, ...templates]);
}
