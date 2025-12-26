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

import jakarta.json.JsonObject;
import org.eclipse.edc.iam.identitytrust.spi.verification.SignatureSuiteRegistry;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialFormat;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialSubject;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.DataModelVersion;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.Issuer;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.VerifiableCredential;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.VerifiableCredentialContainer;
import org.eclipse.edc.issuerservice.spi.issuance.generator.CredentialGenerator;
import org.eclipse.edc.issuerservice.spi.issuance.model.CredentialDefinition;
import org.eclipse.edc.keys.spi.PrivateKeyResolver;
import org.eclipse.edc.security.signature.jws2020.JsonWebKeyPair;
import org.eclipse.edc.security.signature.jws2020.Jws2020ProofDraft;
import org.eclipse.edc.security.token.jwt.CryptoConverter;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.types.TypeManager;
import org.eclipse.edc.verifiablecredentials.linkeddata.LdpIssuer;

import java.net.URI;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class LdpCredentialGenerator implements CredentialGenerator {

    private static final String JSON_LD_CONTEXT = "json-ld";
    private static final String DEFAULT_SUITE = "JsonWebSignature2020";

    private final LdpIssuer ldpIssuer;
    private final SignatureSuiteRegistry signatureSuiteRegistry;
    private final PrivateKeyResolver privateKeyResolver;
    private final TypeManager typeManager;
    private final Clock clock;

    public LdpCredentialGenerator(LdpIssuer ldpIssuer,
                                  SignatureSuiteRegistry signatureSuiteRegistry,
                                  PrivateKeyResolver privateKeyResolver,
                                  TypeManager typeManager,
                                  Clock clock) {
        this.ldpIssuer = ldpIssuer;
        this.signatureSuiteRegistry = signatureSuiteRegistry;
        this.privateKeyResolver = privateKeyResolver;
        this.typeManager = typeManager;
        this.clock = clock;
    }

    @Override
    public Result<VerifiableCredentialContainer> generateCredential(
            CredentialDefinition definition,
            String privateKeyAlias,
            String publicKeyId,
            String issuerId,
            String participantId,
            Map<String, Object> claims) {

        var credential = VerifiableCredential.Builder.newInstance()
                .id(UUID.randomUUID().toString())
                .issuer(new Issuer(issuerId))
                .dataModelVersion(DataModelVersion.V_1_1)
                .issuanceDate(Instant.now(clock))
                .expirationDate(Instant.now(clock).plusSeconds(definition.getValidity()))
                .types(List.of("VerifiableCredential", definition.getCredentialType()))
                .credentialSubject(CredentialSubject.Builder.newInstance()
                        .id(participantId)
                        .claims(extractSubjectClaims(claims))
                        .build())
                .build();

        return signCredential(credential, privateKeyAlias, publicKeyId)
                .map(signedJson -> new VerifiableCredentialContainer(signedJson, CredentialFormat.VC1_0_LD, credential));
    }

    @Override
    public Result<String> signCredential(
            VerifiableCredential credential,
            String privateKeyAlias,
            String publicKeyId) {

        var pkResult = privateKeyResolver.resolvePrivateKey(privateKeyAlias);

        if (pkResult.failed()) {
            return Result.failure("Cannot resolve private key: " + pkResult.getFailureDetail());
        }
        PrivateKey privateKey = pkResult.getContent();

        var suite = signatureSuiteRegistry.getForId(DEFAULT_SUITE);
        if (suite == null) {
            return Result.failure("Signature suite not found: " + DEFAULT_SUITE);
        }

        JsonObject vcJson;
        try {
            var jsonString = typeManager.getMapper(JSON_LD_CONTEXT).writeValueAsString(credential);
            vcJson = typeManager.getMapper(JSON_LD_CONTEXT).readValue(jsonString, JsonObject.class);
        } catch (Exception e) {
            return Result.failure("Failed to serialize VC: " + e.getMessage());
        }


        var verificationMethodId = URI.create(publicKeyId.startsWith("did:")
                ? publicKeyId
                : credential.getIssuer().id() + "#" + publicKeyId);

        var controllerUri = URI.create(credential.getIssuer().id());

        var jwk = CryptoConverter.createJwk(new KeyPair(null, privateKey));
        var keyPair = new JsonWebKeyPair(verificationMethodId, URI.create(DEFAULT_SUITE), controllerUri, jwk);

        var proofDraft = Jws2020ProofDraft.Builder.newInstance()
                .proofPurpose(URI.create("https://w3id.org/security#assertionMethod"))
                .created(Instant.now(clock))
                .verificationMethod(new JsonWebKeyPair(verificationMethodId, URI.create(DEFAULT_SUITE), controllerUri, null))
                .mapper(typeManager.getMapper(JSON_LD_CONTEXT))
                .build();

        return ldpIssuer.signDocument(suite, vcJson, keyPair, proofDraft)
                .map(JsonObject::toString);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractSubjectClaims(Map<String, Object> claims) {
        if (claims.containsKey("credentialSubject")) {
            return (Map<String, Object>) claims.get("credentialSubject");
        }
        return claims;
    }
}