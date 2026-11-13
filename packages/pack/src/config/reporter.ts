import fs from 'node:fs';
import path from 'node:path';

import { globalLogger, type Logger, type TsdownPlugin } from 'vite-plus/pack';

/** How the absolute `node_modules` leak reporter reacts to a leak. */
export type NodeModulesLeakLevel = 'error' | 'warn' | 'info' | 'silent';

/** When the reporter analyzes the build. */
export type NodeModulesLeakWhen = 'generateBundle' | 'writeBundle' | 'closeBundle';

/** Options for {@link createNodeModulesLeakReporter}. */
export interface NodeModulesLeakReporterOptions {
    /**
     * How to report a leak. `error` fails the build, `warn`/`info` log only,
     * and `silent` disables the reporter. Default: `error`.
     *
     * `warn`/`info` are suppressed when tsdown/rolldown's effective log level is
     * higher than the chosen level (eg. an `info` report with `logLevel: 'warn'`).
     * An `error` report always fails the build.
     */
    level?: NodeModulesLeakLevel;
    /** Alias for {@link level}. */
    logLevel?: NodeModulesLeakLevel;
    /**
     * When to analyze the output. Default: `writeBundle`.
     *
     * - `generateBundle` — early, in-memory (before the bundle is written).
     * - `writeBundle` — the end of each build, after every `generateBundle`
     *   hook has transformed the bundle (default).
     * - `closeBundle` — after all `writeBundle` hooks, reading the emitted files
     *   from disk. Use this when a later plugin rewrites output in
     *   `writeBundle`; note that in watch mode it runs when the watcher closes,
     *   not after every rebuild.
     */
    when?: NodeModulesLeakWhen;
    /** Specifier/file patterns to ignore (eg. an expected internal absolute path). */
    ignore?: RegExp[];
}

/** The plugin name, used to replace the base reporter when configuring it. */
export const NODE_MODULES_LEAK_REPORTER = 'dbx:node-modules-leak';

/** A leaked absolute path found in an emitted file. */
export interface NodeModulesLeak {
    /** The emitted file (eg. `dist/index.d.ts`). */
    file: string;
    /** The absolute import specifier. */
    specifier: string;
}

/** The portion of Rolldown's output bundle the reporter reads. */
type Bundle = Record<
    string,
    | { type: 'chunk'; fileName: string; code: string }
    | { type: 'asset'; fileName: string; source: string | Uint8Array }
>;

const LEVEL_ORDER = { silent: 0, error: 1, warn: 2, info: 3 } as const;
type LogLevel = keyof typeof LEVEL_ORDER;

/** Extensions scanned when a file is read from disk (or an asset is inlined). */
const TEXT_ASSET = /\.(?:[cm]?js|d\.[cm]?ts|css|html|json|txt|svg)$/i;

/**
 * Matches an import/export/require source: `from "x"`, `import "x"`,
 * `import("x")` or `require("x")`. Whitespace is optional so minified output
 * (`from"C:\\..."`) is covered too.
 */
const SPECIFIER_PATTERN = /\b(?:from|import|require)\b\s*\(?\s*["']([^"'\n]+)["']/g;

/**
 * Matches an absolute Windows/file path token anywhere in a chunk, even when it
 * is a plain string (not an import). POSIX absolute paths are matched through
 * the import/export/require pattern above so URL routes such as
 * `/api/node_modules/...` are not misreported.
 */
const ABSOLUTE_PATH_TOKEN = /(?:[A-Za-z]:[\\/]|\\\\|file:\/{2,})[^\s"'`<>),;\]]+/g;

/** Whether a specifier is an absolute file path (not a bare package specifier). */
function isAbsoluteSpecifier(specifier: string): boolean {
    return (
        /^[A-Za-z]:[\\/]/.test(specifier) ||
        specifier.startsWith('/') ||
        specifier.startsWith('\\\\') ||
        specifier.startsWith('//') ||
        specifier.startsWith('file:')
    );
}

/** Whether a specifier points inside a `node_modules` directory. */
function isNodeModulesSpecifier(specifier: string): boolean {
    return /[/\\]node_modules(?:[/\\]|$)/i.test(specifier);
}

/** Reset a possibly-global regex before testing, so `g`/`y` patterns are safe. */
function matches(pattern: RegExp, value: string): boolean {
    pattern.lastIndex = 0;
    return pattern.test(value);
}

/** Whether an emitted asset is textual and worth scanning. */
function isTextAsset(fileName: string): boolean {
    return !fileName.endsWith('.map') && TEXT_ASSET.test(fileName);
}

/** Decode an asset's source to text (undefined for non-text sources). */
function assetText(source: string | Uint8Array): string | undefined {
    if (typeof source === 'string') return source;
    try {
        return new TextDecoder().decode(source);
    } catch {
        return undefined;
    }
}

/** Every absolute `node_modules` specifier in a chunk, deduplicated. */
function findLeaks(file: string, code: string, ignore: readonly RegExp[] = []): NodeModulesLeak[] {
    const leaks: NodeModulesLeak[] = [];
    const seen = new Set<string>();
    const add = (raw: string | undefined): void => {
        const specifier = raw?.trim();
        if (!specifier || !isNodeModulesSpecifier(specifier)) return;
        if (!isAbsoluteSpecifier(specifier)) return;
        if (ignore.some(pattern => matches(pattern, specifier) || matches(pattern, file))) return;
        const key = `${file}\u0000${specifier}`;
        if (seen.has(key)) return;
        seen.add(key);
        leaks.push({ file, specifier });
    };
    for (const match of code.matchAll(SPECIFIER_PATTERN)) add(match[1]);
    for (const match of code.matchAll(ABSOLUTE_PATH_TOKEN)) add(match[0]);
    return leaks;
}

/** Scan the in-memory Rolldown bundle (chunks + textual assets). */
function scanBundle(bundle: Bundle, ignore: readonly RegExp[]): NodeModulesLeak[] {
    const leaks: NodeModulesLeak[] = [];
    for (const item of Object.values(bundle)) {
        if (item.type === 'chunk') {
            leaks.push(...findLeaks(item.fileName, item.code, ignore));
            continue;
        }
        if (!isTextAsset(item.fileName)) continue;
        const text = assetText(item.source);
        if (text) leaks.push(...findLeaks(item.fileName, text, ignore));
    }
    return leaks;
}

/** Scan emitted files on disk (used by the `closeBundle` timing). */
function scanFiles(
    dirs: readonly string[],
    cwd: string,
    ignore: readonly RegExp[]
): NodeModulesLeak[] {
    const leaks: NodeModulesLeak[] = [];
    const seen = new Set<string>();
    const visit = (dir: string): void => {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                visit(full);
                continue;
            }
            if (!entry.isFile() || !isTextAsset(entry.name) || seen.has(full)) continue;
            seen.add(full);
            try {
                const file = path.relative(cwd, full).replace(/\\/g, '/') || full;
                leaks.push(...findLeaks(file, fs.readFileSync(full, 'utf8'), ignore));
            } catch {
                // An unreadable output file cannot leak a specifier we can prove.
            }
        }
    };
    for (const dir of dirs) visit(dir);
    return leaks;
}

