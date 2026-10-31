# commitlint

By default the generated `commitlint.config.mjs` lives at the project root. Set
`ci.changelog.commitlint.dir` to write it elsewhere:

```ts
ci: {
    changelog: {
        commitlint: {
            dir: '.config';
        }
    }
} // -> .config/commitlint.config.mjs
```

When a custom dir is set, the generated husky hook and the CI commitlint step
both pass `--config <dir>/commitlint.config.mjs`, so commitlint finds it. Note
that editor tooling that discovers the config by convention (eg. the
Conventional Commits VS Code extension, which loads from the repo root) expects
the config at the root — keep the default unless you have a reason to move it.

`commitlint.types` and `commitlint.scopes` are the allowed Conventional-Commits
types/scopes:

```ts
ci: {
    changelog: {
        commitlint: {
            types: ['feat', 'fix', 'docs', 'chore'],
            scopes: ['api', 'web', 'deps'],
        },
    },
}
```

## Disabling commitlint

Set `ci.changelog.commitlint: false` (or `{ enabled: false }`) to generate
changelogs **without** the Conventional-Commits rules. The changelog workflow is
still generated, but dbx writes no `commitlint.config.mjs`, no husky hook and no
commitlint step in the CI workflow.

The changelog then falls back to a coarse grouping: commits are hoisted into
`Major changes`, `Minor changes` and `Patch changes` buckets (breaking commits
and `feat:` go to major/minor; everything else is a patch), while the package
changes section (eg. new packages) is kept. This is intentionally less detailed
than the rule/scope grouping, but it works with any commit-message style.

> The extension's `No "exports" main defined in … conventional-changelog-conventionalcommits …`
> error is an upstream commitlint bug (ESM-only parser preset), not a config
> discovery problem. See [Troubleshooting](/guide/changelog/troubleshooting).
