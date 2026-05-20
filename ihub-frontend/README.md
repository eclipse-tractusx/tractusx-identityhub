# Identity Hub Frontend

Administration frontend for the [Eclipse Tractus-X Identity Hub](https://github.com/eclipse-tractusx/tractusx-identityhub) — manage participants, credentials, DIDs, and key pairs.

![Participants view](docs/screenshots/01-participants.png)

## Quick Start

```bash
pnpm install
pnpm dev             # http://localhost:5173
```

Create `.env.local` with your API key (see [Configuration](docs/CONFIGURATION.md)):

```env
VITE_API_KEY=your-super-user-api-key
VITE_API_KEY_HEADER=x-api-key
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Production build |
| `pnpm build:full` | Type-check + production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm preview` | Preview production build |
| `pnpm build:docker` | Build Docker image |
| `pnpm start:docker` | Run Docker container on port 8080 |

## Stack

| Technology | Version |
|-----------|---------|
| React | 18.3 |
| TypeScript | 5.7 |
| Vite | 6.4 |
| MUI | 6.4 |
| Keycloak | 25.0 |
| Axios | 1.9 |

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) — Setup, prerequisites, running locally
- [Architecture](docs/ARCHITECTURE.md) — Project structure, data flow, patterns
- [Configuration](docs/CONFIGURATION.md) — All environment variables reference
- [Features](docs/FEATURES.md) — Detailed guide to each section with screenshots
- [Work Summary](docs/WORK_SUMMARY.md) — Overview of what was built and why

## License

Apache-2.0
