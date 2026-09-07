/*
 *  Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Apache License, Version 2.0 which is available at
 *  https://www.apache.org/licenses/LICENSE-2.0.
 *
 *  SPDX-License-Identifier: Apache-2.0
 */

plugins {
    `java-library`
}

dependencies {
    implementation(libs.edc.ih.api.participant)
    implementation(libs.edc.spi.auth)
    implementation(libs.edc.spi.web)
    implementation(libs.jakarta.rs)

    testImplementation(libs.edc.junit)
    testImplementation(libs.edc.ih.validators.participant)
    testImplementation(testFixtures(libs.edc.core.jersey))
    testImplementation(libs.edc.lib.authorization)
    testImplementation(libs.rest.assured)
}
