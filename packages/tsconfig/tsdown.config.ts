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
    // Yarn normalises a single-entry `bin` object to a plain string on install,
    // so let Yarn own the field: `bin: false` stops tsdown from writing the
    // object form back (which made install and build fight over package.json).
    exports: { enabled: true, bin: false },
});
