import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '@deltabox/toolchain-tsdown';

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
    publint: false,
    exports: false,
    deps: {
        ...baseTsdownConfig.deps,
        neverBundle: [/(^node:)|\/tests\/|node_modules/, /^vscode$/],
    },
});
