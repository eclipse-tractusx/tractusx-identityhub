# Architecture

## Project Structure

```
src/
├── main.tsx                    # Entry point — renders ThemeProvider + AuthProvider + App
├── App.tsx                     # Root component — renders AppRoutes
├── routes.tsx                  # Route definitions (React Router v6)
│
├── config/
│   ├── ConfigFactory.ts        # Singleton — reads window.ENV / import.meta.env
│   ├── schema.ts               # TypeScript types for AppConfig
│   └── .env.local              # Local development variables
│
├── services/
│   ├── EnvironmentService.ts   # Wrapper over ConfigFactory — getApiConfig(), isAuthEnabled(), etc.
│   ├── HttpClient.ts           # Axios instance with auth interceptors
│   ├── AuthService.ts          # Keycloak lifecycle management
│   └── participantUtils.ts     # URL encoding for participant IDs in paths
│
├── features/
│   ├── credentials/            # /credentials — CRUD for verifiable credentials
│   │   ├── CredentialsPage.tsx
│   │   ├── CredentialDetailPage.tsx
│   │   ├── CredentialDetailModal.tsx
│   │   ├── CredentialCard.tsx
│   │   ├── AddCredentialDialog.tsx
│   │   ├── api.ts              # Centralized API functions
│   │   └── types.ts
│   ├── did/                    # /dids — DID document management
│   │   └── DidPage.tsx
│   ├── keypairs/               # /keypairs — Key pair lifecycle
│   │   └── KeyPairsPage.tsx
│   ├── participants/           # /participants — Participant context management
│   │   └── ParticipantsPage.tsx
│   └── search/                 # Global credential search (not routed)
│       └── SearchPage.tsx
│
├── components/
│   ├── general/
│   │   ├── Header.tsx          # Top bar — logo, title, user menu
│   │   ├── Sidebar.tsx         # Left nav — 72px wide, icon-based with tooltips
│   │   └── ParticipantSelector.tsx  # Participant context switcher (in sidebar)
│   ├── common/
│   │   ├── PageTitle.tsx       # Reusable page title with blue accent background
│   │   └── ErrorPage.tsx       # Centralized error display
│   └── auth/
│       ├── AuthProvider.tsx    # Wraps app with Keycloak auth context
│       └── ProtectedRoute.tsx  # Redirects to login if unauthenticated
│
├── layouts/
│   └── MainLayout.tsx          # Grid layout — Header + Sidebar + Content area
│
├── contexts/
│   ├── ParticipantContext.tsx   # Global participant list + active selection
│   └── SidebarContext.tsx       # Context for dynamic sidebar panel control
│
├── hooks/
│   ├── useCachedFetch.ts       # Module-level cache for list data
│   └── useAuth.ts              # Hook exposing auth state and actions
│
├── theme/
│   ├── theme.ts                # MUI createTheme — dark theme, custom colors
│   ├── palette.ts              # Extended color definitions
│   ├── typography.ts           # Font definitions (Manrope)
│   └── darkCardStyles.ts       # Shared sx objects for cards, dialogs, text fields
│
└── assets/
    └── styles/                 # Global SCSS styles
```

## Feature-Based Architecture

Each feature under `src/features/` is a self-contained module with:
- Page component(s) — the main view rendered by the router
- Type definitions — TypeScript interfaces for API responses
- API module (credentials) — centralized API functions
- Local state management — `useState`/`useEffect` within the page

Features share participant context via `useParticipant()` and use `useCachedList()` for data fetching with caching.

## Data Flow

```
Browser
  │
  ├── React Component
  │     │
  │     ├── useParticipant()          # Get active participant ID
  │     │
  │     ├── useCachedList(key, fn)    # Fetch + cache data
  │     │     │
  │     │     ├── Cache hit? → render immediately, refresh in background
  │     │     └── Cache miss? → show skeleton, fetch, render
  │     │
  │     └── HttpClient (Axios)
  │           │ ── Request Interceptor: adds API key + Bearer token headers
  │           │
  │           ▼
  │         Vite Proxy (development) or Direct (production)
  │           │
  │           ▼
  │         Backend API (/api/identity/v1beta/...)
  │           │
  │           ▼
  │         Response Interceptor: handles 401 → auto logout
  │
  └── Render response data
```

