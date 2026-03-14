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

import org.eclipse.edc.identityhub.spi.participantcontext.ParticipantContextService;
import org.eclipse.edc.identityhub.spi.participantcontext.model.CreateParticipantContextResponse;
import org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantContext;
import org.eclipse.edc.junit.extensions.DependencyInjectionExtension;
import org.eclipse.edc.participantcontext.spi.config.service.ParticipantContextConfigService;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.result.ServiceResult;
import org.eclipse.edc.spi.security.Vault;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(DependencyInjectionExtension.class)
class ParticipantContextSeedExtensionTest {

    public static final String SUPER_USER = "super-user";
    private final ParticipantContextService participantContextService = mock();
    private final ParticipantContextConfigService participantContextConfigService = mock();
    private final Vault vault = mock();
    private final Monitor monitor = mock();

    @BeforeEach
    void setup(ServiceExtensionContext context) {
        context.registerService(ParticipantContextService.class, participantContextService);
        context.registerService(ParticipantContextConfigService.class, participantContextConfigService);
        context.registerService(Vault.class, vault);
        context.registerService(Monitor.class, monitor);
        when(participantContextService.getParticipantContext(eq(SUPER_USER))).thenReturn(ServiceResult.notFound("foobar"));
        when(participantContextService.query(any())).thenReturn(ServiceResult.success(List.of()));
        when(context.getMonitor().withPrefix(SuperUserSeedExtension.class.getSimpleName())).thenReturn(monitor);
    }

