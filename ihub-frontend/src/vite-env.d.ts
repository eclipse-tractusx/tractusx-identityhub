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

/// <reference types="vite/client" />

declare global {
    interface Window {
        ENV?: {
            APP_ENVIRONMENT?: string;
            APP_VERSION?: string;
            IHUB_BACKEND_URL?: string;
            API_TIMEOUT?: string;
            API_RETRY_ATTEMPTS?: string;
            REQUIRE_HTTPS_URL_PATTERN?: string;
            API_KEY?: string;
            API_KEY_HEADER?: string;
            AUTH_ENABLED?: string;
            AUTH_PROVIDER?: string;
            KEYCLOAK_URL?: string;
            KEYCLOAK_REALM?: string;
            KEYCLOAK_CLIENT_ID?: string;
            KEYCLOAK_ON_LOAD?: string;
            KEYCLOAK_CHECK_LOGIN_IFRAME?: string;
            KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI?: string;
            KEYCLOAK_PKCE_METHOD?: string;
            KEYCLOAK_ENABLE_LOGGING?: string;
            KEYCLOAK_MIN_VALIDITY?: string;
            KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL?: string;
            KEYCLOAK_FLOW?: string;
            AUTH_SESSION_TIMEOUT?: string;
            AUTH_RENEW_TOKEN_MIN_VALIDITY?: string;
            AUTH_LOGOUT_REDIRECT_URI?: string;
            PARTICIPANT_ID?: string;
            ENABLE_ADVANCED_LOGGING?: string;
            ENABLE_PERFORMANCE_MONITORING?: string;
            ENABLE_DEV_TOOLS?: string;
            UI_THEME?: string;
            UI_LOCALE?: string;
            UI_COMPACT_MODE?: string;
        }
    }
}

export {};
