import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../components/general/Header', () => ({
    default: () => <div data-testid="header">Mock Header</div>,
}));

vi.mock('../../components/general/Sidebar', () => ({
    default: () => <div data-testid="sidebar">Mock Sidebar</div>,
}));

vi.mock('../../components/auth/ProtectedRoute', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="protected-route">{children}</div>
    ),
}));

const mockIsAuthEnabled = vi.fn(() => false);

vi.mock('../../services/EnvironmentService', () => ({
    isAuthEnabled: () => mockIsAuthEnabled(),
    default: {
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    getParticipantId: vi.fn(() => ''),
}));

vi.mock('../../hooks/useAuth', () => ({
    default: vi.fn(() => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: vi.fn(),
    })),
}));

vi.mock('../../services/HttpClient', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn(),
    },
}));

import MainLayout from '../../layouts/MainLayout';

function renderMainLayout() {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<div data-testid="child-route">Child Content</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe('MainLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsAuthEnabled.mockReturnValue(false);
    });

    it('should render without crashing', () => {
        renderMainLayout();
        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Header component', () => {
        renderMainLayout();
        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Sidebar component', () => {
        renderMainLayout();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should render child route content via Outlet', () => {
        renderMainLayout();
        expect(screen.getByTestId('child-route')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should not wrap content in ProtectedRoute when auth is disabled', () => {
        mockIsAuthEnabled.mockReturnValue(false);
        renderMainLayout();
        expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();
    });

    it('should wrap content in ProtectedRoute when auth is enabled', () => {
        mockIsAuthEnabled.mockReturnValue(true);
        renderMainLayout();
        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render Header and Sidebar inside ProtectedRoute when auth is enabled', () => {
        mockIsAuthEnabled.mockReturnValue(true);
        renderMainLayout();
        const protectedRoute = screen.getByTestId('protected-route');
        expect(protectedRoute).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});
