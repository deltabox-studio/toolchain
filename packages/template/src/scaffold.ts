import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ensureToolingDependencies } from '@deltabox/toolchain/core';
import { type DockerRuntime, dockerFiles, writeDockerFiles } from '@deltabox/toolchain/docker';
import {
    createMonorepoRootFiles,
    createProjectTemplateFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    findRootOxcFiles,
    hasCatalog,
    isProjectTemplateId,
    SCAFFOLD_CATALOG,
    upsertWorkspaceTsconfig,
    workspaceDirForTsconfig,
    writeGeneratedFiles,
} from '@deltabox/toolchain/project';
import {
    applyReplacements,
    type GeneratedFile,
    type Replacements,
    spawnCross,
} from '@deltabox/toolchain/shared';
import { runVp } from 'vite-plugin-dbx';

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
    /** Overwrite existing files (local templates; default false). */
    overwrite?: boolean;
    /** Overwrite existing files (builtin + local templates). */
    force?: boolean;
    /** Action ids to run after writing the files (default: none). */
    actions?: string[];
    /** The monorepo workspaces tsconfig name (workspace scaffolds). */
    tsconfigRootFile?: string;
    /** Version overrides for the provisioned formatter/linter dependencies. */
    toolVersions?: Record<string, string>;
    /** Also write Docker artifacts (default false). */
    containerize?: boolean;
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

/** The package metadata tokens a builtin scaffold passes to its generators. */
function projectContext(tokens: Record<string, unknown>): Record<string, string> {
    const text = (value: unknown): string | undefined =>
        value === undefined || value === null || value === '' ? undefined : String(value);
    const repo = text(tokens.repo) ?? text(tokens.repoUrl);
    return {
        ...(text(tokens.description) ? { description: text(tokens.description)! } : {}),
        ...(text(tokens.author) ? { author: text(tokens.author)! } : {}),
        ...(text(tokens.license) ? { license: text(tokens.license)! } : {}),
        ...(text(tokens.homepage) ? { homepage: text(tokens.homepage)! } : {}),
        ...(repo ? { repo } : {}),
        ...(text(tokens.nodeVersion) ? { nodeVersion: text(tokens.nodeVersion)! } : {}),
    };
}

/** The Docker runtime a builtin template produces (undefined = not containerized). */
function containerRuntime(
    template: Template
): { runtime: DockerRuntime; output?: string } | undefined {
    switch (template.builtin) {
        case 'vitepress':
            return { runtime: 'static', output: 'docs/.vitepress/dist' };
        case 'application':
        case 'ollama-chat':
            return { runtime: 'static', output: 'dist' };
        case 'bun':
        case 'file-server-bun-s3':
            return { runtime: 'bun', output: 'dist' };
        case 'single':
        case 'express':
        case 'fastify':
        case 'orpc':
        case 'file-server':
        case 'file-server-s3':
        case 'file-server-minio':
        case 'file-server-rclone':
            return { runtime: 'node', output: 'dist' };
        default:
            return undefined;
    }
}

