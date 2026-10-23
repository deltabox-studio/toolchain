import fs from 'node:fs';
import path from 'node:path';

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
} from '@deltabox/toolchain-shared';
import { runVp } from '@deltabox/toolchain-vite';

import { readTemplateManifest } from './local.js';
import type { Template } from './types.js';

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
}

export interface ScaffoldResult {
    /** Absolute paths written (empty when delegated to `vp`). */
    written: string[];
    /** The `vp` exit code when the template was created through Vite+. */
    code?: number;
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

/** Scaffold a project (or tooling) from a template. */
export async function scaffoldTemplate(
    template: Template,
    options: ScaffoldOptions
): Promise<ScaffoldResult> {
    if (template.builtin) return scaffoldBuiltin(template, options);
    switch (template.source.type) {
        case 'local':
            return scaffoldLocal(template, options);
        case 'vite-plus':
        case 'npm':
        case 'git':
            return scaffoldViaVp(template, options);
        default:
            throw new Error(`Template "${template.id}" has no scaffold handler.`);
    }
}
