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

import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.stream.Collectors;

@Path("/swagger")
public class SwaggerUiController {

    /**
     * {@code %1$s} is the page title, {@code %2$s} the specification list.
     * <p>
     * The specs are listed by id and resolved against the page's own path in the browser, so the
     * page keeps working whatever base path the web context is configured with.
     */
    private static final String INDEX_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <title>%1$s</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
                <style>
                    /*
                        The topbar carries the definition selector, and each definition covers one
                        web context only. Left to scroll away it reads as "the other endpoints are
                        missing", so it is pinned.
                    */
                    .swagger-ui .topbar { position: sticky; top: 0; z-index: 10; }
                </style>
            </head>
            <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
                <!--
                    The definition selector is rendered by the standalone preset's topbar. Without
                    it, SwaggerUIBundle ignores `urls` entirely and the page renders
                    "No API definition provided."
                -->
                <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
                <script>
                    window.onload = function () {
                        var base = window.location.pathname.replace(/\\/+$/, '');
                        var specs = %2$s;
                        window.ui = SwaggerUIBundle({
                            urls: specs.map(function (s) {
                                return { url: base + '/specs/' + s.id, name: s.name };
                            }),
                            dom_id: '#swagger-ui',
                            deepLinking: true,
                            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                            layout: 'StandaloneLayout'
                        });
                    };
                </script>
            </body>
            </html>
            """;

    private final OpenApiSpecProvider specProvider;
    private final String indexHtml;

    public SwaggerUiController(OpenApiSpecProvider specProvider, String pageTitle) {
        this.specProvider = specProvider;
        this.indexHtml = INDEX_HTML_TEMPLATE.formatted(escapeHtml(pageTitle), specListJson(specProvider));
    }

    @GET
    @Produces(MediaType.TEXT_HTML)
    public String index() {
        return indexHtml;
    }

    /**
     * Serves one generated specification. Only ids present in the bundled index resolve, so the
     * path parameter cannot be used to reach other classpath resources.
     */
    @GET
    @Path("/specs/{id}")
    @Produces("application/yaml")
    public String spec(@PathParam("id") String id) {
        var yaml = specProvider.yaml(id);
        if (yaml == null) {
            throw new NotFoundException("No OpenAPI specification with id '%s'".formatted(id));
        }
        return yaml;
    }

    private static String specListJson(OpenApiSpecProvider provider) {
        return provider.specs().stream()
                .map(spec -> "{\"id\":\"%s\",\"name\":\"%s\"}"
                        .formatted(escapeJson(spec.id()), escapeJson(spec.title() + " (" + spec.server() + ")")))
                .collect(Collectors.joining(",", "[", "]"));
    }

    /**
     * The page title comes from configuration, so it is escaped before being interpolated into the
     * document.
     */
    private static String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    /**
     * Spec titles come from the build, but they are interpolated into a script block, so they are
     * escaped for both JSON and for an early {@code </script>}.
     */
    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("<", "\\u003c")
                .replace(">", "\\u003e");
    }
}
