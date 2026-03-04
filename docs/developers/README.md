# Developers Documentation

Welcome to the developer resources for the Tractus-X Identity components. This documentation provides in-depth technical information about the data models, architecture patterns, and implementation details for both IdentityHub and IssuerService.

## Overview

This documentation is designed for developers who need to:

- Understand the internal data models and their relationships
- Implement custom extensions or integrations
- Debug and troubleshoot issues at the data model level
- Contribute to the core codebase
- Design systems that interact with these components

## Components

### [Identity Hub](./components/IdentityHub.md)

The IdentityHub serves as a decentralized identity wallet managing credentials and identities for dataspace participants.

**Key Topics Covered:**
- **Core Data Models**: ParticipantContext, CredentialResource, KeyPairResource, DidResource
- **Data Relationships**: Entity relationship diagrams showing how models interconnect
- **Data Flow**: Complete workflows from participant onboarding to credential presentation
- **Storage Architecture**: How credentials, keys, and DIDs are persisted and managed

**Use Cases:**
- **Credential Storage & Retrieval**: How verifiable credentials are stored and queried within the wallet
- **Participant Onboarding**: Complete participant lifecycle from creation to activation
- **DID Management**: Decentralized identifier creation, resolution, and key pair management
- **Credential Presentation**: Requesting and verifying credential presentations during dataspace interactions

### [Issuer Service](./components/IssuerService.md)

The IssuerService handles the complete credential issuance workflow, from request validation to credential delivery.

**Key Topics Covered:**
- **Core Data Models**: AttestationDefinition, CredentialDefinition, IssuanceProcess, Holder
- **Issuance Workflow**: Complete credential request and delivery flow
- **Credential Status & Revocation**: BitstringStatusList implementation for credential revocation
- **Data Relationships**: How attestations, definitions, and processes work together
- **DCP Protocol Integration**: Implementation of the Decentralized Claims Protocol

**Use Cases:**
- **Attestation Configuration**: Defining custom attestation sources for claim validation
- **Credential Templates**: Creating credential definitions with issuance rules and data mappings
- **Credential Revocation**: Implementing BitstringStatusList for credential status management
- **Holder Registry**: Managing entities authorized to receive credentials

## Setup Guides

### [Linux](./setup/Linux.md)

Comprehensive setup and configuration guide for Linux-based development environments, including:
- Development environment setup
- Local testing configurations

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2026 LKS Next
* SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>