    @Test
    void start_verifySuperUser(SuperUserSeedExtension ext,
                               ServiceExtensionContext context) {

        when(participantContextService.createParticipantContext(any()))
                .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("some-key", null, null)));

        ext.initialize(context);

        ext.start();
        verify(participantContextService).query(any());
        verify(participantContextService).getParticipantContext(eq(SUPER_USER));
        verify(participantContextService).createParticipantContext(any());
        verifyNoMoreInteractions(participantContextService);
    }

    @Test
    void start_failsToCreate(SuperUserSeedExtension ext, ServiceExtensionContext context) {

        when(participantContextService.createParticipantContext(any()))
                .thenReturn(ServiceResult.badRequest("test-message"));
        ext.initialize(context);
        assertThatThrownBy(ext::start).isInstanceOf(EdcException.class);

        verify(participantContextService).query(any());
        verify(participantContextService).getParticipantContext(eq(SUPER_USER));
        verify(participantContextService).createParticipantContext(any());
        verifyNoMoreInteractions(participantContextService);
    }

    @Test
    void start_withApiKeyOverride(SuperUserSeedExtension ext,
                                  ServiceExtensionContext context) {


        when(vault.storeSecret(any(), any())).thenReturn(Result.success());

        var apiKeyOverride = "c3VwZXItdXNlcgo=.asdfl;jkasdfl;kasdf";
        when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                .thenReturn(apiKeyOverride);

        when(participantContextService.createParticipantContext(any()))
                .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("generated-api-key", null, null)));
        when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                .thenReturn(ServiceResult.notFound("foobar"))
                .thenReturn(ServiceResult.success(superUserContext().build()));

        ext.initialize(context);
        ext.start();
        verify(participantContextService).query(any());
        verify(participantContextService, times(2)).getParticipantContext(eq(SUPER_USER));
        verify(participantContextService).createParticipantContext(any());
        verify(vault).storeSecret(eq("super-user-apikey"), eq(apiKeyOverride));
        verifyNoMoreInteractions(participantContextService, vault);
    }

    @Test
    void start_withInvalidKeyOverride(SuperUserSeedExtension ext,
                                      ServiceExtensionContext context) {
        when(vault.storeSecret(any(), any())).thenReturn(Result.success());

        var apiKeyOverride = "some-invalid-key";
        when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                .thenReturn(apiKeyOverride);

        when(participantContextService.createParticipantContext(any()))
                .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("generated-api-key", null, null)));
        when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                .thenReturn(ServiceResult.notFound("foobar"))
                .thenReturn(ServiceResult.success(superUserContext().build()));

        ext.initialize(context);
        ext.start();
        verify(participantContextService).query(any());
        verify(participantContextService).createParticipantContext(any());
        verify(participantContextService, times(2)).getParticipantContext(eq(SUPER_USER));
        verify(vault).storeSecret(eq("super-user-apikey"), eq(apiKeyOverride));
        verify(monitor).warning(contains("this key appears to have an invalid format"));
        verifyNoMoreInteractions(participantContextService, vault);
    }

    @Test
    void start_whenVaultReturnsFailure(SuperUserSeedExtension ext,
                                       ServiceExtensionContext context) {
        when(vault.storeSecret(any(), any())).thenReturn(Result.failure("test-failure"));

        var apiKeyOverride = "c3VwZXItdXNlcgo=.asdfl;jkasdfl;kasdf";
        when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                .thenReturn(apiKeyOverride);

        when(participantContextService.createParticipantContext(any()))
                .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("generated-api-key", null, null)));
        when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                .thenReturn(ServiceResult.notFound("foobar"))
                .thenReturn(ServiceResult.success(superUserContext().build()));

        ext.initialize(context);
        ext.start();
        verify(participantContextService).query(any());
        verify(participantContextService, times(2)).getParticipantContext(eq(SUPER_USER));
        verify(participantContextService).createParticipantContext(any());
        verify(vault).storeSecret(eq("super-user-apikey"), eq(apiKeyOverride));
        verify(monitor).warning(eq("Error storing API key in vault: test-failure"));
        verifyNoMoreInteractions(participantContextService, vault);
    }

    @Nested
    @ExtendWith(DependencyInjectionExtension.class)
    class RestoreAllParticipantConfigs {

        @BeforeEach
        void setup(ServiceExtensionContext context) {
            context.registerService(ParticipantContextService.class, participantContextService);
            context.registerService(ParticipantContextConfigService.class, participantContextConfigService);
            context.registerService(Vault.class, vault);
            context.registerService(Monitor.class, monitor);
            when(context.getMonitor().withPrefix(SuperUserSeedExtension.class.getSimpleName())).thenReturn(monitor);
        }

        @Test
        void shouldRestoreConfigsForParticipantsWithMissingConfig(SuperUserSeedExtension ext,
                                                                   ServiceExtensionContext context) {
            var participant1 = ParticipantContext.Builder.newInstance()
                    .participantContextId("participant-1")
                    .apiTokenAlias("p1-apikey")
                    .build();
            var participant2 = ParticipantContext.Builder.newInstance()
                    .participantContextId("participant-2")
                    .apiTokenAlias("p2-apikey")
                    .build();

            when(participantContextService.query(any())).thenReturn(ServiceResult.success(List.of(participant1, participant2)));
            when(participantContextConfigService.get(eq("participant-1"))).thenReturn(ServiceResult.notFound("not found"));
            when(participantContextConfigService.get(eq("participant-2"))).thenReturn(ServiceResult.notFound("not found"));
            when(participantContextConfigService.save(any())).thenReturn(ServiceResult.success());
            when(participantContextService.createParticipantContext(any()))
                    .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("key", null, null)));
            when(participantContextService.getParticipantContext(eq(SUPER_USER))).thenReturn(ServiceResult.notFound("foobar"));

            ext.initialize(context);
            ext.start();

            verify(participantContextConfigService).get(eq("participant-1"));
            verify(participantContextConfigService).get(eq("participant-2"));
            verify(participantContextConfigService).save(argThat(cfg -> "participant-1".equals(cfg.getParticipantContextId())));
            verify(participantContextConfigService).save(argThat(cfg -> "participant-2".equals(cfg.getParticipantContextId())));
            verify(monitor).info(contains("Restored ParticipantContextConfig entries for 2 participant(s)"));
        }

        @Test
        void shouldSkipParticipantsWithExistingConfig(SuperUserSeedExtension ext,
                                                      ServiceExtensionContext context) {
            var participant = ParticipantContext.Builder.newInstance()
                    .participantContextId("participant-1")
                    .apiTokenAlias("p1-apikey")
                    .build();

            when(participantContextService.query(any())).thenReturn(ServiceResult.success(List.of(participant)));
            when(participantContextConfigService.get(eq("participant-1"))).thenReturn(ServiceResult.success(null));
            when(participantContextService.createParticipantContext(any()))
                    .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("key", null, null)));
            when(participantContextService.getParticipantContext(eq(SUPER_USER))).thenReturn(ServiceResult.notFound("foobar"));

            ext.initialize(context);
            ext.start();

            verify(participantContextConfigService).get(eq("participant-1"));
            verify(participantContextConfigService, never()).save(any());
        }

        @Test
        void shouldLogWarningWhenQueryFails(SuperUserSeedExtension ext,
                                            ServiceExtensionContext context) {
            when(participantContextService.query(any())).thenReturn(ServiceResult.badRequest("query-error"));
            when(participantContextService.createParticipantContext(any()))
                    .thenReturn(ServiceResult.success(new CreateParticipantContextResponse("key", null, null)));
            when(participantContextService.getParticipantContext(eq(SUPER_USER))).thenReturn(ServiceResult.notFound("foobar"));

            ext.initialize(context);
            ext.start();

            verify(monitor).warning(contains("Error querying participants to restore configs"));
        }
    }

    @Nested
    @ExtendWith(DependencyInjectionExtension.class)
    class EnsureConfigExistsForSuperUser {

        @BeforeEach
        void setup(ServiceExtensionContext context) {
            context.registerService(ParticipantContextService.class, participantContextService);
            context.registerService(ParticipantContextConfigService.class, participantContextConfigService);
            context.registerService(Vault.class, vault);
            context.registerService(Monitor.class, monitor);
            when(participantContextService.query(any())).thenReturn(ServiceResult.success(List.of()));
            when(context.getMonitor().withPrefix(SuperUserSeedExtension.class.getSimpleName())).thenReturn(monitor);
        }

        @Test
        void shouldCreateConfigWhenSuperUserExistsButConfigMissing(SuperUserSeedExtension ext,
                                                                    ServiceExtensionContext context) {
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));
            when(participantContextConfigService.get(eq(SUPER_USER))).thenReturn(ServiceResult.notFound("not found"));
            when(participantContextConfigService.save(any())).thenReturn(ServiceResult.success());

            ext.initialize(context);
            ext.start();

            verify(participantContextConfigService).get(eq(SUPER_USER));
            verify(participantContextConfigService).save(argThat(cfg -> SUPER_USER.equals(cfg.getParticipantContextId())));
        }

        @Test
        void shouldNotCreateConfigWhenSuperUserExistsAndConfigPresent(SuperUserSeedExtension ext,
                                                                      ServiceExtensionContext context) {
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));
            when(participantContextConfigService.get(eq(SUPER_USER))).thenReturn(ServiceResult.success(null));

            ext.initialize(context);
            ext.start();

            verify(participantContextConfigService).get(eq(SUPER_USER));
            verify(participantContextConfigService, never()).save(any());
        }
    }

    @Nested
    @ExtendWith(DependencyInjectionExtension.class)
    class EnsureApiKeyInVault {

        @BeforeEach
        void setup(ServiceExtensionContext context) {
            context.registerService(ParticipantContextService.class, participantContextService);
            context.registerService(ParticipantContextConfigService.class, participantContextConfigService);
            context.registerService(Vault.class, vault);
            context.registerService(Monitor.class, monitor);
            when(participantContextService.query(any())).thenReturn(ServiceResult.success(List.of()));
            when(participantContextConfigService.get(any())).thenReturn(ServiceResult.success(null));
            when(context.getMonitor().withPrefix(SuperUserSeedExtension.class.getSimpleName())).thenReturn(monitor);
        }

        @Test
        void shouldWarnWhenNoApiKeyOverrideConfigured(SuperUserSeedExtension ext,
                                                      ServiceExtensionContext context) {
            // No API key override → superUserApiKey is null
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));

            ext.initialize(context);
            ext.start();

            verify(monitor).warning(contains("no API key override is configured"));
            verify(vault, never()).storeSecret(any(), any());
        }

        @Test
        void shouldStoreApiKeyWhenVaultHasStaleKey(SuperUserSeedExtension ext,
                                                   ServiceExtensionContext context) {
            var apiKeyOverride = "c3VwZXItdXNlcgo=.fresh-key";
            when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                    .thenReturn(apiKeyOverride);
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));
            when(vault.resolveSecret(eq("super-user-apikey"))).thenReturn("old-stale-key");
            when(vault.storeSecret(any(), any())).thenReturn(Result.success());

            ext.initialize(context);
            ext.start();

            verify(vault).resolveSecret(eq("super-user-apikey"));
            verify(vault).storeSecret(eq("super-user-apikey"), eq(apiKeyOverride));
        }

        @Test
        void shouldNotStoreApiKeyWhenVaultAlreadyHasCorrectKey(SuperUserSeedExtension ext,
                                                                ServiceExtensionContext context) {
            var apiKeyOverride = "c3VwZXItdXNlcgo=.correct-key";
            when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                    .thenReturn(apiKeyOverride);
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));
            when(vault.resolveSecret(eq("super-user-apikey"))).thenReturn(apiKeyOverride);

            ext.initialize(context);
            ext.start();

            verify(vault).resolveSecret(eq("super-user-apikey"));
            verify(vault, never()).storeSecret(any(), any());
        }

        @Test
        void shouldStoreApiKeyWhenVaultReturnsNull(SuperUserSeedExtension ext,
                                                   ServiceExtensionContext context) {
            var apiKeyOverride = "c3VwZXItdXNlcgo=.new-key";
            when(context.getSetting(eq(SuperUserSeedExtension.SUPERUSER_APIKEY_PROPERTY), eq(null)))
                    .thenReturn(apiKeyOverride);
            when(participantContextService.getParticipantContext(eq(SUPER_USER)))
                    .thenReturn(ServiceResult.success(superUserContext().build()));
            when(vault.resolveSecret(eq("super-user-apikey"))).thenReturn(null);
            when(vault.storeSecret(any(), any())).thenReturn(Result.success());

            ext.initialize(context);
            ext.start();

            verify(vault).storeSecret(eq("super-user-apikey"), eq(apiKeyOverride));
        }
    }

    private ParticipantContext.Builder superUserContext() {
        return ParticipantContext.Builder.newInstance()
                .participantContextId(SUPER_USER)
                .apiTokenAlias("super-user-apikey");

    }
}