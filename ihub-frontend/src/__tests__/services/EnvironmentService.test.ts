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

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/ConfigFactory', () => ({
    ConfigFactory: {
        create: vi.fn(() => ({
            app: { environment: 'development', version: '0.1.0', buildTime: '2025-01-01' },
            api: {
                ihubBackendUrl: 'http://localhost:8082',
                timeout: 30000,
                retryAttempts: 3,
                requireHttpsUrlPattern: true,
                apiKeyHeader: 'X-Api-Key',
            },
            auth: {
                enabled: false,
                provider: 'none',
                sessionTimeout: 3600000,
                renewTokenMinValidity: 300,
            },
            participant: { id: 'BPNL00000003CRHK' },
            features: { enableAdvancedLogging: true, enablePerformanceMonitoring: false, enableDevTools: true },
            ui: { theme: 'auto', locale: 'en', compactMode: false },
        })),
        reload: vi.fn(() => ({
            app: { environment: 'production', version: '1.0.0', buildTime: '2025-06-01' },
            api: {
                ihubBackendUrl: 'http://prod:8082',
                timeout: 30000,
                retryAttempts: 3,
                requireHttpsUrlPattern: true,
                apiKeyHeader: 'X-Api-Key',
            },
            auth: {
                enabled: false,
                provider: 'none',
                sessionTimeout: 3600000,
                renewTokenMinValidity: 300,
            },
            participant: { id: 'BPNL00000003CRHK' },
            features: { enableAdvancedLogging: false, enablePerformanceMonitoring: false, enableDevTools: false },
            ui: { theme: 'dark', locale: 'en', compactMode: false },
        })),
    },
}));

import { EnvironmentService } from '../../services/EnvironmentService';

describe('EnvironmentService', () => {
    let service: EnvironmentService;

    beforeEach(() => {
        service = new EnvironmentService();
    });

    // --- getConfig ---

    it('should return full config', () => {
        const config = service.getConfig();
        expect(config).toBeDefined();
        expect(config.app).toBeDefined();
        expect(config.api).toBeDefined();
        expect(config.auth).toBeDefined();
        expect(config.participant).toBeDefined();
        expect(config.features).toBeDefined();
        expect(config.ui).toBeDefined();
    });

    // --- App config ---

    it('should return app config', () => {
        expect(service.getAppConfig().environment).toBe('development');
        expect(service.getAppConfig().version).toBe('0.1.0');
        expect(service.getAppConfig().buildTime).toBe('2025-01-01');
    });

    // --- API config ---

    it('should return api config', () => {
        expect(service.getApiConfig().ihubBackendUrl).toBe('http://localhost:8082');
        expect(service.getApiConfig().timeout).toBe(30000);
        expect(service.getApiConfig().retryAttempts).toBe(3);
        expect(service.getApiConfig().requireHttpsUrlPattern).toBe(true);
        expect(service.getApiConfig().apiKeyHeader).toBe('X-Api-Key');
    });

    // --- Participant config ---

    it('should return participant config', () => {
        expect(service.getParticipantConfig().id).toBe('BPNL00000003CRHK');
    });

    // --- Feature flags ---

    it('should return feature flags', () => {
        expect(service.getFeatureFlags().enableAdvancedLogging).toBe(true);
        expect(service.getFeatureFlags().enablePerformanceMonitoring).toBe(false);
        expect(service.getFeatureFlags().enableDevTools).toBe(true);
    });

    // --- UI config ---

    it('should return ui config', () => {
        expect(service.getUiConfig().theme).toBe('auto');
        expect(service.getUiConfig().locale).toBe('en');
        expect(service.getUiConfig().compactMode).toBe(false);
    });

    // --- Auth config ---

    it('should return auth config', () => {
        expect(service.getAuthConfig().enabled).toBe(false);
        expect(service.getAuthConfig().provider).toBe('none');
        expect(service.getAuthConfig().sessionTimeout).toBe(3600000);
        expect(service.getAuthConfig().renewTokenMinValidity).toBe(300);
    });

    it('should report auth disabled', () => {
        expect(service.isAuthEnabled()).toBe(false);
    });

    it('should return auth provider', () => {
        expect(service.getAuthProvider()).toBe('none');
    });

    it('should report keycloak disabled', () => {
        expect(service.isKeycloakEnabled()).toBe(false);
    });

    it('should throw when getting keycloak config without keycloak enabled', () => {
        expect(() => service.getKeycloakConfig()).toThrow('Keycloak is not enabled');
    });

    it('should throw when getting keycloak URL without keycloak enabled', () => {
        expect(() => service.getKeycloakUrl()).toThrow('Keycloak is not enabled');
    });

    it('should throw when getting keycloak realm without keycloak enabled', () => {
        expect(() => service.getKeycloakRealm()).toThrow('Keycloak is not enabled');
    });

    it('should throw when getting keycloak client ID without keycloak enabled', () => {
        expect(() => service.getKeycloakClientId()).toThrow('Keycloak is not enabled');
    });

    it('should throw when getting keycloak init options without keycloak enabled', () => {
        expect(() => service.getKeycloakInitOptions()).toThrow('Keycloak is not enabled');
    });

    // --- Session and token config ---

    it('should return session timeout', () => {
        expect(service.getSessionTimeout()).toBe(3600000);
    });

    it('should return renew token min validity', () => {
        expect(service.getRenewTokenMinValidity()).toBe(300);
    });

    // --- isDevelopment ---

    it('should report isDevelopment', () => {
        expect(service.isDevelopment()).toBe(true);
    });

    // --- isFeatureEnabled ---

    it('should check feature enabled', () => {
        expect(service.isFeatureEnabled('enableAdvancedLogging')).toBe(true);
        expect(service.isFeatureEnabled('enablePerformanceMonitoring')).toBe(false);
        expect(service.isFeatureEnabled('enableDevTools')).toBe(true);
    });

    // --- getApiHeaders ---

    it('should return api headers with Content-Type', () => {
        const headers = service.getApiHeaders();
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return api headers without api key when not configured', () => {
        // apiKey is undefined in mock, so no extra header
        const headers = service.getApiHeaders();
        expect(headers['X-Api-Key']).toBeUndefined();
    });

    it('should return logout redirect uri', () => {
        expect(service.getLogoutRedirectUri()).toBeUndefined();
    });

    // --- Instance methods ---

    it('should return ihub backend url', () => {
        expect(service.getIhubBackendUrl()).toBe('http://localhost:8082');
    });

    it('should return participant id', () => {
        expect(service.getParticipantId()).toBe('BPNL00000003CRHK');
    });

    // --- reloadConfiguration ---

    it('should reload configuration', () => {
        service.reloadConfiguration();
        expect(service.getAppConfig().environment).toBe('production');
        expect(service.getAppConfig().version).toBe('1.0.0');
        expect(service.getApiConfig().ihubBackendUrl).toBe('http://prod:8082');
    });

    it('should reflect reloaded feature flags', () => {
        service.reloadConfiguration();
        expect(service.getFeatureFlags().enableAdvancedLogging).toBe(false);
        expect(service.getFeatureFlags().enableDevTools).toBe(false);
    });

    it('should reflect reloaded ui config', () => {
        service.reloadConfiguration();
        expect(service.getUiConfig().theme).toBe('dark');
    });

    it('should report isDevelopment false after reloading to production', () => {
        service.reloadConfiguration();
        expect(service.isDevelopment()).toBe(false);
    });
});

