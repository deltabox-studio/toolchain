# Releases

The generated `release` workflow opens a release PR whose body is the
**aggregated changelog**: every entry from the last tag (`git describe --tags
--abbrev=0`) up to the latest version, not just the newest one. So a release
that skips versions (eg. `v1.7.0` → `v1.7.8`) still documents `1.7.1`–`1.7.8`
in one place.
