import { type ChildProcess } from 'node:child_process';
import path from 'node:path';

import * as vscode from 'vscode';

import { ActionsTreeProvider, runActionById, showActionPalette } from './actions-view.js';
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
import { ManagedFileDecorationProvider } from './decorations.js';
import { type EnabledConfigValue, type EnabledScope, resolveEnabledState } from './enabled.js';
import { type HomeAction, HomeViewProvider } from './home-view.js';
import { deepestProjectDir } from './managed-files.js';
import {
    discoverProjectGroups,
    discoverProjects,
    type Project,
    ProjectTreeProvider,
    readProjectGraph,
    setTsconfigFileNames,
    TrackedFilesTreeProvider,
} from './projects.js';
import { pickPaged, vscodePromptHost } from './prompt.js';
import {
    loadProviders,
    type ProviderCommandNode,
    type ProviderNode,
    ProviderTreeProvider,
} from './providers.js';
import { RegistryTreeProvider, type RegistryItemNode } from './registries.js';
import { type SchedulerState, SyncScheduler } from './sync-scheduler.js';
import { loadTemplates, type Template, TemplateTreeProvider } from './templates.js';
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
const DOCS_URL = 'https://toolchain.dbx.studio';

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

/** The project's resolved `toolchain.enabled` value (from the CLI), when known. */
let enabledConfig: EnabledConfigValue | undefined;

/** Resolve the effective auto-sync state (config wins over `.vscode/settings.json`). */
function currentEnabledState() {
    const inspected = config().inspect<boolean>('enabled');
    return resolveEnabledState(enabledConfig, {
        ...(inspected?.globalValue !== undefined ? { globalValue: inspected.globalValue } : {}),
        ...(inspected?.workspaceValue !== undefined
            ? { workspaceValue: inspected.workspaceValue }
            : {}),
        ...(inspected?.workspaceFolderValue !== undefined
            ? { workspaceFolderValue: inspected.workspaceFolderValue }
            : {}),
        ...(inspected?.defaultValue !== undefined ? { defaultValue: inspected.defaultValue } : {}),
    });
}

function getEnabled(): boolean {
    return currentEnabledState().enabled;
}

/**
 * Ask the project's `dbx` for the resolved `toolchain.enabled` value. The CLI
 * applies the project config plus the global CLI switch, so this is the
 * authoritative source; the VS Code setting is only the fallback.
 */
