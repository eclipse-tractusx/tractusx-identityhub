# 5. Building Blocks View

This section describes the building blocks for the two main components:

- Identity Hub (IH)

- IssuerService (IS)

Both components follow a hexagonal architecture (Ports & Adapters), separating core domain logic from external systems, APIs, and infrastructure.

- Core modules contain the business logic (domain).

- Ports define interfaces for interactions with external systems.

- Adapters implement these interfaces, enabling integration with databases, VDRs, STS, or external services.

## Identity Hub Component

### 1. Identity Hub Hexagonal Architecture

The following diagram illustrates how the Core logic is isolated from infrastructure via SPIs.

```mermaid
flowchart TD
subgraph Core["Core Domain"]
VCM["VerifiableCredentialManager"]
DIDS["DID Service"]
KPM["KeyPairManager"]
PCM["Participant Context Module"]
end

subgraph SPI["Service Provider Interfaces (Ports)"]
VC_SPI["VerifiableCredential SPI"]
DID_SPI["DID SPI"]
KPM_SPI["KeyPair SPI"]
PC_SPI["ParticipantContext SPI"]
API_SPI["Identity API SPI"]
end

subgraph Adapters["Adapters / External Integrations"]

DB["Database / Stores"]
VDR["Verifiable Data Registry"]
STS["Secure Token Service"]
Audit["Audit Logs"]
end

VCM --> VC_SPI
DIDS --> DID_SPI
KPM --> KPM_SPI
PCM --> PC_SPI
VC_SPI --> DB & Audit
DID_SPI --> VDR
KPM_SPI --> DB
PC_SPI --> DB
API_SPI --> STS & DB
```

## Modules and Services

The **Identity Hub** is composed of several modules and services that interact to manage decentralized identities, verifiable credentials, and associated operations. The diagram below illustrates the high-level architecture and relationships between these components.

```mermaid
flowchart TD
subgraph APIs["APIs"]
A1["Management API"]
A2["Hub API"]
end
subgraph subGraph1["Shared Modules"]
DIDCORE["Identity DID Core"]
KEYPAIR["KeyPair Module"]
end
subgraph Libraries["Libraries"]
CRYPTO["Crypto Core Library"]
end
ASM["Aggregate Services Module"] --> A1 & A2
VC["VC Module"] --> ASM
DID["DID Module"] --> ASM
AUTH["Auth/Permission Module"] --> ASM
PC["Participant Context Module"] --> ASM & AUTH
DIDCORE --> DID
CRYPTO --> KEYPAIR
KEYPAIR --> ASM

     A1:::api
     A2:::api
     DIDCORE:::shared
     KEYPAIR:::shared
     CRYPTO:::lib
    classDef api fill:#b5e7a0,stroke:#333,stroke-width:1px
    classDef shared fill:#dce6f2,stroke:#333,stroke-width:1px
    classDef lib fill:#f9f2a7,stroke:#333,stroke-width:1px


```

---

### **Verifiable Credential Module**

**Responsibilities:**

- CRUD operations for Verifiable Credentials (VCs),
- Runs the `VerifiableCredentialManager`.
- Exchanges protocol messages with the Issuer, e.g., in response to a credential-offer.

**VerifiableCredentialManager:**

- Can be configured for **auto-renewal** (default mode is true).
- Once renewal is triggered, the VC moves into the `REISSUE_REQUESTING` state.
- Renewal can be triggered by:
   1. An incoming credential offer.
   2. Nearing expiry (if auto-renewal is active).
   3. Manual action via the Identity API.

**Verifiable Credential Lifecycle:**

```mermaid
stateDiagram-v2
    [*] --> INITIAL : 200 OK / 201 Created (VcStatus 100)
    INITIAL --> REQUESTING : 202 Accepted (VcStatus 200)
    REQUESTING --> REQUESTED : 202 Accepted / 200 OK (VcStatus 300)
    REQUESTED --> ISSUING : 202 Accepted (VcStatus 400)
    ISSUING --> ISSUED : 201 Created (VcStatus 500)
    ISSUED --> REISSUE_REQUESTING : 202 Accepted (VcStatus 200)
    REISSUE_REQUESTING --> REISSUE_REQUESTED : 202 Accepted (VcStatus 300)
    REISSUE_REQUESTED --> ISSUING : 202 Accepted (VcStatus 400)
    ISSUED --> TERMINATED : 204 No Content (VcStatus 600)
    INITIAL --> ERROR : 400 / 500 (VcStatus -100)
    REQUESTING --> ERROR : 400 / 500 (VcStatus -100)
    REQUESTED --> ERROR : 400 / 500 (VcStatus -100)
    ISSUING --> ERROR : 500 (VcStatus -100)
    REISSUE_REQUESTING --> ERROR : 500 (VcStatus -100)
    REISSUE_REQUESTED --> ERROR : 500 (VcStatus -100)
```

