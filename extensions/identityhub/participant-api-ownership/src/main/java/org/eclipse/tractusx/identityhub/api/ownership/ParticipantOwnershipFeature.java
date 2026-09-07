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
import org.eclipse.edc.api.auth.spi.AuthorizationService;
import org.eclipse.edc.identityhub.api.verifiablecredential.v1.unstable.ParticipantContextApiController;
import org.eclipse.edc.identityhub.spi.participantcontext.model.IdentityHubParticipantContext;

import static org.eclipse.edc.identityhub.spi.authorization.AuthorizationResultHandler.exceptionMapper;

/**
 * Adds resource authorization to the EDC 0.18 participant mutation methods.
 * Bound after the upstream authentication and scope filters, only on the Identity API.
 */
public class ParticipantOwnershipFeature implements DynamicFeature {
    private final AuthorizationService authorizationService;

    public ParticipantOwnershipFeature(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @Override
    public void configure(ResourceInfo resourceInfo, FeatureContext context) {
        if (resourceInfo.getResourceClass() == ParticipantContextApiController.class) {
            var method = resourceInfo.getResourceMethod().getName();
            if ("activateParticipant".equals(method) || "deleteParticipant".equals(method)) {
                context.register(new ParticipantMutationFilter(authorizationService), Priorities.AUTHORIZATION + 100);
            }
        }
    }

    public static class ParticipantMutationFilter implements ContainerRequestFilter {
        private final AuthorizationService authorizationService;

        public ParticipantMutationFilter(AuthorizationService authorizationService) {
            this.authorizationService = authorizationService;
        }

        @Override
        public void filter(ContainerRequestContext request) {
            // JAX-RS returns the decoded path parameter. Do not decode an opaque ID again.
            var participantId = request.getUriInfo().getPathParameters().getFirst("participantContextId");
            authorizationService.authorize(request.getSecurityContext(), participantId, participantId, IdentityHubParticipantContext.class)
                    .orElseThrow(exceptionMapper(IdentityHubParticipantContext.class, participantId));
        }
    }
}
