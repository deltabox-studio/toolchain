import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';

import * as vscode from 'vscode';

import { captureCli, cliInvocation, resolveCliCommand, workspaceRoots } from './cli.js';
import { type HomeAction, HomeViewProvider } from './home-view.js';
import {
    discoverProjectGroups,
    discoverProjects,
    type Project,
    ProjectTreeProvider,
    readProjectGraph,
    TrackedFilesTreeProvider,
} from './projects.js';
import { loadProviders } from './providers.js';
import { type SchedulerState, SyncScheduler } from './sync-scheduler.js';

const SECTION = 'deltabox.toolchain';
const OUTPUT_NAME = 'deltabox toolchain';
const PROJECTS_VIEW_ID = 'deltabox.projects';
const FILES_VIEW_ID = 'deltabox.files';

/** The workflow ids the CLI understands. */
const WORKFLOW_IDS = ['ci', 'changelog', 'release', 'sync', 'issues'];

/** Input globs watched by default (never generated outputs). */
const DEFAULT_WATCH = ['**/dbx.config.*', '**/tsconfig.default.json', '**/tsconfig.monorepo.json'];

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

    let enabled = getEnabled();
    let child: ChildProcess | undefined;
    let watchers: vscode.FileSystemWatcher[] = [];

    /** Run `dbx <args>` in `cwd`, streaming output to the channel. */
    const runCli = (cwd: string, args: string[]): Promise<number> => {
        const resolved = resolveCliCommand(cwd);
        const fullArgs = [...resolved.args, ...args];
        output.appendLine(`\n> ${resolved.exe} ${fullArgs.join(' ')}  (${cwd})`);
        return new Promise<number>(resolve => {
            child = spawn(resolved.exe, fullArgs, { cwd });
            child.stdout?.on('data', d => output.append(d.toString()));
            child.stderr?.on('data', d => output.append(d.toString()));
            child.on('error', error => {
                output.appendLine(`dbx: ${String(error)}`);
                child = undefined;
                resolve(1);
            });
            child.on('exit', code => {
                child = undefined;
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

    const resetTooling = async (targets?: Project[]): Promise<void> => {
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
            vscode.window.showWarningMessage(
                'deltabox: the Vite+ provider is unavailable — install @deltabox/toolchain in this project.'
            );
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
                { label: 'Tooling', value: 'tooling', detail: 'A tooling config/pipeline' },
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

    /** Scaffold a new Vite+ project (runs interactive `vp create` in a terminal). */
    const createViteProject = async (): Promise<void> => {
        const roots = workspaceRoots();
        let root = roots[0];
        if (!root) {
            const picked = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'Create the project here',
            });
            root = picked?.[0]?.fsPath;
        }
        if (!root) return;
        openTerminalCommand(root, 'vite:create', 'vp create');
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
            return {
                enabled,
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
                case 'resetTooling':
                    await resetTooling();
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
                    await resetTooling(
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

    interface TemplateChoice {
        id: string;
        name: string;
        description?: string;
        kind?: string;
        online?: boolean;
        type?: string;
    }

    /** Scaffold from a template listed by `dbx template:list --json`. */
    const createFromTemplate = async (): Promise<void> => {
        const base = workspaceRoots()[0];
        if (!base) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const listed = await captureCli(base, ['template:list', '--json', '--cwd', base]);
        let templates: TemplateChoice[] = [];
        if (listed.code === 0) {
            try {
                templates = JSON.parse(listed.stdout) as TemplateChoice[];
            } catch {
                templates = [];
            }
        }
        if (templates.length === 0) {
            vscode.window.showWarningMessage(
                'deltabox: no templates found — install @deltabox/toolchain in this project.'
            );
            return;
        }
        const picked = await vscode.window.showQuickPick(
            templates.map(template => ({
                label: template.name || template.id,
                description: template.id,
                detail: [template.kind, template.online ? 'online' : 'offline', template.type]
                    .filter(Boolean)
                    .join(' · '),
                template,
            })),
            { placeHolder: 'Which template should be used?', matchOnDetail: true }
        );
        if (!picked) return;

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

        const baseArgs = [
            'create',
            '--template',
            picked.template.id,
            '--name',
            name,
            '--cwd',
            base,
        ];
        if (scope) baseArgs.push('--scope', scope);

        // Online/Vite+ templates run `vp create`, which is interactive: use a
        // terminal. Builtin/local templates are non-interactive: run in the
        // output channel.
        if (picked.template.online) {
            openTerminalCommand(base, baseArgs.join(' '), `create ${picked.template.id}`);
            return;
        }
        const dir = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Create here',
            defaultUri: vscode.Uri.file(base),
        });
        const out = dir?.[0]?.fsPath ?? base;
        const code = await runCli(base, [...baseArgs, '--out', out]);
        await refreshGraph();
        if (code === 0) {
            vscode.window.showInformationMessage(
                `deltabox: created from template "${picked.template.name}".`
            );
        } else {
            output.show();
        }
    };

    const scaffold = async (): Promise<void> => {
        const kind = await vscode.window.showQuickPick(
            [
                {
                    label: 'Single project',
                    command: 'project:init',
                    detail: 'One TypeScript package',
                    flow: 'project',
                },
                {
                    label: 'Monorepo root',
                    command: 'project:init:monorepo',
                    detail: 'Root + one example workspace',
                    flow: 'root',
                },
                {
                    label: 'Monorepo workspace',
                    command: 'project:init:workspace',
                    detail: 'A workspace package inside an existing monorepo',
                    flow: 'workspace',
                },
                {
                    label: 'From template\u2026',
                    command: '',
                    detail: 'Builtin, local or online project/tooling template',
                    flow: 'template',
                },
            ],
            { placeHolder: 'What kind of project should be scaffolded?' }
        );
        if (!kind) return;

        if (kind.flow === 'template') {
            await createFromTemplate();
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

            const code = await runCli(root, args);
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
        args.push('--out', target);

        const code = await runCli(target, args);
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
        vscode.commands.registerCommand(
            'deltabox.toolchain.resetTooling',
            async (node?: Project) => {
                await resetTooling(node ? [node] : undefined);
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

    rebuildWatchers();
    setStatus('idle');
    output.appendLine('dbx: extension activated.');
}

export function deactivate(): void {
    // Cleanup is handled through `context.subscriptions`.
}
