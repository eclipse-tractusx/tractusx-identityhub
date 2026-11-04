---
name: identity-diagnostics
description: Diagnose decentralized-identity failures around the Tractus-X IdentityHub and IssuerService - did:web resolution and DID document linting, self-issued ID tokens, access tokens, Verifiable Presentations and Credentials (decode, expiry, kid vs DID document, status entries), and the usual DCP failure chain (catalog empty, negotiation terminated, credential request stuck, presentation empty). Use for "my DID does not resolve", "the connector says the VP is invalid", "decode this token", "credential request stays in REQUESTED", "presentation query returns no credentials".
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

# Identity diagnostics

## Tools

```bash
D=.claude/skills/identity-diagnostics/scripts
$D/did-inspect.sh did:web:identityhub.example.com:holder --probe           # resolve over https, lint, probe services
$D/did-inspect.sh did:web:localhost%3A10100:holder --http                    # compose stack (http)
$D/did-inspect.sh --file did.json --did did:web:…                            # a document you already have
$D/jwt-inspect.sh "$TOKEN"                                                   # bare JWT or "Bearer …"
$D/jwt-inspect.sh response.json --did-check                                  # JSON with presentation/vp_token/token fields
pbpaste | $D/jwt-inspect.sh - --did-check --http
```

`did-inspect` maps `did:web:<host>[%3A<port>][:<path>…]` to `https://<host>[:<port>]/<path>/did.json` (no path →
`/.well-known/did.json`) and checks: `id` equals the DID, verification methods carry public key material and **no
private key**, relationships point at existing methods, `CredentialService` (holder) ends with
`…/v1/participants/<participantContextId>` and is not base64-encoded, `IssuerService` (issuer) present with an
`assertionMethod`, and with `--probe` that every service endpoint answers.

`jwt-inspect` decodes (it does **not** verify signatures) self-issued ID tokens (incl. the nested access token in
`token`), VP JWTs and nested VC JWTs. It flags expiry, `nbf` in the future, missing `kid`, `kid` not belonging to `iss`,
empty presentations, expired credentials and credentials without a status entry. `--did-check` resolves each issuer
DID and checks the `kid` is one of its verification methods (rotated or revoked keys show up here). The output contains
all claims: do not paste production tokens into public issues.

## The DCP chain: walk it in order

**Presentation (connector ↔ IdentityHub)**
1. The connector resolves the counterparty DID (BDRS maps BPNL → DID) → `did-inspect.sh <did>`.
2. It finds `CredentialService` in the DID document and calls `POST <endpoint>/presentations/query` with a self-issued
   ID token whose `token` claim is an access token minted by the **holder's** STS for the requested scopes.
3. The IdentityHub validates the token (issuer DID, `kid`, audience, expiry), maps scopes to credential queries
   (`TxScopeToCriterionTransformer`, `tx.identityhub.scope.aliases`), and returns a VP.
4. The verifier checks the VP and each VC signature against the issuer DID, the trusted issuers list, expiry and the
   status list (revocation).

| Symptom | Look at |
|---|---|
| Empty catalog / negotiation TERMINATED at the connector | Connector log first (Tractus-X EDC, ask the Connector Sensei); then decode the VP: are the expected credential types in it? |
| `presentations/query` → 401 | `jwt-inspect` the bearer token: expired, wrong `aud`, `kid` not in the caller's DID, nested `token` missing |
| VP contains no credentials | Scope string vs stored credential types: Tractus-X mapping in `runtimes/identityhub*/…/TxScopeToCriterionTransformer.java` (`tx.identityhub.scope.aliases`), upstream default `ih-src.sh read EdcScopeToCriterionTransformer`; credential state in the holder (`GET …/credentials`) |
| VC rejected as revoked/suspended | `statusListCredential` URL reachable by the verifier; issuer admin `…/credentials/{id}/status` |

**Issuance (IdentityHub ↔ IssuerService)**
1. Holder: `POST /api/identity/v1beta/participants/{id}/credentials/request` (issuer DID, credential object ids).
2. The holder resolves the issuer DID → `IssuerService` endpoint, sends a DCP `CredentialRequestMessage` with a
   self-issued token.
3. Issuer: holder must be registered (`…/holders`), attestations evaluated (`database` attestation needs the SQL
   runtime), credential definition rules applied, credential signed and delivered to the holder's `CredentialService`
   (`POST …/credentials` storage API).

| Symptom | Look at |
|---|---|
| Request stays `REQUESTED`/`CREATED` | Issuer `…/issuanceprocesses/query`; issuer log for attestation or rule failures; holder known as a holder? |
| `Unknown attestation type: database` | Memory runtime: no database attestation source (use the sql profile) |
| Delivery fails | Holder `CredentialService` endpoint reachable from the issuer; DID document of the holder |
| Credential stored but not presented | Its `usage`/state, its type vs the scope mapping |

## Then

Map every log message to code (`git grep`, `ih-src.sh grep '<fragment>'`), reproduce with the `dcp-e2e-flow` skill, and
end with the concrete fix (config line, DID document change, request body) and how to verify it.
