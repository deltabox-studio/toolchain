# Programmatic API

Every surface the CLI and the extension use is also importable. The umbrella
package re-exports the config model + sync runner and every workspace package, so
a consumer can import the whole surface from the root or a single package through
a subpath.

## Where to start

- [Umbrella (`@deltabox/toolchain`)](/guide/api/umbrella) — the root exports and
  the namespaced packages.
- [Subpath exports](/guide/api/subpath-exports) — the per-package entry points.
- [Package reference](/guide/api/package-reference) — every package's public
  exports.
- [Logging](/guide/api/logging) — the shared logger.
- [Examples](/guide/api/examples) — short, copy-pasteable recipes.
- [Registering commands](/guide/api/registering-commands) — wire
  `ToolchainCommand[]` onto a commander program.

```ts
import { defineConfig, loadToolchainConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```
