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

import { AppConfig, RawEnvironmentConfig, ConfigurationError } from './schema';

export class ConfigFactory {
    private static instance: AppConfig | null = null;

    static create(): AppConfig {
        if (this.instance) {
            return this.instance;
        }

        const rawConfig = this.getRawEnvironmentConfig();
        const config = this.buildConfig(rawConfig);
        this.validateConfig(config);
        this.instance = config;
        return config;
    }

    private static getRawEnvironmentConfig(): RawEnvironmentConfig {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowEnv = (window as any)?.ENV || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viteEnv = (import.meta as any).env || {};

        return {
            VITE_APP_ENVIRONMENT: windowEnv.APP_ENVIRONMENT || viteEnv.VITE_APP_ENVIRONMENT,
            VITE_APP_VERSION: windowEnv.APP_VERSION || viteEnv.VITE_APP_VERSION,
            VITE_IHUB_BACKEND_URL: windowEnv.IHUB_BACKEND_URL || viteEnv.VITE_IHUB_BACKEND_URL,
            VITE_API_TIMEOUT: windowEnv.API_TIMEOUT || viteEnv.VITE_API_TIMEOUT,
            VITE_API_RETRY_ATTEMPTS: windowEnv.API_RETRY_ATTEMPTS || viteEnv.VITE_API_RETRY_ATTEMPTS,
            VITE_REQUIRE_HTTPS_URL_PATTERN: windowEnv.REQUIRE_HTTPS_URL_PATTERN || viteEnv.VITE_REQUIRE_HTTPS_URL_PATTERN,
            VITE_API_KEY: windowEnv.API_KEY || viteEnv.VITE_API_KEY,
            VITE_API_KEY_HEADER: windowEnv.API_KEY_HEADER || viteEnv.VITE_API_KEY_HEADER,
            VITE_AUTH_ENABLED: windowEnv.AUTH_ENABLED || viteEnv.VITE_AUTH_ENABLED,
            VITE_AUTH_PROVIDER: windowEnv.AUTH_PROVIDER || viteEnv.VITE_AUTH_PROVIDER,
            VITE_KEYCLOAK_URL: windowEnv.KEYCLOAK_URL || viteEnv.VITE_KEYCLOAK_URL,
            VITE_KEYCLOAK_REALM: windowEnv.KEYCLOAK_REALM || viteEnv.VITE_KEYCLOAK_REALM,
            VITE_KEYCLOAK_CLIENT_ID: windowEnv.KEYCLOAK_CLIENT_ID || viteEnv.VITE_KEYCLOAK_CLIENT_ID,
            VITE_KEYCLOAK_ON_LOAD: windowEnv.KEYCLOAK_ON_LOAD || viteEnv.VITE_KEYCLOAK_ON_LOAD,
            VITE_KEYCLOAK_CHECK_LOGIN_IFRAME: windowEnv.KEYCLOAK_CHECK_LOGIN_IFRAME || viteEnv.VITE_KEYCLOAK_CHECK_LOGIN_IFRAME,
            VITE_KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI: windowEnv.KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI || viteEnv.VITE_KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI,
            VITE_KEYCLOAK_PKCE_METHOD: windowEnv.KEYCLOAK_PKCE_METHOD || viteEnv.VITE_KEYCLOAK_PKCE_METHOD,
            VITE_KEYCLOAK_ENABLE_LOGGING: windowEnv.KEYCLOAK_ENABLE_LOGGING || viteEnv.VITE_KEYCLOAK_ENABLE_LOGGING,
            VITE_KEYCLOAK_MIN_VALIDITY: windowEnv.KEYCLOAK_MIN_VALIDITY || viteEnv.VITE_KEYCLOAK_MIN_VALIDITY,
            VITE_KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL: windowEnv.KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL || viteEnv.VITE_KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL,
            VITE_KEYCLOAK_FLOW: windowEnv.KEYCLOAK_FLOW || viteEnv.VITE_KEYCLOAK_FLOW,
            VITE_AUTH_SESSION_TIMEOUT: windowEnv.AUTH_SESSION_TIMEOUT || viteEnv.VITE_AUTH_SESSION_TIMEOUT,
            VITE_AUTH_RENEW_TOKEN_MIN_VALIDITY: windowEnv.AUTH_RENEW_TOKEN_MIN_VALIDITY || viteEnv.VITE_AUTH_RENEW_TOKEN_MIN_VALIDITY,
            VITE_AUTH_LOGOUT_REDIRECT_URI: windowEnv.AUTH_LOGOUT_REDIRECT_URI || viteEnv.VITE_AUTH_LOGOUT_REDIRECT_URI,
            VITE_PARTICIPANT_ID: windowEnv.PARTICIPANT_ID || viteEnv.VITE_PARTICIPANT_ID,
            VITE_ENABLE_ADVANCED_LOGGING: windowEnv.ENABLE_ADVANCED_LOGGING || viteEnv.VITE_ENABLE_ADVANCED_LOGGING,
            VITE_ENABLE_PERFORMANCE_MONITORING: windowEnv.ENABLE_PERFORMANCE_MONITORING || viteEnv.VITE_ENABLE_PERFORMANCE_MONITORING,
            VITE_ENABLE_DEV_TOOLS: windowEnv.ENABLE_DEV_TOOLS || viteEnv.VITE_ENABLE_DEV_TOOLS,
            VITE_UI_THEME: windowEnv.UI_THEME || viteEnv.VITE_UI_THEME,
            VITE_UI_LOCALE: windowEnv.UI_LOCALE || viteEnv.VITE_UI_LOCALE,
            VITE_UI_COMPACT_MODE: windowEnv.UI_COMPACT_MODE || viteEnv.VITE_UI_COMPACT_MODE,
        };
    }

