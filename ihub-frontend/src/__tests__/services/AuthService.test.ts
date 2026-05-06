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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../services/AuthService';

// --- Environment mocks ---

const mockIsAuthEnabled = vi.fn(() => false);
const mockIsKeycloakEnabled = vi.fn(() => false);
const mockGetKeycloakConfig = vi.fn(() => ({
    url: 'http://keycloak:8080',
    realm: 'test',
    clientId: 'test-client',
}));
const mockGetKeycloakInitOptions = vi.fn(() => ({
    onLoad: 'check-sso',
    checkLoginIframe: false,
    pkceMethod: 'S256',
    enableLogging: false,
    minValidity: 30,
    checkLoginIframeInterval: 5,
    flow: 'standard',
}));
const mockGetRenewTokenMinValidity = vi.fn(() => 300);
const mockGetLogoutRedirectUri = vi.fn(() => undefined as string | undefined);
const mockGetKeycloakClientId = vi.fn(() => 'test-client');

vi.mock('../../services/EnvironmentService', () => ({
    default: {
        isAuthEnabled: () => mockIsAuthEnabled(),
        isKeycloakEnabled: () => mockIsKeycloakEnabled(),
        getKeycloakConfig: () => mockGetKeycloakConfig(),
        getKeycloakInitOptions: () => mockGetKeycloakInitOptions(),
        getRenewTokenMinValidity: () => mockGetRenewTokenMinValidity(),
        getLogoutRedirectUri: () => mockGetLogoutRedirectUri(),
        getKeycloakClientId: () => mockGetKeycloakClientId(),
    },
    AuthUser: {},
    AuthTokens: {},
}));

// --- Keycloak mock ---

const mockKeycloakInit = vi.fn();
const mockKeycloakLogin = vi.fn();
const mockKeycloakLogout = vi.fn();
const mockKeycloakUpdateToken = vi.fn();

const createMockKeycloak = () => ({
    init: mockKeycloakInit,
    login: mockKeycloakLogin,
    logout: mockKeycloakLogout,
    updateToken: mockKeycloakUpdateToken,
    authenticated: false,
    token: null as string | null,
    tokenParsed: null as Record<string, unknown> | null,
    refreshToken: null as string | null,
    idToken: null as string | null,
    onTokenExpired: null as (() => void) | null,
    onAuthRefreshError: null as (() => void) | null,
    onAuthError: null as ((error: unknown) => void) | null,
});

let mockKeycloakInstance = createMockKeycloak();

