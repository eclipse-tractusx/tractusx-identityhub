import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

function TestConsumer() {
    const { isVisible, content, showSidebar, hideSidebar, toggleSidebar } = useSidebar();
    return (
        <div>
            <span data-testid="visible">{isVisible ? 'yes' : 'no'}</span>
            <span data-testid="content">{content}</span>
            <button onClick={() => showSidebar(<span>sidebar content</span>)}>show</button>
            <button onClick={() => hideSidebar()}>hide</button>
            <button onClick={() => toggleSidebar()}>toggle</button>
        </div>
    );
}

describe('SidebarContext', () => {
    it('should provide default values', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should show sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('show').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('yes');
        expect(screen.getByText('sidebar content')).toBeInTheDocument();
    });

    it('should hide sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('show').click(); });
        act(() => { screen.getByText('hide').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should toggle sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('toggle').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('yes');
        act(() => { screen.getByText('toggle').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should throw when used outside provider', () => {
        expect(() => render(<TestConsumer />)).toThrow('useSidebar must be used within a SidebarProvider');
    });
});