    private static buildConfig(raw: RawEnvironmentConfig): AppConfig {
        const isDevelopment = raw.VITE_APP_ENVIRONMENT === 'development';

        return {
            app: {
                environment: (raw.VITE_APP_ENVIRONMENT as 'development' | 'staging' | 'production') || 'development',
                version: raw.VITE_APP_VERSION || '0.1.0',
                buildTime: new Date().toISOString(),
            },
            api: {
                ihubBackendUrl: raw.VITE_IHUB_BACKEND_URL || (isDevelopment ? 'http://localhost:8082' : ''),
                timeout: Number(raw.VITE_API_TIMEOUT || '30000'),
                retryAttempts: parseInt(raw.VITE_API_RETRY_ATTEMPTS || '3', 10),
                requireHttpsUrlPattern: raw.VITE_REQUIRE_HTTPS_URL_PATTERN !== 'false',
                apiKey: raw.VITE_API_KEY,
                apiKeyHeader: raw.VITE_API_KEY_HEADER || 'X-Api-Key',
            },
            auth: {
                enabled: raw.VITE_AUTH_ENABLED === 'true',
                provider: (raw.VITE_AUTH_PROVIDER as 'keycloak' | 'none') || 'none',
                keycloak: raw.VITE_AUTH_ENABLED === 'true' && raw.VITE_AUTH_PROVIDER === 'keycloak' ? {
                    url: raw.VITE_KEYCLOAK_URL || '',
                    realm: raw.VITE_KEYCLOAK_REALM || '',
                    clientId: raw.VITE_KEYCLOAK_CLIENT_ID || '',
                    onLoad: (raw.VITE_KEYCLOAK_ON_LOAD as 'login-required' | 'check-sso') || 'check-sso',
                    checkLoginIframe: raw.VITE_KEYCLOAK_CHECK_LOGIN_IFRAME !== 'false',
                    silentCheckSsoRedirectUri: raw.VITE_KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI,
                    pkceMethod: (raw.VITE_KEYCLOAK_PKCE_METHOD as 'S256' | 'plain') || 'S256',
                    enableLogging: raw.VITE_KEYCLOAK_ENABLE_LOGGING === 'true' || isDevelopment,
                    minValidity: parseInt(raw.VITE_KEYCLOAK_MIN_VALIDITY || '30', 10),
                    checkLoginIframeInterval: parseInt(raw.VITE_KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL || '5', 10),
                    flow: (raw.VITE_KEYCLOAK_FLOW as 'standard' | 'implicit' | 'hybrid') || 'standard',
                } : undefined,
                sessionTimeout: Number(raw.VITE_AUTH_SESSION_TIMEOUT || '3600000'),
                renewTokenMinValidity: Number(raw.VITE_AUTH_RENEW_TOKEN_MIN_VALIDITY || '300'),
                logoutRedirectUri: raw.VITE_AUTH_LOGOUT_REDIRECT_URI,
            },
            participant: {
                id: raw.VITE_PARTICIPANT_ID || 'BPNL00000003CRHK',
            },
            features: {
                enableAdvancedLogging: raw.VITE_ENABLE_ADVANCED_LOGGING === 'true' || isDevelopment,
                enablePerformanceMonitoring: raw.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
                enableDevTools: raw.VITE_ENABLE_DEV_TOOLS === 'true' || isDevelopment,
            },
            ui: {
                theme: (raw.VITE_UI_THEME as 'light' | 'dark' | 'auto') || 'auto',
                locale: raw.VITE_UI_LOCALE || 'en',
                compactMode: raw.VITE_UI_COMPACT_MODE === 'true',
            },
        };
    }

    private static validateConfig(config: AppConfig): void {
        const errors: string[] = [];

        if (!config.api.ihubBackendUrl) {
            errors.push('Backend URL is required');
        }

        if (config.api.ihubBackendUrl && !this.isValidUrl(config.api.ihubBackendUrl)) {
            errors.push('Invalid backend URL format');
        }

        if (config.auth.enabled && config.auth.provider === 'keycloak') {
            if (!config.auth.keycloak) {
                errors.push('Keycloak configuration is required when auth provider is keycloak');
            } else {
                if (!config.auth.keycloak.url) errors.push('Keycloak URL is required');
                if (!config.auth.keycloak.realm) errors.push('Keycloak realm is required');
                if (!config.auth.keycloak.clientId) errors.push('Keycloak client ID is required');
            }
        }

        if (errors.length > 0) {
            throw new ConfigurationError(`Configuration validation failed: ${errors.join(', ')}`);
        }
    }

    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static clearCache(): void {
        this.instance = null;
    }

    static reload(): AppConfig {
        this.clearCache();
        return this.create();
    }
}
