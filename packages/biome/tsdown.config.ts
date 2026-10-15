import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '@deltabox/toolchain-tsdown';

export default defineConfig({
    ...baseTsdownConfig,
    entry: { index: 'src/index.ts' },
    deps: { ...baseTsdownConfig.deps, alwaysBundle: [/^@deltabox\/tooling-shared/] },
});
