---
name: sql-migration
description: Work with the Tractus-X Flyway migrations of IdentityHub and IssuerService (extensions/store/sql/migrations, one folder and one history table per store subsystem) - status, next version, a new migration file, comparing a subsystem with the upstream schema, adding a new subsystem, and debugging migration failures at startup. Use for "add a column", "upstream changed the schema", "Migrating DataSource … failed", "flyway checksum mismatch", or any change under extensions/store/sql/migrations.
---

<!--
 Copyright (c) 2026 Catena-X Automotive Network e.V.
 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 AI Disclosure: This file was entirely AI-generated.
 The AI-generated portions are made available under CC0-1.0 and not subject
 to the project's license. The human contributor has reviewed and verified
 that the code is correct.

 SPDX-License-Identifier: Apache-2.0 AND CC0-1.0
 Assisted-By: Claude Code (claude-opus-5-5)
-->

# SQL migrations

## How it works here

- One **subsystem** per store, e.g. `participantcontext`, `keypair`, `credentials`, `holder`, `issuanceprocess`.
  Files: `extensions/store/sql/migrations/src/main/resources/org/eclipse/tractusx/store/postgresql/<subsystem>/V<a>_<b>_<c>__<Description>.sql`.
- One extension per subsystem (`migration/*MigrationExtension.java`, `NAME_SUBSYSTEM = "<subsystem>"`), registered in
  `META-INF/services/org.eclipse.edc.spi.system.ServiceExtension`, built on `AbstractPostgresqlMigrationExtension` and
  `FlywayManager` (history table `flyway_schema_history_<subsystem>`, baseline `0.0.0`).
- A subsystem runs only when the runtime binds a datasource for it: `edc.sql.store.<subsystem>.datasource=<name>` and
  `edc.datasource.<name>.url|user|password` (vault first, then config). Charts: `templates/*-datasource-config.yaml`.
- Toggles: `org.eclipse.tractusx.edc.postgresql.migration.<subsystem>.enabled` (default `true`),
  `org.eclipse.tractusx.edc.postgresql.migration.schema` (default `public`).
- Only the persistent runtimes (`identityhub`, `issuerservice`) ship the module; the `-memory` ones have no database.
- `credentialrequest` is migrated by two extensions (`CredentialOfferMigrationExtension`,
  `HolderCredentialRequestMigrationExtension`) on the same location and history table; Flyway makes the second run a no-op.

## Commands

```bash
M=.claude/skills/sql-migration/scripts/migrations.sh
$M status                                   # subsystem, runtime(s), count, latest, released?, extension class
$M compare participantcontext               # upstream schema (pinned version) vs Tractus-X migrations, column diff
$M next keypair                             # next version (patch bump: V0_0_2 -> V0_0_3)
$M new keypair "Add rotation timestamp"     # creates the file with the license header
```

## Rules

1. **Never edit a migration released in a tag** (`status` shows it). Flyway validates checksums; deployed databases fail
   at startup. Add a new file. `bc-scan.sh` flags this as BLOCKER.
2. Versions are per subsystem, strictly increasing, unique. House style so far: `V0_0_<n>`.
3. Statements idempotent: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, guarded `UPDATE`/`DO $$ … $$`. The
   tables usually already exist from the `V0_0_1__Init_*` files that copy the upstream schema.
4. Follow upstream: the source of truth for the target schema is `ih-src.sh schema <file>` at the pinned version.
   `compare` lists columns upstream has that no Tractus-X migration creates (a missing migration) and the reverse.
5. Data migrations (like `V0_0_3__Migrate_Roles_To_Scopes.sql`) need a `PostgresqlIntegrationTest` with realistic rows
   (see `ParticipantScopesMigrationTest`) and a migration-guide entry describing the data change.

## A new subsystem (new upstream SQL store)

1. Folder + `V0_0_1__Init_<Store>.sql` from the upstream schema.
2. `<Store>MigrationExtension extends AbstractPostgresqlMigrationExtension` with `NAME_SUBSYSTEM`, registered in the
   service file.
3. Bind the datasource in the runtime's chart (`*-datasource-config.yaml`), the compose `configuration.properties`, and
   the PostgreSQL init script `deployment/docker/postgres/init` if the compose stack uses separate databases.
4. `bc-scan.sh` checks that every migration folder has a registered extension.

## Verify

```bash
./gradlew :extensions:store:sql:migrations:test -DincludeTags="PostgresqlIntegrationTest"   # Docker
.claude/skills/dcp-e2e-flow/scripts/dcp-e2e.sh run sql                                       # runtime start + flow
```

The `upgradeability-test` workflow installs the last published chart and upgrades to the local one, which is where a
non-idempotent migration shows up.

## Startup failures

| Message | Cause |
|---|---|
| `Migrating DataSource <x> for subsystem <s> failed: …` | SQL error in a new file; run it against a copy of the DB; check idempotency |
| `Validate failed: Migration checksum mismatch` | A released file was edited: restore it, add a new version |
| `No 'name' setting in group edc.datasource.<s> found` (warning) | `edc.sql.store.<s>.datasource` missing: the subsystem is silently skipped |
| `Mandatory config 'edc.datasource.<name>.url' not found` | Datasource URL neither in vault nor in config |
