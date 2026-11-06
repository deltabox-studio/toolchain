import { type ChildProcess } from 'node:child_process';
import path from 'node:path';

import * as vscode from 'vscode';

import {
    captureCli,
    chooseDbxSource,
    cliInvocation,
    exitCodeOf,
    initDbxSource,
    selectVersion,
    setExtensionInfo,
    spawnCli,
    workspaceRoots,
} from './cli.js';
import { createGenerateCommands } from './commands/generate.js';
import { createMigrateCommand } from './commands/migrate.js';
import { createProviderRegistryCommands } from './commands/providers.js';
import { createResetCommand } from './commands/reset.js';
import { createScaffoldCommands } from './commands/scaffold.js';
import { createSyncCommands } from './commands/sync.js';
import { createTsconfigCommand } from './commands/tsconfig.js';
import { createWorkflowCommands } from './commands/workflows.js';
import { type HomeAction, HomeViewProvider } from './home-view.js';
import {
    discoverProjectGroups,
    discoverProjects,
    type Project,
    ProjectTreeProvider,
    readProjectGraph,
    setTsconfigFileNames,
    TrackedFilesTreeProvider,
} from './projects.js';
import {
    loadProviders,
    type ProviderCommandNode,
    type ProviderNode,
    ProviderTreeProvider,
} from './providers.js';
import { RegistryTreeProvider, type RegistryItemNode } from './registries.js';
import { type SchedulerState, SyncScheduler } from './sync-scheduler.js';
import { type Template, TemplateTreeProvider } from './templates.js';
import { defaultWatchInputs, parseWatchInputs, type WatchInputs } from './watch-inputs.js';
import { WatcherManager } from './watcher-manager.js';

const SECTION = 'deltabox.toolchain';
const OUTPUT_NAME = 'deltabox toolchain';
const PROJECTS_VIEW_ID = 'deltabox.projects';
const FILES_VIEW_ID = 'deltabox.files';
const PROVIDERS_VIEW_ID = 'deltabox.providers';
const TEMPLATES_VIEW_ID = 'deltabox.templates';
const REGISTRIES_VIEW_ID = 'deltabox.registries';

/** The public documentation site (the Home "Need help?" link). */
const DOCS_URL = 'https://toolchain.deltabox.studio';

/** How long to wait for `dbx watch --list` before falling back to the defaults. */
const WATCH_INPUTS_TIMEOUT_MS = 30_000;

/** Matches the tsconfig sync task's "no workspaces" warning in the CLI output. */
const NO_WORKSPACES_WARNING = /no workspace tsconfig files found/i;

function config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(SECTION);
}

/**
 * The `deltabox.toolchain.watch` globs the user set explicitly (any scope), or
 * `undefined` to watch the inputs resolved from each project's config.
 */
function userWatchGlobs(): string[] | undefined {
    const inspected = config().inspect<string[]>('watch');
    return inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
}

