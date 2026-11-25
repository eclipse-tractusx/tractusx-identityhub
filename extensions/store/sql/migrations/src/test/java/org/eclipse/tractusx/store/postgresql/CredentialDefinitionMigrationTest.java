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

import com.github.dockerjava.api.model.LogConfig;
import org.eclipse.edc.junit.annotations.PostgresqlIntegrationTest;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.flywaydb.core.api.MigrationVersion.LATEST;

@PostgresqlIntegrationTest
class CredentialDefinitionMigrationTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17.10-alpine")
            .withCreateContainerCmdModifier(command -> command.getHostConfig()
                    .withMemory(512L * 1024 * 1024)
                    .withNanoCPUs(1_000_000_000L)
                    .withLogConfig(new LogConfig(LogConfig.LoggingType.JSON_FILE, Map.of("max-size", "5m", "max-file", "2"))));
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
        schema = "migration_" + UUID.randomUUID().toString().replace("-", "");
        execute("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() throws SQLException {
        execute("DROP SCHEMA " + schema + " CASCADE");
    }

    @Test
    void emptyDatabaseAndRestart() throws SQLException {
        assertThat(migrate(LATEST)).isEqualTo(4);
        insert("definition-a", "participant-a");
        insert("definition-b", "participant-b");
        assertThat(migrate(LATEST)).isZero();
    }

    @Test
    void upgradePreservesDataAndPrimaryKey() throws SQLException {
        migrate(MigrationVersion.fromVersion("0.0.2"));
        insert("definition-a", "participant-a");
        var before = definition();
        assertThatThrownBy(() -> insert("definition-b", "participant-b"))
                .isInstanceOf(SQLException.class).hasMessageContaining("credential_definitions_credential_type_key");

        assertThat(migrate(LATEST)).isEqualTo(2);

        assertThat(definition()).isEqualTo(before);
        insert("definition-b", "participant-b");
        insert("definition-c", "participant-a");
        assertThatThrownBy(() -> insert("definition-a", "participant-a"))
                .isInstanceOf(SQLException.class).hasMessageContaining("credential_definitions_participant_id_pk");
        assertThat(migrate(LATEST)).isZero();
        assertThat(definition()).isEqualTo(before);
    }

    private int migrate(MigrationVersion target) {
        return FlywayManager.migrate(DATA_SOURCE, "credentialdefinitions", schema, target).migrationsExecuted;
    }

    private void execute(String sql) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private void insert(String id, String participant) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.prepareStatement("INSERT INTO " + schema + ".credential_definitions " +
                        "(id, participant_context_id, credential_type, validity, format, created_date, additional_context) " +
                        "VALUES (?, ?, 'MembershipCredential', 3600, 'VC1_0_JWT', 1000, '[\"https://example.test/context\"]')")) {
            statement.setString(1, id);
            statement.setString(2, participant);
            statement.executeUpdate();
        }
    }

    private String definition() throws SQLException {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.createStatement();
                var rows = statement.executeQuery("SELECT (to_jsonb(d) - 'private_properties')::text FROM " + schema +
                        ".credential_definitions d WHERE id = 'definition-a'")) {
            assertThat(rows.next()).isTrue();
            return rows.getString(1);
        }
    }
}
