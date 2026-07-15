# Step 4 — Verify DID Documents

[← Activate Participant Contexts](03_activate_participant_contexts.md) | [Next: Create Attestation →](05_create_attestation.md)

---

After creating and activating participant contexts, verify that the DID documents are published and resolvable. This is essential — the DCP flow relies on both parties being able to resolve each other's DIDs.

> **Which method applies to your deployment?** The `curl .../.well-known/did.json` commands
> below assume **domain-root DIDs** served over a public hostname (the Helm/ingress model, e.g.
> `did:web:issuer-service.example.com`). On **Docker Compose** the DIDs are container-internal
> (`did:web:issuerservice%3A10100:issuer`) and are not resolvable from the host — instead check
> the published state via the Identity API:
>
> ```bash
> curl -X POST "${ISSUER_IDENTITY}/v1alpha/participants/${ISSUER_CONTEXT}/dids/state" \
>   -H "Content-Type: application/json" -H "x-api-key: ${ISSUER_API_KEY}" \
>   -d '{"did": "did:web:issuerservice%3A10100:issuer"}'    # expect: PUBLISHED
> ```

## Issuer DID Document

```bash
curl -s "https://issuer-service.example.com/.well-known/did.json" | jq .
```

**Expected response:**

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:web:issuer-service.example.com",
  "verificationMethod": [
    {
      "id": "did:web:issuer-service.example.com#key-1",
      "type": "JsonWebKey2020",
      "controller": "did:web:issuer-service.example.com",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "P-256",
        "x": "...",
        "y": "..."
      }
    }
  ],
  "service": [
    {
      "id": "https://issuer-service.example.com#credential-service",
      "type": "IssuerService",
      "serviceEndpoint": "https://issuer-service.example.com/api/issuance/v1alpha/participants/issuer-participant"
    }
  ]
}
```

## Holder DID Document

```bash
curl -s "https://identity-hub.example.com/.well-known/did.json" | jq .
```

**Expected response:**

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:web:identity-hub.example.com",
  "verificationMethod": [
    {
      "id": "did:web:identity-hub.example.com#key-1",
      "type": "JsonWebKey2020",
      "controller": "did:web:identity-hub.example.com",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "P-256",
        "x": "...",
        "y": "..."
      }
    }
  ],
  "service": [
    {
      "id": "https://identity-hub.example.com#credential-service",
      "type": "CredentialService",
      "serviceEndpoint": "https://identity-hub.example.com/api/credentials/v1/participants/idh-participant"
    }
  ]
}
```

## What to Verify

| Check | What to look for |
|-------|------------------|
| **DID `id`** | Matches the `did` from Steps 1/2 |
| **Verification method** | Contains a `publicKeyJwk` with EC P-256 parameters |
| **Key ID (`id`)** | Matches the `keyId` from Steps 1/2 (e.g., `#key-1`) |
| **Service endpoint** | Correct type (`IssuerService` or `CredentialService`) and URL |

## Troubleshooting

If the DID document returns **404 Not Found**:

1. The participant context may not be activated — run Step 3 first
2. Check the service logs for errors during DID document publication
3. Verify ingress/routing is configured for the DID endpoint (port 8083)

If the DID document is **missing the service endpoint**:

1. Verify the `serviceEndpoints` array was included in the create request
2. Re-create the participant context with the correct service endpoints

---

[Next: Create Attestation →](05_create_attestation.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/usage/dcp-api-walkthrough/04_verify_did_documents.md>