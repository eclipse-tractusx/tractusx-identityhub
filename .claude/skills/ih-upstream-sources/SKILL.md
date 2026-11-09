---
name: ih-upstream-sources
description: Read, search and diff the upstream Eclipse EDC IdentityHub / IssuerService / STS / DCP / connector-core sources and SQL schemas at the exact version this repository pins (gradle/libs.versions.toml `edc`). Use whenever a question depends on upstream behaviour ("how does the presentation query pick credentials", "which setting controls X", "what does this upstream class do", "what changed between 0.17 and 0.18", "which endpoints does the IssuerService expose"), before naming any upstream class, setting, endpoint or table.
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

# Upstream sources at the pinned version

Almost all IdentityHub and IssuerService behaviour is upstream code: this repository adds a handful of extensions
(`extensions/*`), the runtime composition (`runtimes/*/build.gradle.kts`), Flyway migrations, charts and docs. So
most answers start upstream, and upstream renames things often (`v1alpha` → `v1beta`, roles → scopes, base64
participant ids → verbatim ids, `edc.encryption.strict` removed in 0.18.0). Memory is a hypothesis; the pinned
sources are the answer.

## The script

```bash
S=.claude/skills/ih-upstream-sources/scripts/ih-src.sh
$S version                                   # pinned upstream version, e.g. 0.18.0
$S artifacts | grep -i issuer                # org.eclipse.edc artifacts in this build (from the BOMs, transitively)
$S find PresentationApi                      # where a class lives (artifact + path)
$S read DcpIssuerServiceImpl                 # print a class with line numbers (best match, others listed)
$S grep 'edc\.iam\.did\.web'                 # grep every upstream .java file
$S settings 'statuslist|issuer'              # upstream @Setting keys
$S endpoints 'participants/\{participantContextId\}/credentials'   # METHOD path <- Controller (artifact)
$S schemas; $S schema holder-schema          # upstream SQL schemas (list / print one)
$S diff ParticipantManifest 0.17.0 0.18.0    # unified diff of a class between two versions
```

- The artifact set is resolved from the four BOMs this repository ships (`identityhub-bom`,
  `identityhub-feature-sql-bom`, `issuerservice-bom`, `issuerservice-feature-sql-bom`) plus every
  `org.eclipse.edc` library in `gradle/libs.versions.toml`, walking the POMs transitively (≈170 artifacts).
- Sources come from the Gradle cache, otherwise from Maven Central, and are extracted to `~/.cache/ih-sources/<version>`
  (outside the repository). First run per version: about a minute; afterwards instant. `IH_SRC_OFFLINE=1` forbids
  downloads.
- Any version works (`$S read X 0.17.0`), which is how you answer "what did it do before?".

## How to use the output

1. **Cite it as upstream**: `org.eclipse.edc:<artifact>:<version>` + path + line, e.g.
   `org.eclipse.edc:presentation-api:0.18.0 → org/eclipse/edc/identityhub/api/verifiablecredential/PresentationApiController.java:91`.
2. **Then find the Tractus-X side**: does this repo override, wrap or configure it? Check `extensions/*`,
   `runtimes/*/src/main/java` (`TxScopeToCriterionTransformer`, `IdentityHubExtension`), the chart ConfigMaps
   (`charts/*/templates/*-config.yaml`) and `deployment/docker/config/*/configuration.properties`.
3. **Settings built by concatenation** (`"web.http." + CONTEXT + ".port"`) do not appear as literals; `grep` the
   prefix or the constant.
4. **Endpoints**: `endpoints` resolves the `Versions.UNSTABLE` prefix (`/v1beta` in 0.18). The committed specs in
   `docs/api/<service>/<context>.yaml` (see the `api-surface` skill) tell you on which web context an operation is
   served.

## Where things usually are

| Topic | Look for |
|---|---|
| Presentation query (connector → holder) | `presentation-api` (`PresentationApiController`), `identity-hub-core` (`VerifiablePresentationServiceImpl`, `PresentationCreatorRegistryImpl`), `CredentialQueryResolver` |
| Scope → credential mapping | upstream `ScopeToCriterionTransformer`; Tractus-X override `runtimes/identityhub*/src/main/java/.../TxScopeToCriterionTransformer.java` |
| Issuance (holder → issuer) | `dcp-issuer-api`, `dcp-issuer-core`, `issuerservice-issuance`, `issuerservice-issuance-rules`, attestations (`issuerservice-database-attestations`, `issuerservice-holder-attestations`) |
| Holder side of issuance | `verifiable-credentials-api` (`/credentials/request`), `holder-credential-request-store-sql`, `credential-offer-api` |
| Participant contexts, API keys, scopes | `participant-context-api`, `identity-hub-participants`, `participant-context-spi` (`IdentityApiScopes`, `IssuerAdminApiScopes`) |
| Keys and DIDs | `keypair-api`, `identity-hub-keypairs`, `did-api`, `identity-hub-did`, `local-did-publisher` (`DidWebController`) |
| STS (self-issued ID tokens) | `sts-api`, `sts-core`, `sts-spi`, `sts-account-service-local` |
| Revocation / status lists | `local-statuslist-publisher`, `issuerservice-credentials` |
| Vault, encryption | `vault-hashicorp`, `encryption-spi`, `participant-context-config-core` |

Upstream repository: https://github.com/eclipse-edc/IdentityHub (tag `v<version>`); connector core:
https://github.com/eclipse-edc/Connector. A local clone (`~/eclipse-edc/IdentityHub`) can help for history, but
check its tag first; the script's sources always match the pinned version.
