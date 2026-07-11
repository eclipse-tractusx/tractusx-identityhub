# Tractus-X Identity Hub API Collection

This [directory](./bruno/Eclipse%20Tractus-X%20Identity%20Hub/) contains a [Bruno](https://www.usebruno.com/) API collection for testing and interacting with the Tractus-X Identity Hub API endpoints.

## Prerequisites

1. Install [Bruno](https://www.usebruno.com/) and/or [Postman](https://www.postman.com/downloads/) on your machine
2. Have a running instance of Tractus-X Identity Hub
3. Configure the necessary authentication credentials

## Getting Started

### 1. Open the Bruno Collection

1. Launch Bruno
2. Click "Collection" > "Open Collection" 
3. Navigate to this directory (`/docs/api/bruno`) and select it
4. The collection will be loaded with all available API endpoints

### 1. Open the Postman Collection

1. Launch Postman
2. Click "File" > "Import"
3. Navigate to this directory (`/docs/api/postman`) and select the desired collection
4. The collection will be loaded with all available API endpoints

## API Documentation

### OpenAPI Specification

A comprehensive OpenAPI specification is available at [openAPI.yaml](openAPI.yaml), which documents all available endpoints, request/response schemas, and authentication requirements.

### API Walkthrough

A comprehensive **step-by-step walkthrough** of the full DCP credential issuance flow is available at [`docs/usage/dcp-api-walkthrough/`](../usage/dcp-api-walkthrough/README.md). Each step is documented in its own file:

| Step | Description |
|------|-------------|
| [00 — Prerequisites](../usage/dcp-api-walkthrough/00_prerequisites.md) | Super-user API keys and environment setup |
| [01 — Create Issuer Participant](../usage/dcp-api-walkthrough/01_create_issuer_participant.md) | Create the Issuer's ParticipantContext |
| [02 — Create Holder Participant](../usage/dcp-api-walkthrough/02_create_holder_participant.md) | Create the Holder's ParticipantContext |
| [03 — Activate Participant Contexts](../usage/dcp-api-walkthrough/03_activate_participant_contexts.md) | Activate contexts and publish DID documents |
| [04 — Verify DID Documents](../usage/dcp-api-walkthrough/04_verify_did_documents.md) | Verify DIDs are published and resolvable |
| [05 — Create Attestation](../usage/dcp-api-walkthrough/05_create_attestation.md) | Define holder verification rules |
| [06 — Create Credential Definition](../usage/dcp-api-walkthrough/06_create_credential_definition.md) | Configure credential types and mappings |
| [07 — Register Holder](../usage/dcp-api-walkthrough/07_register_holder.md) | Register the IdentityHub as a known holder |
| [08 — Request Credentials](../usage/dcp-api-walkthrough/08_request_credentials.md) | Trigger the DCP issuance flow |
| [09 — Retrieve Credentials](../usage/dcp-api-walkthrough/09_retrieve_credentials.md) | Retrieve the issued credential |
| [10 — Verify Credential](../usage/dcp-api-walkthrough/10_verify_credential.md) | Verify signature, temporal claims, and revocation |

### Postman Collections

Two collections live in `/docs/api/postman` (import via *File → Import* in Postman):

1. **`Tractus-X_IdentityHub_Local_E2E.json`** — a guided, fully automated end-to-end flow
   (participant setup → DCP credential issuance → presentation → revocation → cleanup) against
   the local [Docker Compose stack](../../deployment/docker/README.md). All variables live
   inside the collection; the only manual input is the two super-user API keys from the runtime
   startup logs. Every request chains its outputs into the next one via test scripts, so the
   whole collection also runs unattended in the Collection Runner or with
   [newman](https://github.com/postmanlabs/newman):

   ```shell
   newman run docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json \
     --env-var "IH_SUPERUSER_KEY=<identityhub super-user key>" \
     --env-var "IS_SUPERUSER_KEY=<issuerservice super-user key>"
   ```

   To target a Helm/ingress deployment instead, adjust the `*_URL` collection variables
   (and the `*_DID` / `*_INTERNAL_*` variables to hostnames the two runtimes can reach
   from inside the cluster).

   > **Note**: the E2E collection requires the **`sql`** compose profile (or the
   > persistence Helm charts). The issuance flow uses the `database` attestation type,
   > which only exists in the SQL runtimes — the `*-memory` runtimes reject it with
   > `Unknown attestation type: database`, so the flow cannot complete there.

2. **`Eclipse Tractus-X Identity Hub.json`** — a per-endpoint reference collection covering
   every REST endpoint of both runtimes, grouped by API. Defaults target the compose stack;
   set the `API_KEY` (management APIs) and `SI_TOKEN` (DCP protocol APIs) variables.

> **EDC 0.17.0 note**: `participantContextId` URL path segments take the **plain** participant
> id (base64url-encoded ids return 404, [IH #937](https://github.com/eclipse-edc/IdentityHub/pull/937)),
> and the create-participant body field is `participantContextId` (formerly `participantId`).
> Both collections already reflect this.

## Additional Information

There is an upstream OpenAPI collection available:

- **Credentials API**: [https://eclipse-edc.github.io/IdentityHub/openapi/credentials-api/](https://eclipse-edc.github.io/IdentityHub/openapi/credentials-api/)
- **Identity API**: [https://eclipse-edc.github.io/IdentityHub/openapi/identity-api/](https://eclipse-edc.github.io/IdentityHub/openapi/identity-api/)
- **Issuer API**: [https://eclipse-edc.github.io/IdentityHub/openapi/issuer-api/](https://eclipse-edc.github.io/IdentityHub/openapi/issuer-api/)
- **Issuer Admin API**: [https://eclipse-edc.github.io/IdentityHub/openapi/issuer-admin-api/](https://eclipse-edc.github.io/IdentityHub/openapi/issuer-admin-api/)

### NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Technovative Solutions
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/api/README.md>