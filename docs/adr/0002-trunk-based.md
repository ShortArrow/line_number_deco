# 2. Short-lived branches merge to main and the develop branch is gone

Status: accepted

Date: 2026-08-20

## Context

The repository ran a two-trunk flow for its first years. Work accumulated on `develop` and reached `main` in batches: PR #17 and PR #18 on 2024-01-02, PR #28 on 2024-02-25, PR #36 on 2025-01-07, each merging `ShortArrow/develop` wholesale. A batch of that size is reviewed as a batch, and a release cut from `main` was a release of whatever `develop` had collected since the last one.

From PR #42 onward the working pattern changed on its own. Every branch since is a single topic named for it — `chore/migrate-to-pnpm`, `ci/vsix-smoke`, `fix/select-bounce`, `docs/reference` — opened, merged and finished within a day or two. The record shows PRs #42 through #48 all merged on 2026-08-20, and #56 through #64 on 2026-09-05.

## Decision

Delete `develop`. A branch is cut from `main`, carries one topic, and returns to `main` through a pull request. The remote now has one long-lived branch, `origin/main`.

Release tags are cut by the maintainer from `main` and pushed as signed `v*` tags. There is no release branch and no merge-back.

## Consequences

Every change is reviewed at the size it was written, and `main` is always the candidate for the next tag. `.github/workflows/ui-test.yml` can therefore trigger on `pull_request` against `main` and mean it: the branch under test is the branch about to become the release.

Nothing accumulates in a staging trunk, so a change that is not ready has to be held out of `main` rather than parked on `develop`. Branches are deleted by hand after the merge.
