# Step 9 — Retrieve Issued Credentials

[← Request Credentials](08_request_credentials.md) | [Next: Verify Credential →](10_verify_credential.md)

---

Query the IdentityHub to check if the credential was delivered successfully.

## Request

```bash
curl -s "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/credentials" \
  -H "x-api-key: ${IDH_API_KEY}" | jq .
```

## Response

**200 OK:**

```json
[
  {
    "credentialId": "f19fbc8e-1912-45a9-9cb2-0945daf6bc38",
    "format": "VC1_0_JWT",
    "state": "ISSUED",
    "type": "MembershipCredential",
    "issuerId": "did:web:issuer-service.example.com",
    "holderId": "did:web:identity-hub.example.com",
    "issuanceDate": "2026-03-04T19:37:50Z",
    "rawVc": "eyJraWQiOiJkaWQ6d2ViOmlzc3Vlci1zZXJ2aWNl..."
  }
]
```

The `rawVc` field contains the JWT-encoded Verifiable Credential.

## Credential States

| State | Description |
|-------|-------------|
| `ISSUED` | Credential has been successfully delivered and stored |
| `REQUESTING` | Credential request is in progress |
| `REQUESTED` | Credential was requested but not yet delivered |
| `REVOKED` | Credential has been revoked by the issuer |

## Decoding the Credential

To inspect the credential contents, decode the JWT (no verification needed for inspection):

```bash
# Extract the payload (second part of the JWT)
echo "<rawVc>" | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

**Decoded payload example:**

```json
{
  "sub": "did:web:identity-hub.example.com",
  "iss": "did:web:issuer-service.example.com",
  "nbf": 1772653070,
  "exp": 10001772653070,
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "MembershipCredential"],
    "issuer": "did:web:issuer-service.example.com",
    "issuanceDate": "2026-03-04T19:37:50.817Z",
    "credentialSubject": {
      "id": "did:web:identity-hub.example.com",
      "holderIdentifier": "BPNL00000003AYRE"
    },
    "credentialStatus": {
      "type": "BitstringStatusListEntry",
      "statusPurpose": "revocation",
      "statusListIndex": 0,
      "statusListCredential": "https://issuer-service.example.com/statuslist/62d95fd4-..."
    }
  }
}
```

## JWT Payload Fields

| Field | Description |
|-------|-------------|
| `sub` | Subject — the holder's DID |
| `iss` | Issuer — the issuer's DID |
| `nbf` | Not Before — Unix timestamp when the credential becomes valid |
| `exp` | Expiration — Unix timestamp when the credential expires |
| `vc.type` | Array of credential types |
| `vc.credentialSubject` | The claims about the holder |
| `vc.credentialStatus` | Revocation status information (BitstringStatusList) |

## Troubleshooting: Empty Response

If the credential list is empty, the issuance may still be in progress or may have failed. Check the [issuance process status](07_register_holder.md):

```bash
curl -X POST "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/issuanceprocesses/query" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ISSUER_API_KEY}" \
  -d '{}' | jq .
```

Look at the `state` field:
- `DELIVERED` → credential was sent but may not have been stored — check IdentityHub logs
- `ERRORED` → check `errorDetail` for the failure reason
- `APPROVED` → issuance is still pending — wait and retry

---

[Next: Verify Credential →](10_verify_credential.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>