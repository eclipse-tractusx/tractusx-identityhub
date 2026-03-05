# Step 5 — Create an Attestation

[← Verify DID Documents](04_verify_did_documents.md) | [Next: Create Credential Definition →](06_create_credential_definition.md)

---

Attestations define how the IssuerService verifies claims before issuing credentials. For this walkthrough, we use a **database attestation** that looks up holder information in the internal `holders` table.

## Request

```bash
curl -X POST "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/attestations" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ISSUER_API_KEY}" \
  -d '{
    "id": "attestation-id",
    "attestationType": "database",
    "configuration": {
      "dataSourceName": "holder",
      "tableName": "holders"
    }
  }'
```

## Response

**201 Created**: Empty body on success.

## How It Works

The `database` attestation type queries the `holders` table (populated when you register holders in [Step 7](07_register_holder.md)). During credential issuance, the IssuerService evaluates this attestation to verify that the requesting holder is registered and retrieves their data for mapping into the credential.

```
┌──────────────────────┐         ┌──────────────────────┐
│   Attestation Config │         │   holders table      │
│                      │         │                      │
│  type: "database"    │────────►│  holder_name         │
│  tableName: "holders"│  reads  │  did                 │
│                      │         │  holderId            │
└──────────────────────┘         └──────────────────────┘
```

## Available Attestation Types

| Type | Description |
|------|-------------|
| `database` | Looks up holder data in a configured database table |
| `presentation` | Requires the holder to present existing credentials |
| `external` | Calls an external service to validate claims |

## Request Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for this attestation — referenced by credential definitions |
| `attestationType` | The type of attestation (see table above) |
| `configuration.dataSourceName` | Name of the data source to query |
| `configuration.tableName` | Database table name containing holder data |

---

[Next: Create Credential Definition →](06_create_credential_definition.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>