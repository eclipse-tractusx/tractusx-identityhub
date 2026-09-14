/*
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package org.eclipse.tractusx.store.postgresql;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dockerjava.api.model.LogConfig;
import org.eclipse.edc.junit.annotations.PostgresqlIntegrationTest;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.flywaydb.core.api.MigrationVersion.LATEST;

@PostgresqlIntegrationTest
class ParticipantScopesMigrationTest {

    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17.10-alpine")
            .withCreateContainerCmdModifier(command -> command.getHostConfig()
                    .withMemory(512L * 1024 * 1024)
                    .withNanoCPUs(1_000_000_000L)
                    .withLogConfig(new LogConfig(LogConfig.LoggingType.JSON_FILE, Map.of("max-size", "5m", "max-file", "2"))));
    private static final PGSimpleDataSource DATA_SOURCE = new PGSimpleDataSource();

    private final ObjectMapper mapper = new ObjectMapper();
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
        runQuery("CREATE SCHEMA " + schema);
    }

    @AfterEach
    void tearDown() throws SQLException {
        runQuery("DROP SCHEMA " + schema + " CASCADE");
    }

    @Test
    void emptyDatabaseAndRestart() {
        assertThat(migrate(LATEST)).isEqualTo(3);
        assertThat(migrate(LATEST)).isZero();
    }

    @ParameterizedTest
    @CsvSource({
            "admin, admin",
            "participant, write"
    })
    void migratesBuiltInRoles(String role, String action) throws Exception {
        migrate(MigrationVersion.fromVersion("0.0.2"));
        insert("participant-a", "{\"roles\":[\"" + role + "\"],\"apiTokenAlias\":\"api-alias\",\"clientSecret\":\"client-alias\",\"custom\":{\"nested\":true}}");

        assertThat(migrate(LATEST)).isOne();

        var properties = properties("participant-a");
        assertThat(properties.get("scopes")).isEqualTo(mapper.readTree("[\"identity-api:" + action + "\",\"issuer-admin-api:" + action + "\"]"));
        assertThat(properties.has("roles")).isFalse();
        assertThat(properties.path("apiTokenAlias").asText()).isEqualTo("api-alias");
        assertThat(properties.path("clientSecret").asText()).isEqualTo("client-alias");
        assertThat(properties.path("custom").path("nested").asBoolean()).isTrue();
        assertThat(migrate(LATEST)).isZero();
        assertThat(properties("participant-a")).isEqualTo(properties);

        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.createStatement();
                var rows = statement.executeQuery("SELECT * FROM " + schema + ".participant_context")) {
            assertThat(rows.next()).isTrue();
            assertThat(rows.getString("participant_context_id")).isEqualTo("participant-a");
            assertThat(rows.getString("identity")).isEqualTo("did:web:participant-a");
            assertThat(rows.getLong("created_date")).isEqualTo(1000);
            assertThat(rows.getLong("last_modified_date")).isEqualTo(2000);
            assertThat(rows.getInt("state")).isEqualTo(200);
        }
    }

    @Test
    void preservesScopesAndDoesNotElevateUnknownRoles() throws Exception {
        migrate(MigrationVersion.fromVersion("0.0.2"));
        insert("participant-a", "{\"roles\":[\"custom-admin\",\"provisioner\"],\"scopes\":[\"identity-api:dids:read\",\"custom:read\"]}");
        insert("participant-b", "{\"roles\":[\"participant\"],\"scopes\":[\"identity-api:write\",\"custom:read\"]}");
        insert("participant-c", "{\"roles\":[]}");
        insert("participant-d", "{\"roles\":[\"ADMIN\",\"administrator\"]}");
        insert("participant-e", "{\"roles\":null,\"scopes\":null,\"custom\":true}");

        migrate(LATEST);

        assertThat(properties("participant-a").get("scopes")).isEqualTo(mapper.readTree("[\"custom:read\",\"identity-api:dids:read\"]"));
        assertThat(properties("participant-b").get("scopes")).isEqualTo(mapper.readTree("[\"custom:read\",\"identity-api:write\",\"issuer-admin-api:write\"]"));
        assertThat(properties("participant-c").get("scopes").isEmpty()).isTrue();
        assertThat(properties("participant-d").get("scopes").isEmpty()).isTrue();
        assertThat(properties("participant-e").get("scopes").isEmpty()).isTrue();
        assertThat(properties("participant-e").get("custom").asBoolean()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"[]", "{\"roles\":\"admin\"}", "{\"scopes\":{}}", "{\"roles\":[1]}", "{\"scopes\":[null]}"})
    void invalidPermissionsRollBackAndCanBeRetried(String invalid) throws Exception {
        migrate(MigrationVersion.fromVersion("0.0.2"));
        insert("valid", "{\"roles\":[\"participant\"]}");
        insert("invalid", invalid);
        var before = properties("valid");

        assertThatThrownBy(() -> migrate(LATEST)).hasMessageContaining("Participant");
        assertThat(properties("valid")).isEqualTo(before);
        assertThat(properties("invalid")).isEqualTo(mapper.readTree(invalid));

        runQuery("UPDATE " + schema + ".participant_context SET properties = '{}' WHERE participant_context_id = 'invalid'");
        assertThat(migrate(LATEST)).isOne();
        assertThat(migrate(LATEST)).isZero();
    }

    private void runQuery(String query) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.createStatement()) {
            statement.execute(query);
        }
    }

    private int migrate(MigrationVersion target) {
        return FlywayManager.migrate(DATA_SOURCE, "participantcontext", schema, target).migrationsExecuted;
    }

    private void insert(String id, String properties) throws SQLException {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.prepareStatement("INSERT INTO " + schema + ".participant_context (participant_context_id, identity, created_date, last_modified_date, state, properties) VALUES (?, ?, 1000, 2000, 200, ?::json)")) {
            statement.setString(1, id);
            statement.setString(2, "did:web:" + id);
            statement.setString(3, properties);
            statement.executeUpdate();
        }
    }

    private JsonNode properties(String id) throws Exception {
        try (var connection = DATA_SOURCE.getConnection();
                var statement = connection.prepareStatement("SELECT properties FROM " + schema + ".participant_context WHERE participant_context_id = ?")) {
            statement.setString(1, id);
            try (var rows = statement.executeQuery()) {
                assertThat(rows.next()).isTrue();
                return mapper.readTree(rows.getString(1));
            }
        }
    }
}
