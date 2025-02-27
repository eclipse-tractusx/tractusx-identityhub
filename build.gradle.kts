/*
 *   Copyright (c) 2025 Cofinity-X
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

import com.bmuschko.gradle.docker.tasks.image.DockerBuildImage
import com.github.jengelman.gradle.plugins.shadow.ShadowJavaPlugin

plugins {
    `java-library`
    id("com.bmuschko.docker-remote-api") version "9.4.0"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}


buildscript {
    dependencies {
        val edcVersion: String by project
        classpath("org.eclipse.edc.edc-build:org.eclipse.edc.edc-build.gradle.plugin:${edcVersion}")
    }
}

val edcVersion: String by project

allprojects {
    apply(plugin = "org.eclipse.edc.edc-build")

    // configure which version of the annotation processor to use. defaults to the same version as the plugin
    configure<org.eclipse.edc.plugins.autodoc.AutodocExtension> {
        outputDirectory.set(project.layout.buildDirectory.asFile)
        processorVersion.set(edcVersion)
    }
}
// the "dockerize" task is added to all projects that use the `shadowJar` plugin, e.g. runtimes
subprojects {
    afterEvaluate {
        if (project.plugins.hasPlugin("com.github.johnrengelman.shadow") &&
            file("${project.projectDir}/src/main/docker/Dockerfile").exists()
        ) {

            val downloadOpentelemetryAgent = tasks.register("downloadOpentelemetryAgent", Copy::class) {
                val openTelemetry = configurations.create("open-telemetry")

                dependencies {
                    openTelemetry(libs.opentelemetry.javaagent)
                }

                from(openTelemetry)
                into("build/resources/otel")
                rename { "opentelemetry-javaagent.jar" }
            }

            // this task copies some legal docs into the build folder, so we can easily copy them into the docker images
            val copyLegalDocs = tasks.register("copyLegalDocs", Copy::class) {

                into("${project.layout.buildDirectory.asFile.get()}")
                into("legal") {
                    from("${project.rootProject.projectDir}/SECURITY.md")
                    from("${project.rootProject.projectDir}/NOTICE.md")
                    from("${project.rootProject.projectDir}/DEPENDENCIES")
                    from("${project.rootProject.projectDir}/LICENSE")
                    from("${projectDir}/notice.md")

                }
            }

            tasks.named(JavaPlugin.JAR_TASK_NAME).configure {
                dependsOn(copyLegalDocs)
            }

            val shadowJarTask = tasks.named(ShadowJavaPlugin.SHADOW_JAR_TASK_NAME).get()
            shadowJarTask
                .dependsOn(copyLegalDocs)
                .dependsOn(downloadOpentelemetryAgent)

            //actually apply the plugin to the (sub-)project
            apply(plugin = "com.bmuschko.docker-remote-api")
            // configure the "dockerize" task
            val dockerTask = tasks.register("dockerize", DockerBuildImage::class) {
                val dockerContextDir = project.projectDir
                dockerFile.set(file("$dockerContextDir/src/main/docker/Dockerfile"))
                images.add("${project.name}:${project.version}")
                images.add("${project.name}:latest")
                // specify platform with the -Dplatform flag:
                if (System.getProperty("platform") != null)
                    platform.set(System.getProperty("platform"))
                buildArgs.put("JAR", "build/libs/${project.name}.jar")
                buildArgs.put("OTEL_JAR", "build/resources/otel/opentelemetry-javaagent.jar")
                buildArgs.put("ADDITIONAL_FILES", "build/legal/*")
                inputDir.set(file(dockerContextDir))
            }
            // make sure  always runs after "dockerize" and after "copyOtel"
            dockerTask.configure {
                dependsOn(shadowJarTask)
                dependsOn(JavaPlugin.JAR_TASK_NAME)
            }
        }
    }
}

