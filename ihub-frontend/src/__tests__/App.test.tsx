import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../assets/styles/main.scss', () => ({}));

vi.mock('../routes', () => ({
    default: () => <div data-testid="app-routes">Mock AppRoutes</div>,
}));

import App from '../App';

describe('App', () => {
    it('should render without crashing', () => {
        render(<App />);
        expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    it('should render the AppRoutes component', () => {
        render(<App />);
        expect(screen.getByText('Mock AppRoutes')).toBeInTheDocument();
    });
});
