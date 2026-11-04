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

/*
 * Build-time OpenAPI generation for the IssuerService APIs.
 *
 * One spec per web context, for the reasons given in openapi/README.md. Like the IdentityHub spec
 * module, it depends only on the external BOM (no project deps) so the swagger gradle plugin can
 * resolve its classpath without triggering the cross-project configuration error seen in the
 * runtime modules.
 */

import io.swagger.v3.plugins.gradle.tasks.ResolveTask

plugins {
    `java-library`
    id("io.swagger.core.v3.swagger-gradle-plugin")
}

dependencies {
    implementation(libs.bom.issuer)
}

/**
 * One web context of the runtime.
 *
 * Controllers are named individually rather than by package. The swagger plugin treats
 * `resourceClasses` and `resourcePackages` as alternatives rather than as a union, and package
 * scanning matches subpackages, which would merge contexts. Naming classes is the only form that
 * keeps the contexts apart.
 *
 * The cost is that an upstream rename drops endpoints from a spec. The `docs/api` drift check in
 * `verify.yaml` is what catches that, by failing when the committed specs stop matching.
 */
data class ApiContext(
    val id: String,
    val title: String,
    val description: String,
    val server: String,
    val controllers: Set<String>,
    val auth: String? = null
)

val serviceId = "issuerservice"
val serviceName = "IssuerService"
val specVersion = "1.0.0"

// The statuslist context (:9999/statuslist) is deliberately absent: its only controller,
// StatusListCredentialController, carries no OpenAPI annotations upstream, so it would produce an
// empty document.
val contexts = listOf(
    ApiContext(
        id = "default",
        title = "$serviceName Observability and Version API",
        description = "Health probes and runtime version information, served on the default web context.",
        server = "http://localhost:8181/api",
        controllers = setOf(
            "org.eclipse.edc.api.observability.ObservabilityApiController",
            "org.eclipse.edc.connector.api.management.version.v1.VersionApiController"
        )
    ),
    ApiContext(
        id = "identity",
        title = "$serviceName Identity API",
        description = "Management of participant contexts on the Issuer Service.",
        server = "http://localhost:15151/api/identity",
        controllers = setOf(
            "org.eclipse.edc.identityhub.api.verifiablecredential.v1.unstable.ParticipantContextApiController"
        ),
        auth = "apikey"
    ),
    ApiContext(
        id = "issueradmin",
        title = "$serviceName Admin API",
        description = "Administration of holders, attestations, credential definitions and issuance processes.",
        server = "http://localhost:15152/api/issuer",
        controllers = setOf(
            "org.eclipse.edc.issuerservice.api.admin.credentials.v1.unstable.IssuerAttestationAdminApiController",
            "org.eclipse.edc.issuerservice.api.admin.credentials.v1.unstable.IssuerCredentialsAdminApiController",
            "org.eclipse.edc.issuerservice.api.admin.credentialdefinition.v1.unstable.IssuerCredentialDefinitionAdminApiController",
            "org.eclipse.edc.issuerservice.api.admin.holder.v1.unstable.IssuerHolderAdminApiController",
            "org.eclipse.edc.issuerservice.api.admin.issuance.v1.unstable.IssuanceProcessAdminApiController"
        ),
        auth = "apikey"
    ),
    ApiContext(
        id = "issuance",
        title = "$serviceName Issuance (DCP) API",
        description = "Decentralised Claims Protocol issuance endpoints: credential requests, status and issuer metadata.",
        server = "http://localhost:13132/api/issuance",
        controllers = setOf(
            "org.eclipse.edc.identityhub.protocols.dcp.issuer.api.v1.credentialrequest.CredentialRequestApiController",
            "org.eclipse.edc.identityhub.protocols.dcp.issuer.api.v1.credentialrequeststatus.CredentialRequestStatusApiController",
            "org.eclipse.edc.identityhub.protocols.dcp.issuer.api.v1.issuermetadata.IssuerMetadataApiController"
        ),
        auth = "dcp"
    ),
    ApiContext(
        id = "sts",
        title = "$serviceName Secure Token Service API",
        description = "Self-issued token endpoint of the embedded Secure Token Service.",
        server = "http://localhost:9292/api/sts",
        controllers = setOf(
            "org.eclipse.edc.api.iam.decentralizedclaims.sts.controller.SecureTokenServiceApiController"
        )
    ),
    ApiContext(
        id = "did",
        title = "$serviceName DID Document API",
        description = "Resolution of DID documents published by this Issuer Service.",
        server = "http://localhost:10100/",
        controllers = setOf("org.eclipse.edc.identityhub.publisher.did.local.DidWebController")
    )
)

