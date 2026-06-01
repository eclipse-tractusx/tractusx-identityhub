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

vi.mock('../layouts/MainLayout', () => ({
    default: () => {
        const { Outlet } = require('react-router-dom');
        return (
            <div data-testid="main-layout">
                <Outlet />
            </div>
        );
    },
}));

vi.mock('../features/participants/ParticipantsPage', () => ({
    default: () => <div data-testid="participants-page">Participants Page</div>,
}));

vi.mock('../features/keypairs/KeyPairsPage', () => ({
    default: () => <div data-testid="keypairs-page">KeyPairs Page</div>,
}));

vi.mock('../features/did/DidPage', () => ({
    default: () => <div data-testid="did-page">DID Page</div>,
}));

vi.mock('../features/credentials/CredentialsPage', () => ({
    default: () => <div data-testid="credentials-page">Credentials Page</div>,
}));

vi.mock('../features/credentials/CredentialDetailPage', () => ({
    default: () => <div data-testid="credential-detail-page">Credential Detail Page</div>,
}));

vi.mock('../services/EnvironmentService', () => ({
    default: {
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    getParticipantId: vi.fn(() => ''),
    isAuthEnabled: vi.fn(() => false),
}));

vi.mock('../services/HttpClient', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

vi.mock('../hooks/useAuth', () => ({
    default: vi.fn(() => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: vi.fn(),
    })),
}));

import AppRoutes from '../routes';

describe('AppRoutes', () => {
    it('should render without crashing', () => {
        render(<AppRoutes />);
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('should export a function component', () => {
        expect(typeof AppRoutes).toBe('function');
        expect(AppRoutes.length).toBe(0);
    });

    it('should be a function component', () => {
        expect(typeof AppRoutes).toBe('function');
    });
});
