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

# Identity Keeper skills

Agent skills for developing the Tractus-X IdentityHub and IssuerService. Each skill is a folder with a `SKILL.md` (the
procedure, loaded on demand by Claude Code and GitHub Copilot from `.claude/skills/`) and a `scripts/` folder with
portable, tested scripts (bash 3.2+, macOS and Linux; `node` for the JSON/JWT tools). The
[Identity Keeper agent](../agents/identity-keeper.md) routes matching tasks to them.

User documentation: [how to use the Keeper](../../docs/developers/identity-keeper/README.md) and
[how the skills work](../../docs/developers/identity-keeper/skills.md).

Scripts run from anywhere inside the repository. They are read-only on the repository, except the explicit
scaffolding and write commands (`scaffold-extension.sh`, `migrations.sh new`, `new-adr.sh`,
`draft-migration-guide.sh --write`, `dash-check.sh --write`), which only create new files or update the file they name.
`dcp-e2e.sh` starts and stops Docker containers.

| Skill | Use it for | Script |
|---|---|---|
| [ih-upstream-sources](ih-upstream-sources/SKILL.md) | Upstream IdentityHub / IssuerService / STS / DCP code, settings, endpoints and SQL schemas at the pinned version; version diffs | `ih-src.sh` |
| [upstream-edc-bump](upstream-edc-bump/SKILL.md) | Upgrading the upstream `edc` version: impact report and procedure | `bump-impact.sh` |
| [setting-lifecycle](setting-lifecycle/SKILL.md) | A setting across `@Setting`, chart ConfigMaps, values, runtime defaults, compose config, docs | `setting-trace.sh` |
| [breaking-change-guard](breaking-change-guard/SKILL.md) | Breaking-change review of a branch or PR, plus missing follow-ups | `bc-scan.sh` |
| [sql-migration](sql-migration/SKILL.md) | Flyway migrations per store subsystem: status, compare with upstream, new file, failures | `migrations.sh` |
| [new-extension](new-extension/SKILL.md) | Upstream vs config vs extension; scaffolding a module that builds green | `scaffold-extension.sh` |
| [dcp-e2e-flow](dcp-e2e-flow/SKILL.md) | Compose stack + Postman E2E collection like CI (`sql` and `memory` profiles) | `dcp-e2e.sh` |
| [api-surface](api-surface/SKILL.md) | Web contexts, ports, paths, auth, OpenAPI drift, collection coverage | `api-inventory.sh` |
| [identity-diagnostics](identity-diagnostics/SKILL.md) | did:web resolution and DID document lint, token / VP / VC decoding, the DCP failure chain | `did-inspect.sh`, `jwt-inspect.sh` |
| [dependencies-and-dash](dependencies-and-dash/SKILL.md) | Eclipse Dash like CI; `DEPENDENCIES` and `DEPENDENCIES_UI` | `dash-check.sh` |
| [migration-guide-and-adr](migration-guide-and-adr/SKILL.md) | Migration guide drafted from evidence, CHANGELOG, decision records | `draft-migration-guide.sh`, `new-adr.sh` |

## How the scripts were tested

Against this repository on `main` (EDC 0.18.0) and its history:

- `bump-impact.sh 0.17.0 0.18.0` on the pre-bump commit reproduces the real upgrade: 54 endpoints moved `/v1alpha` →
  `/v1beta`, `PUT …/roles` → `PUT …/scopes`, `edc.encryption.strict` removed upstream, the `credentials` schema change,
  and the collections, docs and UI files still using the old paths.
- `bc-scan.sh` on the 0.18.0 upgrade PR (#344) and the OpenAPI PR (#330) flags the new migration, the security-sensitive
  ownership modules, the UI dependency change without `DEPENDENCIES_UI`, and the added operations.
- `scaffold-extension.sh` output builds green with `./gradlew :extensions:…:build` (Checkstyle and test).
- `dash-check.sh` reproduces CI's 400 Gradle coordinates exactly and runs Eclipse Dash.
- `migrations.sh compare` finds no drift between the Tractus-X migrations and the upstream 0.18.0 schemas.
- `did-inspect.sh` / `jwt-inspect.sh` against fixture DID documents and tokens with planted defects (expired VP, kid not
  in the DID document).
- `dcp-e2e.sh`: `folders` and argument handling; the Docker paths mirror `.github/workflows/postman-e2e-test.yaml` step
  by step.

## Ideas for further skills

- **ui-feature**: adding a page or API call to the management UI (`ui/`), its tests (Vitest) and `DEPENDENCIES_UI`.
- **chart-change**: `helm lint`, `helm template` diffs per values file, helm-docs and `ct` exactly like `helm-lint.yaml`,
  and the KinD deployment test of `deployment-test.yaml`.
- **credential-definition-author**: writing attestation and credential definitions (rules, mappings, validity) for the
  Catena-X credentials (membership, BPN, framework agreements) and testing them through the E2E issuance folders.
