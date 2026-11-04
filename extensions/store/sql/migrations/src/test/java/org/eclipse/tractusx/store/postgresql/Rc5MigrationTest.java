/********************************************************************************
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 VDBP
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

package org.eclipse.tractusx.store.postgresql;

import org.eclipse.edc.junit.annotations.PostgresqlIntegrationTest;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.SQLException;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.flywaydb.core.api.MigrationVersion.LATEST;

@PostgresqlIntegrationTest
class Rc5MigrationTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17.10-alpine");
    private static final PGSimpleDataSource DATA_SOURCE = new PGSimpleDataSource();
    private String schema;

    @BeforeAll
    static void startDatabase() {
        POSTGRES.start();
        DATA_SOURCE.setUrl(POSTGRES.getJdbcUrl());
        DATA_SOURCE.setUser(POSTGRES.getUsername());
        DATA_SOURCE.setPassword(POSTGRES.getPassword());
    }

    @AfterAll
    static void stopDatabase() {
        POSTGRES.stop();
    }

    @BeforeEach
    void setUp() throws SQLException {
        schema = "rc5_" + UUID.randomUUID().toString().replace("-", "");
        execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() throws SQLException {
        execute("DROP SCHEMA " + schema + " CASCADE");
    }

    @ParameterizedTest
    @MethodSource("cases")
    void upgradePreservesExistingRowsAndRestart(Migration migration) throws SQLException {
        migrate(migration, MigrationVersion.fromVersion(migration.previous()));
        execute(migration.insert());
        var before = rows(migration.table(), "");

        assertThat(migrate(migration, LATEST)).isOne();
        assertThat(rows(migration.table(), migration.added())).isEqualTo(before);
        assertThat(migrate(migration, LATEST)).isZero();
        assertThat(rows(migration.table(), migration.added())).isEqualTo(before);
        if (migration.added().contains("version")) {
            assertThat(query("SELECT version || ':' || (leased_by IS NULL) FROM " + migration.table())).isEqualTo("0:true");
        }
        if (migration.table().equals("keypair_resource")) {
            assertThat(query("SELECT private_key_managed::text FROM keypair_resource")).isEqualTo("false");
        }
    }

    @ParameterizedTest
    @MethodSource("scopedCases")
    void idsAreUniqueWithinTheirParticipant(Migration migration) throws SQLException {
        migrate(migration, LATEST);
        execute(migration.insert());
        execute(migration.insert().replace("'owner-a'", "'owner-b'"));
        assertThatThrownBy(() -> execute(migration.insert())).isInstanceOf(SQLException.class).hasMessageContaining("duplicate key");
        assertThat(query("SELECT count(*)::text FROM " + migration.table())).isEqualTo("2");
    }

    @Test
    void missingCredentialOwnerFailsWithoutDiscardingTheCredential() throws SQLException {
        var migration = cases().filter(c -> c.table().equals("credential_resource")).findFirst().orElseThrow();
        migrate(migration, MigrationVersion.fromVersion(migration.previous()));
        execute(migration.insert().replace("'owner-a'", "NULL"));
        var before = rows(migration.table(), "");
        assertThatThrownBy(() -> migrate(migration, LATEST)).hasMessageContaining("null values");
        assertThat(rows(migration.table(), "")).isEqualTo(before);
    }

    @Test
    void duplicateIssuanceRequestsFailWithoutChangingRows() throws SQLException {
        var migration = cases().filter(c -> c.table().equals("edc_issuance_process")).findFirst().orElseThrow();
        migrate(migration, MigrationVersion.fromVersion(migration.previous()));
        execute(migration.insert());
        execute(migration.insert().replace("'same-id'", "'second-id'"));
        var before = rows(migration.table(), "");
        assertThatThrownBy(() -> migrate(migration, LATEST)).hasMessageContaining("issuance_process_holder_pid");
        assertThat(rows(migration.table(), "")).isEqualTo(before);
    }

    @Test
    void legacyDuplicateKeyIdsArePreserved() throws SQLException {
        var migration = cases().filter(c -> c.table().equals("keypair_resource")).findFirst().orElseThrow();
        migrate(migration, MigrationVersion.fromVersion(migration.previous()));
        execute(migration.insert());
        execute(migration.insert().replace("'same-id'", "'second-id'"));
        var before = rows(migration.table(), "");
        migrate(migration, LATEST);
        assertThat(rows(migration.table(), migration.added())).isEqualTo(before);
        assertThat(query("SELECT count(*)::text FROM keypair_resource WHERE private_key_managed")).isEqualTo("0");
    }

    @Test
    void legacyDuplicateHolderDidsArePreserved() throws SQLException {
        var migration = cases().filter(c -> c.table().equals("holders")).findFirst().orElseThrow();
        migrate(migration, MigrationVersion.fromVersion(migration.previous()));
        execute(migration.insert());
        execute(migration.insert().replace("'same-id'", "'second-id'"));
        var before = rows(migration.table(), "");
        migrate(migration, LATEST);
        assertThat(rows(migration.table(), "")).isEqualTo(before);
    }

    @Test
    void upgradePreservesBothStateMachineStoresInAnExistingSharedSchema() throws SQLException {
        var request = cases().filter(c -> c.subsystem().equals("credentialrequest")).findFirst().orElseThrow();
        var issuance = cases().filter(c -> c.subsystem().equals("issuanceprocess")).findFirst().orElseThrow();
        // Initialize both legacy stores before either replaces the shared lease schema.
        migrate(request, MigrationVersion.fromVersion("0.0.1"));
        migrate(issuance, MigrationVersion.fromVersion("0.0.1"));
        migrate(request, MigrationVersion.fromVersion(request.previous()));
        migrate(issuance, MigrationVersion.fromVersion(issuance.previous()));
        execute(request.insert());
        execute(issuance.insert());
        execute("INSERT INTO edc_credential_offers (id,state,created_at,updated_at,participant_context_id,issuer_did) " +
                "VALUES ('offer',100,1,1,'owner-a','did:web:issuer.test')");
        execute("INSERT INTO edc_lease VALUES ('old-runtime',1,60000,'offer','edc_credential_offers')");
        var lease = rows("edc_lease", "");
        var offer = rows("edc_credential_offers", "");
        migrate(request, LATEST);
        migrate(issuance, LATEST);
        assertThat(rows("edc_credential_offers", request.added())).isEqualTo(offer);
        assertThat(rows("edc_lease", "")).isEqualTo(lease);
        assertThat(query("SELECT version::text FROM edc_credential_offers")).isEqualTo("0");
        assertThat(query("SELECT count(*)::text FROM pg_indexes WHERE schemaname = '" + schema +
                "' AND indexname IN ('holder_credentialrequest_state', 'issuance_process_state_timestamp')")).isEqualTo("2");
    }

    static Stream<Migration> cases() {
        return Stream.of(
                new Migration("credentials", "0.0.2", "credential_resource", "",
                        "INSERT INTO credential_resource (id,participant_context_id,create_timestamp,issuer_id,holder_id,vc_state,vc_format,verifiable_credential,raw_vc,usage) " +
                                "VALUES ('same-id','owner-a',1,'issuer','holder',500,1,'{}','unchanged-signed-credential','holder')"),
                new Migration("attestationdefinitions", "0.0.1", "attestation_definitions", "private_properties",
                        "INSERT INTO attestation_definitions (id,participant_context_id,attestation_type,created_date,last_modified_date) " +
                                "VALUES ('same-id','owner-a','test',1,1)"),
                new Migration("credentialdefinitions", "0.0.3", "credential_definitions", "private_properties",
                        "INSERT INTO credential_definitions (id,participant_context_id,credential_type,validity,format,created_date) " +
                                "VALUES ('same-id','owner-a','TestCredential',3600,'VC1_0_JWT',1)"),
                new Migration("holder", "0.0.2", "holders", "",
                        "INSERT INTO holders (holder_id,participant_context_id,did,created_date) VALUES ('same-id','owner-a','did:web:holder.test',1)"),
                new Migration("keypair", "0.0.2", "keypair_resource", "private_key_managed",
                        "INSERT INTO keypair_resource (id,participant_context_id,timestamp,key_id,serialized_public_key,private_key_alias) " +
                                "VALUES ('same-id','owner-a',1,'key-id','public-key','existing-vault-reference')"),
                new Migration("credentialrequest", "0.0.2", "edc_holder_credentialrequest", "leased_by,leased_at,lease_duration,version",
                        "INSERT INTO edc_holder_credentialrequest (id,state,created_at,updated_at,participant_context_id,issuer_did,ids_and_formats) " +
                                "VALUES ('same-id',100,1,1,'owner-a','did:web:issuer.test','[]')"),
                new Migration("issuanceprocess", "0.0.3", "edc_issuance_process", "leased_by,leased_at,lease_duration,version",
                        "INSERT INTO edc_issuance_process (id,state,created_at,updated_at,holder_id,participant_context_id,holder_pid,claims,credential_definitions,credential_formats) " +
                                "VALUES ('same-id',100,1,1,'holder','owner-a','request','{}','[]','[]')"),
                new Migration("jti", "0.0.1", "edc_jti_validation", "",
                        "INSERT INTO edc_jti_validation VALUES ('existing-jti',1000)")
        );
    }

    static Stream<Migration> scopedCases() {
        return cases().filter(c -> Stream.of("credentials", "attestationdefinitions", "credentialdefinitions", "holder").anyMatch(c.subsystem()::equals));
    }

    private int migrate(Migration migration, MigrationVersion target) {
        return FlywayManager.migrate(DATA_SOURCE, migration.subsystem(), schema, target).migrationsExecuted;
    }

    private void execute(String sql) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection(); var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            statement.execute(sql);
        }
    }

    private String query(String sql) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection(); var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            try (var result = statement.executeQuery(sql)) {
                assertThat(result.next()).isTrue();
                return result.getString(1);
            }
        }
    }

    private String rows(String table, String excluded) throws SQLException {
        var projection = excluded.isEmpty() ? "to_jsonb(t)" : "to_jsonb(t) - string_to_array('" + excluded + "', ',')";
        return query("SELECT jsonb_agg(" + projection + " ORDER BY " + projection + ")::text FROM " + table + " t");
    }

    record Migration(String subsystem, String previous, String table, String added, String insert) {
    }
}
