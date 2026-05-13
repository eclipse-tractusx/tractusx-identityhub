# Developer Documentation Hub

This directory contains the complete documentation for the Identity Hub and Issuer Service components. The documentation is organized by target audience and functional area.

## Required Knowledge

To effectively work with this project, familiarity with the following technologies is recommended:

- **Kubernetes**: Container orchestration platform for deploying and managing the applications
- **Minikube**: Local Kubernetes environment for development and testing
- **Helm**: Package manager for Kubernetes, used for deploying the charts
- **PostgreSQL**: Relational database used for persistent storage
- **HashiCorp Vault**: Secrets management system for secure credential storage

## Best Practices

- Use the official Helm charts for all deployments
- Follow the [Installation Guide](../INSTALL.md) for local development setup
- Test API endpoints using the provided Postman or Bruno collections

> [!NOTE]
> When testing, it is recommended to enable ingress to avoid working with port-forwarding. Refer to the respective chart documentation for ingress configuration options, including hostname, TLS settings, and annotations.

## Documentation Resources

### [Developer Documentation](./developers/README.md)

Technical documentation for understanding the core data models, architecture patterns, and implementation details of both IdentityHub and IssuerService components.

This section provides detailed information about entity relationships, state machines, and complete workflow diagrams.
Additionally, includes setup guides for configuring development environments.

### [API Documentation](./api/README.md)

Complete API reference and testing resources, including:

- **OpenAPI Specification**: Full API documentation with endpoints, schemas, and authentication requirements
- **Postman Collection**: Ready-to-use Postman collection for issuance flow testing
- **Bruno Collection**: Lightweight, Git-friendly API collection for Bruno
- **Testing Guide**: Instructions for setting up and running API tests

### [DCP API Walkthrough](./usage/dcp-api-walkthrough/README.md)

Step-by-step guide for the full DCP credential issuance flow, including:

- Creating and activating participant contexts on both IssuerService and IdentityHub
- Configuring attestations, credential definitions, and holders
- Requesting and receiving a **MembershipCredential** via the DCP protocol
- Verifying the issued credential (signature, revocation status)

See the full [Usage Guides index](./usage/README.md) for all available walkthroughs.

### [Migration Guide](./admin/migration-guide.md)

Administrator guide for migrating between chart versions, including:

- Chart version migration instructions
- Bitnami dependency updates and image repository changes
- PostgreSQL version compatibility notes

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>
