/**
 * The Vite+ (`vp`) command catalog.
 *
 * Every `vp` subcommand is surfaced as a first-class `dbx vite:<name>`
 * passthrough, and the whole set is also reachable through the generic
 * `dbx vite <anything>` escape hatch. The catalog drives both the CLI
 * registration and the provider descriptor the VS Code extension consumes.
 */

/** A UI group for a vp command. */
export type VpGroup = 'start' | 'develop' | 'execute' | 'build' | 'deps' | 'maintain';

/** A vp subcommand description. */
export interface VpCommandInfo {
    /** The vp subcommand, eg. `dev`. */
    name: string;
    /** Human-readable description. */
    description: string;
    /** UI group. */
    group: VpGroup;
    /** Alternate names vp accepts, eg. `i` for `install`. */
    aliases?: string[];
}

/** Every `vp` subcommand, grouped as the Vite+ `vp help` output is. */
export const VP_COMMANDS: VpCommandInfo[] = [
    // Start
    { name: 'create', group: 'start', description: 'Create a new project from a template.' },
    { name: 'migrate', group: 'start', description: 'Migrate an existing project to Vite+.' },
    { name: 'config', group: 'start', description: 'Configure hooks and agent integration.' },
    { name: 'hooks', group: 'start', description: 'Manage the Git hook dispatcher.' },
    { name: 'staged', group: 'start', description: 'Run linters on staged files.' },
    {
        name: 'install',
        group: 'start',
        aliases: ['i'],
        description: 'Install dependencies with the detected package manager.',
    },
    { name: 'env', group: 'start', description: 'Manage Node.js and package managers.' },

    // Develop
    { name: 'dev', group: 'develop', description: 'Run the Vite development server.' },
    { name: 'check', group: 'develop', description: 'Run format, lint and type checks.' },
    { name: 'lint', group: 'develop', description: 'Lint code with Oxlint.' },
    { name: 'fmt', group: 'develop', description: 'Format code with Oxfmt.' },
    { name: 'test', group: 'develop', description: 'Run tests through bundled Vitest.' },

    // Execute
    { name: 'run', group: 'execute', description: 'Run package scripts and monorepo tasks.' },
    { name: 'exec', group: 'execute', description: 'Execute a binary from local node_modules.' },
    { name: 'node', group: 'execute', description: 'Run a Node.js script in the Vite+ env.' },
    { name: 'dlx', group: 'execute', description: 'Run a package binary without installing it.' },
    { name: 'cache', group: 'execute', description: 'Manage the task cache.' },

    // Build
    { name: 'build', group: 'build', description: 'Build for production.' },
    {
        name: 'pack',
        group: 'build',
        description: 'Build libraries for npm or standalone binaries.',
    },
    { name: 'preview', group: 'build', description: 'Preview the production build.' },

    // Manage dependencies
    { name: 'add', group: 'deps', description: 'Add packages to dependencies.' },
    {
        name: 'remove',
        group: 'deps',
        aliases: ['rm', 'un', 'uninstall'],
        description: 'Remove packages from dependencies.',
    },
    { name: 'update', group: 'deps', aliases: ['up'], description: 'Update packages.' },
    { name: 'dedupe', group: 'deps', description: 'Deduplicate dependencies.' },
    { name: 'outdated', group: 'deps', description: 'Check for outdated packages.' },
    { name: 'list', group: 'deps', aliases: ['ls'], description: 'List installed packages.' },
    {
        name: 'why',
        group: 'deps',
        aliases: ['explain'],
        description: 'Explain why a package is installed.',
    },
    {
        name: 'info',
        group: 'deps',
        aliases: ['view', 'show'],
        description: 'View package metadata.',
    },
    { name: 'link', group: 'deps', aliases: ['ln'], description: 'Link local packages.' },
    { name: 'unlink', group: 'deps', description: 'Unlink local packages.' },
    { name: 'rebuild', group: 'deps', description: 'Rebuild native modules.' },
    { name: 'pm', group: 'deps', description: 'Forward a command to the package manager.' },

    // Maintain
    { name: 'toolchain', group: 'maintain', description: 'Show Vite+ tool versions.' },
    { name: 'upgrade', group: 'maintain', description: 'Update `vp` itself.' },
    { name: 'implode', group: 'maintain', description: 'Remove `vp` and all related data.' },
];

/** The `dbx` command name for a vp subcommand (`dev` -> `vite:dev`). */
export function viteCommandName(subcommand: string): string {
    return `vite:${subcommand}`;
}
