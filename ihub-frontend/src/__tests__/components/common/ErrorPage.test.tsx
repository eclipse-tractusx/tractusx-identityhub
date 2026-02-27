import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../../../components/common/ErrorPage';

describe('ErrorPage', () => {
    it('should render title and message', () => {
        render(<ErrorPage message="Something went wrong" />);
        expect(screen.getByText('An Error Occurred')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render custom title', () => {
        render(<ErrorPage title="Custom Error" message="test" />);
        expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('should render causes when provided', () => {
        render(<ErrorPage message="error" causes={['Cause 1', 'Cause 2']} />);
        expect(screen.getByText('Cause 1')).toBeInTheDocument();
        expect(screen.getByText('Cause 2')).toBeInTheDocument();
        expect(screen.getByText('Possible causes:')).toBeInTheDocument();
    });

    it('should not render causes when empty', () => {
        render(<ErrorPage message="error" causes={[]} />);
        expect(screen.queryByText('Possible causes:')).not.toBeInTheDocument();
    });

    it('should render retry button by default', () => {
        render(<ErrorPage message="error" />);
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should hide retry button when showRefreshButton is false', () => {
        render(<ErrorPage message="error" showRefreshButton={false} />);
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should call onRefresh when retry is clicked', () => {
        const onRefresh = vi.fn();
        render(<ErrorPage message="error" onRefresh={onRefresh} />);
        fireEvent.click(screen.getByText('Retry'));
        expect(onRefresh).toHaveBeenCalledOnce();
    });

    it('should call window.location.reload when no onRefresh provided', () => {
        render(<ErrorPage message="error" />);
        fireEvent.click(screen.getByText('Retry'));
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('should render help text', () => {
        render(<ErrorPage message="error" helpText="Contact support" />);
        expect(screen.getByText('Contact support')).toBeInTheDocument();
    });

    it('should render default help text', () => {
        render(<ErrorPage message="error" />);
        expect(screen.getByText('If the problem persists, please contact your system administrator')).toBeInTheDocument();
    });
});
