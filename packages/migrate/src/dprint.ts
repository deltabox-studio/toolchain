/**
 * Dprint -> Oxfmt migration.
 *
 * Dprint keeps a single `dprint.json` with global + per-language sections. The
 * global/layout options and the TypeScript section map onto Oxfmt; language
 * sections Oxfmt does not share (eg. `markdown`, `toml`) are reported as
 * unmapped. Dprint plugins are noted (Oxfmt has built-in equivalents for the
 * common cases).
 */

import fs from 'node:fs';
import path from 'node:path';

import type {
    MigrationContext,
    MigrationFile,
    MigrationResult,
    ToolingMigration,
} from './types.js';
import { renderViteTarget } from './vite-target.js';

type Json = Record<string, any>;

const DPRINT_FILES = ['dprint.json', 'dprint.jsonc', '.dprint.json'] as const;

/** Locate a dprint config. */
export function findDprintConfig(cwd: string): { file: string; config: Json } | undefined {
    for (const name of DPRINT_FILES) {
        const file = path.join(cwd, name);
        if (!fs.existsSync(file)) continue;
        const raw = fs
            .readFileSync(file, 'utf-8')
            .replace(/^\uFEFF/, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(^|[^:])\/\/.*$/gm, '$1')
            .replace(/,(\s*[}\]])/g, '$1');
        try {
            return { file, config: JSON.parse(raw) as Json };
        } catch {
            // fall through to the next candidate
        }
    }
    return undefined;
}

/** Map a dprint config to Oxfmt options. */
export function mapDprintToOxfmt(dprint: Json): { oxfmt: Json; unmapped: string[] } {
    const oxfmt: Json = {};
    const ts = dprint.typescript ?? {};

    if (typeof dprint.lineWidth === 'number') oxfmt.printWidth = dprint.lineWidth;
    if (typeof dprint.indentWidth === 'number') oxfmt.tabWidth = dprint.indentWidth;
    if (typeof dprint.useTabs === 'boolean') oxfmt.useTabs = dprint.useTabs;
    if (dprint.newLineKind === 'lf' || dprint.newLineKind === 'crlf')
        oxfmt.endOfLine = dprint.newLineKind;

    if (ts.quoteStyle)
        oxfmt.singleQuote =
            String(ts.quoteStyle).includes('Single') || ts.quoteStyle === 'alwaysSingle';
    if (ts.semiColons) oxfmt.semi = ts.semiColons !== 'asi';
    if (ts.trailingCommas) {
        oxfmt.trailingComma =
            ts.trailingCommas === 'always' ? 'all' : ts.trailingCommas === 'never' ? 'none' : 'es5';
    }

    const unmapped: string[] = [];
    const known = ['lineWidth', 'indentWidth', 'useTabs', 'newLineKind', 'typescript', 'plugins'];
    for (const key of Object.keys(dprint)) {
        if (!known.includes(key)) unmapped.push(`dprint section: ${key}`);
    }
    if (Array.isArray(dprint.plugins) && dprint.plugins.length)
        unmapped.push('plugins (Oxfmt has built-in equivalents for common cases)');
    return { oxfmt, unmapped };
}

export const dprintToOx: ToolingMigration = {
    id: 'dprint-to-ox',
    from: 'dprint',
    to: 'oxfmt',
    description: 'Migrate a dprint.json (formatter) to Oxfmt.',
    detect: cwd => Boolean(findDprintConfig(cwd)),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const found = findDprintConfig(ctx.cwd);
        if (!found) throw new Error('dprint-to-ox: no dprint.json found.');
        const mapped = mapDprintToOxfmt(found.config);
        const unmapped = mapped.unmapped.map(source => ({ source, reason: 'no Oxfmt equivalent' }));
        const notes = [`Source: ${path.basename(found.file)}.`];

        if ((ctx.target ?? 'files') === 'vite') {
            const file = renderViteTarget(ctx.cwd, { fmt: mapped.oxfmt });
            if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');
            return {
                id: 'dprint-to-ox',
                from: 'dprint',
                to: 'oxfmt',
                written: [file.path],
                files: [file],
                oxfmt: mapped.oxfmt,
                unmapped,
                notes: [...notes, 'Folded into vite.config.ts (`fmt`).'],
            };
        }

        const file: MigrationFile = {
            path: path.join(ctx.cwd, '.oxfmtrc.json'),
            content: `${JSON.stringify(mapped.oxfmt, null, 4)}\n`,
        };
        if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');
        return {
            id: 'dprint-to-ox',
            from: 'dprint',
            to: 'oxfmt',
            written: [file.path],
            files: [file],
            oxfmt: mapped.oxfmt,
            unmapped,
            notes,
        };
    },
};
