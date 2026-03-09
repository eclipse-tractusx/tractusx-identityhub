# Usage Guides

This directory contains step-by-step usage guides for integrating with the Tractus-X IdentityHub and IssuerService components.

## Available Guides

### [DCP API Walkthrough](./dcp-api-walkthrough/README.md)

End-to-end guide for the **Decentralized Claims Protocol (DCP)** credential issuance flow. Covers:

- Creating and activating participant contexts on both IssuerService and IdentityHub
- Configuring attestations, credential definitions, and holders
- Requesting and receiving a **MembershipCredential** via the DCP protocol
- Verifying the issued credential (signature, revocation status)

| Step | Description |
|------|-------------|
| [00 — Prerequisites](./dcp-api-walkthrough/00_prerequisites.md) | Super-user API keys and environment setup |
| [01 — Create Issuer Participant](./dcp-api-walkthrough/01_create_issuer_participant.md) | Create the Issuer's ParticipantContext |
| [02 — Create Holder Participant](./dcp-api-walkthrough/02_create_holder_participant.md) | Create the Holder's ParticipantContext |
| [03 — Activate Participant Contexts](./dcp-api-walkthrough/03_activate_participant_contexts.md) | Activate contexts and publish DID documents |
| [04 — Verify DID Documents](./dcp-api-walkthrough/04_verify_did_documents.md) | Verify DIDs are published and resolvable |
| [05 — Create Attestation](./dcp-api-walkthrough/05_create_attestation.md) | Define holder verification rules |
| [06 — Create Credential Definition](./dcp-api-walkthrough/06_create_credential_definition.md) | Configure credential types and mappings |
| [07 — Register Holder](./dcp-api-walkthrough/07_register_holder.md) | Register the IdentityHub as a known holder |
| [08 — Request Credentials](./dcp-api-walkthrough/08_request_credentials.md) | Trigger the DCP issuance flow |
| [09 — Retrieve Credentials](./dcp-api-walkthrough/09_retrieve_credentials.md) | Retrieve the issued credential |
| [10 — Verify Credential](./dcp-api-walkthrough/10_verify_credential.md) | Verify signature, temporal claims, and revocation |

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>