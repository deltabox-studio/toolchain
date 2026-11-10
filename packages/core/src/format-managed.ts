/**
 * Format the files a sync run manages.
 *
 * Formatting is opt-in (`sync.format: true` or an options object) and runs in
 * fix mode by default. Consumers can tune the command/fix mode, or exclude
 * individual managed files with globs. Files a task marks
 * `format: false` (eg. generated tsconfigs) are never formatted.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    declaredDependencies,
    type FormatterTool,
    isIgnoredPath,
    type PackageJson,
    readJsonAt,
    resolveFmtTools,
    sectionConfig,
    spawnCross,
    type ToolchainConfig,
} from '@deltabox/toolchain/shared';

/** The `sync.format` setting: a boolean or an options object. */
export type ManagedFormatSetting =
    | boolean
    | {
          enabled?: boolean;
          fix?: boolean;
          command?: string;
          exclude?: string[];
      };

export interface ManagedFormatOptions {
    /** Explicit override (CLI/API); falls back to `sync.format` in the config. */
    setting?: ManagedFormatSetting;
    /** The loaded config (its `fmt` section selects the formatter). */
    config?: ToolchainConfig;
}

export interface ManagedFormatCommand {
    exe: string;
    args: string[];
}

const IS_WINDOWS = process.platform === 'win32';

const FORMATTER_PACKAGES: Record<FormatterTool, { bin: string; pkg: string }> = {
    oxc: { bin: 'oxfmt', pkg: 'oxfmt' },
    prettier: { bin: 'prettier', pkg: 'prettier' },
    biome: { bin: 'biome', pkg: '@biomejs/biome' },
    dprint: { bin: 'dprint', pkg: 'dprint' },
};

/** Normalize a `sync.format` value (defaults: enabled, fix). */
export function resolveManagedFormatting(options: ManagedFormatOptions = {}): {
    enabled: boolean;
    fix: boolean;
    command?: string;
    exclude: string[];
} {
    const setting = options.setting ?? sectionConfig(options.config?.sync)?.format;
    if (setting === true) return { enabled: true, fix: true, exclude: [] };
    if (setting === undefined || setting === false) {
        return { enabled: false, fix: true, exclude: [] };
    }
    return {
        enabled: setting.enabled !== false,
        fix: setting.fix !== false,
        ...(setting.command ? { command: setting.command } : {}),
        exclude: setting.exclude ?? [],
    };
}