// Separate describe block for the standalone exported functions
describe('EnvironmentService standalone exports', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('getIhubBackendUrl should read from window.ENV', async () => {
        const originalEnv = (window as any).ENV;
        (window as any).ENV = { IHUB_BACKEND_URL: 'http://from-window-env:9090' };

        // Re-import to get the standalone function
        const { getIhubBackendUrl } = await import('../../services/EnvironmentService');
        expect(getIhubBackendUrl()).toBe('http://from-window-env:9090');

        (window as any).ENV = originalEnv;
    });

    it('getIhubBackendUrl should return empty string when window.ENV is undefined', async () => {
        const originalEnv = (window as any).ENV;
        delete (window as any).ENV;

        const { getIhubBackendUrl } = await import('../../services/EnvironmentService');
        expect(getIhubBackendUrl()).toBe('');

        (window as any).ENV = originalEnv;
    });

    it('getParticipantId should read from window.ENV', async () => {
        const originalEnv = (window as any).ENV;
        (window as any).ENV = { PARTICIPANT_ID: 'BPNL_FROM_WINDOW' };

        const { getParticipantId } = await import('../../services/EnvironmentService');
        expect(getParticipantId()).toBe('BPNL_FROM_WINDOW');

        (window as any).ENV = originalEnv;
    });

    it('getParticipantId should return empty string when window.ENV is undefined', async () => {
        const originalEnv = (window as any).ENV;
        delete (window as any).ENV;

        const { getParticipantId } = await import('../../services/EnvironmentService');
        expect(getParticipantId()).toBe('');

        (window as any).ENV = originalEnv;
    });

    it('isAuthEnabled standalone function should create a new EnvironmentService', async () => {
        const { isAuthEnabled } = await import('../../services/EnvironmentService');
        // With our mock, auth is disabled, so this should return false
        expect(isAuthEnabled()).toBe(false);
    });
});

