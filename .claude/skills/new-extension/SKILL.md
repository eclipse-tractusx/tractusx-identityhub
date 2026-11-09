---
name: new-extension
description: Decide where new Tractus-X IdentityHub or IssuerService functionality belongs (upstream contribution, configuration, or a Tractus-X extension) and scaffold an extension module that builds green - ServiceExtension, settings, service registration, test, README - plus wiring into the four runtimes. Use for "add an extension", "where should this live", "new module", "override upstream behaviour".
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

# New extension

## First: does it belong here?

1. **Upstream first.** If the behaviour is generic DCP / IdentityHub behaviour, contribute it to
   https://github.com/eclipse-edc/IdentityHub and consume it with the next bump. Tractus-X keeps only what is specific
   to Tractus-X/Catena-X operation or what upstream rejects.
2. **Configuration second.** Many needs are a setting or a chart value (`setting-lifecycle`), not code. Check
   `ih-src.sh settings <regex>`.
3. **Extension third.** Existing patterns to mirror:

| Need | Mirror |
|---|---|
| Restrict or extend management API authorization | `extensions/identityhub/participant-api-ownership`, `credential-api-ownership` |
| Seed data at boot | `extensions/seed/super-user`, `extensions/identityhub/initial-participant` |
| Serve an extra HTTP page or API on a web context | `extensions/api/swagger-ui` |
| Replace an upstream default service (`@Provider(isDefault = true)` upstream) | `runtimes/identityhub*/…/IdentityHubExtension` (`ScopeToCriterionTransformer`) |
| Monitor/logging | `extensions/monitor/colored-jdk-monitor` |
| Schema migrations | `sql-migration` skill |

## Scaffold

```bash
.claude/skills/new-extension/scripts/scaffold-extension.sh \
  extensions/identityhub/did-audit org.eclipse.tractusx.identityhub.did.audit DidAuditExtension edc.tractusx.ih.did.audit
```

It creates `build.gradle.kts`, the extension with `@Extension`/`@Setting`/`@Inject`, the
`META-INF/services/org.eclipse.edc.spi.system.ServiceExtension` registration, a `DependencyInjectionExtension` test and
a README with a settings table, all with license headers. It never edits existing files and prints the lines to add:

1. `settings.gradle.kts`: `include("extensions:identityhub:did-audit")`
2. The runtimes, usually **both** variants so compose profiles and charts behave the same:
   `runtimeOnly(project(":extensions:identityhub:did-audit"))` in `runtimes/identityhub/build.gradle.kts` and
   `runtimes/identityhub-memory/build.gradle.kts` (IssuerService: `runtimes/issuerservice*`).
3. `./gradlew :extensions:identityhub:did-audit:build` (compiles, Checkstyle, unit test). The scaffold was verified to
   build green on main.

## Conventions

- Packages `org.eclipse.tractusx.identityhub.*` (most modules; migrations use `org.eclipse.tractusx.store.*`).
- Dependencies through the version catalog (`libs.edc.ih.spi`, `libs.edc.ih.spi.participant.context`, …); add missing
  upstream artifacts to `gradle/libs.versions.toml` with `version.ref = "edc"`. New third-party libraries need a
  `DEPENDENCIES` update (`dependencies-and-dash`).
- Tests: plain JUnit + `DependencyInjectionExtension`; HTTP behaviour as `@ApiTest` with rest-assured (see the ownership
  modules); tags as in `.github/workflows/verify.yaml`.
- Vault: pass the participant context id when storing participant secrets (`vault.storeSecret(participantContextId, alias, value)`);
  the memory vault is partitioned.
- Expose settings in the charts only when operators need them; document them in the module README.
- CHANGELOG *Added* entry; run `bc-scan.sh`.
