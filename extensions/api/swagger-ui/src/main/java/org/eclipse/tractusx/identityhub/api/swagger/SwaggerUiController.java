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
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/swagger")
public class SwaggerUiController {

    private static final String INDEX_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <title>%s</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
            </head>
            <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
                <script>
                    window.onload = function () {
                        var base = window.location.pathname.replace(/\\/+$/, '');
                        window.ui = SwaggerUIBundle({
                            url: base + '/openapi.yaml',
                            dom_id: '#swagger-ui',
                            deepLinking: true
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
        this.indexHtml = INDEX_HTML_TEMPLATE.formatted(escapeHtml(pageTitle));
    }

    @GET
    @Produces(MediaType.TEXT_HTML)
    public String index() {
        return indexHtml;
    }

    @GET
    @Path("/openapi.yaml")
    @Produces("application/yaml")
    public String openapi() {
        return specProvider.asYaml();
    }

    /**
     * The page title comes from configuration, so it is escaped before being interpolated
     * into the document.
     */
    private static String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
