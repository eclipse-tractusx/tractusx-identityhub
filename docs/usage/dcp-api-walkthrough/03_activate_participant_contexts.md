# Step 3 — Activate Participant Contexts

[← Create Holder Participant](02_create_holder_participant.md) | [Next: Verify DID Documents →](04_verify_did_documents.md)

---

After creating participant contexts, they may be in `CREATED` state and not yet active. This step activates them so that their DID documents are published and they can participate in the DCP flow.

> **Note**: If you set `"active": true` in the create request (Steps 1 and 2), the participant contexts may already be active. This step ensures they are activated regardless.

## Activate the Issuer Participant Context

```bash
curl -X PUT "${ISSUER_URL}/api/identity/v1alpha/participants/${ISSUER_CONTEXT}/state?isActive=true" \
  -H "x-api-key: ${ISSUER_ADMIN_KEY}"
```

> **Reminder**: `ISSUER_CONTEXT` is the base64url-encoded participant ID.
> For `issuer-participant`: `echo -n "issuer-participant" | base64` → `aXNzdWVyLXBhcnRpY2lwYW50`

**Response** (204 No Content): Success, no body returned.

## Activate the Holder Participant Context

```bash
curl -X PUT "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}/state?isActive=true" \
  -H "x-api-key: ${IDH_ADMIN_KEY}"
```

**Response** (204 No Content): Success, no body returned.

## Verify Activation

You can confirm the state by retrieving the participant context details:

```bash
# Check Issuer participant state
curl -s "${ISSUER_URL}/api/identity/v1alpha/participants/${ISSUER_CONTEXT}" \
  -H "x-api-key: ${ISSUER_ADMIN_KEY}" | jq .state

# Check Holder participant state
curl -s "${IDH_URL}/api/identity/v1alpha/participants/${IDH_CONTEXT}" \
  -H "x-api-key: ${IDH_ADMIN_KEY}" | jq .state
```

The state should be `ACTIVATED`.

## Participant Context States

| State | Description |
|-------|-------------|
| `CREATED` | Participant context exists but is not yet active; DID document is not published |
| `ACTIVATED` | Participant context is active; DID document is published and resolvable |
| `DEACTIVATED` | Participant context was previously active but has been deactivated |

## Deactivate a Participant Context

To deactivate a participant context (e.g., for maintenance):

```bash
curl -X PUT "${ISSUER_URL}/api/identity/v1alpha/participants/${ISSUER_CONTEXT}/state?isActive=false" \
  -H "x-api-key: ${ISSUER_ADMIN_KEY}"
```

---

[Next: Verify DID Documents →](04_verify_did_documents.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>