# Migration Guide

This migration guide is based on the `chartVersion` of the chart. If you don't rely on the provided helm chart, consider the changes of the chart as mentioned below manually.

## EDC 0.14.0 → 0.15.1

This section documents the steps required to upgrade tractusx-identityhub from EDC 0.14.0 to 0.15.1. See [#198](https://github.com/eclipse-tractusx/tractusx-identityhub/issues/198) for full details.

### 1. Build System Changes

| Component | Before | After | Reason |
|-----------|--------|-------|--------|
| EDC | 0.14.0 | 0.15.1 | Upstream upgrade |
| edc-build plugin | 1.0.0 | 1.1.6 | Aligns with tractusx-edc |
| Gradle wrapper | 8.12 | 9.3.1 | Required by edc-build 1.1.6 (`getSettingsDirectory()` API) |
| Shadow plugin | `com.github.johnrengelman.shadow:8.1.1` | `com.gradleup.shadow:9.3.1` | Old plugin incompatible with Gradle 9.x |

**`gradle/libs.versions.toml`** — update the following entries:

```toml
edc = "0.15.1"            # was 0.14.0
edc-build = "1.1.6"       # was 1.0.0
```

Update the shadow plugin entry:

```toml
[plugins]
shadow = { id = "com.gradleup.shadow", version = "9.3.1" }
# was: id = "com.github.johnrengelman.shadow", version = "8.1.1"
```

**Gradle wrapper** — upgrade to 9.3.1:

```bash
./gradlew wrapper --gradle-version=9.3.1
```

**`build.gradle.kts`** — the following changes are required for Gradle 9.x compatibility:

- Remove `import com.github.jengelman.gradle.plugins.shadow.ShadowJavaPlugin`
- Replace `tasks.create(...)` with `tasks.register(...)`
- Replace `hasPlugin("com.github.johnrengelman.shadow")` with `hasPlugin(libs.plugins.shadow.get().pluginId)`
- Replace `tasks.named(ShadowJavaPlugin.SHADOW_JAR_TASK_NAME)` with `tasks.named("shadowJar")`

### 2. Java Code Changes

**`SuperUserSeedExtension.java`** — one breaking API rename:

```diff
- .participantId(superUserParticipantId)
+ .participantContextId(superUserParticipantId)
```

**Import ordering** — edc-build 1.1.6 enforces a stricter `CustomImportOrder` checkstyle rule. The required order is:

1. `THIRD_PARTY_PACKAGE` (`org.eclipse.edc.*`, `org.eclipse.tractusx.*`, etc.)
2. `STANDARD_JAVA_PACKAGE` (`java.*`, `javax.*`)
3. `STATIC` (static imports)

Each group must be separated by a blank line and sorted alphabetically within the group. Verify all Java files comply before building.

### 3. Database Migrations

Six Flyway V0_0_2 migration scripts are required. These run automatically on startup if Flyway is enabled. If you manage schema changes manually, apply the following SQL in order.

#### 3.1 `credential_resource` — new `usage` column

```sql
ALTER TABLE credential_resource
    ADD COLUMN IF NOT EXISTS usage VARCHAR NOT NULL DEFAULT 'holder';
```

#### 3.2 `keypair_resource` — new `usage` column

```sql
ALTER TABLE keypair_resource
    ADD COLUMN IF NOT EXISTS usage VARCHAR NOT NULL DEFAULT '';
```

#### 3.3 `edc_sts_client` — schema update

```sql
ALTER TABLE edc_sts_client
    ADD COLUMN IF NOT EXISTS participant_context_id VARCHAR;

ALTER TABLE edc_sts_client
    DROP COLUMN IF EXISTS private_key_alias;

ALTER TABLE edc_sts_client
    DROP COLUMN IF EXISTS public_key_reference;
```

> **Warning:** The `private_key_alias` and `public_key_reference` columns are permanently removed. Back up any data in these columns before migrating.

#### 3.4 `holders` — new `anonymous` and `properties` columns

```sql
ALTER TABLE holders
    ADD COLUMN IF NOT EXISTS anonymous BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE holders
    ADD COLUMN IF NOT EXISTS properties JSON DEFAULT '{}';
```

#### 3.5 `edc_lease` (credentialrequest subsystem) — PK redesign

The `edc_lease` table used by `edc_credential_offers` and `edc_holder_credentialrequest` is replaced with a new schema using a composite primary key `(resource_id, resource_kind)`.

```sql
-- Drop foreign key references
ALTER TABLE edc_credential_offers DROP CONSTRAINT IF EXISTS edc_credential_offers_lease_id_fkey;
ALTER TABLE edc_credential_offers DROP COLUMN IF EXISTS lease_id;
ALTER TABLE edc_holder_credentialrequest DROP CONSTRAINT IF EXISTS edc_holder_credentialrequest_lease_id_fkey;
ALTER TABLE edc_holder_credentialrequest DROP COLUMN IF EXISTS lease_id;

-- Replace edc_lease with new schema
DROP TABLE IF EXISTS edc_lease CASCADE;
CREATE TABLE IF NOT EXISTS edc_lease (
    resource_id VARCHAR NOT NULL,
    resource_kind VARCHAR NOT NULL,
    leased_by   VARCHAR NOT NULL,
    leased_at   BIGINT,
    lease_duration INTEGER NOT NULL DEFAULT 60000,
    PRIMARY KEY (resource_id, resource_kind)
);
```

> **Warning:** This is a destructive migration. All existing lease data is dropped. Ensure no active leases exist before migrating.

#### 3.6 `edc_lease` (issuanceprocess subsystem) — PK redesign

The same redesign applies to the `edc_lease` table used by `edc_issuance_process`.

```sql
-- Drop foreign key reference
ALTER TABLE edc_issuance_process DROP CONSTRAINT IF EXISTS edc_issuance_process_lease_id_fkey;
ALTER TABLE edc_issuance_process DROP COLUMN IF EXISTS lease_id;

-- Replace edc_lease with new schema
DROP TABLE IF EXISTS edc_lease CASCADE;
CREATE TABLE IF NOT EXISTS edc_lease (
    resource_id VARCHAR NOT NULL,
    resource_kind VARCHAR NOT NULL,
    leased_by   VARCHAR NOT NULL,
    leased_at   BIGINT,
    lease_duration INTEGER NOT NULL DEFAULT 60000,
    PRIMARY KEY (resource_id, resource_kind)
);
```

### 4. Verification

After applying all changes, verify the upgrade:

```bash
# Build and run tests
./gradlew build

# Build shadow JARs
./gradlew :runtimes:identityhub:shadowJar :runtimes:issuerservice:shadowJar
```

All 5 tests should pass and shadow JARs should be produced in `runtimes/*/build/libs/`.

> [!WARNING]
> Bitnami does change their update and versioning policy starting with 2025-08-28. To install the existing charts with its bitnami dependencies, please consider to manually specify the properties `image.repository` and `image.tag` specifying for the following dependencies:
> 
> - postgresql (image: bitnamilegacy/postgresql:15.4.0-debian-11-r45)
> 
> You have the following options to specify the container image:
> 
> 1. Specify in `values.yaml` below `postgresql`.
> 
> ```yaml
> postgresql: 
>   image: 
>     repository: bitnamilegacy/postgresql
>     tag: 15.4.0-debian-11-r45
> ```
> 
> 2. Set during installation.
> 
> ```bash
helm install tractusx-identityhub -n tractusx-dev tractusx/tractusx-identityhub \
>   --set postgresql.image.repository=bitnamilegacy/postgresql
>   --set postgresql.image.tag=15.4.0-debian-11-r45
> ```
> 
> Notes:
> 
- Deploying an older version of the software may have used an older postgresql version.
> - The community is working out on how to resolve the issue.

# NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
