/**
 * Provision the formatter/linter dependencies a scaffold or migration needs.
 *
 * The pipeline is: detect the tool the consumer ends up using, add that tool's
 * packages to the root (or project) `package.json`, and let the package
 * manager's catalog strategy decide between `catalog:` references and pinned
 * versions. Existing versions are never replaced: a consumer pin always wins.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_TOOLING_VERSIONS,
  declaredDependencies,
  FORMATTER_DEPENDENCIES,
  type FormatterTool,
  LINTER_DEPENDENCIES,
  type LinterTool,
  mergeJsonAt,
  type PackageJson,
  readJsonAt,
  type ToolingSelection,
  type ToolingTool,
} from '@deltabox/toolchain/shared';

import { detectPackageManager, type PackageManager } from './graph.js';

/** The packages that can satisfy a formatter/linter. */
function dependencyCandidates(kind: 'fmt' | 'lint', tool: ToolingTool): readonly string[] {
  return kind === 'fmt'
    ? FORMATTER_DEPENDENCIES[tool as FormatterTool]
    : LINTER_DEPENDENCIES[tool as LinterTool];
}

/** Read the nearest `package.json` at (or above) `cwd`, up to `root`. */ function readPackageJson(
  cwd: string,
  root: string
): { dir: string; pkg: PackageJson } | undefined {
  let dir = path.resolve(cwd);
  const boundary = path.resolve(root);
  for (;;) {
    const pkg = readJsonAt<PackageJson>(dir, 'package.json');
    if (pkg) return { dir, pkg };
    if (dir === boundary) return undefined;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** The repository/workspace root: the nearest `.git` or workspace root. */
export function findWorkspaceRoot(cwd: string): string {
  let dir = path.resolve(cwd);
  let fallback = dir;
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const pkg = readJsonAt<PackageJson>(dir, 'package.json');
    if (pkg) {
      const workspaces = pkg.workspaces as unknown;
      if (
        Array.isArray(workspaces) ||
        (workspaces &&
          typeof workspaces === 'object' &&
          Array.isArray((workspaces as { packages?: unknown }).packages))
      ) {
        return dir;
      }
      fallback = dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return fallback;
    dir = parent;
  }
}

/** The package manager a directory uses (its `packageManager`, else lockfile). */
export function packageManagerAt(dir: string): PackageManager {
  const pkg = readJsonAt<PackageJson>(dir, 'package.json');
  const declared =
    typeof pkg?.packageManager === 'string' ? pkg.packageManager.split('@')[0] : undefined;
  if (declared === 'yarn' || declared === 'pnpm' || declared === 'npm' || declared === 'bun') {
    return declared;
  }
  return detectPackageManager(dir) ?? 'yarn';
}

/** Whether `dir`'s package manager file already declares a non-empty catalog. */
function catalogFile(dir: string, pm: PackageManager): string | undefined {
  if (pm === 'yarn') return path.join(dir, '.yarnrc.yml');
  if (pm === 'pnpm') return path.join(dir, 'pnpm-workspace.yaml');
  return undefined;
}

function yamlCatalogExists(content: string): boolean {
  let inCatalog = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^catalog:\s*(?:#.*)?$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    if (/^\S/.test(line)) break;
    if (/^\s+"?[^":\s][^":]*"?:\s*\S/.test(line)) return true;
  }
  return false;
}

function bunCatalog(pkg: PackageJson | undefined): Record<string, string> | undefined {
  const workspaces = pkg?.workspaces as unknown;
  if (!workspaces || typeof workspaces !== 'object' || Array.isArray(workspaces)) {
    return undefined;
  }
  const catalog = (workspaces as { catalog?: unknown }).catalog;
  return catalog && typeof catalog === 'object' && !Array.isArray(catalog)
    ? (catalog as Record<string, string>)
    : undefined;
}

/** The catalog block a directory already has, if any (Yarn/pnpm/Bun). */
export function catalogAt(
  dir: string,
  pm: PackageManager = packageManagerAt(dir)
): Record<string, string> | undefined {
  if (pm === 'bun') return bunCatalog(readJsonAt<PackageJson>(dir, 'package.json'));
  const file = catalogFile(dir, pm);
  if (!file) return undefined;
  try {
    const content = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    return yamlCatalogExists(content) ? {} : undefined;
  } catch {
    return undefined;
  }
}

/** Insert missing entries into a YAML `catalog:` block (Yarn/pnpm). */
function addYamlCatalogEntries(content: string, entries: Record<string, string>): string {
  const additions = Object.entries(entries).map(
    ([name, version]) => `  ${JSON.stringify(name)}: ${version}`
  );
  if (additions.length === 0) return content;
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  const start = lines.findIndex(line => /^catalog:\s*(?:#.*)?$/.test(line));
  if (start === -1) {
    const body = content.replace(/\s*$/, '');
    return `${body}${body ? '\n' : ''}\ncatalog:\n${additions.join('\n')}\n`;
  }
  let end = start + 1;
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end] as string))) end++;
  while (end > start + 1 && (lines[end - 1] as string).trim() === '') end--;
  lines.splice(end, 0, ...additions);
  return lines.join('\n');
}

