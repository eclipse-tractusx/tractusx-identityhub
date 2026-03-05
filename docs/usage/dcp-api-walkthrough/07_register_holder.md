# Step 7 — Register the Holder

[← Create Credential Definition](06_create_credential_definition.md) | [Next: Request Credentials →](08_request_credentials.md)

---

Register the IdentityHub as a known holder with the IssuerService. This enables the holder to request credentials.

## Request

```bash
curl -X POST "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/holders" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ISSUER_API_KEY}" \
  -d '{
    "did": "did:web:identity-hub.example.com",
    "holderId": "BPNL00000003AYRE",
    "name": "identity-hub"
  }'
```

## Response

**201 Created**: Empty body on success.

## Request Fields

| Field | Description |
|-------|-------------|
| `did` | The holder's DID — must match the DID created in [Step 2](02_create_holder_participant.md) |
| `holderId` | Unique identifier for the holder (typically their BPNL for Catena-X) |
| `name` | Human-readable name of the holder |

## Important: Attestation Mappings and the `holders` Table

The credential definition mappings defined in [Step 6](06_create_credential_definition.md) read directly from **columns in the `holders` database table**. The holder registration (`holderId`, `name`) populates that table, but the mapped fields (`holder_id`, `member_of`) are columns you must also populate in the database for each holder row.

| Mapping (`input` → `output`) | Source | Credential field |
|---|---|---|
| `did` → `credentialSubject.id` | Holder's DID | Subject identifier |
| `holder_id` → `credentialSubject.holderIdentifier` | `holders.holder_id` column | Holder's BPNL |
| `member_of` → `credentialSubject.memberOf` | `holders.member_of` column | BPN of the organization the holder is a member of |

For **MembershipCredentials** in the Catena-X dataspace, the `holders` table row should look like:

| Column | Example value | Maps to |
|---|---|---|
| `did` | `did:web:identity-hub.example.com` | `credentialSubject.id` |
| `holder_id` | `BPNL00000003AYRE` | `credentialSubject.holderIdentifier` |
| `member_of` | `Catena-X` | `credentialSubject.memberOf` |

The resulting issued credential will contain:

```json
{
  "credentialSubject": {
    "id": "did:web:identity-hub.example.com",
    "holderIdentifier": "BPNL00000003AYRE",
    "memberOf": "Catena-X"
  }
}
```

---

[Next: Request Credentials →](08_request_credentials.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>