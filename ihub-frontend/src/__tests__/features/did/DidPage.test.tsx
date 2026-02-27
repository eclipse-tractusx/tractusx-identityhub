import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DidPage from '../../../features/did/DidPage';
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

const mockDids = [
    {
        id: 'did:web:example.com:BPNL00000003CRHK',
        '@context': ['https://www.w3.org/ns/did/v1'],
        service: [
            {
                id: 'svc-1',
                type: 'CredentialService',
                serviceEndpoint: 'https://example.com/svc',
            },
        ],
        verificationMethod: [
            {
                id: 'did:web:example.com#key-1',
                type: 'JsonWebKey2020',
                controller: 'did:web:example.com',
            },
        ],
        authentication: ['did:web:example.com#key-1'],
    },
];

const mockDidsUnpublished = [
    {
        id: 'did:web:example.com:BPNL00000003UNPB',
        '@context': ['https://www.w3.org/ns/did/v1'],
        service: [],
        verificationMethod: [
            {
                id: 'did:web:example.com#key-2',
                type: 'JsonWebKey2020',
                controller: 'did:web:example.com',
            },
        ],
        authentication: ['did:web:example.com#key-2'],
    },
];

const renderPage = () => {
    return render(
        <MemoryRouter>
            <DidPage />
        </MemoryRouter>
    );
};

/**
 * Helper to set up mock httpClient.post calls for fetching DIDs.
 * First call returns the DID documents (query), subsequent calls return per-DID state.
 */
function setupFetchMocks(dids: typeof mockDids | typeof mockDidsUnpublished, states: string[]) {
    const stateMap: Record<string, string> = {};
    dids.forEach((d, i) => {
        stateMap[d.id] = states[i] || 'GENERATED';
    });
    vi.mocked(httpClient.post).mockImplementation(async (url: string, body?: unknown) => {
        if (typeof url === 'string' && url.includes('/dids/query')) return { data: dids };
        if (typeof url === 'string' && url.includes('/dids/state')) {
            const did = (body as { did?: string })?.did || '';
            return { data: stateMap[did] || 'UNKNOWN' };
        }
        return { data: [] };
    });
}

async function openMoreVertMenu() {
    const moreVertIcon = screen.getAllByTestId('MoreVertIcon')[0];
    fireEvent.click(moreVertIcon.closest('button')!);
}

