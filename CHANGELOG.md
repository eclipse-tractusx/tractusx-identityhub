# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changes in other Tractus-X components, see the [Eclipse Tractus-X Changelog](https://github.com/eclipse-tractusx/tractus-x-release/blob/main/CHANGELOG.md).

## [Unreleased]

### Added
- Self-contained E2E Postman collection `docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json` covering the full DCP flow (issuance → presentation → revocation) against the Docker Compose stack; runs unattended via newman ([#321](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/321), [#197](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/197))
- `waitForDependencies` initContainer in the persistence charts: blocks runtime startup until the bundled PostgreSQL/Vault accept connections, eliminating the first-install CrashLoopBackOff. Bounded via `waitForDependencies.retries` (default 60, ≈5 min, each probe with a 3s connect timeout) so a genuinely unreachable dependency fails loudly instead of hanging in `Init` ([#237](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/237))
- Ingress `pathType` configurable per endpoint in all four charts
- CI workflow running the E2E Postman collection (newman) against the compose stack on every PR

### Changed
- **BREAKING (charts):** removed the `version` and `accounts` endpoints from all chart values, templates and default ingress lists — EDC 0.17.0 never serves them; version info is at `GET <default>/api/v1/version`. See the [migration guide](docs/admin/migration-guide.md) ([#322](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/322))
- `statuslist.callback.address` chart default is now a full URL; it must be reachable by verifiers/holders
- Docker Compose SQL profile uses distinct super-user IDs per runtime (`ih-super-user`/`is-super-user`) to avoid overwriting each other's secrets in the shared dev Vault ([#321](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/321))

### Fixed
- Chart ingress deployment failed nginx admission for `/.well-known/api` with `pathType: Prefix` ([#232](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/232))
- Runtime pods crash-looped racing the bundled PostgreSQL on first chart install ([#237](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/237))
- Docker Compose DCP flow: did:web resolution over HTTP, reachable status-list callback, short DID-resolver cache, `PKCS12` keystore-type typo, super-user API key no longer buried in JDBC debug logs ([#321](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/321))
- Postman reference collection (`Eclipse Tractus-X Identity Hub.json`): `x-api-key`/`SI_TOKEN` auth, compose-stack default URLs, `participantId` → `participantContextId`, and the plain-vs-base64url path-encoding rules for EDC 0.17.0
- Bruno reference collection (`bruno/Eclipse Tractus-X Identity Hub/`): brought to 0.17.0 parity with the Postman collection and verified request-by-request against a running stack. Fixed defects that made shipped examples fail or misbehave — the *Activate ParticipantContext* request silently **deactivated** participants (missing `isActive=true`), key pair examples created keys that could never sign a token (bare key IDs, unsupported `Ed25519VerificationKey2020` type), body-less POSTs returned 415, stale presentation context/scope alias, and variable defaults pointed at ports matching no deployment
- `participantId` → `participantContextId` in the DCP walkthrough and Bruno e2e example bodies for EDC 0.17.0
- DCP API walkthrough correctness: `POST` (not `PUT`) on the participant `/state` activate endpoint, health checks at `/api/check/readiness` (the `/.well-known/api` version context was removed), and the endpoint port tables corrected to match the charts (removed the phantom `version` endpoint, fixed the IdentityHub ports)
- Eclipse Dash dependency check: restored the mangled extraction regex and refreshed `DEPENDENCIES` metadata (failing on every push since 2026-06-24)

### Removed
- `docs/api/postman/DCP_IngressPostgresqlTestFlow.json` — incompatible with EDC 0.17.0 (base64url participant IDs in URL paths) and hardwired to a Catena-X integration environment; superseded by the E2E collection

## [0.3.2] - 2026-06-16

### Added
- Add custom attestation claims table with SQL migration, extension, and configuration for flexible credential issuance by @AYaoZhan in [#299](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/299)
- Add Docker Compose setup for local development under `deployment/docker/` ([#287](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/287))
- Add Flyway V0_0_2 migration scripts for EDC 0.15.1 DB schema changes ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198)):
  - `credential_resource`: new `usage` column
  - `keypair_resource`: new `usage` column
  - `edc_sts_client`: added `participant_context_id`, removed `private_key_alias` and `public_key_reference`
  - `holders`: new `anonymous` and `properties` columns
  - `edc_lease` (credentialrequest, issuanceprocess): redesigned PK from `lease_id` to composite `(resource_id, resource_kind)`
- Add Flyway `V0_0_2__Migrate_To_EDC_0_16_0.sql` for `participant_context` table reshape ([#280](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/280)):
  - Adds `identity VARCHAR UNIQUE NOT NULL` (populated from `did`)
  - Moves `api_token_alias` and `roles` into the `properties` JSON column
  - Drops columns `api_token_alias`, `did`, `roles`
  - Remaps the `state` column from the legacy IH-owned ParticipantContextState codes `{0, 1, 2}` to the new connector-owned codes `{100, 200, 300}` — without this, the new `SqlParticipantContextStore` NPEs while deserializing any pre-existing row
  - **Applied automatically by Flyway on startup; back up your database before upgrading**

### Changed

- **BREAKING:** Upgrade EDC and IdentityHub from 0.16.0 to 0.17.0 ([#308](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/308)):
  - `org.eclipse.edc:monitor-jdk-logger` artifact deleted upstream; runtimes now rely solely on the bundled `colored-jdk-monitor` extension
  - `edc-build` plugin bumped from 1.1.6 to 1.4.0 — removed direct `groupId` assignment from POM extension (now read-only)
  - `@Setting` annotation attribute renamed from `value` to `description` (and `type` removed) across extensions
  - `ScopeToCriterionTransformer.transform()` → `transformScope()` with return type `Result<List<Criterion>>`
  - **BREAKING:** `participantContextId` is no longer base64url-encoded in API URL paths ([IH #937](https://github.com/eclipse-edc/IdentityHub/pull/937)); the IdentityAPI, IssuerAdminAPI, and credentials/presentation API now use the plain ID. `InitialParticipantExtension` updated to publish the plain `participantContextId` in the DID-document `CredentialService` endpoint (re-activate existing participants to re-publish). The API-key prefix stays base64url-encoded.
  - DCP scope alias: `TxScopeToCriterionTransformer` now accepts both `org.eclipse.tractusx.vc.type` and the new upstream `org.eclipse.dspace.dcp.vc.type` by default (override via `tx.identityhub.scope.aliases`)
  - Flyway migration `V0_0_2__Add_Additional_Context_Column.sql` adds the `additional_context` column to `credential_definitions` ([IH #941](https://github.com/eclipse-edc/IdentityHub/pull/941), configurable JSON-LD `@context` on issuance); applied automatically on startup. All other IdentityHub / IssuerService schemas are unchanged.
- **BREAKING:** Upgrade EDC and IdentityHub from 0.15.1 to 0.16.0 ([#280](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/280)):
  - `org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantContext` replaced by `IdentityHubParticipantContext`
  - `org.eclipse.edc.identityhub.spi.participantcontext.ParticipantContextService` replaced by `IdentityHubParticipantContextService`
  - `org.eclipse.edc.identityhub.spi.participantcontext.store.ParticipantContextStore` replaced by `org.eclipse.edc.participantcontext.spi.store.ParticipantContextStore`
  - `ParticipantContextState` moved to `org.eclipse.edc.participantcontext.spi.types.ParticipantContextState`
  - New setting `edc.encryption.strict=false` added to all runtimes, docker configs, and Helm charts — 0.16.0 enables config encryption by default (`edc.participants.config.encryption.algorithm=aes`) and the runtime fails to start unless an AES key alias is provided or strict mode is disabled
  - `edc.iam.credential.revocation.mimetype` corrected from `*` to `*/*` (0.16.0's `StatusListCredentialController` rejects the bare `*`)
  - See [docs/admin/migration-guide.md](docs/admin/migration-guide.md) for the full operator upgrade walkthrough
- **BREAKING:** Upgrade EDC from 0.14.0 to 0.15.1 ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198)):
  - `ParticipantManifest.Builder.participantId()` renamed to `participantContextId()`
  - `edc_sts_client` table: `private_key_alias` and `public_key_reference` columns removed, `participant_context_id` added
  - `edc_lease` table (credentialrequest, issuanceprocess): primary key changed from single `lease_id` to composite `(resource_id, resource_kind)`
- Upgrade edc-build plugin from 1.0.0 to 1.1.6 ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198))
- Upgrade Gradle wrapper from 8.12 to 9.3.1 (required by edc-build 1.1.6) ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198))
- Migrate Shadow plugin from `com.github.johnrengelman.shadow:8.1.1` to `com.gradleup.shadow:9.3.1` (required for Gradle 9.x) ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198))
- Update build.gradle.kts for Gradle 9.x compatibility (plugin references, `tasks.register()` API) ([#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198))

## [0.2.0] - 2026-03-10

### Added

- Add issuance flow workflow test by @AYaoZhan in [#214](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/214)
- Add developers guide and IdentityHub documentation by @Alaitz1 in [#221](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/221)
- Add issuer service documentation by @AYaoZhan in [#222](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/222)
- Add StatusList API configuration to IssuerService by @stephanbcbauer in [#230](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/230)
- Add configurable initial participantContext by @AYaoZhan in [#242](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/242)
- Add architecture documentation by @Alaitz1 in [#152](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/152)
- Add did web http usage configuration by @AYaoZhan in [#243](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/243)
- Add API walkthrough and helm charts for int by @matbmoser in [#248](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/248)

### Changed

- Update KICS configuration to exclude additional OpenAPI file from scans by @CDiezRodriguez in [#246](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/246)

### Fixed

- fix: issuerservice ingress apis by @AYaoZhan in [#174](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/174)
- fix: add identityhub-authentication dependency for X-API-KEY usage by @AYaoZhan in [#185](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/185)
- fix: charts postgres tables by @AYaoZhan in [#178](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/178)
- fix: update chart versions to 0.1.3 and correct repository paths in values.yaml by @CDiezRodriguez in [#247](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/247)

## [0.1.0] - 2025-11-05

### Added
- Add documentation about IssuerService by @AYaoZhan in [#222](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/222)
- Add documentation about IdentityHub, Developers and setup guide by @Alaitz1 in [#221](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/221)
- Add colored logger and logger persistence by @AYaoZhan in [#149](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/149)
- Add CHANGELOG.md file following TRG 1.03 standards by @CDiezRodriguez in [#151](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/151)
- Add installation and deployment documentation, enhance documentation structure, fix header and list formatting, add license headers and NOTICE files, set key signing alias default configuration by @AYaoZhan in [#147](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/147)
- Add helm charts release by @AYaoZhan in [#119](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/119)
- Add Tractus-X specific configurations by @matbmoser in [#113](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/113)
- Add properties template functionality by @AYaoZhan in [#100](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/100)
- Add OpenAPI specification and Bruno Collection for interface documentation by @CDiezRodriguez in [#85](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/85)

### Changed

- Update dependency files and IdentityHub to version 0.14.0 by @M-Busk in [#140](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/140)
- Update Bitnami images by @CDiezRodriguez in [#130](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/130)

### Fixed
- Fix OpenAPI specification by @Alaitz1 in [#165](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/165)
- Fix ingress path values configuration, add STS/accounts/version endpoint configuration, fix credentials configuration issues and API endpoint naming by @AYaoZhan in [#118](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/118)
- Fix Helm chart auto generated README.md files by @AYaoZhan in [#163](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/163)

## [0.0.1] - 2025-07-16

### Added

- SuperUser seeder to enable API key generation in Issuer Service by @CDiezRodriguez in [#97](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/97)
- Unified identity hub with issuer service by @CDiezRodriguez in [#65](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/65)
- Modularized SuperUserSeedExtension for better structure by @CDiezRodriguez in [#102](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/102)
- Eclipse Foundation contributors to license header by @CDiezRodriguez in [#61](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/61)
- Default value for JAR build argument by @AYaoZhan in [#84](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/84)
- Helm deployment documentation for localhost by @AYaoZhan in [#89](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/89)
- TRG 5.02 Helm chart standards by @CDiezRodriguez in [#79](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/79)

### Changed

- Upgraded EDC version to 0.14.0-SNAPSHOT by @CDiezRodriguez in [#54](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/54)
- Removed local issue templates by @marcelruland in [#59](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/59)

### Fixed

- Gitflow trigger dockerfile publish by @AYaoZhan in [#91](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/91)
