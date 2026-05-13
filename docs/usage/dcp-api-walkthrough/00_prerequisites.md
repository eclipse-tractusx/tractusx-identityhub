# Prerequisites

[← Back to Overview](README.md) | [Next: Create Issuer Participant →](01_create_issuer_participant.md)

---

## Super-User API Keys

When both services start, the `SuperUserSeedExtension` generates a super-user participant context and prints the API key to the logs:

```
IssuerService log:
  [SuperUserSeedExtension] Super-user API key: c3VwZXItdXNlcg==.xxxxxxxxxxxxxxxx

IdentityHub log:
  [SuperUserSeedExtension] Super-user API key: c3VwZXItdXNlcg==.yyyyyyyyyyyyyyyy
```

Save these keys — they are the **admin credentials** for each service.

## Extract the Participant Context ID

The participant context ID is encoded in the API key (everything before the first `.`):

```bash
# The super-user participant context ID is the base64url-encoded "super-user"
echo "c3VwZXItdXNlcg==" | base64 -d
# Output: super-user
```

## Environment Variables

Set the following environment variables for use in all subsequent steps:

```bash
# Replace with actual values from your logs
export ISSUER_URL="https://issuer-service.example.com"
export IDH_URL="https://identity-hub.example.com"
export ISSUER_ADMIN_KEY="<issuer super-user API key>"
export IDH_ADMIN_KEY="<identity-hub super-user API key>"
```

## Requirements

Before starting, ensure you have:

1. **Running instances** of both IssuerService and IdentityHub, deployed with:
   - PostgreSQL database
   - HashiCorp Vault (external or bundled)
   - Ingress / network connectivity between the two services
2. **Super-user API keys** from the startup logs (see above)
3. **curl** or an API client (Postman, Bruno) — this guide uses `curl`
4. Both services accessible via their hostnames

> **Tip**: A ready-to-use Postman collection is available at [`docs/api/postman/DCP_IngressPostgresqlTestFlow.json`](../../api/postman/DCP_IngressPostgresqlTestFlow.json). Import it and fill in the API keys to run the full flow automatically.

---

[Next: Create Issuer Participant →](01_create_issuer_participant.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>