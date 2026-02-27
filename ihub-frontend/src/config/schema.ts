/********************************************************************************
 * Eclipse Tractus-X - Identity Hub Frontend
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

export interface AuthUser {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    permissions: string[];
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: Date;
}

export interface AppConfig {
    app: {
        environment: 'development' | 'staging' | 'production';
        version: string;
        buildTime: string;
    };

    api: {
        ihubBackendUrl: string;
        timeout: number;
        retryAttempts: number;
        requireHttpsUrlPattern: boolean;
        apiKey?: string;
        apiKeyHeader: string;
    };

    auth: {
        enabled: boolean;
        provider: 'keycloak' | 'none';
        keycloak?: {
            url: string;
            realm: string;
            clientId: string;
            onLoad?: 'login-required' | 'check-sso';
            checkLoginIframe?: boolean;
            silentCheckSsoRedirectUri?: string;
            pkceMethod?: 'S256' | 'plain';
            enableLogging?: boolean;
            minValidity?: number;
            checkLoginIframeInterval?: number;
            flow?: 'standard' | 'implicit' | 'hybrid';
        };
        sessionTimeout: number;
        renewTokenMinValidity: number;
        logoutRedirectUri?: string;
    };

    participant: {
        id: string;
    };

    features: {
        enableAdvancedLogging: boolean;
        enablePerformanceMonitoring: boolean;
        enableDevTools: boolean;
    };

    ui: {
        theme: 'light' | 'dark' | 'auto';
        locale: string;
        compactMode: boolean;
    };
}

export interface RawEnvironmentConfig {
    VITE_APP_ENVIRONMENT?: string;
    VITE_APP_VERSION?: string;
    VITE_IHUB_BACKEND_URL?: string;
    VITE_API_TIMEOUT?: string;
    VITE_API_RETRY_ATTEMPTS?: string;
    VITE_REQUIRE_HTTPS_URL_PATTERN?: string;
    VITE_API_KEY?: string;
    VITE_API_KEY_HEADER?: string;
    VITE_AUTH_ENABLED?: string;
    VITE_AUTH_PROVIDER?: string;
    VITE_KEYCLOAK_URL?: string;
    VITE_KEYCLOAK_REALM?: string;
    VITE_KEYCLOAK_CLIENT_ID?: string;
    VITE_KEYCLOAK_ON_LOAD?: string;
    VITE_KEYCLOAK_CHECK_LOGIN_IFRAME?: string;
    VITE_KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI?: string;
    VITE_KEYCLOAK_PKCE_METHOD?: string;
    VITE_KEYCLOAK_ENABLE_LOGGING?: string;
    VITE_KEYCLOAK_MIN_VALIDITY?: string;
    VITE_KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL?: string;
    VITE_KEYCLOAK_FLOW?: string;
    VITE_AUTH_SESSION_TIMEOUT?: string;
    VITE_AUTH_RENEW_TOKEN_MIN_VALIDITY?: string;
    VITE_AUTH_LOGOUT_REDIRECT_URI?: string;
    VITE_PARTICIPANT_ID?: string;
    VITE_ENABLE_ADVANCED_LOGGING?: string;
    VITE_ENABLE_PERFORMANCE_MONITORING?: string;
    VITE_ENABLE_DEV_TOOLS?: string;
    VITE_UI_THEME?: string;
    VITE_UI_LOCALE?: string;
    VITE_UI_COMPACT_MODE?: string;
}

export class ConfigurationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}
