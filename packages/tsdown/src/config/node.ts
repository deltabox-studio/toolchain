import fs from 'node:fs';

import { globalLogger, type UserConfig } from 'tsdown';

import { sort } from '@deltabox/toolchain-shared';

/**
 * Sort a package.json's `exports` keys in place (`./types` after the root,
 * `./package.json` last). Returns whether the file was rewritten.
 */
export function sortPackageExports(packageJsonPath: string): boolean {
    const raw = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
        exports?: unknown;
    };
    if (!raw.exports || typeof raw.exports !== 'object') return false;
    const sorted = sort(raw.exports as Record<string, unknown>);
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
export const baseTsdownConfig: UserConfig = {
    format: ['esm'],
    platform: 'node',
    fixedExtension: false,
    deps: { neverBundle: [/(^node:)|\/tests\/|node_modules/] },
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

/**
 * Create a tsdown config by merging the base config with per-project overrides
 * and an optional branded post banner.
 */
export function createTsdownConfig(
    overrides: UserConfig = {},
    banner?: PostBannerOptions
): UserConfig {
    const config: UserConfig = { ...baseTsdownConfig, ...overrides };
    if (banner) {
        config.outputOptions = {
            ...baseTsdownConfig.outputOptions,
            ...overrides.outputOptions,
            postBanner: createPostBanner(banner),
        };
    }
    return config;
}
