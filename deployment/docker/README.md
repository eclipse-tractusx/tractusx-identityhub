# Local Development with Docker Compose

This directory provides a Docker Compose setup for running all four runtime variants
of tractusx-identityhub locally without requiring Minikube or Helm.

Two **profiles** are available:

| Profile | Services started | Use when |
|---------|-----------------|----------|
| `memory` | `identityhub-memory`, `issuerservice-memory` | Fastest dev loop; no external dependencies |
| `sql` | `identityhub`, `issuerservice`, `postgres`, `vault` | Full stack with PostgreSQL + HashiCorp Vault |

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
docker compose --profile memory up --build
```

### SQL profile (PostgreSQL + HashiCorp Vault)

```shell
docker compose --profile sql up --build
```

> **Note:** The `--build` flag is only needed on the first run or after rebuilding the JARs.
> Subsequent starts can omit it: `docker compose --profile memory up`.

---

## Port reference

### identityhub / identityhub-memory

| Endpoint | Host port | Container port | Path |
|----------|-----------|----------------|------|
| Default API | 8181 | 8181 | `/api` |
| Version | 7171 | 7171 | `/.well-known/api` |
| Credentials API | 13131 | 13131 | `/api/credentials` |
| DID | 10100 | 10100 | `/` |
| Identity API | 15151 | 15151 | `/api/identity` |
| STS | 9292 | 9292 | `/api/sts` |

### issuerservice / issuerservice-memory

Host ports that would conflict with identityhub are offset to avoid collisions when both services run simultaneously within the same profile.

| Endpoint | Host port | Container port | Path |
|----------|-----------|----------------|------|
| Default API | 8182 | 8181 | `/api` |
| Version | 7172 | 7171 | `/.well-known/api` |
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

```shell
# Version endpoint – identityhub
curl http://localhost:7171/.well-known/api

# Version endpoint – issuerservice
curl http://localhost:7172/.well-known/api
```

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
  identityhub/configuration.properties        # SQL variant – vault + datasource URLs
  identityhub-memory/configuration.properties # memory variant – no overrides needed
  issuerservice/configuration.properties      # SQL variant – vault + datasource URLs
  issuerservice-memory/configuration.properties # memory variant – no overrides needed
```

The SQL override files point all datasources at `postgres:5432` and the Vault client at
`http://vault:8200` (the compose service names), overriding the `localhost` defaults in
the bundled `application.properties`.

### Customising credentials

Edit `.env` or set environment variables before running `docker compose`. The available
variables are documented in `.env.example`.

---

## Notes

- **HashiCorp Vault runs in dev mode** — data is stored in memory and lost on container
  restart. This is intentional for local development. Never use dev mode in production.
- **Liquibase migrations run automatically** at startup for the SQL variants; no manual
  schema initialisation is required beyond the database creation performed by
  `postgres/init/01-create-databases.sh`.
- The `OTEL_JAR` build argument required by the existing Dockerfiles is satisfied by
  passing the main runtime JAR as a placeholder. The OpenTelemetry javaagent line in the
  `ENTRYPOINT` is commented out by default, so the placeholder is never loaded at runtime.

---

## Licenses

- Apache-2.0 for code
- CC-BY-4.0 for non-code
