# Step 2 — Create the Holder ParticipantContext

[← Create Issuer Participant](01_create_issuer_participant.md) | [Next: Activate Participant Contexts →](03_activate_participant_contexts.md)

---

Create a participant context on the **IdentityHub** that will act as the credential holder.

## Request

```bash
curl -X POST "${IDH_URL}/api/identity/v1alpha/participants" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${IDH_ADMIN_KEY}" \
  -d '{
    "active": true,
    "did": "did:web:identity-hub.example.com",
    "key": {
      "keyGeneratorParams": {
        "algorithm": "Ec",
        "curve": "secp256r1"
      },
      "keyId": "did:web:identity-hub.example.com#key-1",
      "type": "JsonWebKey2020",
      "privateKeyAlias": "did:web:identity-hub.example.com-privatekey-alias"
    },
    "participantId": "idh-participant",
    "roles": ["ROLE_ADMIN", "admin"],
    "serviceEndpoints": [
      {
        "id": "https://identity-hub.example.com#credential-service",
        "type": "CredentialService",
        "serviceEndpoint": "https://identity-hub.example.com/api/credentials/v1/participants/aWRoLXBhcnRpY2lwYW50"
      }
    ]
  }'
```

> **Note**: The Holder's `serviceEndpoint` type is `CredentialService` (not `IssuerService`).
> Encoded ID: `echo -n "idh-participant" | base64` → `aWRoLXBhcnRpY2lwYW50`

## Response

**200 OK:**

```json
{
  "apiKey": "aWRoLXBhcnRpY2lwYW50.<generated-token>",
  "clientId": "idh-participant"
}
```

## Save the API Key

```bash
export IDH_API_KEY="<returned apiKey>"
export IDH_CONTEXT="aWRoLXBhcnRpY2lwYW50"
```

## Issuer vs. Holder Differences

| Field | Issuer (Step 1) | Holder (Step 2) |
|-------|-----------------|-----------------|
| Service | IssuerService | IdentityHub |
| `serviceEndpoints[].type` | `IssuerService` | `CredentialService` |
| `serviceEndpoints[].serviceEndpoint` | `/api/issuance/...` | `/api/credentials/...` |
| `apiKeyAlias` | Required | Optional |

---

[Next: Activate Participant Contexts →](03_activate_participant_contexts.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>