// ---------------------------------------------------------------------------------------------
// Everything below is mechanical and mirrored in openapi/identityhub-spec/build.gradle.kts.
// ---------------------------------------------------------------------------------------------

val licenceHeader = """
    #################################################################################
    #  Copyright (c) 2026 Technovative Solutions
    #  Copyright (c) 2025 Contributors to the Eclipse Foundation
    #
    #  See the NOTICE file(s) distributed with this work for additional
    #  information regarding copyright ownership.
    #
    #  This program and the accompanying materials are made available under the
    #  terms of the Apache License, Version 2.0 which is available at
    #  https://www.apache.org/licenses/LICENSE-2.0.
    #
    #  Unless required by applicable law or agreed to in writing, software
    #  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    #  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    #  License for the specific language governing permissions and limitations
    #  under the License.
    #
    #  SPDX-License-Identifier: Apache-2.0
    #################################################################################
""".trimIndent()

fun securityBlock(auth: String?): String = when (auth) {
    "apikey" -> """
        security:
        - ApiKey: []
        components:
          securitySchemes:
            ApiKey:
              type: apiKey
              in: header
              name: X-Api-Key
    """.trimIndent()

    // Upstream's DCP controllers already declare an "Authentication" scheme via @SecurityScheme;
    // reference it rather than defining a second, identical one.
    "dcp" -> """
        security:
        - Authentication: []
    """.trimIndent()

    else -> ""
}

/**
 * Upstream `@OpenAPIDefinition` annotations overwrite whatever `info` the base file supplies, so
 * the block is restored after generation. `servers`, `security` and `components.securitySchemes`
 * do survive and are left alone.
 */
fun rewriteInfoBlock(file: File, title: String, description: String, version: String) {
    val lines = file.readLines()
    val out = mutableListOf<String>()
    var i = 0
    var replaced = false
    while (i < lines.size) {
        if (lines[i].trimEnd() == "info:") {
            out += "info:"
            out += "  title: \"$title\""
            out += "  description: \"$description\""
            out += "  version: \"$version\""
            replaced = true
            i++
            while (i < lines.size && (lines[i].isBlank() || lines[i].startsWith("  "))) i++
        } else {
            out += lines[i]
            i++
        }
    }
    require(replaced) { "No 'info:' block found in generated spec ${file.name}" }
    file.writeText(out.joinToString("\n") + "\n")
}

val baseSpecDir: Provider<Directory> = layout.buildDirectory.dir("openapi-base")
val generatedSpecDir: Provider<Directory> = layout.buildDirectory.dir("generated/openapi-specs")
val bundleDir: Provider<Directory> = layout.buildDirectory.dir("openapi-bundle")

val generateBaseSpecs = tasks.register("generateBaseSpecs") {
    description = "Writes the per-context base OpenAPI documents consumed by the swagger plugin."
    val outDir = baseSpecDir
    val header = licenceHeader
    val version = specVersion
    val defs = contexts.map { listOf(it.id, it.title, it.description, it.server, securityBlock(it.auth)) }
    inputs.property("definitions", defs.toString())
    inputs.property("version", version)
    outputs.dir(outDir)
    doLast {
        val dir = outDir.get().asFile
        dir.mkdirs()
        defs.forEach { (id, title, description, server, security) ->
            val body = buildString {
                appendLine(header)
                appendLine()
                appendLine("openapi: 3.0.1")
                appendLine("info:")
                appendLine("  title: \"$title\"")
                appendLine("  description: \"$description\"")
                appendLine("  version: \"$version\"")
                appendLine("servers:")
                appendLine("- url: \"$server\"")
                appendLine("  description: \"Local development runtime\"")
                if (security.isNotBlank()) appendLine(security)
            }
            File(dir, "$id.yaml").writeText(body)
        }
    }
}

