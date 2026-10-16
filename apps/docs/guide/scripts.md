# Package scripts

`dbx` writes files, not your `package.json` — but a few scripts are worth
standardizing, because the toolchain's formatting/linting and task running both
go through **Vite+**. Instead of invoking `vp` directly, drive it through `dbx`:
`dbx vite <command>` forwards every operand to the Vite+ CLI, so a project only
needs one command (`dbx`). This page shows the recommended root scripts and how
to move an existing Biome + Turbo project onto them.

## Recommended scripts

The repo root `package.json`:

```json
{
    "scripts": {
        "format": "dbx vite fmt",
        "lint": "dbx vite lint --fix",
        "check": "dbx vite check",
        "build": "dbx vite run -r build",
        "typecheck": "dbx vite run -r typecheck",
        "test": "dbx vite run -r test",
        "dbx:sync": "dbx sync",
        "dbx:watch": "dbx watch",
        "commitlint": "commitlint",
        "prepare": "husky"
    }
}
```

| Script                         | What it does                                                    |
| ------------------------------ | --------------------------------------------------------------- |
| `format` / `lint` / `check`    | Oxfmt / Oxlint across the repo (`check` = format check + lint). |
| `build` / `typecheck` / `test` | Runs the task in every workspace, in dependency order.          |
| `dbx:sync` / `dbx:watch`       | Regenerate the managed files / re-sync on change.               |
| `commitlint` / `prepare`       | Conventional Commits via commitlint + husky.                    |

Notes:

- `dbx vite <command>` is a passthrough to Vite+ (`vp`), so the whole Vite+ CLI
  is reachable through `dbx` — eg. `dbx vite dev`, `dbx vite run -r build`,
  `dbx vite add zod`. The named aliases (`dbx vite:build`) are the same thing.
- `vp` resolves from the **repo root**, so `format`/`lint` live there — keep them
  out of the individual workspaces.
- `dbx vite run -r <task>` runs a task in every workspace package in dependency
  order. A task is either a `package.json` script or a `vite.config.ts`
  `run.tasks` entry. For long-running processes use
  `dbx vite run -r --parallel dev`.
- `dbx` is the toolchain binary, so `yarn dbx <cmd>` (eg. `yarn dbx sync`) works
  even without a script; the `dbx:*` aliases are just for discoverability.

## Migrate an existing project

1. Add the toolchain + Vite+, and drop what they replace:

    ```diff
    -    "@biomejs/biome": "catalog:",
    -    "turbo": "^2.11.2",
    +    "@deltabox/toolchain": "^1.2.3",
    +    "vite-plus": "^1.2.0",
    ```

2. Fold the Biome config into a root `vite.config.ts`:

    ```bash
    dbx migrate --from biome --target vite --write
    ```

3. Replace the scripts (see the tables below), then delete `biome.json` and
   `turbo.json`.

4. Add a `dbx.config.ts` and sync the managed files:

    ```bash
    dbx sync
    ```

5. Verify — this is what CI runs:

    ```bash
    dbx sync --check
    yarn build
    ```

### Biome → Ox

| Before                   | After                 |
| ------------------------ | --------------------- |
| `biome format --write .` | `dbx vite fmt`        |
| `biome check --fix .`    | `dbx vite lint --fix` |
| `biome.json`             | `vite.config.ts`      |

Remove `@biomejs/biome`, delete `biome.json`, and drop any per-workspace
`format`/`lint` scripts.

### Turbo → Vite Task

| Before            | After                                      |
| ----------------- | ------------------------------------------ |
| `turbo build`     | `dbx vite run -r build`                    |
| `turbo typecheck` | `dbx vite run -r typecheck`                |
| `turbo test`      | `dbx vite run -r test`                     |
| `turbo dev`       | `dbx vite run -r --parallel dev`           |
| `turbo.json`      | (optional) `run.tasks` in `vite.config.ts` |

Remove `turbo` and `turbo.json`. Ordering comes from each package's
`package.json` dependencies, so no `turbo.json` graph is needed.

## Per-workspace tasks

For cached, dependency-aware tasks, define them in each package's
`vite.config.ts` rather than `package.json` — a task and a script cannot share a
name:

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
    run: {
        tasks: {
            build: {
                command: 'tsdown --config-loader unrun',
                cache: { input: [{ auto: true }, '!dist/**'], output: ['dist/**'] },
            },
            test: {
                command: 'vitest run',
                cache: { input: [{ auto: true }], output: [] },
            },
        },
    },
});
```

See the [Monorepo guide](/guide/monorepo) for the full task setup,
[Migrations](/guide/migrations) for the `dbx migrate` reference, and
[Providers (Vite+)](/guide/providers) for the `dbx vite:*` passthroughs.
