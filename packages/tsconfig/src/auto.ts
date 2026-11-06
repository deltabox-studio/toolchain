/**
 * Auto-wire the root workspaces tsconfig from the project graph.
 *
 * Enabling `auto` makes `dbx sync` / `dbx tsconfig` derive the `paths` and
 * `references` from each workspace instead of requiring them to be hand-written.
 * Existing custom entries are preserved: only keys the previous auto run managed
 * are updated or removed.
 */

import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'glob';
import type { TsConfigJson } from 'type-fest';

import type { PackageJson, ToolchainTsconfigAliasRewrite } from '@deltabox/toolchain/shared';

import { resolveTsconfigCompilerOption } from './resolve.js';
import { matchesAutoFilter, resolveAutoSwitches, type TsconfigWorkspace } from './workspaces.js';

/** The keys auto-wiring owns in the root workspaces tsconfig. */
export interface TsconfigAutoState {
    paths: string[];
    references: string[];
}

export interface AutoTsconfigOptions {
    /** Repo root. */
    cwd: string;
    /** The parsed root workspaces tsconfig (custom entries are preserved). */
    existing?: TsConfigJson;
    /** The previous auto state (from `.dbx/toolchain/tsconfig-auto.json`). */
    previous?: TsconfigAutoState;
}

export interface AutoTsconfigResult {
    config: TsConfigJson;
    state: TsconfigAutoState;
}

const DEFAULT_SRC_DIR = 'src';
const SOURCE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];

function posix(value: string): string {
    return value.replace(/\\/g, '/');
}

function repoPath(cwd: string, target: string): string {
    const relative = posix(path.relative(cwd, target));
    return relative.startsWith('.') ? relative : `./${relative}`;
}

function normalizeSrcDir(value: string): string {
    const normalized = posix(value).replace(/^\.\//, '').replace(/\/+$/, '');
    return normalized === '' ? '.' : normalized;
}

/** The source directory for a workspace (config override > rootDir/baseUrl > src). */
export function resolveWorkspaceSrcDir(
    workspace: TsconfigWorkspace,
    fallback: string = DEFAULT_SRC_DIR
): string {
    const configured = workspace.options.autoSrcDir;
    if (typeof configured === 'string' && configured.trim()) {
        return normalizeSrcDir(configured);
    }
    const rootDir = resolveTsconfigCompilerOption(workspace.defaultTsconfigPath, 'rootDir');
    if (rootDir) return normalizeSrcDir(repoPath(workspace.dir, rootDir));
    const baseUrl = resolveTsconfigCompilerOption(workspace.defaultTsconfigPath, 'baseUrl');
    if (baseUrl) return normalizeSrcDir(repoPath(workspace.dir, baseUrl));
    return normalizeSrcDir(fallback);
}

/** Pick a usable file target from an `exports` value. */
function exportTarget(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        for (const item of value) {
            const target = exportTarget(item);
            if (target) return target;
        }
        return undefined;
    }
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    for (const key of ['types', 'import', 'default', 'require', 'node', 'browser']) {
        const target = exportTarget(record[key]);
        if (target) return target;
    }
    for (const item of Object.values(record)) {
        const target = exportTarget(item);
        if (target) return target;
    }
    return undefined;
}

function exportEntries(exportsField: unknown): Array<{ key: string; target: string }> {
    if (typeof exportsField === 'string') return [{ key: '', target: exportsField }];
    if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) return [];
    const record = exportsField as Record<string, unknown>;
    const keys = Object.keys(record);
    // A condition object (`{ types, import, default }`) targets the package root.
    if (keys.every(key => !key.startsWith('.'))) {
        const target = exportTarget(record);
        return target ? [{ key: '', target }] : [];
    }
    const entries: Array<{ key: string; target: string }> = [];
    for (const [key, value] of Object.entries(record)) {
        const target = exportTarget(value);
        if (!target) continue;
        if (key === '.') entries.push({ key: '', target });
        else if (key.startsWith('./')) entries.push({ key: key.slice(2), target });
    }
    return entries;
}

