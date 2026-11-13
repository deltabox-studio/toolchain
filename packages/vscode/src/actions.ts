import type { PromptAction } from './prompt.js';

/** Every VS Code action, grouped by the CLI area it covers. */
export function actionGroups(): PromptAction[] {
    return [
        // Changelog
        action(
            'changelog.generate',
            'Generate changelog',
            'Changelog',
            'deltabox.toolchain.changelog',
            'Run the changelog pipeline.'
        ),
        action(
            'changelog.dryRun',
            'Preview changelog (dry run)',
            'Changelog',
            'deltabox.toolchain.changelogDryRun',
            'Write CHANGELOG.proposed.md without touching the tree.'
        ),
        action(
            'changelog.format',
            'Format changelogs',
            'Changelog',
            'deltabox.toolchain.changelogFormat',
            'Regroup existing changelog entries.'
        ),
        action(
            'changelog.releaseNotes',
            'Extract release notes',
            'Changelog',
            'deltabox.toolchain.changelogReleaseNotes',
            'Print the notes for a released version.'
        ),
        action(
            'changelog.workflow',
            'Run workflow',
            'Changelog',
            'deltabox.toolchain.runWorkflow',
            'Trigger one or more generated workflows.'
        ),

        // CI
        action(
            'ci.configs',
            'Generate configs',
            'CI',
            'deltabox.toolchain.generateConfigs',
            'Regenerate env/types/schema/docs artifacts.'
        ),
        action(
            'ci.runWorkflow',
            'Run CI workflow',
            'CI',
            'deltabox.toolchain.runWorkflow',
            'Trigger the generated CI workflow.'
        ),

        // Cleanup
        action(
            'cleanup.build',
            'Clean build artifacts',
            'Cleanup',
            'deltabox.toolchain.cleanup',
            'Remove dist/ and *.tsbuildinfo.'
        ),
        action(
            'cleanup.turbo',
            'Clean turbo cache',
            'Cleanup',
            'deltabox.toolchain.cleanupTurbo',
            'Remove .turbo/.'
        ),
        action(
            'cleanup.reset',
            'Reset tooling',
            'Cleanup',
            'deltabox.toolchain.resetToolchain',
            'Remove generated files and the manifest.'
        ),

        // Config
        action(
            'config.env',
            'Generate config env file',
            'Config',
            'deltabox.toolchain.configEnv',
            'Run `dbx config:env`.'
        ),
        action(
            'config.types',
            'Generate config types',
            'Config',
            'deltabox.toolchain.configTypes',
            'Run `dbx config:types`.'
        ),
        action(
            'config.schema',
            'Generate config schema',
            'Config',
            'deltabox.toolchain.configSchema',
            'Run `dbx config:schema`.'
        ),
        action(
            'config.docs',
            'Generate config docs',
            'Config',
            'deltabox.toolchain.configDocs',
            'Run `dbx config:markdown`.'
        ),
        action(
            'config.all',
            'Generate all configs',
            'Config',
            'deltabox.toolchain.configAll',
            'Run `dbx config:all`.'
        ),
        action(
            'config.json',
            'Generate config JSON',
            'Config',
            'deltabox.toolchain.configJson',
            'Run `dbx config:json`.'
        ),
        action(
            'config.cli',
            'Generate CLI reference',
            'Config',
            'deltabox.toolchain.configCli',
            'Run `dbx config:cli`.'
        ),

        // MCP
        action(
            'mcp.install',
            'Install MCP server',
            'MCP',
            'deltabox.toolchain.installMcp',
            'Install the dbx MCP server.'
        ),
        action(
            'mcp.list',
            'List MCP installations',
            'MCP',
            'deltabox.toolchain.mcpList',
            'Show where the MCP server is installed.'
        ),
        action(
            'mcp.serve',
            'Serve MCP',
            'MCP',
            'deltabox.toolchain.mcpServe',
            'Start the MCP stdio server.'
        ),

        // Migrate
        action(
            'migrate.run',
            'Migrate tooling',
            'Migrate',
            'deltabox.toolchain.migrate',
            'Migrate Biome/ESLint/Prettier/Dprint config.'
        ),
        action(
            'migrate.list',
            'List migrations',
            'Migrate',
            'deltabox.toolchain.migrateList',
            'Show available migrations.'
        ),

        // Pack
        action(
            'pack.cleanup',
            'Clean build artifacts',
            'Pack',
            'deltabox.toolchain.cleanup',
            'Run `dbx cleanup`.'
        ),
        action(
            'pack.cleanupTurbo',
            'Clean turbo cache',
            'Pack',
            'deltabox.toolchain.cleanupTurbo',
            'Run `dbx cleanup:turbo`.'
        ),

        // Project
        action(
            'project.init',
            'Initialize project',
            'Project',
            'deltabox.toolchain.projectInit',
            'Scaffold a single-package project.'
        ),
        action(
            'project.workspace',
            'Initialize workspace',
            'Project',
            'deltabox.toolchain.projectInitWorkspace',
            'Scaffold a monorepo workspace package.'
        ),
        action(
            'project.monorepo',
            'Initialize monorepo',
            'Project',
            'deltabox.toolchain.projectInitMonorepo',
            'Scaffold a monorepo root.'
        ),
        action(
            'project.scaffold',
            'Scaffold project',
            'Project',
            'deltabox.toolchain.scaffold',
            'Scaffold from a builtin/custom template.'
        ),
        action(
            'project.vite',
            'Create Vite+ project',
            'Project',
            'deltabox.toolchain.createVite',
            'Scaffold a Vite+ application.'
        ),
        action(
            'project.config',
            'Project config',
            'Project',
            'deltabox.toolchain.projectConfig',
            'Run `dbx project:config`.'
        ),

        // Providers
        action(
            'providers.add',
            'Add provider',
            'Providers',
            'deltabox.toolchain.providers.add',
            'Add a provider registry entry.'
        ),
        action(
            'providers.refresh',
            'Refresh providers',
            'Providers',
            'deltabox.toolchain.providers.refresh',
            'Reload the provider list.'
        ),

        // Registries
        action(
            'registries.new',
            'New registry',
            'Registries',
            'deltabox.toolchain.registry.new',
            'Create a registry entry.'
        ),
        action(
            'registries.remove',
            'Remove registry',
            'Registries',
            'deltabox.toolchain.registry.remove',
            'Remove a registry entry.'
        ),

        // Sync
        action(
            'sync.all',
            'Sync all',
            'Sync',
            'deltabox.toolchain.syncAll',
            'Run `dbx sync --recursive`.'
        ),
        action(
            'sync.active',
            'Sync active project',
            'Sync',
            'deltabox.toolchain.sync',
            'Sync the active project.'
        ),
        action(
            'sync.check',
            'Check sync',
            'Sync',
            'deltabox.toolchain.syncCheck',
            'Run `dbx sync --check`.'
        ),
        action(
            'sync.tsconfig',
            'Sync tsconfig',
            'Sync',
            'deltabox.toolchain.tsconfig',
            'Regenerate workspace tsconfigs.'
        ),
        action(
            'sync.fmt',
            'Format project',
            'Sync',
            'deltabox.toolchain.fmt',
            'Run the detected formatter.'
        ),
        action(
            'sync.lint',
            'Lint project',
            'Sync',
            'deltabox.toolchain.lint',
            'Run the detected linter.'
        ),
        action(
            'sync.toggle',
            'Toggle auto-sync',
            'Sync',
            'deltabox.toolchain.toggle',
            'Enable or disable auto-sync.'
        ),

        // Templates
        action(
            'templates.add',
            'Add template',
            'Templates',
            'deltabox.toolchain.templateAdd',
            'Register a local template.'
        ),
        action(
            'templates.remove',
            'Remove template',
            'Templates',
            'deltabox.toolchain.templateRemove',
            'Remove a registered template.'
        ),
        action(
            'templates.create',
            'Create from template',
            'Templates',
            'deltabox.toolchain.templates.create',
            'Scaffold from a template.'
        ),
        action(
            'templates.info',
            'Template info',
            'Templates',
            'deltabox.toolchain.templates.info',
            'Show a template manifest.'
        ),
        action(
            'templates.refresh',
            'Refresh templates',
            'Templates',
            'deltabox.toolchain.templates.refresh',
            'Reload the template list.'
        ),
        action(
            'templates.list',
            'List templates',
            'Templates',
            'deltabox.toolchain.templates.list',
            'Run `dbx template:list`.'
        ),
        action(
            'templates.registry',
            'Template registry',
            'Templates',
            'deltabox.toolchain.templates.registry',
            'Run `dbx template:registry`.'
        ),
        action(
            'templates.source',
            'Template source',
            'Templates',
            'deltabox.toolchain.templates.source',
            'Run `dbx source`.'
        ),

        // Tools
        action(
            'tools.dbxSource',
            'Choose dbx source',
            'Tools',
            'deltabox.toolchain.chooseDbxSource',
            'Pick which dbx binary the extension uses.'
        ),
        action(
            'tools.version',
            'Select dbx version',
            'Tools',
            'deltabox.toolchain.selectVersion',
            'Pin the toolchain version.'
        ),
        action(
            'tools.refresh',
            'Refresh projects',
            'Tools',
            'deltabox.toolchain.refresh',
            'Rediscover projects.'
        ),
        action(
            'tools.refreshFiles',
            'Refresh tracked files',
            'Tools',
            'deltabox.toolchain.refreshFiles',
            'Reload the managed-file view.'
        ),
        action(
            'tools.vite',
            'Run Vite+ command',
            'Tools',
            'deltabox.toolchain.runVite',
            'Run a Vite+ command.'
        ),
        action(
            'tools.projects',
            'Discover projects',
            'Tools',
            'deltabox.toolchain.projects',
            'Run `dbx projects`.'
        ),
        action(
            'tools.providers',
            'List providers',
            'Tools',
            'deltabox.toolchain.providersList',
            'Run `dbx providers`.'
        ),
        action(
            'tools.watch',
            'Watch and sync',
            'Tools',
            'deltabox.toolchain.watch',
            'Start `dbx watch` (long-running).'
        ),
        action(
            'tools.enable',
            'Enable toolchain',
            'Tools',
            'deltabox.toolchain.enable',
            'Run `dbx enable`.'
        ),
        action(
            'tools.disable',
            'Disable toolchain',
            'Tools',
            'deltabox.toolchain.disable',
            'Run `dbx disable`.'
        ),
        action(
            'tools.state',
            'Show enabled state',
            'Tools',
            'deltabox.toolchain.state',
            'Run `dbx enabled --json`.'
        ),
    ];
}

function action(
    id: string,
    label: string,
    group: string,
    command: string,
    description?: string
): PromptAction {
    return { id, label, group, command, ...(description ? { description } : {}) };
}

/** Group actions for the Actions tree (sorted groups; sorted actions). */
export function groupedActions(): { group: string; actions: PromptAction[] }[] {
    const groups = new Map<string, PromptAction[]>();
    for (const entry of actionGroups()) {
        const list = groups.get(entry.group) ?? [];
        list.push(entry);
        groups.set(entry.group, list);
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, actions]) => ({
            group,
            actions: actions.sort((a, b) => a.label.localeCompare(b.label)),
        }));
}
