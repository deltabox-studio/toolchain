import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '../tsdown/src/config/node.js';
import { workspacePackageAliases } from '../tsdown/src/config/workspace.js';

export default defineConfig({
    ...baseTsdownConfig,
    alias: workspacePackageAliases(),
    entry: {
        index: 'src/index.ts',
        bin: 'src/bin.ts',
        run: 'src/run.ts',
        'cli/index': 'src/cli/index.ts',
    },
    deps: {
        ...baseTsdownConfig.deps,
        neverBundle: [/(^node:)|\/tests\/|node_modules/, /^@deltabox\/toolchain\//],
        alwaysBundle: [/^@deltabox\/toolchain[-\/]shared/],
    },
    // Yarn normalises a single-entry `bin` object to a plain string on install,
    // so let Yarn own the field: `bin: false` stops tsdown from writing the
    // object form back (which made install and build fight over package.json).
    exports: { enabled: true, bin: false },
});