/** Walk up from `cwd` to the first `package.json` (inclusive). */
function nearestPackageJson(cwd: string): PackageJson | undefined {
    let dir = path.resolve(cwd);
    for (;;) {
        const pkg = readJsonAt<PackageJson>(dir, 'package.json');
        if (pkg) return pkg;
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

/** The formatter the project uses (configured, else detected in `package.json`). */
export function detectManagedFormatter(
    cwd: string,
    config: ToolchainConfig = {}
): { tool: FormatterTool; vitePlus: boolean } | undefined {
    const pkg = nearestPackageJson(cwd);
    const configured = resolveFmtTools(config)[0];
    const declared = declaredDependencies(pkg);
    const vitePlus = declared.has('vite-plus');
    if (configured) return { tool: configured, vitePlus };
    const precedence: FormatterTool[] = ['oxc', 'biome', 'prettier', 'dprint'];
    for (const tool of precedence) {
        if (
            tool === 'oxc'
                ? vitePlus || declared.has('oxfmt')
                : declared.has(FORMATTER_PACKAGES[tool].pkg)
        ) {
            return { tool, vitePlus };
        }
    }
    return undefined;
}

/** The `.bin/<name>` candidates inside a project (Windows variants first). */
function localBinCandidates(cwd: string, bin: string): string[] {
    const candidates: string[] = [];
    let dir = path.resolve(cwd);
    for (;;) {
        const base = path.join(dir, 'node_modules', '.bin', bin);
        candidates.push(
            ...(IS_WINDOWS ? [`${base}.cmd`, `${base}.exe`, `${base}.ps1`, base] : [base])
        );
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return candidates;
}

/** Resolve a formatter binary: local `.bin` -> PATH name -> `npx`. */
function resolveBinary(cwd: string, bin: string, pkg: string): { exe: string; args: string[] } {
    for (const candidate of localBinCandidates(cwd, bin)) {
        if (fs.existsSync(candidate)) return { exe: candidate, args: [] };
    }
    return {
        exe: IS_WINDOWS ? 'npx.cmd' : 'npx',
        args: ['--yes', pkg],
    };
}

/** The default formatter command for a tool (fix or check mode). */
export function managedFormatCommand(
    cwd: string,
    formatter: { tool: FormatterTool; vitePlus: boolean },
    fix: boolean
): ManagedFormatCommand {
    if (formatter.tool === 'oxc' && formatter.vitePlus) {
        const vp = resolveBinary(cwd, 'vp', 'vite-plus');
        return { exe: vp.exe, args: [...vp.args, 'fmt', ...(fix ? [] : ['--check'])] };
    }
    const { bin, pkg } =
        formatter.tool === 'oxc'
            ? { bin: 'oxfmt', pkg: 'oxfmt' }
            : FORMATTER_PACKAGES[formatter.tool];
    const resolved = resolveBinary(cwd, bin, pkg);
    const args =
        formatter.tool === 'prettier'
            ? [fix ? '--write' : '--check']
            : formatter.tool === 'biome'
              ? ['format', ...(fix ? ['--write'] : [])]
              : formatter.tool === 'dprint'
                ? [fix ? 'fmt' : 'check']
                : fix
                  ? []
                  : ['--check'];
    return { exe: resolved.exe, args: [...resolved.args, ...args] };
}

/** Split a command string into tokens, honouring single/double quotes. */
function splitCommand(value: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let quote: '"' | "'" | undefined;
    for (let index = 0; index < value.length; index++) {
        const char = value[index] as string;
        if (quote) {
            if (char === quote) quote = undefined;
            else current += char;
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (/\s/.test(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            continue;
        }
        current += char;
    }
    if (current) tokens.push(current);
    return tokens;
}

/** Apply a user command override (with `{files}` expansion). */
function commandOverride(command: string, files: string[]): ManagedFormatCommand {
    const tokens = splitCommand(command);
    const args: string[] = [];
    let expanded = false;
    for (const token of tokens) {
        if (token === '{files}') {
            args.push(...files);
            expanded = true;
        } else if (token.includes('{files}')) {
            args.push(token.replaceAll('{files}', files.join(' ')));
            expanded = true;
        } else {
            args.push(token);
        }
    }
    if (!expanded) args.push(...files);
    const [exe, ...rest] = args;
    if (!exe) throw new Error('sync.format.command is empty');
    return { exe, args: rest };
}

/** Run the formatter. Resolves to its exit code (never rejects). */
function runCommand(command: ManagedFormatCommand, cwd: string): Promise<number> {
    return new Promise(resolve => {
        const child = spawnCross(command.exe, command.args, {
            cwd,
            stdio: 'ignore',
            timeoutMs: 120_000,
        });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 1));
    });
}

/**
 * Format `files` (repo-relative managed paths). Returns whether a formatter ran
 * and its exit code; a missing formatter or a formatter failure is non-fatal.
 */
export async function formatManagedFiles(
    cwd: string,
    files: string[],
    options: ManagedFormatOptions = {}
): Promise<{ ran: boolean; command?: ManagedFormatCommand; code?: number }> {
    const formatting = resolveManagedFormatting(options);
    if (!formatting.enabled || files.length === 0) return { ran: false };
    const targets = files
        .map(file => file.replace(/\\/g, '/'))
        .filter(file => !isIgnoredPath(file, formatting.exclude))
        .filter(file => fs.existsSync(path.resolve(cwd, file)));
    if (targets.length === 0) return { ran: false };

    const formatter = detectManagedFormatter(cwd, options.config);
    let command: ManagedFormatCommand;
    if (formatting.command) {
        command = commandOverride(formatting.command, targets);
    } else {
        if (!formatter) return { ran: false };
        command = managedFormatCommand(cwd, formatter, formatting.fix);
    }
    const code = await runCommand(command, cwd);
    return { ran: true, command, code };
}
