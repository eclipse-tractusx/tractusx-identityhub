# Step 6 — Create a Credential Definition

[← Create Attestation](05_create_attestation.md) | [Next: Register Holder →](07_register_holder.md)

---

A credential definition configures what type of credential can be issued and how attestation data maps into the credential subject.

## Request

```bash
curl -X POST "${ISSUER_ADMIN}/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions" \
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
                }
            ],
        "validity": 10000000000000
        }'
```

> **⚠️ `member_of` mapping is not yet functional:** The default `holders` table schema does not include a `member_of` column, so this mapping will fail at issuance time. See [Step 7](07_register_holder.md) for details.

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

EDC/IdentityHub 0.17.0 ([IH #941](https://github.com/eclipse-edc/IdentityHub/pull/941)) added an `additionalContext` field to the `CredentialDefinition` model so the JSON-LD `@context` of issued credentials can carry entries beyond the base W3C credentials context. This is persisted in the `credential_definitions.additional_context` column added by Flyway migration `V0_0_2__Add_Additional_Context_Column.sql`.

> **Note**: As of 0.17.0 the IssuerAdmin credential-definition API request body does **not** expose `additionalContext` — the `CredentialDefinitionDto` accepts only `id`, `credentialType`, `format`, `jsonSchema`, `jsonSchemaUrl`, `validity`, `attestations`, `rules`, and `mappings`. Credential definitions created through this API therefore store an empty `additional_context` (`[]`), and issued `VC1_0_JWT` credentials carry only the base context:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "MembershipCredential"],
  ...
}
```

Populating `additionalContext` (e.g. with a Catena-X context URL) is not yet possible through the documented Admin API and requires a future API addition or a custom extension that writes the `CredentialDefinition.additionalContext` field directly.

---

## Troubleshooting

### Delete a Credential Definition

If you need to recreate a credential definition (e.g., to fix a misconfiguration), delete it first:

```bash
curl -X DELETE "${ISSUER_ADMIN}/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions/tx-membershipCredential" \
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
curl -s "${ISSUER_ADMIN}/v1alpha/participants/${ISSUER_CONTEXT}/credentialdefinitions/tx-membershipCredential" \
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
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/usage/dcp-api-walkthrough/06_create_credential_definition.md>