async function refreshEnabledConfig(): Promise<void> {
    const root = workspaceRoots()[0];
    if (!root) {
        enabledConfig = undefined;
        return;
    }
    try {
        const result = await captureCli(root, ['enabled', '--json']);
        if (result.code !== 0) return;
        const parsed = JSON.parse(result.stdout) as {
            enabled?: unknown;
            scope?: unknown;
        };
        if (typeof parsed.enabled !== 'boolean') return;
        const scope = parsed.scope === 'global' ? 'global' : 'workspace';
        enabledConfig = { enabled: { scope, disabled: !parsed.enabled } };
    } catch {
        // No config / CLI failure: fall back to the VS Code setting.
    }
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
    // Resolve `toolchain.enabled` from the project config (it wins over settings).
    void refreshEnabledConfig().then(() => {
        enabled = getEnabled();
        void rebuildWatchers();
        setStatus('idle');
    });

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

    const decorations = new ManagedFileDecorationProvider({
        enabled: () => config().get<boolean>('decorateManagedFiles', true),
    });

    const providers = new ProviderTreeProvider(() => workspaceRoots()[0]);
    const providersView = vscode.window.createTreeView(PROVIDERS_VIEW_ID, {
        treeDataProvider: providers,
        showCollapseAll: true,
    });

    const actions = new ActionsTreeProvider();
    const actionsView = vscode.window.createTreeView('deltabox.actions', {
        treeDataProvider: actions,
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
            projects.some(project => project.hasConfig || project.plugin)
        );
        setContext('deltabox.hasProviders', listed.length > 0);
        setContext(
            'deltabox.hasVite',
            listed.some(
                provider =>
                    provider.id === 'vite-plus' &&
                    provider.commands.length > 0 &&
                    provider.available !== false
            )
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

    // Commands whose failure is expected to be silent (metadata refreshes) or is
    // already reported by the caller (`--check`, or the command handler itself).
    const SILENT_FAILURE_COMMANDS = new Set(['projects', 'watch', 'registry']);
    const HANDLED_FAILURE_COMMANDS = new Set(['project:config', 'migrate', 'workflow']);
    const notifiedFailures = new Set<string>();

    /** The stable key for a command (eg. `sync`, `project:config`). */
    const commandKey = (args: string[]): string => args[0] ?? 'dbx';

    /** Forget a command's previous failure once it succeeds. */
    const clearFailure = (cwd: string, args: string[]): void => {
        const prefix = `${cwd}:${commandKey(args)}:`;
        for (const key of notifiedFailures) {
            if (key.startsWith(prefix)) notifiedFailures.delete(key);
        }
    };

    /**
     * Show an important CLI failure as a VS Code notification. Failures are
     * deduplicated per project/command/error so an auto-sync loop does not spam
     * the user; the output channel still has every run.
     */
    const notifyFailure = (cwd: string, args: string[], detail: string): void => {
        if (
            args.includes('--check') ||
            SILENT_FAILURE_COMMANDS.has(commandKey(args)) ||
            HANDLED_FAILURE_COMMANDS.has(commandKey(args))
        )
            return;
        const firstLine =
            detail
                .split(/\r?\n/)
                .map(line => line.trim())
                .find(line => line.length > 0) ?? 'command failed';
        const key = `${cwd}:${commandKey(args)}:${firstLine}`;
        if (notifiedFailures.has(key)) return;
        notifiedFailures.add(key);
        const label = path.basename(cwd) || cwd;
        void vscode.window
            .showErrorMessage(`deltabox: ${commandKey(args)} failed in ${label}.`, 'Show output')
            .then(choice => {
                if (choice === 'Show output') output.show();
            });
    };

    /** Sync through the CLI's JSON output so removed files can be restored. */
    const runSyncCli = async (cwd: string, args: string[]): Promise<number> => {
        output.appendLine(`\n> ${cliInvocation(cwd)} ${args.join(' ')} --json  (${cwd})`);
        const result = await captureCli(cwd, [...args, '--json']);
        output.append(result.stdout || result.stderr);
        let removed: RemovedFile[] = [];
        if (result.code === 0) {
            clearFailure(cwd, args);
            // The manifests changed: redraw the managed-file decorations.
            decorations.refresh();
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
        } else {
            notifyFailure(cwd, args, result.stderr || result.stdout);
        }
        await notifyRemovedFiles(cwd, removed);
        return result.code;
    };

    /** Add `--configless` to sync/watch when the workspace opted in. */
    const withConfigless = (args: string[]): string[] => {
        if (args[0] !== 'sync' && args[0] !== 'watch') return args;
        if (!config().get<boolean>('manageConfigless', false)) return args;
        if (args.includes('--configless')) return args;
        return [...args, '--configless'];
    };

    /** Add the managed-file formatting settings to a `sync` invocation. */
    const withFormatting = (args: string[]): string[] => {
        if (args[0] !== 'sync') return args;
        const cfg = config();
        const out = [...args];
        if (
            cfg.get<boolean>('formatManagedFiles', true) === false &&
            !out.includes('--no-format')
        ) {
            out.push('--no-format');
        }
        if (
            cfg.get<boolean>('formatManagedFilesFix', true) === false &&
            !out.includes('--no-format-fix')
        ) {
            out.push('--no-format-fix');
        }
        const command = cfg.get<string>('formatManagedFilesCommand', '').trim();
        if (command && !out.includes('--format-command')) out.push('--format-command', command);
        const exclude = cfg.get<string[]>('formatManagedFilesExclude', []);
        if (exclude.length > 0 && !out.includes('--format-exclude')) {
            out.push('--format-exclude', ...exclude);
        }
        return out;
    };

    /** Run `dbx <args>` in `cwd`, streaming output to the channel. */
    const runCli = (cwd: string, args: string[]): Promise<number> => {
        const cliArgs = withFormatting(withConfigless(args));
        if (cliArgs[0] === 'sync' && !cliArgs.includes('--check') && !cliArgs.includes('--json')) {
            return runSyncCli(cwd, cliArgs);
        }
        output.appendLine(`\n> ${cliInvocation(cwd)} ${cliArgs.join(' ')}  (${cwd})`);
        return new Promise<number>(resolve => {
            let proc: ChildProcess;
            try {
                proc = spawnCli(cwd, cliArgs);
            } catch (error) {
                output.appendLine(`dbx: ${String(error)}`);
                notifyFailure(cwd, cliArgs, String(error));
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
                notifyFailure(cwd, cliArgs, `${captured}\n${String(error)}`);
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
                const exitCode = exitCodeOf(code, signal);
                if (exitCode === 0) clearFailure(cwd, cliArgs);
                else notifyFailure(cwd, cliArgs, captured);
                resolve(exitCode);
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

    /** Run a CLI command in the first workspace root and report failures. */
    const runRootCli = async (args: string[]): Promise<number> => {
        const root = workspaceRoots()[0] ?? process.cwd();
        const code = await runCli(root, args);
        if (code !== 0) {
            vscode.window.showWarningMessage(
                `deltabox: \`dbx ${args.join(' ')}\` failed. See the output channel.`
            );
            output.show();
        }
        return code;
    };

    /** Prompt for a project name/output directory and run a `project:init*` command. */
    const initProject = async (command: string): Promise<void> => {
        const name = await vscode.window.showInputBox({
            prompt: `Name for the new ${command === 'project:init:monorepo' ? 'monorepo' : 'project'}`,
            placeHolder: 'my-app',
        });
        if (!name) return;
        const base = workspaceRoots()[0] ?? process.cwd();
        const out = await vscode.window.showInputBox({
            prompt: 'Output directory',
            value: path.join(base, name),
        });
        if (!out) return;
        await runRootCli([command, '--name', name, '--out', out]);
        void actions.refresh();
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

    /**
     * Toggle auto-sync for one scope. Global updates the VS Code global setting
     * and the CLI global store; workspace updates `.vscode/settings.json`.
     */
    async function setEnabledForScope(scope: EnabledScope, value: boolean): Promise<void> {
        const target =
            scope === 'global'
                ? vscode.ConfigurationTarget.Global
                : vscode.ConfigurationTarget.Workspace;
        await config().update('enabled', value, target);
        const root = workspaceRoots()[0];
        if (root) {
            await runCli(root, [value ? 'enable' : 'disable', `--${scope}`]);
        }
        // Re-resolve from the CLI/config so the project config keeps precedence.
        await refreshEnabledConfig();
        enabled = getEnabled();
        void rebuildWatchers();
        setStatus('idle');
        home.refresh();
        output.appendLine(`dbx: auto-sync ${value ? 'enabled' : 'disabled'} (${scope} scope).`);
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
            await afterSync();
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

    /** Repaint the views whose data a sync can change (files, projects, home). */
    const refreshSyncViews = (): void => {
        tree.refresh();
        files.refresh();
        decorations.refresh();
        home.refresh();
        updateContextKeys();
    };

    const refreshViews = (): void => {
        refreshSyncViews();
        void providers.refresh();
        void templates.refresh();
        void registries.refresh();
    };

    /**
     * Shared post-sync hook: a sync may have created/renamed generated tsconfig
     * files (and rewritten manifests), so rebuild the concrete watcher set and
     * repaint the affected views. Both auto-sync and the manual sync commands go
     * through this, so neither can drift from the other. Providers, templates and
     * registries are intentionally not reloaded here: they do not change on a
     * sync, and reloading templates would hit the network on every auto-sync.
     */
    async function afterSync(): Promise<void> {
        refreshSyncViews();
        try {
            await rebuildWatchers();
        } catch (error) {
            // A bad watch glob must not turn a completed sync into an error.
            output.appendLine(`dbx: failed to rebuild watchers: ${String(error)}`);
        }
    }

    // The last project revealed from the active editor. Resetting it on a tree
    // refresh makes the next editor switch reveal the (rebuilt) project node
    // without re-revealing the same node on every keystroke/focus change.
    let revealedProject: string | undefined;

    /** Reveal the deepest project that owns the active editor's file. */
    const revealActiveProject = async (editor?: vscode.TextEditor): Promise<void> => {
        if (!editor || editor.document.uri.scheme !== 'file') return;
        const dir = deepestProjectDir(editor.document.uri.fsPath, tree.projects());
        if (!dir || dir === revealedProject) return;
        const node = tree.findProject(dir);
        if (!node) return;
        revealedProject = dir;
        try {
            await treeView.reveal(node, { select: true, focus: false, expand: true });
        } catch {
            // The view can be disposed or the tree refreshed mid-reveal.
        }
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
        afterSync,
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

    /** The installable MCP/skill agents from `dbx mcp:list --json`. */
    const loadMcpAgents = async (
        root: string
    ): Promise<{ id: string; name: string; description: string }[]> => {
        const listed = await captureCli(root, ['mcp:list', '--json']);
        try {
            const parsed = JSON.parse(listed.stdout) as unknown;
            return Array.isArray(parsed)
                ? (parsed as { id: string; name: string; description: string }[])
                : [];
        } catch {
            return [];
        }
    };

    /** Prompt for the install scope. */
    const pickScope = async (): Promise<'project' | 'global' | undefined> =>
        (
            await vscode.window.showQuickPick(
                [
                    {
                        label: 'Project',
                        description: 'Write the config into this workspace.',
                        value: 'project' as const,
                    },
                    {
                        label: 'Global',
                        description: 'Write the config into your user profile.',
                        value: 'global' as const,
                    },
                ],
                { placeHolder: 'Install scope?' }
            )
        )?.value;

    /** Install the dbx MCP server + skill into an AI harness/editor. */
    const installMcp = async (cwd?: string): Promise<void> => {
        const root = cwd ?? workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const providers = await loadMcpAgents(root);
        if (providers.length === 0) {
            vscode.window.showWarningMessage('deltabox: the MCP providers could not be loaded.');
            return;
        }
        const provider = await vscode.window.showQuickPick(
            providers.map(entry => ({
                label: entry.name,
                description: entry.id,
                detail: entry.description,
                id: entry.id,
            })),
            {
                placeHolder: 'Install the dbx MCP server for which client?',
                matchOnDescription: true,
            }
        );
        if (!provider) return;
        const scope = await pickScope();
        if (!scope) return;
        const args = ['mcp:install', '--provider', provider.id, '--scope', scope];
        if ((await runCli(root, args)) === 0) {
            vscode.window.showInformationMessage(
                `deltabox: MCP + skill installed for ${provider.label} (${scope}).`
            );
        }
    };

    /** Install the official dbx docs skill into an AI harness/editor. */
    const installSkills = async (cwd?: string): Promise<void> => {
        const root = cwd ?? workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const providers = await loadMcpAgents(root);
        if (providers.length === 0) {
            vscode.window.showWarningMessage('deltabox: the skill agents could not be loaded.');
            return;
        }
        const provider = await vscode.window.showQuickPick(
            providers.map(entry => ({
                label: entry.name,
                description: entry.id,
                detail: entry.description,
                id: entry.id,
            })),
            {
                placeHolder: 'Install the official dbx skill for which client?',
                matchOnDescription: true,
            }
        );
        if (!provider) return;
        const scope = await pickScope();
        if (!scope) return;
        const args = ['skills', '--official', '--provider', provider.id, '--scope', scope];
        if ((await runCli(root, args)) === 0) {
            vscode.window.showInformationMessage(
                `deltabox: official skill installed for ${provider.label} (${scope}).`
            );
        }
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
        if (!vite || vite.commands.length === 0 || vite.available === false) {
            vscode.window.showWarningMessage(
                'deltabox: the Vite+ provider is unavailable. Install `vite-plus` in this project to enable it.'
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
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        let template = node;
        if (!template) {
            const listed = await loadTemplates(root);
            if (listed.length === 0) {
                vscode.window.showWarningMessage('deltabox: no templates found.');
                return;
            }
            template = await pickPaged(
                vscodePromptHost(),
                'Which template should be inspected?',
                listed.map(candidate => ({
                    label: candidate.name || candidate.id,
                    description: candidate.id,
                    detail: [
                        candidate.kind,
                        candidate.online ? 'online' : 'offline',
                        candidate.type,
                    ]
                        .filter(Boolean)
                        .join(' \u00b7 '),
                    value: candidate,
                }))
            );
            if (!template) return;
        }
        const args = ['template:info', template.id, '--json', '--cwd', root];
        // Online-only templates are not part of the offline registry, so the
        // lookup must opt in to remote sources or it reports them as unknown.
        if (template.online) args.push('--online');
        const result = await captureCli(root, args);
        output.appendLine(`\n> dbx template:info ${template.id}`);
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
            const enabledState = currentEnabledState();
            return {
                enabled: enabledState.enabled,
                globalEnabled: enabledState.globalEnabled,
                workspaceEnabled: enabledState.workspaceEnabled,
                canSync: projects.some(project => project.hasConfig || project.plugin),
                hasProviders: listed.length > 0,
                hasVite: listed.some(
                    provider =>
                        provider.id === 'vite-plus' &&
                        provider.commands.length > 0 &&
                        provider.available !== false
                ),
                projects: projects.map(project => ({
                    label: project.label,
                    dir: project.dir,
                    relativePath: project.relativePath,
                    type: project.type,
                    hasConfig: project.hasConfig,
                    plugin: project.plugin,
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
                case 'fmt':
                    await vscode.commands.executeCommand(`${SECTION}.fmt`);
                    break;
                case 'lint':
                    await vscode.commands.executeCommand(`${SECTION}.lint`);
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
                case 'installMcp':
                    await installMcp();
                    break;
                case 'installSkills':
                    await installSkills();
                    break;
                case 'resetToolchain':
                    await resetToolchain();
                    break;
                case 'toggle':
                    await vscode.commands.executeCommand(`${SECTION}.toggle`);
                    break;
                case 'actions':
                    await showActionPalette();
                    break;
                case 'toggleGlobal':
                    await setEnabledForScope('global', !currentEnabledState().globalEnabled);
                    break;
                case 'toggleWorkspace':
                    await setEnabledForScope('workspace', !currentEnabledState().workspaceEnabled);
                    break;
                case 'syncProject': {
                    const project = discoverProjects().find(
                        candidate => candidate.dir === action.dir
                    );
                    if (project) {
                        await runProjects([project], ['sync']);
                        await afterSync();
                    }
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
                    decorations.refresh();
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
        actionsView,
        templatesView,
        registriesView,
        decorations,
        vscode.window.registerFileDecorationProvider(decorations),
        tree.onDidChangeTreeData(() => {
            revealedProject = undefined;
        }),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            void revealActiveProject(editor);
        }),
        vscode.commands.registerCommand('deltabox.toolchain.sync', syncCommands.syncActive),
        vscode.commands.registerCommand('deltabox.toolchain.syncAll', syncCommands.syncAll),
        vscode.commands.registerCommand(
            'deltabox.toolchain.syncTsconfig',
            syncCommands.syncTsconfig
        ),
        vscode.commands.registerCommand('deltabox.toolchain.fmt', () => runRoots(['fmt'])),
        vscode.commands.registerCommand('deltabox.toolchain.lint', () => runRoots(['lint'])),
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
        vscode.commands.registerCommand('deltabox.toolchain.refreshFiles', () => {
            files.refresh();
            decorations.refresh();
        }),
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
        vscode.commands.registerCommand('deltabox.toolchain.installMcp', (cwd?: string) =>
            installMcp(cwd)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.installSkills', (cwd?: string) =>
            installSkills(cwd)
        ),
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
        vscode.commands.registerCommand('deltabox.toolchain.actions', () => showActionPalette()),
        vscode.commands.registerCommand('deltabox.toolchain.actions.run', (id: string) =>
            runActionById(id)
        ),
        vscode.commands.registerCommand('deltabox.toolchain.cleanup', () =>
            runRootCli(['cleanup'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.cleanupTurbo', () =>
            runRootCli(['cleanup:turbo'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.changelog', () =>
            runRootCli(['changelog'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.changelogDryRun', () =>
            runRootCli(['changelog', '--dry-run'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.changelogFormat', () =>
            runRootCli(['changelog', '--format-only'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.changelogReleaseNotes', async () => {
            const version = await vscode.window.showInputBox({
                prompt: 'Released version (for example 1.2.3)',
                placeHolder: '1.2.3',
            });
            if (!version) return;
            const code = await runRootCli(['changelog', '--release-body', version]);
            if (code === 0) output.show();
        }),
        vscode.commands.registerCommand('deltabox.toolchain.mcpList', () =>
            runRootCli(['mcp:list'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.mcpServe', () =>
            runRootCli(['mcp:serve'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.migrateList', () =>
            runRootCli(['migrate:list'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.projectConfig', () =>
            runRootCli(['project:config'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.projects', () =>
            runRootCli(['projects'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.providersList', () =>
            runRootCli(['providers'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.watch', () => runRootCli(['watch'])),
        vscode.commands.registerCommand('deltabox.toolchain.enable', () => runRootCli(['enable'])),
        vscode.commands.registerCommand('deltabox.toolchain.disable', () =>
            runRootCli(['disable'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.state', () =>
            runRootCli(['enabled', '--json'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.list', () =>
            runRootCli(['template:list'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.registry', () =>
            runRootCli(['template:registry'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.templates.source', () =>
            runRootCli(['source'])
        ),
        vscode.commands.registerCommand('deltabox.toolchain.projectInit', () =>
            initProject('project:init')
        ),
        vscode.commands.registerCommand('deltabox.toolchain.projectInitWorkspace', () =>
            initProject('project:init:workspace')
        ),
        vscode.commands.registerCommand('deltabox.toolchain.projectInitMonorepo', () =>
            initProject('project:init:monorepo')
        ),
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
            await setEnabledForScope('workspace', !currentEnabledState().workspaceEnabled);
        }),
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            // New roots need watchers (and removed roots must drop theirs), and
            // every view derives its contents from the discovered projects.
            refreshViews();
            void rebuildWatchers();
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
            decorations.refresh();
            void refreshEnabledConfig().then(() => {
                enabled = getEnabled();
                void rebuildWatchers();
                setStatus('idle');
                home.refresh();
            });
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
    void revealActiveProject(vscode.window.activeTextEditor);
    void providers.refresh();
    void syncGlobalTemplatePaths(true).then(() => templates.refresh());
    void syncGlobalProviderPaths(true).then(() => providers.refresh());
    output.appendLine('dbx: extension activated.');
}

export function deactivate(): void {
    // Cleanup is handled through `context.subscriptions`.
}
