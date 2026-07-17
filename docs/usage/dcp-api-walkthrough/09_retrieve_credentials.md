# Step 9 — Retrieve Issued Credentials

[← Request Credentials](08_request_credentials.md) | [Next: Verify Credential →](10_verify_credential.md)

---
Check the issuance status of the verifiable credential and retrieve the issued credential.

## Check Issuance Status by Request ID

You can query the status of a **specific** credential
request directly by its request ID — the `holderPid` you set as `${IDH_REQUEST_ID}` in
[Step 8](08_request_credentials.md). This is useful while a request is still in progress and
hasn't produced a stored credential yet. Issuance is asynchronous — expect `REQUESTED` for a few seconds, then `ISSUED`.

## Request

```bash
curl -s "${IDH_IDENTITY}/v1alpha/participants/${IDH_CONTEXT}/credentials/request/${IDH_REQUEST_ID}" \
  -H "x-api-key: ${IDH_API_KEY}" | jq .
```

## Response

**200 OK:**

```json
{
  "issuerDid": "did:web:issuer-service.example.com",
  "holderPid": "49b1cb75-30d2-4098-8f58-03c75304adc3",
  "issuerPid": "dde94591-557a-4b00-befe-fc1993171dae",
  "status": "ISSUED",
  "typesAndFormats": [
      {
          "id": "membership-credential-def",
          "credentialType": "MembershipCredential",
          "format": "VC1_0_JWT"
      }
  ]
}
```

## Query for the Stored Credentials
Query the IdentityHub to check if the credential was delivered successfully. The response contains all the stored credentials.

## Request

```bash
curl -s "${IDH_IDENTITY}/v1alpha/participants/${IDH_CONTEXT}/credentials" \
  -H "x-api-key: ${IDH_API_KEY}" | jq .
```

## Response

**200 OK:**

```json
[
  {
    "id": "6a0b425b-f744-4ff6-ab89-33753c5409f2",
    "createdAt": 1784224246642,
    "participantContextId": "holder",
    "timestamp": 1784224246642,
    "issuerId": "did:web:issuer-service.example.com",
    "holderId": "did:web:identity-hub.example.com",
    "metadata": {
        "credentialObjectId": "membership-credential-def"
    },
    "state": 500,
    "timeOfLastStatusUpdate": null,
    "issuancePolicy": null,
    "reissuancePolicy": null,
    "verifiableCredential": {
        "rawVc": "eyJraWQiOiJkaWQ6d2ViOmlzc3VlcnNlcnZpY2Ul...",
        "format": "VC1_0_JWT",
        "credential": {
            "credentialSubject": [
                {
                    "id": "did:web:identity-hub.example.com",
                    "holderIdentifier": "BPNL00000003AYRE"
                }
            ],
            "id": "6a0b425b-f744-4ff6-ab89-33753c5409f2",
            "type": [
                "VerifiableCredential",
                "MembershipCredential"
            ],
            "issuer": {
                "id": "did:web:issuer-service.example.com",
                "additionalProperties": {}
            },
            "issuanceDate": "2026-07-16T17:50:46.570314084Z",
            "expirationDate": "2027-07-16T17:50:46.570315459Z",
            "credentialStatus": [
                {
                    "id": "aeeae77c-759b-42a6-9571-a006f4662d40",
                    "type": "BitstringStatusListEntry",
                    "statusPurpose": "revocation",
                    "statusListIndex": 0,
                    "statusListCredential": "http://issuer-service.example.com/statuslist/d08a9ac8-8c9a-4bf4-be5d-c8732790494b"
                }
            ],
            "description": null,
            "name": "did:web:identity-hub.example.com",
            "dataModelVersion": "V_1_1",
            "credentialSchema": [],
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ]
        }
    },
    "usage": "Holder"
  }
]
```

The `verifiableCredential` field contains the Verifiable Credential. The `rawVc` field contains the JWT-encoded Verifiable Credential.

Use the [Credential States](#credential-states) table below to interpret the `state` code — e.g.
`500` (`ISSUED`) means the credential was delivered successfully, while `-100` (`ERROR`) means the
request failed.

**404 Not Found**: No credential request exists with that ID for this participant context.

## Credential States

| State | State Meaning | Description |
|-------------|-------|-------------|
| 100 | `INITIAL` | Credential request has been created but processing has not started |
| 200 | `REQUESTING` | Credential request is in progress |
| 300 | `REQUESTED` | Credential was requested but not yet delivered |
| 400 | `ISSUING` | Credential is being generated and signed by the issuer |
| 500 | `ISSUED` | Credential has been successfully delivered and stored |
| 600 | `REVOKED` | Credential has been revoked by the issuer |
| 700 | `SUSPENDED` | Credential has been temporarily suspended |
| 800 | `EXPIRED` | Credential has passed its expiration date |
| 900 | `NOT_YET_VALID` | Credential's validity period has not started yet |
| -100 | `ERROR` | Credential issuance or processing failed |

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
  "nbf": 1784224246,
  "iss": "did:web:issuer-service.example.com",
  "exp": 1815760246,
  "iat": 1784224246,
  "vc": {
    "issuanceDate": "2026-07-16T17:50:46.570314084Z",
    "credentialSubject": {
      "holderIdentifier": "BPNL00000003AYRE",
      "id": "did:web:identity-hub.example.com"
    },
    "id": "0d2cf63d-5eac-4e42-bb4f-4e3242f45316",
    "type": [
      "VerifiableCredential",
      "MembershipCredential"
    ],
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "issuer": "did:web:issuer-service.example.com",
    "expirationDate": "2027-07-16T17:50:46.570315459Z",
    "credentialStatus": {
      "statusPurpose": "revocation",
      "statusListIndex": 0,
      "id": "aeeae77c-759b-42a6-9571-a006f4662d40",
      "type": "BitstringStatusListEntry",
      "statusListCredential": "http://issuer-service.example.com/statuslist/d08a9ac8-8c9a-4bf4-be5d-c8732790494b"
    }
  },
  "jti": "6a0b425b-f744-4ff6-ab89-33753c5409f2"
}
```

## JWT Payload Fields

| Field | Description |
|-------|-------------|
| `sub` | Subject — the holder's DID |
| `iss` | Issuer — the issuer's DID |
| `nbf` | Not Before — Unix timestamp when the credential becomes valid |
| `exp` | Expiration — Unix timestamp when the credential expires |
| `iat` | Issued At — Unix timestamp when the JWT was signed |
| `jti` | JWT ID — unique identifier for this JWT, matches `verifiableCredential.id` |
| `vc.id` | The verifiable credential's unique identifier |
| `vc.type` | Array of credential types |
| `vc.@context` | JSON-LD context(s) defining the vocabulary used in the credential |
| `vc.issuer` | Issuer — the issuer's DID, as asserted inside the credential itself |
| `vc.issuanceDate` | ISO 8601 timestamp when the credential was issued |
| `vc.expirationDate` | ISO 8601 timestamp when the credential expires |
| `vc.credentialSubject` | The claims about the holder |
| `vc.credentialStatus` | Revocation status information (BitstringStatusList) |

---

[Next: Verify Credential →](10_verify_credential.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Technovative Solutions
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/usage/dcp-api-walkthrough/09_retrieve_credentials.md>