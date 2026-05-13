# 1. Introduction and goals

The Tractus-X Identity Hub serves as the secure identity backbone for the automotive industry's Catena-X network. Its primary goal is to enable Self-Sovereign Identity (SSI), allowing organizations to prove who they are and what they are certified to do without relying on a central authority. By managing Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) through the Decentralized Claim Protocol (DCP), the Hub automates trust, making data exchange secure and efficient.

It is a specialized and pre-configured variant of the upstream Eclipse Dataspace Components (EDC) IdentityHub, extended to meet the specific interoperability and security requirements of the Tractus-X network.

## Context

The role of identity in Catena-X has evolved significantly. Initially, the focus was simply on having a "Wallet" (a place to store credentials). In those early phases, the idea was often modeled after a physical wallet: a container for keys and certificates that might require manual interaction or complex configuration just to establish a single connection.

However, as the ecosystem matured, it became clear that a standard wallet wasn't enough for high-speed, automated data exchange. The Tractus-X EDC needed an "always-on" partner to handle security instantly, without human intervention. The generic wallet concept struggled to meet the demands of automated renewal (DCP) and high-availability authentication.

This necessity gave rise to the Identity Hub.

The Identity Hub represents the evolution of the wallet into a robust, server-side component designed specifically for the dataspace. It separates the "Identity" duties from the "Data" duties.

## Practical Example

An automotive manufacturer needs to share sustainability data with a supplier.
Instead of manually configuring certificates for each connection:

- The manufacturer's Identity Hub automatically generates signed tokens
- Presents verifiable credentials (e.g., BPN Credential, Membership Credential)
- The supplier validates the identity without manual intervention
  All of this happens in milliseconds, enabling thousands of daily exchanges.

## High level requirements

Based on the abstraction requirement described above the following capabilities should be provided for identity owners and dataspace participants.

### **Identity & Credential Management**

- **DID Management:** Create, resolve, and manage Decentralized Identifiers (did:web) for the organization.

- **Credential Storage:** Securely store Verifiable Credentials (VCs) such as Membership Credentials, BPN Credentials, or Sustainability Framework Credentials.

- **Decentralized Claim Protocol (DCP):** Implement the DCP standard to automatically request, receive, and renew credentials from trusted Issuers (e.g., the Portal) without manual intervention.

- **Key Management:** Securely generate and store cryptographic keys (private keys) in a Vault.

### **Authentication & Token Service**

- **Token Generation:** Generate Self-Issued tokens (SIT) signed with the organization's keys.

- **Verifiable Presentation (VP) Generation:** Packaging credentials into Verifiable Presentations to satisfy access policies of counter-parties.

- **Access Control**: Validate incoming requests from the connector to ensure only authorized connectors can use the identity.

## Quality Goals

| Quality                 | Goal Description                                                                            |
|-------------------------|---------------------------------------------------------------------------------------------|
| **Security**            | Ensure the integrity and confidentiality of the participant's identity                      |
| **Standard Conformity** | Enable strictly compliant implementation of Catena-X Wallet standards (CX-0149)             |
| **Interoperability**    | Guarantee seamless connection with any EDC implementation via standard protocols            |
| **Deployability**       | Provide simple Helm-based deployment for production (PostgreSQL/Vault) and testing (Memory) |
| **Scalability**         | Enable handling of high-frequency token requests for large-scale data exchange              |

## Standards implementation

| Standards ID | Name                     | Desciription                                       |
|--------------|--------------------------|----------------------------------------------------|
|CX-0015       | IAM & Access Control     | Identity and Access Management paradigm            |
|CX-0018       | Dataspace Connectivity   | Standards for connecting and authenticating        |
|CX-0049       | DID Document             | Standard for Decentralized Identifiers             |
|CX-0050       | CX-Specific Credentials  | Data models and Decentralized Claim Protocol (DCP) |
|CX-0149       | Wallet Requirements      | Functional requirements for SSI Wallets            |

### Technology Stack

| Component     | Technology                     |
|---------------|--------------------------------|
| Backend       | Java 17+                       |
| Frontend      | React.js                       |
| Database      | PostgreSQL                     |
| Deployment    | Helm Charts, Docker containers |

### Stakeholders

| Role                  | Description         | Goal, Intention                                                                                                        |
|-----------------------|---------------------|------------------------------------------------------------------------------------------------------------------------|
| Dataspace Participant | The Identity hub    | Recieve and manage VC, KeyPair generation, rotation and revokation, generate and publish DIDs                          |
| Connector             | The technical agent | Consumes the identity services to authenticate itself towards other connectors during data transfer                    |
| Credential Issuer     | Trusted Authority   | To issue or revoke credentials                                                                                         |
| Verifier              | Relying Party       | Receives the VP generated by the Hub and validates integrity, trust, and revocation status before granting data access |

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
