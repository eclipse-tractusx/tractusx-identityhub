# Step 1 — Create the Issuer ParticipantContext

[← Prerequisites](00_prerequisites.md) | [Next: Create Holder Participant →](02_create_holder_participant.md)

---

Create a participant context on the **IssuerService** that will act as the credential issuer.

This step:
- Generates an EC key pair (P-256) for signing credentials
- Creates a DID document (`did:web:issuer-service.example.com`)
- Publishes a service endpoint for credential issuance
- Returns a new API key for managing this participant

## Request

```bash
curl -X POST "${ISSUER_URL}/api/identity/v1alpha/participants" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ISSUER_ADMIN_KEY}" \
  -d '{
    "active": true,
    "did": "did:web:issuer-service.example.com",
    "key": {
      "keyGeneratorParams": {
        "algorithm": "Ec",
        "curve": "secp256r1"
      },
      "keyId": "did:web:issuer-service.example.com#key-1",
      "type": "JsonWebKey2020",
      "privateKeyAlias": "did:web:issuer-service.example.com-privatekey-alias"
    },
    "participantId": "issuer-participant",
    "roles": ["ROLE_ADMIN", "admin"],
    "serviceEndpoints": [
      {
        "id": "https://issuer-service.example.com#credential-service",
        "type": "IssuerService",
        "serviceEndpoint": "https://issuer-service.example.com/api/issuance/v1alpha/participants/aXNzdWVyLXBhcnRpY2lwYW50"
      }
    ],
    "apiKeyAlias": "issuer-api-key-alias"
  }'
```

> **Important**: The `serviceEndpoint` URL contains the base64url-encoded participant ID.
> For `issuer-participant`: `echo -n "issuer-participant" | base64` → `aXNzdWVyLXBhcnRpY2lwYW50`

## Response

**200 OK:**

```json
{
  "apiKey": "aXNzdWVyLXBhcnRpY2lwYW50.<generated-token>",
  "clientId": "issuer-participant"
}
```

## Save the API Key

```bash
export ISSUER_API_KEY="<returned apiKey>"
export ISSUER_CONTEXT="aXNzdWVyLXBhcnRpY2lwYW50"
```

## Request Fields

| Field | Description |
|-------|-------------|
| `active` | Whether the participant context should be active immediately (DID published) |
| `did` | The DID to create for this participant |
| `key.keyGeneratorParams` | Algorithm and curve for key pair generation |
| `key.keyId` | The key ID that will appear in the DID document |
| `key.type` | Verification method type (`JsonWebKey2020`) |
| `key.privateKeyAlias` | Alias under which the private key is stored in Vault |
| `participantId` | Unique ID for this participant context |
| `roles` | Roles assigned to this participant |
| `serviceEndpoints` | Service endpoints published in the DID document |
| `apiKeyAlias` | Vault alias for storing the generated API key |

---

[Next: Create Holder Participant →](02_create_holder_participant.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>