# Glossary

The following table defines the key acronyms, terms, and components used throughout the architecture documentation.

| Term / Acronym | Definition |
| :--- | :--- |
| **DCP** | **Decentralized Claims Protocol**. A protocol used in the dataspace for exchanging Verifiable Presentations to establish trust between participants. |
| **DID** | **Decentralized Identifier**. A globally unique identifier (URI scheme) that is cryptographically verifiable and does not require a centralized registration authority (e.g., `did:web:example.com`). |
| **DID Document** | A JSON-LD document associated with a DID that contains public keys (Verification Methods) and service endpoints. It allows others to verify signatures associated with that identity. |
| **DidPublisher** | An internal component responsible for constructing the DID Document and uploading it to the **VDR**. |
| **Hexagonal Architecture** | Also known as "Ports & Adapters". An architectural pattern used here to isolate the core domain logic (business rules) from external details like databases, APIs, or the VDR. |
| **Identity Hub (IH)** | The core software component that acts as the "User Agent" for a participant, managing their keys, DIDs, and Verifiable Credentials. |
| **Issuer Service (IS)** | A specialized component or extension dedicated to the *issuance* lifecycle. It validates requests and generates signed VCs but typically does not store the full VC after issuance (for privacy reasons). |
| **KeyPairManager (KPM)** | The module responsible for the lifecycle of cryptographic keys (generation, rotation, revocation) and secure storage of private keys. |
| **Participant Context (PC)** | A logical isolation boundary (tenant) within the Identity Hub. It segregates resources (keys, VCs) so that multiple participants can be securely hosted on a single Hub instance. |
| **SPI** | **Service Provider Interface**. A set of interfaces defined by the core system that allows developers to plug in different implementations (Adapters) for external dependencies like storage or VDRs. |
| **STS** | **Secure Token Service**. A module that generates short-lived access tokens (often Self-Issued Tokens) used to authenticate API calls or interactions with other connectors. |
| **Super Admin** | The user or system with elevated privileges (Super-User) responsible for infrastructure-level tasks, specifically creating and deleting Participant Contexts. |
| **VCM** | **Verifiable Credential Manager**. The core module that manages the state machine of a credential (e.g., from `INITIAL` to `ISSUED`) and handles storage operations. |
| **VC** | **Verifiable Credential**. A tamper-evident digital credential containing claims about a subject, signed by an issuer. |
| **VDR** | **Verifiable Data Registry**. The external system or network where DID Documents are published to make them publicly resolvable (e.g., a web server, a blockchain, or an ION node). |
| **VP** | **Verifiable Presentation**. A data model derived from one or more VCs (or self-signed claims) that is shared with a verifier to prove identity or attributes. |

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