describe('DidPage', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(async () => {
        invalidateCache('');
        // Flush pending async operations from previous test components
        await new Promise((r) => setTimeout(r, 0));
        vi.clearAllMocks();
    });

    it('should render page title "DID Management"', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('DID Management')).toBeInTheDocument();
        });
    });

    it('should show empty state when no DIDs', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No DIDs Found')).toBeInTheDocument();
        });
    });

    it('should render DID cards after successful fetch with full DID document data', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('Verification Methods')).toBeInTheDocument();
        expect(screen.getByText('Service Endpoints')).toBeInTheDocument();
    });

    it('should render service endpoint details in DID card', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText('Service Endpoints')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Unpublish button on published DID', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('UnpublishedIcon')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('PublishIcon')).not.toBeInTheDocument();
    });

    it('should show Publish button on unpublished DID', async () => {
        setupFetchMocks(mockDidsUnpublished, ['GENERATED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('PublishIcon')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('UnpublishedIcon')).not.toBeInTheDocument();
    });

    it('should call handlePublish when Publish button is clicked', async () => {
        setupFetchMocks(mockDidsUnpublished, ['GENERATED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('PublishIcon')).toBeInTheDocument();
        });

        // Use persistent mock to handle all async operations (publish, refetch, state queries)
        vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('/dids/publish')) return { data: {} };
            if (typeof url === 'string' && url.includes('/dids/query')) return { data: mockDidsUnpublished };
            if (typeof url === 'string' && url.includes('/dids/state')) return { data: 'PUBLISHED' };
            return { data: [] };
        });

        fireEvent.click(screen.getByTestId('PublishIcon').closest('button')!);

        await waitFor(() => {
            expect(vi.mocked(httpClient.post)).toHaveBeenCalledWith(
                expect.stringContaining('/dids/publish'),
                { did: 'did:web:example.com:BPNL00000003UNPB' }
            );
        });
    });

    it('should call handleUnpublish when Unpublish button is clicked', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('UnpublishedIcon')).toBeInTheDocument();
        });

        // Use persistent mock to handle all async operations (unpublish, refetch, state queries)
        vi.mocked(httpClient.post).mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('/dids/unpublish')) return { data: {} };
            if (typeof url === 'string' && url.includes('/dids/query')) return { data: mockDids };
            if (typeof url === 'string' && url.includes('/dids/state')) return { data: 'GENERATED' };
            return { data: [] };
        });

        fireEvent.click(screen.getByTestId('UnpublishedIcon').closest('button')!);

        await waitFor(() => {
            expect(vi.mocked(httpClient.post)).toHaveBeenCalledWith(
                expect.stringContaining('/dids/unpublish'),
                { did: 'did:web:example.com:BPNL00000003CRHK' }
            );
        });
    });

    it('should open add endpoint dialog when add menu item is clicked', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Add Endpoint'));

        await waitFor(() => {
            expect(screen.getByText('Add Service Endpoint')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Service ID')).toBeInTheDocument();
        expect(screen.getByLabelText('Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Endpoint URL')).toBeInTheDocument();
    });

    it('should open remove endpoint dialog when remove menu item is clicked', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Manage Endpoints'));

        await waitFor(() => {
            expect(screen.getByText('svc-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('DeleteIcon').closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Remove Service Endpoint')).toBeInTheDocument();
        });

        expect(screen.getAllByText(/svc-1/).length).toBeGreaterThanOrEqual(1);
    });

    it('should open replace endpoint dialog when edit menu item is clicked', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Manage Endpoints'));

        await waitFor(() => {
            expect(screen.getByText('svc-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('EditIcon').closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Replace Service Endpoint')).toBeInTheDocument();
        });
    });

    it('should close endpoint dialog when Cancel is clicked', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Add Endpoint'));

        await waitFor(() => {
            expect(screen.getByText('Add Service Endpoint')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(screen.queryByText('Add Service Endpoint')).not.toBeInTheDocument();
        });
    });

    it('should handle fetch error gracefully', async () => {
        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Network failure'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No DIDs Found')).toBeInTheDocument();
        });
    });

    it('should handle DID state query failure gracefully (fallback to GENERATED)', async () => {
        vi.mocked(httpClient.post)
            .mockResolvedValueOnce({ data: mockDids }) // query succeeds
            .mockRejectedValueOnce(new Error('State query failed')); // state fails
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        expect(screen.getByText('GENERATED')).toBeInTheDocument();
    });

    it('should show snackbar error when publish fails', async () => {
        setupFetchMocks(mockDidsUnpublished, ['GENERATED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('PublishIcon')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Publish failed'));

        fireEvent.click(screen.getByTestId('PublishIcon').closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Publish failed')).toBeInTheDocument();
        });
    });

    it('should show snackbar error when unpublish fails', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('UnpublishedIcon')).toBeInTheDocument();
        });

        vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Unpublish failed'));

        fireEvent.click(screen.getByTestId('UnpublishedIcon').closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Unpublish failed')).toBeInTheDocument();
        });
    });

    it('should call handleRemoveEndpoint when Remove is confirmed', async () => {
        setupFetchMocks(mockDids, ['PUBLISHED']);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('did:web:example.com:BPNL00000003CRHK')).toBeInTheDocument();
        });

        openMoreVertMenu();
        fireEvent.click(screen.getByText('Manage Endpoints'));

        await waitFor(() => {
            expect(screen.getByText('svc-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('DeleteIcon').closest('button')!);

        await waitFor(() => {
            expect(screen.getByText('Remove Service Endpoint')).toBeInTheDocument();
        });

        vi.mocked(httpClient.delete).mockResolvedValueOnce({ data: {} });
        vi.mocked(httpClient.post)
            .mockResolvedValueOnce({ data: mockDids })
            .mockResolvedValueOnce({ data: 'PUBLISHED' });

        fireEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
            expect(httpClient.delete).toHaveBeenCalledWith(
                expect.stringContaining('/endpoints?serviceId=')
            );
        });
    });
});
