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
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KeyPairsPage from '../../../features/keypairs/KeyPairsPage';
import httpClient from '../../../services/HttpClient';
import { invalidateCache } from '../../../hooks/useCachedFetch';

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

vi.mock('../../../hooks/useAuth', () => ({
    default: vi.fn(() => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: vi.fn(),
    })),
}));

const participantState = vi.hoisted(() => ({
    activeParticipantId: 'BPNL00000003CRHK',
}));

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: vi.fn(() => ({
        participants: [],
        activeParticipantId: participantState.activeParticipantId,
        setActiveParticipantId: vi.fn(),
        loading: false,
        refresh: vi.fn(),
    })),
}));

const mockKeyPairsActive = [
    {
        id: 'kp-1',
        keyId: 'key-active-1',
        type: 'EC',
        state: 200,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
        defaultPair: true,
        privateKeyAlias: 'alias-1',
        timestamp: 1700000000000,
    },
];

const mockKeyPairsCreated = [
    {
        id: 'kp-0',
        keyId: 'key-created-1',
        type: 'EC',
        state: 100,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
    },
];

const mockKeyPairsRevoked = [
    {
        id: 'kp-3',
        keyId: 'key-revoked-1',
        type: 'EC',
        state: 400,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
    },
];

const mockKeyPairsMixed = [
    {
        id: 'kp-1',
        keyId: 'key-active-1',
        type: 'EC',
        state: 200,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
        defaultPair: true,
        privateKeyAlias: 'alias-1',
        timestamp: 1700000000000,
    },
    {
        id: 'kp-2',
        keyId: 'key-rotated-1',
        type: 'EC',
        state: 300,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
    },
    {
        id: 'kp-3',
        keyId: 'key-revoked-1',
        type: 'EC',
        state: 400,
        algorithm: 'ES256',
        participantId: 'BPNL00000003CRHK',
    },
];

const renderPage = () => {
    return render(
        <MemoryRouter>
            <KeyPairsPage />
        </MemoryRouter>
    );
};

async function openMoreVertMenu(index = 0) {
    const moreVertIcons = screen.getAllByTestId('MoreVertIcon');
    fireEvent.click(moreVertIcons[index].closest('button')!);
}

