// dbx() plugin mode: the shared pack config uses `vp pack`.
import { defineConfig } from 'vite-plus';

import { workspaceViteConfig } from '../../scripts/workspace-vite.js';

export default defineConfig(
    workspaceViteConfig({
        entry: {
            index: 'src/index.ts',
            bin: 'src/bin.ts',
            run: 'src/run.ts',
            'cli/index': 'src/cli/index.ts',
        },
        // Yarn normalises a single-entry `bin` object to a plain string on
        // install, so let Yarn own the field: `bin: false` stops the pack build
        // from writing the object form back.
        exports: { enabled: true, bin: false },
    })
);