---

### Participant Context Module

The Participant Context module manages the storage and lifecycle of participant contexts in the Identity Hub:

- It contains the ParticipantContextStore, which performs CRUD operations on participant entries.

- Mutating operations (create, update, delete) are only allowed by a super-user — typically a technical account used for onboarding or administrative tasks.

- Each participant context is uniquely identified by a **participant ID**.

- Clients must include their **participant ID** with every request to the Hub APIs so that the Identity Hub can locate the correct participant context.

```mermaid
%% Participant Context Module Access Flow
flowchart TD
    Participant["Participant Client"]
    SuperUser["Super-User Client"]
    IdentityAPI["Identity API"]
    ParticipantContextService["ParticipantContextService"]
    ParticipantContextStore["ParticipantContextStore"]

    %% Participant flow (read-only)
    Participant -->|Read requests with Participant ID| IdentityAPI
    IdentityAPI -->|Lookup participant context| ParticipantContextService
    ParticipantContextService -->|Read from store| ParticipantContextStore
    ParticipantContextStore -->|Return data| ParticipantContextService
    ParticipantContextService -->|Return participant context| IdentityAPI


    %% Super-User flow

    SuperUser -->|create/update/delete participant| IdentityAPI

    IdentityAPI -->|Authorize & forward| ParticipantContextService
    ParticipantContextService -->|Write to store| ParticipantContextStore
    ParticipantContextStore -->|Confirmation| ParticipantContextService
    ParticipantContextService -->|Return result| IdentityAPI
```

**Participant Context Lifecycle:**

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> ACTIVATED
  CREATED --> DESTROYED
  ACTIVATED --> DESTROYED
  DESTROYED --> [*]
```

---

### DID Module

```mermaid
%% 2. DID Module
flowchart LR
DIDService["DidDocumentService"]
KeyPairModule["KeyPair Module"]
DidStore["DidResourceStore"]
IdentityAPI["Identity API"]

    DIDService -->|Create/Read/Update/Delete| DidStore
    KeyPairModule -->|Key Rotation Events| DIDService
    IdentityAPI -->|Manual Actions| DIDService
```

**Responsibilities:**

- Create, read, update, and optionally delete DID resources in the `DidResourceStore`.
- Publish/overwrite DID documents using the configured publishers.
- React to **key rotation events** from the KeyPair module (add new keys, remove old keys).
- Respond to manual actions via the Identity API.

---

### KeyPair Module

```mermaid
%% 3. KeyPair Module
flowchart LR
KeyPairService["KeyPairService"]
KeyStore["Key Storage"]
IdentityAPI["Identity API"]

    KeyPairService -->|Generate/Maintain Keys| KeyStore
    KeyPairService -->|Automatic Renewal| KeyStore
    KeyPairService -->|Emit Events on Rotation| DIDService
    IdentityAPI -->|Manual Actions| KeyPairService
```

**Responsibilities:**

- Generate and maintain key pairs using a state machine.
- Check for automatic renewal based on configured maximum key lifetimes.
- Emit events when a key is rotated.
- Respond to manual actions via the Identity API.

**KeyPair Lifecycle:**

```mermaid
stateDiagram-v2
    [*] --> CREATED : 201 Created (KeyPairState 100)
    CREATED --> ACTIVATED : 200 OK / 202 Accepted (KeyPairState 200)
    ACTIVATED --> ROTATED : 202 Accepted (KeyPairState 300)
    ROTATED --> REVOKED : 204 No Content (KeyPairState 400)
    
    CREATED --> ERROR : 400 or 500
    ACTIVATED --> ERROR : 400 or 500
    ROTATED --> ERROR : 400 or 500
    REVOKED --> ERROR : 400 or 500
