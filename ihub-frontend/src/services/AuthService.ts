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

import Keycloak from 'keycloak-js';
import environmentService, { AuthUser, AuthTokens } from './EnvironmentService';

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    tokens: AuthTokens | null;
    error: string | null;
}

class AuthService {
    private keycloak: Keycloak | null = null;
    private initialized = false;
    private initializing = false;
    private authState: AuthState = {
        isAuthenticated: false,
        isLoading: true,
        user: null,
        tokens: null,
        error: null,
    };
    private listeners: ((state: AuthState) => void)[] = [];

    async initialize(): Promise<void> {
        if (this.initialized || this.initializing) return;
        this.initializing = true;

        try {
            if (!environmentService.isAuthEnabled()) {
                this.setAuthState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null,
                    tokens: null,
                    error: null,
                });
                this.initialized = true;
                return;
            }

            if (environmentService.isKeycloakEnabled()) {
                await this.initializeKeycloak();
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize authentication:', error);
            this.setAuthState({
                ...this.authState,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication initialization failed',
            });
        } finally {
            this.initializing = false;
        }
    }

    private async initializeKeycloak(): Promise<void> {
        const keycloakConfig = environmentService.getKeycloakConfig();
        const initOptions = environmentService.getKeycloakInitOptions();
        this.keycloak = new Keycloak({
            url: keycloakConfig.url,
            realm: keycloakConfig.realm,
            clientId: keycloakConfig.clientId
        });

        try {
            const initPromise = this.keycloak.init({
                onLoad: initOptions.onLoad,
                checkLoginIframe: initOptions.checkLoginIframe,
                pkceMethod: initOptions.pkceMethod as 'S256',
                enableLogging: initOptions.enableLogging
            });

            const timeoutPromise = new Promise<boolean>((_, reject) => {
                setTimeout(() => reject(new Error('Keycloak initialization timeout')), 30000);
            });

            const authenticated = await Promise.race([initPromise, timeoutPromise]);

            if (authenticated) {
                if (window.location.search.includes('state=') || window.location.search.includes('code=')) {
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }
                await this.handleAuthenticationSuccess();
            } else {
                await this.keycloak.login({
                    redirectUri: window.location.origin + window.location.pathname
                });
            }

            this.setupTokenRefresh();
            this.setupKeycloakEvents();
        } catch (error) {
            console.error('Keycloak initialization failed:', error);
            this.setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                tokens: null,
                error: error instanceof Error ? error.message : 'Keycloak initialization failed',
            });
        }
    }

    private async handleAuthenticationSuccess(): Promise<void> {
        if (!this.keycloak) return;

        const tokenParsed = this.keycloak.tokenParsed;
        const token = this.keycloak.token;
        const refreshToken = this.keycloak.refreshToken;
        const idToken = this.keycloak.idToken;

        if (!token || !tokenParsed) {
            throw new Error('Invalid token received');
        }

        const user: AuthUser = {
            id: tokenParsed.sub || '',
            username: tokenParsed.preferred_username || '',
            email: tokenParsed.email,
            firstName: tokenParsed.given_name,
            lastName: tokenParsed.family_name,
            roles: tokenParsed.realm_access?.roles || [],
            permissions: tokenParsed.resource_access?.[environmentService.getKeycloakClientId()]?.roles || [],
        };

        const tokens: AuthTokens = {
            accessToken: token,
            refreshToken,
            idToken,
            tokenType: 'Bearer',
            expiresIn: tokenParsed.exp ? tokenParsed.exp - tokenParsed.iat! : 0,
            expiresAt: new Date((tokenParsed.exp || 0) * 1000),
        };

        this.setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            tokens,
            error: null,
        });
    }

    private setupTokenRefresh(): void {
        if (!this.keycloak) return;
        const minValidity = environmentService.getRenewTokenMinValidity();

        setInterval(async () => {
            if (this.keycloak?.authenticated) {
                try {
                    const refreshed = await this.keycloak.updateToken(minValidity);
                    if (refreshed) {
                        await this.handleAuthenticationSuccess();
                    }
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                    if (error instanceof Error && error.message.includes('Failed to refresh token')) {
                        await this.logout();
                    }
                }
            }
        }, 60000);
    }

    private setupKeycloakEvents(): void {
        if (!this.keycloak) return;

        this.keycloak.onTokenExpired = async () => {
            try {
                const refreshed = await this.keycloak!.updateToken(30);
                if (refreshed) {
                    await this.handleAuthenticationSuccess();
                }
            } catch (error) {
                console.error('Failed to refresh expired token:', error);
                await this.logout();
            }
        };

        this.keycloak.onAuthRefreshError = () => {
            this.logout();
        };

        this.keycloak.onAuthError = (error: unknown) => {
            console.error('Auth error:', error);
            this.setAuthState({
                ...this.authState,
                error: error instanceof Error ? error.message : 'Authentication error occurred',
            });
        };
    }

    async login(): Promise<void> {
        if (!environmentService.isAuthEnabled()) {
            throw new Error('Authentication is not enabled');
        }
        if (this.keycloak) {
            await this.keycloak.login();
        } else {
            throw new Error('Authentication not initialized');
        }
    }

    async logout(): Promise<void> {
        sessionStorage.removeItem('keycloak_authenticated');

        if (this.keycloak?.authenticated) {
            const logoutUri = environmentService.getLogoutRedirectUri();
            await this.keycloak.logout({
                redirectUri: logoutUri || window.location.origin,
            });
        }

        this.setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            tokens: null,
            error: null,
        });
    }

    getAuthState(): AuthState {
        return { ...this.authState };
    }

    getAccessToken(): string | null {
        return this.authState.tokens?.accessToken || null;
    }

    getUser(): AuthUser | null {
        return this.authState.user;
    }

    isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    hasRole(role: string): boolean {
        return this.authState.user?.roles.includes(role) || false;
    }

    hasPermission(permission: string): boolean {
        return this.authState.user?.permissions.includes(permission) || false;
    }

    getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        const token = this.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private setAuthState(newState: AuthState): void {
        this.authState = newState;
        this.listeners.forEach(listener => listener(newState));
    }
}

const authService = new AuthService();
export default authService;
export { AuthService };
