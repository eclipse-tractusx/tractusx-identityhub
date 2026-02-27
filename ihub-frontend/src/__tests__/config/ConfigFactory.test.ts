import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigFactory } from '../../config/ConfigFactory';
import { ConfigurationError } from '../../config/schema';

describe('ConfigFactory', () => {
    beforeEach(() => {
        ConfigFactory.clearCache();
        (window as any).ENV = { IHUB_BACKEND_URL: 'http://localhost:8082' };
    });

    it('should create a config with default values', () => {
        const config = ConfigFactory.create();
        expect(config).toBeDefined();
        expect(config.app).toBeDefined();
        expect(config.api).toBeDefined();
        expect(config.auth).toBeDefined();
        expect(config.participant).toBeDefined();
        expect(config.features).toBeDefined();
        expect(config.ui).toBeDefined();
    });

    it('should return singleton instance', () => {
        const config1 = ConfigFactory.create();
        const config2 = ConfigFactory.create();
        expect(config1).toBe(config2);
    });

    it('should clear cache and create new instance', () => {
        const config1 = ConfigFactory.create();
        ConfigFactory.clearCache();
        const config2 = ConfigFactory.create();
        expect(config1).not.toBe(config2);
    });

    it('should reload config', () => {
        const config1 = ConfigFactory.create();
        const config2 = ConfigFactory.reload();
        expect(config1).not.toBe(config2);
    });

    it('should read from window.ENV', () => {
        (window as any).ENV = { IHUB_BACKEND_URL: 'http://custom-backend:9000' };
        ConfigFactory.clearCache();
        const config = ConfigFactory.create();
        expect(config.api.ihubBackendUrl).toBe('http://custom-backend:9000');
    });

    it('should set default participant id', () => {
        const config = ConfigFactory.create();
        expect(config.participant.id).toBe('BPNL00000003CRHK');
    });

    it('should set auth disabled by default', () => {
        const config = ConfigFactory.create();
        expect(config.auth.enabled).toBe(false);
    });

    it('should set default api timeout', () => {
        const config = ConfigFactory.create();
        expect(config.api.timeout).toBe(30000);
    });

    it('should set default retry attempts', () => {
        const config = ConfigFactory.create();
        expect(config.api.retryAttempts).toBe(3);
    });

    it('should set default api key header', () => {
        const config = ConfigFactory.create();
        expect(config.api.apiKeyHeader.toLowerCase()).toBe('x-api-key');
    });

    it('should throw ConfigurationError for invalid backend URL', () => {
        (window as any).ENV = { IHUB_BACKEND_URL: 'not-a-url' };
        ConfigFactory.clearCache();
        expect(() => ConfigFactory.create()).toThrow(ConfigurationError);
    });

    it('should throw if keycloak auth enabled but missing config', () => {
        (window as any).ENV = {
            IHUB_BACKEND_URL: 'http://localhost:8082',
            AUTH_ENABLED: 'true',
            AUTH_PROVIDER: 'keycloak',
        };
        ConfigFactory.clearCache();
        expect(() => ConfigFactory.create()).toThrow(ConfigurationError);
    });

    it('should build keycloak config when auth is enabled with full config', () => {
        (window as any).ENV = {
            IHUB_BACKEND_URL: 'http://localhost:8082',
            AUTH_ENABLED: 'true',
            AUTH_PROVIDER: 'keycloak',
            KEYCLOAK_URL: 'http://keycloak:8080',
            KEYCLOAK_REALM: 'test-realm',
            KEYCLOAK_CLIENT_ID: 'test-client',
        };
        ConfigFactory.clearCache();
        const config = ConfigFactory.create();
        expect(config.auth.enabled).toBe(true);
        expect(config.auth.keycloak).toBeDefined();
        expect(config.auth.keycloak!.url).toBe('http://keycloak:8080');
        expect(config.auth.keycloak!.realm).toBe('test-realm');
        expect(config.auth.keycloak!.clientId).toBe('test-client');
    });

    it('should set ui defaults', () => {
        const config = ConfigFactory.create();
        expect(config.ui.theme).toBe('auto');
        expect(config.ui.locale).toBe('en');
        expect(config.ui.compactMode).toBe(false);
    });

    it('should handle VITE_REQUIRE_HTTPS_URL_PATTERN false', () => {
        (window as any).ENV = {
            IHUB_BACKEND_URL: 'http://localhost:8082',
            REQUIRE_HTTPS_URL_PATTERN: 'false',
        };
        ConfigFactory.clearCache();
        const config = ConfigFactory.create();
        expect(config.api.requireHttpsUrlPattern).toBe(false);
    });

    it('should set api key when provided', () => {
        (window as any).ENV = {
            IHUB_BACKEND_URL: 'http://localhost:8082',
            API_KEY: 'my-secret-key',
        };
        ConfigFactory.clearCache();
        const config = ConfigFactory.create();
        expect(config.api.apiKey).toBe('my-secret-key');
    });
});
