# `defineConfig`

`defineConfig` is an identity helper that gives the file full type-checking and
autocomplete (it mirrors Vite's `defineConfig`). Like Vite, the argument may be a
plain object, a promise, or a sync/async callback — the loader resolves it, so a
config can do async work before returning `{ toolchain }`:

```ts [dbx.config.ts]
export default defineConfig(async () => {
    const { readFile } = await import('node:fs/promises');
    const version = (await readFile('./VERSION', 'utf-8')).trim();

    return {
        toolchain: {
            project: { name: 'acme', nodeVersion: version },
        },
    };
});
```
