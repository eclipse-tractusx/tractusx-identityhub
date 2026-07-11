# Local Development with Docker Compose

This directory provides a Docker Compose setup for running all four runtime variants
of tractusx-identityhub locally without requiring Minikube or Helm.

Two **profiles** are available:

| Profile | Services started | Use when |
|---------|-----------------|----------|
| `memory` | `identityhub-memory`, `issuerservice-memory` | Fastest dev loop; no external dependencies |
| `sql` | `identityhub`, `issuerservice`, `postgres`, `vault` | Full stack with PostgreSQL + HashiCorp Vault |

> **Note:** The `memory` and `sql` profiles share the same host ports (e.g. `8181`, `8182`,
> `15151`, `15251`) and therefore **cannot be run simultaneously**. Stop one profile
> (`docker compose --profile <name> down`) before starting the other.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2 (`docker compose version` ≥ 2.14)
- JDK 21+ and [Gradle](https://gradle.org/) (or use the wrapper `./gradlew`)

---

## Step 1 — Build the runtime JARs

Run from the **repository root**:

```shell
./gradlew shadowJar
```

This produces all four JARs under their respective `runtimes/*/build/libs/` directories and
also processes resources (including `logging.properties`) required by the Docker build.

---

## Step 2 — Configure environment variables (optional)

Copy `.env.example` to `.env` inside this directory and adjust values if needed:

```shell
cp .env.example .env
```

The defaults (`postgres`/`postgres` credentials, Vault token `token`) work out of the box.

---

## Step 3 — Start the services

### Memory profile (no database, no Vault)

```shell
# Run from this directory (deployment/docker/)
docker compose --profile memory up -d --build
```

### SQL profile (PostgreSQL + HashiCorp Vault)

```shell
docker compose --profile sql up -d --build
```

> **Notes:**
> - The `--build` flag is only needed on the first run or after rebuilding the JARs.
>   Subsequent starts can omit it: `docker compose --profile memory up -d`.
> - The `-d` flag runs containers in detached mode. Omit it to see logs streamed in the
>   foreground; use `docker compose --profile <name> logs -f` to follow logs when detached.

---

## Port reference

### identityhub / identityhub-memory

| Endpoint | Host port | Container port | Path |
|----------|-----------|----------------|------|
| Default API | 8181 | 8181 | `/api` |
| Credentials API | 13131 | 13131 | `/api/credentials` |
| DID | 10100 | 10100 | `/` |
| Identity API | 15151 | 15151 | `/api/identity` |
| STS | 9292 | 9292 | `/api/sts` |

### issuerservice / issuerservice-memory

Within a single profile both runtimes start side-by-side, so the issuerservice host ports
that would otherwise conflict with identityhub are offset by one (e.g. `8182` instead of `8181`).
Container-internal ports remain identical for both runtimes.

| Endpoint | Host port | Container port | Path |
|----------|-----------|----------------|------|
| Default API | 8182 | 8181 | `/api` |
| Issuance API | 13132 | 13132 | `/api/issuance` |
| DID | 10101 | 10100 | `/` |
| Identity API | 15251 | 15151 | `/api/identity` |
| Issuer Admin API | 15152 | 15152 | `/api/issuer` |
| STS | 9392 | 9292 | `/api/sts` |
| Status List | 9999 | 9999 | `/statuslist` |

### SQL profile – infrastructure

| Service | Host port | Notes |
|---------|-----------|-------|
| PostgreSQL | 5432 | Configurable via `POSTGRES_PORT` in `.env` |
| HashiCorp Vault | 8200 | Configurable via `VAULT_PORT` in `.env` |

---

## Quick health check

The runtimes expose a JSON health endpoint on the default API port. A healthy response
returns `"isSystemHealthy":true`; the `sql` profile additionally reports the `Hashicorp
Vault Health` component.

```shell
# identityhub  (both profiles)
curl http://localhost:8181/api/check/health

# issuerservice  (both profiles)
curl http://localhost:8182/api/check/health
```

Example output (SQL profile):

```json
{"componentResults":[{"failure":null,"component":"Hashicorp Vault Health","isHealthy":true},{"failure":null,"component":"BaseRuntime","isHealthy":true}],"isSystemHealthy":true}
```

API version information is served on the **default** context (there is no dedicated
version port in EDC 0.17.0 — the runtime ignores `web.http.version.*` settings):

```shell
curl http://localhost:8181/api/v1/version   # identityhub
curl http://localhost:8182/api/v1/version   # issuerservice
```

---

## Super-user API keys

On first start each runtime seeds an admin (super-user) participant and prints its API key
once to the logs — grab them with:

```shell
docker compose --profile sql logs identityhub   | grep "API Key"
docker compose --profile sql logs issuerservice | grep "API Key"
```

> **Grep returns nothing?** The key is only printed when the super-user is first
> *created*. If a runtime container was recreated (e.g. `up -d --build` after an earlier
> session) while the postgres volume persisted, the seed finds the existing super-user and
> stays silent. Recover the keys from the still-running dev Vault:
>
> ```shell
> docker exec docker-vault-1 sh -c 'VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=token vault kv get -field=content secret/ih-super-user-apikey'; echo
> docker exec docker-vault-1 sh -c 'VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=token vault kv get -field=content secret/is-super-user-apikey'; echo
> ```
>
> (The trailing `; echo` matters when copying from the terminal: the raw output has no
> final newline, so zsh appends a reverse-video `%` marker that is easy to copy into the
> key by accident — a key pasted with that `%` fails with 401 `Invalid API token`.)
>
> This works only while the Vault container survives (dev-mode Vault is in-memory). If
> Vault was recreated too, the stored keys are gone — reset for a clean seed:
> `docker compose --profile sql down -v && docker compose --profile sql up -d`.

The SQL profile deliberately uses **different super-user IDs** per runtime
(`ih-super-user` / `is-super-user`, set via `edc.ih.api.superuser.id`): both runtimes share
the single dev-mode Vault, and the seed extension derives its Vault aliases from this ID —
with identical IDs the runtime that starts second would silently overwrite the first one's
secrets, invalidating its logged API key.

With the two keys you can drive the full DCP issuance/presentation/revocation flow using the
Postman collection at
[`docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json`](../../docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json)
— all other variables are pre-set for this compose stack (usage: [docs/api/README.md](../../docs/api/README.md)).

---

## Stopping and cleaning up

```shell
# Stop and remove containers (keep volumes)
docker compose --profile memory down
# or
docker compose --profile sql down

# Remove containers AND the postgres volume (full reset)
docker compose --profile sql down -v
```

---

## Configuration

The `config/` subdirectory contains per-runtime `configuration.properties` files that are
mounted read-only into the containers at `/app/configuration.properties`:

```
config/
  identityhub/configuration.properties        # SQL variant – full config with vault + datasource URLs
  identityhub-memory/configuration.properties # memory variant – full config, no vault/DB settings
  issuerservice/configuration.properties      # SQL variant – full config with vault + datasource URLs
  issuerservice-memory/configuration.properties # memory variant – full config, no vault/DB settings
```

> **Important:** EDC's `-Dedc.fs.config` mechanism loads **only** the external file; it does
> not merge with the `application.properties` bundled in the JAR. Each `configuration.properties`
> here is therefore self-contained and mirrors the corresponding
> `runtimes/*/src/main/resources/application.properties`, with the SQL variants also having
> all datasource URLs and the Vault URL set to the compose service hostnames.

### Customising credentials

Edit `.env` or set environment variables before running `docker compose`. The available
variables are documented in `.env.example`.

### DID resolution over HTTP vs HTTPS

The `edc.iam.did.web.use.https` setting controls how `did:web` DIDs are resolved:

| Value | Resolves `did:web:host%3Aport:path` via | Use for |
|-------|------------------------------------------|---------|
| `true` (default) | `https://host:port/path/did.json` | **Production** — DID documents are served over TLS |
| `false` | `http://host:port/path/did.json` | **Local docker / dev** — inter-container traffic is plain HTTP |

The bundled `config/*/configuration.properties` files set this to `false`, because a full
**DCP credential-exchange flow** between the bundled runtimes (e.g. the issuerservice
resolving a holder's `did:web` document over the compose network) requires resolution over
plain HTTP — containers reach each other via `http://issuerservice:10100/...`, and the
HTTPS resolver would fail with `Unsupported or unrecognized SSL message`.

Two more settings in the bundled configs exist solely to make the local DCP flow work:

```properties
# Status-list credentials must embed a URL the OTHER container can reach
edc.statuslist.callback.address=http://issuerservice:9999/statuslist
# Short DID cache: re-created participants get fresh keys; a long cache would
# serve stale DID documents and fail signature checks until it expires
edc.did.resolver.cache.expiry=10000
```

> **Security:** Never set `edc.iam.did.web.use.https=false` in production. A DID document
> fetched over plain HTTP can be tampered with in transit, undermining the trust anchor of
> the whole credential exchange. Production deployments must serve DIDs over HTTPS and leave
> this setting at its `true` default.

---

## Notes

- **HashiCorp Vault runs in dev mode** — data is stored in memory and lost on container
  restart. This is intentional for local development. Never use dev mode in production.
- **Flyway migrations run automatically** at startup for the SQL variants; no manual
  schema initialisation is required beyond the database creation performed by
  `postgres/init/01-create-databases.sh`. Each store maintains its own
  `flyway_schema_history_<store>` table in the target database.
- The `OTEL_JAR` build argument required by the existing Dockerfiles is satisfied by
  the OpenTelemetry agent downloaded to `build/resources/otel/opentelemetry-javaagent.jar`
  during the Gradle build. The javaagent line in the `ENTRYPOINT` is commented out by
  default, so it is copied into the image but not activated at runtime.

---

## Licenses

- Apache-2.0 for code
- CC-BY-4.0 for non-code

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2026 Technovative Solutions
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/deployment/docker/README.md>