describe('KeyPairsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateCache('');
        participantState.activeParticipantId = 'BPNL00000003CRHK';
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    it('should render page title "Key Pairs"', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Key Pairs')).toBeInTheDocument();
        });

        expect(vi.mocked(httpClient.get)).toHaveBeenCalledWith(
            expect.stringContaining('/participants/')
        );
        expect(vi.mocked(httpClient.get)).toHaveBeenCalledWith(
            expect.stringContaining('/keypairs')
        );
    });

    it('should show empty state when no key pairs', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Key Pairs Found')).toBeInTheDocument();
        });
    });

    it('should show key pair cards after successful fetch', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsMixed });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        expect(screen.getByText('key-rotated-1')).toBeInTheDocument();
        expect(screen.getByText('key-revoked-1')).toBeInTheDocument();
    });

    it('should reset pagination when the active participant changes', async () => {
        const participantAKeyPairs = Array.from({ length: 11 }, (_, index) => ({
            id: `kp-a-${index + 1}`,
            keyId: `key-a-${index + 1}`,
            state: 200,
            participantContextId: 'participant-a',
        }));
        const participantBKeyPairs = [
            {
                id: 'kp-b-1',
                keyId: 'key-b-1',
                state: 200,
                participantContextId: 'participant-b',
            },
        ];

        participantState.activeParticipantId = 'participant-a';
        vi.mocked(httpClient.get).mockImplementation(async (url) => ({
            data: String(url).includes('/participant-a/')
                ? participantAKeyPairs
                : participantBKeyPairs,
        }));

        const rendered = renderPage();

        await screen.findByText('key-a-1');
        fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
        await screen.findByText('key-a-11');

        participantState.activeParticipantId = 'participant-b';
        rendered.rerender(
            <MemoryRouter>
                <KeyPairsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(httpClient.get).toHaveBeenCalledWith(
                '/api/identity/v1beta/participants/participant-b/keypairs'
            );
        });
        expect(await screen.findByText('key-b-1')).toBeInTheDocument();
    });

    it('should render Active state key pair with Rotate and Revoke in menu', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        expect(screen.getByText('DEFAULT')).toBeInTheDocument();

        openMoreVertMenu();
        expect(screen.getByText('Rotate')).toBeInTheDocument();
        expect(screen.getByText('Revoke')).toBeInTheDocument();
    });

    it('should render Created state key pair with Activate in menu', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsCreated });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-created-1')).toBeInTheDocument();
        });

        expect(screen.getByText(/^Created\s|^CREATED$/)).toBeInTheDocument();

        openMoreVertMenu();
        expect(screen.getByText('Activate')).toBeInTheDocument();
        expect(screen.queryByText('Rotate')).not.toBeInTheDocument();
        expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
    });

    it('should render Revoked state key pair with no action menu items', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsRevoked });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-revoked-1')).toBeInTheDocument();
        });

        expect(screen.getByText('REVOKED')).toBeInTheDocument();

        openMoreVertMenu();
        expect(screen.queryByText('Rotate')).not.toBeInTheDocument();
        expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
        expect(screen.queryByText('Activate')).not.toBeInTheDocument();
        expect(screen.getByText('Copy Key ID')).toBeInTheDocument();
    });

    it('should show Default chip for default key pair', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        expect(screen.getByText('DEFAULT')).toBeInTheDocument();
    });

    it('should show private key alias when available', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        expect(screen.getByText(/alias-1/)).toBeInTheDocument();
    });

    it('should open rotate dialog when Rotate menu item is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Rotate'));

        await waitFor(() => {
            expect(screen.getByText('Rotate Key Pair')).toBeInTheDocument();
        });

        expect(screen.getAllByText(/key-active-1/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByLabelText('New Key ID (optional)')).toBeInTheDocument();
        expect(screen.getByLabelText('Duration in ms (optional)')).toBeInTheDocument();
    });

    it('should close rotate dialog when Cancel is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Rotate'));

        await waitFor(() => {
            expect(screen.getByText('Rotate Key Pair')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(screen.queryByText('Rotate Key Pair')).not.toBeInTheDocument();
        });
    });

    it('should call httpClient.post for rotate when confirmed', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Rotate'));

        await waitFor(() => {
            expect(screen.getByText('Rotate Key Pair')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });

        // Click the Rotate button inside the dialog
        const rotateButtons = screen.getAllByRole('button');
        const dialogRotateBtn = rotateButtons.find(
            (btn) => btn.textContent === 'Rotate' && btn.closest('[role="dialog"]')
        );
        fireEvent.click(dialogRotateBtn!);

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledWith(
                expect.stringContaining('/rotate'),
                expect.any(Object)
            );
        });
    });

    it('should open revoke dialog when Revoke menu item is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Revoke'));

        await waitFor(() => {
            expect(screen.getByText('Revoke Key Pair')).toBeInTheDocument();
        });

        expect(screen.getAllByText(/key-active-1/).length).toBeGreaterThanOrEqual(1);
    });

    it('should close revoke dialog when Cancel is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Revoke'));

        await waitFor(() => {
            expect(screen.getByText('Revoke Key Pair')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(screen.queryByText('Revoke Key Pair')).not.toBeInTheDocument();
        });
    });

    it('should call httpClient.post for revoke when confirmed', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Revoke'));

        await waitFor(() => {
            expect(screen.getByText('Revoke Key Pair')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });

        const revokeButtons = screen.getAllByRole('button');
        const dialogRevokeBtn = revokeButtons.find(
            (btn) => btn.textContent === 'Revoke' && btn.closest('[role="dialog"]')
        );
        fireEvent.click(dialogRevokeBtn!);

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledWith(
                expect.stringContaining('/revoke'),
                expect.any(Object)
            );
        });
    });

    it('should call handleActivate when Activate menu item is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsCreated });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-created-1')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Activate'));

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledWith(
                expect.stringContaining('/activate')
            );
        });
    });

    it('should show snackbar error when activate fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsCreated });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-created-1')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Activate failed'));

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Activate'));

        await waitFor(() => {
            expect(screen.getByText('Activate failed')).toBeInTheDocument();
        });
    });

    it('should handle fetch error gracefully', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Key Pairs Found')).toBeInTheDocument();
        });
    });

    it('should show snackbar error when rotate fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Rotate'));

        await waitFor(() => {
            expect(screen.getByText('Rotate Key Pair')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Rotate failed'));

        const rotateButtons = screen.getAllByRole('button');
        const dialogRotateBtn = rotateButtons.find(
            (btn) => btn.textContent === 'Rotate' && btn.closest('[role="dialog"]')
        );
        fireEvent.click(dialogRotateBtn!);

        await waitFor(() => {
            expect(screen.getByText('Rotate failed')).toBeInTheDocument();
        });
    });

    it('should show snackbar error when revoke fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Revoke'));

        await waitFor(() => {
            expect(screen.getByText('Revoke Key Pair')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Revoke failed'));

        const revokeButtons = screen.getAllByRole('button');
        const dialogRevokeBtn = revokeButtons.find(
            (btn) => btn.textContent === 'Revoke' && btn.closest('[role="dialog"]')
        );
        fireEvent.click(dialogRevokeBtn!);

        await waitFor(() => {
            expect(screen.getByText('Revoke failed')).toBeInTheDocument();
        });
    });

    it('should display created date when timestamp is provided', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockKeyPairsActive });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('key-active-1')).toBeInTheDocument();
        });

        expect(screen.getByText(/^Created\s|^CREATED$/)).toBeInTheDocument();
    });
});
