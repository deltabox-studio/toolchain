# Configuration

A project is driven by a single `dbx.config.ts`:

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: {
            type: 'monorepo-root',
            name: 'acme',
            scope: '@acme',
        },
        ci: {
            ci: true,
            changelog: {
                branches: { main: 'main', dev: 'dev' },
                commitlint: { scopes: ['api', 'web', 'deps'] },
            },
        },
        tsconfig: { refs: true },
        fmt: { vscode: true, oxc: { semi: true, singleQuote: true } },
        lint: { oxc: { ignorePatterns: ['dist/**'] } },
        vite: {
            test: { include: ['src/**/*.test.ts'] },
        },
        watch: { debounce: 150 },
    },
});
```

The `@deltabox/toolchain` settings live under the `toolchain` key, so a
`dbx.config.ts` can host other dbx concerns alongside it.

Each section has its own guide: [Project](/guide/project), [CI +
Changelog](/guide/changelog/), [tsconfig](/guide/tsconfig),
[Formatting & linting](/guide/formatting), [Biome](/guide/biome),
[Vite+](/guide/vite), [Watch](/guide/watch), [Logger](/guide/logger) and
[Providers](/guide/providers).

## Where to start

- [Opt-in by presence](/guide/config/opt-in-by-presence) — which sections run, and
  how nested sections like `ci.changelog` and the individual workflows opt in.
- [Nested configs](/guide/config/nested-configs) — how a workspace config merges
  over its root.
- [`defineConfig`](/guide/config/defineconfig) — object, promise or callback.
- [Config file names](/guide/config/config-file-names) — the file names the loader
  probes.
- [Hooks](/guide/config/hooks) — lifecycle hooks in a `.ts`/`.js` config.
- [Logging](/guide/config/logging) — the logger section and CLI overrides.
- [Providers](/guide/config/providers) — provider passthrough colour settings.
- [Vite+](/guide/config/vite) — the full Vite+ config and the generated shim.
- [Programmatic API](/guide/config/programmatic-api) — load + sync from code.

The generated, exhaustive section reference is [dbx.config](/config/reference).
