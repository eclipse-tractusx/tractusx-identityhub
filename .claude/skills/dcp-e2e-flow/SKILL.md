---
name: dcp-e2e-flow
description: Run and debug the Tractus-X IdentityHub end-to-end DCP flow exactly like CI - Docker Compose stack (sql or memory profile), super-user keys from the logs, and the Postman collection (issuance, presentation, revocation) with newman - and extend the collection. Use for "run the E2E", "prove it works end to end", "the postman-e2e-test job fails", "add a request to the E2E collection", or to reproduce a DCP issue locally.
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

# DCP end-to-end flow

CI (`.github/workflows/postman-e2e-test.yaml`) builds the runtime jars, starts `deployment/docker/docker-compose.yaml` for
a profile, waits for `GET /api/check/health` on 8181 (IdentityHub) and 8182 (IssuerService), reads each super-user API
key from the startup log line `API Key: …`, and runs `docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json` with
`newman@6.2.2`. The script does the same locally.

| Profile | Runtimes | What runs |
|---|---|---|
| `sql` | `identityhub`, `issuerservice` + PostgreSQL + HashiCorp Vault | all folders: issuer/holder setup → issuance configuration → DCP issuance → DCP presentation → credential lifecycle (revoke/suspend/resume) → introspection → cleanup |
| `memory` | `identityhub-memory`, `issuerservice-memory` | `00 · Health`, `01 · Issuer Setup`, `02 · Holder Setup`, `99 · Cleanup` only: the memory runtimes have no `database` attestation source ("Unknown attestation type: database") |

## Commands

```bash
E=.claude/skills/dcp-e2e-flow/scripts/dcp-e2e.sh
$E folders                         # folders and request counts (no Docker needed)
$E run sql                         # build + up + newman, logs on failure, tear down
$E run memory --keep               # keep the stack running afterwards
$E up sql; $E newman sql --folder "05 · Present Credential (DCP Presentation)"   # iterate on one folder
$E keys sql                        # IH_SUPERUSER_KEY / IS_SUPERUSER_KEY for curl, Bruno or the UI
$E logs sql identityhub 300
$E down sql                        # removes volumes
```

Needs Docker, JDK 17+, Node (npx). Host ports: IdentityHub 8181/13131/10100/15151/9292; IssuerService
8182/13132/10101/15251/15152/9392/9999 (see `api-surface` → `contexts`).

## Reading a failure

1. The newman output names the failing request and assertion. Re-run just that folder with `newman`.
2. Look at the runtime log at the same time (`logs`), then map the log message to code: `git grep` in this repo, and
   `ih-src.sh grep '<message fragment>'` upstream.
3. Typical causes:
   - **DID resolution**: the compose stack uses `did:web` over **http** (`edc.iam.did.web.use.https=false`) and a short
     DID-resolver cache. Inspect with `identity-diagnostics` (`did-inspect.sh … --http`).
   - **Status list URL** unreachable from the verifier: `edc.statuslist.callback.address` (chart: `statuslist.callback.address`)
     must be a full URL that holders and verifiers can reach.
   - **Keys or secrets** in the wrong vault partition (memory profile only): the participant secret must be stored with
     the participant context id.
   - **Ports/paths**: the collection's variables (`IH_IDENTITY_URL`, `IS_ADMIN_URL`, …) must match the compose ports.
   - **Timing**: issuance is asynchronous; the collection polls (`POLL_ATTEMPTS`). Raise it only if the flow is slow,
     not to hide a stuck issuance process (query `issuanceprocesses` on the IssuerService admin API).

## Extending the collection

- Add requests to the folder of their phase; keep the numbering. Use collection variables for every id; set them from
  responses in test scripts (`pm.collectionVariables.set`).
- Every request needs at least a status assertion; flows that are eventually consistent poll with a bounded retry
  (see the existing credential request polling).
- If a request cannot work on the memory profile, keep it out of the memory folders and say why in the folder
  description.
- Mirror user-facing additions in the reference collection (`docs/api/postman/Eclipse Tractus-X Identity Hub.json`) and
  the Bruno collection (`docs/api/bruno`); `api-inventory.sh coverage` shows gaps.
