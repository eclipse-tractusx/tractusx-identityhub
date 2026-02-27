import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ParticipantsPage from '../../../features/participants/ParticipantsPage';
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

const mockParticipants = [
    {
        participantContextId: 'BPNL00000003CRHK',
        did: 'did:web:example.com:BPNL00000003CRHK',
        state: 2,
        roles: ['admin'],
    },
    {
        participantContextId: 'BPNL00000003AYRE',
        did: 'did:web:example.com:BPNL00000003AYRE',
        state: 2,
    },
];

const renderPage = () => {
    return render(
        <MemoryRouter>
            <ParticipantsPage />
        </MemoryRouter>
    );
};

describe('ParticipantsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateCache('');
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    it('should render page title "Participant Context"', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Participant Context')).toBeInTheDocument();
        });
    });

    it('should show empty state when no participants', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Participants Found')).toBeInTheDocument();
        });
    });

    it('should show "Create Participant" button', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });
    });

    it('should show participant cards after successful fetch', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText('BPNL00000003AYRE')).toBeInTheDocument();
    });

    it('should open create dialog when "Create Participant" is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Key ID (optional)')).toBeInTheDocument();
        expect(screen.getByLabelText('Private Key Alias (optional)')).toBeInTheDocument();
        expect(screen.getByLabelText('DID (optional)')).toBeInTheDocument();
    });

    it('should disable Create button when participant ID is empty', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        const createBtn = screen.getByText('Create');
        expect(createBtn).toBeDisabled();
    });

    it('should submit create form and call httpClient.post', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Participant ID *'), {
            target: { value: 'BPNL00000003NEW1' },
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });

        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledWith(
                '/api/identity/v1alpha/participants',
                expect.objectContaining({ participantId: 'BPNL00000003NEW1' })
            );
        });
    });

    it('should show result dialog when create returns apiKey', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Participant ID *'), {
            target: { value: 'BPNL00000003NEW2' },
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({
            data: {
                apiKey: 'test-api-key-12345',
                clientId: 'client-id-abc',
                clientSecret: 'secret-xyz',
            },
        });

        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(screen.getByText('Participant Created')).toBeInTheDocument();
        });

        expect(screen.getByText('Save these credentials now. They will not be shown again.')).toBeInTheDocument();
        expect(screen.getByText('test-api-key-12345')).toBeInTheDocument();
        expect(screen.getByText('client-id-abc')).toBeInTheDocument();
        expect(screen.getByText('secret-xyz')).toBeInTheDocument();
    });

    it('should close create dialog when Cancel is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(screen.queryByLabelText('Participant ID *')).not.toBeInTheDocument();
        });
    });

    it('should delete participant via menu', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        vi.mocked(httpClient.delete).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });

        const moreButtons = screen.getAllByTestId('MoreVertIcon');
        fireEvent.click(moreButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete'));

        await waitFor(() => {
            expect(httpClient.delete).toHaveBeenCalledWith(
                expect.stringContaining('/api/identity/v1alpha/participants/')
            );
        });
    });

    it('should show snackbar error when delete fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        vi.mocked(httpClient.delete).mockRejectedValueOnce(new Error('Delete failed'));

        const moreButtons = screen.getAllByTestId('MoreVertIcon');
        fireEvent.click(moreButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete'));

        await waitFor(() => {
            expect(screen.getByText('Delete failed')).toBeInTheDocument();
        });
    });

    it('should regenerate token via menu', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockResolvedValueOnce({
            data: { token: 'new-generated-token-abc123' },
        });

        const moreButtons = screen.getAllByTestId('MoreVertIcon');
        fireEvent.click(moreButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Regenerate Token')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Regenerate Token'));

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledWith(
                expect.stringContaining('/token')
            );
        });

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('new-generated-token-abc123');
        });
    });

    it('should show snackbar error when regenerate token fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Token generation failed'));

        const moreButtons = screen.getAllByTestId('MoreVertIcon');
        fireEvent.click(moreButtons[0].closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Regenerate Token')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Regenerate Token'));

        await waitFor(() => {
            expect(screen.getByText('Token generation failed')).toBeInTheDocument();
        });
    });

    it('should handle fetch failure and show empty state', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No Participants Found')).toBeInTheDocument();
        });
    });

    it('should show Deactivated chip for participants with state 2', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        const deactivatedChips = screen.getAllByText('Deactivated');
        expect(deactivatedChips.length).toBeGreaterThanOrEqual(1);
    });

    it('should show DID on participant card', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText(/did:web:example.com:BPNL00000003CRHK/)).toBeInTheDocument();
    });

    it('should show role chips for participants with roles', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should show snackbar error when create fails', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Create Participant')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create Participant'));

        await waitFor(() => {
            expect(screen.getByLabelText('Participant ID *')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Participant ID *'), {
            target: { value: 'BPNL_FAIL' },
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Create failed'));

        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(screen.getByText('Create failed')).toBeInTheDocument();
        });
    });

});