/** Result of {@link ensureToolingDependencies}. */
export interface EnsureToolingDependenciesResult {
  /** Which `package.json` received the dependencies. */
  scope: 'root' | 'project';
  /** The `package.json` that was (or would be) edited. */
  packageJson: string;
  /** Packages added to `package.json`, with their version/catalog reference. */
  added: Record<string, string>;
  /** The package-manager catalog file edited, if any. */
  catalogFile?: string;
  /** Packages added to the catalog, with their resolved version. */
  catalogAdded?: Record<string, string>;
  /** Whether anything would change (false when everything was already declared). */
  changed: boolean;
}

export interface EnsureToolingDependenciesOptions {
  /** The project directory the tools were detected for. */
  cwd: string;
  /** The repository/workspace root (default: discovered from `cwd`). */
  root?: string;
  /** The formatter/linter the consumer ends up using. */
  selection: ToolingSelection;
  /** Version overrides (`package -> range`); defaults to the latest stable pins. */
  versions?: Record<string, string>;
  /**
   * Where the dependencies go. `auto` (default) uses the root package.json
   * unless the root does not declare the same tools, in which case the
   * project's own package.json is used.
   */
  scope?: 'auto' | 'root' | 'project';
  /** Report the changes without writing anything. */
  dryRun?: boolean;
}

/**
 * Add the dependencies for the selected tools to the root/project
 * `package.json`, respecting the package manager's catalog strategy. A tool
 * already satisfied by any of its packages (eg. `vite-plus` for Oxc) is left
 * untouched, and an existing pin always wins over the default version.
 */
