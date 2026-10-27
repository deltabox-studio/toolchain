# Logging

Every toolchain message goes through one level-aware logger, rendered with
[`@clack/prompts`](https://bombshell.dev/clack) (level symbols + guide). Use it
instead of `console.log` so output stays consistent and respects the config and
the CLI flags.

| Export / member                                   | Description                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `logger`                                          | The active singleton: `raw`, `debug`, `info`, `success`, `warn`, `error`, `level`, `colors`. |
| `createLogger(options)`                           | Create an independent logger (`level`, `color`, `name`).                                     |
| `setLogConfig(section)`                           | Apply the `logger` section from the loaded config.                                           |
| `setLogOverrides(options)`                        | Apply CLI overrides (win over the config). `configureLogger` is an alias.                    |
| `getLogOverrides()` / `getLogger()`               | Read the current overrides / the active instance.                                            |
| `LOG_LEVELS` / `isLogLevel` / `normalizeLogLevel` | The valid levels, most verbose first (`debug`, `info`, `warn`, `error`, `silent`).           |

```ts
import { createLogger, logger, setLogConfig, setLogOverrides } from '@deltabox/toolchain/shared';

setLogConfig({ level: 'debug', color: false, name: 'dbx' }); // from dbx.config.*
setLogOverrides({ level: 'warn' }); // from --log-level

logger.info('human message');
logger.success('done');
logger.error('failed');
logger.raw(JSON.stringify(payload)); // machine output: no prefix, no colour
```

Use `raw` for machine output (`--json`): it is never prefixed or decorated.
`logger.warn`/`error` write to stderr; `debug`/`info`/`success`/`raw` to stdout.
Messages that start with whitespace (indented continuations) are never prefixed.

This mirrors the [`logger` config section](/guide/config/logging) and the
`--log-level <level>` / `--no-color` [CLI flags](/guide/cli#global-flags), which
call `setLogConfig` / `setLogOverrides` under the hood.
