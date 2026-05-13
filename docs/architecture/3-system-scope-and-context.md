# 3. System Scope and Context

## 3.1 Business Context

The **Tractus-X Identity Hub** operates as the central trust anchor for a Dataspace Participant. It acts as the bridge between the technical data exchange (Connector) and the regulatory trust requirements (Issuer).

### 3.1.2 Bussiness Interactions (High Level Flows)

The Identity Hub orchestrates three critical business processes: acquiring credentials (Issuance), maintaining them (Revocation/Renewal), and using them to authorize data transfers (Authentication).

The interaction between the Identity Hub (Holder) and the Issuer Service generally follows two patterns: Pull Mode (Holder initiates) and Push Mode (Issuer initiates).

```mermaid
sequenceDiagram
    participant IH as IdentityHub (Holder)
    participant IS as IssuerService (Issuer)

    IH->>IS: CredentialRequestMessage(holderPid, credentials, selfIssuedIdToken, requestId)
    Note right of IH: HolderRequest = REQUESTING

    IS->>IS: Synchronous verification(auth, attestations, rules)
    IS->>IS: Create IssuanceProcess(state=SUBMITTED)

    IS-->>IH: HTTP 200 ACK
    Note left of IH: HolderRequest = REQUESTED

    Note over IH,IS: Issuance state is now resolved via status polling

    loop Poll status
        IH->>IS: GET /requests/{credentialRequestId}
        IS-->>IH: CredentialRequestStatus(RECEIVED | ISSUED | REJECTED)
    end

    alt Status = ISSUED
        IH->>IH: Store Verifiable Credential(s)
    else Status = REJECTED
        IH->>IH: Mark request as failed
    end
```

### A. Credential Request Flow (IdentityHub → Issuer)

The IdentityHub initiates credential requests by sending a `CredentialRequestMessage` to the Issuer Service. This includes:

```mermaid
sequenceDiagram
    participant IH as IdentityHub
    participant IS as IssuerService

    IH->>IS: CredentialRequestMessage(credentials[], issuerPid, holderPid, requestId)

    IS->>IS: Resolve attestations and Evaluate rules
    IS->>IS: Persist IssuanceProcess(state=SUBMITTED or APPROVED)

    IS-->>IH: HTTP 200 ACK

    loop Status polling
        IH->>IS: GET /requests/{credentialRequestId}
        IS-->>IH: CredentialRequestStatus(RECEIVED | ISSUED | REJECTED)
    end
```

### B. Credential Offer Flow (Issuer → IdentityHub) (not implemented as of 2025-12-17 )

The Issuer can proactively offer credentials to holders through the `IssuerCredentialOfferService`:

```mermaid
sequenceDiagram
    participant IS as IssuerService
    participant IH as IdentityHub

    IS->>IH: CredentialOfferMessage(issuer)
    IH->>IH: Validate issuer & bearer token

    IH-->>IS: 200 OK

    Note over IH: Offer does NOT create an issuance process

    IH->>IS: CredentialRequestMessage (accepted credentials)
    IS->>IS: Start standard issuance flow
```

### C. Status Management Flow (IdentityHub → Issuer)

Credentials are not static; they can be revoked. The Identity Hub periodically checks the status of its stored credentials to ensure they are still valid before using them in a presentation.
So the IdentityHub can check credential status, and the Issuer provides status information.

```mermaid
sequenceDiagram
        IdentityHub->>IssuerService: CredentialRequestStatus(CredentialRequestID)
        IssuerService->>IdentityHub: Send status (RECEIVED,ISSUED or REJECTED)
```

- **Credential Request ID**: For identifying the specific credential.
- **Status Information**: For status checking.

---

## Technical Implementation

The interaction is implemented through several key components:

- **CredentialRequestManager**: Manages the credential request lifecycle on the holder side.
- **IssuerCredentialOfferService**: Handles sending credential offers from issuer to holder.
- **Authentication**: Uses self-issued ID tokens and bearer tokens for security.

---

## Notes

- The IdentityHub and Issuer Service can be deployed as separate services or collocated in the same runtime.
- All interactions are authenticated and authorized using DIDs and tokens.
- The system supports both pull-based (holder requests) and push-based (issuer offers) credential distribution.
- Credential status is managed through status list credentials for efficient revocation checking.
- Issuance and re-issuance, both act the same.

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
