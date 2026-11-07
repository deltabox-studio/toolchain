# Config file names

The loader looks for, in order:

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
