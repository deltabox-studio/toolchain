/**
 * Route `dbx fmt` / `dbx lint` to the active formatter/linter.
 *
 * Both commands are Vite+ passthroughs, so by default they spawn `vp fmt` /
 * `vp lint` (Oxfmt / Oxlint). When the toolchain config (or the discovered
 * project/editor settings) selects another tool, this wrapper runs that tool
 * instead, keeping the Oxc path untouched.
 */

import fs from 'node:fs';
import path from 'node:path';

import { assertToolingDependency, loadToolchainConfig } from '@deltabox/toolchain/core';
import {
    declaredDependencies,
    defineCliCommand,
    type FormatterTool,
    type LinterTool,
    logger,
    sectionConfig,
    spawnCross,
    type CliCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain/shared';
import { which } from 'vite-plugin-dbx';

import { discoverTooling } from '../tooling.js';
import { getConfigSelection } from './config-selection.js';

type Kind = 'fmt' | 'lint';
type Tool = FormatterTool | LinterTool;

const IS_WINDOWS = process.platform === 'win32';

/** The package that provides a non-Oxc tool's binary. */
const TOOL_PACKAGE: Record<Exclude<Tool, 'oxc'>, { bin: string; pkg: string }> = {
    prettier: { bin: 'prettier', pkg: 'prettier' },
    biome: { bin: 'biome', pkg: '@biomejs/biome' },
    dprint: { bin: 'dprint', pkg: 'dprint' },
    eslint: { bin: 'eslint', pkg: 'eslint' },
};

/** The standalone Oxc binaries, used when `vite-plus` is not installed. */
const OXC_PACKAGE: Record<Kind, { bin: string; pkg: string }> = {
    fmt: { bin: 'oxfmt', pkg: 'oxfmt' },
    lint: { bin: 'oxlint', pkg: 'oxlint' },
};

/** Flags that select a tool's mode rather than being forwarded verbatim. */
const MODE_FLAGS = new Set([
    '--check',
    '--write',
    '--list-different',
    '--fix',
    '--fix-suggestions',
    '--fix-dangerously',
]);

/** Flags that consume the next argument (so it is not mistaken for a path). */
const VALUE_FLAGS = new Set([
    '--ignore-path',
    '--ignore-pattern',
    '--config',
    '--stdin-filepath',
    '--stdin-file-path',
    '--threads',
    '--max-warnings',
    '--format',
    '-f',
    '--tsconfig',
    '--since',
    '--log-level',
]);

/** Whether `args` contains a positional path (not a flag or flag value). */
function hasPositional(args: string[]): boolean {
    let afterFlag = false;
    for (let index = 0; index < args.length; index++) {
        const arg = args[index] as string;
        if (arg === '--') return index < args.length - 1;
        if (VALUE_FLAGS.has(arg)) {
            index++;
            afterFlag = false;
            continue;
        }
        if (arg.startsWith('-')) {
            afterFlag = true;
            continue;
        }
        // A bare token immediately after an unknown flag is most likely that
        // flag's value (`--tab-width 2`), not a path. If no real positional is
        // left, the caller defaults to `.` below.
        if (afterFlag) {
            afterFlag = false;
            continue;
        }
        return true;
    }
    return false;
}

/**
 * Translate `dbx fmt` / `dbx lint` operands to the selected tool's CLI. Mode
 * flags (`--check`, `--write`, `--fix`, ...) are rewritten; everything else is
 * forwarded, and a bare invocation targets the current directory.
 */
export function buildToolArgs(kind: Kind, tool: Tool, input: string[]): string[] {
    if (tool === 'oxc') return [...input];
    const flags = new Set(input);
    const mode: 'check' | 'write' | 'fix' =
        kind === 'fmt'
            ? flags.has('--check') || flags.has('--list-different')
                ? 'check'
                : 'write'
            : flags.has('--fix') || flags.has('--fix-suggestions') || flags.has('--fix-dangerously')
              ? 'fix'
              : 'check';
    const rest = input.filter(arg => !MODE_FLAGS.has(arg));
    const args = hasPositional(rest) ? rest : [...rest, '.'];
    if (kind === 'fmt') {
        if (tool === 'prettier') return [mode === 'check' ? '--check' : '--write', ...args];
        if (tool === 'biome') return ['format', ...(mode === 'check' ? [] : ['--write']), ...args];
        if (tool === 'dprint') return [mode === 'check' ? 'check' : 'fmt', ...args];
        return [...input];
    }
    if (tool === 'eslint') return [...(mode === 'fix' ? ['--fix'] : []), ...args];
    if (tool === 'biome') return ['lint', ...(mode === 'fix' ? ['--write'] : []), ...args];
    return [...input];
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

/** Resolve a tool binary: project-local shim -> `PATH` -> `npx`. */
function resolveBinary(
    bin: string,
    pkg: string,
    args: string[],
    cwd: string
): { exe: string; args: string[] } {
    for (const candidate of localBinCandidates(cwd, bin)) {
        if (fs.existsSync(candidate)) return { exe: candidate, args };
    }
    const onPath = which(bin);
    if (onPath) return { exe: onPath, args };
    return { exe: IS_WINDOWS ? 'npx.cmd' : 'npx', args: ['--yes', pkg, ...args] };
}

/** Resolve a non-Oxc tool binary. */
export function resolveToolCommand(
    tool: Exclude<Tool, 'oxc'>,
    args: string[],
    cwd: string
): { exe: string; args: string[] } {
    const { bin, pkg } = TOOL_PACKAGE[tool];
    return resolveBinary(bin, pkg, args, cwd);
}

/** Spawn the selected tool, resolving to its exit code (never rejects). */
function spawnTool(
    command: { exe: string; args: string[] },
    options: { cwd: string; color: boolean }
): Promise<number> {
    const env: NodeJS.ProcessEnv = { ...process.env };
    if (!options.color) {
        env.NO_COLOR = '1';
        env.FORCE_COLOR = '0';
    }
    return new Promise(resolve => {
        const child = spawnCross(command.exe, command.args, {
            cwd: options.cwd,
            env,
            stdio: 'inherit',
        });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/**
 * Run `args` with the active tool. Returns `false` when the active tool is Oxc
 * backed by `vite-plus` (or help was requested), so the caller can fall through
 * to the `vp` passthrough unchanged. A standalone `oxfmt`/`oxlint` dependency is
 * run directly, and a missing dependency raises a clear error instead of an
 * implicit `npx` download.
 */
async function runDiscoveredTool(
    kind: Kind,
    args: string[],
    opts: Record<string, unknown>,
    context: ToolchainCommandContext
): Promise<boolean> {
    // Help/version and stdin modes stay on the Vite+ passthrough: their flags
    // are tool-specific and `vp` already handles them correctly.
    const passthrough = args.some(
        arg =>
            arg === '--help' ||
            arg === '-H' ||
            arg === '--version' ||
            arg === '-V' ||
            arg.startsWith('--stdin-filepath') ||
            arg.startsWith('--stdin-file-path')
    );
    if (passthrough) return false;
    const cwd = opts.cwd ? path.resolve(String(opts.cwd)) : context.cwd;
    let config = context.config;
    if (path.resolve(cwd) !== path.resolve(context.cwd)) {
        try {
            const loaded = await loadToolchainConfig(cwd, {
                tolerant: true,
                skipHooks: true,
                ...getConfigSelection(),
            });
            config = loaded.config;
        } catch {
            // Keep the config loaded for the original project.
        }
    }
    const discovered = discoverTooling(config, { cwd });
    const tool = kind === 'fmt' ? discovered.fmt.tool : discovered.lint.tool;
    const found = assertToolingDependency(cwd, kind, tool);
    let command: { exe: string; args: string[] };
    if (tool === 'oxc') {
        // `vite-plus` owns the `vp fmt`/`vp lint` passthrough; the standalone
        // Oxc packages are only used when Vite+ is not declared.
        if (found.pkg && declaredDependencies(found.pkg).has('vite-plus')) return false;
        const oxc = OXC_PACKAGE[kind];
        command = resolveBinary(oxc.bin, oxc.pkg, buildToolArgs(kind, tool, args), cwd);
    } else {
        command = resolveToolCommand(
            tool as Exclude<Tool, 'oxc'>,
            buildToolArgs(kind, tool, args),
            cwd
        );
    }
    const color =
        logger.colors.isColorSupported && sectionConfig(config.providers)?.color !== false;
    const code = await spawnTool(command, { cwd, color });
    if (code !== 0) process.exitCode = code;
    return true;
}

/**
 * Wrap the Vite+ `fmt` / `lint` passthroughs so they run the discovered tool
 * when it is not Oxc. The generic `vite` command is handled too, since a bare
 * `dbx fmt` is rewritten to `dbx vite fmt`.
 */
export function withToolingRouting(commands: CliCommand[]) {
    return commands.map(command => {
        if (command.name === 'vite') {
            const original = command.run;
            return defineCliCommand({
                ...command,
                run: async (opts, context) => {
                    const args = (opts.args as string[] | undefined) ?? [];
                    const sub = args[0];
                    if (
                        (sub === 'fmt' || sub === 'lint') &&
                        (await runDiscoveredTool(sub, args.slice(1), opts, context))
                    ) {
                        return;
                    }
                    return original(opts, context);
                },
            });
        }
        if (command.name === 'vite:fmt' || command.name === 'vite:lint') {
            const kind: Kind = command.name === 'vite:fmt' ? 'fmt' : 'lint';
            const original = command.run;
            return defineCliCommand({
                ...command,
                run: async (opts, context) => {
                    const args = (opts.args as string[] | undefined) ?? [];
                    if (await runDiscoveredTool(kind, args, opts, context)) return;
                    return original(opts, context);
                },
            });
        }
        return command;
    });
}
