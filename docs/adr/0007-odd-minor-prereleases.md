# 7. Pre-releases carry an odd minor version

Status: accepted

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
with `--pre-release` to the Marketplace and to Open VSX. A tag with an even
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
