import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ParticipantSelector from '../../../components/general/ParticipantSelector';

const mockSetActiveParticipantId = vi.fn();
const mockUseParticipant = vi.fn();

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: () => mockUseParticipant(),
}));

const mockParticipants = [
    { participantContextId: 'participant-1', did: 'did:web:example1', state: 1 },
    { participantContextId: 'participant-2', did: 'did:web:example2', state: 0 },
    { participantContextId: 'participant-3', did: 'did:web:example3', state: 2 },
];

describe('ParticipantSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParticipant.mockReturnValue({
            participants: mockParticipants,
            activeParticipantId: 'participant-1',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: false,
        });
    });

    it('should render the selector icon', () => {
        render(<ParticipantSelector />);
        expect(screen.getByTestId('AccountCircleIcon')).toBeInTheDocument();
    });

    it('should open popover on click and show participants', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Active Participant')).toBeInTheDocument();
        expect(screen.getByText('participant-1')).toBeInTheDocument();
        expect(screen.getByText('participant-2')).toBeInTheDocument();
        expect(screen.getByText('participant-3')).toBeInTheDocument();
    });

    it('should display state chips with correct labels', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Deactivated')).toBeInTheDocument();
    });

    it('should call setActiveParticipantId when selecting a participant', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });
        act(() => { screen.getByText('participant-2').click(); });

        expect(mockSetActiveParticipantId).toHaveBeenCalledWith('participant-2');
    });

    it('should show loading message when loading with no participants', () => {
        mockUseParticipant.mockReturnValue({
            participants: [],
            activeParticipantId: '',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: true,
        });

        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Loading participants...')).toBeInTheDocument();
    });

    it('should show empty message when no participants available', () => {
        mockUseParticipant.mockReturnValue({
            participants: [],
            activeParticipantId: '',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: false,
        });

        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('No participants available.')).toBeInTheDocument();
    });
});