/** Ask the CLI which inputs a root syncs from (custom tsconfig names resolved). */
async function resolveWatchInputs(root: string): Promise<WatchInputs> {
    const result = await captureCli(root, ['watch', '--list', '--json'], WATCH_INPUTS_TIMEOUT_MS);
    return (result.code === 0 && parseWatchInputs(result.stdout)) || defaultWatchInputs();
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

    const registries = new RegistryTreeProvider(() => workspaceRoots()[0]);
    const registriesView = vscode.window.createTreeView(REGISTRIES_VIEW_ID, {
        treeDataProvider: registries,
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
    // The tsconfig "no workspaces" warning is shown once per session (a sync
    // runs on every watched change, so a notification each time would nag).
    let warnedNoWorkspaces = false;

    interface RemovedFile {
        path: string;
        content: string;
    }

    /** Show the removed managed files with a Restore action. */
    const notifyRemovedFiles = async (cwd: string, files: RemovedFile[]): Promise<void> => {
        if (files.length === 0) return;
        const choice = await vscode.window.showInformationMessage(
            `deltabox: removed ${files.length} managed file(s).`,
            {
                modal: true,
                detail: files.map(file => file.path).join('\n'),
            },
            'Restore',
            'Close'
        );
        if (choice !== 'Restore') return;
        for (const file of files) {
            const uri = vscode.Uri.file(path.join(cwd, file.path));
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(uri.fsPath)));
            await vscode.workspace.fs.writeFile(uri, new Uint8Array(Buffer.from(file.content)));
        }
        vscode.window.showInformationMessage(`deltabox: restored ${files.length} file(s).`);
    };

    /** Sync through the CLI's JSON output so removed files can be restored. */
    const runSyncCli = async (cwd: string, args: string[]): Promise<number> => {
        output.appendLine(`\n> ${cliInvocation(cwd)} ${args.join(' ')} --json  (${cwd})`);
        const result = await captureCli(cwd, [...args, '--json']);
        output.append(result.stdout || result.stderr);
        let removed: RemovedFile[] = [];
        if (result.code === 0) {
            try {
                const parsed = JSON.parse(result.stdout) as {
                    removedFiles?: RemovedFile[];
                    results?: { result?: { removedFiles?: RemovedFile[] } }[];
                };
                removed = parsed.results
                    ? parsed.results.flatMap(entry => entry.result?.removedFiles ?? [])
                    : (parsed.removedFiles ?? []);
            } catch {
                // non-JSON output; nothing to notify
            }
        }
        await notifyRemovedFiles(cwd, removed);
        return result.code;
    };

    /** Run `dbx <args>` in `cwd`, streaming output to the channel. */
    const runCli = (cwd: string, args: string[]): Promise<number> => {
        if (args[0] === 'sync' && !args.includes('--check') && !args.includes('--json')) {
            return runSyncCli(cwd, args);
        }
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
            proc.on('close', (code, signal) => {
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
                resolve(exitCodeOf(code, signal));
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

    async function rebuildWatchers(): Promise<void> {
        await watcherManager?.rebuild();
    }
    // Roots with a pending input change. A user glob has no owning root and
    // means "every root"; otherwise only the root whose input changed is synced,
    // so a file in one workspace folder never resyncs an unrelated one.
    const pendingRoots = new Set<string>();
    let pendingAll = false;
    const scheduler = new SyncScheduler({
        debounceMs: () => config().get<number>('debounce', 300),
        run: async () => {
            const all = workspaceRoots();
            if (all.length === 0) {
                output.appendLine('dbx: no workspace folder open.');
                return;
            }
            const roots =
                pendingAll || pendingRoots.size === 0
                    ? all
                    : all.filter(root => pendingRoots.has(root));
            pendingRoots.clear();
            pendingAll = false;
            if (roots.length === 0) return;
            const command = config().get<string>('command', 'sync');
            for (const root of roots) await runCli(root, [command]);
            // The sync may have created/renamed generated tsconfig files: refresh
            // the concrete watcher set (non-recursive, project-graph based).
            void rebuildWatchers();
        },
        onStateChange: setStatus,
    });
    const watcherManager = new WatcherManager({
        enabled: () => enabled,
        userGlobs: userWatchGlobs,
        roots: workspaceRoots,
        resolveInputs: resolveWatchInputs,
        onResolved: (root, inputs) => {
            setTsconfigFileNames(root, inputs.tsconfig);
            tree.refresh();
        },
        onChange: root => {
            if (root) pendingRoots.add(root);
            else pendingAll = true;
            scheduler.notify();
        },
        log: message => output.appendLine(message),
    });

    const refreshViews = (): void => {
        tree.refresh();
        files.refresh();
        home.refresh();
        updateContextKeys();
        void providers.refresh();
        void templates.refresh();
        void registries.refresh();
    };

    /**
     * Mirror the `deltabox.registrySearchPaths` setting into the global CLI
     * config (`~/.dbx/toolchain/cli/config.json`), and record the VS Code user
     * dir there so the CLI can find the global `settings.json`.
     */
    const syncGlobalTemplatePaths = async (initial = false): Promise<void> => {
        const vscodeDir = path.dirname(path.dirname(context.globalStorageUri.fsPath));
        const paths = vscode.workspace
            .getConfiguration('deltabox')
            .get<string[]>('registrySearchPaths', [])
            .filter(Boolean);
        const args = ['template:registry', '--vscode-dir', vscodeDir];
        if (paths.length > 0) args.push('--set', ...paths);
        else if (!initial) args.push('--clear');
        await captureCli(workspaceRoots()[0] ?? process.cwd(), args);
    };

    /** Mirror the provider search-path setting into the global CLI config. */
    const syncGlobalProviderPaths = async (initial = false): Promise<void> => {
        const paths = vscode.workspace
            .getConfiguration('deltabox')
            .get<string[]>('providerRegistrySearchPaths', [])
            .filter(Boolean);
        const args = ['registry', '--kind', 'providers', '--scope', 'global'];
        if (paths.length > 0) args.push('--set', ...paths);
        else if (!initial) args.push('--clear');
        else return;
        await captureCli(workspaceRoots()[0] ?? process.cwd(), args);
    };

    const refreshGraph = async (): Promise<void> => {
        await runRoots(['projects']);
        refreshViews();
    };

    const commandDeps = {
        output,
        runCli,
        captureCli,
        workspaceRoots,
        refreshGraph,
        refreshViews,
        runRoots,
        runProjects,
        selectedProjects: (): Project[] =>
            treeView.selection.filter((node): node is Project => node.kind === 'project'),
        section: SECTION,
    };
    const syncCommands = createSyncCommands(commandDeps);
    const generateCommands = createGenerateCommands(commandDeps);
    const migrateTooling = createMigrateCommand(commandDeps);
    const resetToolchain = createResetCommand(commandDeps);
    const manageTsconfig = createTsconfigCommand(commandDeps);
    const { runWorkflow } = createWorkflowCommands(commandDeps);
    const { createViteProject, createFromTemplate, scaffold, addTemplate, removeTemplate } =
        createScaffoldCommands(commandDeps);
    const goToProject = (dir: string): void => {
        void vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(dir));
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

    const {
        addProvider,
        removeProvider,
        newRegistry,
        removeRegistry,
        removeRegistryEntry,
        addRegistryEntry,
        runProviderCommand,
        openProviderHomepage,
        copyProviderId,
        openRegistryItem,
    } = createProviderRegistryCommands({
        ...commandDeps,
        providers,
        templates,
        registries,
        updateContextKeys,
        createViteProject,
        addTemplate,
        openTerminalCommand,
    });
    /** Show a template's descriptor (`dbx template:info --json`) in the output. */
    const showTemplateInfo = async (node?: Template): Promise<void> => {
        const root = workspaceRoots()[0];
        if (!node || !root) return;
        const result = await captureCli(root, ['template:info', node.id, '--json', '--cwd', root]);
        output.appendLine(`\n> dbx template:info ${node.id}`);
        output.append(result.stdout || result.stderr);
        output.show();
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
                    await syncCommands.syncAll();
                    break;
                case 'syncActive':
                    await vscode.commands.executeCommand(`${SECTION}.sync`);
                    break;
                case 'syncSelected':
                    await vscode.commands.executeCommand(`${SECTION}.syncSelected`);
                    break;
                case 'syncCheck':
                    await syncCommands.checkSync();
                    break;
                case 'syncTsconfig':
                    await vscode.commands.executeCommand(`${SECTION}.syncTsconfig`);
                    break;
                case 'scaffold':
                    await vscode.commands.executeCommand(`${SECTION}.scaffold`);
                    break;
                case 'refresh':
                    await refreshGraph();
                    break;
                case 'generateConfigs':
                    await generateCommands.generateConfigs();
                    break;
                case 'runWorkflow':
                    await runWorkflow(workspaceRoots()[0] ?? process.cwd());
                    break;
                case 'migrate':
                    await migrateTooling();
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
                    await syncCommands.checkProject(
                        action.dir,
                        project?.label ?? path.basename(action.dir)
                    );
                    break;
                }
                case 'generateProjectConfig':
                    await generateCommands.generateProjectConfig(
                        action.dir,
                        path.basename(action.dir)
                    );
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
                case 'runProviderCommand':
                    await vscode.commands.executeCommand(`${SECTION}.providers.runCommand`);
                    break;
                case 'createVite':
                    await createViteProject();
                    break;
                case 'chooseDbxSource':
                    await vscode.commands.executeCommand(`${SECTION}.chooseDbxSource`);
                    break;
                case 'refreshFiles':
                    await files.refresh();
                    break;
                case 'addProvider':
                    await addProvider();
                    await providers.refresh();
                    break;
                case 'refreshProviders':
                    await providers.refresh();
                    break;
                case 'refreshTemplates':
                    await templates.refresh();
                    break;
                case 'registryNew':
                    await newRegistry();
                    break;
                case 'registryRemove':
                    await removeRegistry();
                    break;
                case 'selectVersion':
                    await selectVersion();
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
                case 'openSettings':
                    await vscode.commands.executeCommand(
                        'workbench.action.openSettings',
                        `@ext:${context.extension.id}`
                    );
                    break;
            }
        }
    );

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
        registriesView,
        vscode.commands.registerCommand('deltabox.toolchain.sync', syncCommands.syncActive),
        vscode.commands.registerCommand('deltabox.toolchain.syncAll', syncCommands.syncAll),
        vscode.commands.registerCommand(
            'deltabox.toolchain.syncTsconfig',
            syncCommands.syncTsconfig
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.syncSelected',
            syncCommands.syncSelected
        ),
        vscode.commands.registerCommand('deltabox.toolchain.syncProject', syncCommands.syncProject),
        vscode.commands.registerCommand('deltabox.toolchain.syncCheck', syncCommands.checkSync),
        vscode.commands.registerCommand('deltabox.toolchain.tsconfig', manageTsconfig),
        vscode.commands.registerCommand('deltabox.toolchain.chooseDbxSource', () =>
            chooseDbxSource(context)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.selectVersion', () => selectVersion()),
        vscode.commands.registerCommand('deltabox.toolchain.scaffold', scaffold),
        vscode.commands.registerCommand('deltabox.toolchain.refresh', refreshGraph),
        vscode.commands.registerCommand('deltabox.toolchain.refreshFiles', () => files.refresh()),
        vscode.commands.registerCommand(
            'deltabox.toolchain.checkProject',
            async (node?: Project) => {
                if (node) await syncCommands.checkProject(node.dir, node.label);
            }
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.generateConfigs',
            generateCommands.generateConfigs
        ),
        vscode.commands.registerCommand('deltabox.toolchain.migrate', () => migrateTooling()),
        vscode.commands.registerCommand(
            'deltabox.toolchain.generateConfig',
            async (node?: Project) => {
                await generateCommands.generateProjectConfig(node?.dir, node?.label);
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
        vscode.commands.registerCommand('deltabox.toolchain.registry.refresh', () =>
            registries.refresh()
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.registry.open',
            (node?: RegistryItemNode) => openRegistryItem(node)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.registry.new', () => newRegistry()),
        vscode.commands.registerCommand('deltabox.toolchain.registry.remove', () =>
            removeRegistry()
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.registry.removeOne',
            (node?: RegistryItemNode) => removeRegistryEntry(node)
        ),
        vscode.commands.registerCommand(
            'deltabox.toolchain.registry.addItem',
            (node?: RegistryItemNode) => addRegistryEntry(node)
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
            void rebuildWatchers();
            setStatus('idle');
            home.refresh();
            output.appendLine(`dbx: auto-sync ${enabled ? 'enabled' : 'disabled'}.`);
        }),
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('deltabox.registrySearchPaths')) {
                void syncGlobalTemplatePaths().then(() => templates.refresh());
            }
            if (e.affectsConfiguration('deltabox.providerRegistrySearchPaths')) {
                void syncGlobalProviderPaths().then(() => {
                    void providers.refresh();
                    void registries.refresh();
                });
            }
            if (!e.affectsConfiguration(SECTION)) return;
            enabled = getEnabled();
            void rebuildWatchers();
            setStatus('idle');
            home.refresh();
        }),
        new vscode.Disposable(() => {
            child?.kill();
            watcherManager?.dispose();
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

    void rebuildWatchers();
    setStatus('idle');
    updateContextKeys();
    void providers.refresh();
    void syncGlobalTemplatePaths(true).then(() => templates.refresh());
    void syncGlobalProviderPaths(true).then(() => providers.refresh());
    output.appendLine('dbx: extension activated.');
}

export function deactivate(): void {
    // Cleanup is handled through `context.subscriptions`.
}
