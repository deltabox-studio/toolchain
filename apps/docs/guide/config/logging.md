# Logging

Every toolchain message goes through one logger. Configure it in the config:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false, name: 'dbx' },
    },
});
```

| Option     | Values                                             | Default |
| ---------- | -------------------------------------------------- | ------- |
| `level`    | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info`  |
| `color`    | `true` \| `false`                                  | `true`  |
| `name`     | prefix for non-indented lines                      | `dbx`   |
| `suppress` | id, message substring or `/regex/` (single/array)  | none    |
| `logger`   | custom `ToolchainLogger` implementation            | none    |

`suppress` silences matching warnings/errors. A string matches an emitted id
exactly or a message substring; a `/pattern/flags` string is treated as a regex.
Ids are rendered in uppercase in the output (eg. `[FMT_CONFLICT]`), but match
the lowercase id when suppressing. It accepts one value or an array:

```ts [dbx.config.ts]
toolchain: {
    logger: {
        suppress: ['fmt.conflict', 'deprecated option', '/^Could not .* globally/'],
    },
}
```

Colour is **on by default** (the toolchain forces it rather than relying on TTY
autodetection); `--no-color` or `logger: { color: false }` turn it off. Human
output is rendered with [`@clack/prompts`](https://bombshell.dev/clack) — level
symbols (`•` info, `◆` success, `▲` warn, `■` error) and a guide.

### Custom logger

Pass any object implementing the agnostic `ToolchainLogger` interface
(`raw`, `rawError`, `write`, `debug`, `info`, `success`, `warn`, `error`) to
`logger.logger`. Level/suppression checks still apply before your methods run.

```ts [dbx.config.ts]
const custom = {
    raw: (message = '') => process.stdout.write(`${message}\n`),
    rawError: (message = '') => process.stderr.write(`${message}\n`),
    write: () => {},
    debug: () => {},
    info: (message = '') => mySink.info(message),
    success: (message = '') => mySink.info(message),
    warn: (message = '') => mySink.warn(message),
    error: (message = '') => mySink.error(message),
};

export default defineConfig({
    toolchain: { logger: { logger: custom } },
});
```

On the CLI, `--log-level <level>` and `--no-color` override the config (see the
[CLI reference](/guide/cli)). Machine output (`--json`) is written unprefixed
through the same logger.
