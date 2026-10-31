/**
 * Oxc -> `dbx.config.*` migration.
 *
 * Folds a hand-written `.oxfmtrc.json` / `.oxlintrc.json` into
 * `toolchain.fmt.oxc` / `toolchain.lint.oxc`, so `dbx sync` manages the files
 * from the one hand-authored config (after migration they are regenerated).
 */

import fs from 'node:fs';
import path from 'node:path';

import { readManifest } from '@deltabox/toolchain-core';

import { readJsonc } from './biome.js';
import type {
    MigrationContext,
    MigrationFile,
    MigrationResult,
    ToolchainMigration,
} from './types.js';
import { serializeTs } from './vite-target.js';
import { foldToolchainSection, renderFreshSectionsConfig } from './vite.js';

type Json = Record<string, unknown>;

export const OXC_FMT_FILE = '.oxfmtrc.json';
export const OXC_LINT_FILE = '.oxlintrc.json';

function managed(cwd: string, name: string): boolean {
    try {
        return readManifest(cwd).files.includes(name);
    } catch {
        return false;
    }
}

/** A source Oxc config in `cwd`, when it is not managed by dbx itself. */
export function findOxcConfigs(cwd: string): { fmt?: string; lint?: string } {
    const fmt = path.join(cwd, OXC_FMT_FILE);
    const lint = path.join(cwd, OXC_LINT_FILE);
    return {
        ...(fs.existsSync(fmt) && !managed(cwd, OXC_FMT_FILE) ? { fmt } : {}),
        ...(fs.existsSync(lint) && !managed(cwd, OXC_LINT_FILE) ? { lint } : {}),
    };
}

function withoutSchema(config: Json): Json {
    const { $schema: _schema, ...rest } = config;
    return rest;
}

/** Find the `dbx.config.*` to fold into (JSON configs cannot be text-spliced). */
function findConfig(cwd: string): string | undefined {
    for (const name of [
        'dbx.config.ts',
        'dbx.config.mts',
        'dbx.config.js',
        'dbx.config.mjs',
        'dbx.config.cjs',
        'dbx.config.json',
    ]) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

export const oxcToToolchain: ToolchainMigration = {
    id: 'oxc-to-toolchain',
    from: 'oxc',
    to: 'toolchain',
    description: 'Fold .oxfmtrc.json / .oxlintrc.json into toolchain.fmt/lint.oxc.',
    detect: cwd => Boolean(findOxcConfigs(cwd).fmt || findOxcConfigs(cwd).lint),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const found = findOxcConfigs(ctx.cwd);
        if (!found.fmt && !found.lint) throw new Error('oxc-to-toolchain: no Oxc config found.');

        const fmt = found.fmt ? withoutSchema(readJsonc(found.fmt)) : undefined;
        const lint = found.lint ? withoutSchema(readJsonc(found.lint)) : undefined;
        const notes = [
            ...(found.fmt ? [`Source: ${path.basename(found.fmt)} (Oxfmt).`] : []),
            ...(found.lint ? [`Source: ${path.basename(found.lint)} (Oxlint).`] : []),
        ];
        const sections = [
            ...(fmt ? [{ key: 'fmt', objectText: serializeTs({ oxc: fmt }) }] : []),
            ...(lint ? [{ key: 'lint', objectText: serializeTs({ oxc: lint }) }] : []),
        ];

        const configFile = findConfig(ctx.cwd);
        let target: string;
        let content: string;
        if (!configFile) {
            target = path.join(ctx.cwd, 'dbx.config.ts');
            content = renderFreshSectionsConfig(sections);
        } else if (configFile.endsWith('.json')) {
            return {
                id: oxcToToolchain.id,
                from: 'oxc',
                to: 'toolchain',
                written: [],
                files: [],
                oxfmt: fmt,
                oxlint: lint,
                unmapped: [
                    {
                        source: path.basename(configFile),
                        reason: 'JSON configs cannot hold the folded object by text-splice',
                    },
                ],
                notes: [...notes, 'Fold into the JSON config by hand.'],
            };
        } else {
            let source = fs.readFileSync(configFile, 'utf-8').replace(/^\uFEFF/, '');
            for (const section of sections) {
                const folded = foldToolchainSection(source, section.key, section.objectText);
                if ('error' in folded) {
                    return {
                        id: oxcToToolchain.id,
                        from: 'oxc',
                        to: 'toolchain',
                        written: [],
                        files: [],
                        oxfmt: fmt,
                        oxlint: lint,
                        unmapped: [{ source: path.basename(configFile), reason: folded.error }],
                        notes: [...notes, 'Left dbx.config.* unchanged; fold it by hand.'],
                    };
                }
                source = folded.content;
            }
            target = configFile;
            content = source;
        }

        const file: MigrationFile = { path: target, content };
        if (ctx.write) fs.writeFileSync(target, content, 'utf-8');

        const sources = [found.fmt, found.lint].filter((value): value is string => Boolean(value));
        const removed = ctx.ignoreManagedFiles ? [] : sources;
        if (ctx.ignoreManagedFiles) {
            notes.push('Kept the source Oxc files (ignoreManagedFiles).');
        } else {
            if (ctx.write) for (const source of removed) fs.rmSync(source, { force: true });
            if (removed.length > 0) {
                notes.push(
                    `${ctx.write ? 'Removed' : 'Would remove'} the source Oxc files; \`dbx sync\` regenerates them.`
                );
            }
        }

        return {
            id: oxcToToolchain.id,
            from: 'oxc',
            to: 'toolchain',
            written: [target],
            removed,
            files: [file],
            oxfmt: fmt,
            oxlint: lint,
            notes: [...notes, 'Folded into `toolchain.fmt.oxc` / `toolchain.lint.oxc`.'],
        };
    },
};