vi.mock('keycloak-js', () => ({
    default: vi.fn().mockImplementation(() => {
        mockKeycloakInstance = createMockKeycloak();
        return mockKeycloakInstance;
    }),
}));

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Reset defaults
        mockIsAuthEnabled.mockReturnValue(false);
        mockIsKeycloakEnabled.mockReturnValue(false);
        mockKeycloakInit.mockReset();
        mockKeycloakLogin.mockReset();
        mockKeycloakLogout.mockReset();
        mockKeycloakUpdateToken.mockReset();

        service = new AuthService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // --- Initial state ---

    describe('initial state', () => {
        it('should have correct initial auth state', () => {
            const state = service.getAuthState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(true);
            expect(state.user).toBeNull();
            expect(state.tokens).toBeNull();
            expect(state.error).toBeNull();
        });

        it('should return null for access token when not authenticated', () => {
            expect(service.getAccessToken()).toBeNull();
        });

        it('should return null for user when not authenticated', () => {
            expect(service.getUser()).toBeNull();
        });

        it('should return false for isAuthenticated initially', () => {
            expect(service.isAuthenticated()).toBe(false);
        });
    });

    // --- Initialize ---

    describe('initialize', () => {
        it('should initialize with auth disabled', async () => {
            mockIsAuthEnabled.mockReturnValue(false);

            await service.initialize();

            const state = service.getAuthState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should not re-initialize if already initialized', async () => {
            mockIsAuthEnabled.mockReturnValue(false);

            await service.initialize();
            await service.initialize();

            const state = service.getAuthState();
            expect(state.isLoading).toBe(false);
        });

        it('should set error state when keycloak initialization fails', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);
            mockKeycloakInit.mockRejectedValue(new Error('Connection refused'));

            await service.initialize();

            const state = service.getAuthState();
            expect(state.isLoading).toBe(false);
            expect(state.error).toBe('Connection refused');
            expect(state.isAuthenticated).toBe(false);
        });

        it('should set generic error message for non-Error throws during initialization', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);
            mockKeycloakInit.mockRejectedValue('string error');

            await service.initialize();

            const state = service.getAuthState();
            expect(state.error).toBe('Keycloak initialization failed');
            expect(state.isAuthenticated).toBe(false);
        });

        it('should handle successful keycloak authentication', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);
            mockKeycloakInit.mockResolvedValue(true);

            // Simulate authenticated keycloak instance with valid token
            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'access-token-123';
                mockKeycloakInstance.refreshToken = 'refresh-token-123';
                mockKeycloakInstance.idToken = 'id-token-123';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-id-1',
                    preferred_username: 'testuser',
                    email: 'test@example.com',
                    given_name: 'Test',
                    family_name: 'User',
                    realm_access: { roles: ['admin', 'user'] },
                    resource_access: {
                        'test-client': { roles: ['read', 'write'] },
                    },
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            // Mock window.location for URL cleanup
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/dashboard',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            const state = service.getAuthState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
            expect(state.user).not.toBeNull();
            expect(state.user!.username).toBe('testuser');
            expect(state.user!.email).toBe('test@example.com');
            expect(state.user!.firstName).toBe('Test');
            expect(state.user!.lastName).toBe('User');
            expect(state.user!.roles).toEqual(['admin', 'user']);
            expect(state.user!.permissions).toEqual(['read', 'write']);
            expect(state.tokens).not.toBeNull();
            expect(state.tokens!.accessToken).toBe('access-token-123');
            expect(state.tokens!.refreshToken).toBe('refresh-token-123');
            expect(state.tokens!.idToken).toBe('id-token-123');
            expect(state.tokens!.tokenType).toBe('Bearer');

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });

        it('should redirect to login when keycloak init returns not authenticated', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);
            mockKeycloakInit.mockResolvedValue(false);
            mockKeycloakLogin.mockResolvedValue(undefined);

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/dashboard',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            expect(mockKeycloakLogin).toHaveBeenCalledWith({
                redirectUri: 'http://localhost:3000/dashboard',
            });

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });

        it('should clean URL when authenticated with state/code query params', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            const mockReplaceState = vi.fn();
            const originalHistory = window.history;
            Object.defineProperty(window, 'history', {
                value: { ...originalHistory, replaceState: mockReplaceState },
                writable: true,
                configurable: true,
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/dashboard',
                    search: '?state=abc&code=xyz',
                },
                writable: true,
                configurable: true,
            });

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token-123';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-1',
                    preferred_username: 'user',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            await service.initialize();

            expect(mockReplaceState).toHaveBeenCalledWith(
                {},
                document.title,
                'http://localhost:3000/dashboard'
            );

            Object.defineProperty(window, 'history', {
                value: originalHistory,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- Roles and permissions ---

    describe('hasRole and hasPermission', () => {
        it('should return false for hasRole when not authenticated', () => {
            expect(service.hasRole('admin')).toBe(false);
        });

        it('should return false for hasPermission when not authenticated', () => {
            expect(service.hasPermission('write')).toBe(false);
        });
    });

    // --- Auth headers ---

    describe('getAuthHeaders', () => {
        it('should return empty auth headers when not authenticated', () => {
            const headers = service.getAuthHeaders();
            expect(headers).toEqual({});
        });

        it('should return Authorization header when tokens are present', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'my-access-token';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-1',
                    preferred_username: 'user',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            const headers = service.getAuthHeaders();
            expect(headers['Authorization']).toBe('Bearer my-access-token');

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- Login ---

    describe('login', () => {
        it('should throw when login called with auth disabled', async () => {
            mockIsAuthEnabled.mockReturnValue(false);
            await expect(service.login()).rejects.toThrow('Authentication is not enabled');
        });

        it('should throw when login called with auth enabled but keycloak not initialized', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            // keycloak is null because we never called initialize()
            await expect(service.login()).rejects.toThrow('Authentication not initialized');
        });

        it('should call keycloak.login when auth is enabled and keycloak is initialized', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            // Initialize with a failed auth (so keycloak instance exists but no redirect)
            mockKeycloakInit.mockRejectedValue(new Error('Init failed'));
            await service.initialize();

            // Now keycloak instance exists (was created in initializeKeycloak)
            // but the test mock creates a fresh one each time. We need to set up
            // auth enabled for the login call
            mockIsAuthEnabled.mockReturnValue(true);

            // The keycloak instance was created but init failed. Login should still
            // throw because the instance was set during initializeKeycloak
            // Actually, keycloak is set before init is called, so it should exist
            mockKeycloakLogin.mockResolvedValue(undefined);

            // Since keycloak was created but init failed, keycloak instance exists
            // The login call should try keycloak.login
            // Need to verify the mock - re-import to get the actual mock instance
            // The mock keycloak constructor returns our mockKeycloakInstance
            await service.login();
            expect(mockKeycloakLogin).toHaveBeenCalled();
        });
    });

    // --- Logout ---

    describe('logout', () => {
        it('should handle logout gracefully when not authenticated', async () => {
            await service.logout();

            const state = service.getAuthState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.tokens).toBeNull();
        });

        it('should remove keycloak_authenticated from sessionStorage', async () => {
            sessionStorage.setItem('keycloak_authenticated', 'true');
            expect(sessionStorage.getItem('keycloak_authenticated')).toBe('true');

            await service.logout();

            expect(sessionStorage.getItem('keycloak_authenticated')).toBeNull();
        });

        it('should call keycloak.logout when keycloak is authenticated', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token-123';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-1',
                    preferred_username: 'user',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });
            mockKeycloakLogout.mockResolvedValue(undefined);

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            // Verify we are authenticated before logout
            expect(service.isAuthenticated()).toBe(true);

            await service.logout();

            expect(mockKeycloakLogout).toHaveBeenCalledWith({
                redirectUri: 'http://localhost:3000',
            });

            const state = service.getAuthState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.tokens).toBeNull();

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });

        it('should use logoutRedirectUri when configured', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);
            mockGetLogoutRedirectUri.mockReturnValue('http://custom-logout.example.com');

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token-123';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-1',
                    preferred_username: 'user',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });
            mockKeycloakLogout.mockResolvedValue(undefined);

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();
            await service.logout();

            expect(mockKeycloakLogout).toHaveBeenCalledWith({
                redirectUri: 'http://custom-logout.example.com',
            });

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- Subscribe ---

    describe('subscribe', () => {
        it('should subscribe and notify listener on state change', async () => {
            const listener = vi.fn();
            service.subscribe(listener);

            await service.initialize();

            expect(listener).toHaveBeenCalled();
        });

        it('should notify multiple subscribers', async () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            const listener3 = vi.fn();

            service.subscribe(listener1);
            service.subscribe(listener2);
            service.subscribe(listener3);

            await service.initialize();

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            expect(listener3).toHaveBeenCalled();
        });

        it('should unsubscribe and stop notifying listener', async () => {
            const listener = vi.fn();
            const unsubscribe = service.subscribe(listener);

            unsubscribe();
            await service.initialize();

            expect(listener).not.toHaveBeenCalled();
        });

        it('should only unsubscribe the correct listener', async () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            const unsub1 = service.subscribe(listener1);
            service.subscribe(listener2);

            unsub1();
            await service.initialize();

            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should pass the new auth state to listeners', async () => {
            const listener = vi.fn();
            service.subscribe(listener);

            await service.initialize();

            const passedState = listener.mock.calls[0][0];
            expect(passedState.isAuthenticated).toBe(false);
            expect(passedState.isLoading).toBe(false);
        });
    });

    // --- getAccessToken ---

    describe('getAccessToken', () => {
        it('should return null when no tokens are set', () => {
            expect(service.getAccessToken()).toBeNull();
        });

        it('should return the access token after successful authentication', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'my-jwt-token';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'user-1',
                    preferred_username: 'user',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            expect(service.getAccessToken()).toBe('my-jwt-token');

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- getUser ---

    describe('getUser', () => {
        it('should return null when no user is set', () => {
            expect(service.getUser()).toBeNull();
        });

        it('should return user after successful authentication', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'uid-123',
                    preferred_username: 'jane',
                    email: 'jane@example.com',
                    given_name: 'Jane',
                    family_name: 'Doe',
                    realm_access: { roles: ['viewer'] },
                    resource_access: {},
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            const user = service.getUser();
            expect(user).not.toBeNull();
            expect(user!.id).toBe('uid-123');
            expect(user!.username).toBe('jane');
            expect(user!.email).toBe('jane@example.com');
            expect(user!.roles).toEqual(['viewer']);

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- Edge cases for handleAuthenticationSuccess ---

    describe('handleAuthenticationSuccess edge cases', () => {
        it('should default to empty roles when realm_access is missing', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token';
                mockKeycloakInstance.tokenParsed = {
                    sub: 'uid-1',
                    preferred_username: 'user',
                    // No realm_access or resource_access
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            const user = service.getUser();
            expect(user!.roles).toEqual([]);
            expect(user!.permissions).toEqual([]);

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });

        it('should default to empty string when sub is missing from token', async () => {
            mockIsAuthEnabled.mockReturnValue(true);
            mockIsKeycloakEnabled.mockReturnValue(true);

            mockKeycloakInit.mockImplementation(async () => {
                mockKeycloakInstance.authenticated = true;
                mockKeycloakInstance.token = 'token';
                mockKeycloakInstance.tokenParsed = {
                    // No sub
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    iat: Math.floor(Date.now() / 1000),
                };
                return true;
            });

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: {
                    ...originalLocation,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                },
                writable: true,
                configurable: true,
            });

            await service.initialize();

            const user = service.getUser();
            expect(user!.id).toBe('');
            expect(user!.username).toBe('');

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true,
            });
        });
    });

    // --- getAuthState returns a copy ---

    describe('getAuthState immutability', () => {
        it('should return a copy of the state, not a reference', () => {
            const state1 = service.getAuthState();
            const state2 = service.getAuthState();
            expect(state1).toEqual(state2);
            expect(state1).not.toBe(state2);
        });
    });
});
