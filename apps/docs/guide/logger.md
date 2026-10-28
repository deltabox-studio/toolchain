# Logger

Every toolchain message goes through one logger, so output stays consistent and
respects a single configuration. The `logger` section controls its level,
colours and prefix.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false, name: 'dbx' },
    },
});
```

## Options

| Option     | Type                                               | Default | Description                                            |
| ---------- | -------------------------------------------------- | ------- | ------------------------------------------------------ |
| `level`    | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info`  | Minimum level to print.                                |
| `color`    | `boolean`                                          | `true`  | Force colours on/off.                                  |
| `name`     | `string`                                           | `dbx`   | Prefix for non-indented lines.                         |
| `suppress` | `string \| string[]`                               | none    | Silence warnings/errors by id, substring or `/regex/`. |
| `logger`   | `ToolchainLogger`                                  | none    | Custom logger implementation.                          |

Colour is **on by default** (the toolchain forces it rather than relying on TTY
autodetection); `--no-color` or `logger: { color: false }` turn it off. Human
output is rendered with [`@clack/prompts`](https://bombshell.dev/clack) — level
symbols (`•` info, `◆` success, `▲` warn, `■` error) and a guide.

## Custom logger

`logger.logger` accepts a `ToolchainLogger` (`raw`, `rawError`, `write`, `debug`,
`info`, `success`, `warn`, `error`). The toolchain still applies `level` and
`suppress` before delegating, so a custom sink receives only visible messages.

```ts [dbx.config.ts]
toolchain: {
    logger: {
        logger: {
            raw: m => process.stdout.write(`${m}\n`),
            rawError: m => process.stderr.write(`${m}\n`),
            write: () => {},
            debug: () => {},
            info: m => sink.info(m),
            success: m => sink.info(m),
            warn: m => sink.warn(m),
            error: m => sink.error(m),
        },
    },
}
```

## CLI overrides

| Flag                | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `--log-level <lvl>` | Minimum level: `debug`, `info`, `warn`, `error`, `silent`. |
| `--color`           | Force coloured output (the default).                       |
| `--no-color`        | Disable coloured output.                                   |

They win over the config and may appear before or after the subcommand.

## Machine output

`--json` (and provider passthroughs) write raw, unprefixed, undecorated output
through the same logger (`logger.raw`), so it is safe to pipe into `jq` or
another tool.

## Providers

Provider passthrough commands (Vite+) follow the logger's colour setting, and the
[`providers`](/guide/providers#colour) section can force provider colours on or
off independently. `color: false` runs the wrapped binary with `NO_COLOR=1` and
`FORCE_COLOR=0`.

## Programmatic API

```ts
import {
    configureLogger,
    createLogger,
    getLogger,
    isLogLevel,
    logger,
    normalizeLogLevel,
    setLogConfig,
    setLogOverrides,
} from '@deltabox/toolchain/shared';
```

| Export                             | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `logger`                           | The active logger (delegates to the current instance). |
| `createLogger(options?)`           | Build a logger with explicit options.                  |
| `setLogConfig(section)`            | Apply the `logger` config section.                     |
| `setLogOverrides(options)`         | Apply CLI overrides (win over the config).             |
| `configureLogger(options?)`        | Alias for `setLogOverrides`.                           |
| `isLogLevel` / `normalizeLogLevel` | Validate/coerce a level.                               |

Use `logger.info` for human messages and `logger.raw` for machine output; avoid
`console.log` so output stays consistent and respects the config and CLI flags.
