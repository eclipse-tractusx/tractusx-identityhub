import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CredentialCard from '../../../features/credentials/CredentialCard';
import type { CredentialResource } from '../../../features/credentials/types';

const baseCredential: CredentialResource = {
    id: 'cred-123-abc-def',
    state: 400,
    verifiableCredential: {
        credential: {
            id: 'vc-1',
            type: ['VerifiableCredential', 'MembershipCredential'],
            issuer: { id: 'did:web:issuer.example.com' },
            issuanceDate: '2025-01-01T00:00:00Z',
            credentialSubject: [{ id: 'did:web:subject.example.com' }],
        },
    },
};

describe('CredentialCard', () => {
    it('should render credential type name', () => {
        render(<CredentialCard credential={baseCredential} onViewDetail={vi.fn()} />);
        expect(screen.getByText('MembershipCredential')).toBeInTheDocument();
    });

    it('should show state chip for non-expired credential', () => {
        render(<CredentialCard credential={baseCredential} onViewDetail={vi.fn()} />);
        expect(screen.getByText('ISSUED')).toBeInTheDocument();
    });

    it('should show Expired chip for expired credential', () => {
        const expired = {
            ...baseCredential,
            verifiableCredential: {
                credential: {
                    ...baseCredential.verifiableCredential.credential,
                    expirationDate: '2020-01-01T00:00:00Z',
                },
            },
        };
        render(<CredentialCard credential={expired} onViewDetail={vi.fn()} />);
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should show state chip', () => {
        render(<CredentialCard credential={baseCredential} onViewDetail={vi.fn()} />);
        expect(screen.getByText('ISSUED')).toBeInTheDocument();
    });

    it('should show holder identifier', () => {
        render(<CredentialCard credential={baseCredential} onViewDetail={vi.fn()} />);
        expect(screen.getByText('Holder')).toBeInTheDocument();
        expect(screen.getByText(/did:web:subject.example.com/)).toBeInTheDocument();
    });

    it('should show expires section', () => {
        render(<CredentialCard credential={baseCredential} onViewDetail={vi.fn()} />);
        expect(screen.getByText('Expires')).toBeInTheDocument();
        expect(screen.getByText('No expiration')).toBeInTheDocument();
    });

    it('should call onViewDetail when card clicked', () => {
        const onViewDetail = vi.fn();
        const { container } = render(<CredentialCard credential={baseCredential} onViewDetail={onViewDetail} />);
        const card = container.querySelector('.custom-card')!;
        fireEvent.click(card);
        expect(onViewDetail).toHaveBeenCalledWith('cred-123-abc-def');
    });

    it('should call onViewDetail when card is clicked', () => {
        const onViewDetail = vi.fn();
        const { container } = render(<CredentialCard credential={baseCredential} onViewDetail={onViewDetail} />);
        const card = container.querySelector('.custom-card')!;
        fireEvent.click(card);
        expect(onViewDetail).toHaveBeenCalledWith('cred-123-abc-def');
    });

    it('should show VerifiableCredential when no other types', () => {
        const vcOnly = {
            ...baseCredential,
            verifiableCredential: {
                credential: {
                    ...baseCredential.verifiableCredential.credential,
                    type: ['VerifiableCredential'],
                },
            },
        };
        render(<CredentialCard credential={vcOnly} onViewDetail={vi.fn()} />);
        expect(screen.getByText('VerifiableCredential')).toBeInTheDocument();
    });

    it('should show expiration date when present', () => {
        const withExpiry = {
            ...baseCredential,
            verifiableCredential: {
                credential: {
                    ...baseCredential.verifiableCredential.credential,
                    expirationDate: '2030-12-31T00:00:00Z',
                },
            },
        };
        render(<CredentialCard credential={withExpiry} onViewDetail={vi.fn()} />);
        expect(screen.getByText('Expires')).toBeInTheDocument();
        // The date is formatted via toLocaleDateString()
        expect(screen.getByText(new Date('2030-12-31T00:00:00Z').toLocaleDateString())).toBeInTheDocument();
    });
});
