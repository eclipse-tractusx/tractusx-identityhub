/*
 *   Copyright (c) 2025 LKS Next
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

package org.eclipse.tractusx.identityhub.initial.participant;

import org.eclipse.edc.iam.identitytrust.sts.spi.store.StsAccountStore;
import org.eclipse.edc.identityhub.spi.did.DidDocumentService;
import org.eclipse.edc.identityhub.spi.keypair.KeyPairService;
import org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantContext;
import org.eclipse.edc.identityhub.spi.participantcontext.store.ParticipantContextStore;
import org.eclipse.edc.junit.extensions.DependencyInjectionExtension;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.result.ServiceResult;
import org.eclipse.edc.spi.result.StoreResult;
import org.eclipse.edc.spi.security.Vault;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.reflect.Field;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(DependencyInjectionExtension.class)
public class InitialParticipantExtensionTest {

    private static final String CREDENTIALS_PATH = "/api/credentials";
    
    private final Vault vault = mock();
    private final ParticipantContextStore participantContextStore = mock();
    private final StsAccountStore stsAccountStore = mock();
    private final KeyPairService keyPairService = mock();
    private final DidDocumentService didDocumentService = mock();
    private final Monitor monitor = mock();

    @BeforeEach
    void setup(ServiceExtensionContext context) {
        when(context.getMonitor()).thenReturn(monitor);
        when(monitor.withPrefix(anyString())).thenReturn(monitor);
    }

    @Test
    void initialParticipantContext_valid_test(ServiceExtensionContext context) {
        // Test data
        String participantDid = "did:web:example.com";
        String participantSecret = "test-secret-123";
        String participantSecretAlias = "participant-secret-alias";
        String participantApiKey = Base64.getEncoder().encodeToString(participantDid.getBytes()) + ".random-chars";
        boolean useHttps = false;
        boolean enableParticipant = true;
        
        // Create extension manually and inject dependencies and configuration
        var extension = new InitialParticipantExtension();
        startup(extension, participantDid, participantSecret, participantSecretAlias, participantApiKey, enableParticipant, useHttps);
        
        // Arrange
        when(participantContextStore.create(any(ParticipantContext.class)))
                .thenReturn(StoreResult.success());
        when(vault.storeSecret(anyString(), anyString()))
                .thenReturn(Result.success());
        when(didDocumentService.store(any(), anyString()))
                .thenReturn(ServiceResult.success());
        when(keyPairService.addKeyPair(anyString(), any(), anyBoolean()))
                .thenReturn(ServiceResult.success());
        when(stsAccountStore.create(any()))
                .thenReturn(StoreResult.success());

        // Act
        extension.initialize(context);
        extension.start();

        // Assert
        verify(participantContextStore).create(any(ParticipantContext.class));
        verify(vault).storeSecret(eq(participantSecretAlias), eq(participantSecret));
        verify(vault).storeSecret(eq(participantDid + "-apikey"), eq(participantApiKey));
        verify(didDocumentService).store(any(), eq(participantDid));
        verify(keyPairService).addKeyPair(eq(participantDid), any(), eq(true));
        verify(stsAccountStore).create(any());
    }

    @Test
    void initialParticipantContext_incorrectApiKey_test(ServiceExtensionContext context) {
        // Test data with incorrectly encoded API key
        String participantDid = "did:web:example.com";
        String participantSecret = "test-secret-123";
        String participantSecretAlias = "participant-secret-alias";
        String participantApiKey = "incorrectBase64Encoding.random-chars"; // Wrong encoding
        boolean useHttps = false;
        boolean enableParticipant = true;
        
        // Create extension manually and inject dependencies and configuration
        var extension = new InitialParticipantExtension();
        startup(extension, participantDid, participantSecret, participantSecretAlias, participantApiKey, enableParticipant, useHttps);
        
        // Act & Assert - expect EdcException to be thrown during initialization
        assertThrows(EdcException.class, () -> extension.initialize(context));
    }

    @Test
    void initialParticipantContext_nullDid_test(ServiceExtensionContext context) {
        // Test data with null participantDid
        String participantDid = null; // Required field set to null
        String participantSecret = "test-secret-123";
        String participantSecretAlias = "participant-secret-alias";
        String participantApiKey = "base64EncodedDid.random-chars";
        boolean useHttps = false;
        boolean enableParticipant = true;
        
        // Create extension manually and inject dependencies and configuration
        var extension = new InitialParticipantExtension();
        startup(extension, participantDid, participantSecret, participantSecretAlias, participantApiKey, enableParticipant, useHttps);
        
        // Act & Assert - expect NullPointerException to be thrown during initialization
        assertThrows(NullPointerException.class, () -> extension.initialize(context));
    }

    @Test
    void initialParticipantContext_disabled_test(ServiceExtensionContext context) {
        // Test data with enableParticipant set to false
        String participantDid = "did:web:example.com";
        String participantSecret = "test-secret-123";
        String participantSecretAlias = "participant-secret-alias";
        String participantApiKey = Base64.getEncoder().encodeToString(participantDid.getBytes()) + ".random-chars";
        boolean useHttps = false;
        boolean enableParticipant = false; // Disabled
        
        // Create extension manually and inject dependencies and configuration
        var extension = new InitialParticipantExtension();
        startup(extension, participantDid, participantSecret, participantSecretAlias, participantApiKey, enableParticipant, useHttps);
        
        // Act
        extension.initialize(context);
        extension.start();

        // Assert - verify no participant context is created when disabled
        verifyNoInteractions(participantContextStore);
        verifyNoInteractions(vault);
        verifyNoInteractions(didDocumentService);
        verifyNoInteractions(keyPairService);
        verifyNoInteractions(stsAccountStore);
    }

    private void startup(InitialParticipantExtension extension,
                        String participantDid,
                        String participantSecret,
                        String participantSecretAlias,
                        String participantApiKey,
                        boolean useConfigParticipant,
                        boolean useHttpsScheme) {
        try {
            // Inject dependencies
            setField(extension, "vault", vault);
            setField(extension, "participantContextStore", participantContextStore);
            setField(extension, "stsAccountStore", stsAccountStore);
            setField(extension, "keyPairService", keyPairService);
            setField(extension, "didDocumentService", didDocumentService);
            
            // Inject configuration settings
            setField(extension, "participantId", participantDid);
            setField(extension, "participantSecret", participantSecret);
            setField(extension, "participantSecretAlias", participantSecretAlias);
            setField(extension, "participantApiKey", participantApiKey);
            setField(extension, "useConfigParticipant", useConfigParticipant);
            setField(extension, "useHttpsScheme", useHttpsScheme);
            setField(extension, "credentialsApi", CREDENTIALS_PATH);
        } catch (Exception e) {
            throw new RuntimeException("Failed to setup extension", e);
        }
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

}
