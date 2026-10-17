/**
 * ESLint -> Oxlint migration.
 *
 * Oxlint implements the ESLint core rules and the popular plugins under the same
 * names (with `@typescript-eslint/*` -> `typescript/*`). For a JSON
 * `.eslintrc.json` this copies the configured rules into `.oxlintrc.json`. For a
 * JS/flat config it can shell out to the official `@oxlint/migrate` (with
 * `--online --write`), which evaluates the config in Node.
 */

import fs from 'node:fs';
import path from 'node:path';

import { spawnCross } from '@deltabox/toolchain-shared';

import type {
    MigrationContext,
    MigrationFile,
    MigrationResult,
    ToolchainMigration,
} from './types.js';
import { renderViteTarget } from './vite-target.js';

type Json = Record<string, any>;

const JSON_CONFIG_FILES = ['.eslintrc.json', '.eslintrc'] as const;
const JS_CONFIG_FILES = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    'eslint.config.ts',
    '.eslintrc.js',
    '.eslintrc.cjs',
] as const;

/** The ESLint config in `cwd`, preferring JSON (parseable) then JS. */
export function findEslintConfig(cwd: string): { file: string; json: boolean } | undefined {
    for (const name of JSON_CONFIG_FILES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return { file, json: true };
    }
    for (const name of JS_CONFIG_FILES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return { file, json: false };
    }
    return undefined;
}

/** Normalize an ESLint severity value to an Oxlint level. */
function severity(value: unknown): 'off' | 'warn' | 'error' {
    const level = Array.isArray(value) ? value[0] : value;
    if (level === 2 || level === 'error') return 'error';
    if (level === 1 || level === 'warn') return 'warn';
    return 'off';
}

/** Map an ESLint rule name to an Oxlint rule name. */
export function mapRuleName(name: string): { name: string; mapped: boolean } {
    if (name.startsWith('@typescript-eslint/'))
        return { name: `typescript/${name.slice('@typescript-eslint/'.length)}`, mapped: true };
    // Core + import/react/unicorn/jsx-a11y/... keep their names in Oxlint.
    return { name, mapped: true };
}

/** Copy ESLint rules into an Oxlint `rules` map, collecting unmapped ones. */
function collectRules(
    source: Json | undefined,
    rules: Json,
    unmapped: { source: string; reason: string }[]
): void {
    for (const [name, value] of Object.entries((source ?? {}) as Json)) {
        const mapped = mapRuleName(name);
        rules[mapped.name] = severity(value);
        if (!mapped.mapped) unmapped.push({ source: name, reason: 'unknown plugin prefix' });
    }
}

/** Await a spawned command, resolving to its exit code (never rejects). */
function spawnAndWait(cmd: string, args: string[], cwd: string): Promise<number> {
    return new Promise(resolve => {
        const proc = spawnCross(cmd, args, { cwd, stdio: 'inherit' });
        proc.on('error', () => resolve(1));
        proc.on('exit', code => resolve(code ?? 0));
    });
}

/**
 * Evaluate a JS/flat ESLint config with the official `@oxlint/migrate` and read
 * the `.oxlintrc.json` it writes. Returns `undefined` on failure. Note: the
 * migrator writes to disk, so callers only run it when writing.
 */
export async function runOxlintMigrate(cwd: string): Promise<Json | undefined> {
    const target = path.join(cwd, '.oxlintrc.json');
    const code = await spawnAndWait('npx', ['--yes', '@oxlint/migrate'], cwd);
    if (code !== 0 || !fs.existsSync(target)) return undefined;
    try {
        return JSON.parse(fs.readFileSync(target, 'utf-8').replace(/^\uFEFF/, '')) as Json;
    } catch {
        return undefined;
    }
}

export const eslintToOx: ToolchainMigration = {
    id: 'eslint-to-ox',
    from: 'eslint',
    to: 'oxlint',
    description:
        'Migrate ESLint to Oxlint (JSON configs; flat configs via @oxlint/migrate --online).',
    detect: cwd => Boolean(findEslintConfig(cwd)),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const found = findEslintConfig(ctx.cwd);
        if (!found) throw new Error('eslint-to-ox: no ESLint config found.');

        const rules: Json = {};
        const unmapped: { source: string; reason: string }[] = [];
        const notes = [`Source: ${path.basename(found.file)}.`];

        if (found.json) {
            const raw = JSON.parse(
                fs.readFileSync(found.file, 'utf-8').replace(/^\uFEFF/, '')
            ) as Json;
            collectRules(raw.rules, rules, unmapped);
        } else if (ctx.online && ctx.write) {
            const generated = await runOxlintMigrate(ctx.cwd);
            if (generated) {
                collectRules(generated.rules, rules, unmapped);
                notes.push('Rules evaluated with `@oxlint/migrate` (online).');
            } else {
                notes.push(
                    '`@oxlint/migrate` did not produce `.oxlintrc.json`; hand-map the rules.'
                );
            }
        } else if (ctx.online) {
            notes.push(
                'Flat config: online evaluation runs `@oxlint/migrate`, which writes `.oxlintrc.json` — re-run with `--write`.'
            );
        } else {
            notes.push(
                'Flat config detected — re-run with `--online --write` to use `@oxlint/migrate`, or hand-map the rules.'
            );
        }

        const oxlint: Json = { $schema: './node_modules/oxlint/configuration_schema.json', rules };

        if ((ctx.target ?? 'files') === 'vite') {
            const file = renderViteTarget(ctx.cwd, { lint: oxlint });
            if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');
            return {
                id: eslintToOx.id,
                from: 'eslint',
                to: 'oxlint',
                written: [file.path],
                files: [file],
                oxlint,
                unmapped,
                notes: [...notes, 'Folded into vite.config.ts (`lint`).'],
            };
        }

        const file: MigrationFile = {
            path: path.join(ctx.cwd, '.oxlintrc.json'),
            content: `${JSON.stringify(oxlint, null, 4)}\n`,
        };
        if (ctx.write) fs.writeFileSync(file.path, file.content, 'utf-8');

        return {
            id: eslintToOx.id,
            from: 'eslint',
            to: 'oxlint',
            written: [file.path],
            files: [file],
            oxlint,
            unmapped,
            notes,
        };
    },
};
