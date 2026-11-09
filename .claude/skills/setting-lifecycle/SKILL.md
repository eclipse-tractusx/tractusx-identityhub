---
name: setting-lifecycle
description: Look up, add, rename, deprecate or remove an IdentityHub / IssuerService configuration setting end to end, covering the @Setting declaration (Tractus-X or upstream), the four charts' ConfigMaps and values.yaml, helm-docs READMEs, runtime application.properties, the Docker Compose configuration, docs, migration guide and CHANGELOG. Use for "what is the setting / env var / Helm value for X", "add a config option", "why is my setting ignored", or any change to charts/*/values.yaml or charts/*/templates/*-config.yaml.
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

# Setting lifecycle

A setting lives in up to nine places here, and the charts set runtime settings as **dotted keys in ConfigMaps** (loaded
with `envFrom`), not as individual env vars. Missing one place is the most common review comment.

| # | Place | Example |
|---|---|---|
| 1 | `@Setting` declaration (Tractus-X or upstream) | `InitialParticipantExtension.java`: `@Setting(key = "edc.tractusx.ih.participant.configurable.id", …)` |
| 2 | Chart ConfigMap (all four charts) | `charts/tractusx-identityhub/templates/identityhub-config.yaml`: `edc.iam.did.web.use.https: {{ .Values.identityhub.didweb.https \| quote }}` |
| 3 | Helm value | `charts/*/values.yaml` with a `# --` comment for helm-docs |
| 4 | Chart README | `charts/*/README.md`, generated from `README.md.gotmpl` by helm-docs |
| 5 | Runtime default | `runtimes/<runtime>/src/main/resources/application.properties` |
| 6 | Compose stack | `deployment/docker/config/<runtime>/configuration.properties` (+ `deployment/docker/README.md`) |
| 7 | Docs | `docs/**`, extension READMEs, `INSTALL.md` |
| 8 | Migration guide | `docs/admin/migration-guide.md` for renames, removals, default changes |
| 9 | CHANGELOG | `CHANGELOG.md` `[Unreleased]` |

Env vars still work for operators (`identityhub.env` / `envValueFrom` / `envSecretNames` in the charts): EDC maps
`EDC_IAM_DID_WEB_USE_HTTPS` → `edc.iam.did.web.use.https` (upper-case, `.`/`-` → `_`).

## Step 0: trace what exists

```bash
T=.claude/skills/setting-lifecycle/scripts/setting-trace.sh
$T edc.tractusx.ih.participant.configurable.id
$T EDC_IAM_DID_WEB_USE_HTTPS
$T .Values.identityhub.endpoints.sts.port
```

It resolves key ↔ env var ↔ Helm path, shows the declaration (Tractus-X and upstream at the pinned version, including
concatenated `web.http.<context>.*` keys), the ConfigMap lines in every chart, `values.yaml` entries (also
`values-int*.yaml`), runtime defaults, the compose config, docs, migration history and tests, and ends with a touchpoint
checklist.

## Adding a setting

1. Declare it on the extension that consumes it:
   ```java
   @Setting(key = "edc.tractusx.ih.foo.timeout", description = "Timeout in seconds for …", defaultValue = "30")
   private int timeout;
   ```
   Prefixes in use: `edc.tractusx.ih.*` (IdentityHub features), `edc.tractusx.*` (shared, e.g. `edc.tractusx.swagger.ui.*`),
   `edc.ih.api.superuser.*` (super-user seed), `org.eclipse.tractusx.edc.postgresql.migration.*` (migrations), and
   `tx.identityhub.scope.aliases`. Prefer `edc.tractusx.ih.*` for new IdentityHub settings and `edc.tractusx.is.*`
   for IssuerService-only ones; `edc.*`/`web.http.*` only when you configure an upstream setting.
2. Expose it in the charts **only if operators need it**, in **each** affected chart (IdentityHub: `tractusx-identityhub`,
   `-memory`; IssuerService: `tractusx-issuerservice`, `-memory`; the `-bundle` chart wraps them):
   ```yaml
   # templates/identityhub-config.yaml
   edc.tractusx.ih.foo.timeout: {{ .Values.identityhub.foo.timeout | quote }}
   # values.yaml
   foo:
     # -- Timeout in seconds for …
     timeout: 30
   ```
   Guard optional values with `{{- if … }}`; use `required` only for values without a safe default.
3. Regenerate the chart READMEs (helm-docs), bump the chart `version` in `Chart.yaml`, and run
   `helm lint charts/<chart>` and `helm template charts/<chart> | grep foo`.
4. Add it to `deployment/docker/config/*/configuration.properties` when the compose stack needs a non-default value.
5. Document it (README / docs), add a CHANGELOG *Added* line, and test it with
   `ConfigFactory.fromMap(Map.of("edc.tractusx.ih.foo.timeout", "5"))` in the extension test.

## Renaming (deprecate, then remove)

Keep the old key working for one release: read the new key, fall back to the old one with a `monitor.warning(…)`. In
the chart, emit the new key and accept the old value (`{{ .Values.new | default .Values.old }}`), keeping the old value
commented as deprecated. Add a migration-guide row `| Old | New |` and a CHANGELOG *Deprecated*/*Changed* line.

## Removing or changing a default

Breaking for operators: migration-guide entry, CHANGELOG `**BREAKING (charts):**` line, and `bc-scan.sh`.

## Debugging "my setting is ignored"

1. Trace it. Is it set in the ConfigMap you deploy (`kubectl get cm <release>-…-config -o yaml`), and does an env var or
   `envSecretNames` entry override it?
2. Is the consuming extension in that runtime? (`runtimes/<runtime>/build.gradle.kts`; the `-memory` runtimes ship
   fewer modules, e.g. no SQL migrations, no `database` attestation.)
3. Upstream may have removed it: `ih-src.sh settings <regex>` at the pinned version. Example: `edc.encryption.strict`
   no longer exists in 0.18.0 but is still set by the charts; `edc.issuer.statuslist.signing.key.alias` is required by the
   IssuerService chart but not read by any upstream 0.18.0 module.
4. Participant-scoped configuration (`ParticipantContextConfig`) is read per participant, not from the runtime config.
