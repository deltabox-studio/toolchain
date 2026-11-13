import fs from 'node:fs';

import { globalLogger, type PackUserConfig } from 'vite-plus/pack';

import {
    createNodeModulesLeakReporter,
    NODE_MODULES_LEAK_REPORTER,
    type NodeModulesLeakReporterOptions,
} from './reporter.js';

/** Sort an object's keys alphabetically (kept local to avoid a runtime dep). */
function sortKeys<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) as T;
}

/** Normalize a `plugins` option to an array (tsdown accepts a single plugin too). */
function pluginArray(plugins: PackUserConfig['plugins']): unknown[] {
    if (!plugins) return [];
    return Array.isArray(plugins) ? plugins : [plugins];
}

/** Whether a plugin is the base absolute-node_modules leak reporter. */
function isLeakReporter(plugin: unknown): boolean {
    return Boolean(
        plugin &&
        typeof plugin === 'object' &&
        'name' in plugin &&
        (plugin as { name?: unknown }).name === NODE_MODULES_LEAK_REPORTER
    );
}

/**
 * Sort a package.json's `exports` keys in place (`./types` after the root,
 * `./package.json` last). Returns whether the file was rewritten.
 */
export function sortPackageExports(packageJsonPath: string): boolean {
    const raw = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
        exports?: unknown;
    };
    if (!raw.exports || typeof raw.exports !== 'object') return false;
    const sorted = sortKeys(raw.exports as Record<string, unknown>);
    const {
        '.': indexField,
        './': rootField = indexField,
        './types': typesField,
        './package.json': pkgField,
        ...rest
    } = sorted as Record<string, unknown>;
    raw.exports = {
        ...(rootField ? { '.': rootField } : {}),
        ...(typesField ? { './types': typesField } : {}),
        ...rest,
        ...(pkgField ? { './package.json': pkgField } : {}),
    };
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(raw, null, 4)}\n`, 'utf-8');
    return true;
}

/**
 * The shared tsdown base configuration. Kept project-agnostic: the ASCII/banner
 * branding is opt-in via {@link createPostBanner} and consumer metadata.
 */
export const baseTsdownConfig: PackUserConfig = {
    format: ['esm'],
    platform: 'node',
    fixedExtension: false,
    deps: {
        neverBundle: [/(^node:)|\/tests\/|node_modules/],
        // Declarations must never resolve a package to an absolute
        // `node_modules` path. Keep npm specifiers external **as written** in
        // the dts build; JS bundling keeps the path-based rule above.
        dts: { neverBundle: true },
    },
    dts: { generator: 'tsgo' },
    minify: true,
    tsconfig: 'tsconfig.build.json',
    publint: true,
    sourcemap: false,
    clean: true,
    shims: true,
    exports: true,
    outputOptions: {
        assetFileNames: '_assets/[name][extname]',
        chunkFileNames: '_chunks/[name]-[hash].js',
    },
    plugins: [createNodeModulesLeakReporter()],
    hooks: {
        'build:done': ctx => {
            try {
                if (process.env.NODE_ENV === 'development') return;
                const packageJsonPath = ctx.options.pkg?.packageJsonPath;
                if (!packageJsonPath) return;
                if (sortPackageExports(packageJsonPath)) {
                    globalLogger.success('package.json exports keys sorted!');
                }
            } catch (e) {
                globalLogger.error('Failed to sort package.json exports keys:', e);
            }
        },
    },
};

/** Options for a branded tsdown "post banner". */
export interface PostBannerOptions {
    /** The project/package name (eg. `Proxified`). */
    name?: string;
    /** The version to embed. */
    version?: string;
    /** The license identifier. */
    license?: string;
    /** The project homepage. */
    homepage?: string;
    /** A custom multi-line ASCII banner. */
    banner?: string;
    /** A custom copyright line. */
    copyright?: string;
}

/**
 * Build tsdown's `outputOptions.postBanner` hook from project metadata so the
 * consumer's branding (name, version, license, ASCII art) is applied generically.
 */
export function createPostBanner(
    options: PostBannerOptions = {}
): (ctx: { fileName: string }) => string {
    const { name, version, license, homepage, banner, copyright } = options;
    return (ctx: { fileName: string }) => {
        const body: string[] = [];
        if (banner) body.push(...banner.split('\n'));
        body.push(ctx.fileName);
        if (name) body.push(`Source code for ${name}${version ? ` v${version}` : ''}.`);
        if (license) body.push(`Released under the ${license} License.`);
        if (homepage) body.push(homepage);
        body.push('', `© ${copyright ?? 'deltabox'}. All rights reserved.`, '');
        return `/*\n${body.map(line => ` * ${line}`).join('\n')} */\n`;
    };
}

/** Options for {@link createTsdownConfig} beyond the pack config and banner. */
export interface CreateTsdownConfigOptions {
    /**
     * Configure the absolute `node_modules` leak reporter, or `false` to remove
     * it. Defaults to `{ level: 'error' }`.
     */
    nodeModulesLeakReporter?: NodeModulesLeakReporterOptions | false;
}

/**
 * Create a tsdown config by merging the base config with per-project overrides
 * and an optional branded post banner.
 */
export function createTsdownConfig(
    overrides: PackUserConfig = {},
    banner?: PostBannerOptions,
    options: CreateTsdownConfigOptions = {}
): PackUserConfig {
    const config: PackUserConfig = { ...baseTsdownConfig, ...overrides };
    if (banner) {
        config.outputOptions = {
            ...baseTsdownConfig.outputOptions,
            ...overrides.outputOptions,
            postBanner: createPostBanner(banner),
        };
    }

    // Keep the base reporter (reconfigured, or removed) and append consumer
    // plugins instead of letting `overrides.plugins` silently replace it.
    const basePlugins = pluginArray(baseTsdownConfig.plugins).filter(
        plugin => !isLeakReporter(plugin)
    );
    const reporter =
        options.nodeModulesLeakReporter === false
            ? undefined
            : createNodeModulesLeakReporter(options.nodeModulesLeakReporter);
    const extraPlugins = pluginArray(overrides.plugins);
    const plugins = [...basePlugins, ...(reporter ? [reporter] : []), ...extraPlugins];
    if (plugins.length > 0) config.plugins = plugins as PackUserConfig['plugins'];
    else delete config.plugins;

    return config;
}
