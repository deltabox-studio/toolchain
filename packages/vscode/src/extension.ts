import { type ChildProcess } from 'node:child_process';
import path from 'node:path';

import * as vscode from 'vscode';

import {
    captureCli,
    chooseDbxSource,
    cliInvocation,
    initDbxSource,
    setExtensionInfo,
    spawnCli,
    workspaceRoots,
} from './cli.js';
import { type HomeAction, HomeViewProvider } from './home-view.js';
import {
    discoverProjectGroups,
    discoverProjects,
    type Project,
    ProjectTreeProvider,
    readProjectGraph,
    TrackedFilesTreeProvider,
} from './projects.js';
import {
    loadProviders,
    type ProviderCommand,
    type ProviderCommandNode,
    type ProviderNode,
    ProviderTreeProvider,
    readProviderRegistry,
    writeProviderRegistry,
} from './providers.js';
import { type SchedulerState, SyncScheduler } from './sync-scheduler.js';
import { type Template, TemplateTreeProvider, loadTemplates } from './templates.js';

const SECTION = 'deltabox.toolchain';
const OUTPUT_NAME = 'deltabox toolchain';
const PROJECTS_VIEW_ID = 'deltabox.projects';
const FILES_VIEW_ID = 'deltabox.files';
const PROVIDERS_VIEW_ID = 'deltabox.providers';
const TEMPLATES_VIEW_ID = 'deltabox.templates';

/** The public documentation site (the Home "Need help?" link). */
const DOCS_URL = 'https://toolchain.deltabox.studio';

/** The workflow ids the CLI understands. */
const WORKFLOW_IDS = ['ci', 'changelog', 'release', 'sync', 'issues'];

/** Input globs watched by default (never generated outputs). */
const DEFAULT_WATCH = [
    '**/dbx.config.*',
    '**/tsconfig.default.json',
    '**/tsconfig.workspaces.json',
];

/** Matches the tsconfig sync task's "no workspaces" warning in the CLI output. */
const NO_WORKSPACES_WARNING = /no workspace tsconfig files found/i;

function config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(SECTION);
}

function getEnabled(): boolean {
    return config().get<boolean>('enabled', true);
}

