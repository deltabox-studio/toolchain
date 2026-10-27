# Providers

Provider passthrough commands (Vite+) follow the logger's colour setting. The
`providers` section can force provider colours on or off on its own:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        providers: { color: false },
    },
});
```

| Option  | Values            | Default        |
| ------- | ----------------- | -------------- |
| `color` | `true` \| `false` | inherit logger |

`color: false` runs the wrapped binary with `NO_COLOR=1` and `FORCE_COLOR=0`, so
it emits plain output even on a colour terminal. The global CLI `--no-color`
flag turns provider colour off too. See [Providers](/guide/providers#colour).
