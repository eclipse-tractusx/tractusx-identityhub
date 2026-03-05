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
    "holderId": "BPNL00000003AYRE", # Any other identifier can be used (including the DID), for Catena-X use your assigned BPNL.
    "name": "identity-hub"
  }'
```

## Response

**201 Created**: Empty body on success.

## Request Fields

| Field | Description |
|-------|-------------|
| `did` | The holder's DID — must match the DID created in [Step 2](02_create_holder_participant.md) |
| `holderId` | Unique identifier for the holder (typically the same as their DID or can be any unique identifier, in the case of Catena-X use your assigned BPNL) |
| `name` | Human-readable name, also used as the `holder_name` in database attestations |

## Important: The `name` Field and Attestation Mappings

The `name` field is the value that gets mapped via the `holder_name → credentialSubject.holderIdentifier` mapping defined in [Step 6](06_create_credential_definition.md).

For **MembershipCredentials** in the Catena-X dataspace, set the `name` to the **Business Partner Number (BPN)**:

```json
{
  "did": "did:web:identity-hub.example.com",
  "holderId": "did:web:identity-hub.example.com",
  "name": "BPNL00000003AYRE"
}
```

This ensures the issued credential's `credentialSubject.holderIdentifier` is set to the BPN:

```json
{
  "credentialSubject": {
    "id": "did:web:identity-hub.example.com",
    "holderIdentifier": "BPNL00000003AYRE"
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