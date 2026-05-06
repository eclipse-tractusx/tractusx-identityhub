# Development Guide

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** (comes with Node.js)
- Access to the Identity Hub backend (or a running local instance)

## Installation

```bash
pnpm install
```

## Environment Configuration

Create `.env.local` in the project root:

```env
VITE_API_KEY=your-super-user-api-key-here
VITE_API_KEY_HEADER=x-api-key
```

The API key is the super-user key from the Identity Hub backend (vault secret `super-user-apikey`). This single key provides access to all participant contexts.

See [CONFIGURATION.md](CONFIGURATION.md) for the full list of environment variables.

## Development Server

```bash
pnpm dev
```

Opens at `http://localhost:5173` with hot module replacement.

### Vite Proxy

In development mode, Vite proxies all `/api` requests to the backend:

```
Browser → localhost:5173/api/* → ih.tx.corp.hanka.ai/api/*
```

The proxy target is configured in `vite.config.ts`:

```typescript
server: {
    proxy: {
        '/api': {
            target: 'http://ih.tx.corp.hanka.ai',
            changeOrigin: true,
        }
    }
}
```

To point to a different backend, modify the `target` URL in `vite.config.ts`.

## Production Build

```bash
pnpm build          # Fast build (esbuild only)
pnpm build:full     # TypeScript check + build
```

Output goes to `dist/`. Preview locally with:

```bash
pnpm preview
```

## Docker

Build and run the Docker image:

```bash
pnpm build:docker     # Builds ihub-frontend image
pnpm start:docker     # Runs on port 8080
```

The Docker image uses a multi-stage build:
1. **Build stage** — `node:lts-alpine3.23`, runs `pnpm install --frozen-lockfile` + `pnpm build`
2. **Serve stage** — `nginxinc/nginx-unprivileged:alpine3.22`, serves static files on port 8080

Environment variables are injected at container startup via `inject-dynamic-env.sh` into `window.ENV` (see [CONFIGURATION.md](CONFIGURATION.md#docker-runtime-injection)).

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with HMR and API proxy |
| `pnpm build` | Production build (esbuild minification) |
| `pnpm build:full` | TypeScript type-check + production build |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm preview` | Preview production build locally |
| `pnpm build:docker` | Build Docker image `ihub-frontend` |
| `pnpm start:docker` | Run Docker container on port 8080 |

## Path Aliases

The project uses path aliases configured in `vite.config.ts` and `tsconfig.json`:

| Alias | Path |
|-------|------|
| `@` | `src/` |
| `@config` | `src/config/` |
| `@services` | `src/services/` |
