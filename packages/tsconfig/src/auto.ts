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

import {
    type PackageJson,
    splitPackageName,
    type ToolchainTsconfigAliasRewrite,
} from '@deltabox/toolchain/shared';

import { resolveTsconfigCompilerOption } from './resolve.js';
import {
    type AliasDiscoveryMode,
    matchesAutoFilter,
    resolveAutoSwitches,
    type TsconfigWorkspace,
} from './workspaces.js';

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

/** How the auto-wiring should resolve a workspace's aliases. */
export interface WorkspaceAliasSettings {
    /** Discovery modes (default `auto`). */
    modes?: AliasDiscoveryMode[];
    /** Base key for generated aliases (default: the package name). */
    prefix?: string;
    /** Resolve exports to source files (default true). */
    devMode?: boolean;
    /** Output directory for source/dist mapping (default: tsconfig `outDir`, then `dist`). */
    dist?: string;
}

const DEFAULT_DIST_DIR = 'dist';

/** The effective discovery modes (`auto` when unset). */
function aliasModes(settings: WorkspaceAliasSettings): AliasDiscoveryMode[] {
    return settings.modes && settings.modes.length > 0 ? settings.modes : ['auto'];
}

/** The alias base key (a `prefix` + the unscoped package name, else the package name). */
function aliasBase(
    workspace: TsconfigWorkspace,
    settings: WorkspaceAliasSettings
): string | undefined {
    if (!workspace.packageName) return undefined;
    if (!settings.prefix) return workspace.packageName;
    const prefix = settings.prefix.replace(/\/+$/, '');
    const { name } = splitPackageName(workspace.packageName);
    return name ? `${prefix}/${name}` : workspace.packageName;
}

