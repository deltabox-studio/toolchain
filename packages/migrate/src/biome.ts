/**
 * Biome -> Oxfmt/Oxlint migration.
 *
 * Unlike `oxfmt --migrate biome` (which only maps formatter options), this also
 * maps `files.includes` negations and — crucially — Biome's
 * `assist…organizeImports.groups` to Oxfmt's `sortImports`, plus a curated
 * Biome-rule -> Oxlint-rule map. It writes `.oxfmtrc.json` + `.oxlintrc.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

import { mapBiomeToOxfmt } from './oxfmt-map.js';
import { mapBiomeToOxlint } from './oxlint-map.js';
import type {
    MigrationContext,
    MigrationFile,
    MigrationResult,
    ToolingMigration,
} from './types.js';
import { renderViteTarget } from './vite-target.js';

/** The Biome config file names, in priority order. */
export const BIOME_CONFIG_FILES = ['biome.json', 'biome.jsonc'] as const;

/** The Biome config path in `cwd`, if present. */
export function findBiomeConfig(cwd: string): string | undefined {
    for (const name of BIOME_CONFIG_FILES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

/**
 * Strip JSONC comments + trailing commas. String-aware, so glob patterns such as
 * `**\/*\/dist` (which contain `/*`) are never mistaken for comments.
 */
export function stripJsonc(input: string): string {
    let out = '';
    let inString = false;
    let quote = '';
    for (let i = 0; i < input.length; i++) {
        const ch = input[i] as string;
        if (inString) {
            out += ch;
            if (ch === '\\') {
                out += input[i + 1] ?? '';
                i++;
            } else if (ch === quote) {
                inString = false;
            }
            continue;
        }
        if (ch === '"' || ch === "'") {
            inString = true;
            quote = ch;
            out += ch;
            continue;
        }
        if (ch === '/' && input[i + 1] === '/') {
            while (i < input.length && input[i] !== '\n') i++;
            continue;
        }
        if (ch === '/' && input[i + 1] === '*') {
            i += 2;
            while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++;
            i++;
            continue;
        }
        out += ch;
    }
    return out.replace(/,(\s*[}\]])/g, '$1');
}

/** Read and parse a JSON/JSONC file (BOM-tolerant). */
export function readJsonc(file: string): Record<string, any> {
    const text = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    return JSON.parse(stripJsonc(text)) as Record<string, any>;
}

/** Build the Biome -> ox migration. */
export const biomeToOx: ToolingMigration = {
    id: 'biome-to-ox',
    from: 'biome',
    to: 'ox',
    description: 'Migrate Biome (formatter + organizeImports + linter) to Oxfmt/Oxlint.',
    detect: cwd => Boolean(findBiomeConfig(cwd)),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const file = findBiomeConfig(ctx.cwd);
        if (!file) throw new Error('biome-to-ox: no biome.json/biome.jsonc found.');
        const biome = readJsonc(file);

        const fmt = mapBiomeToOxfmt(biome);
        const lint = mapBiomeToOxlint(biome, (fmt.oxfmt.ignorePatterns as string[]) ?? []);

        const unmapped = [...fmt.unmapped, ...lint.unmapped];
        const baseNotes = [
            `Source: ${path.basename(file)}.`,
            'Formatter + organizeImports + linter rules mapped.',
        ];

        if ((ctx.target ?? 'files') === 'vite') {
            const file = renderViteTarget(ctx.cwd, { fmt: fmt.oxfmt, lint: lint.oxlint });
            if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');
            return {
                id: biomeToOx.id,
                from: 'biome',
                to: 'ox',
                written: [file.path],
                files: [file],
                oxfmt: fmt.oxfmt,
                oxlint: lint.oxlint,
                unmapped,
                notes: [...baseNotes, 'Folded into vite.config.ts (`fmt` + `lint`).'],
            };
        }

        const outputs: [string, unknown][] = [
            ['.oxfmtrc.json', fmt.oxfmt],
            ['.oxlintrc.json', lint.oxlint],
        ];
        const files: MigrationFile[] = outputs.map(([name, body]) => ({
            path: path.join(ctx.cwd, name),
            content: `${JSON.stringify(body, null, 4)}\n`,
        }));
        if (ctx.write) for (const f of files) fs.writeFileSync(f.path, f.content, 'utf-8');

        return {
            id: biomeToOx.id,
            from: 'biome',
            to: 'ox',
            written: files.map(f => f.path),
            files,
            oxfmt: fmt.oxfmt,
            oxlint: lint.oxlint,
            unmapped,
            notes: [
                ...baseNotes,
                'Next: run `oxfmt` to reformat, then drop Biome.',
                'Tip: `--target vite` folds this into vite.config.ts instead.',
            ],
        };
    },
};
