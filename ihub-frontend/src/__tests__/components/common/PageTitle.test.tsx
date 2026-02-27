import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageTitle from '../../../components/common/PageTitle';

describe('PageTitle', () => {
    it('should render children text', () => {
        render(<PageTitle>Test Title</PageTitle>);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with correct element', () => {
        render(<PageTitle>My Page</PageTitle>);
        const el = screen.getByText('My Page');
        expect(el).toBeInTheDocument();
    });
});
