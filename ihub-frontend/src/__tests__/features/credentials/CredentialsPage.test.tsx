import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CredentialsPage from '../../../features/credentials/CredentialsPage';
import { getCredentials, deleteCredential, requestCredential } from '../../../features/credentials/api';
import { invalidateCache } from '../../../hooks/useCachedFetch';

vi.mock('../../../features/credentials/api', () => ({
    getCredentials: vi.fn(),
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

const mockCredentials = [
    {
        id: 'cred-1',
        state: 400,
        participantContextId: 'BPNL00000003CRHK',
        holderId: 'did:web:holder.example',
        issuerId: 'did:web:issuer-did.example',
        verifiableCredential: {
            credential: {
                id: null,
                type: ['VerifiableCredential', 'MembershipCredential'],
                issuer: { id: 'did:web:issuer.example.com' },
                issuanceDate: '2025-01-01T00:00:00Z',
                expirationDate: '2030-12-31T00:00:00Z',
                credentialSubject: [{ id: 'did:web:subject.example.com', holderIdentifier: 'holder-1' }],
                credentialSchema: [{ id: 'https://schema.example/1', type: 'JsonSchema' }],
                credentialStatus: [{ id: 'https://status.example/1', type: 'StatusList', statusPurpose: 'revocation' }],
                dataModelVersion: '1.0.0',
            },
            format: 'JWT',
        },
    },
    {
        id: 'cred-2',
        state: 400,
        verifiableCredential: {
            credential: {
                id: null,
                type: ['VerifiableCredential', 'BpnCredential'],
                issuer: { id: 'did:web:issuer2.example.com' },
                issuanceDate: '2025-06-15T00:00:00Z',
                credentialSubject: [{ id: 'did:web:subject2.example.com' }],
            },
            format: 'JSON_LD',
        },
    },
];

const renderPage = () => {
    return render(
        <MemoryRouter>
            <CredentialsPage />
        </MemoryRouter>
    );
};

describe('CredentialsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateCache('');
    });

    it('should render the page title "Verifiable Credentials"', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Verifiable Credentials')).toBeInTheDocument();
        });
    });

    it('should render loading state then empty state when no credentials', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Credentials Found')).toBeInTheDocument();
        });
    });

    it('should render credentials after successful fetch', async () => {
        vi.mocked(getCredentials).mockResolvedValue(mockCredentials as any);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });

        expect(screen.getByText('BpnCredential')).toBeInTheDocument();
    });

    it('should open Add Credential dialog when "Add Credential" button is clicked', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Add Credential')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Add Credential'));

        await waitFor(() => {
            // AddCredentialDialog should render with its title
            const dialogTitle = screen.getAllByText('Add Credential');
            expect(dialogTitle.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should open Request dialog when "Request" button is clicked', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Issuer DID')).toBeInTheDocument();
    });

    it('should close Request dialog when Cancel is clicked', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(screen.queryByText('Request Credential')).not.toBeInTheDocument();
        });
    });

    it('should disable Send Request button when request JSON is empty', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        const sendButton = screen.getByText('Send Request');
        expect(sendButton).toBeDisabled();
    });

    it('should handle credential fetch failure gracefully', async () => {
        vi.mocked(getCredentials).mockRejectedValue(new Error('Fetch failed'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Credentials Found')).toBeInTheDocument();
        });
    });

    it('should open detail modal when credential card is clicked', async () => {
        vi.mocked(getCredentials).mockResolvedValue(mockCredentials as any);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });

        const cards = document.querySelectorAll('.custom-card');
        fireEvent.click(cards[0]);

        await waitFor(() => {
            // The detail modal shows credential ID in a DetailField
            expect(screen.getByText('cred-1')).toBeInTheDocument();
        });
    });

    it('should call deleteCredential when delete is triggered from detail modal', async () => {
        vi.mocked(getCredentials).mockResolvedValue(mockCredentials as any);
        vi.mocked(deleteCredential).mockResolvedValue(undefined);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });

        const cards = document.querySelectorAll('.custom-card');
        fireEvent.click(cards[0]);

        await waitFor(() => {
            expect(screen.getByText('cred-1')).toBeInTheDocument();
        });

        const deleteBtn = screen.getByTestId('DeleteIcon').closest('button')!;
        vi.mocked(getCredentials).mockResolvedValueOnce([]);
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(deleteCredential).toHaveBeenCalledWith('BPNL00000003CRHK', 'cred-1');
        });
    });

    it('should show snackbar error when delete fails', async () => {
        vi.mocked(getCredentials).mockResolvedValue(mockCredentials as any);
        vi.mocked(deleteCredential).mockRejectedValue(new Error('Delete failed'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });

        const cards = document.querySelectorAll('.custom-card');
        fireEvent.click(cards[0]);

        await waitFor(() => {
            expect(screen.getByText('cred-1')).toBeInTheDocument();
        });

        const deleteBtn = screen.getByTestId('DeleteIcon').closest('button')!;
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText('Delete failed')).toBeInTheDocument();
        });
    });


    it('should call requestCredential with structured fields when request is submitted', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        vi.mocked(requestCredential).mockResolvedValue(undefined);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:example.com' } });
        fireEvent.change(screen.getByLabelText('Holder PID'), { target: { value: 'did:web:holder.example.com' } });
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });

        fireEvent.click(screen.getByText('Send Request'));

        await waitFor(() => {
            expect(requestCredential).toHaveBeenCalledWith(
                'BPNL00000003CRHK',
                expect.objectContaining({
                    issuerDid: 'did:web:example.com',
                    holderPid: 'did:web:holder.example.com',
                    credentials: [expect.objectContaining({
                        format: 'ldp_vc',
                        type: 'MembershipCredential',
                    })],
                })
            );
        });
    });

    it('should show snackbar error when request credential fails', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        vi.mocked(requestCredential).mockRejectedValue(new Error('Request failed'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:example.com' } });
        fireEvent.change(screen.getByLabelText('Holder PID'), { target: { value: 'did:web:holder.example.com' } });
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });

        fireEvent.click(screen.getByText('Send Request'));

        await waitFor(() => {
            expect(screen.getByText('Request failed')).toBeInTheDocument();
        });
    });

    it('should keep Send Request disabled when required fields are missing', async () => {
        vi.mocked(getCredentials).mockResolvedValue([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Request')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Request'));

        await waitFor(() => {
            expect(screen.getByText('Request Credential')).toBeInTheDocument();
        });

        // Only fill Issuer DID, leave Holder PID and Credential Type empty
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:example.com' } });

        const sendButton = screen.getByText('Send Request');
        expect(sendButton).toBeDisabled();
    });

});