function normalizeTarget(cwd: string, workspaceDir: string, target: string): string {
    const absolute = path.resolve(workspaceDir, target);
    return repoPath(cwd, absolute);
}

function aliasFor(
    entries: Array<{ key: string; target: string }>,
    packageName: string,
    cwd: string,
    workspaceDir: string
) {
    const paths: Record<string, string[]> = {};
    for (const entry of entries) {
        const key = entry.key ? `${packageName}/${entry.key}` : packageName;
        paths[key] = [normalizeTarget(cwd, workspaceDir, entry.target)];
    }
    return paths;
}

/** Skip build artifacts in package exports/main/types; source scanning handles them. */
function isSourceTarget(target: string): boolean {
    const normalized = target.replace(/\\/g, '/');
    if (/(^|\/)(dist|build|out|lib|coverage)\//.test(normalized)) return false;
    if (/\.d\.[cm]?ts$/.test(normalized)) return false;
    return true;
}

interface CompiledAliasRewrite {
    regex: RegExp;
    replacement: string;
}

/** Compile the configured rewrite into ordered rules (first match wins). */
function compileAliasRewrite(
    rewrite: ToolchainTsconfigAliasRewrite | undefined
): CompiledAliasRewrite[] {
    if (!rewrite) return [];
    const rules = Array.isArray(rewrite)
        ? rewrite.flatMap(rule =>
              (Array.isArray(rule.pattern) ? rule.pattern : [rule.pattern]).map(pattern => ({
                  pattern,
                  replacement: rule.replacement,
              }))
          )
        : Object.entries(rewrite).map(([pattern, replacement]) => ({ pattern, replacement }));

    const compiled: CompiledAliasRewrite[] = [];
    for (const rule of rules) {
        try {
            const regex =
                rule.pattern instanceof RegExp
                    ? new RegExp(rule.pattern.source, rule.pattern.flags.replace(/[gy]/g, ''))
                    : new RegExp(rule.pattern);
            compiled.push({ regex, replacement: rule.replacement });
        } catch {
            // An invalid pattern is ignored rather than crashing the sync.
        }
    }
    return compiled;
}

/** Apply the configured rewrite to generated alias keys (custom keys are untouched). */
function rewriteAliasPaths(
    paths: Record<string, string[]>,
    rewrite: ToolchainTsconfigAliasRewrite | undefined
): Record<string, string[]> {
    const rules = compileAliasRewrite(rewrite);
    if (rules.length === 0) return paths;
    const rewritten: Record<string, string[]> = {};
    for (const [key, target] of Object.entries(paths)) {
        const rule = rules.find(candidate => candidate.regex.test(key));
        const nextKey = rule ? key.replace(rule.regex, rule.replacement) : key;
        // A later generated key that rewrites to the same name wins, matching
        // the object-assignment semantics used when merging paths.
        rewritten[nextKey] = target;
    }
    return rewritten;
}

/** Resolve a package's root entry (source `types`/`main`, then `src/index.*`). */
function resolvePackageRootAlias(
    workspace: TsconfigWorkspace,
    pkg: PackageJson,
    srcDir: string,
    cwd: string
): string | undefined {
    const types = (pkg as { types?: unknown }).types;
    const entry = typeof types === 'string' ? types : (pkg as { main?: unknown }).main;
    if (typeof entry === 'string' && isSourceTarget(entry)) {
        return normalizeTarget(cwd, workspace.dir, entry);
    }
    const srcAbs = path.resolve(workspace.dir, srcDir);
    const entryFile = SOURCE_EXTENSIONS.map(ext => path.join(srcAbs, `index.${ext}`)).find(file =>
        fs.existsSync(file)
    );
    return entryFile ? repoPath(cwd, entryFile) : undefined;
}

/** Resolve the aliases a workspace contributes (package exports/main/types/scan). */
export function resolveWorkspaceAliases(
    workspace: TsconfigWorkspace,
    cwd: string
): Record<string, string[]> {
    const packageName = workspace.packageName;
    if (!packageName) return {};
    const pkg = workspace.packageJson ?? ({} as PackageJson);
    const srcDir = resolveWorkspaceSrcDir(workspace);
    const paths: Record<string, string[]> = {};

    const exported = exportEntries((pkg as { exports?: unknown }).exports).filter(entry =>
        isSourceTarget(entry.target)
    );
    if (exported.length > 0) {
        Object.assign(paths, aliasFor(exported, packageName, cwd, workspace.dir));
        // `exports` may only expose non-source targets (eg. `./dist/index.js`)
        // plus `./package.json`; still wire the package root from source.
        if (!paths[packageName]) {
            const root = resolvePackageRootAlias(workspace, pkg, srcDir, cwd);
            if (root) paths[packageName] = [root];
        }
        // A package root without an explicit wildcard still benefits from one.
        if (!paths[`${packageName}/*`] && srcDir) {
            paths[`${packageName}/*`] = [repoPath(cwd, path.resolve(workspace.dir, srcDir, '*'))];
        }
        return paths;
    }

    const root = resolvePackageRootAlias(workspace, pkg, srcDir, cwd);
    if (root) {
        paths[packageName] = [root];
        if (srcDir) {
            paths[`${packageName}/*`] = [repoPath(cwd, path.resolve(workspace.dir, srcDir, '*'))];
        }
        return paths;
    }

    const srcAbs = path.resolve(workspace.dir, srcDir);
    const entryFile = SOURCE_EXTENSIONS.map(ext => path.join(srcAbs, `index.${ext}`)).find(file =>
        fs.existsSync(file)
    );
    if (entryFile) {
        paths[packageName] = [repoPath(cwd, entryFile)];
    }

    // Index directories become explicit aliases; everything else is covered by
    // the single wildcard below (which also accepts nested subpaths).
    const indexFiles = fs.existsSync(srcAbs)
        ? globSync(`**/index.{${SOURCE_EXTENSIONS.join(',')}}`, {
              cwd: srcAbs,
              nodir: true,
              ignore: ['**/node_modules/**'],
          })
        : [];
    for (const file of indexFiles) {
        const relative = posix(file);
        const directory = path.posix.dirname(relative);
        if (directory === '.') continue;
        paths[`${packageName}/${directory}`] = [repoPath(cwd, path.join(srcAbs, relative))];
    }

    if (srcDir === '.') {
        paths[`${packageName}/*`] = [repoPath(cwd, path.resolve(workspace.dir, '*'))];
    } else {
        paths[`${packageName}/*`] = [repoPath(cwd, path.resolve(srcAbs, '*'))];
    }
    return paths;
}

/** Build the auto paths/references and merge them into `existing`. */
export function buildAutoTsconfig(
    workspaces: TsconfigWorkspace[],
    options: AutoTsconfigOptions
): AutoTsconfigResult {
    const config = structuredClone(options.existing ?? {}) as TsConfigJson;
    const compilerOptions = { ...config.compilerOptions };
    const paths: Record<string, string[]> = { ...compilerOptions.paths };
    let references = [...(config.references ?? [])];
    const previous = options.previous ?? { paths: [], references: [] };
    const managedPaths = new Set<string>();
    const managedReferences = new Set<string>();
    const workspaceByTsconfig = new Map(
        workspaces.map(workspace => [
            repoPath(options.cwd, workspace.targetTsconfigPath),
            workspace,
        ])
    );

    // When references are auto-wired, known workspace references are managed
    // even on the first run: a composite-disabled (or disabled/ref-less)
    // workspace must not keep a stale reference from a hand-written file. With
    // refs auto-wiring off, hand-written references are left untouched.
    references = references.filter(reference => {
        const normalized = reference.path.replace(/\\/g, '/').replace(/^\.\//, './');
        const workspace = workspaceByTsconfig.get(normalized);
        if (!workspace) return true;
        const switches = resolveAutoSwitches(workspace.options as Record<string, unknown>);
        if (!switches.refsAuto.enabled) return true;
        // Filter the reference path the auto run would emit, not the workspace
        // directory (so `include`/`exclude` see the generated result).
        if (!matchesAutoFilter(normalized, switches.refsAuto)) return true;
        // A workspace without a default tsconfig has no generated project to
        // reference (eg. a docs app or a test fixture with only a package.json).
        if (!fs.existsSync(workspace.defaultTsconfigPath)) return false;
        const active =
            workspace.enabled &&
            workspace.options.refs !== false &&
            workspace.options.composite === true;
        if (!active) return false;
        managedReferences.add(normalized);
        return true;
    });

    for (const workspace of workspaces) {
        if (!workspace.enabled) continue;
        const switches = resolveAutoSwitches(workspace.options as Record<string, unknown>);
        if (!matchesAutoFilter(workspace.relativeDir, switches.auto)) continue;

        const aliasesEnabled = workspace.options.aliases !== false && switches.aliasAuto.enabled;
        if (aliasesEnabled && workspace.packageName) {
            const rewrite = switches.aliasAuto.rewriteAlias ?? switches.auto.rewriteAlias;
            const generated = rewriteAliasPaths(
                resolveWorkspaceAliases(workspace, options.cwd),
                rewrite
            );
            for (const [key, target] of Object.entries(generated)) {
                // Filter the rewritten key the auto run would emit, not the
                // original package name or workspace directory.
                if (!matchesAutoFilter(key, switches.aliasAuto)) continue;
                // A pre-existing key the previous auto run did not own is
                // user-owned: never overwrite it and never start managing it.
                if (key in paths && !previous.paths.includes(key)) continue;
                paths[key] = target;
                managedPaths.add(key);
            }
        }

        const refsEnabled = workspace.options.refs !== false && switches.refsAuto.enabled;
        const composite = workspace.options.composite === true;
        const reference = {
            path: repoPath(options.cwd, workspace.targetTsconfigPath),
        };
        if (
            refsEnabled &&
            composite &&
            !workspace.isRoot &&
            fs.existsSync(workspace.defaultTsconfigPath) &&
            matchesAutoFilter(reference.path, switches.refsAuto)
        ) {
            const existing = references.find(item => item.path === reference.path);
            if (!existing || previous.references.includes(reference.path)) {
                references = references.filter(item => item.path !== reference.path);
                references.push(existing ? { ...existing, ...reference } : reference);
                managedReferences.add(reference.path);
            }
        }
    }

    // Remove stale entries that the previous auto run owned.
    for (const key of previous.paths) {
        if (!managedPaths.has(key)) delete paths[key];
    }
    for (const reference of previous.references) {
        if (!managedReferences.has(reference)) {
            references = references.filter(item => item.path !== reference);
        }
    }

    if (Object.keys(paths).length > 0) compilerOptions.paths = paths;
    else delete compilerOptions.paths;
    const next: TsConfigJson = { ...config, compilerOptions };
    if (references.length > 0) next.references = references;
    else delete next.references;

    return {
        config: next,
        state: {
            paths: [...managedPaths].sort(),
            references: [...managedReferences].sort(),
        },
    };
}

/** Read/parse the auto state sidecar (`.dbx/toolchain/tsconfig-auto.json`). */
export function readAutoState(file: string): TsconfigAutoState | undefined {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<TsconfigAutoState>;
        return {
            paths: Array.isArray(parsed.paths) ? parsed.paths : [],
            references: Array.isArray(parsed.references) ? parsed.references : [],
        };
    } catch {
        return undefined;
    }
}

/** The sidecar path for a repo root. */
export function autoStatePath(cwd: string): string {
    return path.join(cwd, '.dbx', 'toolchain', 'tsconfig-auto.json');
}
