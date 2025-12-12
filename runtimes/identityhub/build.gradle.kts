/*
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2025 LKS NEXT
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
    id("application")
    alias(libs.plugins.shadow)
}

dependencies {

    // used for the runtime
    runtimeOnly(libs.bom.ih)
    runtimeOnly(libs.bom.ih.sql)
    runtimeOnly(libs.edc.vault.hashicorp)
    runtimeOnly(project(":extensions:store:sql:migrations"))
    runtimeOnly(project(":extensions:seed:super-user"))
    runtimeOnly(project(":extensions:monitor:colored-jdk-monitor"))
    runtimeOnly(project(":extensions:signing:algorithm-extension"))

    // used for custom extensions
    implementation(libs.edc.core.connector)
    implementation(libs.edc.jdk.monitor)
    implementation(libs.edc.ih.spi)

    testImplementation(libs.edc.lib.crypto)
    testImplementation(libs.edc.lib.keys)
    testImplementation(libs.edc.junit)
}

tasks.withType<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar> {
    mergeServiceFiles()
    archiveFileName.set("${project.name}.jar")
}

application {
    mainClass.set("org.eclipse.edc.boot.system.runtime.BaseRuntime")
}