/** Whether `target` is inside `dir`. */
function isInside(target: string, dir: string): boolean {
    const relative = path.relative(dir, target);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/** Strip a JS/TS output extension (including `.d.ts`) from a target path. */
function withoutOutputExtension(value: string): string {
    return value.replace(/\.d\.[cm]?ts$/, '').replace(/\.[cm]?[jt]sx?$/, '');
}

/** Source-file candidates for a stem (the file itself or its index). */
function sourceCandidates(stem: string): string[] {
    const extensions = [...SOURCE_EXTENSIONS, 'mts', 'cts'];
    return [
        ...extensions.map(extension => `${stem}.${extension}`),
        ...extensions.map(extension => path.join(stem, `index.${extension}`)),
    ];
}

/** The configured output directory (relative to the workspace). */
function workspaceDistDir(workspace: TsconfigWorkspace, settings: WorkspaceAliasSettings): string {
    const configured =
        settings.dist ?? resolveTsconfigCompilerOption(workspace.defaultTsconfigPath, 'outDir');
    return normalizeSrcDir(configured ?? DEFAULT_DIST_DIR);
}

/** Map a `dist` target back to its source file (dev mode). */
function distToSourceTarget(
    target: string,
    workspace: TsconfigWorkspace,
    cwd: string,
    srcDir: string,
    distDir: string
): string | undefined {
    const absolute = path.resolve(workspace.dir, target);
    const distAbs = path.resolve(workspace.dir, distDir);
    if (!isInside(absolute, distAbs)) return undefined;
    const relative = withoutOutputExtension(posix(path.relative(distAbs, absolute)));
    const stem = path.resolve(workspace.dir, srcDir, relative);
    const found = sourceCandidates(stem).find(file => fs.existsSync(file));
    return found ? repoPath(cwd, found) : undefined;
}

/** Map a source target to its distributed file (when dev mode is off). */
function sourceToDistTarget(
    target: string,
    workspace: TsconfigWorkspace,
    cwd: string,
    srcDir: string,
    distDir: string
): string | undefined {
    const absolute = path.resolve(workspace.dir, target);
    const srcAbs = path.resolve(workspace.dir, srcDir);
    if (!isInside(absolute, srcAbs)) return undefined;
    const relative = withoutOutputExtension(posix(path.relative(srcAbs, absolute))) || 'index';
    return repoPath(cwd, path.resolve(workspace.dir, distDir, `${relative}.js`));
}

/** Whether an export target points at a non-source build output. */
function isBuildTarget(target: string, distDir: string): boolean {
    return (
        isInside(path.resolve('/_', target), path.resolve('/_', distDir)) ||
        /(^|\/)(build|out|lib|coverage)\//.test(posix(target)) ||
        /\.d\.[cm]?ts$/.test(target)
    );
}

/** Resolve one package export target according to `devMode`/`dist`. */
function resolveExportTarget(
    target: string,
    workspace: TsconfigWorkspace,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): string | undefined {
    const devMode = settings.devMode !== false;
    if (devMode) {
        const source = distToSourceTarget(target, workspace, cwd, srcDir, distDir);
        if (source) return source;
        // A build output we cannot map back to source is not a usable dev alias.
        return isBuildTarget(target, distDir)
            ? undefined
            : normalizeTarget(cwd, workspace.dir, target);
    }
    const distributed = sourceToDistTarget(target, workspace, cwd, srcDir, distDir);
    if (distributed) return distributed;
    return normalizeTarget(cwd, workspace.dir, target);
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
    for (const key of ['import', 'default', 'require', 'node', 'browser', 'types']) {
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
    base: string,
    cwd: string,
    workspaceDir: string,
    resolveTarget: (target: string) => string | undefined
): Record<string, string[]> {
    const paths: Record<string, string[]> = {};
    for (const entry of entries) {
        const target = resolveTarget(entry.target);
        if (!target) continue;
        const key = entry.key ? `${base}/${entry.key}` : base;
        paths[key] = [target];
    }
    return paths;
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

/** Map a discovered source file to its target (source in dev mode, dist otherwise). */
function resolveSourceFileTarget(
    absolute: string,
    workspace: TsconfigWorkspace,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): string {
    if (settings.devMode !== false) return repoPath(cwd, absolute);
    const relative = posix(path.relative(workspace.dir, absolute));
    return sourceToDistTarget(relative, workspace, cwd, srcDir, distDir) ?? repoPath(cwd, absolute);
}

/** Resolve a package's root entry (types/main, then `src/index.*`). */
function resolvePackageRootAlias(
    workspace: TsconfigWorkspace,
    pkg: PackageJson,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): string | undefined {
    const types = (pkg as { types?: unknown }).types;
    const entry = typeof types === 'string' ? types : (pkg as { main?: unknown }).main;
    if (typeof entry === 'string') {
        const resolved = resolveExportTarget(entry, workspace, settings, cwd, srcDir, distDir);
        if (resolved) return resolved;
    }
    const srcAbs = path.resolve(workspace.dir, srcDir);
    const entryFile = SOURCE_EXTENSIONS.map(ext => path.join(srcAbs, `index.${ext}`)).find(file =>
        fs.existsSync(file)
    );
    return entryFile
        ? resolveSourceFileTarget(entryFile, workspace, settings, cwd, srcDir, distDir)
        : undefined;
}

/** Aliases derived from `package.json` `exports`/`types`/`main`. */
function collectExportAliases(
    workspace: TsconfigWorkspace,
    base: string,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): Record<string, string[]> {
    const pkg = workspace.packageJson ?? ({} as PackageJson);
    const entries = exportEntries((pkg as { exports?: unknown }).exports);
    const paths = aliasFor(entries, base, cwd, workspace.dir, target =>
        resolveExportTarget(target, workspace, settings, cwd, srcDir, distDir)
    );
    if (!paths[base]) {
        const root = resolvePackageRootAlias(workspace, pkg, settings, cwd, srcDir, distDir);
        if (root) paths[base] = [root];
    }
    // A package root without an explicit wildcard still benefits from one.
    if (!paths[`${base}/*`] && srcDir) {
        const wildcardBase = settings.devMode === false ? distDir : srcDir;
        paths[`${base}/*`] = [repoPath(cwd, path.resolve(workspace.dir, wildcardBase, '*'))];
    }
    return paths;
}

/** Aliases derived from the workspace source tree (index files + wildcard). */
function collectProjectStructureAliases(
    workspace: TsconfigWorkspace,
    base: string,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): Record<string, string[]> {
    const paths: Record<string, string[]> = {};
    const srcAbs = path.resolve(workspace.dir, srcDir);
    const entryFile = SOURCE_EXTENSIONS.map(ext => path.join(srcAbs, `index.${ext}`)).find(file =>
        fs.existsSync(file)
    );
    if (entryFile) {
        paths[base] = [
            resolveSourceFileTarget(entryFile, workspace, settings, cwd, srcDir, distDir),
        ];
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
        paths[`${base}/${directory}`] = [
            resolveSourceFileTarget(
                path.join(srcAbs, relative),
                workspace,
                settings,
                cwd,
                srcDir,
                distDir
            ),
        ];
    }

    const wildcardBase = settings.devMode === false ? distDir : srcDir;
    paths[`${base}/*`] = [repoPath(cwd, path.resolve(workspace.dir, wildcardBase, '*'))];
    return paths;
}

/** `auto`: exports first, then the project structure when they yield nothing. */
function collectAutoAliases(
    workspace: TsconfigWorkspace,
    base: string,
    settings: WorkspaceAliasSettings,
    cwd: string,
    srcDir: string,
    distDir: string
): Record<string, string[]> {
    const exported = collectExportAliases(workspace, base, settings, cwd, srcDir, distDir);
    const keys = Object.keys(exported).filter(key => key !== `${base}/*`);
    return keys.length > 0
        ? exported
        : collectProjectStructureAliases(workspace, base, settings, cwd, srcDir, distDir);
}

/** Resolve the aliases a workspace contributes according to `settings.modes`. */
export function resolveWorkspaceAliases(
    workspace: TsconfigWorkspace,
    cwd: string,
    settings: WorkspaceAliasSettings = {}
): Record<string, string[]> {
    const base = aliasBase(workspace, settings);
    if (!base) return {};
    const srcDir = resolveWorkspaceSrcDir(workspace);
    const distDir = workspaceDistDir(workspace, settings);
    const paths: Record<string, string[]> = {};
    for (const mode of aliasModes(settings)) {
        const generated =
            mode === 'auto'
                ? collectAutoAliases(workspace, base, settings, cwd, srcDir, distDir)
                : mode === 'exports'
                  ? collectExportAliases(workspace, base, settings, cwd, srcDir, distDir)
                  : collectProjectStructureAliases(workspace, base, settings, cwd, srcDir, distDir);
        for (const [key, target] of Object.entries(generated)) {
            if (!(key in paths)) paths[key] = target;
        }
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
            const settings: WorkspaceAliasSettings = {
                ...((switches.aliasAuto.modes ?? switches.auto.modes)
                    ? { modes: switches.aliasAuto.modes ?? switches.auto.modes }
                    : {}),
                ...((switches.aliasAuto.prefix ?? switches.auto.prefix)
                    ? { prefix: switches.aliasAuto.prefix ?? switches.auto.prefix }
                    : {}),
                devMode: switches.aliasAuto.devMode ?? switches.auto.devMode ?? true,
                ...((switches.aliasAuto.dist ?? switches.auto.dist)
                    ? { dist: switches.aliasAuto.dist ?? switches.auto.dist }
                    : {}),
            };
            const generated = rewriteAliasPaths(
                resolveWorkspaceAliases(workspace, options.cwd, settings),
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

    // Match the resolver/`dbx tsconfig --json` view: the most specific
    // (longest) key sorts first, so order-sensitive consumers see the same
    // paths whether they read the file or the JSON output.
    const sortedPaths = Object.fromEntries(
        Object.entries(paths).sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    );
    if (Object.keys(sortedPaths).length > 0) compilerOptions.paths = sortedPaths;
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
