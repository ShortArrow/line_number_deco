# 4. Registry publishing uses PATs, and the Entra OIDC path stays dormant

Status: accepted

Date: 2026-09-05

## Context

The release pipeline needs a credential to publish to the VS Code Marketplace. A long-lived personal access token in a repository secret is the officially documented route, and it is also a secret that sits there until someone rotates it.

Federated Entra identity is the secretless alternative: the workflow gets an OIDC token from GitHub, exchanges it through `azure/login`, and `vsce publish --azure-credential` uses the resulting credential. That path was built first, in PR #65 merged on 2026-09-05.

It cannot work for this publisher. The `ShortArrow` publisher is owned by a Microsoft personal account, and the Marketplace cannot resolve an Entra service principal as a member of an MSA-owned publisher — the attempt comes back as TF14045. The app registration has no way to express membership until the publisher itself moves under Entra.

## Decision

Publish with personal access tokens. `VSCE_PAT` authenticates `vsce publish` against the Marketplace and `OVSX_PAT` authenticates `ovsx publish` against Open VSX; both are repository secrets read by the `publish-marketplace` job in `release.yml`.

Keep the Entra path in the workflow rather than deleting it; PR #66, merged the same day, added the PAT route beside it as the branch that actually runs. The job reads `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` as repository variables. They are unset, so `USE_AZURE` is empty, the `azure/login` and `--azure-credential` steps are skipped, and the PAT step runs instead. With no credential of either kind configured the job skips itself and writes a line to the step summary.

## Consequences

Publishing works today, at the cost of two secrets that have to be rotated by hand and that grant more than one release each.

The day the publisher moves under an Entra tenant, switching is two repository variables and no code change, because the OIDC steps are already written and already ordered ahead of the PAT step. Until then the workflow carries a branch that never executes, and the TF14045 reason is recorded in a comment beside it so nobody re-derives it.

`.github/workflows/publish.yml` reads the same two secrets, so a release whose credential was configured after the tag was cut can be back-published by `workflow_dispatch` without rebuilding the artifact.
