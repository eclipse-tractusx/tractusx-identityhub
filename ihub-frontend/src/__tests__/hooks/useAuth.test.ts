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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetAuthState = vi.fn();
const mockSubscribe = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockHasRole = vi.fn();
const mockHasPermission = vi.fn();
const mockGetAccessToken = vi.fn();
const mockGetAuthHeaders = vi.fn();

vi.mock('../../services/AuthService', () => ({
    default: {
        getAuthState: (...args: unknown[]) => mockGetAuthState(...args),
        subscribe: (...args: unknown[]) => mockSubscribe(...args),
        login: (...args: unknown[]) => mockLogin(...args),
        logout: (...args: unknown[]) => mockLogout(...args),
        hasRole: (...args: unknown[]) => mockHasRole(...args),
        hasPermission: (...args: unknown[]) => mockHasPermission(...args),
        getAccessToken: (...args: unknown[]) => mockGetAccessToken(...args),
        getAuthHeaders: (...args: unknown[]) => mockGetAuthHeaders(...args),
    },
}));

import { useAuth } from '../../hooks/useAuth';

const defaultAuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    tokens: null,
    error: null,
};

describe('useAuth', () => {
    let mockUnsubscribe: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnsubscribe = vi.fn();
        mockGetAuthState.mockReturnValue({ ...defaultAuthState });
        mockSubscribe.mockReturnValue(mockUnsubscribe);
        mockGetAccessToken.mockReturnValue(null);
        mockGetAuthHeaders.mockReturnValue({});
        mockHasRole.mockReturnValue(false);
        mockHasPermission.mockReturnValue(false);
    });

    it('should return initial auth state', () => {
        const { result } = renderHook(() => useAuth());

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.tokens).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should return authenticated state when user is authenticated', () => {
        const authenticatedState = {
            isAuthenticated: true,
            isLoading: false,
            user: {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                roles: ['admin'],
                permissions: ['read'],
            },
            tokens: {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                expiresAt: new Date(),
            },
            error: null,
        };
        mockGetAuthState.mockReturnValue(authenticatedState);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(authenticatedState.user);
        expect(result.current.tokens).toEqual(authenticatedState.tokens);
    });

    it('should subscribe to auth state changes on mount', () => {
        renderHook(() => useAuth());

        expect(mockSubscribe).toHaveBeenCalledTimes(1);
        expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should unsubscribe on unmount', () => {
        const { unmount } = renderHook(() => useAuth());

        expect(mockUnsubscribe).not.toHaveBeenCalled();
        unmount();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should update state when subscriber callback is invoked', () => {
        const { result } = renderHook(() => useAuth());

        expect(result.current.isAuthenticated).toBe(false);

        // Get the subscriber callback that was passed to authService.subscribe
        const subscriberCallback = mockSubscribe.mock.calls[0][0];

        act(() => {
            subscriberCallback({
                isAuthenticated: true,
                isLoading: false,
                user: { id: '1', username: 'updated', roles: [], permissions: [] },
                tokens: null,
                error: null,
            });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.username).toBe('updated');
    });

    it('should call authService.login when login is called', () => {
        const { result } = renderHook(() => useAuth());

        result.current.login();
        expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('should call authService.logout when logout is called', () => {
        const { result } = renderHook(() => useAuth());

        result.current.logout();
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should delegate hasRole to authService', () => {
        mockHasRole.mockReturnValue(true);
        const { result } = renderHook(() => useAuth());

        const hasAdmin = result.current.hasRole('admin');
        expect(mockHasRole).toHaveBeenCalledWith('admin');
        expect(hasAdmin).toBe(true);
    });

    it('should delegate hasPermission to authService', () => {
        mockHasPermission.mockReturnValue(true);
        const { result } = renderHook(() => useAuth());

        const hasPerm = result.current.hasPermission('read:credentials');
        expect(mockHasPermission).toHaveBeenCalledWith('read:credentials');
        expect(hasPerm).toBe(true);
    });

    it('should delegate getAccessToken to authService', () => {
        mockGetAccessToken.mockReturnValue('my-access-token');
        const { result } = renderHook(() => useAuth());

        const token = result.current.getAccessToken();
        expect(mockGetAccessToken).toHaveBeenCalledTimes(1);
        expect(token).toBe('my-access-token');
    });

    it('should delegate getAuthHeaders to authService', () => {
        mockGetAuthHeaders.mockReturnValue({ Authorization: 'Bearer token123' });
        const { result } = renderHook(() => useAuth());

        const headers = result.current.getAuthHeaders();
        expect(mockGetAuthHeaders).toHaveBeenCalledTimes(1);
        expect(headers).toEqual({ Authorization: 'Bearer token123' });
    });

    it('should return error state when auth state has an error', () => {
        mockGetAuthState.mockReturnValue({
            ...defaultAuthState,
            error: 'Something went wrong',
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.error).toBe('Something went wrong');
    });

    it('should return loading state', () => {
        mockGetAuthState.mockReturnValue({
            ...defaultAuthState,
            isLoading: true,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(true);
    });
});
