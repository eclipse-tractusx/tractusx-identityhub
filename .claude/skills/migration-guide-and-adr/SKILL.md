---
name: migration-guide-and-adr
description: Write the operator-facing release documentation of the Tractus-X IdentityHub from evidence - the next section of docs/admin/migration-guide.md, the CHANGELOG [Unreleased] entries, and architecture decision records in docs/architecture/decision-records. Use for "draft the migration guide", "what do operators need to do for the next release", "update the changelog", "record this decision", "write an ADR".
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

# Migration guide, CHANGELOG and decision records

## Migration guide (`docs/admin/migration-guide.md`)

One file, newest section first. The guide is based on the **chart version**: sections are `## <previous> → Unreleased`
(renamed to the release at release time) and `## EDC <old> → <new>` for upstream bumps. Each topic is a numbered
`### n. <Area> — <what>` with: what changed and why, a table for values/settings (`| Removed value | Charts |` or old →
new), and a bold **Action required** paragraph with the exact steps. Link the issue `([#322](…))`.

```bash
G=.claude/skills/migration-guide-and-adr/scripts/draft-migration-guide.sh
$G                      # draft from the last release tag (e.g. v0.4.1) to HEAD, printed
$G --from v0.4.0        # another base
$G --write              # insert the draft above the newest section
```

The draft collects: the upstream version change, Helm values removed per chart, ConfigMap keys no longer set, API
operations removed from the committed specs, new Flyway migrations, `**BREAKING**` CHANGELOG lines, the
`bc-scan.sh` report and the commits since the release, with every candidate marked TODO. Keep, rewrite or drop each
one; delete the evidence block. Running it on main found, for example, `postgresql.primary` / `postgresql.readReplicas`
removed from the persistence charts and the logging formatter key renamed, neither yet in the guide.

## CHANGELOG (`CHANGELOG.md`)

[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), `## [Unreleased]` with `### Added / Changed / Deprecated /
Removed / Fixed / Security`. One bullet per change, written for operators and adopters: what, why it matters, and a link
to the issue and the migration guide. Prefix `**BREAKING:**` or `**BREAKING (charts):**` when action is required.

## Decision records (`docs/architecture/decision-records/`)

Nygard format (see `001-record-architecture-decisions.md`): `NNN-<slug>.md` with Date, Status, Context, Decision,
Consequences and the CC-BY-4.0 NOTICE.

```bash
.claude/skills/migration-guide-and-adr/scripts/new-adr.sh "Encrypt participant configuration at rest"
.claude/skills/migration-guide-and-adr/scripts/new-adr.sh "Replace X" --status Accepted --supersedes 002
```

Write an ADR when a choice constrains future work: security model (ownership checks, scopes), deviating from upstream,
persistence layout, chart structure, supported deployment profiles. Fill Context with the evidence (upstream code at the
pinned version, standards such as CX-0049/CX-0050/CX-0149, DCP), Decision in active voice, and Consequences with migration
steps and how the decision is verified.