export function ensureToolingDependencies(
  options: EnsureToolingDependenciesOptions
): EnsureToolingDependenciesResult {
  const cwd = path.resolve(options.cwd);
  const root = path.resolve(options.root ?? findWorkspaceRoot(cwd));
  const versions = { ...DEFAULT_TOOLING_VERSIONS, ...options.versions };

  // Only add a package when its tool is not already satisfied by any
  // candidate (a workspace that inherits `vite-plus` needs no Oxc packages).
  const missing: Record<string, string> = {};
  for (const kind of ['fmt', 'lint'] as const) {
    const tool = options.selection[kind];
    if (!tool) continue;
    if (findToolingDependency(cwd, kind, tool, root).declared) continue;
    const packageName = dependencyCandidates(kind, tool)[0];
    const version = packageName ? versions[packageName] : undefined;
    if (packageName && version) missing[packageName] = version;
  }

  const rootPkg = readPackageJson(root, root);
  const projectPkg = cwd === root ? undefined : readPackageJson(cwd, root);
  const useProject =
    options.scope === 'project' ||
    (options.scope !== 'root' && cwd !== root && projectPkg !== undefined);
  const target = useProject ? (projectPkg ?? rootPkg) : rootPkg;
  if (!target) {
    throw new Error(
      `No package.json found for ${useProject ? cwd : root}; cannot add the formatter/linter dependencies.`
    );
  }
  const scope: 'root' | 'project' = useProject ? 'project' : 'root';
  const packageJson = path.join(target.dir, 'package.json');
  if (Object.keys(missing).length === 0) {
    return { scope, packageJson, added: {}, changed: false };
  }

  const pm = packageManagerAt(target.dir);
  const hasCatalog = catalogAt(root, pm) !== undefined;
  const added: Record<string, string> = {};
  const catalogEntries: Record<string, string> = {};
  for (const [name, version] of Object.entries(missing)) {
    if (hasCatalog) {
      added[name] = 'catalog:';
      catalogEntries[name] = version;
    } else {
      added[name] = version;
    }
  }

  const result: EnsureToolingDependenciesResult = {
    scope,
    packageJson,
    added,
    changed: true,
    ...(hasCatalog && pm !== 'bun' && catalogFile(root, pm)
      ? { catalogFile: catalogFile(root, pm)! }
      : {}),
    ...(Object.keys(catalogEntries).length > 0 ? { catalogAdded: catalogEntries } : {}),
  };
  if (options.dryRun) return result;

  // Write the catalog first, so a `catalog:` reference never dangles.
  if (hasCatalog && Object.keys(catalogEntries).length > 0) {
    if (pm === 'bun') {
      const rootPackageJson = path.join(root, 'package.json');
      fs.writeFileSync(
        rootPackageJson,
        mergeJsonAt(root, 'package.json', {
          workspaces: { catalog: catalogEntries },
        }),
        'utf-8'
      );
    } else {
      const file = catalogFile(root, pm)!;
      const content = fs.readFileSync(file, 'utf-8');
      fs.writeFileSync(file, addYamlCatalogEntries(content, catalogEntries), 'utf-8');
    }
  }

  fs.writeFileSync(
    packageJson,
    mergeJsonAt(target.dir, 'package.json', { devDependencies: added }),
    'utf-8'
  );
  return result;
}

export interface ToolingDependencyLocation {
  declared: boolean;
  dir?: string;
  pkg?: PackageJson;
}

/** Whether a tool is declared by any package.json from `cwd` up to `root`. */
export function findToolingDependency(
  cwd: string,
  kind: 'fmt' | 'lint',
  tool: ToolingTool,
  root: string = findWorkspaceRoot(cwd)
): ToolingDependencyLocation {
  let dir = path.resolve(cwd);
  const boundary = path.resolve(root);
  for (;;) {
    const pkg = readJsonAt<PackageJson>(dir, 'package.json');
    const candidates = dependencyCandidates(kind, tool);
    if (pkg && candidates.some(name => declaredDependencies(pkg).has(name))) {
      return { declared: true, dir, pkg };
    }
    if (dir === boundary) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { declared: false };
}

/** The packages that satisfy a formatter/linter tool. */
export function toolingPackages(kind: 'fmt' | 'lint', tool: ToolingTool): readonly string[] {
  return dependencyCandidates(kind, tool);
}

/**
 * Throw a clear error when the project declares no dependency for the active
 * tool. Used by `dbx fmt` / `dbx lint` before spawning anything so a missing
 * formatter is an actionable error instead of an implicit `npx` download.
 */
export function assertToolingDependency(
  cwd: string,
  kind: 'fmt' | 'lint',
  tool: ToolingTool
): ToolingDependencyLocation {
  const found = findToolingDependency(cwd, kind, tool);
  if (found.declared) return found;
  const packages = toolingPackages(kind, tool);
  const label = kind === 'fmt' ? 'formatter' : 'linter';
  throw new Error(
    `No ${label} dependency found for ${kind} (${tool}). Add one of: ${packages.join(', ')}, ` +
      'or change the tool in the dbx config / VS Code settings.'
  );
}
