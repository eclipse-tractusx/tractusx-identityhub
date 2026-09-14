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
import org.eclipse.edc.identityhub.api.verifiablecredential.validation.VerifiableCredentialManifestValidator;
import org.eclipse.edc.identityhub.api.verifiablecredentials.v1.unstable.VerifiableCredentialsApiController;
import org.eclipse.edc.identityhub.spi.credential.request.model.HolderCredentialRequest;
import org.eclipse.edc.identityhub.spi.transformation.DiscriminatorMappingRegistry;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.CredentialRequestManager;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.model.VerifiableCredentialResource;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.store.CredentialStore;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.result.ServiceResult;
import org.eclipse.edc.spi.result.StoreResult;
import org.eclipse.edc.transform.spi.TypeTransformerRegistry;
import org.eclipse.edc.validator.spi.ValidationResult;
import org.eclipse.edc.web.jersey.testfixtures.RestControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CredentialOwnershipApiTest extends RestControllerTestBase {
    private final CredentialStore credentials = mock();
    private final AuthorizationService authorizationService = mock();
    private final VerifiableCredentialManifestValidator validator = mock();
    private final TypeTransformerRegistry transformers = mock();
    private final CredentialRequestManager requests = mock();

    @BeforeEach
    void setup() {
        authorizeByOwner();
        when(validator.validate(any())).thenReturn(ValidationResult.success());
        when(transformers.transform(any(), eq(VerifiableCredentialResource.class)))
                .thenReturn(Result.success(mock(VerifiableCredentialResource.class)));
        when(credentials.create(any())).thenReturn(StoreResult.success());
        when(credentials.update(any())).thenReturn(StoreResult.success());
    }

    @Override
    protected Object controller() {
        return new VerifiableCredentialsApiController(credentials, authorizationService, validator, transformers, requests, mock(DiscriminatorMappingRegistry.class));
    }

    @Override
    protected Object additionalResource() {
        return new TestFeature(authentication(), new CredentialOwnershipFeature(authorizationService, requests));
    }

    @ParameterizedTest
    @CsvSource({"POST,A,B", "POST,B,A", "PUT,A,B", "PUT,B,A", "POST,admin,B", "PUT,admin,B"})
    void rejectMismatchedManifestBeforeWrites(String method, String caller, String manifestOwner) {
        var pathOwner = "admin".equals(caller) ? "A" : caller;
        request(caller, scope(caller)).body(Map.of("id", "credential", "participantContextId", manifestOwner))
                .request(method, "/" + pathOwner + "/credentials").then().statusCode(400);
        verifyNoInteractions(transformers, credentials, requests);
    }

    @ParameterizedTest
    @CsvSource({"POST,A", "POST,B", "PUT,A", "PUT,B"})
    void preserveMatchingManifest(String method, String owner) {
        request(owner, scope(owner)).body(Map.of("id", "credential", "participantContextId", owner))
                .request(method, "/" + owner + "/credentials").then().statusCode(204);
        if ("POST".equals(method)) {
            verify(credentials).create(any());
        } else {
            verify(credentials).update(any());
        }
    }

    @ParameterizedTest
    @CsvSource({"POST", "PUT"})
    void rejectMissingManifestParticipant(String method) {
        request("A", scope("A")).body(Map.of("id", "credential"))
                .request(method, "/A/credentials").then().statusCode(400);
        verifyNoInteractions(transformers, credentials);
    }

    @ParameterizedTest
    @CsvSource({"POST", "PUT"})
    void preserveScopeChecksBeforeReadingManifest(String method) {
        request("A", "identity-api:credentials:read").body(Map.of("id", "credential", "participantContextId", "A"))
                .request(method, "/A/credentials").then().statusCode(403);
        verifyNoInteractions(authorizationService, transformers, credentials);
    }

    @ParameterizedTest
    @CsvSource({"A,B", "B,A", "admin,B"})
    void hideOtherParticipantsRequest(String caller, String actualOwner) {
        var credentialRequest = holderRequest(actualOwner);
        when(requests.findById("request-id")).thenReturn(credentialRequest);
        var pathOwner = "admin".equals(caller) ? "A" : caller;
        request(caller, scope(caller)).get("/" + pathOwner + "/credentials/request/request-id")
                .then().statusCode(404);
    }

    @Test
    void hideMissingRequest() {
        request("A", scope("A")).get("/A/credentials/request/missing").then().statusCode(404);
    }

    @Test
    void authorizePathBeforeLookingUpRequest() {
        request("A", scope("A")).get("/B/credentials/request/request-id").then().statusCode(403);
        verifyNoInteractions(requests);
    }

    @Test
    void returnOwnersRequest() {
        var credentialRequest = holderRequest("A");
        when(requests.findById("request-id")).thenReturn(credentialRequest);
        request("A", scope("A")).get("/A/credentials/request/request-id").then().statusCode(200)
                .body("holderPid", equalTo("request-id"));
    }

    @Test
    void returnCheckedSnapshotWithoutSecondLookup() {
        var ownRequest = holderRequest("A");
        var otherRequest = holderRequest("B");
        when(otherRequest.getIssuerDid()).thenReturn("did:web:other-issuer.example");
        when(requests.findById("request-id")).thenReturn(ownRequest, otherRequest);
        request("A", scope("A")).get("/A/credentials/request/request-id").then().statusCode(200)
                .body("issuerDid", equalTo("did:web:issuer.example"));
        verify(requests, times(1)).findById("request-id");
    }

    @Test
    void preserveCredentialCollection() {
        when(credentials.query(any())).thenReturn(StoreResult.success(List.of()));
        request("A", scope("A")).get("/A/credentials").then().statusCode(200);
        verifyNoInteractions(requests);
        verify(credentials).query(any());
    }

    @Test
    void rejectMalformedJsonWithoutWrites() {
        request("A", scope("A")).body("{").post("/A/credentials").then().statusCode(400);
        verifyNoInteractions(transformers, credentials);
    }

    @Test
    void requireAuthentication() {
        given().baseUri(baseUri()).get("/A/credentials/request/request-id").then().statusCode(401);
        verifyNoInteractions(authorizationService, requests);
    }

    private HolderCredentialRequest holderRequest(String owner) {
        var result = mock(HolderCredentialRequest.class);
        when(result.getParticipantContextId()).thenReturn(owner);
        when(result.getHolderPid()).thenReturn("request-id");
        when(result.getIssuerDid()).thenReturn("did:web:issuer.example");
        when(result.stateAsString()).thenReturn("ISSUED");
        when(result.getIdsAndFormats()).thenReturn(List.of());
        return result;
    }

    private String scope(String caller) {
        return "admin".equals(caller) ? "identity-api:admin" : "identity-api:credentials:write";
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
