# Umbrella (`@deltabox/toolchain`)

The root re-exports `@deltabox/toolchain-core` and `@deltabox/toolchain-shared`
**directly**, and exposes the remaining packages as **namespaces** plus the sync
runner:

```ts
import {
    // identity helper (typed config)
    defineConfig,
    // config + sync
    loadToolchainConfig,
    runSync,
    runWatch,
    defaultSyncTasks,
    // opt-in-by-presence helpers
    sectionEnabled,
    sectionConfig,
    resolveTokens,
    // logging
    logger,
    createLogger,
    // ignore-list defaults
    DEFAULT_IGNORE_PATTERNS,
    DEFAULT_FMT_IGNORE_PATTERNS,
    DEFAULT_LINT_IGNORE_PATTERNS,
} from '@deltabox/toolchain';
// The other packages are namespaced:
import {
    biome,
    changelog,
    config,
    core,
    project,
    shared,
    tsconfig,
    tsdown,
} from '@deltabox/toolchain';
```

```ts
const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```
