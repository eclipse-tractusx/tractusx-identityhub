/*
 * Copyright (c) 2025 Cofinity-X
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
 */

package org.eclipse.tractusx.store.postgresql;

import org.eclipse.edc.runtime.metamodel.annotation.Setting;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.persistence.EdcPersistenceException;
import org.eclipse.edc.spi.security.Vault;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.eclipse.edc.spi.system.configuration.Config;
import org.eclipse.edc.sql.DriverManagerConnectionFactory;
import org.eclipse.edc.sql.datasource.ConnectionFactoryDataSource;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.Objects;
import java.util.Properties;
import java.util.function.Supplier;

import static java.util.Optional.ofNullable;
import static org.flywaydb.core.api.MigrationVersion.LATEST;

public abstract class AbstractPostgresqlMigrationExtension implements ServiceExtension {

    private static final String EDC_DATASOURCE_PREFIX = "edc.datasource";
    private static final String DEFAULT_MIGRATION_ENABLED_TEMPLATE = "true";
    @Setting(value = "Enable/disables subsystem schema migration", defaultValue = DEFAULT_MIGRATION_ENABLED_TEMPLATE, type = "boolean")
    private static final String MIGRATION_ENABLED_TEMPLATE = "org.eclipse.tractusx.edc.postgresql.migration.%s.enabled";
    private static final String DEFAULT_MIGRATION_SCHEMA = "public";
    @Setting(value = "Schema used for the migration", defaultValue = DEFAULT_MIGRATION_SCHEMA)
    private static final String MIGRATION_SCHEMA = "org.eclipse.tractusx.edc.postgresql.migration.schema";
    private static final String PASSWORD = "password";
    private static final String USER = "user";
    private static final String URL = "url";


    private Monitor monitor;

    @Override
    public String name() {
        return "Postgresql schema migration for subsystem " + getSubsystemName();
    }

    @Override
    public void initialize(final ServiceExtensionContext context) {
        var config = context.getConfig();
        monitor = context.getMonitor().withPrefix("Migration");

        var subSystemName = Objects.requireNonNull(getSubsystemName());
        var enabled = config.getBoolean(MIGRATION_ENABLED_TEMPLATE.formatted(subSystemName), Boolean.valueOf(DEFAULT_MIGRATION_ENABLED_TEMPLATE));

        if (!enabled) {
            return;
        }

        var configGroup = "%s.%s".formatted(EDC_DATASOURCE_PREFIX, subSystemName);
        var datasourceConfig = config.getConfig(configGroup);

        var nameConfigs = config.getConfig("edc.sql.store");

        var dataSourceName = nameConfigs.getString(subSystemName + ".datasource", null);
        if (dataSourceName == null) {
            monitor.warning("No 'name' setting in group %s found, no schema migrations will run for subsystem %s"
                    .formatted(configGroup, subSystemName));
            return;
        }

        var rootPath = EDC_DATASOURCE_PREFIX + "." + datasourceConfig.currentNode();

        var urlProperty = rootPath + "." + URL;
        var jdbcUrl = ofNullable(getVault().resolveSecret(urlProperty)).orElseGet(readFromConfig(datasourceConfig, URL));

        if (jdbcUrl == null) {
            throw new EdcException("Mandatory config '%s' not found. Please provide a value for the '%s' property, either as a secret in the vault or an application property.".formatted(urlProperty, urlProperty));
        }

        var jdbcUser = ofNullable(getVault().resolveSecret(rootPath + "." + USER))
                .orElseGet(readFromConfig(datasourceConfig, USER));
        var jdbcPassword = ofNullable(getVault().resolveSecret(rootPath + "." + PASSWORD))
                .orElseGet(readFromConfig(datasourceConfig, PASSWORD));

        var jdbcProperties = new Properties();
        jdbcProperties.putAll(datasourceConfig.getRelativeEntries());

        // only set if not-null, otherwise Properties#add throws a NPE
        ofNullable(jdbcUser).ifPresent(u -> jdbcProperties.put(USER, u));
        ofNullable(jdbcPassword).ifPresent(p -> jdbcProperties.put(PASSWORD, p));

        var driverManagerConnectionFactory = new DriverManagerConnectionFactory();
        var dataSource = new ConnectionFactoryDataSource(driverManagerConnectionFactory, jdbcUrl, jdbcProperties);

        var defaultSchema = config.getString(MIGRATION_SCHEMA, DEFAULT_MIGRATION_SCHEMA);
        var migrateResult = FlywayManager.migrate(dataSource, subSystemName, defaultSchema, LATEST);

        if (!migrateResult.success) {
            throw new EdcPersistenceException(
                    String.format(
                            "Migrating DataSource %s for subsystem %s failed: %s",
                            dataSourceName, subSystemName, String.join(", ", migrateResult.warnings)));
        }
    }

    protected abstract Vault getVault();

    protected abstract String getSubsystemName();

    private @NotNull Supplier<@Nullable String> readFromConfig(Config config, String value) {
        return () -> {
            var entry = EDC_DATASOURCE_PREFIX + "." + config.currentNode() + "." + value;
            monitor.warning("Database configuration value '%s' not found in vault, will fall back to Config. Please consider putting database configuration into the vault.".formatted(entry));
            return config.getString(value, null);
        };
    }
}
