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

package org.eclipse.tractusx.identityhub.signing;

import org.eclipse.edc.iam.identitytrust.spi.verification.SignatureSuiteRegistry;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialFormat;
import org.eclipse.edc.issuerservice.issuance.generator.JwtCredentialGenerator;
import org.eclipse.edc.issuerservice.spi.issuance.generator.CredentialGeneratorRegistry;
import org.eclipse.edc.keys.spi.PrivateKeyResolver;
import org.eclipse.edc.security.signature.jws2020.Jws2020SignatureSuite;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.eclipse.edc.spi.types.TypeManager;
import org.eclipse.edc.token.spi.TokenGenerationService;
import org.eclipse.edc.verifiablecredentials.linkeddata.LdpIssuer;

import java.time.Clock;

public class SigningExtension implements ServiceExtension {

    public static final String NAME = "Signing Extension";

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public void initialize(ServiceExtensionContext context) {
        var monitor = context.getMonitor().withPrefix(NAME);

        var generatorRegistry = context.getService(CredentialGeneratorRegistry.class);
        var tokenGenerationService = context.getService(TokenGenerationService.class);
        var ldpIssuer = context.getService(LdpIssuer.class);
        var signatureSuiteRegistry = context.getService(SignatureSuiteRegistry.class);
        var privateKeyResolver = context.getService(PrivateKeyResolver.class);
        var typeManager = context.getService(TypeManager.class);
        var clock = context.getService(Clock.class);

        signatureSuiteRegistry.register(
                "PS256", new Jws2020SignatureSuite(typeManager.getMapper("json-ld"))
        );
        signatureSuiteRegistry.register(
                "ES256", new Jws2020SignatureSuite(typeManager.getMapper("json-ld"))
        );
        signatureSuiteRegistry.register(
                "ED25519", new Jws2020SignatureSuite(typeManager.getMapper("json-ld"))
        );
        monitor.info("Registered Jws2020SignatureSuite for PS256, ES256, ED25519");

        var jwtGenerator = new JwtCredentialGenerator(tokenGenerationService, clock);
        generatorRegistry.addGenerator(CredentialFormat.VC1_0_JWT, jwtGenerator);
        monitor.info("Registered generator for VC1_0_JWT");

        var ldpGenerator = new LdpCredentialGenerator(
                ldpIssuer,
                signatureSuiteRegistry,
                privateKeyResolver,
                typeManager,
                clock
        );
        generatorRegistry.addGenerator(CredentialFormat.VC1_0_LD, ldpGenerator);
        monitor.info("Registered generator for VC1_0_LD");
    }
}
