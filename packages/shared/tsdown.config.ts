import { defineConfig, type UserConfig } from 'tsdown';

/**
 * The `shared` package is the leaf of the workspace graph, so it cannot use the
 * `@deltabox/toolchain-tsdown` base config (that package depends on `shared`).
 * This is the same base, kept inline to avoid the cycle.
 */
export default defineConfig({
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
} satisfies UserConfig);
