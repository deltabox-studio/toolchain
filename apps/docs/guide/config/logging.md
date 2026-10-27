# Logging

Every toolchain message goes through one logger. Configure it in the config:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false, name: 'dbx' },
    },
});
```

| Option  | Values                                             | Default |
| ------- | -------------------------------------------------- | ------- |
| `level` | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info`  |
| `color` | `true` \| `false`                                  | `true`  |
| `name`  | prefix for non-indented lines                      | `dbx`   |

Colour is **on by default** (the toolchain forces it rather than relying on TTY
autodetection); `--no-color` or `logger: { color: false }` turn it off. Human
output is rendered with [`@clack/prompts`](https://bombshell.dev/clack) — level
symbols (`•` info, `◆` success, `▲` warn, `■` error) and a guide.

On the CLI, `--log-level <level>` and `--no-color` override the config (see the
[CLI reference](/guide/cli)). Machine output (`--json`) is written unprefixed
through the same logger.
