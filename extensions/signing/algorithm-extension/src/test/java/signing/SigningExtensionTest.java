/*
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2025 LKS next
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
package signing;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.edc.iam.identitytrust.spi.verification.SignatureSuiteRegistry;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialFormat;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.VerifiableCredentialContainer;
import org.eclipse.edc.issuerservice.issuance.generator.JwtCredentialGenerator;
import org.eclipse.edc.issuerservice.spi.issuance.generator.CredentialGenerator;
import org.eclipse.edc.issuerservice.spi.issuance.generator.CredentialGeneratorRegistry;
import org.eclipse.edc.issuerservice.spi.issuance.model.CredentialDefinition;
import org.eclipse.edc.security.signature.jws2020.Jws2020SignatureSuite;
import org.eclipse.edc.spi.iam.TokenRepresentation;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.eclipse.edc.spi.types.TypeManager;
import org.eclipse.edc.token.spi.TokenGenerationService;
import org.eclipse.tractusx.identityhub.signing.LdpCredentialGenerator;
import org.eclipse.tractusx.identityhub.signing.SigningExtension;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class SigningExtensionTest {

    @Mock private CredentialGeneratorRegistry generatorRegistry;
    @Mock private TokenGenerationService tokenService;
    @Mock private SignatureSuiteRegistry signatureSuiteRegistry;
    @Mock private ServiceExtensionContext context;
    @Mock private Clock clock;
    @Mock private Monitor monitor;
    @Mock private TypeManager typeManager;
    @Mock private ObjectMapper mapper;

    private SigningExtension extension;

    @BeforeEach
    void setUp() {
        extension = new SigningExtension();

        lenient().when(context.getMonitor()).thenReturn(monitor);
        lenient().when(monitor.withPrefix(anyString())).thenReturn(monitor);

        lenient().when(context.getService(CredentialGeneratorRegistry.class))
                .thenReturn(generatorRegistry);
        lenient().when(context.getService(TokenGenerationService.class))
                .thenReturn(tokenService);
        lenient().when(context.getService(SignatureSuiteRegistry.class))
                .thenReturn(signatureSuiteRegistry);
        lenient().when(context.getService(TypeManager.class))
                .thenReturn(typeManager);

        lenient().when(context.getService(Clock.class))
                .thenReturn(clock);

        lenient().when(typeManager.getMapper("json-ld")).thenReturn(mapper);
        lenient().when(clock.instant()).thenReturn(Instant.now());
        lenient().when(clock.getZone()).thenReturn(ZoneId.systemDefault());
    }

    @Test
    void shouldRegisterSuitesAndSimulateVcGeneration() {
        extension.initialize(context);

        ArgumentCaptor<Jws2020SignatureSuite> suiteCaptor =
                ArgumentCaptor.forClass(Jws2020SignatureSuite.class);

        verify(signatureSuiteRegistry).register(eq("PS256"), suiteCaptor.capture());
        verify(signatureSuiteRegistry).register(eq("ES256"), suiteCaptor.capture());
        verify(signatureSuiteRegistry).register(eq("ED25519"), suiteCaptor.capture());

        assertThat(suiteCaptor.getAllValues()).hasSize(3);

        ArgumentCaptor<CredentialGenerator> generatorCaptor =
                ArgumentCaptor.forClass(CredentialGenerator.class);

        verify(generatorRegistry)
                .addGenerator(eq(CredentialFormat.VC1_0_JWT), generatorCaptor.capture());
        verify(generatorRegistry)
                .addGenerator(eq(CredentialFormat.VC1_0_LD), generatorCaptor.capture());

        assertThat(generatorCaptor.getAllValues())
                .anyMatch(JwtCredentialGenerator.class::isInstance)
                .anyMatch(LdpCredentialGenerator.class::isInstance);

        JwtCredentialGenerator jwtGenerator = generatorCaptor.getAllValues().stream()
                .filter(JwtCredentialGenerator.class::isInstance)
                .map(JwtCredentialGenerator.class::cast)
                .findFirst()
                .orElseThrow();

        TokenRepresentation mockToken = mock(TokenRepresentation.class);
        when(mockToken.getToken()).thenReturn("mock-jwt-token");

        when(tokenService.generate(anyString(), any(), any()))
                .thenReturn(Result.success(mockToken));

        CredentialDefinition definition = mock(CredentialDefinition.class);
        when(definition.getCredentialType()).thenReturn("TestCredential");
        when(definition.getValidity()).thenReturn(3600L);

        Map<String, Object> claims = Map.of(
                "credentialSubject", Map.<String, Object>of("name", "Alice"),
                "credentialStatus", Map.<String, Object>of("id", "status1", "type", "StatusType")
        );

        Result<VerifiableCredentialContainer> result = jwtGenerator.generateCredential(
                definition,
                "privateKey",
                "publicKey",
                "issuerId",
                "holderDid",
                claims
        );

        assertThat(result.succeeded()).isTrue();
        assertThat(result.getContent().format())
                .isEqualTo(CredentialFormat.VC1_0_JWT);
        assertThat(result.getContent().rawVc())
                .isEqualTo("mock-jwt-token");
    }
}