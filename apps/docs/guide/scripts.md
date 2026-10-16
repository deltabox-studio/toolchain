# Package scripts

`dbx` writes files, not your `package.json` — but a few scripts are worth
standardizing, because the toolchain's formatting/linting and task running both
go through **Vite+** (`vp`). This page shows the recommended root scripts and how
to move an existing Biome + Turbo project onto them.

## Recommended scripts

The repo root `package.json`:

```json
{
    "scripts": {
        "format": "vp fmt",
        "lint": "vp lint --fix",
        "check": "vp check",
        "build": "vp run -r build",
        "typecheck": "vp run -r typecheck",
        "test": "vp run -r test",
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

- `vp` resolves only from the **repo root**, so `format`/`lint` live there — keep
  them out of the individual workspaces.
- `vp run -r <task>` runs a task in every workspace package in dependency order.
  A task is either a `package.json` script or a `vite.config.ts` `run.tasks`
  entry. For long-running processes use `vp run -r --parallel dev`.
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

| Before                   | After            |
| ------------------------ | ---------------- |
| `biome format --write .` | `vp fmt`         |
| `biome check --fix .`    | `vp lint --fix`  |
| `biome.json`             | `vite.config.ts` |

Remove `@biomejs/biome`, delete `biome.json`, and drop any per-workspace
`format`/`lint` scripts (they cannot resolve `vp`).

### Turbo → Vite Task

| Before            | After                                      |
| ----------------- | ------------------------------------------ |
| `turbo build`     | `vp run -r build`                          |
| `turbo typecheck` | `vp run -r typecheck`                      |
| `turbo test`      | `vp run -r test`                           |
| `turbo dev`       | `vp run -r --parallel dev`                 |
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
