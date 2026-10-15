import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from './src/config/node.js';

export default defineConfig({
    ...baseTsdownConfig,
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
        'config/node': 'src/config/node.ts',
    },
});
