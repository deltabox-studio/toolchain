/**
 * Prettier -> Oxfmt migration.
 *
 * Oxfmt is Prettier-compatible, so most options transfer directly. This reads
 * `.prettierrc*`, `prettier.config.*` (JSON) and the `prettier` package.json
 * field, maps the options, folds `.prettierignore` into `ignorePatterns`, and
 * detects the Tailwind/PackageJson plugins.
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

const PRETTIER_FILES = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.jsonc',
    'prettier.config.json',
] as const;

/** Prettier option -> Oxfmt option (same name, same behaviour). */
const OPTION_MAP = [
    'printWidth',
    'tabWidth',
    'useTabs',
    'semi',
    'singleQuote',
    'jsxSingleQuote',
    'quoteProps',
    'trailingComma',
    'bracketSpacing',
    'bracketSameLine',
    'arrowParens',
    'endOfLine',
    'singleAttributePerLine',
    'htmlWhitespaceSensitivity',
    'vueIndentScriptAndStyle',
] as const;

/** Locate a Prettier config (JSON files or the `prettier` package.json field). */
export function findPrettierConfig(cwd: string): { file: string; config: Json } | undefined {
    for (const name of PRETTIER_FILES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
            try {
                return { file, config: JSON.parse(raw) as Json };
            } catch {
                // fall through
            }
        }
    }
    const pkgFile = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgFile)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8')) as Json;
            if (pkg.prettier && typeof pkg.prettier === 'object')
                return { file: pkgFile, config: pkg.prettier as Json };
        } catch {
            // ignore
        }
    }
    return undefined;
}

/** `.prettierignore` globs. */
export function readPrettierIgnore(cwd: string): string[] {
    const file = path.join(cwd, '.prettierignore');
    if (!fs.existsSync(file)) return [];
    return fs
        .readFileSync(file, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
}

/** Map a Prettier config to Oxfmt options. */
export function mapPrettierToOxfmt(prettier: Json): { oxfmt: Json; unmapped: string[] } {
    const oxfmt: Json = {};
    const unmapped: string[] = [];
    for (const key of OPTION_MAP) {
        if (key in prettier) oxfmt[key] = prettier[key];
    }
    const plugins: string[] = Array.isArray(prettier.plugins) ? prettier.plugins : [];
    for (const plugin of plugins) {
        if (plugin.includes('tailwindcss')) oxfmt.sortTailwindcss = true;
        else if (plugin.includes('packagejson')) oxfmt.sortPackageJson = true;
        else unmapped.push(`plugin: ${plugin}`);
    }
    for (const key of Object.keys(prettier)) {
        if (
            !(OPTION_MAP as readonly string[]).includes(key) &&
            key !== 'plugins' &&
            key !== 'overrides'
        )
            unmapped.push(`option: ${key}`);
        if (key === 'overrides')
            unmapped.push('option: overrides (convert to Oxfmt `overrides` manually)');
    }
    return { oxfmt, unmapped };
}

export const prettierToOx: ToolingMigration = {
    id: 'prettier-to-ox',
    from: 'prettier',
    to: 'oxfmt',
    description: 'Migrate a Prettier config to Oxfmt (.oxfmtrc.json).',
    detect: cwd => Boolean(findPrettierConfig(cwd)),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const found = findPrettierConfig(ctx.cwd);
        if (!found) throw new Error('prettier-to-ox: no Prettier config found.');
        const mapped = mapPrettierToOxfmt(found.config);
        const ignore = readPrettierIgnore(ctx.cwd);
        if (ignore.length) mapped.oxfmt.ignorePatterns = ignore;

        const unmapped = mapped.unmapped.map(source => ({
            source,
            reason: 'no Oxfmt equivalent',
        }));

        if ((ctx.target ?? 'files') === 'vite') {
            const file = renderViteTarget(ctx.cwd, { fmt: mapped.oxfmt });
            if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');
            return {
                id: prettierToOx.id,
                from: 'prettier',
                to: 'oxfmt',
                written: [file.path],
                files: [file],
                oxfmt: mapped.oxfmt,
                unmapped,
                notes: [
                    `Source: ${path.basename(found.file)}.`,
                    'Folded into vite.config.ts (`fmt`).',
                ],
            };
        }

        const file: MigrationFile = {
            path: path.join(ctx.cwd, '.oxfmtrc.json'),
            content: `${JSON.stringify(mapped.oxfmt, null, 4)}\n`,
        };
        if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');

        return {
            id: prettierToOx.id,
            from: 'prettier',
            to: 'oxfmt',
            written: [file.path],
            files: [file],
            oxfmt: mapped.oxfmt,
            unmapped,
            notes: [`Source: ${path.basename(found.file)}.`],
        };
    },
};