// The plugin registers its own single-document tasks; this module generates one per context.
tasks.named("resolve") { enabled = false }

val resolveTasks = contexts.map { ctx ->
    tasks.register<ResolveTask>("resolveSpec${ctx.id.replaceFirstChar(Char::titlecase)}") {
        description = "Generates the OpenAPI spec for the '${ctx.id}' web context."
        dependsOn(generateBaseSpecs)

        classpath.from(sourceSets["main"].runtimeClasspath)
        buildClasspath.from(sourceSets["main"].runtimeClasspath)

        outputFileName = ctx.id
        outputFormat = ResolveTask.Format.YAML
        prettyPrint = true
        // Deterministic ordering, so the committed specs only change when the API does.
        sortOutput = true
        encoding = "UTF-8"
        // Swagger caches contexts by id; distinct ids keep the tasks from sharing state.
        contextId = "$serviceId-${ctx.id}"
        resourceClasses = ctx.controllers

        // The plugin only applies its conventions to the single `resolve` task it registers, so
        // tasks created here have to supply the defaults themselves.
        skip = false
        readAllResources = true
        alwaysResolveAppPath = false
        skipResolveAppPath = false
        openAPI31 = false
        convertToOpenAPI31 = false

        openApiFile = baseSpecDir.get().file("${ctx.id}.yaml").asFile
        outputDir = generatedSpecDir.get().asFile

        val specFile = generatedSpecDir.get().file("${ctx.id}.yaml").asFile
        val jsonFile = generatedSpecDir.get().file("${ctx.id}.json").asFile
        val title = ctx.title
        val desc = ctx.description
        val version = specVersion
        val expected = ctx.controllers.size
        val header = licenceHeader
        doLast {
            jsonFile.delete()
            require(specFile.exists()) { "Spec generation produced no file for context '${ctx.id}'" }
            // An upstream rename would silently yield an empty document; fail instead.
            require(specFile.readLines().any { it.startsWith("  /") }) {
                "Generated spec for context '${ctx.id}' has no paths. Check that its $expected " +
                    "controller classes still exist upstream."
            }
            rewriteInfoBlock(specFile, title, desc, version)
            // Swagger drops comments from the base document, including its license header.
            specFile.writeText("$header\n\n${specFile.readText()}")
        }
    }
}

/**
 * Collects the generated specs plus the index the Swagger UI page reads to build its selector.
 */
val assembleSpecBundle = tasks.register<Sync>("assembleSpecBundle") {
    description = "Collects the per-context specs and their index for bundling into a runtime jar."
    dependsOn(resolveTasks)
    from(generatedSpecDir) { include(contexts.map { "${it.id}.yaml" }) }
    into(bundleDir)

    val defs = contexts.map { listOf(it.id, it.title, it.server) }
    val outDir = bundleDir
    doLast {
        // id|display name|server — read by OpenApiSpecProvider. Deliberately not JSON, to keep the
        // extension free of a parser dependency, and ordered, unlike a .properties file.
        val index = defs.joinToString("\n") { (id, title, server) -> "$id|$title|$server" }
        File(outDir.get().asFile, "specs.index").writeText(index + "\n")
    }
}

tasks.register<Sync>("copyGeneratedSpecToDocs") {
    description = "Refreshes the committed reference specs under docs/api."
    dependsOn(assembleSpecBundle)
    from(bundleDir) { include("*.yaml") }
    into(rootProject.layout.projectDirectory.dir("docs/api/$serviceId"))
}
