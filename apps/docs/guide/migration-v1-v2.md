# Migrating from v1 to v2

v2 focuses on a smaller, schema-driven config-generator API. Most runtime
features keep working, but the programmatic config-generator surface is a
breaking change.

## Breaking changes

### `ConfigScopes` and `ConfigScopeDef` are gone

Pass a `ConfigSchema` directly. It accepts a Zod schema, an untyped `Schema`, an
array of schemas, or a record keyed by scope.

```ts
// v1
const engine = createConfigEngine({
    scopes: {
        server: { zodSchema: serverConfig },
        cli: { zodSchema: cliConfig },
    },
});

// v2
const engine = createConfigEngine({
    schema: { server: serverConfig, cli: cliConfig },
});
```

`ConfigSchemaType` is the untyped `Schema` plus the toolchain's `ConfigMeta`.

### Render functions are internal

Use the `generateConfig*` functions or the engine methods. They return generated
contents and only write when you pass an output directory/path.

```ts
// v1
renderConfigTypes(scopes, { outputDir });
renderScopeMarkdown(scopes, { outDir });

// v2
generateConfigTypes(schema, { outputDir });
generateConfigMarkdown(schema, { outputDir });
```

Set `outputDir: false` (or omit it) to generate without writing.

### Schema maps were removed

`CONFIG_SECTION_SCHEMAS`, `CONFIG_TYPE_SCHEMAS` and
`CONFIG_SECTION_DESCRIPTIONS` were removed. Use `configSchema` (the section
schemas) or `dbxConfigSchema`, and read descriptions from each schema's
`.describe()` / `.meta()`.

### Metadata is the source of truth

Generators read `ConfigMeta` from Zod `.meta()` or from untyped schema nodes.
`env`/`path` are deprecated in favour of `envName`/`envPath`; `cliFlag` and
`cliFlagShort` customize CLI flags. Types can use `typeName` / `id` to control
the generated interface name.

### Collection names

- `collectEnvVars` → `collectVars`
- `collectRequiredEnvVars` → `collectRequired`
- `EnvVarDef` → `ConfigDef`
- `EnvValueType` → `ConfigValueType`
- engine `requiredEnvVars` → `requiredVars`
- `writeMarkdown({ outDir })` → `writeMarkdown({ outputDir })`

## Behaviour changes

- `toolchain.fmt` / `toolchain.lint` shorthand (`true` or `{ vscode: ... }`)
  now infers a tool from installed packages, then VS Code user settings, then
  falls back to Oxc defaults. Existing user config files are folded through the
  migration mappings instead of being overwritten.
- Formatter/linter conflict warnings use `fmt.conflict` / `lint.conflict`.
  Missing tools warn with `fmt.no-tool` / `lint.no-tool`.
- `fmt.vscode` / `lint.vscode` only add `editor.defaultFormatter`, language
  blocks and `editor.codeActionsOnSave`; use `{ overrides, exclude }` to adjust
  them.
- A custom logger can be supplied through `toolchain.logger.logger`.
- Changelog versioning supports custom bump rules/callbacks, over-bump opt-in,
  provider selection and commit credit/format options.

## Recommended upgrade steps

1. Replace `scopes` with `schema` in `createConfigEngine`.
2. Replace `render*` imports with `generateConfig*`.
3. Remove imports of the deleted schema maps; use `configSchema` or individual
   schema exports.
4. Rename `env`/`path` metadata to `envName`/`envPath` when convenient (the old
   names still work).
5. Run `yarn dbx sync` and `yarn config:types` after upgrading.
