# Programmatic API

Every surface the CLI and the extension use is also importable. The umbrella
package re-exports the config model + sync runner, and each area has a subpath.

## Umbrella (`@deltabox/toolchain`)

```ts
import {
    defineConfig, // identity helper (typed config)
    loadToolingConfig, // load dbx.config.* + resolve tokens/project type
    runSync, // run the sync tasks
    defaultSyncTasks, // the default task list (changelog, biome, tsconfig, vscode)
    sectionEnabled, // opt-in-by-presence helpers
    sectionConfig,
    resolveTokens,
} from '@deltabox/toolchain';
```

```ts
const { config, tokens, projectType } = await loadToolingConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

## Subpaths

| Import                          | Exports                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `@deltabox/toolchain/cli`       | `registerToolingCommands`, `builtinCommands`, `createCli`, `runCli`.              |
| `@deltabox/toolchain/core`      | `loadToolingConfig`, `runSync`, the project graph, manifest, watch.               |
| `@deltabox/toolchain/config`    | `createConfigEngine`, the generators, `configCommands`.                           |
| `@deltabox/toolchain/vite`      | `resolveVp`, `runVp`, `hasVp`, `viteProvider`, `viteCommands`, `VP_COMMANDS`.     |
| `@deltabox/toolchain/migrate`   | `migrations`, `detectMigrations`, `runMigration`, `diffFiles`, `mergeViteConfig`. |
| `@deltabox/toolchain/template`  | `loadTemplates`, `scaffoldTemplate`, `addTemplateSource`, `removeTemplateSource`. |
| `@deltabox/toolchain/providers` | `toolingProviders`, `providerActions`.                                            |
| `@deltabox/toolchain/tsdown`    | `baseTsdownConfig`, `createTsdownConfig`, `createPostBanner`, `cleanup`.          |
| `@deltabox/toolchain/tsconfig`  | `tsconfigSyncTask` + the tsconfig templates.                                      |
| `@deltabox/toolchain/changelog` | `changelogSyncTask` + the workflow/commitlint builders.                           |
| `@deltabox/toolchain/biome`     | `biomeSyncTask`, `biomeVscodeSettings`.                                           |
| `@deltabox/toolchain/project`   | `createRootProjectFiles`, `createMonorepoRootFiles`, `createWorkspaceFiles`.      |
| `@deltabox/toolchain/shared`    | the config model, provider model, template engine, `run`/`spawnCross`.            |

## Examples

```ts
// Vite+ provider
import { resolveVp, runVp } from '@deltabox/toolchain/vite';
await runVp(['check'], { cwd: process.cwd() });

// Migrations
import { detectMigrations, runMigration } from '@deltabox/toolchain/migrate';
for (const m of detectMigrations(process.cwd())) await m.run({ cwd: process.cwd(), write: true });

// Templates
import { loadTemplates, scaffoldTemplate } from '@deltabox/toolchain/template';
const [template] = await loadTemplates({ cwd: process.cwd() });
if (template) await scaffoldTemplate(template, { cwd: './out', tokens: { name: 'acme' } });

// Providers (what the editor reads)
import { toolingProviders } from '@deltabox/toolchain/providers';
console.log(toolingProviders().map(p => p.id));

// Config engine
import { createConfigEngine } from '@deltabox/toolchain/config';
```

## Registering commands

Packages export framework-agnostic `ToolingCommand[]` descriptors; wire them onto
a commander program with `registerToolingCommands` (this is how the bundled
`dbx` binary, and a consumer's own CLI, are assembled):

```ts
import { Command } from 'commander';

import { registerToolingCommands } from '@deltabox/toolchain/cli';
import { configCommands } from '@deltabox/toolchain/config';

const program = new Command();
registerToolingCommands(program, configCommands({ engine }));
await program.parseAsync();
```
