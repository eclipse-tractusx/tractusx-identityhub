/*
 *   Copyright (c) 2025 Cofinity-X
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

package org.eclipse.edc.identityhub.demo;

import org.eclipse.edc.identityhub.spi.transformation.ScopeToCriterionTransformer;
import org.eclipse.edc.runtime.metamodel.annotation.Extension;
import org.eclipse.edc.runtime.metamodel.annotation.Provider;
import org.eclipse.edc.runtime.metamodel.annotation.Setting;
import org.eclipse.edc.spi.EdcException;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;


@Extension("DCP Demo: Core Extension for IdentityHub")
public class IdentityHubExtension implements ServiceExtension {

    @Setting(
            key = "tx.identityhub.scope.aliases",
            value = "Comma-separated list of accepted credential scope aliases for presentation queries.",
            defaultValue = TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL
    )
    public static final String TX_SCOPE_ALIASES = "tx.identityhub.scope.aliases";

    private Set<String> allowedScopeAliases = Set.of(TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL);

    @Override
    public void initialize(ServiceExtensionContext context) {
        var configuredAliases = context.getSetting(TX_SCOPE_ALIASES, TxScopeToCriterionTransformer.DEFAULT_ALIAS_LITERAL);
        allowedScopeAliases = parseAliases(configuredAliases);
    }

    @Provider
    public ScopeToCriterionTransformer createScopeTransformer() {
        return new TxScopeToCriterionTransformer(allowedScopeAliases);
    }

    static Set<String> parseAliases(String configuredAliases) {
        var aliases = Arrays.stream(Objects.requireNonNullElse(configuredAliases, "").split(","))
                .map(String::trim)
                .filter(alias -> !alias.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (aliases.isEmpty()) {
            throw new EdcException("At least one scope alias must be configured for " + TX_SCOPE_ALIASES);
        }

        return Collections.unmodifiableSet(aliases);
    }

}