/** The numeric rank of a tsdown/rolldown log level. */
function logRank(level: string | undefined): number {
    return LEVEL_ORDER[level as LogLevel] ?? LEVEL_ORDER.info;
}

/** Build the reporter message (capped so a bad build is still readable). */
export function formatNodeModulesLeakMessage(leaks: readonly NodeModulesLeak[]): string {
    const shown = leaks.slice(0, 10);
    const lines = [
        'Absolute node_modules path(s) leaked into the build output:',
        ...shown.map(leak => `  - ${leak.file}: ${leak.specifier}`),
    ];
    if (leaks.length > shown.length) lines.push(`  ... and ${leaks.length - shown.length} more`);
    lines.push(
        '',
        "A published dependency or type package was resolved to this machine's path.",
        'Declare it in `dependencies`/`peerDependencies`, or keep it external as a',
        'bare package specifier. The emitted output must not contain build-machine paths.'
    );
    return lines.join('\n');
}

/**
 * A tsdown/Rolldown plugin that detects absolute `node_modules` paths in the
 * emitted JS, declaration and textual assets. Such paths leak the build
 * machine's layout into published packages and break consumers (especially
 * with pnpm). It is public so consumers can add it to their own tsdown/Rolldown
 * builds; `baseTsdownConfig` includes it with `level: 'error'`.
 */
export function createNodeModulesLeakReporter(
    options: NodeModulesLeakReporterOptions = {}
): TsdownPlugin {
    const level = options.level ?? options.logLevel ?? 'error';
    const when = options.when ?? 'writeBundle';
    const ignore = options.ignore ?? [];
    let logger: Logger | undefined;
    let cwd = process.cwd();
    let outDir: string | undefined;
    const outputDirs = new Set<string>();

    const addOutputDir = (dir: string): void => {
        outputDirs.add(path.isAbsolute(dir) ? dir : path.resolve(cwd, dir));
    };

    const report = (
        context: { error(message: string): void },
        leaks: readonly NodeModulesLeak[]
    ): void => {
        if (leaks.length === 0) return;
        const message = formatNodeModulesLeakMessage(leaks);
        if (level === 'error') {
            context.error(message);
            return;
        }
        const activeLogger = logger ?? globalLogger;
        // Respect tsdown/rolldown's log level for non-fatal reports.
        if (logRank(level) > logRank(activeLogger.level)) return;
        if (level === 'warn') activeLogger.warn(message);
        else activeLogger.info(message);
    };

    return {
        name: NODE_MODULES_LEAK_REPORTER,
        tsdownConfigResolved(config) {
            logger = config.logger;
            cwd = config.cwd ?? config.root ?? process.cwd();
            outDir = config.outDir;
        },
        generateBundle(_outputOptions, bundle) {
            if (level === 'silent' || when !== 'generateBundle') return;
            report(this, scanBundle(bundle as Bundle, ignore));
        },
        writeBundle(options, bundle) {
            if (options.dir) addOutputDir(options.dir);
            else if (options.file) addOutputDir(path.dirname(options.file));
            if (level === 'silent' || when !== 'writeBundle') return;
            report(this, scanBundle(bundle as Bundle, ignore));
        },
        closeBundle() {
            if (level === 'silent' || when !== 'closeBundle') return;
            if (outputDirs.size === 0) addOutputDir(outDir ?? 'dist');
            report(this, scanFiles([...outputDirs], cwd, ignore));
        },
    };
}
