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
import org.eclipse.tractusx.identityhub.api.swagger.OpenApiSpecProvider.ApiSpec;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenApiSpecProviderTest {

    private static final String TEST_INDEX = "/openapi/specs.index";

    @Test
    void specs_areReadInIndexOrder_withTitleAndServer() {
        var provider = new OpenApiSpecProvider(TEST_INDEX);

        assertThat(provider.specs())
                .extracting(ApiSpec::id, ApiSpec::title, ApiSpec::server)
                .containsExactly(
                        tuple3("identity", "Test Identity API", "http://localhost:15151/api/identity"),
                        tuple3("credentials", "Test Credentials API", "http://localhost:13131/api/credentials"));
    }

    @Test
    void yaml_returnsTheDocumentForEachContext() {
        var provider = new OpenApiSpecProvider(TEST_INDEX);

        assertThat(provider.yaml("identity")).contains("Test Identity API").contains(":15151");
        assertThat(provider.yaml("credentials")).contains("Test Credentials API").contains(":13131");
    }

    @Test
    void yaml_returnsNull_forAnUnknownContext() {
        assertThat(new OpenApiSpecProvider(TEST_INDEX).yaml("nope")).isNull();
    }

    @Test
    void constructor_failsFast_whenTheIndexIsMissing() {
        assertThatThrownBy(() -> new OpenApiSpecProvider("/openapi/no-such.index"))
                .isInstanceOf(EdcException.class)
                .hasMessageContaining("Bundled OpenAPI resource not found")
                .hasMessageContaining("/openapi/no-such.index");
    }

    @Test
    void constructor_failsFast_whenAnIndexedSpecIsMissing() {
        assertThatThrownBy(() -> new OpenApiSpecProvider("/malformed/missing-spec.index"))
                .isInstanceOf(EdcException.class)
                .hasMessageContaining("Bundled OpenAPI resource not found")
                .hasMessageContaining("/openapi/absent.yaml");
    }

    @Test
    void constructor_failsFast_whenAnIndexEntryIsMalformed() {
        assertThatThrownBy(() -> new OpenApiSpecProvider("/malformed/bad-entry.index"))
                .isInstanceOf(EdcException.class)
                .hasMessageContaining("Malformed entry");
    }

    private static org.assertj.core.groups.Tuple tuple3(String a, String b, String c) {
        return org.assertj.core.groups.Tuple.tuple(a, b, c);
    }
}
