/*
 *   Copyright (c) 2024 Metaform Systems, Inc.
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2026 Technovative Solutions
 *   Copyright (c) 2025 Contributors to the Eclipse Foundation
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

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static org.eclipse.edc.spi.result.Result.failure;
import static org.eclipse.edc.spi.result.Result.success;

/**
 * Implementation of {@link ScopeToCriterionTransformer} similar to the upstream one that maps tx scopes
 * to {@link Criterion} for querying the credentials (Just for testing)
 */
public class TxScopeToCriterionTransformer implements ScopeToCriterionTransformer {

    public static final String TYPE_OPERAND = "verifiableCredential.credential.type";
    public static final String ID_OPERAND = "verifiableCredential.credential.id";
    public static final String DCP_ID_ALIAS_LITERAL = "org.eclipse.dspace.dcp.vc.id";
    public static final String DEFAULT_ALIAS_LITERAL = "org.eclipse.tractusx.vc.type";
    // EDC 0.17.0 replaced the upstream DCP scope alias org.eclipse.edc.vc.type with this one.
    // Accepted by default alongside the Tractus-X alias so external 0.17.0 connectors interoperate.
    public static final String DCP_ALIAS_LITERAL = "org.eclipse.dspace.dcp.vc.type";
    public static final String DEFAULT_ALIASES = DEFAULT_ALIAS_LITERAL + "," + DCP_ALIAS_LITERAL;
    public static final String ALIAS_LITERAL = DEFAULT_ALIAS_LITERAL;
    public static final String CONTAINS_OPERATOR = "contains";
    private static final String SCOPE_SEPARATOR = ":";
    private final Set<String> allowedAliases;
    private final String allowedAliasesDescription;
    private final List<String> allowedOperations = List.of("read", "*", "all");

    public TxScopeToCriterionTransformer() {
        this(Set.of(DEFAULT_ALIAS_LITERAL, DCP_ALIAS_LITERAL));
    }

    public TxScopeToCriterionTransformer(Set<String> allowedAliases) {
        var sanitizedAliases = Objects.requireNonNull(allowedAliases, "allowedAliases").stream()
                .map(String::trim)
                .filter(alias -> !alias.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (sanitizedAliases.isEmpty()) {
            throw new IllegalArgumentException("allowedAliases cannot be empty");
        }

        this.allowedAliases = Collections.unmodifiableSet(sanitizedAliases);
        allowedAliasesDescription = String.join(", ", sanitizedAliases);
    }

    @Override
    public Result<List<Criterion>> transformScope(String scope) {
        var idScopePrefix = DCP_ID_ALIAS_LITERAL + SCOPE_SEPARATOR;
        if (scope != null && scope.regionMatches(true, 0, idScopePrefix, 0, idScopePrefix.length())) {
            // ID scopes have no operation suffix; keep URNs and URLs intact.
            var credentialId = scope.substring(idScopePrefix.length());
            if (credentialId.isBlank()) {
                return failure("Scope string cannot be converted: credential ID was blank");
            }
            return success(List.of(new Criterion(ID_OPERAND, "=", credentialId)));
        }

        var tokens = tokenize(scope);
        if (tokens.failed()) {
            return failure("Scope string cannot be converted: %s".formatted(tokens.getFailureDetail()));
        }
        var credentialType = tokens.getContent()[1];
        return success(List.of(new Criterion(TYPE_OPERAND, CONTAINS_OPERATOR, credentialType)));
    }

    protected Result<String[]> tokenize(String scope) {
        if (scope == null) return failure("Scope was null");

        var tokens = scope.split(SCOPE_SEPARATOR);
        if (tokens.length != 3) {
            return failure("Scope string has invalid format.");
        }
        if (allowedAliases.stream().noneMatch(alias -> alias.equalsIgnoreCase(tokens[0]))) {
            return failure("Scope alias MUST be one of %s but was %s".formatted(allowedAliasesDescription, tokens[0]));
        }
        if (!allowedOperations.contains(tokens[2])) {
            return failure("Invalid scope operation: " + tokens[2]);
        }

        return success(tokens);
    }
}
