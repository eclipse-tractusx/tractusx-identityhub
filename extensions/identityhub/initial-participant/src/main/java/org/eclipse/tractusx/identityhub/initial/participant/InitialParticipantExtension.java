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

import org.eclipse.edc.iam.did.spi.document.DidDocument;
import org.eclipse.edc.iam.did.spi.document.Service;
import org.eclipse.edc.iam.identitytrust.sts.spi.model.StsAccount;
import org.eclipse.edc.iam.identitytrust.sts.spi.store.StsAccountStore;
import org.eclipse.edc.identityhub.spi.authentication.ServicePrincipal;
import org.eclipse.edc.identityhub.spi.did.DidDocumentService;
import org.eclipse.edc.identityhub.spi.keypair.KeyPairService;
import org.eclipse.edc.identityhub.spi.participantcontext.model.KeyDescriptor;
import org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantContext;
import org.eclipse.edc.identityhub.spi.participantcontext.model.ParticipantContextState;
import org.eclipse.edc.identityhub.spi.participantcontext.store.ParticipantContextStore;
import org.eclipse.edc.runtime.metamodel.annotation.Extension;
import org.eclipse.edc.runtime.metamodel.annotation.Inject;
import org.eclipse.edc.runtime.metamodel.annotation.Setting;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.security.Vault;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.Objects.requireNonNull;

@Extension(InitialParticipantExtension.NAME)
public class InitialParticipantExtension implements ServiceExtension {
    public static final String NAME = "Configurable Initial Participant Context Extension";

    @Setting(key = "edc.tractusx.ih.participant.configurable.did",
            description = "The did/participantId of the initial participant, must be the Did API url",
            required = false)
    private String participantDid;

    @Setting(key = "edc.tractusx.ih.participant.configurable.secret",
            description = "The client secret of the initial participant context",
            required = false)
    private String participantSecret;

    @Setting(key = "edc.tractusx.ih.participant.configurable.api.key",
            description = "Configurable XApiKey for Initial Participant Context",
            required = false)
    private String participantApiKey;

    @Setting(key = "edc.tractusx.ih.participant.configurable.enable",
            description = "Enable configurable participant context",
            defaultValue = "false")
    private boolean useConfigParticipant;

    @Setting(key = "edc.iam.did.web.use.https")
    private boolean useHttpsScheme;

    @Setting(key = "web.http.credentials.path")
    private String credentialsApi;

    private Monitor monitor;
    private final SecureRandom secureRandom = new SecureRandom();

    @Inject
    private Vault vault;

    @Inject
    private ParticipantContextStore participantContextStore;

    @Inject
    private StsAccountStore stsAccountStore;

    @Inject
    private KeyPairService keyPairService;

    @Inject
    private DidDocumentService didDocumentService;

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public void initialize(ServiceExtensionContext context) {
        monitor = context.getMonitor().withPrefix(InitialParticipantExtension.class.getSimpleName());
        if (useConfigParticipant) {
            // validate values in case configurable participant is enabled
            requireNonNull(participantDid, "Missing required default participant Did property");
            requireNonNull(participantSecret, "Missing required default participant secret property");
            requireNonNull(participantApiKey, "Missing required default participant apikey property");

            Base64.Encoder enc = Base64.getEncoder();
            String base64Did = enc.encodeToString(participantDid.getBytes());

            if (!participantApiKey.substring(0, participantApiKey.indexOf(".")).equals(base64Did)) {
                throw new EdcException("The configured x-api-key must start with the participantDid encoded in base64. For instance: %s.randomChars".formatted(base64Did));
            }
        }
    }

    @Override
    public void start() {

        if (!useConfigParticipant) {
            return;
        }

        ParticipantContext context = getParticipantContext();
        participantContextStore.create(context)
                .onFailure(e -> monitor.severe("Error storing participantContext into storage, error details: %s".formatted(e.getFailureDetail())));

        vault.storeSecret(context.clientSecretAlias(), participantSecret)
                .onFailure(e -> monitor.severe("Error storing client-secret into vault, error details: %s".formatted(e.getFailureDetail())));

        monitor.info("Generated X-Api-Key for initial PC: %s".formatted(participantApiKey));
        vault.storeSecret(context.getApiTokenAlias(), participantApiKey)
                .onFailure(e -> monitor.severe("Error storing X-Api-Key into vault, error details: %s".formatted(e.getFailureDetail())));

        DidDocument document = getDidDocument();
        didDocumentService.store(document, participantDid)
                .onFailure(e -> monitor.severe("Error storing DID in storage, error details: %s".formatted(e.getFailureDetail())));

        KeyDescriptor key = getKeyDescriptor();
        keyPairService.addKeyPair(participantDid, key, true)
                .onFailure(e -> monitor.severe("Error storing KeyPair in storage, error details: %s".formatted(e.getFailureDetail())));

        StsAccount sts = getStsAccount(key);
        stsAccountStore.create(sts)
                .onFailure(e -> monitor.severe("Error storing Secure Token in storage, error details: %s".formatted(e.getFailureDetail())));
    }

    private StsAccount getStsAccount(KeyDescriptor key) {
        return StsAccount.Builder.newInstance()
                .id(participantDid)
                .name(participantDid)
                .clientId(participantDid)
                .did(participantDid)
                .secretAlias("%s-sts-client-secret".formatted(participantDid))
                .privateKeyAlias(key.getPrivateKeyAlias())
                .publicKeyReference(key.getKeyId())
                .build();
    }

    private DidDocument getDidDocument() {
        String type = "CredentialService";
        String id = "%s#credential-service".formatted(participantDid.replace("did:web:", ""));
        String endpoint = getServiceEndpoint();
        return DidDocument.Builder.newInstance()
                .id(participantDid)
                .service(List.of(new Service(id, type, endpoint)))
                .build();
    }

    private String getServiceEndpoint() {
        StringBuilder endpointBuilder = new StringBuilder();
        Base64.Encoder enc = Base64.getEncoder();
        if (useHttpsScheme) {
            endpointBuilder.append("https");
        } else {
            endpointBuilder.append("http");
        }

        endpointBuilder.append("://");
        endpointBuilder.append(participantDid.split(":")[2]);
        endpointBuilder.append(credentialsApi);
        endpointBuilder.append("/v1/participants/%s".formatted(enc.encodeToString(participantDid.getBytes())));
        return endpointBuilder.toString();
    }

    private KeyDescriptor getKeyDescriptor() {
        return KeyDescriptor.Builder.newInstance()
                .keyGeneratorParams(Map.of("algorithm", "Ec", "curve", "secp256r1"))
                .keyId("%s#key-1".formatted(participantDid))
                .privateKeyAlias("%s-alias".formatted(participantDid))
                .build();
    }

    private ParticipantContext getParticipantContext() {
        long timestamp = Instant.now().toEpochMilli();
        return ParticipantContext.Builder.newInstance()
                .did(participantDid)
                .participantContextId(participantDid)
                .createdAt(timestamp)
                .lastModified(timestamp)
                .apiTokenAlias("%s-apikey".formatted(participantDid))
                .state(ParticipantContextState.ACTIVATED)
                .roles(List.of(ServicePrincipal.ROLE_ADMIN))
                .properties(new HashMap<>())
                .build();
    }
}
