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
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CredentialDetailPage from '../../../features/credentials/CredentialDetailPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: 'test-cred-id' }),
        useSearchParams: () => [new URLSearchParams({ participant: 'BPNL00000003CRHK' })],
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../../features/credentials/api', () => ({
    getCredentials: vi.fn(),
    getCredentialById: vi.fn(),
    getAllCredentials: vi.fn(),
    deleteCredential: vi.fn(),
    createCredential: vi.fn(),
    updateCredential: vi.fn(),
    requestCredential: vi.fn(),
}));

vi.mock('../../../services/HttpClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    },
}));

vi.mock('../../../services/EnvironmentService', () => ({
    default: {
        getParticipantId: vi.fn(() => 'BPNL00000003CRHK'),
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    getParticipantId: vi.fn(() => ''),
    isAuthEnabled: vi.fn(() => false),
}));

vi.mock('../../../services/participantUtils', () => ({
    encodeParticipantId: vi.fn((id: string) => btoa(id)),
}));

vi.mock('../../../hooks/useAuth', () => ({
    default: vi.fn(() => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: vi.fn(),
    })),
}));

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: vi.fn(() => ({
        participants: [],
        activeParticipantId: 'BPNL00000003CRHK',
        setActiveParticipantId: vi.fn(),
        loading: false,
        refresh: vi.fn(),
    })),
}));

import { getCredentialById } from '../../../features/credentials/api';

const mockCredentialResource = {
    id: 'test-cred-id',
    state: 400,
    participantContextId: 'BPNL00000003CRHK',
    issuerId: 'did:web:issuer.example.com',
    holderId: 'did:web:subject.example.com',
    verifiableCredential: {
        credential: {
            id: null,
            type: ['VerifiableCredential', 'MembershipCredential'],
            issuer: { id: 'did:web:issuer.example.com' },
            issuanceDate: '2025-01-01T00:00:00Z',
            credentialSubject: [
                {
                    id: 'did:web:subject.example.com',
                    holderIdentifier: 'BPNL00000003CRHK',
                },
            ],
        },
        format: 'JSON_LD',
    },
};

const renderPage = () => {
    return render(
        <MemoryRouter>
            <CredentialDetailPage />
        </MemoryRouter>
    );
};

describe('CredentialDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show loading spinner initially', () => {
        vi.mocked(getCredentialById).mockReturnValue(new Promise(() => {}));
        renderPage();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error state when fetch fails', async () => {
        vi.mocked(getCredentialById).mockRejectedValue(new Error('Network error'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Back to Credentials')).toBeInTheDocument();
        });
    });

    it('should show credential details after successful fetch', async () => {
        vi.mocked(getCredentialById).mockResolvedValue(mockCredentialResource as any);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('test-cred-id')).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'MembershipCredential' })).toBeInTheDocument();
        expect(screen.getAllByText('did:web:issuer.example.com').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Copy JSON')).toBeInTheDocument();
        expect(screen.getByText('Raw Credential JSON')).toBeInTheDocument();
    });

    it('should show "Back to Credentials" button after successful fetch', async () => {
        vi.mocked(getCredentialById).mockResolvedValue(mockCredentialResource as any);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Back to Credentials')).toBeInTheDocument();
        });
    });
});
