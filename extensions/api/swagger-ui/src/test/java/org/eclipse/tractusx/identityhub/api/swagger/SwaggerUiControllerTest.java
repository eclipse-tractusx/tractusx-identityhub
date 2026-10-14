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

import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SwaggerUiControllerTest {

    private final OpenApiSpecProvider specProvider = new OpenApiSpecProvider("/openapi/specs.index");

    @Test
    void spec_servesTheDocumentForEachContext() {
        var controller = new SwaggerUiController(specProvider, "Tractus-X API Documentation");

        assertThat(controller.spec("identity")).contains("Test Identity API");
        assertThat(controller.spec("credentials")).contains("Test Credentials API");
    }

    @Test
    void spec_is404_forAnythingNotInTheIndex() {
        var controller = new SwaggerUiController(specProvider, "Tractus-X API Documentation");

        // Also covers the traversal case: only indexed ids resolve.
        assertThatThrownBy(() -> controller.spec("../../application")).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> controller.spec("unknown")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void index_listsEveryContext_soTheSelectorOffersThemAll() {
        var controller = new SwaggerUiController(specProvider, "IssuerService API");

        assertThat(controller.index())
                .contains("<title>IssuerService API</title>")
                .contains("\"id\":\"identity\"")
                .contains("\"id\":\"credentials\"")
                // the server is shown in the selector, so the reader can tell the contexts apart
                .contains("http://localhost:15151/api/identity")
                .contains("base + '/specs/' + s.id")
                // Without the standalone preset SwaggerUIBundle ignores `urls` and the page is blank.
                .contains("swagger-ui-standalone-preset.js")
                .contains("SwaggerUIStandalonePreset")
                .contains("layout: 'StandaloneLayout'");
    }

    @Test
    void index_escapesTitle_soConfigurationCannotInjectMarkup() {
        var controller = new SwaggerUiController(specProvider, "<script>alert(1)</script>");

        assertThat(controller.index())
                .doesNotContain("<script>alert(1)</script>")
                .contains("&lt;script&gt;alert(1)&lt;/script&gt;");
    }
}
