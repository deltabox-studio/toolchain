/**
 * The global (user-level) template registry.
 *
 * Templates registered with `dbx template:add`/`template:init --add` are also
 * stored under `~/.dbx/toolchain/.registry/templates` by default, so they are
 * available in every project (and show up in the VS Code extension). The search
 * paths are configurable from the CLI config
 * (`~/.dbx/toolchain/cli/config.json`) and the VS Code setting
 * `deltabox.templatesSearchPaths`; the two are kept in sync.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { ToolchainTemplateSource } from '@deltabox/toolchain-shared';

import { loadLocalTemplates } from './local.js';
import type { Template } from './types.js';

/** The VS Code setting that lists the template search paths. */
export const VSCODE_TEMPLATES_SEARCH_PATHS = 'deltabox.templatesSearchPaths';

/** `~/.dbx/toolchain`. */
export function globalToolchainDir(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain');
}

/** `~/.dbx/toolchain/cli/config.json`. */
export function cliConfigPath(): string {
    return path.join(globalToolchainDir(), 'cli', 'config.json');
}

/** `~/.dbx/toolchain/.registry/templates` (the default global templates dir). */
export function defaultGlobalTemplatesDir(): string {
    return path.join(globalToolchainDir(), '.registry', 'templates');
}

/** `~/.dbx/toolchain/.registry/sources.json` (non-local global sources). */
export function globalSourcesPath(): string {
    return path.join(globalToolchainDir(), '.registry', 'sources.json');
}

/** `~/.dbx/toolchain/.registry/providers.json`. */
export function globalProvidersPath(): string {
    return path.join(globalToolchainDir(), '.registry', 'providers.json');
}

/** The persisted CLI config (`~/.dbx/toolchain/cli/config.json`). */
export interface GlobalCliConfig {
    /** Template search paths (directories and/or `http(s)` registry URLs). */
    templatesSearchPaths?: string | string[];
    /** The VS Code user directory (its `settings.json` holds the search paths). */
    vscodeDir?: string;
}

/** Options that only read or write the persisted config. */
export function readGlobalCliConfig(): GlobalCliConfig {
    try {
        const raw = fs.readFileSync(cliConfigPath(), 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw) as GlobalCliConfig;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

/** Merge a patch into the persisted CLI config and return the result. */
export function writeGlobalCliConfig(patch: Partial<GlobalCliConfig>): GlobalCliConfig {
    const next: GlobalCliConfig = { ...readGlobalCliConfig(), ...patch };
    for (const key of Object.keys(next) as (keyof GlobalCliConfig)[]) {
        if (next[key] === undefined) delete next[key];
    }
    const file = cliConfigPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(next, null, 4)}\n`, 'utf-8');
    return next;
}

/** Expand a leading `~` to the user's home directory. */
export function expandHome(value: string): string {
    if (value === '~') return os.homedir();
    if (value.startsWith('~/') || value.startsWith('~\\'))
        return path.join(os.homedir(), value.slice(2));
    return value;
}

/** Normalize a string-or-array path setting into an array (home-expanded). */
export function normalizeSearchPaths(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return (Array.isArray(value) ? value : [value])
        .map(entry => expandHome(String(entry)))
        .filter(Boolean);
}

/** Whether a search path is a remote registry URL. */
export function isRemoteRegistry(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

/** The value range of a top-level JSON/JSONC key's value. */
function findJsonValue(text: string, key: string): [number, number] | undefined {
    const keyIndex = text.search(
        new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`)
    );
    if (keyIndex === -1) return undefined;
    const colon = text.indexOf(':', keyIndex);
    if (colon === -1) return undefined;
    let start = colon + 1;
    while (start < text.length && /\s/.test(text[start] as string)) start++;
    const open = text[start];
    if (open === '[' || open === '{') {
        const close = open === '[' ? ']' : '}';
        let depth = 0;
        for (let i = start; i < text.length; i++) {
            if (text[i] === open) depth++;
            else if (text[i] === close) {
                depth--;
                if (depth === 0) return [start, i + 1];
            }
        }
        return undefined;
    }
    if (open === '"') {
        let i = start + 1;
        while (i < text.length && text[i] !== '"') {
            if (text[i] === '\\') i++;
            i++;
        }
        return [start, i + 1];
    }
    let end = start;
    while (end < text.length && text[end] !== ',' && text[end] !== '}') end++;
    while (end > start && /\s/.test(text[end - 1] as string)) end--;
    return [start, end];
}

/** Read a JSON/JSONC file's top-level value (comments are tolerated). */
function readJsoncValue(text: string, key: string): unknown {
    const range = findJsonValue(text, key);
    if (!range) return undefined;
    try {
        return JSON.parse(text.slice(range[0], range[1]));
    } catch {
        return undefined;
    }
}

/** Set a top-level JSON/JSONC key, preserving the rest of the file (incl. comments). */
export function setJsoncValue(text: string, key: string, value: unknown): string {
    const serialized = JSON.stringify(value);
    const range = findJsonValue(text, key);
    if (range) return `${text.slice(0, range[0])}${serialized}${text.slice(range[1])}`;
    const open = text.indexOf('{');
    if (open === -1) return `{\n    "${key}": ${serialized}\n}\n`;
    return `${text.slice(0, open + 1)}\n    "${key}": ${serialized},${text.slice(open + 1)}`;
}

/** The path of the VS Code user `settings.json` for a `vscodeDir`. */
export function vscodeSettingsPath(vscodeDir: string): string {
    return path.join(expandHome(vscodeDir), 'settings.json');
}

