import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../../components/general/Header';

const mockLogout = vi.fn();
const mockSetActiveParticipantId = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
    default: vi.fn(() => ({
        isAuthenticated: true,
        user: { firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com', roles: [], permissions: [] },
        logout: mockLogout,
    })),
}));

vi.mock('../../../services/EnvironmentService', () => ({
    getParticipantId: vi.fn(() => 'BPNL00000003CRHK'),
    default: {
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
}));

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: vi.fn(() => ({
        participants: [
            { participantContextId: 'BPNL00000003CRHK', state: 1 },
            { participantContextId: 'BPNL00000003ABCD', state: 1 },
        ],
        activeParticipantId: 'BPNL00000003CRHK',
        setActiveParticipantId: mockSetActiveParticipantId,
        loading: false,
        refresh: vi.fn(),
    })),
}));

function renderHeader() {
    return render(
        <MemoryRouter>
            <Header />
        </MemoryRouter>
    );
}

describe('Header', () => {
    it('should render Identity Hub title', () => {
        renderHeader();
        expect(screen.getByText('Identity Hub')).toBeInTheDocument();
    });

    it('should render the user icon button', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        expect(userButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should open menu on user icon click', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should show active participant ID in menu', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        expect(screen.getByText(/BPNL00000003CRHK/)).toBeInTheDocument();
    });

    it('should show Settings menu item', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have logout button in menu', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should call logout on logout click', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalled();
    });

    it('should render logo with alt text', () => {
        renderHeader();
        const logos = screen.getAllByAltText('Eclipse Tractus-X logo');
        expect(logos.length).toBeGreaterThanOrEqual(1);
    });

    it('should show switch button when multiple participants exist', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        expect(screen.getByTestId('SwapHorizIcon')).toBeInTheDocument();
    });

    it('should show participant list when switch is clicked', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        fireEvent.click(screen.getByTestId('SwapHorizIcon').closest('button')!);
        expect(screen.getByText('BPNL00000003ABCD')).toBeInTheDocument();
    });

    it('should call setActiveParticipantId when a participant is selected', () => {
        renderHeader();
        const userButtons = screen.getAllByLabelText('account of current user');
        fireEvent.click(userButtons[0]);
        fireEvent.click(screen.getByTestId('SwapHorizIcon').closest('button')!);
        fireEvent.click(screen.getByText('BPNL00000003ABCD'));
        expect(mockSetActiveParticipantId).toHaveBeenCalledWith('BPNL00000003ABCD');
    });
});
