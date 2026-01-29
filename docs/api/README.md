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

### DCP: Issuance Flow Test

A postman collection that replicates the DCP issuance flow with little user input in a live environment.
The necessary inputs that the developer has to do is to copy the super-user generated x-api-key and paste it in the script.

To start with this collection, import the `DCP_IngressPostgresqlTestFlow.json` in `/docs/api/postman` and 
launch the `IdentityHub` and `IssuerService` with helm chart with `postgresql`, `vault` and `ingress` enabled.

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
- Source URL: https://github.com/eclipse-tractusx/tractusx-identityhub