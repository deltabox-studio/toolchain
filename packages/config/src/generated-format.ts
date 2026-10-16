/**
 * Programmatic formatter for generated output.
 *
 * The config generators emit deterministic text; this helper runs it through
 * Oxfmt **at generation time** instead of shelling out to the repo-root `vp`
 * (or relying on a separate `yarn format` pass), so a generated file is written
 * already formatted. It prefers the project-local `vite-plus/fmt` (Oxfmt ships
 * with Vite+), falls back to `oxfmt`, and finally returns the input untouched
 * when no formatter is resolvable — so generation never fails on a missing
 * formatter.
 */

export interface FormatGeneratedOptions {
    /** File name used to infer the language (default `generated.ts`). */
    fileName?: string;
    /** Extra Oxfmt options merged over {@link GENERATED_FORMAT_OPTIONS}. */
    options?: Record<string, unknown>;
}

/**
 * Baseline Oxfmt options matching the toolchain's own `vite.config.ts`.
 * `jsdoc` collapses the short, verbose comment blocks the type generator emits.
 */
export const GENERATED_FORMAT_OPTIONS = {
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
    endOfLine: 'lf',
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    trailingComma: 'es5',
    semi: true,
    arrowParens: 'avoid',
    bracketSpacing: true,
    bracketSameLine: false,
    jsdoc: true,
} as const;

type FormatFn = (
    fileName: string,
    source: string,
    options?: Record<string, unknown>
) => Promise<{ code: string }>;

async function resolveFormat(): Promise<FormatFn | undefined> {
    // Computed specifiers keep bundlers from inlining the formatter (and its
    // platform binary); resolution is left to the consumer's node_modules.
    for (const specifier of ['vite-plus/fmt', 'oxfmt']) {
        try {
            const mod = (await import(/* @vite-ignore */ specifier)) as { format?: FormatFn };
            if (typeof mod.format === 'function') return mod.format;
        } catch {
            // Try the next specifier.
        }
    }
    return undefined;
}

/** Format generated source with Oxfmt; returns it unchanged when unavailable. */
export async function formatGenerated(
    source: string,
    options: FormatGeneratedOptions = {}
): Promise<string> {
    const format = await resolveFormat();
    if (!format) return source;
    try {
        const { code } = await format(options.fileName ?? 'generated.ts', source, {
            ...GENERATED_FORMAT_OPTIONS,
            ...options.options,
        });
        return code;
    } catch {
        return source;
    }
}
