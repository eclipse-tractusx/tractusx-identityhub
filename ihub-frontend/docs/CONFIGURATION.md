# Configuration Reference

All configuration is driven by environment variables prefixed with `VITE_`. Variables can be set in `.env.local` (development) or injected at runtime in Docker.

## Variables

### App

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_APP_ENVIRONMENT` | Runtime environment | `development` | `production` |
| `VITE_APP_VERSION` | Application version | from `package.json` | `0.1.0` |

### API

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_IHUB_BACKEND_URL` | Backend base URL | `http://localhost:8082` | `https://ih.tx.corp.hanka.ai` |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `30000` | `60000` |
| `VITE_API_RETRY_ATTEMPTS` | Number of retry attempts | `3` | `5` |
| `VITE_REQUIRE_HTTPS_URL_PATTERN` | Enforce HTTPS patterns | `true` | `false` |
| `VITE_API_KEY` | Super-user API key | — | `c3VwZXItdXNlcg==.bHGv...` |
| `VITE_API_KEY_HEADER` | Header name for API key | `X-Api-Key` | `x-api-key` |

### Auth / Keycloak

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_AUTH_ENABLED` | Enable authentication | `false` | `true` |
| `VITE_AUTH_PROVIDER` | Auth provider type | `keycloak` | `none` |
| `VITE_KEYCLOAK_URL` | Keycloak server URL | — | `https://keycloak.example.com/auth` |
| `VITE_KEYCLOAK_REALM` | Keycloak realm | — | `identity-hub` |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | — | `ihub-frontend` |
| `VITE_KEYCLOAK_ON_LOAD` | Init behavior | `login-required` | `check-sso` |
| `VITE_KEYCLOAK_CHECK_LOGIN_IFRAME` | Use login iframe | `false` | `true` |
| `VITE_KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI` | Silent SSO redirect | — | `/silent-check-sso.html` |
| `VITE_KEYCLOAK_PKCE_METHOD` | PKCE method | `S256` | `plain` |
| `VITE_KEYCLOAK_ENABLE_LOGGING` | Keycloak debug logs | `false` | `true` |
| `VITE_KEYCLOAK_MIN_VALIDITY` | Min token validity (s) | — | `30` |
| `VITE_KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL` | Iframe check interval (s) | — | `5` |
| `VITE_KEYCLOAK_FLOW` | Auth flow | `standard` | `implicit`, `hybrid` |
| `VITE_AUTH_SESSION_TIMEOUT` | Session timeout (ms) | `3600000` | `7200000` |
| `VITE_AUTH_RENEW_TOKEN_MIN_VALIDITY` | Token renewal threshold (s) | `300` | `60` |
| `VITE_AUTH_LOGOUT_REDIRECT_URI` | Post-logout redirect | — | `https://example.com` |

### Participant

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_PARTICIPANT_ID` | Active participant ID | `BPNL00000003CRHK` | `BPNL00000003AYRE` |

### UI

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_UI_THEME` | Theme mode | `dark` | `light`, `auto` |
| `VITE_UI_LOCALE` | UI locale | `en` | `de` |
| `VITE_UI_COMPACT_MODE` | Compact layout | `false` | `true` |

### Feature Flags

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_ENABLE_ADVANCED_LOGGING` | Verbose logging | `false` | `true` |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | Performance metrics | `false` | `true` |
| `VITE_ENABLE_DEV_TOOLS` | Developer tools | `false` | `true` |

## Local Development

Create `.env.local` in the project root (git-ignored):

```env
VITE_API_KEY=your-super-user-api-key
VITE_API_KEY_HEADER=x-api-key
```

The API key is the super-user key from the Identity Hub vault secret `super-user-apikey`. With this key, the frontend can access all participant contexts without Keycloak.

## Docker Runtime Injection

In production Docker deployments, environment variables are injected at container startup:

1. The Dockerfile renames `index.html` to `index.html.reference`
2. At startup, `inject-dynamic-env.sh` reads `VITE_*` environment variables from the container
3. It generates a `<script>` block that sets `window.ENV = { ... }` with the current values
4. The modified `index.html` is written to `/tmp/index.html` (symlinked from the Nginx root)

This allows the same Docker image to be configured differently per environment without rebuilding.

### Example Docker run with variables

```bash
docker run --rm -p 8080:8080 \
    -e VITE_AUTH_ENABLED=true \
    -e VITE_KEYCLOAK_URL=https://keycloak.example.com/auth \
    -e VITE_KEYCLOAK_REALM=identity-hub \
    -e VITE_KEYCLOAK_CLIENT_ID=ihub-frontend \
    -e VITE_PARTICIPANT_ID=BPNL00000003AYRE \
    ihub-frontend
```

## Configuration Priority

```
window.ENV (Docker runtime)  >  import.meta.env (Vite build-time)  >  defaults
```

The `ConfigFactory` singleton checks `window.ENV` first, then falls back to `import.meta.env`, and finally to hardcoded defaults. This means Docker runtime variables always take precedence.
