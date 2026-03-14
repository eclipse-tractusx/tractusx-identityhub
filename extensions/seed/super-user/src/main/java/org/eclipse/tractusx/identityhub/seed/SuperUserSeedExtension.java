/*
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *
 *   This program and the accompanying materials are made available under the
 *   terms of the Apache License, Version 2.0 which is available at
 *   https://www.apache.org/licenses/LICENSE-2.0.
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *   WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *   License for the specific language governing permissions and limitations
 *   under the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 *
 */

package org.eclipse.tractusx.identityhub.seed;

import org.eclipse.edc.identityhub.spi.authentication.ServicePrincipal;
import org.eclipse.edc.identityhub.spi.participantcontext.ParticipantContextService;
import org.eclipse.edc.identityhub.spi.participantcontext.model.KeyDescriptor;
import org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantManifest;
import org.eclipse.edc.participantcontext.spi.config.model.ParticipantContextConfiguration;
import org.eclipse.edc.participantcontext.spi.config.service.ParticipantContextConfigService;
import org.eclipse.edc.runtime.metamodel.annotation.Inject;
import org.eclipse.edc.runtime.metamodel.annotation.Setting;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.query.QuerySpec;
import org.eclipse.edc.spi.security.Vault;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;

import java.util.List;
import java.util.Map;

import static java.util.Optional.ofNullable;

public class SuperUserSeedExtension implements ServiceExtension {
    public static final String NAME = "SUPER USER Seed Extension";
    public static final String DEFAULT_SUPER_USER_PARTICIPANT_ID = "super-user";

    @Setting(value = "Explicitly set the initial API key for the Super-User")
    public static final String SUPERUSER_APIKEY_PROPERTY = "edc.ih.api.superuser.key";

    @Setting(value = "Config value to set the super-user's participant ID.", defaultValue = DEFAULT_SUPER_USER_PARTICIPANT_ID)
    public static final String SUPERUSER_PARTICIPANT_ID_PROPERTY = "edc.ih.api.superuser.id";
    private String superUserParticipantId;
    private String superUserApiKey;
    private Monitor monitor;
    @Inject
    private ParticipantContextService participantContextService;
    @Inject
    private ParticipantContextConfigService participantContextConfigService;
    @Inject
    private Vault vault;

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public void initialize(ServiceExtensionContext context) {
        superUserParticipantId = context.getSetting(SUPERUSER_PARTICIPANT_ID_PROPERTY, DEFAULT_SUPER_USER_PARTICIPANT_ID);
        superUserApiKey = context.getSetting(SUPERUSER_APIKEY_PROPERTY, null);
        monitor = context.getMonitor().withPrefix(SuperUserSeedExtension.class.getSimpleName());
    }

    @Override
    public void start() {
        // Restore configs for ALL existing participants (they persist in PostgreSQL,
        // but the InMemoryParticipantContextConfigStore loses them on restart)
        restoreAllParticipantConfigs();

        // create super-user
        if (participantContextService.getParticipantContext(superUserParticipantId).succeeded()) { // already exists
            monitor.debug("super-user already exists with ID '%s', will not re-create".formatted(superUserParticipantId));
            ensureConfigExists(superUserParticipantId);
            ensureApiKeyInVault(superUserParticipantId);
            return;
        }
        participantContextService.createParticipantContext(ParticipantManifest.Builder.newInstance()
                        .participantContextId(superUserParticipantId)
                        .did("did:web:%s".formatted(superUserParticipantId)) // doesn't matter, not intended for resolution
                        .active(true)
                        .key(KeyDescriptor.Builder.newInstance()
                                .keyGeneratorParams(Map.of("algorithm", "EdDSA", "curve", "Ed25519"))
                                .keyId("%s-key".formatted(superUserParticipantId))
                                .privateKeyAlias("%s-alias".formatted(superUserParticipantId))
                                .build())
                        .roles(List.of(ServicePrincipal.ROLE_ADMIN))
                        .build())
                .onSuccess(generatedKey -> {
                    var apiKey = ofNullable(superUserApiKey)
                            .map(overrideKey -> {
                                if (!overrideKey.contains(".")) {
                                    monitor.warning("Super-user key override: this key appears to have an invalid format, you may be unable to access some APIs. It must follow the structure: 'base64(<participantId>).<random-string>'");
                                }
                                participantContextService.getParticipantContext(superUserParticipantId)
                                        .onSuccess(pc -> vault.storeSecret(pc.getApiTokenAlias(), overrideKey)
                                                .onSuccess(u -> monitor.debug("Super-user key override successful"))
                                                .onFailure(f -> monitor.warning("Error storing API key in vault: %s".formatted(f.getFailureDetail()))))
                                        .onFailure(f -> monitor.warning("Error overriding API key for '%s': %s".formatted(superUserParticipantId, f.getFailureDetail())));
                                return overrideKey;
                            })
                            .orElse(generatedKey.apiKey());
                    monitor.info("Created user 'super-user'. Please take note of the API Key: %s".formatted(apiKey));
                })
                .orElseThrow(f -> new EdcException("Error creating Super-User: " + f.getFailureDetail()));
    }

