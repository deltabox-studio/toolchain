/**
 * The `vite` sync task: manages the root `vite.config.ts` shim.
 *
 * The whole Vite+ config lives in `dbx.config.*` under `toolchain.vite`, so the
 * only hand-authored root config is `dbx.config.*`. This task writes a fixed
 * `vite.config.ts` that calls {@link resolveVite} at runtime — the file never
 * drifts, and the config itself stays in `dbx.config.*` (`vp run`/`check`/`staged`
 * do not accept `--config`, so the file has to live at the root). The task is
 * opt-in by section presence and `vite: { config: false }` leaves a hand-written
 * `vite.config.ts` alone.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    DEFAULT_FMT_RULES,
    DEFAULT_LINT_RULES,
    deepMerge,
    isPlainObject,
    type ManagedFile,
    type PackageJson,
    readJsonAt,
    resolveOxcFmtConfig,
    resolveOxcLintConfig,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
    type ToolchainViteConfig,
} from '@deltabox/toolchain-shared';

/**
 * The `vite` section with the toolchain opt-out (`config`) removed. `fmt` and
 * `lint` fall back to the shared defaults when opted in with `true`, and an
 * options object is merged over those defaults.
 */
export function viteConfigObject(config: ToolchainViteConfig = {}): Record<string, unknown> {
    const { config: _config, fmt, lint, ...vite } = config as Record<string, unknown>;
    const out: Record<string, unknown> = { ...vite };
    if (fmt === true) out.fmt = DEFAULT_FMT_RULES;
    else if (isPlainObject(fmt)) out.fmt = deepMerge(DEFAULT_FMT_RULES, fmt);
    else if (fmt !== undefined) out.fmt = fmt;
    if (lint === true) out.lint = DEFAULT_LINT_RULES;
    else if (isPlainObject(lint)) out.lint = deepMerge(DEFAULT_LINT_RULES, lint);
    else if (lint !== undefined) out.lint = lint;
    return out;
}

/** The package a generated shim imports `defineConfig` from. */
export type ViteSpecifier = 'vite' | 'vite-plus';

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
] as const;

/** Whether a `package.json` declares `name` in any dependency field. */
function declares(pkg: PackageJson | undefined, name: string): boolean {
    if (!pkg) return false;
    return DEPENDENCY_FIELDS.some(field => pkg[field]?.[name] !== undefined);
}

/**
 * Detect which Vite package the project uses, so the generated shim imports
 * `defineConfig` from the one that is installed. `vite-plus` wins when both are
 * present (it is the toolchain's own runtime). Walks up to the repository root
 * so a workspace that hoists the dependency from the root still resolves.
 */
export function detectViteSpecifier(cwd: string): ViteSpecifier {
    let dir = path.resolve(cwd);
    let sawVite = false;
    for (;;) {
        const pkg = readJsonAt<PackageJson>(dir, 'package.json');
        if (declares(pkg, 'vite-plus')) return 'vite-plus';
        if (declares(pkg, 'vite')) sawVite = true;
        // Stop at the repository boundary (after checking its `package.json`).
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return sawVite ? 'vite' : 'vite-plus';
}

/** The config type a specifier's `defineConfig` accepts. */
function shimTypeName(specifier: ViteSpecifier): string {
    return specifier === 'vite' ? 'UserConfig' : 'ViteUserConfig';
}

/** A parsed `import ... from '...'` statement. */
interface ParsedImport {
    /** The raw statement text (may span lines). */
    raw: string;
    /** The module specifier. */
    from: string;
    /** The clause between `import` and `from` (empty for a side-effect import). */
    clause: string;
}

/** One line/statement in a config file's leading comment+import block. */
type HeaderEntry = { kind: 'text'; text: string } | { kind: 'import'; parsed: ParsedImport };

/** Split a comma-separated list at the top level (ignores commas inside `{}`). */
function splitSpecifiers(value: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (ch === '{' || ch === '[' || ch === '(') depth++;
        else if (ch === '}' || ch === ']' || ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
            out.push(value.slice(start, i).trim());
            start = i + 1;
        }
    }
    const last = value.slice(start).trim();
    if (last) out.push(last);
    return out.filter(Boolean);
}

