import { globalLogger, type UserConfig } from 'tsdown';

import { sort } from '@deltabox/toolchain-shared';

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
                if (!ctx.options.pkg?.exports) return;
                if (typeof ctx.options.pkg.exports !== 'object') return;

                const { packageJsonPath: _packageJsonPath, ...pkgJson } = ctx.options.pkg;

                const sorted = sort(pkgJson.exports as Record<string, unknown>);

                const {
                    '.': indexField,
                    './': rootField = indexField,
                    './types': typesField,
                    './package.json': pkgField,
                    ...rest
                } = sorted as Record<string, unknown>;

                pkgJson.exports = {
                    ...(rootField ? { '.': rootField } : {}),
                    ...(typesField ? { './types': typesField } : {}),
                    ...rest,
                    ...(pkgField ? { './package.json': pkgField } : {}),
                };

                globalLogger.success('package.json exports keys sorted!');
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
