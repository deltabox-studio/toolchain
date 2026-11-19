// dbx() plugin mode: the shared pack config uses `vp pack`.
import { defineConfig } from 'vite-plus';

import { workspaceViteConfig } from '../../scripts/workspace-vite.js';

export default defineConfig(
    workspaceViteConfig({
        entry: { index: 'src/index.ts', 'cli/index': 'src/cli/index.ts' },
        alwaysBundle: [/^@deltabox\/toolchain[-\/](shared|tsconfig|core)/],
    })
);
