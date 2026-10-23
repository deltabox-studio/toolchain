import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    writeGeneratedFiles,
} from '@deltabox/toolchain-project';
import {
    applyReplacements,
    type GeneratedFile,
    type Replacements,
    spawnCross,
} from '@deltabox/toolchain-shared';
import { runVp } from '@deltabox/toolchain-vite';

import { readTemplateManifest } from './local.js';
import type { Template, TemplateAction, TemplateActionContext } from './types.js';

/** Files/dirs never copied from a local template. */
const DEFAULT_IGNORE = new Set([
    'node_modules',
    '.git',
    'dist',
    '.turbo',
    '.dbx',
    '.DS_Store',
    'template.json',
]);

export interface ScaffoldOptions {
    /** Where the files are written. */
    cwd: string;
    /** Replacement tokens (eg. `{ name, scope, author }`). */
    tokens?: Replacements;
    /** Per-template variable values (merged over `tokens`). */
    variables?: Record<string, string>;
    /** Overwrite existing files (local templates; default true). */
    overwrite?: boolean;
    /** Action ids to run after writing the files (default: none). */
    actions?: string[];
}

export interface ScaffoldResult {
    /** Absolute paths written (empty when delegated to `vp`). */
    written: string[];
    /** The `vp` exit code when the template was created through Vite+. */
    code?: number;
    /** The action ids that were run after scaffolding. */
    ranActions?: string[];
}

/** The token replacement map for a scaffold run. */
function replacementMap(options: ScaffoldOptions): Replacements {
    return { ...options.tokens, ...options.variables };
}

/** Read a boolean-ish replacement (`'no'`/`'false'`/`false` -> `false`). */
function boolToken(value: unknown, fallback = true): boolean {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return !['no', 'false', '0', 'off'].includes(String(value).toLowerCase());
}

/** Scaffold from one of the local generators (builtin templates). */
function scaffoldBuiltin(template: Template, options: ScaffoldOptions): ScaffoldResult {
    const tokens = replacementMap(options);
    const name = String(tokens.name ?? 'app');
    const scope = tokens.scope ? String(tokens.scope) : undefined;
    const includeConfig = boolToken(tokens.includeConfig);
    const packageManager = tokens.packageManager ? String(tokens.packageManager) : undefined;
    const files: GeneratedFile[] = [];

    switch (template.builtin) {
        case 'monorepo-root': {
            const rootScope = scope ?? `@${name}`;
            files.push(
                ...createMonorepoRootFiles({
                    name,
                    scope: rootScope,
                    type: 'monorepo-root',
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                    workspaces: [],
                })
            );
            break;
        }
        case 'monorepo-example': {
            const rootScope = scope ?? `@${name}`;
            files.push(
                ...createMonorepoRootFiles({
                    name,
                    scope: rootScope,
                    type: 'monorepo-root',
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                    workspaces: [{ alias: 'core', dir: 'packages/core' }],
                })
            );
            files.push(
                ...createWorkspaceFiles({
                    name,
                    scope: rootScope,
                    wsName: 'core',
                    wsDir: 'packages/core',
                    type: 'monorepo-workspace',
                    includeConfig,
                    useCatalog: true,
                    ...(packageManager ? { packageManager } : {}),
                }).map(file => ({ ...file, path: `packages/core/${file.path}` }))
            );
            break;
        }
        case 'monorepo-workspace': {
            const dir = `packages/${name}`;
            files.push(
                ...createWorkspaceFiles({
                    name,
                    ...(scope ? { scope } : {}),
                    wsName: name,
                    wsDir: dir,
                    type: 'monorepo-workspace',
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                }).map(file => ({ ...file, path: `${dir}/${file.path}` }))
            );
            break;
        }
        case 'folder': {
            files.push({ path: 'README.md', content: `# ${name}\n` });
            break;
        }
        default: {
            // `single` + `application`: a root package project.
            files.push(
                ...createRootProjectFiles({
                    name,
                    ...(scope ? { scope } : {}),
                    type: 'project',
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                })
            );
        }
    }
    return { written: writeGeneratedFiles(files, options.cwd) };
}

/** Copy a local template directory, resolving tokens in paths + contents. */
function scaffoldLocal(template: Template, options: ScaffoldOptions): ScaffoldResult {
    const dir = template.dir;
    if (!dir) throw new Error(`Local template "${template.id}" has no directory.`);
    const manifest = readTemplateManifest(dir);
    const ignore = new Set([...DEFAULT_IGNORE, ...(manifest?.ignore ?? [])]);
    // The action modules are scaffolding logic, not template content.
    for (const action of template.actions ?? []) {
        if (action.module) ignore.add(action.module.replace(/\\/g, '/'));
    }
    const open = template.tokens?.open ?? '{{';
    const close = template.tokens?.close ?? '}}';
    const tokens = replacementMap(options);
    const overwrite = options.overwrite !== false;
    const written: string[] = [];

    const walk = (relative: string): void => {
        const abs = path.join(dir, relative);
        for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
            if (ignore.has(entry.name)) continue;
            const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(childRelative);
                continue;
            }
            const target = path.join(
                options.cwd,
                applyReplacements(childRelative, tokens, { open, close })
            );
            if (!overwrite && fs.existsSync(target)) continue;
            fs.mkdirSync(path.dirname(target), { recursive: true });
            const content = fs.readFileSync(path.join(dir, childRelative), 'utf-8');
            fs.writeFileSync(target, applyReplacements(content, tokens, { open, close }), 'utf-8');
            written.push(target);
        }
    };
    walk('');
    return { written };
}

