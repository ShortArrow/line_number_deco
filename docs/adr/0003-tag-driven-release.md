# 3. A pushed v* tag drives the release, and a burned version number stops it

Status: accepted

Date: 2026-09-05

## Context

Releases used to be a local `vsce publish` from the maintainer's machine, with nothing between the working tree and the store. `.github/workflows/release.yml` replaced that on 2026-08-20 (PR #43), triggered by a pushed `v*` tag.

The pipeline then hit the failure it now guards against. The GitHub release named 0.0.10 reused a version number that had been published to the Marketplace in January 2025, long before any of this existed. The store does not reject a duplicate in a way anyone noticed and it does not overwrite: it kept serving the January build, so installing 0.0.10 from the Marketplace gave the old extension while the GitHub release of the same name gave the new one. A published version number can never be reused, and nothing in the pipeline knew that.

## Decision

Keep the tag as the release trigger and add a burned-version guard as the first thing that runs, in commit c9f8d77, merged in PR #64 on 2026-09-05. Before any test, the job compares the tag's `X.Y.Z` against `version` in `package.json` and fails if they disagree. It then asks `vsce show ShortArrow.line-number-deco --json` and `https://open-vsx.org/api/shortarrow/line-number-deco/<version>` whether either registry already has this version, and fails if one does.

An unreachable registry is a warning, not a failure, because a store outage must not block a GitHub release. The 0.0.10 number was abandoned and the next release shipped as 0.0.11, carrying this guard.

A tag carrying a suffix, `v0.0.10-beta.1`, is a pre-release. It reuses the base version deliberately, so the guard is skipped, the GitHub release is marked pre-release, and no registry publish runs. The suffix never reaches the manifest, because the Marketplace rejects prerelease version strings.

## Consequences

The release is reproducible from the tag alone, and everything that ships has passed the same gates in order: version match, burned-version guard, tests on ubuntu, windows and macos, packaging, structural and activation smoke tests, Sigstore provenance attestation, then the GitHub release and the registry publish.

Cutting a release now costs a version bump commit and a tag push, and a mistake in either is caught before anything leaves the runner. Reusing a number is no longer possible, so a botched release costs a bump rather than a permanently wrong store listing.
