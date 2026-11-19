# Config file names

A `dbx.config.*` file is **optional**: the recommended setup carries the config
inline in the `dbx()` Vite plugin inside `vite.config.*`. When a project uses a
config file, the loader looks for, in order:

```
dbx.config.ts
dbx.config.mts
dbx.config.js
dbx.config.mjs
dbx.config.cjs
dbx.config.json
```

A TS/JS config is imported through `tsx` with the nearest `tsconfig.json`, so
it can use the project's path aliases and `.js` specifiers that point at `.ts`
sources. See [Loader](/guide/config/loader) for the `toolchain.loader` section,
custom tsconfigs and examples.
