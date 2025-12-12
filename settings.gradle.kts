/*
 *   Copyright (c) 2025 Cofinity-X
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

// this is needed to have access to snapshot builds of plugins
pluginManagement {
    repositories {
        mavenLocal()
        maven {
            url = uri("https://oss.sonatype.org/content/repositories/snapshots/")
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {

    repositories {
        maven {
            url = uri("https://oss.sonatype.org/content/repositories/snapshots/")
        }
        mavenCentral()
        mavenLocal()
    }
}

rootProject.name = "tractusx-identityhub"
include(":extensions:store:sql:migrations")
include(":extensions:seed:super-user")
include(":extensions:monitor:colored-jdk-monitor")
include(":extensions:signing:algorithm-extension")
include(":runtimes:identityhub")
include(":runtimes:identityhub-memory")
include(":runtimes:issuerservice")
include(":runtimes:issuerservice-memory")

include("extensions:signing:signing-extension")
include("extensions:signing:algorithm-extension")