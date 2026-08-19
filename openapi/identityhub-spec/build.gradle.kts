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

plugins {
    `java-library`
    id("io.swagger.core.v3.swagger-gradle-plugin")
}

dependencies {
    // External EDC API classes to scan (no project deps on purpose).
    implementation(libs.bom.ih)
}

tasks.withType<io.swagger.v3.plugins.gradle.tasks.ResolveTask> {
    outputFileName = "openapi"
    outputFormat = io.swagger.v3.plugins.gradle.tasks.ResolveTask.Format.YAML
    prettyPrint = true
    encoding = "UTF-8"
    resourcePackages = setOf("org.eclipse.edc")
    openApiFile = file("src/main/resources/base-openapi.yaml")
    outputDir = layout.buildDirectory.dir("generated/swagger").get().asFile
    doLast {
        delete(layout.buildDirectory.file("generated/swagger/openapi.json"))
    }
}

tasks.named("openapi") {
    enabled = false
}

tasks.register<Copy>("copyGeneratedSpecToDocs") {
    dependsOn("resolve")
    from(layout.buildDirectory.dir("generated/swagger")) {
        include("openapi.yaml")
    }
    into(rootProject.layout.projectDirectory.dir("docs/api"))
    rename("openapi.yaml", "identityhub-openAPI.yaml")
}
