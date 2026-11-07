# Programmatic API

```ts
import { loadToolchainConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

`loadToolchainConfig` accepts `loaderTsconfig` to override the tsconfig used to
import the config (the same option as [`toolchain.loader.tsconfig`](/guide/config/loader)):

```ts
const loaded = await loadToolchainConfig(process.cwd(), {
    loaderTsconfig: 'tsconfig.loader.json', // or false
});
```

The result also reports `configless` and `managed`, which tell whether the
project has no config of its own and whether the toolchain should manage it.

Full section reference: [dbx.config](/config/reference).
