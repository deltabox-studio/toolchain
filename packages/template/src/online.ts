import fs from 'node:fs';
import path from 'node:path';

import type { ToolchainTemplateSource } from '@deltabox/toolchain-shared';

import type { Template } from './types.js';

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

/** Read a simple `key=value` / `key: value` setting from a config file. */
function readConfigValue(file: string, key: string): string | undefined {
    try {
        const text = fs.readFileSync(file, 'utf-8');
        const pattern = new RegExp(`^\\s*${key}\\s*[:=]\\s*["']?([^"'\\s#]+)["']?`, 'm');
        return pattern.exec(text)?.[1]?.replace(/\/+$/, '');
    } catch {
        return undefined;
    }
}

/**
 * Detect the project's npm registry: Yarn's `npmRegistryServer`, then `.npmrc`
 * `registry` (npm/pnpm), then the public npm registry.
 */
export function detectNpmRegistry(cwd: string = process.cwd()): string {
    const yarn = readConfigValue(path.join(cwd, '.yarnrc.yml'), 'npmRegistryServer');
    if (yarn) return yarn;
    const npmrc = readConfigValue(path.join(cwd, '.npmrc'), 'registry');
    if (npmrc) return npmrc;
    return DEFAULT_REGISTRY;
}

interface NpmManifest {
    name?: string;
    createConfig?: { templates?: unknown };
    dbx?: { templates?: unknown };
    dbxTemplates?: unknown;
}

function asStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const out = value.map(String).filter(Boolean);
    return out.length ? out : undefined;
}

/** Turn an npm `createConfig.templates` / `dbx.templates` manifest into templates. */
function parseNpmTemplates(pkg: string, raw: unknown, registry: string): Template[] {
    if (!Array.isArray(raw)) return [];
    const out: Template[] = [];
    for (const entry of raw) {
        const record =
            typeof entry === 'string'
                ? { name: entry }
                : entry && typeof entry === 'object'
                  ? (entry as Record<string, unknown>)
                  : undefined;
        if (!record) continue;
        const name = String(record.name ?? record.template ?? 'template');
        const label = String(record.label ?? name);
        const description = typeof record.description === 'string' ? record.description : undefined;
        const tags = asStringArray(record.tags);
        out.push({
            id: `${pkg}/${name}`,
            name: label,
            ...(description ? { description } : {}),
            kind: 'project',
            source: {
                type: 'npm',
                locate: pkg,
                subdir: name,
                ...(registry !== DEFAULT_REGISTRY ? { registry } : {}),
                online: true,
            },
            online: true,
            ...(tags ? { tags } : {}),
        });
    }
    return out;
}

/**
 * List the templates an npm create package publishes. Scoped (`@scope/create`)
 * and unscoped (`create-acme`, `acme-create`) packages are supported; the
 * registry defaults to the project package manager's registry.
 */
export async function loadNpmTemplates(
    pkg: string,
    registry: string = DEFAULT_REGISTRY
): Promise<Template[]> {
    const pkgName = pkg.replace(/^npm:/, '');
    const base = registry.replace(/\/+$/, '');
    try {
        const response = await fetch(
            `${base}/${encodeURIComponent(pkgName).replace(/^%40/, '@')}/latest`,
            { headers: { accept: 'application/json' } }
        );
        if (!response.ok) return [];
        const manifest = (await response.json()) as NpmManifest;
        const raw =
            manifest.createConfig?.templates ?? manifest.dbx?.templates ?? manifest.dbxTemplates;
        return parseNpmTemplates(pkgName, raw, base);
    } catch {
        return [];
    }
}

/** A single template backed by a git repository. */
export function gitTemplate(source: ToolchainTemplateSource): Template {
    const base =
        source.locate
            .replace(/\.git$/, '')
            .split(/[/:]/)
            .filter(Boolean)
            .pop() ?? 'template';
    return {
        id: source.id ?? `git:${base}`,
        name: source.name ?? base,
        ...(source.description ? { description: source.description } : {}),
        kind: source.kind ?? 'project',
        source,
        ...(source.tags ? { tags: source.tags } : {}),
        online: true,
    };
}

/**
 * Parse a `template:add` spec: `type:locate` (eg. `local:./tpl`, `git:https://…`,
 * `npm:@acme/create`, `npm:create-acme`) or an inferred source (a path that
 * exists -> local, a scoped/create-* package -> npm, a URL/scp -> git).
 */
export function parseSourceSpec(
    spec: string,
    cwd: string = process.cwd()
): ToolchainTemplateSource {
    const match = spec.match(/^(builtin|local|npm|git|vite-plus|remote):(.+)$/i);
    if (match?.[1] && match[2]) {
        const type = match[1].toLowerCase() as ToolchainTemplateSource['type'];
        return { type, locate: match[2], ...(type === 'local' ? {} : { online: true }) };
    }
    if (/^(https?:|git@|git:\/\/|ssh:\/\/)/.test(spec) || spec.endsWith('.git')) {
        return { type: 'git', locate: spec, online: true };
    }
    if (/^@[^/]+\/[^/]+$/.test(spec) || /^(?:create-[a-z0-9-]+|[a-z0-9-]+-create)$/i.test(spec)) {
        return { type: 'npm', locate: spec, online: true };
    }
    return { type: 'local', locate: path.resolve(cwd, spec) };
}
