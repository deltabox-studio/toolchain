import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from './src/config/node.js';
import { workspacePackageAliases } from './src/config/workspace.js';

export default defineConfig({
    ...baseTsdownConfig,
    alias: workspacePackageAliases(),
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
        'config/node': 'src/config/node.ts',
    },
    deps: {
        ...baseTsdownConfig.deps,
        neverBundle: [/(^node:)|\/tests\/|node_modules/, /^@deltabox\/toolchain\//],
        alwaysBundle: [/^@deltabox\/toolchain[-\/]/],
    },
});
