# CLI

```sh
dbx changelog                       # bump + write (uses ci.changelog.versioning)
dbx changelog --dry-run             # preview the root entry
dbx changelog --range v1.2.0..HEAD  # scan a specific range
dbx changelog --version 2.0.0       # force a version (retags the changelogs)
dbx changelog --format-only         # regroup existing changelogs, no bump
dbx changelog --release-notes 2.0.0 # print the release PR body for a version
```

The command reads `ci.changelog` and falls back to the manual
`toolchain.changelog` pipeline options (commitlint, versioning, vscode). This
lets a project keep manual/API changelog runs without enabling the CI workflow;
`ci.changelog` inherits the same options when it does not override them.

The generated `changelog` workflow runs `dbx changelog --range …` on every push
to the `dev` branches (or `main` when `dev` is unset), so versioning is applied
from CI as well as locally.

`dbx workflow [id…]` triggers the generated workflows with their vendor CLI
(`gh`, `glab` or `az`); with no ids it triggers every workflow you declared under
`toolchain.ci`. See [Workflows](/guide/cli#workflows).

## Formatting

`--format-only` regroups the existing entries without bumping versions. It keeps
list items, unwraps hard-wrapped lines, keeps multi-line `BREAKING CHANGE:`
footers together and preserves fenced code blocks. Numeric-only short hashes
(eg. `#4033009`) are resolved against git, so they stay commit links while real
issue numbers stay issue links. When the git body contains shell escape artifacts
(see [Writing commit messages](/guide/changelog/writing-commit-messages)),
`--format-only` keeps an already-corrected description instead of overwriting it.