/** Scaffold from one of the local generators (builtin templates). */
function scaffoldBuiltin(template: Template, options: ScaffoldOptions): ScaffoldResult {
    const tokens = replacementMap(options);
    const text = (value: unknown): string | undefined =>
        value === undefined || value === null || value === '' ? undefined : String(value);
    const name = String(tokens.name ?? 'app');
    const scope = tokens.scope ? String(tokens.scope) : undefined;
    const includeConfig = boolToken(tokens.includeConfig);
    const packageManager = text(tokens.packageManager);
    const configuredManager = text(options.tokens?.packageManager);
    const configuredVersion =
        text(options.tokens?.packageManagerVersion) ?? text(options.tokens?.yarnVersion);
    const packageManagerVersion =
        text(options.variables?.packageManagerVersion) ??
        (packageManager && packageManager === configuredManager ? configuredVersion : undefined);
    const metadata: Record<string, string> = {
        ...projectContext(tokens),
        ...(packageManagerVersion ? { packageManagerVersion } : {}),
    };
    // A workspace describes itself, not the root it is scaffolded from.
    const { description: _description, ...workspaceMetadata } = metadata;
    const files: GeneratedFile[] = [];
    let toolingCwd = options.cwd;
    let toolingRoot: string | undefined;

    switch (template.builtin) {
        case 'monorepo-root': {
            const rootScope = scope ?? `@${name}`;
            files.push(
                ...createMonorepoRootFiles({
                    ...metadata,
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
                    ...metadata,
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
                    ...workspaceMetadata,
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
            // Validate before writing: a name like `../..` must never target the
            // monorepo root (or another package) with `--force`.
            const dir = workspaceDirForTsconfig(`packages/${name}`);
            toolingCwd = path.join(options.cwd, dir);
            toolingRoot = options.cwd;
            files.push(
                ...createWorkspaceFiles({
                    ...workspaceMetadata,
                    name,
                    ...(scope ? { scope } : {}),
                    wsName: name,
                    wsDir: dir,
                    type: 'monorepo-workspace',
                    includeConfig,
                    useCatalog: hasCatalog(
                        options.cwd,
                        packageManager,
                        Object.keys(SCAFFOLD_CATALOG)
                    ),
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
            const projectContext = {
                ...metadata,
                name,
                ...(scope ? { scope } : {}),
                type: 'project' as const,
                includeConfig,
                rootOxc: findRootOxcFiles(options.cwd),
                ...(packageManager ? { packageManager } : {}),
            };
            // `single` + `application`: a root package project; the built-in
            // project templates layer their own files/deps over the same scaffold.
            files.push(
                ...(template.builtin && isProjectTemplateId(template.builtin)
                    ? createProjectTemplateFiles(template.builtin, projectContext)
                    : createRootProjectFiles({
                          ...projectContext,
                          kind: template.builtin === 'application' ? 'application' : 'project',
                      }))
            );
        }
    }
    if (options.containerize) {
        const docker = containerRuntime(template);
        if (docker) {
            files.push(
                ...dockerFiles({
                    cwd: options.cwd,
                    projectName: name,
                    vitePlus: true,
                    ...(packageManager ? { packageManager } : {}),
                    ...(metadata.nodeVersion ? { nodeVersion: metadata.nodeVersion } : {}),
                    runtime: docker.runtime,
                    ...(docker.output ? { output: docker.output } : {}),
                    // Every containerized scaffold ships a local compose file.
                    compose: true,
                })
            );
        }
    }
    const written = writeGeneratedFiles(files, options.cwd, { force: options.force === true });
    if (template.builtin !== 'folder') {
        ensureToolingDependencies({
            cwd: toolingCwd,
            ...(toolingRoot ? { root: toolingRoot } : {}),
            selection: { fmt: 'oxc', lint: 'oxc' },
            ...(options.toolVersions ? { versions: options.toolVersions } : {}),
        });
    }
    if (template.builtin === 'monorepo-workspace') {
        upsertWorkspaceTsconfig(
            options.cwd,
            { alias: name, dir: workspaceDirForTsconfig(`packages/${name}`) },
            scope,
            options.tsconfigRootFile
        );
    }
    return { written };
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
    const overwrite = options.force === true || options.overwrite === true;
    const pending: { target: string; content: string }[] = [];
    const root = path.resolve(options.cwd);

    const walk = (relative: string): void => {
        const abs = path.join(dir, relative);
        for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
            if (ignore.has(entry.name)) continue;
            const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(childRelative);
                continue;
            }
            const target = path.resolve(
                root,
                applyReplacements(childRelative, tokens, { open, close })
            );
            const normalizedRoot = process.platform === 'win32' ? root.toLowerCase() : root;
            const normalizedTarget = process.platform === 'win32' ? target.toLowerCase() : target;
            if (
                normalizedTarget !== normalizedRoot &&
                !normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
            ) {
                throw new Error(`refusing to write outside ${root}: ${target}`);
            }
            if (!overwrite && fs.existsSync(target)) continue;
            const content = fs.readFileSync(path.join(dir, childRelative), 'utf-8');
            pending.push({ target, content: applyReplacements(content, tokens, { open, close }) });
        }
    };
    walk('');

    // Write only once the whole tree has been read + rendered, so a failure (or
    // a cancelled run) can never leave a half-copied template behind.
    const written: string[] = [];
    for (const file of pending) {
        fs.mkdirSync(path.dirname(file.target), { recursive: true });
        fs.writeFileSync(file.target, file.content, 'utf-8');
        written.push(file.target);
    }
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
    if (result.code !== 0 || !options.containerize) return { written: [], code: result.code };

    // `vp create` writes into a folder named after the project (or the current
    // directory for an interactive create); write the Docker artifacts there.
    const candidates = [...(name ? [path.join(options.cwd, String(name))] : []), options.cwd];
    const dir = candidates.find(candidate => fs.existsSync(path.join(candidate, 'package.json')));
    if (!dir) return { written: [], code: result.code };
    const written = writeDockerFiles({
        cwd: dir,
        ...(name ? { projectName: String(name) } : {}),
        ...(options.tokens?.packageManager
            ? { packageManager: String(options.tokens.packageManager) }
            : {}),
        compose: true,
        force: true,
    });
    return { written, code: result.code };
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
