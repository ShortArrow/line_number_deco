# 7. Pre-releases carry an odd minor version

Status: withdrawn on 2026-09-30, before any tag used it

Date: 2026-09-23

## Context

The VS Code Marketplace accepts only `major.minor.patch` versions. `vsce`
rejects a semver pre-release identifier such as `0.0.12-beta.1` outright, and
a pre-release and a release share one number space, so the two can never
carry the same number.

Until now a pre-release was a tag with a suffix. The suffix was stripped
before packaging, the burned-version guard was skipped, and the registry
publish was skipped with it. Such a tag could only ever reach GitHub, and
Marketplace users had no way to try a build before its release.

## Decision

Following Microsoft's recommendation, a version with an odd minor
(`0.1.x`) is a pre-release and a version with an even minor (`0.2.x`) a
release. `release.yml` derives the channel from the tag in one job. A tag
without a suffix and with an odd minor runs the guard, packages with
`--pre-release`, marks the GitHub Release as a pre-release and publishes
with `--pre-release`. The Marketplace takes the channel from the publish
flag; Open VSX ignores that flag for a pre-packaged VSIX and reads the
pre-release mark that packaging wrote into the manifest. A tag with an even
minor takes the release path unchanged.

A suffixed tag stays a rehearsal: everything runs except the guard and the
registry publish, and its GitHub Release is marked pre-release.

## Consequences

Pre-releases consume version numbers, and the release of the same content
needs the next even minor. The unpublished 0.0.12 is abandoned; its content
becomes the pre-release 0.1.0 and later ships as the release 0.2.0.
`publish.yml` applies the same rule to the tag it back-publishes, and it
refuses a suffixed tag. `vsce publish --pre-release` refuses a VSIX that was
packaged without the flag, so the flag has to be present at both steps.

## Why it was withdrawn

The decision was reversed a week after it merged, and nothing was ever
published under it. The Marketplace pre-release channel turned out to be a
standing audience: a user opts in once and then receives every higher
version, so it is a channel to keep fed, which an extension with occasional
releases has no use for. Each preview also consumes a version number and
pushes the release onto the next even minor.

The repository went back to the rules of ADR 3. A suffixed tag publishes a
GitHub pre-release, whose VSIX is installed by hand to verify the build, and
only an unsuffixed tag reaches the registries. The workflow changes of this
ADR were reverted in full and the version returned to 0.0.12.
