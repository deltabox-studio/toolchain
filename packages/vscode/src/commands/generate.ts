import * as vscode from 'vscode';

import { discoverProjects, type Project } from '../projects.js';
import type { CommandDeps } from './deps.js';
import { pickProjects } from './helpers.js';

export interface GenerateCommands {
    generateConfigs: () => Promise<void>;
    generateProjectConfig: (dir?: string, label?: string) => Promise<void>;
}

interface ConfigGenerationOptions {
    skipConfig: boolean;
    language?: 'ts' | 'js';
}

/** Ask whether to create configs or only refresh the project graph, and the language. */
async function pickConfigGeneration(): Promise<ConfigGenerationOptions | undefined> {
    const mode = await vscode.window.showQuickPick(
        [
            {
                label: 'Create dbx.config.*',
                description: 'Write a config for each selected project',
                value: 'config' as const,
            },
            {
                label: 'Only write the project graph',
                description: 'Refresh .dbx/toolchain/projects.json without creating configs',
                value: 'graph' as const,
            },
        ],
        { placeHolder: 'What should be generated?' }
    );
    if (!mode) return undefined;
    if (mode.value === 'graph') return { skipConfig: true };
    const language = await vscode.window.showQuickPick(
        [
            { label: 'TypeScript', description: 'dbx.config.ts', value: 'ts' as const },
            {
                label: 'JavaScript',
                description: 'dbx.config.js / .mjs / .cjs (follows the package type)',
                value: 'js' as const,
            },
        ],
        { placeHolder: 'Config language?' }
    );
    if (!language) return undefined;
    return { skipConfig: false, language: language.value };
}

/** The `project:config` flags for a generation choice. */
function configArgs(options: ConfigGenerationOptions, force = false): string[] {
    const args = ['project:config'];
    if (options.skipConfig) args.push('--skip-config');
    else if (options.language) args.push('--language', options.language);
    if (force) args.push('--force');
    return args;
}

/** The generate-config command handlers. */
export function createGenerateCommands(deps: CommandDeps): GenerateCommands {
    const generateConfigs = async (): Promise<void> => {
        const options = await pickConfigGeneration();
        if (!options) return;
        const all = discoverProjects();
        const candidates = options.skipConfig ? all : all.filter(project => !project.hasConfig);
        if (candidates.length === 0) {
            vscode.window.showInformationMessage(
                options.skipConfig
                    ? 'deltabox: no projects found to graph.'
                    : 'deltabox: every project already has a config.'
            );
            return;
        }
        const selected = await pickProjects(
            candidates,
            options.skipConfig
                ? 'Refresh the project graph for which projects?'
                : 'Generate a dbx config for which projects?'
        );
        if (!selected || selected.length === 0) return;
        let failed = 0;
        for (const project of selected) {
            if ((await deps.runCli(project.dir, configArgs(options))) !== 0) failed += 1;
            else if (!options.skipConfig) await deps.runCli(project.dir, ['sync']);
        }
        await deps.refreshGraph();
        if (failed === 0) {
            vscode.window.showInformationMessage(
                options.skipConfig
                    ? `deltabox: refreshed the project graph for ${selected.length} project(s).`
                    : `deltabox: generated ${selected.length} config(s).`
            );
        } else {
            vscode.window.showWarningMessage(
                `deltabox: ${failed} config(s) failed. See the output channel.`
            );
            deps.output.show();
        }
    };

    const generateProjectConfig = async (dir?: string, label?: string): Promise<void> => {
        const projects = discoverProjects();
        let project: Project | undefined = dir
            ? projects.find(candidate => candidate.dir === dir)
            : undefined;
        if (!project) {
            if (projects.length === 0) {
                vscode.window.showInformationMessage('deltabox: no projects found.');
                return;
            }
            const picked = await vscode.window.showQuickPick(
                projects.map(candidate => ({
                    label: candidate.label,
                    description: candidate.relativePath,
                    detail: candidate.dir,
                    project: candidate,
                })),
                { placeHolder: 'Generate a dbx config for which project?' }
            );
            if (!picked) return;
            project = picked.project;
        }
        const options = await pickConfigGeneration();
        if (!options) return;
        let force = false;
        if (!options.skipConfig && project.hasConfig) {
            const overwrite = await vscode.window.showWarningMessage(
                `deltabox: ${project.label} already has a dbx config. Overwrite it?`,
                { modal: true },
                'Overwrite'
            );
            if (overwrite !== 'Overwrite') return;
            force = true;
        }
        const code = await deps.runCli(project.dir, configArgs(options, force));
        if (code === 0 && !options.skipConfig) await deps.runCli(project.dir, ['sync']);
        await deps.refreshGraph();
        if (code === 0) {
            vscode.window.showInformationMessage(
                options.skipConfig
                    ? `deltabox: project graph refreshed for ${label ?? project.label}.`
                    : `deltabox: config written for ${label ?? project.label}.`
            );
        } else {
            deps.output.show();
        }
    };

    return { generateConfigs, generateProjectConfig };
}
