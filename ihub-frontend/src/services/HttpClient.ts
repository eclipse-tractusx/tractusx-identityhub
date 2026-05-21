/********************************************************************************
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 ARENA2036 e.V.
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

import axios, { AxiosError, AxiosInstance } from 'axios';
import authService from './AuthService';
import environmentService, { getIhubBackendUrl } from './EnvironmentService';

const httpClient: AxiosInstance = axios.create({
    timeout: environmentService.getApiConfig().timeout || 30000,
});

const waitForAuth = async (maxWaitMs: number = environmentService.getApiConfig().timeout || 30000): Promise<void> => {
    if (!environmentService.isAuthEnabled()) {
        return;
    }

    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        const authState = authService.getAuthState();
        if (authState.isAuthenticated) return;
        if (authState.error || !authState.isLoading) return;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
};

httpClient.interceptors.request.use(async (config) => {
    await waitForAuth();

    const envHeaders = environmentService.getApiHeaders();
    const authHeaders = authService.getAuthHeaders();
    
    // Debug log
    if (config.url?.includes('/participants')) {
        console.debug('[HttpClient] Request to:', config.url, {
            hasAuthHeader: !!authHeaders.Authorization,
            token: authHeaders.Authorization ? 'present' : 'missing',
            authState: authService.getAuthState(),
        });
    }
    
    config.headers = {
        ...(config.headers || {}),
        ...envHeaders,
        ...authHeaders,
    } as typeof config.headers;
    const backendUrl = getIhubBackendUrl();
    if (backendUrl && config.url && config.url.startsWith('/')) {
        config.url = `${backendUrl}${config.url}`;
    }
    return config;
});

httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            try {
                const authState = authService.getAuthState();
                const hadAuthHeader = !!((error.config as any)?.headers?.Authorization || (error.config as any)?.headers?.authorization);
                // Only logout if user was authenticated or the request included an Authorization header
                if (authState.isAuthenticated || hadAuthHeader) {
                    await authService.logout();
                } else {
                    console.debug('Received 401 for unauthenticated request; skipping logout');
                }
            } catch { /* ignore */ }
        }
        return Promise.reject(error);
    }
);

export default httpClient;
