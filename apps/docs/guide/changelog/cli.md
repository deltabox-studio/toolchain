# CLI

```sh
dbx changelog                       # bump + write (uses ci.changelog.versioning)
dbx changelog --dry-run             # preview the root entry
dbx changelog --range v1.2.0..HEAD  # scan a specific range
dbx changelog --version 2.0.0       # force a version (retags the changelogs)
dbx changelog --format-only         # regroup existing changelogs, no bump
```

The command reads `ci.changelog` and falls back to the manual
`toolchain.changelog` pipeline options (commitlint, versioning, vscode). This
lets a project keep manual/API changelog runs without enabling the CI workflow;
`ci.changelog` inherits the same options when it does not override them.

The generated `changelog` workflow runs `dbx changelog --range …` on every push
to the `dev` branches (or `main` when `dev` is unset), so versioning is applied
from CI as well as locally.

`dbx workflow [id…]` triggers the generated GitHub workflows through
`gh workflow run`; with no ids it triggers every workflow you declared under
`toolchain.ci`.
