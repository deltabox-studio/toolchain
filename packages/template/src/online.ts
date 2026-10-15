import path from 'node:path';

import type { ToolingTemplateSource } from '@deltabox/toolchain-shared';

import type { Template } from './types.js';

const REGISTRY = 'https://registry.npmjs.org';

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
function parseNpmTemplates(pkg: string, raw: unknown): Template[] {
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
            source: { type: 'npm', locate: pkg, subdir: name, online: true },
            online: true,
            ...(tags ? { tags } : {}),
        });
    }
    return out;
}

/** List the templates an npm `@scope/create` package publishes. */
export async function loadNpmTemplates(pkg: string): Promise<Template[]> {
    const pkgName = pkg.replace(/^npm:/, '');
    try {
        const response = await fetch(`${REGISTRY}/${encodeURIComponent(pkgName)}/latest`, {
            headers: { accept: 'application/json' },
        });
        if (!response.ok) return [];
        const manifest = (await response.json()) as NpmManifest;
        const raw =
            manifest.createConfig?.templates ?? manifest.dbx?.templates ?? manifest.dbxTemplates;
        return parseNpmTemplates(pkgName, raw);
    } catch {
        return [];
    }
}

/** A single template backed by a git repository. */
export function gitTemplate(source: ToolingTemplateSource): Template {
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
 * `npm:@acme/create`) or an inferred source (a path that exists -> local, an
 * `@scope/name` -> npm, a URL/scp -> git).
 */
export function parseSourceSpec(spec: string, cwd: string = process.cwd()): ToolingTemplateSource {
    const match = spec.match(/^(builtin|local|npm|git|vite-plus):(.+)$/i);
    if (match?.[1] && match[2]) {
        return { type: match[1].toLowerCase() as ToolingTemplateSource['type'], locate: match[2] };
    }
    if (/^(https?:|git@|git:\/\/|ssh:\/\/)/.test(spec) || spec.endsWith('.git')) {
        return { type: 'git', locate: spec, online: true };
    }
    if (/^@[^/]+\/[^/]+$/.test(spec)) {
        return { type: 'npm', locate: spec, online: true };
    }
    return { type: 'local', locate: path.resolve(cwd, spec) };
}
