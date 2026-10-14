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

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SwaggerUiControllerTest {

    private final OpenApiSpecProvider specProvider = new OpenApiSpecProvider("/test-openapi.yaml");

    @Test
    void openapi_servesTheBundledSpec() {
        var controller = new SwaggerUiController(specProvider, "Tractus-X API Documentation");

        assertThat(controller.openapi()).contains("title: Test Spec");
    }

    @Test
    void index_rendersConfiguredTitle_andLoadsSpecRelativeToThePage() {
        var controller = new SwaggerUiController(specProvider, "IssuerService API");

        assertThat(controller.index())
                .contains("<title>IssuerService API</title>")
                .doesNotContain("Tractus-X IdentityHub API")
                .contains("base + '/openapi.yaml'");
    }

    @Test
    void index_escapesTitle_soConfigurationCannotInjectMarkup() {
        var controller = new SwaggerUiController(specProvider, "<script>alert(1)</script>");

        assertThat(controller.index())
                .doesNotContain("<script>alert(1)</script>")
                .contains("&lt;script&gt;alert(1)&lt;/script&gt;");
    }
}
