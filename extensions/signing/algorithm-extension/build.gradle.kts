plugins {
    id("java")
}

group = "org.eclipse.tractusx.ih"
version = "0.1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(libs.edc.junit)
    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.mockito:mockito-core:5.5.0")
    testImplementation("org.mockito:mockito-junit-jupiter:5.5.0")
    implementation(libs.edc.dcp.identityhub.core)
    implementation(libs.edc.ih.spi)
    implementation(libs.edc.lib.keys)
    implementation(libs.edc.issuerservice.issuance)
    implementation(libs.edc.lib.crypto)
    implementation(libs.edc.token.spi)
    implementation(libs.edc.issuerservice.issuance.spi)
    implementation(libs.edc.vc.ldp)
    implementation(libs.edc.identity.trust.spi)
    implementation(libs.edc.jwt.spi)
}

tasks.test {
    useJUnitPlatform()

}