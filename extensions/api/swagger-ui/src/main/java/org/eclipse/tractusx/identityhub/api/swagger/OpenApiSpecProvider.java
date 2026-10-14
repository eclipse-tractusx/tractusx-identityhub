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
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Supplies the OpenAPI specifications generated at build time by the {@code openapi:*-spec} modules
 * and bundled on the classpath under {@code /openapi}.
 * <p>
 * There is one specification per web context rather than one per runtime. Each context is served on
 * its own port and base path, and OpenAPI attaches {@code servers} to the document, so a single
 * merged document would send every Swagger UI request to whichever origin happens to serve the
 * page.
 * <p>
 * Everything is read eagerly on construction, so a runtime built without its specs fails on startup
 * rather than serving a 500 the first time somebody opens the page.
 */
public final class OpenApiSpecProvider {

    private static final String INDEX_RESOURCE = "/openapi/specs.index";
    private static final String SPEC_RESOURCE_TEMPLATE = "/openapi/%s.yaml";

    private final List<ApiSpec> specs;
    private final Map<String, String> yamlById;

    public OpenApiSpecProvider() {
        this(INDEX_RESOURCE);
    }

    OpenApiSpecProvider(String indexResource) {
        this.specs = List.copyOf(readIndex(indexResource));
        var contents = new LinkedHashMap<String, String>();
        for (var spec : specs) {
            contents.put(spec.id(), read(SPEC_RESOURCE_TEMPLATE.formatted(spec.id())));
        }
        this.yamlById = Map.copyOf(contents);
    }

    /**
     * The specifications this runtime serves, in the order the Swagger UI selector should list them.
     */
    public List<ApiSpec> specs() {
        return specs;
    }

    /**
     * The YAML document for the given context id, or {@code null} when no such context is bundled.
     */
    public String yaml(String id) {
        return yamlById.get(id);
    }

    private static List<ApiSpec> readIndex(String indexResource) {
        var index = read(indexResource);
        var result = new ArrayList<ApiSpec>();
        for (var line : index.split("\n")) {
            var trimmed = line.strip();
            if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                continue;
            }
            var parts = trimmed.split("\\|");
            if (parts.length != 3) {
                throw new EdcException(("Malformed entry in bundled OpenAPI spec index %s: '%s'. " +
                        "Expected 'id|title|server'.").formatted(indexResource, trimmed));
            }
            result.add(new ApiSpec(parts[0], parts[1], parts[2]));
        }
        if (result.isEmpty()) {
            throw new EdcException("Bundled OpenAPI spec index is empty: " + indexResource);
        }
        return result;
    }

    private static String read(String resource) {
        try (InputStream is = OpenApiSpecProvider.class.getResourceAsStream(resource)) {
            if (is == null) {
                throw new EdcException(("Bundled OpenAPI resource not found on classpath: %s. Ensure the " +
                        "runtime's build bundles the generated specs from the openapi:*-spec module.")
                        .formatted(resource));
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new EdcException("Failed to read bundled OpenAPI resource: " + resource, e);
        }
    }

    /**
     * One generated specification: the web context it describes, a display name for the Swagger UI
     * selector, and the server that context is reachable on.
     */
    public record ApiSpec(String id, String title, String server) {
    }
}
