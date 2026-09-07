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

import org.eclipse.edc.api.auth.spi.AuthorizationService;
import org.eclipse.edc.identityhub.spi.verifiablecredentials.CredentialRequestManager;
import org.eclipse.edc.identityhub.spi.webcontext.IdentityHubApiContext;
import org.eclipse.edc.runtime.metamodel.annotation.Extension;
import org.eclipse.edc.runtime.metamodel.annotation.Inject;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.eclipse.edc.web.spi.WebService;

@Extension(CredentialApiOwnershipExtension.NAME)
public class CredentialApiOwnershipExtension implements ServiceExtension {
    public static final String NAME = "Tractus-X Credential API Ownership";

    @Inject
    private WebService webService;
    @Inject
    private AuthorizationService authorizationService;
    @Inject
    private CredentialRequestManager credentialRequestManager;

    @Override
    public void initialize(ServiceExtensionContext context) {
        webService.registerResource(IdentityHubApiContext.IDENTITY, new CredentialOwnershipFeature(authorizationService, credentialRequestManager));
    }
}
