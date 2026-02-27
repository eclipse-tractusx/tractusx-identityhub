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

import { useState, useEffect } from 'react';
import authService, { AuthState } from '../services/AuthService';

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

    useEffect(() => {
        const unsubscribe = authService.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    return {
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        user: authState.user,
        tokens: authState.tokens,
        error: authState.error,
        login: () => authService.login(),
        logout: () => authService.logout(),
        hasRole: (role: string) => authService.hasRole(role),
        hasPermission: (permission: string) => authService.hasPermission(permission),
        getAccessToken: () => authService.getAccessToken(),
        getAuthHeaders: () => authService.getAuthHeaders(),
    };
}

export default useAuth;