/** Parse `default, * as ns, { a, type B }` into its specifier parts. */
function parseImportClause(clause: string): {
    default?: string;
    namespace?: string;
    named: string[];
} {
    const result: { default?: string; namespace?: string; named: string[] } = { named: [] };
    for (const part of splitSpecifiers(clause)) {
        if (part.startsWith('{') && part.endsWith('}')) {
            result.named = splitSpecifiers(part.slice(1, -1));
        } else if (part.startsWith('*')) {
            const match = part.match(/^\*\s*as\s+([\w$]+)$/);
            if (match?.[1]) result.namespace = match[1];
        } else if (/^[\w$]+$/.test(part)) {
            result.default = part;
        }
    }
    return result;
}

/** Format specifier parts back into an import clause. */
function formatImportClause(parts: {
    default?: string;
    namespace?: string;
    named: string[];
}): string {
    const out: string[] = [];
    if (parts.default) out.push(parts.default);
    if (parts.namespace) out.push(`* as ${parts.namespace}`);
    if (parts.named.length > 0) out.push(`{ ${parts.named.join(', ')} }`);
    return out.join(', ');
}

/** Whether a line is blank or part of a comment. */
function isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return (
        trimmed === '' ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('*/')
    );
}

/**
 * Collect a config file's leading comment+import block (stopping at the first
 * code line, ie. the old `export default`). Import statements may span lines.
 */
