---
name: breaking-change-guard
description: Review a branch or PR of the Tractus-X IdentityHub for breaking changes and missing follow-ups before it is merged or described - Flyway migrations, removed settings, Helm values and ConfigMap keys, API operations in the committed OpenAPI specs, ownership/vault/scope security code, runtime composition, upstream version bumps, CHANGELOG, migration guide, DEPENDENCIES, chart versions and license headers. Use for "is this breaking?", "review this PR", "what am I missing before merge", and always before writing a PR description.
---

<!--
 Copyright (c) 2026 Catena-X Automotive Network e.V.
 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 AI Disclosure: This file was entirely AI-generated.
 The AI-generated portions are made available under CC0-1.0 and not subject
 to the project's license. The human contributor has reviewed and verified
 that the code is correct.

 SPDX-License-Identifier: Apache-2.0 AND CC0-1.0
 Assisted-By: Claude Code (claude-opus-5-5)
-->

# Breaking-change guard

## Run it

```bash
.claude/skills/breaking-change-guard/scripts/bc-scan.sh              # vs origin/main, incl. uncommitted work
.claude/skills/breaking-change-guard/scripts/bc-scan.sh v0.4.1       # everything since a release
.claude/skills/breaking-change-guard/scripts/bc-scan.sh --strict     # exit 1 on BLOCKER/BREAKING (CI or pre-push)
```

For a PR: `gh pr checkout <n>` (or fetch `refs/pull/<n>/head`) and run it against the PR's base.

## Severities

| Severity | Meaning | Examples |
|---|---|---|
| BLOCKER | Will break deployments or cannot work | Released Flyway migration edited (checksum mismatch), duplicate/out-of-order version, migration folder without a `*MigrationExtension` |
| BREAKING | Operators or clients must act | Setting key removed, Helm value removed, ConfigMap key no longer set, API operation removed from `docs/api/<service>/*.yaml` |
| HIGH | Needs specific verification | New migration, upstream bump, ownership/super-user/initial-participant code, vault access, DCP scope mapping, DEPENDENCIES not updated |
| WARN | Follow-up missing | CHANGELOG, migration guide, helm-docs, chart version, OpenAPI specs not regenerated, new API op not in collections, only one of the two `runtimes/identityhub*` copies changed, missing SPDX header |

## Judge every finding

The scan is heuristic. For each finding decide: real and fixed, real and accepted (explain in the PR and the migration
guide), or false positive (say why). In particular:

- **Security-sensitive modules** (`extensions/identityhub/*-ownership`, `seed/super-user`, `initial-participant`):
  read the diff for who may read or write which participant's data, keys and secrets. Run the module's `ApiTest`s and
  the E2E flow on **both** compose profiles: the memory vault is partitioned per participant, HashiCorp Vault is not, so
  vault bugs show up on one profile only (see the CHANGELOG entry on `storeSecret` partitions).
- **Scope mapping** (`TxScopeToCriterionTransformer`, `tx.identityhub.scope.aliases`): changes what a connector gets
  from `/presentations/query`, so an over-broad mapping leaks credentials and a narrow one breaks every negotiation.
  Ask for evidence from the E2E presentation folder or a Tractus-X EDC DCP test.
- **API operations removed**: they come from upstream when the committed specs are regenerated. Name the
  replacement, and check the collections, the walkthrough and `ui/src`.

## Checklist for the PR description

- [ ] `bc-scan.sh` run; every BLOCKER/BREAKING fixed or justified
- [ ] `CHANGELOG.md` `[Unreleased]` updated (Keep a Changelog sections; `**BREAKING:**` prefix when operators must act)
- [ ] `docs/admin/migration-guide.md` entry for every BREAKING item (draft: `migration-guide-and-adr`)
- [ ] Charts: helm-docs README regenerated, `Chart.yaml` version bumped, `helm lint`
- [ ] `docs/api/{identityhub,issuerservice}` regenerated (`copyGeneratedSpecToDocs`) and collections updated
- [ ] `DEPENDENCIES` / `DEPENDENCIES_UI` regenerated when dependencies changed (`dependencies-and-dash`)
- [ ] Tests: unit, `ComponentTest`/`ApiTest`, `PostgresqlIntegrationTest` for migrations, E2E on both profiles
- [ ] SPDX/license headers on new files (TRG 7-02); AI-generated content carries the AI disclosure
- [ ] PR title follows Conventional Commits (`scan-pr-title.yaml`)
