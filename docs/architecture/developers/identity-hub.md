# Identity Hub - Tractus-X

## Purpose
The Identity Hub centralizes decentralized identity management for participants in the dataspace, supporting issuance, storage and presentation of verifiable credentials.

## Internal Services
- **Credential Service (CS)**: API to issue, store and present VCs/VPs. Ensures W3C VC formats and compatibility with DCP.
- **DID Service (DIDS)**: Management of key pairs, publication of DID Documents (e.g. `did:web`), key rotation and revocation.
- **Identity Service (IS)**: CRUD for organizational identities, mapping to DIDs, trust metadata.
- **Security Token Service (STS)**: Issues short-lived tokens for access to internal APIs (does not replace OIDC; oriented to M2M).

## Main Flows

1. **Credential Issuance**:
    - An external Issuer Service requests VC issuance from the Credential Service, authenticating via STS token.
    - The Credential Service validates the request, generates the VC, and stores it.
2. **Credential Presentation**:
    - A Connector requests a Verifiable Presentation (VP) from the Credential Service to prove certain
    - attributes.
    - The Credential Service retrieves the relevant VCs, constructs the VP, and returns it.
3. **DID Management**:
    - The DID Service generates key pairs, creates and publishes DID Documents using `did:web`.
    - It handles key rotation and revocation as needed.
5. **Token Issuance**:
    - The STS issues short-lived access tokens to authenticated clients for accessing IH services.
    - Tokens are validated on each request to ensure secure access.

## Key Features
- W3C Verifiable Credentials and Presentations support.
- DCP protocol compliance for automated trust exchange.
- DID Document management with `did:web`.
- Secure token issuance for M2M authentication.
- Integration points for Issuer Services and external verifiers.
- Key lifecycle management (generation, rotation, revocation).
- Audit logging for credential operations.


## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2024 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub> 
