# Prerequisites

[← Back to Overview](README.md) | [Next: Create Issuer Participant →](01_create_issuer_participant.md)

---

## Super-User API Keys

When both services start, the `SuperUserSeedExtension` generates a super-user participant context and prints the API key to the logs:

```
IssuerService log:
  [SuperUserSeedExtension] Created user 'ih-super-user'. Please take note of the API Key: aWgtc3VwZXItdXNlcg==..xxxxxxxxxxxxxxxx

IdentityHub log:
  [SuperUserSeedExtension] Created user 'is-super-user'. Please take note of the API Key: aXMtc3VwZXItdXNlcg==.yyyyyyyyyyyyyyyy
```

Save these keys — they are the **admin credentials** for each service.

## Extract the Participant Context ID

The participant context ID is encoded in the API key (everything before the first `.`):

```bash
# The super-user participant context ID is the base64url-encoded "super-user"
echo "c3VwZXItdXNlcg==" | base64 -d
# Output: super-user
```

## Deployment and base URLs

This guide is **deployment-agnostic**: every command uses a per-API base-URL variable, so you
set the variables once for your deployment and the rest of the guide works unchanged. Each API
context is a distinct endpoint, and **its host/port is not the same across deployments** — on
Docker Compose each context is published on its own host port, while under Helm each is reached
through an ingress host (or `kubectl port-forward`).

Set the base URLs for your deployment (values below are for this repo's two deployment options):

| Variable | Docker Compose (`--profile sql`) | Helm / ingress |
|----------|----------------------------------|----------------|
| `IDH_IDENTITY` | `http://localhost:15151/api/identity` | `https://<idh-host>/api/identity` |
| `ISSUER_IDENTITY` | `http://localhost:15251/api/identity` | `https://<issuer-host>/api/identity` |
| `ISSUER_ADMIN` † | `http://localhost:15152/api/issuer` | `https://<issuer-host>/api/admin` |
| `STATUSLIST` | `http://localhost:9999/statuslist` | `https://<issuer-host>/statuslist` |
| `IDH_DEFAULT` | `http://localhost:8181/api` | `https://<idh-host>/api` |
| `ISSUER_DEFAULT` | `http://localhost:8182/api` | `https://<issuer-host>/api` |

> **† The IssuerAdmin API path itself differs**: `/api/issuer` on the Docker Compose config vs
> `/api/admin` on the Helm chart. That difference is already folded into the `ISSUER_ADMIN`
> value above — always use the full `ISSUER_ADMIN` variable, never a hardcoded path.

```bash
# --- example: Docker Compose (sql profile) ---
export IDH_IDENTITY="http://localhost:15151/api/identity"
export ISSUER_IDENTITY="http://localhost:15251/api/identity"
export ISSUER_ADMIN="http://localhost:15152/api/issuer"
export STATUSLIST="http://localhost:9999/statuslist"
export IDH_DEFAULT="http://localhost:8181/api"
export ISSUER_DEFAULT="http://localhost:8182/api"

# super-user API keys from the startup logs (see above)
export ISSUER_ADMIN_KEY="<issuer super-user API key>"
export IDH_ADMIN_KEY="<identity-hub super-user API key>"
```

The full Docker Compose host-port reference is in
[deployment/docker/README.md](../../../deployment/docker/README.md); the Helm container ports
are in each chart's `README.md`.

> **DIDs differ by deployment too.** This guide uses domain-root DIDs like
> `did:web:issuer-service.example.com`, which fit a Helm/ingress deployment where each service
> has its own hostname (the DID document resolves at `https://<host>/.well-known/did.json`, used
> in [Step 4](04_verify_did_documents.md)). On Docker Compose the DIDs are
> `did:web:<service>%3A<port>:<id>` (e.g. `did:web:issuerservice%3A10100:issuer`) and resolve
> only **inside** the compose network — so verify them via the Identity API's `dids/state`
> endpoint rather than fetching `did.json` from the host. For the fully automated Compose flow
> (issuance → presentation → revocation) use the Postman collection referenced below.

## Requirements

Before starting, ensure you have:

1. **Running instances** of both IssuerService and IdentityHub, deployed with:
   - PostgreSQL database
   - HashiCorp Vault (external or bundled)
   - Network connectivity between the two services (each must resolve the other's DID)
2. **Super-user API keys** from the startup logs (see above)
3. **curl** or an API client (Postman, Bruno) — this guide uses `curl`
4. The base URLs above set for your deployment

> **Tip**: A ready-to-use Postman collection that automates this entire walkthrough (and adds presentation + revocation) is available at [`docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json`](../../api/postman/Tractus-X_IdentityHub_Local_E2E.json). Import it, set the two super-user API keys, and run the folders in order — see [docs/api/README.md](../../api/README.md).

---

[Next: Create Issuer Participant →](01_create_issuer_participant.md)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Technovative Solutions
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/usage/dcp-api-walkthrough/00_prerequisites.md>