## Caching Strategy

The `useCachedList` hook (`src/hooks/useCachedFetch.ts`) provides module-level caching:

- **Cache key** includes participant ID (e.g., `credentials-BPNL00000003CRHK`)
- **First load**: shows loading skeleton, fetches data, caches result
- **Cache hit**: returns cached data immediately, refreshes in background
- **Participant switch**: uses cache for new key if available, else skeleton
- **Stale fetch discarding**: results from old requests are ignored if the key changed during flight

## Participant Context

The `ParticipantContext` (`src/contexts/ParticipantContext.tsx`) provides:

- `participants` — full list fetched from the API
- `activeParticipantId` — currently selected participant
- `setActiveParticipantId()` — switch context (persisted to localStorage)
- `loading`, `refresh` — loading state and manual refresh

All resource pages (keypairs, DIDs, credentials) use `activeParticipantId` to scope their API calls.

## Configuration System

The `ConfigFactory` singleton supports two sources for environment variables:

```
Docker Runtime                    Vite Build-time
─────────────                    ───────────────
inject-dynamic-env.sh            .env.local / .env
       │                                │
       ▼                                ▼
  window.ENV                     import.meta.env
       │                                │
       └──────────┬─────────────────────┘
                  │
                  ▼
            ConfigFactory
                  │
                  ▼
          EnvironmentService
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
     HttpClient  Auth   Components
```

`window.ENV` takes priority over `import.meta.env`, allowing Docker containers to override build-time values at startup.

## Authentication

Two modes controlled by `VITE_AUTH_ENABLED`:

| Mode | When | How |
|------|------|-----|
| **API Key** | Development (`VITE_AUTH_ENABLED=false`) | `x-api-key` header added by HttpClient interceptor |
| **Keycloak** | Production (`VITE_AUTH_ENABLED=true`) | `AuthProvider` initializes Keycloak, `ProtectedRoute` guards access, Bearer token added to requests |

The `AuthService` manages the full Keycloak lifecycle: initialization, token refresh (every 60s), logout, and session timeout.

## Theming

MUI dark theme with custom palette:

- **Primary:** `rgb(1, 32, 96)` (deep blue)
- **Success:** `#00aa55`
- **Error:** `#D91E18`
- **Warning:** `#ffa602`
- **Font:** Manrope
- **Buttons:** 50px border-radius, no ripple
- **Chips:** 8px border-radius

Shared style objects in `darkCardStyles.ts` provide consistent look for cards, dialogs, text fields, and menus across all features.

## Reusable Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Header` | `components/general/Header.tsx` | Top bar with logo, title, user menu |
| `Sidebar` | `components/general/Sidebar.tsx` | 72px icon navigation with tooltips |
| `ParticipantSelector` | `components/general/ParticipantSelector.tsx` | Popover-based participant switcher in sidebar |
| `PageTitle` | `components/common/PageTitle.tsx` | Blue accent title bar for each page |
| `ErrorPage` | `components/common/ErrorPage.tsx` | Centralized error display with retry |
| `MainLayout` | `layouts/MainLayout.tsx` | Grid2 layout composing Header + Sidebar + content |
| `AuthProvider` | `components/auth/AuthProvider.tsx` | Keycloak context wrapper |
| `ProtectedRoute` | `components/auth/ProtectedRoute.tsx` | Route guard for authenticated pages |

## Routing

Defined in `src/routes.tsx` using React Router v6:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Redirect | → `/credentials` |
| `/participants` | `ParticipantsPage` | Participant context management |
| `/keypairs` | `KeyPairsPage` | Key pair lifecycle |
| `/dids` | `DidPage` | DID document management |
| `/credentials` | `CredentialsPage` | Verifiable credentials list |
| `/credentials/:id` | `CredentialDetailPage` | Single credential detail |

Legacy redirects: `/did` → `/dids`, `/identity` → `/credentials`

All routes are nested under `MainLayout`, which provides the Header + Sidebar chrome.
