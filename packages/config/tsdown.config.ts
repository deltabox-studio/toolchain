import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '../tsdown/src/config/node.js';
import { workspacePackageAliases } from '../tsdown/src/config/workspace.js';

export default defineConfig({
    ...baseTsdownConfig,
    alias: workspacePackageAliases(),
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
        'generators/index': 'src/generators/index.ts',
    },
    deps: {
        ...baseTsdownConfig.deps,
        neverBundle: [/(^node:)|\/tests\/|node_modules/, /^@deltabox\/toolchain\//],
        alwaysBundle: [/^@deltabox\/toolchain[-\/]shared/],
    },
});