// Separate describe block for keycloak-enabled configuration
describe('EnvironmentService with Keycloak enabled', () => {
    let service: EnvironmentService;

    beforeEach(() => {
        vi.resetModules();
    });

    it('should return keycloak config and related methods when keycloak is enabled', async () => {
        // Re-mock ConfigFactory with keycloak enabled
        vi.doMock('../../config/ConfigFactory', () => ({
            ConfigFactory: {
                create: vi.fn(() => ({
                    app: { environment: 'production', version: '1.0.0', buildTime: '2025-06-01' },
                    api: {
                        ihubBackendUrl: 'http://prod:8082',
                        timeout: 30000,
                        retryAttempts: 3,
                        requireHttpsUrlPattern: true,
                        apiKeyHeader: 'X-Api-Key',
                    },
                    auth: {
                        enabled: true,
                        provider: 'keycloak',
                        keycloak: {
                            url: 'http://keycloak:8080',
                            realm: 'my-realm',
                            clientId: 'my-client',
                            onLoad: 'login-required',
                            checkLoginIframe: true,
                            pkceMethod: 'S256',
                            enableLogging: true,
                            minValidity: 60,
                            checkLoginIframeInterval: 10,
                            flow: 'standard',
                        },
                        sessionTimeout: 7200000,
                        renewTokenMinValidity: 600,
                        logoutRedirectUri: 'http://logout.example.com',
                    },
                    participant: { id: 'BPNL_KC' },
                    features: { enableAdvancedLogging: true, enablePerformanceMonitoring: true, enableDevTools: false },
                    ui: { theme: 'dark', locale: 'de', compactMode: true },
                })),
                reload: vi.fn(),
            },
        }));

        const { EnvironmentService: ES } = await import('../../services/EnvironmentService');
        service = new ES();

        expect(service.isAuthEnabled()).toBe(true);
        expect(service.isKeycloakEnabled()).toBe(true);
        expect(service.getAuthProvider()).toBe('keycloak');

        const kcConfig = service.getKeycloakConfig();
        expect(kcConfig.url).toBe('http://keycloak:8080');
        expect(kcConfig.realm).toBe('my-realm');
        expect(kcConfig.clientId).toBe('my-client');

        expect(service.getKeycloakUrl()).toBe('http://keycloak:8080');
        expect(service.getKeycloakRealm()).toBe('my-realm');
        expect(service.getKeycloakClientId()).toBe('my-client');

        const initOptions = service.getKeycloakInitOptions();
        expect(initOptions.onLoad).toBe('login-required');
        expect(initOptions.checkLoginIframe).toBe(false); // always false in the service
        expect(initOptions.pkceMethod).toBe('S256');
        expect(initOptions.enableLogging).toBe(true);
        expect(initOptions.minValidity).toBe(60);
        expect(initOptions.checkLoginIframeInterval).toBe(10);
        expect(initOptions.flow).toBe('standard');

        expect(service.getSessionTimeout()).toBe(7200000);
        expect(service.getRenewTokenMinValidity()).toBe(600);
        expect(service.getLogoutRedirectUri()).toBe('http://logout.example.com');
    });

    it('should include apiKey in headers when configured', async () => {
        vi.doMock('../../config/ConfigFactory', () => ({
            ConfigFactory: {
                create: vi.fn(() => ({
                    app: { environment: 'production', version: '1.0.0', buildTime: '2025-06-01' },
                    api: {
                        ihubBackendUrl: 'http://prod:8082',
                        timeout: 30000,
                        retryAttempts: 3,
                        requireHttpsUrlPattern: true,
                        apiKey: 'my-secret-api-key',
                        apiKeyHeader: 'X-Api-Key',
                    },
                    auth: {
                        enabled: false,
                        provider: 'none',
                        sessionTimeout: 3600000,
                        renewTokenMinValidity: 300,
                    },
                    participant: { id: 'BPNL_API' },
                    features: { enableAdvancedLogging: false, enablePerformanceMonitoring: false, enableDevTools: false },
                    ui: { theme: 'light', locale: 'en', compactMode: false },
                })),
                reload: vi.fn(),
            },
        }));

        const { EnvironmentService: ES } = await import('../../services/EnvironmentService');
        service = new ES();

        const headers = service.getApiHeaders();
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['X-Api-Key']).toBe('my-secret-api-key');
    });

    it('should use custom apiKeyHeader name when configured', async () => {
        vi.doMock('../../config/ConfigFactory', () => ({
            ConfigFactory: {
                create: vi.fn(() => ({
                    app: { environment: 'production', version: '1.0.0', buildTime: '2025-06-01' },
                    api: {
                        ihubBackendUrl: 'http://prod:8082',
                        timeout: 30000,
                        retryAttempts: 3,
                        requireHttpsUrlPattern: true,
                        apiKey: 'secret-key-456',
                        apiKeyHeader: 'Authorization-Key',
                    },
                    auth: {
                        enabled: false,
                        provider: 'none',
                        sessionTimeout: 3600000,
                        renewTokenMinValidity: 300,
                    },
                    participant: { id: 'BPNL_CUSTOM' },
                    features: { enableAdvancedLogging: false, enablePerformanceMonitoring: false, enableDevTools: false },
                    ui: { theme: 'light', locale: 'en', compactMode: false },
                })),
                reload: vi.fn(),
            },
        }));

        const { EnvironmentService: ES } = await import('../../services/EnvironmentService');
        service = new ES();

        const headers = service.getApiHeaders();
        expect(headers['Authorization-Key']).toBe('secret-key-456');
        expect(headers['X-Api-Key']).toBeUndefined();
    });
});
