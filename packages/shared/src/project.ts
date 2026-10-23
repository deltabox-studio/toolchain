/**
 * The `dbx.config.project` ↔ `package.json` bridge.
 *
 * `project` is the canonical place to declare a package's identity/metadata:
 * `dbx sync` writes the fields it defines into `package.json`, workspaces inherit
 * them from the root config, and when a field is omitted the project's own
 * `package.json` value is used instead. The same metadata feeds the
 * `{{ token }}` replacements every template understands.
 */

import type { ToolchainProjectConfig } from './config-types.js';
import type { PackageJson } from './types.js';

/** Split a package name into its unscoped name + scope (`@acme/app` -> `app`/`@acme`). */
export function splitPackageName(pkgName: string | undefined): {
    name?: string;
    scope?: string;
} {
    if (!pkgName) return {};
    const match = pkgName.match(/^(@[^/]+)\/(.+)$/);
    if (match?.[1] && match[2]) return { name: match[2], scope: match[1] };
    return { name: pkgName };
}

/** Normalize a `package.json` `author` (string or `{ name, email, url }`) to a string. */
function authorString(author: PackageJson['author']): string | undefined {
    if (typeof author === 'string') return author || undefined;
    if (author && typeof author === 'object') {
        const value = author as { name?: string; email?: string; url?: string };
        if (!value.name) return undefined;
        const email = value.email ? ` <${value.email}>` : '';
        const url = value.url ? ` (${value.url})` : '';
        return `${value.name}${email}${url}`;
    }
    return undefined;
}

/** Normalize a `package.json` `repository` (string or `{ url }`) to a clean URL. */
function repositoryUrl(repository: PackageJson['repository']): string | undefined {
    const url =
        typeof repository === 'string'
            ? repository
            : repository && typeof repository === 'object'
              ? (repository as { url?: string }).url
              : undefined;
    if (!url) return undefined;
    return url.replace(/^git\+/, '').replace(/\.git$/, '');
}

/** Normalize a repo URL to the npm-conventional full git form (`git+https://...git`). */
function gitUrl(url: string): string {
    if (url.startsWith('git+') || url.startsWith('git@')) return url;
    if (/^https?:\/\//.test(url) && !url.endsWith('.git')) return `git+${url}.git`;
    return url;
}

/** Split a `package.json` `packageManager` (`yarn@4.17.1`) into name + version. */
function packageManagerParts(value: unknown): { name?: string; version?: string } {
    if (typeof value !== 'string' || !value) return {};
    const match = value.match(/^(@?[^@]+)@(.+)$/);
    if (match?.[1] && match[2]) return { name: match[1], version: match[2] };
    return { name: value };
}

/** Strip a leading range operator from an `engines.node` value (`>=22.5.0` -> `22.5.0`). */
function nodeVersionFromEngines(node: unknown): string | undefined {
    if (typeof node !== 'string' || !node) return undefined;
    return node.replace(/^[^\d]*/, '').trim() || undefined;
}

/**
 * Derive the project metadata from a `package.json`. Used as the fallback when a
 * `dbx.config.project` field is not defined (and to seed a generated config).
 */
export function projectFromPackageJson(pkg: PackageJson): ToolchainProjectConfig {
    const { name, scope } = splitPackageName(pkg.name);
    const pm = packageManagerParts(pkg.packageManager);
    const engines = (pkg.engines ?? {}) as { node?: unknown };
    const description = typeof pkg.description === 'string' ? pkg.description : undefined;
    const author = authorString(pkg.author);
    const license = typeof pkg.license === 'string' ? pkg.license : undefined;
    const homepage = typeof pkg.homepage === 'string' ? pkg.homepage : undefined;
    const repo = repositoryUrl(pkg.repository);
    const nodeVersion = nodeVersionFromEngines(engines.node);
    return {
        ...(name ? { name } : {}),
        ...(scope ? { scope } : {}),
        ...(description ? { description } : {}),
        ...(author ? { author } : {}),
        ...(license ? { license } : {}),
        ...(homepage ? { homepage } : {}),
        ...(repo ? { repo } : {}),
        ...(nodeVersion ? { nodeVersion } : {}),
        ...(pm.name ? { packageManager: pm.name } : {}),
        ...(pm.version ? { packageManagerVersion: pm.version } : {}),
    };
}

/**
 * Map the fields a `dbx.config.project` **defines** onto `package.json` fields.
 * Only the defined fields are returned, so a sync never clears a field the
 * config does not mention. `directory` (a workspace path relative to the repo
 * root) is written as `repository.directory`.
 */
export function projectToPackageJson(
    project: ToolchainProjectConfig,
    options: { directory?: string } = {}
): Partial<PackageJson> {
    const out: Partial<PackageJson> = {};
    if (project.name) out.name = project.scope ? `${project.scope}/${project.name}` : project.name;
    if (project.description !== undefined) out.description = project.description;
    if (project.author !== undefined) out.author = project.author;
    if (project.license !== undefined) out.license = project.license;
    if (project.homepage !== undefined) out.homepage = project.homepage;
    if (project.repo !== undefined) {
        out.repository = {
            type: 'git',
            url: gitUrl(project.repo),
            ...(options.directory ? { directory: options.directory } : {}),
        };
    }
    if (project.packageManager !== undefined) {
        out.packageManager = project.packageManagerVersion
            ? `${project.packageManager}@${project.packageManagerVersion}`
            : project.packageManager;
    }
    return out;
}
