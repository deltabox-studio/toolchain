import { defineConfig } from 'tsdown';

// Import the base config from source: the integration job builds the extension
// without a prior workspace build, so the `@deltabox/toolchain-tsdown` dist may
// not exist yet.
import { baseTsdownConfig } from '../tsdown/src/config/node.js';

/**
 * The VS Code extension host loads a CommonJS entry (`main`), and the `vscode`
 * module is provided by the host (never bundled).
 */
export default defineConfig({
    ...baseTsdownConfig,
    entry: { extension: 'src/extension.ts' },
    format: ['cjs'],
    fixedExtension: true,
    dts: false,
    minify: false,
    sourcemap: true,
    publint: false,
    exports: false,
    deps: {
        ...baseTsdownConfig.deps,
        neverBundle: [/(^node:)|\/tests\/|node_modules/, /^vscode$/],
    },
});
