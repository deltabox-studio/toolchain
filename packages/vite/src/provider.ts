/**
 * The Vite+ provider descriptor.
 *
 * Consumed by the root CLI (`dbx providers`) and, over that JSON, by the
 * VS Code extension, which builds its menus + actions from it.
 */

import type { ToolchainProvider, ToolchainProviderAction } from '@deltabox/toolchain-shared';

import { VP_COMMANDS, viteCommandName } from './commands.js';

/** Curated actions for the VS Code extension (a useful subset of vp commands). */
const ACTIONS: ToolchainProviderAction[] = [
    {
        id: 'vite-create',
        label: 'Create project (vp create)',
        command: 'vite:create',
        group: 'start',
    },
    { id: 'vite-install', label: 'Install dependencies', command: 'vite:install', group: 'start' },
    { id: 'vite-dev', label: 'Start dev server', command: 'vite:dev', group: 'develop' },
    {
        id: 'vite-check',
        label: 'Check (format + lint + types)',
        command: 'vite:check',
        group: 'develop',
    },
    { id: 'vite-test', label: 'Run tests', command: 'vite:test', group: 'develop' },
    { id: 'vite-build', label: 'Build', command: 'vite:build', group: 'build' },
    { id: 'vite-pack', label: 'Pack library', command: 'vite:pack', group: 'build' },
    {
        id: 'vite-toolchain',
        label: 'Show toolchain versions',
        command: 'vite:toolchain',
        group: 'maintain',
    },
    { id: 'vite-migrate', label: 'Migrate to Vite+', command: 'vite:migrate', group: 'maintain' },
];

/**
 * Build the Vite+ provider descriptor. The command list mirrors {@link VP_COMMANDS}
 * so the CLI and the extension stay in sync automatically.
 */
export function viteProvider(): ToolchainProvider {
    return {
        id: 'vite-plus',
        name: 'Vite+',
        description:
            'The unified web toolchain (Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown) via `vp`.',
        homepage: 'https://viteplus.dev',
        binary: 'vp',
        commands: VP_COMMANDS.map(command => ({
            name: viteCommandName(command.name),
            subcommand: command.name,
            description: command.description,
            group: command.group,
            ...(command.aliases ? { aliases: command.aliases } : {}),
        })),
        actions: ACTIONS,
    };
}
