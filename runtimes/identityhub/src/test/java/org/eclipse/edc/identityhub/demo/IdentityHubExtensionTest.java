/*
 *   Copyright (c) 2026 Contributors to the Eclipse Foundation
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

package org.eclipse.edc.identityhub.demo;

import org.eclipse.edc.junit.extensions.DependencyInjectionExtension;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.query.Criterion;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(DependencyInjectionExtension.class)
class IdentityHubExtensionTest {

    @Test
    void initialize_usesConfiguredAliases(ServiceExtensionContext context) {
        when(context.getSetting(eq(IdentityHubExtension.TX_SCOPE_ALIASES), eq(TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL)))
                .thenReturn("org.eclipse.tractusx.vc.type, org.dataspacex.vc.type");

        IdentityHubExtension extension = new IdentityHubExtension();
        extension.initialize(context);

        Result<Criterion> result = extension.createScopeTransformer().transform("org.dataspacex.vc.type:MembershipCredential:read");
        assertTrue(result.succeeded());
    }

    @Test
    void initialize_failsWhenAliasesAreBlank(ServiceExtensionContext context) {
        when(context.getSetting(eq(IdentityHubExtension.TX_SCOPE_ALIASES), eq(TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL)))
                .thenReturn(" , ");

        IdentityHubExtension extension = new IdentityHubExtension();

        assertThrows(EdcException.class, () -> extension.initialize(context));
    }
}