    /**
     * Restores {@link ParticipantContextConfiguration} entries for ALL participant contexts
     * found in the persistent store (PostgreSQL). This is necessary because the default
     * {@code InMemoryParticipantContextConfigStore} does not persist across restarts,
     * while participant contexts survive in PostgreSQL. Without this, any vault-dependent
     * operation (delete, regenerate token, etc.) on non-super-user participants fails with
     * "No configuration found for participant context" after a container restart.
     */
    private void restoreAllParticipantConfigs() {
        participantContextService.query(QuerySpec.max())
                .onSuccess(participants -> {
                    var count = 0;
                    for (var pc : participants) {
                        var id = pc.getParticipantContextId();
                        var configResult = participantContextConfigService.get(id);
                        if (configResult.failed()) {
                            var cfg = ParticipantContextConfiguration.Builder.newInstance()
                                    .participantContextId(id)
                                    .build();
                            participantContextConfigService.save(cfg)
                                    .onFailure(f -> monitor.warning("Error restoring config for '%s': %s".formatted(id, f.getFailureDetail())));
                            count++;
                        }
                    }
                    if (count > 0) {
                        monitor.info("Restored ParticipantContextConfig entries for %d participant(s)".formatted(count));
                    }
                })
                .onFailure(f -> monitor.warning("Error querying participants to restore configs: %s".formatted(f.getFailureDetail())));
    }

    /**
     * Ensures a {@link ParticipantContextConfiguration} entry exists in the in-memory config store.
     * This is needed because the default {@code InMemoryParticipantContextConfigStore} does not persist across restarts,
     * while participant contexts survive in PostgreSQL. Without this, all authenticated API calls fail with
     * "No configuration found for participant context" after a container restart.
     */
    private void ensureConfigExists(String participantContextId) {
        var configResult = participantContextConfigService.get(participantContextId);
        if (configResult.failed()) {
            monitor.info("ParticipantContextConfig for '%s' not found in config store, re-creating...".formatted(participantContextId));
            var cfg = ParticipantContextConfiguration.Builder.newInstance()
                    .participantContextId(participantContextId)
                    .build();
            participantContextConfigService.save(cfg)
                    .onSuccess(u -> monitor.debug("ParticipantContextConfig for '%s' created successfully".formatted(participantContextId)))
                    .onFailure(f -> monitor.warning("Error creating ParticipantContextConfig for '%s': %s".formatted(participantContextId, f.getFailureDetail())));
        }
    }

    /**
     * Ensures the super-user API key is stored in the vault. When using HashiCorp Vault in dev mode (or any non-persistent
     * vault), the API key is lost on container restart while the participant context persists in PostgreSQL.
     * If a configured override key exists ({@link #SUPERUSER_APIKEY_PROPERTY}), it will be stored in the vault
     * under the participant's API token alias.
     */
    private void ensureApiKeyInVault(String participantContextId) {
        if (superUserApiKey == null) {
            monitor.warning("Super-user already exists but no API key override is configured ('%s'). The API key in the vault may be stale after a restart."
                    .formatted(SUPERUSER_APIKEY_PROPERTY));
            return;
        }
        participantContextService.getParticipantContext(participantContextId)
                .onSuccess(pc -> {
                    var alias = pc.getApiTokenAlias();
                    var existing = vault.resolveSecret(alias);
                    if (existing == null || !existing.equals(superUserApiKey)) {
                        vault.storeSecret(alias, superUserApiKey)
                                .onSuccess(u -> monitor.info("API key for '%s' stored in vault under alias '%s'".formatted(participantContextId, alias)))
                                .onFailure(f -> monitor.warning("Error storing API key in vault for '%s': %s".formatted(participantContextId, f.getFailureDetail())));
                    }
                })
                .onFailure(f -> monitor.warning("Could not retrieve participant context '%s' to ensure API key: %s".formatted(participantContextId, f.getFailureDetail())));
    }
}
