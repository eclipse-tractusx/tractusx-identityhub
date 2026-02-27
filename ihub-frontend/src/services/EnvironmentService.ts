/********************************************************************************
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { ConfigFactory } from '../config/ConfigFactory';
import { AppConfig } from '../config/schema';

export type { AuthUser, AuthTokens } from '../config/schema';

class EnvironmentService {
    private config: AppConfig;

    constructor() {
        this.config = ConfigFactory.create();
    }

    getConfig(): Readonly<AppConfig> {
        return this.config;
    }

    getAppConfig() {
        return this.config.app;
    }

    getApiConfig() {
        return this.config.api;
    }

    getParticipantConfig() {
        return this.config.participant;
    }

    getFeatureFlags() {
        return this.config.features;
    }

    getUiConfig() {
        return this.config.ui;
    }

    getAuthConfig() {
        return this.config.auth;
    }

    isAuthEnabled(): boolean {
        return this.config.auth.enabled;
    }

    getAuthProvider(): string {
        return this.config.auth.provider;
    }

    isKeycloakEnabled(): boolean {
        return this.config.auth.enabled && this.config.auth.provider === 'keycloak';
    }

    getKeycloakConfig() {
        if (!this.isKeycloakEnabled()) {
            throw new Error('Keycloak is not enabled');
        }
        return this.config.auth.keycloak!;
    }

    getKeycloakUrl(): string {
        return this.getKeycloakConfig().url;
    }

    getKeycloakRealm(): string {
        return this.getKeycloakConfig().realm;
    }

    getKeycloakClientId(): string {
        return this.getKeycloakConfig().clientId;
    }

    getKeycloakInitOptions() {
        const keycloakConfig = this.getKeycloakConfig();
        return {
            onLoad: keycloakConfig.onLoad || 'check-sso',
            checkLoginIframe: false,
            silentCheckSsoRedirectUri: keycloakConfig.silentCheckSsoRedirectUri,
            pkceMethod: keycloakConfig.pkceMethod || 'S256',
            enableLogging: keycloakConfig.enableLogging || false,
            minValidity: keycloakConfig.minValidity || 30,
            checkLoginIframeInterval: keycloakConfig.checkLoginIframeInterval || 5,
            flow: keycloakConfig.flow || 'standard',
        };
    }

    getSessionTimeout(): number {
        return this.config.auth.sessionTimeout;
    }

    getRenewTokenMinValidity(): number {
        return this.config.auth.renewTokenMinValidity;
    }

    getLogoutRedirectUri(): string | undefined {
        return this.config.auth.logoutRedirectUri;
    }

    isDevelopment(): boolean {
        return this.config.app.environment === 'development';
    }

    isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
        return this.config.features[feature];
    }

    getApiHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const apiKey = this.config.api.apiKey;
        if (apiKey) {
            headers[this.config.api.apiKeyHeader] = apiKey;
        }

        return headers;
    }

    getIhubBackendUrl(): string {
        return this.config.api.ihubBackendUrl;
    }

    getParticipantId(): string {
        return this.config.participant.id;
    }

    reloadConfiguration(): void {
        this.config = ConfigFactory.reload();
    }
}

export const getIhubBackendUrl = () => window?.ENV?.IHUB_BACKEND_URL ?? '';

export const getParticipantId = () => window?.ENV?.PARTICIPANT_ID ?? '';

export const isAuthEnabled = () => {
    const service = new EnvironmentService();
    return service.isAuthEnabled();
};

const environmentService = new EnvironmentService();

export default environmentService;
export { EnvironmentService };
