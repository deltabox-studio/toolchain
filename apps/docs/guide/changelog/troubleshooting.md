# Troubleshooting

## `No "exports" main defined in … conventional-changelog-conventionalcommits`

Seen from the Conventional Commits VS Code extension (`vivaxy.vscode-conventional-commits`),
usually alongside empty type/scope suggestions and a `The cwd is …` line:

```
commitlint: Error: No "exports" main defined in
  node_modules/conventional-changelog-conventionalcommits/package.json
```

This is a **known upstream commitlint bug** (commitlint#4864): the generated
config `extends: ['@commitlint/config-conventional']`, which sets
`parserPreset: 'conventional-changelog-conventionalcommits'`, and v10 of that
package is **ESM-only** (`exports` has no `require`/`default`), so the extension's
bundled (older) commitlint cannot `require.resolve` it. The config is read fine —
the _preset_ fails to resolve, so the extension falls back to empty rules.

The husky hook and CI are unaffected when commitlint is recent enough to resolve
pure-ESM presets (commitlint ≥ 21.2.3). If your local commitlint is older, pin
the preset to the last CJS-compatible release:

```json [package.json]
{
    "resolutions": { "conventional-changelog-conventionalcommits": "9.3.1" }
}
```

(Use `overrides` instead of `resolutions` for npm.) Updating the extension to a
version bundling the fixed commitlint also resolves it.
