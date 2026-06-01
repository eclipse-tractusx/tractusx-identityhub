# Work Summary: Identity Hub Frontend

## Objective

Build an administration frontend for the Eclipse Tractus-X Identity Hub, enabling operators to manage participants, credentials, DIDs, and key pairs through a modern web interface.

## Stack

| Technology | Version | Rationale |
|-----------|---------|-----------|
| React | 18.3.1 | Aligned with the ichub-frontend reference in the same ecosystem |
| TypeScript | 5.7.2 | Type safety across the entire codebase |
| Vite | 6.4.1 | Fast builds, native ESM, HMR |
| MUI | 6.4.5 | Consistent component library with dark theme support |
| Keycloak | 25.0.6 | SSO integration for production deployments |
| Axios | 1.9.0 | HTTP client with interceptors for auth headers |
| Vitest | 3.2.4 | Unit and integration testing |

## What Was Built

Four management sections covering the Identity Hub API, plus cross-cutting infrastructure:

### 1. Participants

![Participants](screenshots/01-participants.png)

- List all participant contexts with status indicators
- Create new participants (generates apiKey, clientId, clientSecret)
- Regenerate API tokens
- Delete participants
- Copy credentials to clipboard

### 2. Key Pairs

![Key Pairs](screenshots/02-keypairs.png)

- List key pairs per participant with state chips (Created, Active, Rotated, Revoked)
- Rotate keys with optional new ID and duration
- Revoke and activate keys

### 3. DID Management

![DID](screenshots/03-dids.png)

- Query DIDs per participant with cached state fetching
- Publish and unpublish DID documents
- Add, replace, and remove service endpoints
- Auto-publish option for endpoints

### 4. Credentials

![Credentials](screenshots/04-credentials.png)

- List verifiable credentials with state tracking (Initial → Requested → Issuing → Issued → Stored → Revoked/Suspended)
- View credential details in a modal (subject, issuer, schemas, raw JSON)
- Edit credential JSON with validation
- Create credentials via structured form
- Request credential issuance via DCP protocol
- Revoke, suspend, and resume credentials

### Cross-Cutting Features

- **Participant Selector** — Sidebar popover for switching between participant contexts
- **Caching** — `useCachedList` hook with module-level cache, instant revisits, background refresh
- **DID Performance** — State fetched alongside documents in a single pass (avoids N+1 requests)

## Backend Integration

- **Backend host:** `ih.tx.corp.hanka.ai` (K8s deployment with ingress routing by path/port)
- **API base path:** `/api/identity/v1alpha`
- **Authentication:** Super-user API key (vault secret `super-user-apikey`), sent via `x-api-key` header
- **Participant IDs:** Base64-encoded in URL paths (e.g., `BPNL00000003CRHK` → encoded for API calls)

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Vite proxy for development | Avoids CORS issues — `/api` requests are proxied to the backend transparently |
| ConfigFactory with dual source | Reads from `window.ENV` (Docker runtime injection) or `import.meta.env` (Vite build-time) — works in both Docker and local dev |
| ParticipantContext with localStorage | Persists active participant selection across sessions, auto-selects first on invalid |
| useCachedList with module-level Map | Shows cached data instantly on revisit, refreshes in background, discards stale fetches |
| Centralized credentials API module | Single source of truth for all credential endpoints, reusable across page and detail views |
| Super-user API key | Single token grants access to all participant contexts, simplifying development and testing |
| Multi-stage Docker build | node:lts-alpine for build, nginx-unprivileged for serve — small image, env injection at runtime |

## Metrics

| Metric | Value |
|--------|-------|
| Test files | 35 |
| Tests | 400 |
| Features | 4 |
| API endpoints integrated | 20+ |
