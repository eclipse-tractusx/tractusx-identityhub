/*
 *  Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Apache License, Version 2.0 which is available at
 *  https://www.apache.org/licenses/LICENSE-2.0.
 *
 *  SPDX-License-Identifier: Apache-2.0
 */

package org.eclipse.tractusx.identityhub.api.ownership;

import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.DynamicFeature;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.FeatureContext;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ReaderInterceptor;
import jakarta.ws.rs.ext.ReaderInterceptorContext;
import org.eclipse.edc.api.auth.spi.AuthorizationService;
import org.eclipse.edc.identityhub.api.verifiablecredentials.v1.unstable.VerifiableCredentialsApiController;
import org.eclipse.edc.identityhub.api.verifiablecredentials.v1.unstable.model.HolderCredentialRequestDto;
import org.eclipse.edc.identityhub.spi.credential.request.model.HolderCredentialRequest;
import org.eclipse.edc.identityhub.spi.participantcontext.model.IdentityHubParticipantContext;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.CredentialRequestManager;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.model.VerifiableCredentialManifest;
import org.eclipse.edc.web.spi.exception.InvalidRequestException;
import org.eclipse.edc.web.spi.exception.ObjectNotFoundException;

import java.io.IOException;

import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static org.eclipse.edc.identityhub.spi.authorization.AuthorizationResultHandler.exceptionMapper;

/**
 * Binds credential manifests and holder request lookups to the authorized path participant.
 * Uses Jakarta REST method-bound providers without replacing upstream controllers or JSON readers.
 */
public class CredentialOwnershipFeature implements DynamicFeature {
    private final AuthorizationService authorizationService;
    private final CredentialRequestManager credentialRequestManager;

    public CredentialOwnershipFeature(AuthorizationService authorizationService, CredentialRequestManager credentialRequestManager) {
        this.authorizationService = authorizationService;
        this.credentialRequestManager = credentialRequestManager;
    }

    @Override
    public void configure(ResourceInfo resourceInfo, FeatureContext context) {
        if (resourceInfo.getResourceClass() == VerifiableCredentialsApiController.class) {
            switch (resourceInfo.getResourceMethod().getName()) {
                case "addCredential", "updateCredential" -> context.register(new ManifestBindingInterceptor(), Priorities.ENTITY_CODER);
                case "getCredentialRequest" -> context.register(new RequestOwnershipFilter(authorizationService, credentialRequestManager), Priorities.AUTHORIZATION + 100);
                default -> { }
            }
        }
    }

    public static class ManifestBindingInterceptor implements ContainerRequestFilter, ReaderInterceptor {
        private static final String PARTICIPANT_PROPERTY = ManifestBindingInterceptor.class.getName() + ".participant";

        @Override
        public void filter(ContainerRequestContext request) {
            // Keep the decoded ID in request properties, never mutable provider state.
            request.setProperty(PARTICIPANT_PROPERTY, request.getUriInfo().getPathParameters().getFirst("participantContextId"));
        }

        @Override
        public Object aroundReadFrom(ReaderInterceptorContext context) throws IOException {
            var entity = context.proceed();
            var participantId = context.getProperty(PARTICIPANT_PROPERTY);
            if (!(entity instanceof VerifiableCredentialManifest manifest) || participantId == null || !participantId.equals(manifest.getParticipantContextId())) {
                throw new InvalidRequestException("Credential participantContextId must match the request path");
            }
            return entity;
        }
    }

    public static class RequestOwnershipFilter implements ContainerRequestFilter {
        private final AuthorizationService authorizationService;
        private final CredentialRequestManager credentialRequestManager;

        public RequestOwnershipFilter(AuthorizationService authorizationService, CredentialRequestManager credentialRequestManager) {
            this.authorizationService = authorizationService;
            this.credentialRequestManager = credentialRequestManager;
        }

        @Override
        public void filter(ContainerRequestContext request) {
            var parameters = request.getUriInfo().getPathParameters();
            var participantId = parameters.getFirst("participantContextId");
            var holderPid = parameters.getFirst("holderPid");
            authorizationService.authorize(request.getSecurityContext(), participantId, participantId, IdentityHubParticipantContext.class)
                    .orElseThrow(exceptionMapper(IdentityHubParticipantContext.class, participantId));
            var credentialRequest = credentialRequestManager.findById(holderPid);
            if (credentialRequest == null || !participantId.equals(credentialRequest.getParticipantContextId())) {
                throw new ObjectNotFoundException(HolderCredentialRequest.class, holderPid);
            }
            // Return the authorized snapshot; a second store lookup could return different data.
            var response = new HolderCredentialRequestDto(credentialRequest.getIssuerDid(), credentialRequest.getHolderPid(),
                    credentialRequest.getIssuerPid(), credentialRequest.stateAsString(), credentialRequest.getIdsAndFormats());
            request.abortWith(Response.ok(response, APPLICATION_JSON).build());
        }
    }
}
