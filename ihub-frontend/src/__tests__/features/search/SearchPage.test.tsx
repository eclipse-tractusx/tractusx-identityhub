import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../../../features/search/SearchPage';
import httpClient from '../../../services/HttpClient';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

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

const mockSearchResults = [
    {
        id: 'cred-001',
        state: 400,
        verifiableCredential: {
            format: 'JWT',
            credential: {
                id: 'vc-1',
                type: ['VerifiableCredential', 'MembershipCredential'],
                issuer: { id: 'did:web:issuer.example.com' },
                issuanceDate: '2025-01-01T00:00:00Z',
                credentialSubject: [{ id: 'did:web:subject.example.com' }],
            },
        },
    },
    {
        id: 'cred-002',
        state: 200,
        verifiableCredential: {
            format: 'JSON_LD',
            credential: {
                id: 'vc-2',
                type: ['VerifiableCredential', 'BpnCredential'],
                issuer: { id: 'did:web:issuer2.example.com' },
                issuanceDate: '2025-06-15T00:00:00Z',
                credentialSubject: [{ id: 'did:web:subject2.example.com' }],
            },
        },
    },
];

const renderPage = () => {
    return render(
        <MemoryRouter>
            <SearchPage />
        </MemoryRouter>
    );
};

describe('SearchPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page title "Search"', () => {
        renderPage();
        expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should render search input with placeholder', () => {
        renderPage();
        expect(
            screen.getByPlaceholderText('Search credentials, key pairs, DIDs...')
        ).toBeInTheDocument();
    });

    it('should show initial message before search', () => {
        renderPage();
        expect(
            screen.getByText('Search across credentials, key pairs, and DIDs in the Identity Hub.')
        ).toBeInTheDocument();
    });

    it('should not trigger search when query is empty and Enter is pressed', async () => {
        renderPage();
        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(httpClient.get).not.toHaveBeenCalled();
        });
        expect(screen.getByText('Search across credentials, key pairs, and DIDs in the Identity Hub.')).toBeInTheDocument();
    });

    it('should trigger search on Enter key and render result cards', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: mockSearchResults });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'membership' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(httpClient.get).toHaveBeenCalledWith('/api/identity/v1alpha/credentials', {
                params: { query: 'membership' },
            });
        });

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });
        expect(screen.getByText('BpnCredential')).toBeInTheDocument();
        expect(screen.getByText('cred-001')).toBeInTheDocument();
        expect(screen.getByText('cred-002')).toBeInTheDocument();
        expect(screen.getByText('2 results found')).toBeInTheDocument();
    });

    it('should show "No Results" when search returns empty array', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'nonexistent' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('No Results')).toBeInTheDocument();
        });
    });

    it('should show error snackbar when search fails', async () => {
        vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('Network error'));
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('should show generic error message for non-Error exceptions', async () => {
        vi.mocked(httpClient.get).mockRejectedValueOnce('something went wrong');
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('Search failed')).toBeInTheDocument();
        });
    });

    it('should navigate to credential detail when result card is clicked', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: mockSearchResults });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'membership' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('MembershipCredential'));
        expect(mockNavigate).toHaveBeenCalledWith(`/credentials/${encodeURIComponent('cred-001')}`);
    });

    it('should show state chip on result cards', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: mockSearchResults });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('ISSUED')).toBeInTheDocument();
        });
        expect(screen.getByText('REQUESTED')).toBeInTheDocument();
    });

    it('should show "Searching..." text while loading', async () => {
        let resolvePromise: (value: unknown) => void;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        vi.mocked(httpClient.get).mockReturnValueOnce(pendingPromise as any);
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('Searching...')).toBeInTheDocument();
        });

        resolvePromise!({ data: [] });
    });

    it('should handle non-array response data gracefully', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: 'not-an-array' });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('No Results')).toBeInTheDocument();
        });
    });

    it('should not trigger search on non-Enter key presses', () => {
        renderPage();
        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

        expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should show singular "result" text for single result', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [mockSearchResults[0]] });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('1 result found')).toBeInTheDocument();
        });
    });

    it('should trim query whitespace before searching', async () => {
        vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [] });
        renderPage();

        const input = screen.getByPlaceholderText('Search credentials, key pairs, DIDs...');
        fireEvent.change(input, { target: { value: '  membership  ' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(httpClient.get).toHaveBeenCalledWith('/api/identity/v1alpha/credentials', {
                params: { query: 'membership' },
            });
        });
    });
});
