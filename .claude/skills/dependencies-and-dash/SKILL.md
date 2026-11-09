---
name: dependencies-and-dash
description: Check third-party licenses with Eclipse Dash exactly like the Tractus-X IdentityHub CI (dash-scan.yml) and keep DEPENDENCIES and DEPENDENCIES_UI up to date - CI fails when DEPENDENCIES is out of date or a dependency is rejected. Use for "add a library", "bump a dependency", "dash-scan fails", "is this license allowed", dependabot PRs, or any change to gradle/libs.versions.toml, build.gradle.kts or ui/package.json.
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

# Dependencies and Eclipse Dash

Here, unlike some Tractus-X repositories, **`DEPENDENCIES` is committed and checked**: `dash-scan.yml` regenerates it
with `./gradlew allDependencies` + Eclipse Dash and fails on out-of-date entries (`fail_on_out_of_date: true`) and on
rejected licenses. A PR that changes dependencies must commit the regenerated file. The UI has its own
`DEPENDENCIES_UI`.

```bash
H=.claude/skills/dependencies-and-dash/scripts/dash-check.sh
$H --list-only            # coordinates diff only (fast, offline from Eclipse APIs)
$H                        # full Dash run, compare with the committed DEPENDENCIES
$H --write                # ... and overwrite DEPENDENCIES with the result (review the diff, commit it)
$H --ui --list-only       # UI: ui/package-lock.json vs DEPENDENCIES_UI
$H --ui --write
```

The Gradle list uses the same command and extraction as CI (Perl instead of `grep -P` for macOS). Verified on main:
400 coordinates, identical to the committed file; Dash reported 400 approved, with two entries whose approval authority
changed (`clearlydefined` → an IP ticket), which the script reports separately.

## UI lockfiles

`ui/` has both `package-lock.json` and `pnpm-lock.yaml` (the README uses pnpm). The committed `DEPENDENCIES_UI` matches
`package-lock.json` (every package present; 26 entries are stale), not the pnpm tree, so the script uses
`package-lock.json` by default; `IH_DASH_UI_LOCK=pnpm` switches. Keep one lockfile authoritative and say which in the PR.

## When Dash says restricted or rejected

1. `restricted` = not yet vetted. CI tolerates it (`fail_on_restricted: false`), but the release needs an IP review:
   request one (Dash `-review` with a token, or the Eclipse IP issue tracker) and mention it in the PR.
2. `rejected` blocks the PR. Find an alternative or a different version.
3. Check that the dependency is really needed at runtime; test-only dependencies are scanned too (`allDependencies`).

## Checklist for a dependency change

- [ ] Version in `gradle/libs.versions.toml` (no inline versions in `build.gradle.kts`)
- [ ] `dash-check.sh --write` run, `DEPENDENCIES` diff reviewed and committed
- [ ] UI: `DEPENDENCIES_UI` regenerated when `ui/package*.json` changed
- [ ] CHANGELOG entry when the change is user-visible (security fix, runtime library)
