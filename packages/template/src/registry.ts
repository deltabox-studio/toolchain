import fs from 'node:fs';
import path from 'node:path';

import {
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type ToolchainTemplateSource,
} from '@deltabox/toolchain-shared';

import { BUILTIN_TEMPLATES } from './builtin.js';
import { loadGlobalTemplates } from './global.js';
import { loadLocalTemplates } from './local.js';
import { gitTemplate, loadNpmTemplates } from './online.js';
import type { Template } from './types.js';

/** Where `template:add` records sources, relative to a project root. */
export const REGISTRY_DIR = '.dbx/toolchain';
export const REGISTRY_FILE = 'templates.json';

/** The on-disk registry of template sources. */
export interface TemplateRegistry {
    sources: ToolchainTemplateSource[];
}

/** Read `<cwd>/.dbx/toolchain/templates.json` (empty when missing/invalid). */
export function readTemplateRegistry(cwd: string): TemplateRegistry {
    const file = path.join(cwd, REGISTRY_DIR, REGISTRY_FILE);
    try {
        const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw) as Partial<TemplateRegistry>;
        return { sources: Array.isArray(parsed.sources) ? parsed.sources : [] };
    } catch {
        return { sources: [] };
    }
}

/** Write `<cwd>/.dbx/toolchain/templates.json`. */
export function writeTemplateRegistry(cwd: string, sources: ToolchainTemplateSource[]): void {
    const file = path.join(cwd, REGISTRY_DIR, REGISTRY_FILE);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ sources }, null, 4)}\n`, 'utf-8');
}

/** Append a source to the registry, deduplicating on `type:locate`. */
export function addTemplateSource(cwd: string, source: ToolchainTemplateSource): TemplateRegistry {
    const registry = readTemplateRegistry(cwd);
    const key = (s: ToolchainTemplateSource): string => `${s.type}:${s.locate}`;
    const sources = registry.sources.filter(existing => key(existing) !== key(source));
    sources.push(source);
    writeTemplateRegistry(cwd, sources);
    return { sources };
}

/**
 * Remove a source from the registry by `type:locate` (or by id). Returns the
 * updated registry and how many sources were removed.
 */
export function removeTemplateSource(
    cwd: string,
    match: string
): { registry: TemplateRegistry; removed: number } {
    const registry = readTemplateRegistry(cwd);
    const keep = registry.sources.filter(
        source => source.id !== match && `${source.type}:${source.locate}` !== match
    );
    const removed = registry.sources.length - keep.length;
    if (removed > 0) writeTemplateRegistry(cwd, keep);
    return { registry: { sources: keep }, removed };
}

export interface LoadTemplatesOptions {
    /** Project root. */
    cwd: string;
    /** The loaded tooling config (its `templates.sources` are included). */
    config?: ToolchainConfig;
    /** Resolve online sources (`npm`/`git`). Default: false. */
    online?: boolean;
    /** Include the builtin templates (default: true). */
    builtin?: boolean;
    /** Extra sources on top of the config + registry. */
    sources?: ToolchainTemplateSource[];
}

/** Every source considered: builtin + config `templates.sources` + registry + extras. */
export function collectSources(options: LoadTemplatesOptions): ToolchainTemplateSource[] {
    const configSources =
        options.config && sectionEnabled(options.config.templates)
            ? (sectionConfig(options.config.templates)?.sources ?? [])
            : [];
    return [
        ...configSources,
        ...readTemplateRegistry(options.cwd).sources,
        ...(options.sources ?? []),
    ];
}

/**
 * Resolve every template: builtin, local directories (offline, always), and —
 * when `online` — npm `@scope/create` manifests + git repositories.
 */
export async function loadTemplates(options: LoadTemplatesOptions): Promise<Template[]> {
    const seen = new Set<string>();
    const out: Template[] = [];
    const add = (template: Template): void => {
        if (seen.has(template.id)) return;
        seen.add(template.id);
        out.push(template);
    };

    if (options.builtin !== false) for (const template of BUILTIN_TEMPLATES) add(template);

    // Global templates/sources: local search paths (default
    // `~/.dbx/toolchain/.registry/templates`) plus remote registry URLs. The
    // project's own sources are loaded first, so a local template wins on an id
    // clash.
    const global = await loadGlobalTemplates(options.cwd);
    const sources = [...collectSources(options), ...global.sources];

    for (const source of sources) {
        switch (source.type) {
            case 'builtin': {
                const builtin = BUILTIN_TEMPLATES.find(candidate => candidate.id === source.locate);
                if (builtin) add(source.id ? { ...builtin, id: source.id } : builtin);
                break;
            }
            case 'local': {
                for (const template of loadLocalTemplates(source.locate, source.id)) add(template);
                break;
            }
            case 'git': {
                add(gitTemplate(source));
                break;
            }
            case 'npm': {
                if (options.online) {
                    for (const template of await loadNpmTemplates(source.locate)) add(template);
                }
                break;
            }
            case 'vite-plus': {
                add({
                    id: source.id ?? 'vite-plus',
                    name: source.name ?? 'Vite+ app',
                    ...(source.description ? { description: source.description } : {}),
                    kind: source.kind ?? 'project',
                    source,
                    ...(source.tags ? { tags: source.tags } : {}),
                    online: true,
                });
                break;
            }
        }
    }

    for (const template of global.templates) add(template);
    return out;
}
