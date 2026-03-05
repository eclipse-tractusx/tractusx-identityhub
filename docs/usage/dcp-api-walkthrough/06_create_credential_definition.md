# Step 6 — Create a Credential Definition

[← Create Attestation](05_create_attestation.md) | [Next: Register Holder →](07_register_holder.md)

---

A credential definition configures what type of credential can be issued and how attestation data maps into the credential subject.

## Request

```bash
curl -X POST "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ISSUER_API_KEY}" \
  -d '{
        "attestations": ["attestation-id"],
        "credentialType": "MembershipCredential",
        "format": "VC1_0_JWT",
        "id": "tx-membershipCredential",
        "jsonSchema": "{}",
        "jsonSchemaUrl": "https://raw.githubusercontent.com/eclipse-tractusx/tractusx-profiles/main/cx/credentials/membership.credential.schema.json",
            "mappings": [
                {
                    "input": "did",
                    "output": "credentialSubject.id",
                    "required": true
                },
                {
                    "input": "holder_id",
                    "output": "credentialSubject.holderIdentifier",
                    "required": true
                },
                {
                    "input": "member_of",
                    "output": "credentialSubject.memberOf",
                    "required": true
                }
            ],
        "validity": 10000000000000
        }'
```

## Response

**201 Created**: Empty body on success.

## Understanding Mappings

Mappings transform data from the attestation source (database columns) into credential subject fields:

```
┌──────────────────────┐         ┌───────────────────────────────┐
│   holders table      │         │   Credential Subject          │
│                      │         │                               │
│  did ────────────────┼────────►│  credentialSubject.id         │
│  holder_id ──────────┼────────►│  credentialSubject            │
│  "BPNL00000003AYRE"  │  maps   │    .holderIdentifier          │
│                      │  to     │    = "BPNL00000003AYRE"       │
│  member_of ──────────┼────────►│  credentialSubject.memberOf   │
│  "Catena-X"         │         │    = "BPNL00000003CSGV"      │
└──────────────────────┘         └───────────────────────────────┘
```

| Field | Description |
|-------|-------------|
| `input` | Column name from the attestation source (e.g., database table column) |
| `output` | Dot-notation path in the credential subject (e.g., `credentialSubject.holderIdentifier`) |
| `required` | If `true`, issuance fails when the input value is missing |

## Understanding Validity

The `validity` field sets the credential expiration in **seconds** from the issuance time:

| Value | Duration |
|-------|----------|
| `31536000` | 1 year |
| `63072000` | 2 years |
| `10000000000000` | ~317,000 years (effectively never expires) |

## Credential Format Options

| Format | Description |
|--------|-------------|
| `VC1_0_JWT` | W3C Verifiable Credentials v1.0, JWT compact serialization |
| `VC1_0_JSON_LD` | W3C Verifiable Credentials v1.0, JSON-LD format |

## Request Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for this credential definition (e.g., `tx-membershipCredential`) — referenced in issuance requests |
| `credentialType` | The type of verifiable credential to issue (e.g., `MembershipCredential`) |
| `format` | Output format for the credential (see format options above) |
| `attestations` | List of attestation IDs that must be evaluated before issuance |
| `jsonSchema` | Inline JSON schema for credential validation (use `"{}"` to skip) |
| `jsonSchemaUrl` | URL to an external JSON schema for credential validation |
| `mappings` | Array of input→output mappings from attestation data to credential fields |
| `validity` | Credential validity duration in seconds from issuance time |

## Credential Context (`@context`)

The `@context` of issued credentials is **not configurable** via the credential definition API. It is hardcoded in [`JwtCredentialGenerator.java`](https://github.com/eclipse-edc/IdentityHub/blob/main/core/issuerservice/issuerservice-issuance/src/main/java/org/eclipse/edc/issuerservice/issuance/generator/JwtCredentialGenerator.java):

```java
Map.of(JsonLdKeywords.CONTEXT, List.of(VcConstants.W3C_CREDENTIALS_URL), ...)
```

Issued `VC1_0_JWT` credentials will always contain:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "MembershipCredential"],
  ...
}
```

To add custom `@context` entries (e.g., a Catena-X context URL), you would need to extend or replace the `CredentialGenerator` implementation — it is an `@ExtensionPoint` in the EDC framework.

---

## Troubleshooting

### Delete a Credential Definition

If you need to recreate a credential definition (e.g., to fix a misconfiguration), delete it first:

```bash
curl -X DELETE "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions/tx-membershipCredential" \
  -H "x-api-key: ${ISSUER_API_KEY}"
```

**Response** (204 No Content): Credential definition deleted successfully.

| Response Code | Meaning |
|---------------|---------|
| `204` | Deleted successfully |
| `401` | Unauthorized — check your API key |
| `404` | Credential definition not found — already deleted or wrong ID |

After deleting, you can re-run the `POST /credentialdefinitions` request to recreate it.

### Get a Credential Definition by ID

Verify a credential definition was created correctly:

```bash
curl -s "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions/tx-membershipCredential" \
  -H "x-api-key: ${ISSUER_API_KEY}" | jq .
```

---

[Next: Register Holder →](07_register_holder.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>