export function activate(context: vscode.ExtensionContext): void {
    const output = vscode.window.createOutputChannel(OUTPUT_NAME);
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status.command = `${SECTION}.sync`;
    status.show();

    // Capture the extension's own path/version so the bundled `dbx.cjs` (and the
    // pinned `npx` fallback) resolve regardless of the extension id.
    setExtensionInfo(context.extension);

    // Detect the workspace's own `dbx` and ask once which one to run (see cli.ts).
    void initDbxSource(context);

    const tree = new ProjectTreeProvider();
    const treeView = vscode.window.createTreeView(PROJECTS_VIEW_ID, {
        treeDataProvider: tree,
        canSelectMany: true,
        showCollapseAll: true,
    });

    const files = new TrackedFilesTreeProvider();
    const filesView = vscode.window.createTreeView(FILES_VIEW_ID, {
        treeDataProvider: files,
        showCollapseAll: true,
    });

    const providers = new ProviderTreeProvider(() => workspaceRoots()[0]);
    const providersView = vscode.window.createTreeView(PROVIDERS_VIEW_ID, {
        treeDataProvider: providers,
        showCollapseAll: true,
    });

    const templates = new TemplateTreeProvider(() => workspaceRoots()[0]);
    const templatesView = vscode.window.createTreeView(TEMPLATES_VIEW_ID, {
        treeDataProvider: templates,
        showCollapseAll: true,
    });

    /** Set a `when`/`enablement` context key (drives command enablement). */
    const setContext = (key: string, value: boolean): void => {
        void vscode.commands.executeCommand('setContext', key, value);
    };

    /**
     * Refresh the context keys that gate command enablement: sync is only
     * meaningful when some project has a `dbx.config.*`, and the Vite+ commands
     * only when the provider is actually available.
     */
    const updateContextKeys = (): void => {
        const projects = discoverProjects();
        const listed = providers.list();
        setContext(
            'deltabox.canSync',
            projects.some(project => project.hasConfig)
        );
        setContext('deltabox.hasProviders', listed.length > 0);
        setContext(
            'deltabox.hasVite',
            listed.some(provider => provider.id === 'vite-plus' && provider.commands.length > 0)
        );
    };

    let enabled = getEnabled();
    let child: ChildProcess | undefined;
    let watchers: vscode.FileSystemWatcher[] = [];
    // The tsconfig "no workspaces" warning is shown once per session (a sync
    // runs on every watched change, so a notification each time would nag).
    let warnedNoWorkspaces = false;

    /** Run `dbx <args>` in `cwd`, streaming output to the channel. */
    const runCli = (cwd: string, args: string[]): Promise<number> => {
        output.appendLine(`\n> ${cliInvocation(cwd)} ${args.join(' ')}  (${cwd})`);
        return new Promise<number>(resolve => {
            let proc: ChildProcess;
            try {
                proc = spawnCli(cwd, args);
            } catch (error) {
                output.appendLine(`dbx: ${String(error)}`);
                resolve(1);
                return;
            }
            child = proc;
            let captured = '';
            const capture = (d: Buffer): void => {
                const text = d.toString();
                output.append(text);
                captured += text;
            };
            proc.stdout?.on('data', capture);
            proc.stderr?.on('data', capture);
            proc.on('error', error => {
                output.appendLine(`dbx: ${String(error)}`);
                child = undefined;
                resolve(1);
            });
            proc.on('exit', code => {
                child = undefined;
                if (!warnedNoWorkspaces && NO_WORKSPACES_WARNING.test(captured)) {
                    warnedNoWorkspaces = true;
                    void vscode.window
                        .showWarningMessage(
                            'deltabox: no workspace tsconfig files were found, but project references/composite (or a workspaces tsconfig) are configured. See the output channel.',
                            'Show output'
                        )
                        .then(choice => {
                            if (choice === 'Show output') output.show();
                        });
                }
                resolve(code ?? 0);
            });
        });
    };

    const runRoots = async (args: string[]): Promise<number[]> => {
        const roots = workspaceRoots();
        const results: number[] = [];
        for (const root of roots) results.push(await runCli(root, args));
        return results;
    };

    const runProjects = async (projects: Project[], args: string[]): Promise<number[]> => {
        const results: number[] = [];
        for (const project of projects) {
            const code = await runCli(project.dir, args);
            output.appendLine(`dbx: ${project.label} exited ${code}`);
            results.push(code);
        }
        return results;
    };

    const setStatus = (state: SchedulerState): void => {
        if (!enabled) {
            status.text = '$(circle-slash) dbx';
            status.tooltip = 'dbx: auto-sync disabled';
            return;
        }
        status.text = state === 'running' ? '$(sync~spin) dbx' : '$(check) dbx';
        status.tooltip = `dbx: ${state}`;
    };

    const scheduler = new SyncScheduler({
        debounceMs: () => config().get<number>('debounce', 300),
        run: async () => {
            const root = workspaceRoots()[0];
            if (!root) {
                output.appendLine('dbx: no workspace folder open.');
                return;
            }
            await runCli(root, [config().get<string>('command', 'sync')]);
        },
        onStateChange: setStatus,
    });

    const refreshViews = (): void => {
        tree.refresh();
        files.refresh();
        home.refresh();
        updateContextKeys();
        void providers.refresh();
        void templates.refresh();
    };

    const refreshGraph = async (): Promise<void> => {
        await runRoots(['projects']);
        refreshViews();
    };

    const checkSync = async (): Promise<void> => {
        const roots = workspaceRoots();
        if (roots.length === 0) {
            vscode.window.showWarningMessage('deltabox: no workspace folder open.');
            return;
        }
        const failed: string[] = [];
        for (const root of roots) {
            if ((await runCli(root, ['sync', '--recursive', '--check'])) !== 0) {
                failed.push(path.basename(root));
            }
        }
        if (failed.length > 0) {
            const choice = await vscode.window.showWarningMessage(
                `deltabox: generated files are out of date in ${failed.join(', ')}.`,
                'Run sync',
                'Show output'
            );
            if (choice === 'Run sync') await vscode.commands.executeCommand(`${SECTION}.syncAll`);
            else if (choice === 'Show output') output.show();
        } else {
            vscode.window.showInformationMessage('deltabox: all generated files are in sync.');
        }
    };

    /** Prompt for a subset of projects (multi-select). */
    const pickProjects = async (
        projects: Project[],
        placeHolder: string
    ): Promise<Project[] | undefined> => {
        if (projects.length === 0) return [];
        const picks = await vscode.window.showQuickPick(
            projects.map(project => ({
                label: project.label,
                description: project.relativePath,
                detail: project.dir,
                project,
            })),
            { canPickMany: true, placeHolder }
        );
        return picks?.map(pick => pick.project);
    };

    /** Prompt for one or more workflow ids (multi-select). */
    const pickWorkflows = async (): Promise<string[] | undefined> => {
        const picks = await vscode.window.showQuickPick(
            WORKFLOW_IDS.map(id => ({ label: id })),
            { canPickMany: true, placeHolder: 'Which workflows should run?' }
        );
        return picks?.map(pick => pick.label);
    };

    const goToProject = (dir: string): void => {
        void vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(dir));
    };

    const checkProject = async (dir: string, label: string): Promise<void> => {
        if ((await runCli(dir, ['sync', '--check'])) === 0) {
            vscode.window.showInformationMessage(`deltabox: ${label} is in sync.`);
            return;
        }
        const choice = await vscode.window.showWarningMessage(
            `deltabox: ${label} is out of sync.`,
            'Run sync',
            'Show output'
        );
        if (choice === 'Run sync') {
            await runCli(dir, ['sync']);
            refreshViews();
        } else if (choice === 'Show output') output.show();
    };

    const generateConfigs = async (): Promise<void> => {
        const missing = discoverProjects().filter(project => !project.hasConfig);
        if (missing.length === 0) {
            vscode.window.showInformationMessage('deltabox: every project already has a config.');
            return;
        }
        const selected = await pickProjects(missing, 'Generate a dbx config for which projects?');
        if (!selected || selected.length === 0) return;
        let failed = 0;
        for (const project of selected) {
            if ((await runCli(project.dir, ['project:config'])) !== 0) failed += 1;
        }
        await refreshGraph();
        if (failed === 0) {
            vscode.window.showInformationMessage(
                `deltabox: generated ${selected.length} config(s).`
            );
        } else {
            vscode.window.showWarningMessage(
                `deltabox: ${failed} config(s) failed. See the output channel.`
            );
            output.show();
        }
    };

    const generateProjectConfig = async (dir: string, label: string): Promise<void> => {
        const code = await runCli(dir, ['project:config']);
        await refreshGraph();
        if (code === 0)
            vscode.window.showInformationMessage(`deltabox: config written for ${label}.`);
        else output.show();
    };

    const runWorkflow = async (cwd: string): Promise<void> => {
        const ids = await pickWorkflows();
        if (!ids || ids.length === 0) return;
        const code = await runCli(cwd, ['workflow', ...ids]);
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: triggered ${ids.join(', ')}.`);
        } else {
            vscode.window.showWarningMessage(
                'deltabox: could not run the workflow(s). See the output channel.'
            );
            output.show();
        }
    };

    const resetToolchain = async (targets?: Project[]): Promise<void> => {
        const scope = await vscode.window.showQuickPick(
            [
                {
                    label: 'Generated files + manifest',
                    value: 'default',
                    detail: 'Keeps dbx.config.ts',
                },
                {
                    label: 'Everything (including config)',
                    value: 'all',
                    detail: 'Removes dbx.config.ts too',
                },
            ],
            { placeHolder: 'What should be removed?' }
        );
        if (!scope) return;

        const selected =
            targets ?? (await pickProjects(discoverProjects(), 'Reset which projects?'));
        if (!selected || selected.length === 0) return;

        const what =
            scope.value === 'all'
                ? 'generated files, the manifest and the config'
                : 'generated files and the manifest';
        const confirm = await vscode.window.showWarningMessage(
            `Remove ${what} from ${selected.length} project(s)?`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;

        const args = scope.value === 'all' ? ['reset', '--all'] : ['reset'];
        await runProjects(selected, args);
        await refreshGraph();
        vscode.window.showInformationMessage(`deltabox: reset ${selected.length} project(s).`);
    };

    /** Open an integrated terminal at `root` and run a `dbx` command. */
    const openTerminalCommand = (root: string, command: string, name: string): void => {
        const terminal = vscode.window.createTerminal({ name: `dbx: ${name}`, cwd: root });
        terminal.show();
        terminal.sendText(`${cliInvocation(root)} ${command}`);
    };

    /** Pick a Vite+ command from the provider and run it in a terminal. */
    const runVite = async (cwd?: string): Promise<void> => {
        const root = cwd ?? workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: no workspace folder open.');
            return;
        }
        const providers = await loadProviders(root);
        const vite = providers.find(provider => provider.id === 'vite-plus');
        if (!vite || vite.commands.length === 0) {
            vscode.window.showWarningMessage('deltabox: the Vite+ provider is unavailable.');
            return;
        }
        const choice = await vscode.window.showQuickPick(
            vite.commands.map(command => ({
                label: command.description,
                description: `vp ${command.subcommand}`,
                detail: `dbx ${command.name}`,
                command,
            })),
            { placeHolder: 'Which Vite+ command should run?', matchOnDetail: true }
        );
        if (!choice) return;
        // `vite:create` is the interactive `vp create`; drive it through the
        // extension instead of dropping into the CLI menu.
        if (choice.command.name === 'vite:create') {
            await createViteProject(root);
            return;
        }
        openTerminalCommand(root, choice.command.name, `vp ${choice.command.subcommand}`);
    };

    /** Turn a folder into a local template and register it (via the CLI). */
    const addTemplate = async (): Promise<void> => {
        const base = workspaceRoots()[0];
        if (!base) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const kind = await vscode.window.showQuickPick(
            [
                { label: 'Project', value: 'project', detail: 'A single-package project' },
                {
                    label: 'Workspace',
                    value: 'workspace',
                    detail: 'A monorepo workspace package',
                },
                { label: 'Application', value: 'application', detail: 'A runnable application' },
                { label: 'Folder', value: 'folder', detail: 'A bare folder of files' },
                { label: 'Toolchain', value: 'tooling', detail: 'A tooling config/pipeline' },
                { label: 'Pipeline', value: 'pipeline', detail: 'A CI/pipeline template' },
            ],
            { placeHolder: 'What kind of template is this?' }
        );
        if (!kind) return;
        const picked = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Use this folder as a template',
            defaultUri: vscode.Uri.file(base),
        });
        const dir = picked?.[0]?.fsPath ?? base;
        const name = await vscode.window.showInputBox({
            prompt: 'Template name',
            value: path.basename(dir),
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;
        const code = await runCli(base, [
            'template:init',
            dir,
            '--kind',
            kind.value,
            '--name',
            name,
            '--add',
            '--cwd',
            base,
        ]);
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: added template "${name}".`);
        } else {
            output.show();
        }
    };

    /** Remove a source from the template registry (via the CLI). */
    const removeTemplate = async (): Promise<void> => {
        const base = workspaceRoots()[0];
        if (!base) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        interface RegistryEntry {
            key: string;
            type?: string;
            name?: string;
            id?: string;
            kind?: string;
        }
        const listed = await captureCli(base, [
            'template:list',
            '--registry',
            '--json',
            '--cwd',
            base,
        ]);
        let sources: RegistryEntry[] = [];
        if (listed.code === 0) {
            try {
                sources = JSON.parse(listed.stdout) as RegistryEntry[];
            } catch {
                sources = [];
            }
        }
        if (sources.length === 0) {
            vscode.window.showInformationMessage('deltabox: the template registry is empty.');
            return;
        }
        const picked = await vscode.window.showQuickPick(
            sources.map(source => ({
                label: source.name ?? source.id ?? source.key,
                description: source.key,
                detail: [source.kind, source.type].filter(Boolean).join(' \u00b7 '),
                source,
            })),
            { placeHolder: 'Which template source should be removed?', matchOnDetail: true }
        );
        if (!picked) return;
        const code = await runCli(base, ['template:remove', picked.source.key, '--cwd', base]);
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: removed ${picked.source.key}.`);
        } else {
            output.show();
        }
    };

    /** Register a custom provider in `.dbx/toolchain/providers.json`. */
    const addProvider = async (): Promise<void> => {
        const root = workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const id = await vscode.window.showInputBox({
            prompt: 'Provider id',
            placeHolder: 'my-tool',
            validateInput: value =>
                /^[a-z0-9][a-z0-9-]*$/.test(value.trim())
                    ? undefined
                    : 'lowercase letters, digits and dashes',
        });
        if (!id) return;
        const name = await vscode.window.showInputBox({
            prompt: 'Display name',
            value: id,
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;
        const binary = await vscode.window.showInputBox({
            prompt: 'Binary the provider wraps (optional)',
            placeHolder: 'mytool',
        });
        const description = await vscode.window.showInputBox({ prompt: 'Description (optional)' });
        const homepage = await vscode.window.showInputBox({ prompt: 'Homepage URL (optional)' });

        const commands: ProviderCommand[] = [];
        for (;;) {
            const subcommand = await vscode.window.showInputBox({
                prompt: 'Command subcommand (leave empty to finish)',
                placeHolder: 'build',
            });
            if (subcommand === undefined) return;
            if (!subcommand.trim()) break;
            const label = await vscode.window.showInputBox({
                prompt: `Description for "${subcommand}"`,
                value: subcommand,
            });
            commands.push({
                name: `${id}:${subcommand}`,
                subcommand,
                description: label ?? subcommand,
            });
        }

        const registry = readProviderRegistry(root);
        if (registry.some(provider => provider.id === id)) {
            vscode.window.showWarningMessage(`deltabox: provider "${id}" already exists.`);
            return;
        }
        registry.push({
            id,
            name,
            ...(binary ? { binary } : {}),
            ...(description ? { description } : {}),
            ...(homepage ? { homepage } : {}),
            commands,
        });
        writeProviderRegistry(root, registry);
        await providers.refresh();
        updateContextKeys();
        vscode.window.showInformationMessage(`deltabox: added provider "${name}".`);
    };

    /** Remove a custom provider from the registry. */
    const removeProvider = async (node?: ProviderNode): Promise<void> => {
        if (!node || !node.custom) return;
        const confirm = await vscode.window.showWarningMessage(
            `Remove provider "${node.provider.name}"?`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;
        writeProviderRegistry(
            node.root,
            readProviderRegistry(node.root).filter(provider => provider.id !== node.provider.id)
        );
        await providers.refresh();
        updateContextKeys();
    };

    /** Run a provider command (`dbx <command.name>`) in a terminal. */
    const runProviderCommand = async (node?: ProviderNode | ProviderCommandNode): Promise<void> => {
        if (!node) return;
        let command = node.kind === 'command' ? node.command : undefined;
        if (!command) {
            if (node.provider.commands.length === 0) {
                vscode.window.showInformationMessage(
                    `deltabox: ${node.provider.name} has no commands.`
                );
                return;
            }
            const picked = await vscode.window.showQuickPick(
                node.provider.commands.map(candidate => ({
                    label: candidate.description,
                    description: `dbx ${candidate.name}`,
                    command: candidate,
                })),
                { placeHolder: `Which ${node.provider.name} command should run?` }
            );
            if (!picked) return;
            command = picked.command;
        }
        // `vite:create` prompts interactively; run it through the extension.
        if (command.name === 'vite:create') {
            await createViteProject(node.root);
            return;
        }
        openTerminalCommand(node.root, command.name, command.name);
    };

    const openProviderHomepage = (node?: ProviderNode): void => {
        const url = node?.provider.homepage;
        if (url) void vscode.env.openExternal(vscode.Uri.parse(url));
    };

    const copyProviderId = (node?: ProviderNode): void => {
        if (node) void vscode.env.clipboard.writeText(node.provider.id);
    };

    /** Show a template's descriptor (`dbx template:info --json`) in the output. */
    const showTemplateInfo = async (node?: Template): Promise<void> => {
        const root = workspaceRoots()[0];
        if (!node || !root) return;
        const result = await captureCli(root, ['template:info', node.id, '--json', '--cwd', root]);
        output.appendLine(`\n> dbx template:info ${node.id}`);
        output.append(result.stdout || result.stderr);
        output.show();
    };

    /**
     * Scaffold a Vite+ project through the extension UI: pick a concrete Vite+
     * template and run it via the same create pipeline as every other template,
     * instead of dropping the user into the interactive `vp create` menu.
     */
    const createViteProject = async (cwd?: string): Promise<void> => {
        let root = cwd ?? workspaceRoots()[0];
        if (!root) {
            const picked = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'Create the project here',
            });
            root = picked?.[0]?.fsPath;
        }
        if (!root) return;
        // The bare `vite-plus` builtin *is* the interactive `vp create`; always
        // pick a concrete Vite+ template so the create runs non-interactively.
        const vite = (await loadTemplates(root)).filter(
            template => template.type === 'vite-plus' && template.id !== 'vite-plus'
        );
        if (vite.length === 0) {
            vscode.window.showWarningMessage('deltabox: no Vite+ templates available.');
            return;
        }
        const picked = await vscode.window.showQuickPick(
            vite.map(template => ({
                label: template.name || template.id,
                description: template.id,
                detail: template.description,
                template,
            })),
            { placeHolder: 'Which Vite+ project should be created?', matchOnDetail: true }
        );
        if (!picked) return;
        await createFromTemplate(picked.template, root);
    };

    const home = new HomeViewProvider(
        context.extensionUri,
        () => {
            const groups = discoverProjectGroups();
            const projects = groups.flatMap(group => group.projects);
            const root = workspaceRoots()[0];
            const graph = root ? readProjectGraph(root) : undefined;
            const syncTimes = projects
                .map(project => project.syncedAt)
                .filter((value): value is string => Boolean(value))
                .sort();
            const listed = providers.list();
            return {
                enabled,
                canSync: projects.some(project => project.hasConfig),
                hasProviders: listed.length > 0,
                hasVite: listed.some(
                    provider => provider.id === 'vite-plus' && provider.commands.length > 0
                ),
                projects: projects.map(project => ({
                    label: project.label,
                    dir: project.dir,
                    relativePath: project.relativePath,
                    type: project.type,
                    hasConfig: project.hasConfig,
                    dependencies: project.dependencies,
                    ...(project.syncedAt ? { syncedAt: project.syncedAt } : {}),
                    trackedFiles: project.trackedFiles,
                })),
                ...(graph?.packageManager ? { packageManager: graph.packageManager } : {}),
                ...(syncTimes.length ? { lastSync: syncTimes[syncTimes.length - 1] } : {}),
            };
        },
        async (action: HomeAction) => {
            switch (action.type) {
                case 'syncAll':
                    await runRoots(['sync', '--recursive']);
                    refreshViews();
                    break;
                case 'syncActive':
                    await vscode.commands.executeCommand(`${SECTION}.sync`);
                    break;
                case 'syncSelected':
                    await vscode.commands.executeCommand(`${SECTION}.syncSelected`);
                    break;
                case 'syncCheck':
                    await checkSync();
                    break;
                case 'scaffold':
                    await vscode.commands.executeCommand(`${SECTION}.scaffold`);
                    break;
                case 'refresh':
                    await refreshGraph();
                    break;
                case 'generateConfigs':
                    await generateConfigs();
                    break;
                case 'runWorkflow':
                    await runWorkflow(workspaceRoots()[0] ?? process.cwd());
                    break;
                case 'resetToolchain':
                    await resetToolchain();
                    break;
                case 'toggle':
                    await vscode.commands.executeCommand(`${SECTION}.toggle`);
                    break;
                case 'syncProject': {
                    const project = discoverProjects().find(
                        candidate => candidate.dir === action.dir
                    );
                    if (project) await runProjects([project], ['sync']);
                    refreshViews();
                    break;
                }
                case 'checkProject': {
                    const project = discoverProjects().find(
                        candidate => candidate.dir === action.dir
                    );
                    await checkProject(action.dir, project?.label ?? path.basename(action.dir));
                    break;
                }
                case 'generateProjectConfig':
                    await generateProjectConfig(action.dir, path.basename(action.dir));
                    break;
                case 'runProjectWorkflow':
                    await runWorkflow(action.dir);
                    break;
                case 'resetProject': {
                    const project = discoverProjects().find(
                        candidate => candidate.dir === action.dir
                    );
                    await resetToolchain(
                        project
                            ? [project]
                            : [{ dir: action.dir, label: path.basename(action.dir) } as Project]
                    );
                    break;
                }
                case 'goToProject':
                    goToProject(action.dir);
                    break;
                case 'runVite':
                    await runVite();
                    break;
                case 'runProjectVite':
                    await runVite(action.dir);
                    break;
                case 'templateAdd':
                    await addTemplate();
                    break;
                case 'templateRemove':
                    await removeTemplate();
                    break;
                case 'openDocs':
                    void vscode.env.openExternal(vscode.Uri.parse(DOCS_URL));
                    break;
            }
        }
    );

    const rebuildWatchers = (): void => {
        for (const watcher of watchers) watcher.dispose();
        watchers = [];
        if (!enabled) return;
        for (const glob of config().get<string[]>('watch', DEFAULT_WATCH)) {
            const watcher = vscode.workspace.createFileSystemWatcher(glob);
            watcher.onDidChange(() => scheduler.notify());
            watcher.onDidCreate(() => scheduler.notify());
            watcher.onDidDelete(() => scheduler.notify());
            watchers.push(watcher);
        }
    };

    /** Scaffold from a template (optionally preselected from the Templates view). */
    const createFromTemplate = async (preselected?: Template, root?: string): Promise<void> => {
        const base = root ?? workspaceRoots()[0];
        if (!base) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        // The bare `vite-plus` template *is* the interactive `vp create`; route it
        // to the Vite+ picker so the user never lands in a CLI prompt.
        if (preselected?.id === 'vite-plus') {
            await createViteProject(base);
            return;
        }
        let template = preselected;
        if (!template) {
            const listed = await loadTemplates(base);
            if (listed.length === 0) {
                vscode.window.showWarningMessage('deltabox: no templates found.');
                return;
            }
            const picked = await vscode.window.showQuickPick(
                listed.map(candidate => ({
                    label: candidate.name || candidate.id,
                    description: candidate.id,
                    detail: [
                        candidate.kind,
                        candidate.online ? 'online' : 'offline',
                        candidate.type,
                    ]
                        .filter(Boolean)
                        .join(' · '),
                    template: candidate,
                })),
                { placeHolder: 'Which template should be used?', matchOnDetail: true }
            );
            if (!picked) return;
            template = picked.template;
        }

        const name = await vscode.window.showInputBox({
            prompt: 'Project name',
            value: 'my-app',
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;
        const scope = await vscode.window.showInputBox({
            prompt: 'npm scope (optional)',
            placeHolder: '@acme',
        });

        // Prompt for the template's own inputs (the same pipeline the CLI uses):
        // a select when the variable declares `options`, otherwise free text.
        const varArgs: string[] = [];
        for (const variable of template.variables ?? []) {
            if (variable.name === 'name' || variable.name === 'scope') continue;
            const message = variable.prompt ?? variable.name;
            if (variable.options && variable.options.length > 0) {
                const picked = await vscode.window.showQuickPick(variable.options, {
                    placeHolder: message,
                });
                if (picked === undefined) return;
                varArgs.push(`${variable.name}=${picked}`);
            } else {
                const value = await vscode.window.showInputBox({
                    prompt: message,
                    value: variable.default ?? '',
                });
                if (value === undefined) return;
                varArgs.push(`${variable.name}=${value}`);
            }
        }

        const baseArgs = ['create', '--template', template.id, '--name', name, '--cwd', base];
        if (scope) baseArgs.push('--scope', scope);
        if (varArgs.length > 0) baseArgs.push('--var', ...varArgs);

        // Opt-in post-scaffold actions (eg. Install dependencies?).
        const actionArgs: string[] = [];
        for (const action of template.actions ?? []) {
            const yesFirst = action.default === true;
            const picked = await vscode.window.showQuickPick(
                yesFirst ? ['Yes', 'No'] : ['No', 'Yes'],
                {
                    placeHolder: action.prompt ?? `Run ${action.id}?`,
                }
            );
            if (picked === undefined) return;
            if (picked === 'Yes') actionArgs.push(action.id);
        }
        if (actionArgs.length > 0) baseArgs.push('--action', ...actionArgs);

        // Run every template through the same pipeline (an argv array, no shell),
        // so a value like an npm `@scope` is never mangled by the terminal's shell
        // — PowerShell reads a bare `@name` as splatting and drops it. Vite+
        // templates then run `vp create <template> <name>` in the chosen dir.
        const dir = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Create here',
            defaultUri: vscode.Uri.file(base),
        });
        const out = dir?.[0]?.fsPath ?? base;
        const code = await runCli(base, [...baseArgs, '--out', out]);
        // Sync the new project so its managed files (and manifest) exist and the
        // Managed Files / Home views populate immediately. (Vite+ projects are not
        // dbx-managed out of the box, so there is nothing to sync.)
        if (code === 0 && !template.online) await runCli(out, ['sync']);
        await refreshGraph();
        if (code === 0) {
            vscode.window.showInformationMessage(
                `deltabox: created from template "${template.name}".`
            );
        } else {
            output.show();
        }
    };

    const scaffold = async (): Promise<void> => {
        const workspace = workspaceRoots()[0];
        // Offer *every* template (builtin, local, npm/git, Vite+) directly. The
        // first four entries are the curated dbx flows (the workspace one has its
        // own root/dir prompts), so those builtins are not repeated.
        const covered = new Set([
            'project',
            'monorepo',
            'monorepo-example',
            'workspace',
            'vite-plus',
        ]);
        const templates = workspace ? await loadTemplates(workspace) : [];
        const kind = await vscode.window.showQuickPick(
            [
                {
                    label: 'Single project',
                    command: 'project:init',
                    detail: 'One TypeScript package',
                    flow: 'project' as const,
                },
                {
                    label: 'Monorepo root',
                    command: 'project:init:monorepo',
                    detail: 'A monorepo root (no example workspace)',
                    flow: 'root' as const,
                },
                {
                    label: 'Monorepo root + example',
                    command: 'project:init:monorepo',
                    detail: 'Root plus one example workspace package',
                    flow: 'root' as const,
                    example: true,
                },
                {
                    label: 'Monorepo workspace',
                    command: 'project:init:workspace',
                    detail: 'A workspace package inside an existing monorepo',
                    flow: 'workspace' as const,
                },
                ...templates
                    .filter(template => !covered.has(template.id))
                    .map(template => ({
                        label: template.name || template.id,
                        command: '',
                        description: template.id,
                        detail: [
                            template.kind,
                            template.online ? 'online' : 'offline',
                            template.type,
                        ]
                            .filter(Boolean)
                            .join(' \u00b7 '),
                        flow: 'template' as const,
                        template,
                    })),
            ],
            { placeHolder: 'What kind of project should be scaffolded?', matchOnDetail: true }
        );
        if (!kind) return;

        if (kind.flow === 'template') {
            await createFromTemplate(kind.template);
            return;
        }

        const name = await vscode.window.showInputBox({
            prompt: kind.flow === 'workspace' ? 'Workspace name' : 'Project name',
            value: kind.flow === 'workspace' ? 'my-package' : 'my-app',
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;

        const scope = await vscode.window.showInputBox({
            prompt: 'npm scope (optional)',
            placeHolder: '@acme',
        });
        const packageManager =
            (await vscode.window.showQuickPick(['yarn', 'pnpm', 'npm', 'bun'], {
                placeHolder: 'Package manager',
            })) ?? 'yarn';
        const includeConfig = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
            ],
            { placeHolder: 'Include a dbx.config.ts? (recommended)' }
        );
        const base = workspaceRoots()[0];

        // A workspace is scaffolded *into* an existing monorepo root at a
        // relative directory; a project/root is scaffolded into a chosen dir.
        if (kind.flow === 'workspace') {
            const pickedRoot = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'Select monorepo root',
                defaultUri: base ? vscode.Uri.file(base) : undefined,
            });
            const root = pickedRoot?.[0]?.fsPath ?? base;
            if (!root) return;
            const dir = await vscode.window.showInputBox({
                prompt: 'Workspace directory (relative to the root)',
                value: `packages/${name}`,
                validateInput: value => (value.trim() ? undefined : 'Required'),
            });
            if (!dir) return;

            const args = [kind.command, '--name', name, '--root', root, '--dir', dir];
            if (scope) args.push('--scope', scope);
            if (includeConfig?.value === 'no') args.push('--no-config');
            args.push('--package-manager', packageManager);

            const code = await runCli(root, args);
            if (code === 0) await runCli(path.join(root, dir.replace(/\\/g, '/')), ['sync']);
            await refreshGraph();
            if (code === 0) {
                vscode.window.showInformationMessage(`deltabox: scaffolded workspace "${name}".`);
            }
            return;
        }

        const picked = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Scaffold here',
            defaultUri: base ? vscode.Uri.file(base) : undefined,
        });
        const target = picked?.[0]?.fsPath ?? base;
        if (!target) return;

        const args = [kind.command, '--name', name];
        if (scope) args.push('--scope', scope);
        if (includeConfig?.value === 'no') args.push('--no-config');
        if ((kind as { example?: boolean }).example) args.push('--example');
        args.push('--package-manager', packageManager);
        args.push('--out', target);

        const code = await runCli(target, args);
        if (code === 0) await runCli(target, ['sync']);
        await refreshGraph();
        if (code === 0) vscode.window.showInformationMessage(`deltabox: scaffolded "${name}".`);
    };

    const provider = vscode.window.registerWebviewViewProvider('deltabox.home', home, {
        webviewOptions: { retainContextWhenHidden: true },
    });

    context.subscriptions.push(
        output,
        status,
        provider,
        treeView,
        filesView,
        providersView,
        templatesView,
        vscode.commands.registerCommand('deltabox.toolchain.sync', async () => {
            const root = workspaceRoots()[0];
            if (root) await runCli(root, ['sync']);
            refreshViews();
        }),
        vscode.commands.registerCommand('deltabox.toolchain.syncAll', async () => {
            await runRoots(['sync', '--recursive']);
            refreshViews();
        }),
        vscode.commands.registerCommand('deltabox.toolchain.syncSelected', async () => {
            const projects = treeView.selection.filter(
                (node): node is Project => node.kind === 'project'
            );
            if (projects.length === 0) {
                vscode.window.showInformationMessage(
                    'Select one or more projects in the Projects view first.'
                );
                return;
            }
            await runProjects(projects, ['sync']);
            refreshViews();
        }),
        vscode.commands.registerCommand(
            'deltabox.toolchain.syncProject',
            async (project: Project) => {
                await runCli(project.dir, ['sync']);
                refreshViews();
            }
        ),
        vscode.commands.registerCommand('deltabox.toolchain.syncCheck', checkSync),
        vscode.commands.registerCommand('deltabox.toolchain.chooseDbxSource', () =>
            chooseDbxSource(context)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.scaffold', scaffold),
        vscode.commands.registerCommand('deltabox.toolchain.refresh', refreshGraph),
        vscode.commands.registerCommand('deltabox.toolchain.refreshFiles', () => files.refresh()),
        vscode.commands.registerCommand(
            'deltabox.toolchain.checkProject',
            async (node?: Project) => {
                if (node) await checkProject(node.dir, node.label);
            }
        ),
        vscode.commands.registerCommand('deltabox.toolchain.generateConfigs', generateConfigs),
        vscode.commands.registerCommand(
            'deltabox.toolchain.generateConfig',
            async (node?: Project) => {
                if (node) await generateProjectConfig(node.dir, node.label);
            }
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.runWorkflow',
            async (node?: Project) => {
                await runWorkflow(node?.dir ?? workspaceRoots()[0] ?? process.cwd());
            }
        ),
        vscode.commands.registerCommand('deltabox.toolchain.runVite', () => runVite()),
        vscode.commands.registerCommand('deltabox.toolchain.runProjectVite', (node?: Project) =>
            runVite(node?.dir)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.createVite', () => createViteProject()),
        vscode.commands.registerCommand('deltabox.toolchain.templateAdd', () => addTemplate()),
        vscode.commands.registerCommand('deltabox.toolchain.templateRemove', () =>
            removeTemplate()
        ),
        vscode.commands.registerCommand('deltabox.toolchain.providers.refresh', () =>
            providers.refresh()
        ),
        vscode.commands.registerCommand('deltabox.toolchain.providers.add', addProvider),
        vscode.commands.registerCommand(
            'deltabox.toolchain.providers.remove',
            (node?: ProviderNode) => removeProvider(node)
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.providers.runCommand',
            (node?: ProviderNode | ProviderCommandNode) => runProviderCommand(node)
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.providers.openHomepage',
            (node?: ProviderNode) => openProviderHomepage(node)
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.providers.copyId',
            (node?: ProviderNode) => copyProviderId(node)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.refresh', () =>
            templates.refresh()
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.add', async () => {
            await addTemplate();
            await templates.refresh();
        }),
        vscode.commands.registerCommand('deltabox.toolchain.templates.removeSource', async () => {
            await removeTemplate();
            await templates.refresh();
        }),
        vscode.commands.registerCommand('deltabox.toolchain.templates.create', (node?: Template) =>
            createFromTemplate(node)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.info', (node?: Template) =>
            showTemplateInfo(node)
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.templates.copyId',
            (node?: Template) => {
                if (node) void vscode.env.clipboard.writeText(node.id);
            }
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.resetToolchain',
            async (node?: Project) => {
                await resetToolchain(node ? [node] : undefined);
            }
        ),
        vscode.commands.registerCommand('deltabox.toolchain.goToProject', (node?: Project) => {
            if (node) goToProject(node.dir);
        }),
        vscode.commands.registerCommand('deltabox.toolchain.toggle', async () => {
            enabled = !enabled;
            await config().update('enabled', enabled, vscode.ConfigurationTarget.Workspace);
            rebuildWatchers();
            setStatus('idle');
            home.refresh();
            output.appendLine(`dbx: auto-sync ${enabled ? 'enabled' : 'disabled'}.`);
        }),
        vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration(SECTION)) return;
            enabled = getEnabled();
            rebuildWatchers();
            setStatus('idle');
            home.refresh();
        }),
        new vscode.Disposable(() => {
            child?.kill();
            for (const watcher of watchers) watcher.dispose();
            scheduler.dispose();
        })
    );

    // The provider list is loaded asynchronously (a CLI spawn), but both the Home
    // model (`hasVite`) and the `deltabox.hasVite` context key depend on it.
    // Recompute them whenever it reloads, otherwise a Home view rendered before
    // the list resolves would leave the "Run Vite+" action disabled from a cold
    // start (the context key was refreshed, but the webview was never re-posted).
    context.subscriptions.push(
        providers.onDidChangeTreeData(() => {
            updateContextKeys();
            home.refresh();
        })
    );

    rebuildWatchers();
    setStatus('idle');
    updateContextKeys();
    void providers.refresh();
    void templates.refresh();
    output.appendLine('dbx: extension activated.');
}

export function deactivate(): void {
    // Cleanup is handled through `context.subscriptions`.
}
