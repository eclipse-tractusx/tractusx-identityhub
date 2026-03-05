# Step 10 — Verify the Credential

[← Retrieve Credentials](09_retrieve_credentials.md) | [Back to Overview](README.md)

---

Once you have the raw JWT credential from [Step 9](09_retrieve_credentials.md), verify its authenticity, validity, and revocation status.

## Using the Verification Script

A verification script is provided at [`scripts/verify-credential.py`](../../../scripts/verify-credential.py) that performs full credential verification:

```bash
python scripts/verify-credential.py "<rawVc JWT>"
```

### What the Script Verifies

| Check | Description |
|-------|-------------|
| **JWT signature** | Resolves the issuer's DID document, extracts the public key, and verifies the ES256 signature |
| **Temporal validation** | Checks `nbf` (not before) and `exp` (expiration) claims |
| **Consistency checks** | Verifies `iss` matches `vc.issuer`, `sub` matches `credentialSubject.id` |
| **Revocation check** | Fetches the BitstringStatusList credential, decompresses the bitstring, checks whether the credential's bit index is set |

### Example Output

```
[6] Signature Verification:
  ✓  Signature is VALID

[7] Revocation Status Check:
  ✓  Credential is NOT revoked (bit 0 is clear)

[8] Consistency Checks:
  ✓  JWT iss matches vc.issuer
  ✓  JWT sub matches credentialSubject.id
  ✓  kid references issuer DID

  ✅  CREDENTIAL IS VALID (signature OK, not revoked)
```

### Dependencies

Install the required Python packages:

```bash
pip install PyJWT cryptography requests
```

## Manual Verification

If you prefer to verify manually:

### 1. Verify the Signature

```bash
# Extract the header to find the kid
echo "<rawVc>" | cut -d. -f1 | base64 -d 2>/dev/null | jq .
```

The `kid` field references a key in the issuer's DID document. Fetch the DID document (see [Step 4](04_verify_did_documents.md)) and match the `kid` to a `verificationMethod` entry with a `publicKeyJwk`.

### 2. Check Temporal Claims

```bash
# Decode the payload and check nbf/exp
echo "<rawVc>" | cut -d. -f2 | base64 -d 2>/dev/null | jq '{nbf, exp, now: now}'
```

- `nbf` (not before): current time must be ≥ this value
- `exp` (expiration): current time must be < this value

### 3. Check Revocation Status

The `vc.credentialStatus` field contains the BitstringStatusList reference:

```bash
# Fetch the status list credential
curl -s "https://issuer-service.example.com/statuslist/<id>" | jq .
```

The status list is a compressed bitstring. If the bit at `statusListIndex` is `1`, the credential has been revoked.

## Additional Operations

### Revoke a Credential

```bash
curl -X POST "${ISSUER_URL}/api/admin/v1alpha/participants/${ISSUER_CONTEXT}/credentials/${CREDENTIAL_ID}/revoke" \
  -H "x-api-key: ${ISSUER_API_KEY}"
```

After revocation, the credential's bit in the status list will be set to `1`.

### Manage Key Pairs

**Rotate a key** (keep for verification but stop signing new credentials):

```bash
curl -X POST "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/keypairs/${KEY_PAIR_ID}/rotate" \
  -H "x-api-key: ${IDH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ "newKeyId": "did:web:identity-hub.example.com#key-2" }'
```

**Revoke a key** (remove from DID document entirely):

```bash
curl -X POST "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/keypairs/${KEY_PAIR_ID}/revoke" \
  -H "x-api-key: ${IDH_API_KEY}"
```

### Publish/Unpublish DID Document

```bash
# Publish
curl -X POST "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/dids/publish" \
  -H "x-api-key: ${IDH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ "did": "did:web:identity-hub.example.com" }'

# Unpublish
curl -X POST "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/dids/unpublish" \
  -H "x-api-key: ${IDH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ "did": "did:web:identity-hub.example.com" }'
```

### Checking Service Health

```bash
# IdentityHub readiness
curl -s "${IDH_URL}/.well-known/api/check/readiness"
# Returns 204 No Content when ready

# IssuerService readiness
curl -s "${ISSUER_URL}/.well-known/api/check/readiness"
# Returns 204 No Content when ready
```

## Troubleshooting

| Issue | Symptom | Solution |
|-------|---------|----------|
| **DID not resolving** | 404 on `/.well-known/did.json` | Activate the participant context ([Step 3](03_activate_participant_contexts.md)) |
| **Credential request returns 400** | Issuance process in `ERRORED` state | Check that holder DID matches, credential definition ID matches |
| **Vault 403 error on startup** | `Failed to set secret with status 403` | Ensure the Vault runtime token has create/update/read/delete/list capabilities |
| **Issuance stuck in APPROVED** | Credential never delivered | Verify the holder's DID document is resolvable and `CredentialService` endpoint is accessible |
| **Signature verification fails** | `InvalidSignatureError` | Ensure the DID document key matches the `kid` in the JWT header |

---

[Back to Overview](README.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>