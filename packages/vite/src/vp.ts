/**
 * Resolving + running the Vite+ binary (`vp`).
 *
 * Vite+ ships a single `vp` entry point that wraps Vite, Vitest, Oxlint, Oxfmt,
 * Rolldown and tsdown. It can be installed locally (as a dev dependency, so a
 * `node_modules/.bin/vp` shim exists), globally (on `PATH`), or run on demand
 * through `npx`. {@link resolveVp} prefers the project-local shim, then a global
 * install, and only falls back to `npx` — so `dbx vite:*` always uses
 * the version the project pins.
 */

import fs from 'node:fs';
import path from 'node:path';

import { spawnCross } from '@deltabox/toolchain-shared';

const IS_WINDOWS = process.platform === 'win32';

/** How a `vp` binary was resolved. */
export type VpSource = 'local' | 'global' | 'npx';

/** A resolved Vite+ invocation. */
export interface ResolvedVp {
    /** The executable to spawn. */
    exe: string;
    /** Leading args prepended to the vp args (eg. nothing, or `--yes vite-plus`). */
    args: string[];
    /** Where the binary came from. */
    source: VpSource;
}

/** The `.bin/vp` shim candidates inside a project (Windows variants first). */
function localCandidates(cwd: string): string[] {
    const base = path.join(cwd, 'node_modules', '.bin', 'vp');
    return IS_WINDOWS ? [`${base}.cmd`, `${base}.exe`, `${base}.ps1`, base] : [base];
}

/** Find an executable on `PATH` (resolves `PATHEXT` on Windows). */
export function which(bin: string): string | undefined {
    const exts = IS_WINDOWS
        ? (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
        : [''];
    const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
    for (const dir of dirs) {
        for (const ext of exts) {
            const candidate = path.join(dir, `${bin}${ext.toLowerCase()}`);
            try {
                fs.accessSync(candidate, fs.constants.X_OK);
                return candidate;
            } catch {
                // keep looking
            }
        }
    }
    return undefined;
}

/**
 * Resolve the `vp` binary for a project: project-local shim -> global `PATH`
 * -> `npx --yes vite-plus`.
 */
export function resolveVp(cwd: string = process.cwd()): ResolvedVp {
    for (const candidate of localCandidates(cwd)) {
        if (fs.existsSync(candidate)) return { exe: candidate, args: [], source: 'local' };
    }
    const global = which('vp');
    if (global) return { exe: global, args: [], source: 'global' };
    return { exe: IS_WINDOWS ? 'npx.cmd' : 'npx', args: ['--yes', 'vite-plus'], source: 'npx' };
}

/** Whether a local or global `vp` is available (ie. no `npx` fallback needed). */
export function hasVp(cwd: string = process.cwd()): boolean {
    return resolveVp(cwd).source !== 'npx';
}

export interface RunVpOptions {
    /** The working directory (the project root). */
    cwd?: string;
    /** `inherit` streams the child's stdio (default); `capture` pipes it. */
    mode?: 'inherit' | 'capture';
    /** Extra environment variables. */
    env?: NodeJS.ProcessEnv;
}

export interface VpResult {
    code: number;
    stdout: string;
    stderr: string;
    /** The resolved invocation that was run. */
    resolved: ResolvedVp;
}

/**
 * Run `vp` with `args` in `cwd`. Streams output by default; pass
 * `mode: 'capture'` to collect it instead. Never exits the host process, so it
 * is safe to call from the CLI, the API and the VS Code extension.
 */
export function runVp(args: string[], options: RunVpOptions = {}): Promise<VpResult> {
    const cwd = options.cwd ?? process.cwd();
    const resolved = resolveVp(cwd);
    const capture = options.mode === 'capture';
    return new Promise<VpResult>(resolve => {
        let stdout = '';
        let stderr = '';
        const child = spawnCross(resolved.exe, [...resolved.args, ...args], {
            cwd,
            env: { ...process.env, ...options.env },
            stdio: capture ? 'pipe' : 'inherit',
        });
        child.stdout?.on('data', chunk => {
            stdout += chunk;
        });
        child.stderr?.on('data', chunk => {
            stderr += chunk;
        });
        child.on('error', error => {
            resolve({ code: 1, stdout, stderr: `${stderr}${String(error)}`, resolved });
        });
        child.on('exit', code => {
            resolve({ code: code ?? 0, stdout, stderr, resolved });
        });
    });
}

/** The `vp --version` output, or `undefined` when `vp` cannot be run. */
export async function vpVersion(cwd: string = process.cwd()): Promise<string | undefined> {
    const result = await runVp(['--version'], { cwd, mode: 'capture' });
    if (result.code !== 0) return undefined;
    return result.stdout.trim() || result.stderr.trim() || undefined;
}

/** A one-line description of where `vp` resolves from (for logs + the UI). */
export function describeVp(cwd: string = process.cwd()): string {
    const resolved = resolveVp(cwd);
    if (resolved.source === 'local') return 'local (node_modules/.bin/vp)';
    if (resolved.source === 'global') return 'global (PATH)';
    return 'npx --yes vite-plus';
}