/** Read the `deltabox.templatesSearchPaths` setting from a VS Code user dir. */
export function readVscodeSearchPaths(vscodeDir: string | undefined): string[] {
    if (!vscodeDir) return [];
    try {
        const text = fs.readFileSync(vscodeSettingsPath(vscodeDir), 'utf-8');
        return normalizeSearchPaths(
            readJsoncValue(text, VSCODE_TEMPLATES_SEARCH_PATHS) as string | string[]
        );
    } catch {
        return [];
    }
}

/**
 * Write the `deltabox.templatesSearchPaths` setting into a VS Code user dir.
 * Best-effort JSONC edit: other settings/comments are preserved.
 */
export function writeVscodeSearchPaths(vscodeDir: string | undefined, paths: string[]): boolean {
    if (!vscodeDir) return false;
    if (paths.length === 0) return false;
    const file = vscodeSettingsPath(vscodeDir);
    let text = '';
    try {
        text = fs.readFileSync(file, 'utf-8');
    } catch {
        text = '{\n}\n';
    }
    // Skip a no-op write (which could re-trigger the extension's setting change).
    if (
        JSON.stringify(readJsoncValue(text, VSCODE_TEMPLATES_SEARCH_PATHS)) ===
        JSON.stringify(paths)
    ) {
        return false;
    }
    const next = setJsoncValue(text, VSCODE_TEMPLATES_SEARCH_PATHS, paths);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next, 'utf-8');
    return true;
}

/** Where the resolved template search paths came from. */
export type SearchPathSource = 'cli' | 'vscode' | 'default';

export interface ResolvedSearchPaths {
    paths: string[];
    source: SearchPathSource;
    vscodeDir?: string;
}

/**
 * Resolve the template search paths: the CLI config wins, then the VS Code
 * global setting, then the default `~/.dbx/toolchain/.registry/templates`.
 */
export function resolveTemplateSearchPaths(): ResolvedSearchPaths {
    const cli = readGlobalCliConfig();
    const vscodeDir = cli.vscodeDir ? expandHome(cli.vscodeDir) : undefined;
    const cliPaths = normalizeSearchPaths(cli.templatesSearchPaths);
    if (cliPaths.length > 0) {
        return { paths: cliPaths, source: 'cli', ...(vscodeDir ? { vscodeDir } : {}) };
    }
    const vscodePaths = readVscodeSearchPaths(vscodeDir);
    if (vscodePaths.length > 0) {
        return { paths: vscodePaths, source: 'vscode', ...(vscodeDir ? { vscodeDir } : {}) };
    }
    return {
        paths: [defaultGlobalTemplatesDir()],
        source: 'default',
        ...(vscodeDir ? { vscodeDir } : {}),
    };
}

/** The non-local global sources (git/npm/http) stored in the registry. */
export function readGlobalSources(): ToolchainTemplateSource[] {
    try {
        const raw = fs.readFileSync(globalSourcesPath(), 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw) as
            | { sources?: ToolchainTemplateSource[] }
            | ToolchainTemplateSource[];
        const sources = Array.isArray(parsed) ? parsed : parsed.sources;
        return Array.isArray(sources) ? sources : [];
    } catch {
        return [];
    }
}

/** Add/replace a non-local source in the global sources registry. */
export function addGlobalSource(source: ToolchainTemplateSource): ToolchainTemplateSource[] {
    const key = (value: ToolchainTemplateSource): string => `${value.type}:${value.locate}`;
    const sources = readGlobalSources().filter(existing => key(existing) !== key(source));
    sources.push(source);
    const file = globalSourcesPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ sources }, null, 4)}\n`, 'utf-8');
    return sources;
}

/** Directories never copied when a template is stored globally. */
const GLOBAL_COPY_IGNORE = new Set(['node_modules', '.git', 'dist', '.dbx', '.turbo', '.DS_Store']);

/**
 * Store a local template directory in the first writable global directory.
 * Returns the destination path (or the original when it is already global).
 */
export function addGlobalTemplate(dir: string, id?: string): string {
    const { paths } = resolveTemplateSearchPaths();
    const local = paths.filter(entry => !isRemoteRegistry(entry));
    const root = local[0] ?? defaultGlobalTemplatesDir();
    const name = (id ?? path.basename(dir)).replace(/[\\/]+/g, '-');
    const destination = path.join(root, name);
    if (path.resolve(destination) === path.resolve(dir)) return destination;
    if (fs.existsSync(path.join(destination, 'template.json'))) return destination;
    fs.mkdirSync(root, { recursive: true });
    fs.cpSync(dir, destination, {
        recursive: true,
        filter: source => !GLOBAL_COPY_IGNORE.has(path.basename(source)),
    });
    return destination;
}

export interface GlobalTemplates {
    /** Templates discovered in the local search paths. */
    templates: Template[];
    /** Sources declared by remote (`http(s)`) registries. */
    sources: ToolchainTemplateSource[];
    /** The resolved search paths. */
    paths: string[];
}

/**
 * Load the global templates: local search paths are scanned for template dirs,
 * and remote registry URLs are fetched (their `{ sources }` / array is merged).
 */
export async function loadGlobalTemplates(): Promise<GlobalTemplates> {
    const { paths } = resolveTemplateSearchPaths();
    const templates: Template[] = [];
    const sources: ToolchainTemplateSource[] = readGlobalSources();
    for (const entry of paths) {
        if (isRemoteRegistry(entry)) {
            try {
                const response = await fetch(entry);
                if (!response.ok) continue;
                const parsed = (await response.json()) as unknown;
                const list = Array.isArray(parsed)
                    ? parsed
                    : (parsed as { sources?: unknown }).sources;
                if (Array.isArray(list)) sources.push(...(list as ToolchainTemplateSource[]));
            } catch {
                // A broken/unreachable remote registry is skipped.
            }
            continue;
        }
        templates.push(...loadLocalTemplates(entry));
    }
    return { templates, sources, paths };
}
