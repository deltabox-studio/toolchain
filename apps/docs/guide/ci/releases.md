# Releases

The generated `ci.release` workflow (`release.yml`) opens a release PR whose body
is the **aggregated changelog**: every entry from the last released version up to
the latest one, not just the newest entry. So a release that skips versions
(eg. `v1.7.0` → `v1.7.8`) still documents `1.7.1`–`1.7.8` in one place.

The body is produced by `dbx changelog --release-body <version>`, which only
considers versions that actually appear in `CHANGELOG.md` (so unrelated
CI/calendar tags are ignored). For a first release, when there is no prior
version, it falls back to the newest changelog entry instead of the whole file.
See [Release bodies](/guide/changelog/release) for the extraction and grouping
options.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        release: { pushBranches: ['main'] },
    },
}
```

The workflow is opt-in. Use [Workflow settings](/guide/ci/settings) to override
the job's extra steps/jobs or supply a fully hand-authored workflow. It can also
be a complete GitLab/Azure pipeline via `{ provider, workflow }`.

## Grouped release bodies

Set `changelog.release.group: true` to collapse every version since the previous
published release into one body, so a stable release documents the whole
prerelease cycle instead of only the last beta. See
[Release bodies](/guide/changelog/release#grouped-release-bodies) for grouping,
`includePrereleases`, `since`, CLI overrides, the boundary rules and
individual-versioning behavior.

## GitHub prereleases

`ci.release.prerelease` controls whether a release job marks a version with a
prerelease suffix (for example `3.0.0-beta.2`) as a GitHub prerelease:

| Value    | Behavior                                                              |
| -------- | --------------------------------------------------------------------- |
| `'auto'` | **Default.** Mark the release when the version contains a `-` suffix. |
| `true`   | Always mark the release as a prerelease.                              |
| `false`  | Never mark the release; every version is a normal release.            |

Prerelease versions are not marked as the latest release.

The default `ci.release` job only opens the release PR; it does not create the
GitHub Release itself. When you replace that job with one that creates the
release, pass `--prerelease` conditionally. The `{{ releasePrerelease }}` token
carries the setting:

```yaml
run: |
    version="$(node -p "require('./package.json').version")"
    args=(--title "v$version" --notes-file RELEASE_NOTES.md)
    prerelease="{{releasePrerelease}}"
    if [ "$prerelease" = "true" ] || { [ "$prerelease" = "auto" ] && [[ "$version" == *-* ]]; }; then
      args+=(--prerelease)
    fi
    gh release create "v$version" "${args[@]}" "dist/artifact"
```

Disable it for every release job:

```ts
ci: {
    release: {
        prerelease: false,
    },
}
```

Or force every release, including stable versions, to be marked:

```ts
ci: {
    release: {
        prerelease: true,
    },
}
```

The managed release job in this repository uses `{{ releasePrerelease }}` for
its `gh release create` step, so a beta such as `3.0.0-beta.17` is published as a
GitHub prerelease.
