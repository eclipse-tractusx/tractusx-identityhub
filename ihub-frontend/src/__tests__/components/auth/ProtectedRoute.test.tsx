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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({
    default: () => mockUseAuth(),
}));

import ProtectedRoute from '../../../components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
    it('should show loading state when isLoading', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, error: null });
        render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show error page when there is an error', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, error: 'Auth failed' });
        render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
    });

    it('should show redirect message when not authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, error: null });
        render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);
        expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
    });

    it('should show fallback when not authenticated and fallback provided', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, error: null });
        render(
            <ProtectedRoute fallback={<div>Custom Fallback</div>}>
                <div>Protected Content</div>
            </ProtectedRoute>
        );
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    });

    it('should render children when authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, error: null });
        render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