```

---

### Aggregate Services Module

The Aggregate Services Module is responsible for orchestrating complex operations that involve multiple lower-level services within the Identity Hub. Rather than having each client call several services individually, this module provides a single, cohesive interface to perform higher-level tasks.

#### **Key Responsibilities**

1. **Transaction Handling**
    - Ensures that multi-step operations across different services are executed reliably.
    - Supports **atomicity**, so that if one step fails, the module can roll back previous operations to maintain consistency.

2. **Service Orchestration**
    - Coordinates calls to various modules such as the **Participant Service**, **Credential Service**, and **Key Service**.
    - Combines results from these services to return a unified response to the client.

3. **Resource Management**
    - Maintains the state of resources across modules.
    - Handles event publishing to notify other parts of the system about changes in resources or contexts.

4. **Simplified Client Interaction**
    - Clients do not need to understand the internal dependencies between services.
    - Provides a higher-level API that abstracts the complexity of multiple underlying modules.

---

### SPI Module

The SPI Module (Service Provider Interface) provides extension points that allow the Identity Hub to interact with external systems or to swap implementations of internal functionality without modifying the core code. SPIs are abstractions.

---

## IssuerService component

### 1. Overview

The **IssuerService** is a component that is responsible for issuing **Verifiable Credentials (VCs)**.
It handles:

- Validation of issuance requests.
- Application of issuer-defined policies.
- Generation of W3C-compliant credentials.
- Persistence of issuance records.

The IssuerService is composed of several core modules and exposes SPIs for extensibility:

```mermaid

flowchart TD
%% Core Modules
subgraph Core["IssuerService Core Modules"]
ISC["issuerservice-core"]
ICR["issuerservice-credentials"]
IHS["issuerservice-holders"]
ISU["issuerservice-issuance"]
end

%% SPIs
subgraph SPIs["Service Provider Interfaces"]
C_SPI["Credential SPI"]
I_SPI["Issuance SPI"]
H_SPI["Holder SPI"]
end

%% External Stores / Adapters
subgraph Adapters["External Stores / Adapters"]
HolderStore["HolderStore"]
IssuanceStore["IssuanceProcessStore"]
CredentialDefStore["CredentialDefinitionStore"]
end

%% Connections
ISC --> ISU
ICR --> ISU
IHS --> ISU

ISU --> C_SPI
ISU --> I_SPI
IHS --> H_SPI

C_SPI --> IssuanceStore
C_SPI --> CredentialDefStore
H_SPI --> HolderStore
```

---

### 2. Core Modules of IssuerService

#### Issuerservice-core

- Contains the **core logic** of the IssuerService.
- Responsible for:
  - Orchestrating the issuance workflow.
  - Applying **issuance rules** and policies.
  - Validating claims against credential definitions.
  - Constructing and signing Verifiable Credentials (VCs).

#### Issuerservice-credentials

- Contains **domain models** and structures for credentials.
- Responsible for:
  - Defining credential schemas and data structures.
  - Supporting JSON-LD and W3C-compliant VC representations.
  - Utilities for credential transformation and serialization.

#### Issuerservice-holders

- Handles interactions with **credential holders** (the entity receiving the VC).
- Responsible for:
  - Optional SPI to store or notify holders.
  - Interfacing with `HolderStore` implementations (SQL or other backends).
  - Managing holder-related metadata or attestations.

#### Issuerservice-issuance

- Contains the **implementation of the issuance service**.
- Responsible for:
  - Integrating core logic, credential models, and holder interactions.
  - Recording issuance metadata in the **IssuanceProcessStore**.
  - Exposing SPI or API hooks for external IdentityHub components.
  - Ensuring auditability and traceability of issued credentials.

---

### 3. IssuerService SPIs

The IssuerService exposes several SPIs (Service Provider Interfaces) to allow for extensibility and customization:

#### Issuerservice-credential-spi

Handles credential status management and operations:

- **CredentialStatusService**: Manages credential lifecycle operations like revocation, suspension, and status checking.
- **IssuerCreentialOfferService**: Sends credential offers to holders proactively.

#### Issuerservice-issuance-spi

Manages the credential issuance process lifecycle:

- **AttestationSource**: Sources data when an attestation pipeline is executed for credential issuance requests
- **AttestationContext**: Provides access to context data for attestation evaluation, including validated token claims and participant ID
- **CredentialGenerator**: Generates and signs credentials based on definitions and claims
- **CredentialGeneratorRegistry**: Registry for credential generators based on CredentialFormat
- **IssuanceProcess**: Tracks credential issuance processes through states ( SUBMITTED, APPROVED, DELIVERED,ERRORED).

#### Issuerservice-holder-spi

Manages holder-related operations:

- **HolderService**: Manages holder information and operations within the issuer service context.

### Key Notes

1. IssuerService only persists metadata, not the full VC. Full VC storage happens in IdentityHub.

2. CredentialDefinitionStore provides schema, policies, and issuer DID.

3. IssuanceProcessStore logs issuance for auditing and potential revocation.

4. Issuerservice-issuance-rules module enforces policy/validation logic.

5. HolderStore can be SQL-backed or another SPI implementation for storing VCs.

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
