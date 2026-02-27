import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ParticipantProvider, useParticipant } from '../../contexts/ParticipantContext';
import httpClient from '../../services/HttpClient';
import { invalidateCache } from '../../hooks/useCachedFetch';

vi.mock('../../services/HttpClient', () => ({
    default: { get: vi.fn() },
}));

vi.mock('../../services/EnvironmentService', () => {
    const service = {
        getApiConfig: () => ({ timeout: 30000 }),
        getApiHeaders: () => ({}),
        isAuthEnabled: () => false,
    };
    return { default: service, getIhubBackendUrl: () => '' };
});

const mockParticipants = [
    { participantContextId: 'participant-1', did: 'did:web:example1', state: 1 },
    { participantContextId: 'participant-2', did: 'did:web:example2', state: 0 },
];

function TestConsumer() {
    const { participants, activeParticipantId, setActiveParticipantId, loading } = useParticipant();
    return (
        <div>
            <span data-testid="loading">{loading ? 'yes' : 'no'}</span>
            <span data-testid="count">{participants.length}</span>
            <span data-testid="active">{activeParticipantId}</span>
            {participants.map((p) => (
                <button key={p.participantContextId} onClick={() => setActiveParticipantId(p.participantContextId)}>
                    {p.participantContextId}
                </button>
            ))}
        </div>
    );
}

describe('ParticipantContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateCache('');
        localStorage.clear();
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockParticipants });
    });

    it('should fetch participants and set the first as active', async () => {
        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('2');
            expect(screen.getByTestId('active').textContent).toBe('participant-1');
        });
    });

    it('should allow switching active participant', async () => {
        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('2');
        });

        act(() => { screen.getByText('participant-2').click(); });
        await waitFor(() => {
            expect(screen.getByTestId('active').textContent).toBe('participant-2');
        });
    });

    it('should persist active participant to localStorage', async () => {
        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('2');
        });

        act(() => { screen.getByText('participant-2').click(); });
        expect(localStorage.getItem('ihub-active-participant')).toBe('participant-2');
    });

    it('should restore active participant from localStorage', async () => {
        localStorage.setItem('ihub-active-participant', 'participant-2');

        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('2');
        });
        expect(screen.getByTestId('active').textContent).toBe('participant-2');
    });

    it('should fall back to first participant if stored id is invalid', async () => {
        localStorage.setItem('ihub-active-participant', 'nonexistent');

        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('active').textContent).toBe('participant-1');
        });
    });

    it('should handle empty participant list', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [] });

        render(
            <ParticipantProvider>
                <TestConsumer />
            </ParticipantProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('no');
        });
        expect(screen.getByTestId('count').textContent).toBe('0');
        expect(screen.getByTestId('active').textContent).toBe('');
    });

    it('should throw when useParticipant is used outside provider', () => {
        expect(() => render(<TestConsumer />)).toThrow('useParticipant must be used within a ParticipantProvider');
    });
});
