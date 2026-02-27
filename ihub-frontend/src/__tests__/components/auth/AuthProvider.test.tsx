import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockIsAuthEnabled = vi.fn(() => false);
const mockInitialize = vi.fn(() => Promise.resolve());
const mockIsAuthenticated = vi.fn(() => false);

vi.mock('../../../services/EnvironmentService', () => ({
    default: {
        isAuthEnabled: () => mockIsAuthEnabled(),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    getParticipantId: vi.fn(() => ''),
    isAuthEnabled: vi.fn(() => false),
}));

vi.mock('../../../services/AuthService', () => ({
    default: {
        initialize: () => mockInitialize(),
        isAuthenticated: () => mockIsAuthenticated(),
    },
}));

vi.mock('../../../components/common/ErrorPage', () => ({
    default: ({ title, message }: { title: string; message: string }) => (
        <div data-testid="error-page">
            <span>{title}</span>
            <span>{message}</span>
        </div>
    ),
}));

import { AuthProvider } from '../../../components/auth/AuthProvider';

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mockIsAuthEnabled.mockReturnValue(false);
        mockInitialize.mockResolvedValue(undefined);
        mockIsAuthenticated.mockReturnValue(false);
    });

    it('should render children when auth is disabled', async () => {
        mockIsAuthEnabled.mockReturnValue(false);
        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should show loading spinner when not yet initialized and has stored auth', () => {
        sessionStorage.setItem('keycloak_authenticated', 'false');
        mockIsAuthEnabled.mockReturnValue(true);
        // Make initialize never resolve so we stay in loading state
        mockInitialize.mockReturnValue(new Promise(() => {}));

        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );

        expect(screen.getByText('Initializing authentication...')).toBeInTheDocument();
        expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('should render children after successful auth initialization', async () => {
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockResolvedValue(undefined);
        mockIsAuthenticated.mockReturnValue(true);

        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
    });

    it('should store keycloak_authenticated in sessionStorage when auth succeeds', async () => {
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockResolvedValue(undefined);
        mockIsAuthenticated.mockReturnValue(true);

        render(
            <AuthProvider>
                <div>Child</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(sessionStorage.getItem('keycloak_authenticated')).toBe('true');
        });
    });

    it('should remove keycloak_authenticated from sessionStorage when not authenticated', async () => {
        sessionStorage.setItem('keycloak_authenticated', 'true');
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockResolvedValue(undefined);
        mockIsAuthenticated.mockReturnValue(false);

        render(
            <AuthProvider>
                <div>Child</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(sessionStorage.getItem('keycloak_authenticated')).toBeNull();
        });
    });

    it('should show error page when initialization fails', async () => {
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockRejectedValue(new Error('Keycloak connection failed'));

        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error-page')).toBeInTheDocument();
        });
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Keycloak connection failed')).toBeInTheDocument();
        expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('should show generic error message for non-Error exceptions', async () => {
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockRejectedValue('something went wrong');

        render(
            <AuthProvider>
                <div>Child</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error-page')).toBeInTheDocument();
        });
        expect(screen.getByText('Authentication initialization failed')).toBeInTheDocument();
    });

    it('should remove keycloak_authenticated from sessionStorage on failure', async () => {
        sessionStorage.setItem('keycloak_authenticated', 'true');
        mockIsAuthEnabled.mockReturnValue(true);
        mockInitialize.mockRejectedValue(new Error('Auth failed'));

        render(
            <AuthProvider>
                <div>Child</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(sessionStorage.getItem('keycloak_authenticated')).toBeNull();
        });
    });

    it('should skip initialization when auth is disabled and render immediately', async () => {
        mockIsAuthEnabled.mockReturnValue(false);

        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
        expect(mockInitialize).not.toHaveBeenCalled();
    });
});
