/*
 *   Copyright (c) 2026 Technovative Solutions
 *   Copyright (c) 2026 Contributors to the Eclipse Foundation
 *   Copyright (c) 2026 VDBP
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

import org.eclipse.edc.identityhub.spi.transformation.ScopeToCriterionTransformer;
import org.eclipse.edc.spi.query.Criterion;
import org.eclipse.edc.spi.result.Result;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TxScopeToCriterionTransformerTest {

    @Test
    void transform_acceptsConfiguredAlias() {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer(Set.of("org.eclipse.tractusx.vc.type", "org.dataspacex.vc.type"));

        Result<List<Criterion>> result = transformer.transformScope("org.dataspacex.vc.type:MembershipCredential:read");

        assertTrue(result.succeeded());
        assertNotNull(result.getContent());
        assertEquals(1, result.getContent().size());
        var criterion = result.getContent().get(0);
        assertEquals(TxScopeToCriterionTransformer.TYPE_OPERAND, criterion.getOperandLeft());
        assertEquals(TxScopeToCriterionTransformer.CONTAINS_OPERATOR, criterion.getOperator());
        assertEquals("MembershipCredential", criterion.getOperandRight());
    }

    @ParameterizedTest
    @CsvSource({
            "org.eclipse.tractusx.vc.type,read",
            "org.eclipse.tractusx.vc.type,all",
            "org.eclipse.tractusx.vc.type,*",
            "org.eclipse.dspace.dcp.vc.type,read",
            "org.eclipse.dspace.dcp.vc.type,all",
            "org.eclipse.dspace.dcp.vc.type,*"
    })
    void transform_acceptsBothDefaultAliases(String alias, String operation) {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer();

        var result = transformer.transformScope(alias + ":MembershipCredential:" + operation);

        assertTrue(result.succeeded());
        assertEquals(List.of(new Criterion("verifiableCredential.credential.type", "contains", "MembershipCredential")), result.getContent());
    }

    @ParameterizedTest
    @ValueSource(strings = {"credential-1", "urn:uuid:credential-1", "https://issuer.example/credentials/1", "urn:credential:read", "*"})
    void transform_acceptsCredentialId(String credentialId) {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer();

        var result = transformer.transformScope("org.eclipse.dspace.dcp.vc.id:" + credentialId);

        assertTrue(result.succeeded());
        assertEquals(List.of(new Criterion("verifiableCredential.credential.id", "=", credentialId)), result.getContent());
    }

    @Test
    void transform_acceptsCredentialIdWithConfiguredTypeAliases() {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer(Set.of("org.dataspacex.vc.type"));

        var result = transformer.transformScope("ORG.ECLIPSE.DSPACE.DCP.VC.ID:urn:Credential:MixedCase");

        assertTrue(result.succeeded());
        assertEquals(List.of(new Criterion("verifiableCredential.credential.id", "=", "urn:Credential:MixedCase")), result.getContent());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "\t"})
    void transform_rejectsBlankCredentialId(String credentialId) {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer();

        assertTrue(transformer.transformScope("org.eclipse.dspace.dcp.vc.id:" + credentialId).failed());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "org.eclipse.dspace.dcp.vc.id",
            "org.eclipse.dspace.dcp.vc.ids:credential-1",
            "org.eclipse.dspace.dcp.vc.type:MembershipCredential:write"
    })
    void transform_rejectsInvalidScope(String scope) {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer();

        assertTrue(transformer.transformScope(scope).failed());
    }

    @Test
    void transform_rejectsUnsupportedAlias() {
        ScopeToCriterionTransformer transformer = new TxScopeToCriterionTransformer();

        Result<List<Criterion>> result = transformer.transformScope("org.dataspacex.vc.type:MembershipCredential:read");

        assertTrue(result.failed());
        assertTrue(result.getFailureDetail().contains(TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL));
    }
}