function leadingHeader(source: string): HeaderEntry[] {
    const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
    const entries: HeaderEntry[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i] as string;
        if (isCommentLine(line)) {
            entries.push({ kind: 'text', text: line });
            i++;
            continue;
        }
        if (!line.trimStart().startsWith('import ')) break;
        let raw = line;
        while (
            !/\bfrom\s*['"][^'"]+['"]\s*;?\s*$/.test(raw.trim()) &&
            !/^import\s*['"][^'"]+['"]\s*;?\s*$/.test(raw.trim()) &&
            i + 1 < lines.length
        ) {
            i++;
            raw += `\n${lines[i]}`;
        }
        const from =
            raw.match(/\bfrom\s*['"]([^'"]+)['"]/)?.[1] ??
            raw.match(/^import\s*['"]([^'"]+)['"]/)?.[1];
        if (!from) break;
        const clause = raw.match(/^import\s+([\s\S]*?)\s+from\s*['"]/)?.[1] ?? '';
        entries.push({ kind: 'import', parsed: { raw, from, clause } });
        i++;
    }
    return entries;
}

/**
 * Merge the required `defineConfig` + config-type specifiers into an existing
 * `vite`/`vite-plus` import, preserving its default/namespace/other named
 * imports. Other imports and comments are kept; the `resolveVite` import is
 * dropped (the shim re-adds it) so regeneration is idempotent.
 */
function mergeHeader(entries: HeaderEntry[], specifier: ViteSpecifier, type: string): string[] {
    const out: string[] = [];
    let merged = false;
    for (const entry of entries) {
        if (entry.kind === 'text') {
            out.push(entry.text);
            continue;
        }
        const { from, clause } = entry.parsed;
        if (from === '@deltabox/toolchain/vite') continue;
        if (from === specifier && !merged) {
            const parts = parseImportClause(clause);
            const named = parts.named.filter(
                name =>
                    name.replace(/^type\s+/, '') !== 'defineConfig' &&
                    name.replace(/^type\s+/, '') !== type
            );
            named.unshift('defineConfig');
            named.push(`type ${type}`);
            out.push(`import ${formatImportClause({ ...parts, named })} from '${specifier}';`);
            merged = true;
            continue;
        }
        out.push(entry.parsed.raw);
    }
    if (!merged) {
        let index = 0;
        while (index < out.length && isCommentLine(out[index] as string)) index++;
        out.splice(index, 0, `import { defineConfig, type ${type} } from '${specifier}';`);
    }
    return out;
}

/**
 * The managed `vite.config.ts`: a header, the imports and a one-line shim that
 * resolves the real config from `dbx.config.*` at load time. `defineConfig` and
 * its config type are imported from the project's Vite package (`vite` or
 * `vite-plus`), and `resolveVite` is typed accordingly.
 *
 * When `existing` is given, its leading comments and imports are preserved and
 * the `defineConfig` import is merged into them (keeping default/other named/
 * type specifiers), so regenerating the shim never drops custom imports/comments.
 */
export function renderViteConfig(
    specifier: ViteSpecifier = 'vite-plus',
    existing?: string
): string {
    const type = shimTypeName(specifier);
    const header = existing ? mergeHeader(leadingHeader(existing), specifier, type) : [];
    if (header.length > 0) {
        while (header.length > 0 && (header[header.length - 1] as string).trim() === '')
            header.pop();
        return [
            ...header,
            "import { resolveVite } from '@deltabox/toolchain/vite';",
            '',
            `export default defineConfig(resolveVite<${type}>({ cwd: import.meta.dirname }));`,
            '',
        ].join('\n');
    }
    return [
        '// Generated by @deltabox/toolchain — edit the vite section in dbx.config and run `dbx sync`.',
        `import { defineConfig, type ${type} } from '${specifier}';`,
        "import { resolveVite } from '@deltabox/toolchain/vite';",
        '',
        `export default defineConfig(resolveVite<${type}>({ cwd: import.meta.dirname }));`,
        '',
    ].join('\n');
}

/** The default managed `vite.config.ts` (imports `defineConfig` from `vite-plus`). */
export const VITE_CONFIG_SHIM = renderViteConfig('vite-plus');

/** The managed Oxfmt config file (read by the Oxc VS Code extension). */
export const OXC_FMT_CONFIG_FILE = '.oxfmtrc.json';

/** The managed Oxlint config file (read by the Oxc VS Code extension). */
export const OXC_LINT_CONFIG_FILE = '.oxlintrc.json';

/** Render an Oxc config file with the package's JSON schema. */
function renderOxcConfig(schemaPath: string, config: unknown): string {
    const body = isPlainObject(config) ? config : {};
    return `${JSON.stringify({ $schema: schemaPath, ...body }, null, 4)}\n`;
}

/**
 * The vite sync task: writes the `vite.config.ts` shim when the `vite` section is
 * enabled (and `config` is not `false`), plus the root `.oxfmtrc.json` /
 * `.oxlintrc.json` files the Oxc VS Code extension reads. A nested config only
 * gets its own Oxc files when it defines `vite.fmt` / `vite.lint` itself (not
 * merely inherited from the root).
 */
export function viteSyncTask(): SyncTask {
    return {
        name: 'vite',
        projectTypes: ['monorepo-root', 'monorepo-workspace', 'project'],
        enabled: config =>
            sectionEnabled(config.vite) ||
            sectionEnabled(config.fmt) ||
            sectionEnabled(config.lint) ||
            sectionConfig(config.fmt)?.oxc !== undefined ||
            sectionConfig(config.lint)?.oxc !== undefined,
        run: ctx => {
            const hasVite = sectionEnabled(ctx.config.vite);
            const section = sectionConfig(ctx.config.vite) ?? {};
            const ownConfig = ctx.ownConfig ?? ctx.config;
            const ownVite = sectionConfig(ownConfig.vite) ?? {};
            const ownFmt = sectionConfig(ownConfig.fmt)?.oxc;
            const ownLint = sectionConfig(ownConfig.lint)?.oxc;
            const effective: Record<string, unknown> = { ...section };
            const fmt = resolveOxcFmtConfig(ctx.config);
            const lint = resolveOxcLintConfig(ctx.config);
            if (fmt !== undefined) effective.fmt = fmt;
            if (lint !== undefined) effective.lint = lint;
            const resolved = viteConfigObject(effective as ToolchainViteConfig) as {
                fmt?: unknown;
                lint?: unknown;
            };
            const files: ManagedFile[] = [];

            const configuredPath = section.config;
            const shimPath =
                configuredPath === false
                    ? undefined
                    : typeof configuredPath === 'string' && configuredPath.trim()
                      ? configuredPath
                      : 'vite.config.ts';
            if (hasVite && shimPath) {
                let existing: string | undefined;
                try {
                    const target = path.isAbsolute(shimPath)
                        ? shimPath
                        : path.resolve(ctx.cwd, shimPath);
                    existing = fs.readFileSync(target, 'utf-8');
                } catch {
                    existing = undefined;
                }
                files.push({
                    path: shimPath,
                    content: renderViteConfig(detectViteSpecifier(ctx.cwd), existing),
                });
            }
            const hasFmt =
                (ownFmt !== undefined || ownVite.fmt !== undefined) &&
                resolved.fmt !== undefined &&
                resolved.fmt !== false;
            const hasLint =
                (ownLint !== undefined || ownVite.lint !== undefined) &&
                resolved.lint !== undefined &&
                resolved.lint !== false;
            if (hasFmt) {
                files.push({
                    path: OXC_FMT_CONFIG_FILE,
                    content: renderOxcConfig(
                        './node_modules/oxfmt/configuration_schema.json',
                        resolved.fmt
                    ),
                });
            }
            if (hasLint) {
                files.push({
                    path: OXC_LINT_CONFIG_FILE,
                    content: renderOxcConfig(
                        './node_modules/oxlint/configuration_schema.json',
                        resolved.lint
                    ),
                });
            }
            return files;
        },
    };
}
