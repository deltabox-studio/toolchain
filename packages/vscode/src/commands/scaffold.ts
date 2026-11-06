import path from 'node:path';

import * as vscode from 'vscode';

import { loadTemplates, type Template } from '../templates.js';
import type { CommandDeps } from './deps.js';

export interface ScaffoldCommands {
    createViteProject: (cwd?: string) => Promise<void>;
    createFromTemplate: (preselected?: Template, root?: string) => Promise<void>;
    scaffold: () => Promise<void>;
    addTemplate: () => Promise<void>;
    removeTemplate: () => Promise<void>;
}

/** Template scaffolding and registry commands. */
export function createScaffoldCommands(deps: CommandDeps): ScaffoldCommands {
    /** Turn a folder into a local template and register it (via the CLI). */
    const addTemplate = async (): Promise<void> => {
        const base = deps.workspaceRoots()[0];
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
        if (!picked?.[0]) return;
        const dir = picked[0].fsPath;
        const name = await vscode.window.showInputBox({
            prompt: 'Template name',
            value: path.basename(dir),
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;
        const scope = await vscode.window.showQuickPick(
            [
                { label: 'Yes', detail: 'Available in every project' },
                { label: 'No', detail: 'Only in this project' },
            ],
            { placeHolder: 'Add this template to the global registry?' }
        );
        if (!scope) return;
        const args = [
            'template:init',
            dir,
            '--kind',
            kind.value,
            '--name',
            name,
            '--add',
            '--cwd',
            base,
        ];
        if (scope.label === 'No') args.push('--no-global');
        const code = await deps.runCli(base, args);
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: added template "${name}".`);
        } else {
            deps.output.show();
        }
    };

    /** Remove a source from the template registry (via the CLI). */
    const removeTemplate = async (): Promise<void> => {
        const base = deps.workspaceRoots()[0];
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
        const [listed, globals] = await Promise.all([
            deps.captureCli(base, ['template:list', '--registry', '--json', '--cwd', base]),
            deps.captureCli(base, ['template:list', '--global', '--json', '--cwd', base]),
        ]);
        let sources: RegistryEntry[] = [];
        if (listed.code === 0) {
            try {
                sources = JSON.parse(listed.stdout) as RegistryEntry[];
            } catch {
                sources = [];
            }
        }
        let globalTemplates: { id: string; name?: string }[] = [];
        if (globals.code === 0) {
            try {
                globalTemplates = JSON.parse(globals.stdout) as { id: string; name?: string }[];
            } catch {
                globalTemplates = [];
            }
        }
        const items = [
            ...sources.map(source => ({
                label: source.name ?? source.id ?? source.key,
                description: source.key,
                detail: [source.kind, source.type].filter(Boolean).join(' \u00b7 '),
                source,
                global: false,
            })),
            ...globalTemplates.map(template => ({
                label: template.name ?? template.id,
                description: template.id,
                detail: 'global',
                source: { key: template.id },
                global: true,
            })),
        ];
        if (items.length === 0) {
            vscode.window.showInformationMessage('deltabox: the template registry is empty.');
            return;
        }
        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Which template should be removed?',
            matchOnDetail: true,
        });
        if (!picked) return;
        const code = await deps.runCli(
            base,
            picked.global
                ? ['template:remove', picked.source.key, '--global', '--cwd', base]
                : ['template:remove', picked.source.key, '--cwd', base]
        );
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: removed ${picked.label}.`);
        } else {
            deps.output.show();
        }
    };

    /**
     * Scaffold a Vite+ project through the extension UI: pick a concrete Vite+
     * template and run it via the same create pipeline as every other template,
     * instead of dropping the user into the interactive `vp create` menu.
     */
    const createViteProject = async (cwd?: string): Promise<void> => {
        let root = cwd ?? deps.workspaceRoots()[0];
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

    /** Scaffold from a template (optionally preselected from the Templates view). */
    const createFromTemplate = async (preselected?: Template, root?: string): Promise<void> => {
        const base = root ?? deps.workspaceRoots()[0];
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
        // Cancelling any prompt aborts the whole scaffold (no files are written).
        if (scope === undefined) return;

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
        if (template.online) baseArgs.push('--online');
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
        if (!dir?.[0]) return;
        const out = dir[0].fsPath;
        const code = await deps.runCli(base, [...baseArgs, '--out', out]);
        // Sync the new project so its managed files (and manifest) exist and the
        // Managed Files / Home views populate immediately. (Vite+ projects are not
        // dbx-managed out of the box, so there is nothing to sync.)
        if (code === 0 && !template.online) await deps.runCli(out, ['sync']);
        await deps.refreshGraph();
        if (code === 0) {
            vscode.window.showInformationMessage(
                `deltabox: created from template "${template.name}".`
            );
        } else {
            deps.output.show();
        }
    };

    const scaffold = async (): Promise<void> => {
        const workspace = deps.workspaceRoots()[0];
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

        // Every prompt must be answered before anything is written: cancelling
        // any one of them aborts the scaffold so it can't leave orphan files.
        const scope = await vscode.window.showInputBox({
            prompt: 'npm scope (optional)',
            placeHolder: '@acme',
        });
        if (scope === undefined) return;
        const packageManager = await vscode.window.showQuickPick(['yarn', 'pnpm', 'npm', 'bun'], {
            placeHolder: 'Package manager',
        });
        if (!packageManager) return;
        const includeConfig = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
            ],
            { placeHolder: 'Include a dbx.config.ts? (recommended)' }
        );
        if (!includeConfig) return;
        const base = deps.workspaceRoots()[0];

        // A workspace is scaffolded *into* an existing monorepo root at a
        // relative directory; a project/root is scaffolded into a chosen dir.
        if (kind.flow === 'workspace') {
            const pickedRoot = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'Select monorepo root',
                defaultUri: base ? vscode.Uri.file(base) : undefined,
            });
            if (!pickedRoot?.[0]) return;
            const root = pickedRoot[0].fsPath;
            // `.` means "use the root directory's name".
            const wsName = name === '.' ? path.basename(root) : name;
            const dir = await vscode.window.showInputBox({
                prompt: 'Workspace directory (relative to the root)',
                value: `packages/${wsName}`,
                validateInput: value => (value.trim() ? undefined : 'Required'),
            });
            if (!dir) return;

            const args = [kind.command, '--name', wsName, '--root', root, '--dir', dir];
            if (scope) args.push('--scope', scope);
            if (includeConfig.value === 'no') args.push('--no-config');
            args.push('--package-manager', packageManager);

            const code = await deps.runCli(root, args);
            if (code === 0) await deps.runCli(path.join(root, dir.replace(/\\/g, '/')), ['sync']);
            await deps.refreshGraph();
            if (code === 0) {
                vscode.window.showInformationMessage(`deltabox: scaffolded workspace "${wsName}".`);
            }
            return;
        }

        const picked = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Scaffold here',
            defaultUri: base ? vscode.Uri.file(base) : undefined,
        });
        if (!picked?.[0]) return;
        const target = picked[0].fsPath;
        // `.` means "use the target directory's name".
        const finalName = name === '.' ? path.basename(target) : name;

        const args = [kind.command, '--name', finalName];
        if (scope) args.push('--scope', scope);
        if (includeConfig.value === 'no') args.push('--no-config');
        if ((kind as { example?: boolean }).example) args.push('--example');
        args.push('--package-manager', packageManager);
        args.push('--out', target);

        const code = await deps.runCli(target, args);
        if (code === 0) await deps.runCli(target, ['sync']);
        await deps.refreshGraph();
        if (code === 0)
            vscode.window.showInformationMessage(`deltabox: scaffolded "${finalName}".`);
    };

    return { createViteProject, createFromTemplate, scaffold, addTemplate, removeTemplate };
}
