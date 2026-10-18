import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from '@deltabox/toolchain-tsdown';

export default defineConfig({
    ...baseTsdownConfig,
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
        'cli/generate/index': 'src/cli/generate/index.ts',
    },
    deps: { ...baseTsdownConfig.deps, alwaysBundle: [/^@deltabox\/toolchain-shared/] },
    // Name the bin explicitly so tsdown never derives it from the package name
    // (the default soft auto-detect), which keeps package.json stable across builds.
    exports: { enabled: true, bin: { 'toolchain-tsconfig': 'src/cli/generate/index.ts' } },
});
