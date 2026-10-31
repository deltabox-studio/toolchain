# Hooks

`.ts`/`.js` configs can declare lifecycle hooks (JSON cannot):

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        hooks: {
            afterLoad: ({ tokens }) => console.log(tokens),
            beforeSync: ctx => ctx.log('syncing…'),
            afterTask: ({ task, files }) => console.log(task.name, files?.length),
            afterSync: ({ result }) => console.log(result.written.length),
            onChange: ({ path }) => console.log('changed', path),
        },
    },
});
```

Return values are awaited.
