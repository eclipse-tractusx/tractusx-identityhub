---
name: upstream-edc-bump
description: Plan and carry out an upgrade of the upstream Eclipse EDC / IdentityHub version (the `edc` entry in gradle/libs.versions.toml) for the Tractus-X IdentityHub and IssuerService. Use for "upgrade to EDC 0.19", "what breaks if we bump", "adapt to the new IdentityHub release", or when a dependabot/renovate PR touches the edc version. Produces an impact report (types, settings, endpoints, SQL schemas) and walks the bump end to end.
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

# Upstream EDC / IdentityHub bump

The bump is the largest recurring change here. 0.18.0 moved every management endpoint from `/v1alpha` to
`/v1beta`, replaced participant roles with scopes (`PUT …/scopes`, Flyway `V0_0_3__Migrate_Roles_To_Scopes`), removed
`edc.encryption.strict`, and touched the UI, both Postman collections, the Bruno collection and the walkthrough.
Work through the steps in order and keep a running checklist in the PR description.

## 1. Analyse before touching anything

```bash
OLD=$(.claude/skills/ih-upstream-sources/scripts/ih-src.sh version); NEW=0.19.0
.claude/skills/upstream-edc-bump/scripts/bump-impact.sh "$OLD" "$NEW" --main-only
.claude/skills/upstream-edc-bump/scripts/bump-impact.sh "$OLD" "$NEW" --diff > /tmp/ih-bump.diff
```

The report lists:
- upstream types that Tractus-X imports and that were **removed**, **moved** or **changed**, ranked by usage
- upstream **settings** removed or added, and removed ones the charts, compose config or code still set
- upstream **endpoints** removed or added; pure API-version moves (`/v1alpha` → `/v1beta`) are collapsed into one line,
  and removed paths still used by the collections, docs or UI are listed with file counts
- upstream **SQL schema** changes (each needs a Tractus-X Flyway migration)
- links to the IdentityHub and Connector release notes and the compare view

Read the release notes. Summarise the plan with the expected touchpoints before you edit.

## 2. Bump

Branch from `origin/main` (e.g. `chore/upgrade-edc-$NEW`). In `gradle/libs.versions.toml` set `edc`; check `edc-build`
(the Gradle plugin) and renamed artifacts or BOMs (Gradle resolution errors point to them). Update
`## Current EDC Version:` in `README.md`.

## 3. Compile and adapt Tractus-X code

```bash
./gradlew compileJava compileTestJava --continue 2>&1 | grep -E 'error:' | sort | uniq -c
```

For each failing type run `ih-src.sh diff <Type> $OLD $NEW`. The Tractus-X surface is small; check every module even
when it compiles:
- `extensions/identityhub/participant-api-ownership`, `credential-api-ownership`: they wrap upstream API
  authorization. A changed upstream `AuthorizationService`, `ServicePrincipal` or scope model can silently widen access.
- `extensions/seed/super-user`, `extensions/identityhub/initial-participant`: `ParticipantManifest`,
  `IdentityHubParticipantContext`, vault partitions (`storeSecret(participantContextId, …)`).
- `runtimes/identityhub*/…/TxScopeToCriterionTransformer` and `IdentityHubExtension` (`tx.identityhub.scope.aliases`):
  diff upstream `ScopeToCriterionTransformer` and keep both runtime copies identical.
- `extensions/store/sql/migrations`: Flyway/`DataSource` APIs.
- `openapi/*-spec/build.gradle.kts`: controllers are listed **by class**; a renamed upstream controller silently drops
  endpoints (the resolve task fails on empty specs).

## 4. Database

For every schema change in the report: `.claude/skills/sql-migration/scripts/migrations.sh compare <subsystem>` and add
a new `V…__` file (`sql-migration` skill). Never edit a released migration.

## 5. Settings, charts, compose

For each removed/renamed upstream setting the report flags (`!` lines), use the `setting-lifecycle` skill: chart
ConfigMaps in all four charts, `values.yaml`, helm-docs READMEs, `deployment/docker/config/*/configuration.properties`,
`runtimes/*/src/main/resources/application.properties`.

## 6. API surface, collections, UI

```bash
./gradlew :openapi:identityhub-spec:copyGeneratedSpecToDocs :openapi:issuerservice-spec:copyGeneratedSpecToDocs
.claude/skills/api-surface/scripts/api-inventory.sh coverage
```

Update `docs/api/postman/*.json`, `docs/api/bruno/**`, `docs/usage/dcp-api-walkthrough/*`, and `ui/src` for every moved
path (the report's `!` list is the worklist).

## 7. Tests, cheapest first

```bash
./gradlew checkstyleMain checkstyleTest test
./gradlew test -DincludeTags="ComponentTest,ApiTest,EndToEndTest"
./gradlew test -DincludeTags="PostgresqlIntegrationTest"          # Docker
.claude/skills/dcp-e2e-flow/scripts/dcp-e2e.sh run sql            # full DCP flow like CI
.claude/skills/dcp-e2e-flow/scripts/dcp-e2e.sh run memory
```

The `deployment-test` and `upgradeability-test` workflows cover Helm install and upgrade from the last published chart.

## 8. Docs and compliance

- `docs/admin/migration-guide.md`: a `## EDC <old> → <new>` section (house format: management API, data migration,
  API versions, configuration). Draft it with `migration-guide-and-adr`.
- `CHANGELOG.md` `[Unreleased]`: a `**BREAKING:**` line under *Changed* when operators must act.
- `dependencies-and-dash`: regenerate `DEPENDENCIES` (CI fails when it is out of date).
- Finish with `breaking-change-guard` (`bc-scan.sh`) and resolve or justify every finding.
