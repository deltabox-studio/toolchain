import type { Dirent } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import type { Template, TemplateManifest } from './types.js';

/** The manifest file that marks a directory as a local template. */
export const TEMPLATE_MANIFEST = 'template.json';

function readJson<T>(file: string): T | undefined {
    try {
        // Strip a UTF-8 BOM: PowerShell-generated JSON files often carry one.
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')) as T;
    } catch {
        return undefined;
    }
}

/** Whether `dir` holds a `template.json`. */
export function isTemplateDir(dir: string): boolean {
    return fs.existsSync(path.join(dir, TEMPLATE_MANIFEST));
}

/** Read a `template.json` from a remembered path (for scaffolding). */
export function readTemplateManifest(dir: string): TemplateManifest | undefined {
    return readJson<TemplateManifest>(path.join(dir, TEMPLATE_MANIFEST));
}

/** Write a `template.json` into `dir` (used by `template:init`). */
export function writeTemplateManifest(dir: string, manifest: TemplateManifest): string {
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, TEMPLATE_MANIFEST);
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 4)}\n`, 'utf-8');
    return file;
}

/** Read a local template directory into a {@link Template}. */
export function readTemplateDir(dir: string, id?: string): Template | undefined {
    const manifest = readTemplateManifest(dir);
    if (!manifest) return undefined;
    const name = manifest.name ?? path.basename(dir);
    return {
        id: id ?? path.basename(dir),
        name,
        ...(manifest.description ? { description: manifest.description } : {}),
        kind: manifest.kind ?? 'project',
        source: { type: 'local', locate: dir },
        ...(manifest.tags ? { tags: manifest.tags } : {}),
        dir,
        ...(manifest.variables ? { variables: manifest.variables } : {}),
        ...(manifest.tokens ? { tokens: manifest.tokens } : {}),
    };
}

/**
 * Load the local templates in `root`: the root itself when it is a template,
 * plus every immediate subdirectory holding a `template.json`.
 */
export function loadLocalTemplates(root: string, idPrefix?: string): Template[] {
    const out: Template[] = [];
    if (isTemplateDir(root)) {
        const template = readTemplateDir(root, idPrefix);
        if (template) out.push(template);
    }
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const dir = path.join(root, entry.name);
        if (!isTemplateDir(dir)) continue;
        const template = readTemplateDir(dir, idPrefix ? `${idPrefix}/${entry.name}` : entry.name);
        if (template) out.push(template);
    }
    return out;
}
