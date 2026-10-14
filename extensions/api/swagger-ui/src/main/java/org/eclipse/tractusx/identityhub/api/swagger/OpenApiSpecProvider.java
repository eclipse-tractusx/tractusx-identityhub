/*
 *   Copyright (c) 2026 Technovative Solutions
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

package org.eclipse.tractusx.identityhub.api.swagger;

import org.eclipse.edc.spi.EdcException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Supplies the OpenAPI specification that is generated at build time (by the
 * {@code openapi:*-spec} modules) and bundled on the classpath as
 * {@code /openapi.yaml}.
 * <p>
 * The spec is read eagerly when this provider is constructed, so a runtime that
 * was built without the bundled spec fails on startup rather than serving a 500
 * the first time somebody opens the Swagger UI page.
 */
public final class OpenApiSpecProvider {

    private static final String SPEC_RESOURCE = "/openapi.yaml";

    private final String yaml;

    public OpenApiSpecProvider() {
        this(SPEC_RESOURCE);
    }

    OpenApiSpecProvider(String specResource) {
        this.yaml = read(specResource);
    }

    public String asYaml() {
        return yaml;
    }

    private static String read(String specResource) {
        try (var is = OpenApiSpecProvider.class.getResourceAsStream(specResource)) {
            if (is == null) {
                throw new EdcException(("Bundled OpenAPI spec not found on classpath: %s. Ensure the runtime's " +
                        "build bundles the generated spec from the openapi:*-spec module.").formatted(specResource));
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new EdcException("Failed to read bundled OpenAPI spec: " + specResource, e);
        }
    }
}
