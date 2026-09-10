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

import io.restassured.specification.RequestSpecification;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.DynamicFeature;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.FeatureContext;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.edc.api.auth.spi.AuthorizationService;
import org.eclipse.edc.api.auth.spi.ParticipantPrincipal;
import org.eclipse.edc.api.authorization.filter.ScopeBasedAccessFeature;
import org.eclipse.edc.identityhub.api.verifiablecredential.v1.unstable.ParticipantContextApiController;
import org.eclipse.edc.identityhub.api.verifiablecredential.validation.ParticipantManifestValidator;
import org.eclipse.edc.identityhub.spi.participantcontext.IdentityHubParticipantContextService;
import org.eclipse.edc.identityhub.spi.participantcontext.model.IdentityHubParticipantContext;
import org.eclipse.edc.spi.result.ServiceResult;
import org.eclipse.edc.web.jersey.testfixtures.RestControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ParticipantOwnershipApiTest extends RestControllerTestBase {
    private final IdentityHubParticipantContextService participants = mock();
    private final AuthorizationService authorizationService = mock();

    @BeforeEach
    void setup() {
        authorizeByOwner();
        when(participants.updateParticipant(anyString(), any())).thenReturn(ServiceResult.success());
        when(participants.deleteParticipantContext(anyString())).thenReturn(ServiceResult.success());
    }

    @Override
    protected Object controller() {
        return new ParticipantContextApiController(mock(ParticipantManifestValidator.class), participants, authorizationService);
    }

    @Override
    protected Object additionalResource() {
        return new TestFeature(authentication(), new ParticipantOwnershipFeature(authorizationService));
    }

    @ParameterizedTest
    @CsvSource({"POST,A,B", "POST,B,A", "DELETE,A,B", "DELETE,B,A"})
    void rejectOtherParticipantBeforeMutation(String method, String caller, String owner) {
        request(caller, "identity-api:participants:write").request(method, mutationPath(method, owner))
                .then().statusCode(403);
        verifyNoInteractions(participants);
    }

    @ParameterizedTest
    @CsvSource({"POST,A", "POST,B", "DELETE,A", "DELETE,B"})
    void allowOwner(String method, String owner) {
        request(owner, "identity-api:participants:write").request(method, mutationPath(method, owner))
                .then().statusCode(204);
        verify(authorizationService).authorize(any(), eq(owner), eq(owner), eq(IdentityHubParticipantContext.class));
        verifyMutation(method, owner);
    }

    @ParameterizedTest
    @CsvSource({"POST,true", "POST,false", "DELETE,false"})
    void allowAdministrator(String method, boolean active) {
        var path = "POST".equals(method) ? "/B/state?isActive=" + active : "/B";
        request("admin", "identity-api:admin").request(method, path).then().statusCode(204);
        verifyMutation(method, "B");
    }

    @ParameterizedTest
    @CsvSource({"POST", "DELETE"})
    void requireScopeBeforeOwnershipLookup(String method) {
        request("A", "identity-api:participants:read").request(method, mutationPath(method, "A"))
                .then().statusCode(403);
        verifyNoInteractions(authorizationService, participants);
    }

    @Test
    void requireAuthentication() {
        given().baseUri(baseUri()).contentType("application/json").post("/B/state?isActive=false").then().statusCode(401);
        verifyNoInteractions(authorizationService, participants);
    }

    @Test
    void preserveNotFoundAndDoNotMutate() {
        when(authorizationService.authorize(any(), eq("missing"), eq("missing"), any())).thenReturn(ServiceResult.notFound("missing"));
        request("admin", "identity-api:admin").delete("/missing").then().statusCode(404);
        verifyNoInteractions(participants);
    }

    @Test
    void useDecodedOpaqueParticipantId() {
        var owner = "did:web:example.test:tenant";
        request(owner, "identity-api:participants:write").pathParam("owner", owner)
                .post("/{owner}/state?isActive=false").then().statusCode(204);
        verify(authorizationService).authorize(any(), eq(owner), eq(owner), eq(IdentityHubParticipantContext.class));
    }

    @Test
    void preserveAdministratorScopeUpdate() {
        request("admin", "identity-api:admin").body(List.of("identity-api:participants:read"))
                .put("/B/scopes").then().statusCode(204);
        verifyNoInteractions(authorizationService);
        verify(participants).updateParticipant(eq("B"), any());
    }

    private void verifyMutation(String method, String owner) {
        if ("POST".equals(method)) {
            verify(participants).updateParticipant(eq(owner), any());
        } else {
            verify(participants).deleteParticipantContext(owner);
        }
    }

    private String mutationPath(String method, String owner) {
        return "/" + owner + ("POST".equals(method) ? "/state?isActive=false" : "");
    }

    private RequestSpecification request(String caller, String scope) {
        return given().baseUri(baseUri()).contentType("application/json")
                .header("Test-Participant", caller).header("Test-Scope", scope);
    }

    private String baseUri() {
        return "http://localhost:" + port + "/v1beta/participants";
    }

    public static class TestFeature implements DynamicFeature {
        private final ContainerRequestFilter authentication;
        private final DynamicFeature ownership;

        TestFeature(ContainerRequestFilter authentication, DynamicFeature ownership) {
            this.authentication = authentication;
            this.ownership = ownership;
        }

        @Override
        public void configure(ResourceInfo resourceInfo, FeatureContext context) {
            context.register(authentication, Priorities.AUTHENTICATION);
            new ScopeBasedAccessFeature().configure(resourceInfo, context);
            ownership.configure(resourceInfo, context);
        }
    }

    private ContainerRequestFilter authentication() {
        return request -> {
            var caller = request.getHeaderString("Test-Participant");
            if (caller == null) {
                request.abortWith(Response.status(401).build());
                return;
            }
            var securityContext = mock(SecurityContext.class);
            var scope = request.getHeaderString("Test-Scope");
            when(securityContext.getUserPrincipal()).thenReturn(new ParticipantPrincipal(caller, scope));
            request.setSecurityContext(securityContext);
        };
    }

    private void authorizeByOwner() {
        when(authorizationService.authorize(any(), anyString(), anyString(), any())).thenAnswer(call -> {
            var principal = (ParticipantPrincipal) call.getArgument(0, SecurityContext.class).getUserPrincipal();
            return principal.getName().equals(call.getArgument(1)) || "identity-api:admin".equals(principal.scope())
                    ? ServiceResult.success() : ServiceResult.unauthorized("Different participant");
        });
    }
}