/** Delegate an online/Vite+ template to `vp create`. */
async function scaffoldViaVp(
    template: Template,
    options: ScaffoldOptions
): Promise<ScaffoldResult> {
    const locate = template.source.subdir
        ? `${template.source.locate}/${template.source.subdir}`
        : template.source.locate;
    const args = ['create'];
    if (locate) args.push(locate);
    const name = options.tokens?.name;
    if (name) args.push(String(name));
    const result = await runVp(args, { cwd: options.cwd });
    return { written: [], code: result.code };
}

/** Run a command to completion (inherited stdio). Resolves with the exit code. */
function runCommand(cmd: string, args: string[], cwd: string): Promise<number> {
    return new Promise<number>(resolve => {
        let child: ReturnType<typeof spawnCross>;
        try {
            child = spawnCross(cmd, args, { cwd, stdio: 'inherit' });
        } catch {
            resolve(1);
            return;
        }
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/** Run a shell command in `cwd` (for a template's `command` action). */
function runShell(command: string, cwd: string): Promise<number> {
    return new Promise<number>(resolve => {
        const child = spawn(command, { cwd, stdio: 'inherit', shell: true });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/** The context handed to a template action. */
function actionContext(template: Template, options: ScaffoldOptions): TemplateActionContext {
    const tokens = replacementMap(options);
    const variables: Record<string, string> = {};
    for (const [key, value] of Object.entries(options.variables ?? {})) {
        variables[key] = value === undefined || value === null ? '' : String(value);
    }
    return {
        cwd: options.cwd,
        ...(template.dir ? { templateDir: template.dir } : {}),
        tokens,
        variables,
        packageManager: String(tokens.packageManager ?? 'yarn'),
        log: message => console.log(message),
    };
}

/** Execute one declared action. */
async function runAction(
    template: Template,
    action: TemplateAction,
    options: ScaffoldOptions,
    ctx: TemplateActionContext
): Promise<void> {
    if (action.builtin === 'install') {
        ctx.log(`Installing dependencies with ${ctx.packageManager}…`);
        const code = await runCommand(ctx.packageManager, ['install'], options.cwd);
        if (code !== 0) {
            throw new Error(`\`${ctx.packageManager} install\` failed with exit code ${code}.`);
        }
        return;
    }
    if (action.module) {
        const dir = template.dir ?? options.cwd;
        const file = path.resolve(dir, action.module);
        if (!fs.existsSync(file)) {
            throw new Error(`template action module not found: ${action.module}`);
        }
        const mod = (await import(pathToFileURL(file).href)) as {
            default?: unknown;
            run?: unknown;
        };
        const fn = mod.default ?? mod.run;
        if (typeof fn !== 'function') {
            throw new Error(
                `template action module "${action.module}" does not export a function.`
            );
        }
        await (fn as (context: TemplateActionContext) => unknown)(ctx);
        return;
    }
    if (action.command) {
        const code = await runShell(action.command, options.cwd);
        if (code !== 0) {
            throw new Error(`template command failed with exit code ${code}: ${action.command}`);
        }
        return;
    }
    throw new Error(`template action "${action.id}" declares no builtin, module or command.`);
}

/** Run every enabled action, in declaration order. */
async function runActions(template: Template, options: ScaffoldOptions): Promise<string[]> {
    const enabled = new Set(options.actions ?? []);
    const ran: string[] = [];
    for (const action of template.actions ?? []) {
        if (!enabled.has(action.id)) continue;
        await runAction(template, action, options, actionContext(template, options));
        ran.push(action.id);
    }
    return ran;
}

/** Scaffold a project (or tooling) from a template. */
export async function scaffoldTemplate(
    template: Template,
    options: ScaffoldOptions
): Promise<ScaffoldResult> {
    if (template.builtin) {
        const result = scaffoldBuiltin(template, options);
        const ranActions = await runActions(template, options);
        return ranActions.length > 0 ? { ...result, ranActions } : result;
    }
    switch (template.source.type) {
        case 'local': {
            const result = scaffoldLocal(template, options);
            const ranActions = await runActions(template, options);
            return ranActions.length > 0 ? { ...result, ranActions } : result;
        }
        case 'vite-plus':
        case 'npm':
        case 'git':
            return scaffoldViaVp(template, options);
        default:
            throw new Error(`Template "${template.id}" has no scaffold handler.`);
    }
}
