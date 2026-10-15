import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '@deltabox/toolchain-tsdown';

export default defineConfig({
    ...baseTsdownConfig,
    entry: { index: 'src/index.ts', run: 'src/run.ts', 'cli/index': 'src/cli/index.ts' },
    deps: { ...baseTsdownConfig.deps, alwaysBundle: [/^@deltabox\/tooling-shared/] },
});
