---
name: api-surface
description: Answer "which API, which port, which path, which auth" for the Tractus-X IdentityHub and IssuerService, and keep the API artefacts in sync - committed OpenAPI specs per web context (docs/api/<service>/<context>.yaml), Swagger UI, Postman and Bruno collections, the DCP API walkthrough and the UI. Use for "what is the endpoint for X", "why 404", "which port is the identity API on", "regenerate the OpenAPI", "OpenAPI-Specs-Up-To-Date fails", "is this endpoint covered by the collections".
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

# API surface

Each runtime serves several **web contexts**, each on its own port and base path. Most "404" reports are a request sent
to the right path on the wrong context.

```bash
A=.claude/skills/api-surface/scripts/api-inventory.sh
$A contexts            # service, context, port/path, compose URL, Helm value, spec, security scheme
$A list participants   # every operation with its compose URL
$A coverage            # E2E / reference Postman / Bruno coverage per operation (gaps first)
$A drift               # regenerate the specs like CI and show the diff
```

## Contexts and who calls them

| Service | Context | Callers | Auth |
|---|---|---|---|
| IdentityHub | `identity` (`/api/identity`) | operators, UI, onboarding tooling | `x-api-key`: participant key or super-user key; scopes (`identity-api:…`) decide what a key may do |
| IdentityHub | `credentials` (`/api/credentials`) | **connectors** (DCP presentation query), **issuers** (DCP storage / offers) | Bearer self-issued ID token of the caller, which carries the access token from the holder's STS |
| IdentityHub | `sts` (`/api/sts`) | the participant's own connector | OAuth2 client credentials (client id = the participant context id, e.g. its DID; secret in the vault under the configured alias) |
| IdentityHub / IssuerService | `did` (`/`) | everyone resolving `did:web` | public |
| IdentityHub / IssuerService | `default` (`/api`) | probes, monitoring | public (`/check/*`, `/v1/version`), plus Swagger UI at `/api/swagger` |
| IssuerService | `issuance` (`/api/issuance`) | **holders** (DCP credential request, status, metadata) | Bearer self-issued ID token of the holder |
| IssuerService | `issueradmin` (`/api/issuer`) | issuer operators | `x-api-key` with `issuer-admin-api:…` scopes |
| IssuerService | `statuslist` (`/statuslist`) | verifiers checking revocation | public |

Verify the security scheme for a specific operation in its spec (`components.securitySchemes`) and the authorization
in the upstream controller (`ih-src.sh read <Controller>`): Tractus-X adds ownership checks
(`extensions/identityhub/*-ownership`).

## Ports differ per deployment

Runtime defaults and compose (`8181`, `15151`, `13131`, …) are not the chart defaults (`8081`, `8082`, `8083`, …).
Compose offsets the IssuerService host ports (8182, 10101, 15251, 9392). Always read the deployment's values. In the
chart, the ingress exposes a list of endpoints per host (`ingresses[].endpoints`).

## Participant ids in URLs

Since EDC 0.17.0 `{participantContextId}` is used **verbatim** in management URLs (no base64). Values containing `:`
(DIDs) must be URL-encoded by clients.

## Changing the API surface

1. The specs are generated from the upstream controllers listed **by class** in `openapi/<service>-spec/build.gradle.kts`
   (one spec per context, see `openapi/README.md`). A new controller or context must be added there.
2. Regenerate and commit: `./gradlew :openapi:identityhub-spec:copyGeneratedSpecToDocs :openapi:issuerservice-spec:copyGeneratedSpecToDocs`.
   CI (`OpenAPI-Specs-Up-To-Date`) fails on drift.
3. Update the collections (`coverage` shows what is missing), the walkthrough (`docs/usage/dcp-api-walkthrough`), and
   `ui/src` if the UI calls it.
4. `bc-scan.sh` reports operations removed from the specs as BREAKING.

`coverage` matches method + path suffix with variables normalised; it cannot tell IdentityHub from IssuerService for
identical paths (`/v1beta/participants/{id}/state`), so read the hits for those.
