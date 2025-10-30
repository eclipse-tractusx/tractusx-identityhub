
# Tractus-x IssuerService

## Overview
The **IssuerService** is a core component of **IdentityHub** responsible for issuing **Verifiable Credentials (VCs)**.  
It handles:

- Validation of issuance requests.
- Application of issuer-defined policies.
- Generation of W3C-compliant credentials.
- Persistence of issuance records.

**Primary external actor:**
- `Client` → requests credential issuance via `IdentityHub`.

---

---

##  Responsibilities

### 1. `issuerservice-core`
- Contains the **core logic** of the IssuerService.
- Responsible for:
    - Orchestrating the issuance workflow.
    - Applying **issuance rules** and policies.
    - Validating claims against credential definitions.
    - Constructing and signing Verifiable Credentials (VCs).

### 2. `issuerservice-credentials`
- Contains **domain models** and structures for credentials.
- Responsible for:
    - Defining credential schemas and data structures.
    - Supporting JSON-LD and W3C-compliant VC representations.
    - Utilities for credential transformation and serialization.

### 3. `issuerservice-holders`
- Handles interactions with **credential holders** (the entity receiving the VC).
- Responsible for:
    - Optional SPI to store or notify holders.
    - Interfacing with `HolderStore` implementations (SQL or other backends).
    - Managing holder-related metadata or attestations.

### 4. `issuerservice-issuance`
- Contains the **implementation of the issuance service**.
- Responsible for:
    - Integrating core logic, credential models, and holder interactions.
    - Recording issuance metadata in the **IssuanceProcessStore**.
    - Exposing SPI or API hooks for external IdentityHub components.
    - Ensuring auditability and traceability of issued credentials.

---

## Key Notes
1. IssuerService only persists metadata, not the full VC. Full VC storage happens in IdentityHub.

2. CredentialDefinitionStore provides schema, policies, and issuer DID.

3. IssuanceProcessStore logs issuance for auditing and potential revocation.

4. Issuerservice-issuance-rules module enforces policy/validation logic.

5. HolderStore can be SQL-backed or another SPI implementation for storing VCs.

IssuerAdminAPI is optional for managing credential definitions and issuer policies.

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2024 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub> 
