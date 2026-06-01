# Features

The frontend provides four sections for managing the Identity Hub. Each section maps to a route and interacts with the backend API at `/api/identity/v1alpha`.

A **participant selector** in the sidebar allows switching between participant contexts. All resource views (key pairs, DIDs, credentials) are scoped to the active participant.

---

## 1. Participants

**Route:** `/participants`

![Participants](screenshots/01-participants.png)

### Description

Manage participant contexts in the Identity Hub. Each participant represents an entity (Issuer, Provider, Consumer) with its own credentials, DIDs, and key pairs.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/participants` | List all participant contexts |
| POST | `/participants` | Create a new participant |
| DELETE | `/participants/{participantId}` | Delete a participant |
| POST | `/participants/{participantId}/token` | Regenerate API token |

### Actions

- View all participants with status and context ID
- Create new participant — returns `apiKey`, `clientId`, `clientSecret`
- Regenerate API token for a participant
- Delete a participant context
- Copy generated credentials to clipboard

### Key Files

- `src/features/participants/ParticipantsPage.tsx`

---

## 2. Key Pairs

**Route:** `/keypairs`

![Key Pairs](screenshots/02-keypairs.png)

### Description

Manage cryptographic key pairs for each participant. Keys follow a lifecycle: Created → Active → Rotated → Revoked.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/participants/{pid}/keypairs` | List key pairs |
| POST | `/participants/{pid}/keypairs/{keyId}/rotate` | Rotate a key |
| POST | `/participants/{pid}/keypairs/{keyId}/revoke` | Revoke a key |
| POST | `/participants/{pid}/keypairs/{keyId}/activate` | Activate a rotated key |

### Key States

| Code | State | Description |
|------|-------|-------------|
| 100 | Created | Key generated but not yet active |
| 200 | Active | Key in use |
| 300 | Rotated | Replaced by a new key |
| 400 | Revoked | Permanently disabled |

### Actions

- List key pairs per participant with state chips
- Rotate a key (optionally set new key ID and duration)
- Revoke a key
- Activate a rotated key

### Key Files

- `src/features/keypairs/KeyPairsPage.tsx`

---

## 3. DID Management

**Route:** `/dids`

![DID](screenshots/03-dids.png)

### Description

Manage Decentralized Identifiers (DIDs) and their associated documents. DIDs can be published to make them discoverable, and service endpoints can be attached for interoperability.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/participants/{pid}/dids/query` | Query DIDs for a participant |
| POST | `/participants/{pid}/dids/state` | Get DID state |
| POST | `/participants/{pid}/dids/publish` | Publish a DID document |
| POST | `/participants/{pid}/dids/unpublish` | Unpublish a DID document |
| POST | `/participants/{pid}/dids/{did}/endpoints?autoPublish=true` | Add a service endpoint |
| PATCH | `/participants/{pid}/dids/{did}/endpoints` | Replace a service endpoint |
| DELETE | `/participants/{pid}/dids/{did}/endpoints?serviceId={id}` | Remove a service endpoint |

### Actions

- List DIDs per participant
- View DID document details (verification methods, services)
- Publish / unpublish DID documents
- Add, replace, and remove service endpoints
- Auto-publish after endpoint changes

### Key Files

- `src/features/did/DidPage.tsx`

---

## 4. Credentials

**Route:** `/credentials`

![Credentials](screenshots/04-credentials.png)

### Description

Manage verifiable credentials across the full lifecycle: creation, issuance, storage, and revocation.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/participants/{pid}/credentials` | List credentials for a participant |
| GET | `/participants/{pid}/credentials/{credentialId}` | Get a single credential |
| POST | `/participants/{pid}/credentials` | Create a credential |
| PUT | `/participants/{pid}/credentials` | Update a credential |
| DELETE | `/participants/{pid}/credentials/{credentialId}` | Delete a credential |
| POST | `/participants/{pid}/credentials/request` | Request credential issuance |
| POST | `/participants/{pid}/credentials/{credentialId}/revoke` | Revoke a credential |
| POST | `/participants/{pid}/credentials/{credentialId}/suspend` | Suspend a credential |
| POST | `/participants/{pid}/credentials/{credentialId}/resume` | Resume a suspended credential |

### Credential States

| Code | State | Description |
|------|-------|-------------|
| 100 | Initial | Created but not yet requested |
| 200 | Requested | Issuance requested |
| 300 | Issuing | Being issued |
| 400 | Issued | Issued by the authority |
| 500 | Stored | Stored in the holder's wallet |
| 600 | Revoked | Permanently revoked |
| 700 | Suspended | Temporarily suspended |

### Actions

- List credentials per participant with state indicators
- View credential details in a modal (subject, issuer, schemas, raw JSON)
- Edit credential JSON and save changes
- Create credentials via a structured form (type, issuer DID, subject DID, holder, expiration)
- Request credential issuance via DCP protocol
- Revoke, suspend, and resume credentials
- Delete credentials
- Navigate to individual credential detail page

### Key Files

- `src/features/credentials/CredentialsPage.tsx`
- `src/features/credentials/CredentialDetailPage.tsx`
- `src/features/credentials/CredentialDetailModal.tsx`
- `src/features/credentials/CredentialCard.tsx`
- `src/features/credentials/AddCredentialDialog.tsx`
- `src/features/credentials/api.ts`
- `src/features/credentials/types.ts`
