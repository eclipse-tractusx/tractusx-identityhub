import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CredentialDetailModal from '../../../features/credentials/CredentialDetailModal';
import type { CredentialResource } from '../../../features/credentials/types';

const mockCredential: CredentialResource = {
    id: 'cred-123',
    state: 400,
    participantContextId: 'BPNL00000003CRHK',
    holderId: 'did:web:holder.example',
    issuerId: 'did:web:issuer-did.example',
    verifiableCredential: {
        format: 'JWT',
        credential: {
            id: 'vc-1',
            type: ['VerifiableCredential', 'MembershipCredential'],
            issuer: { id: 'did:web:issuer.example.com' },
            issuanceDate: '2025-01-01T00:00:00Z',
            expirationDate: '2030-12-31T00:00:00Z',
            credentialSubject: [{ id: 'did:web:subject.example.com', holderIdentifier: 'holder-1' }],
            credentialSchema: [{ id: 'https://schema.example/1', type: 'JsonSchema' }],
            credentialStatus: [{ id: 'https://status.example/1', type: 'StatusList', statusPurpose: 'revocation' }],
            dataModelVersion: '1.0.0',
        },
    },
};

describe('CredentialDetailModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    it('should return null when credential is null', () => {
        const { container } = render(
            <CredentialDetailModal credential={null} open={true} onClose={vi.fn()} />
        );
        expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('should render credential type in title', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        // MembershipCredential appears in title and as a type chip
        const elements = screen.getAllByText('MembershipCredential');
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show Active chip for non-expired credential', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Expired chip for expired credential', () => {
        const expired = {
            ...mockCredential,
            verifiableCredential: {
                ...mockCredential.verifiableCredential,
                credential: {
                    ...mockCredential.verifiableCredential.credential,
                    expirationDate: '2020-01-01T00:00:00Z',
                },
            },
        };
        render(<CredentialDetailModal credential={expired} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should show state chip', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('ISSUED')).toBeInTheDocument();
    });

    it('should show Details tab by default', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('Credential ID')).toBeInTheDocument();
        expect(screen.getByText('cred-123')).toBeInTheDocument();
    });

    it('should show issuer details', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('did:web:issuer.example.com')).toBeInTheDocument();
    });

    it('should show subject details', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('did:web:subject.example.com')).toBeInTheDocument();
    });

    it('should show holder identifier', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('holder-1')).toBeInTheDocument();
    });

    it('should show participant context', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('BPNL00000003CRHK')).toBeInTheDocument();
    });

    it('should show schema section', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('Schema')).toBeInTheDocument();
    });

    it('should show status section', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should switch to Raw JSON tab', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Raw JSON'));
        expect(screen.getByText('Copy JSON')).toBeInTheDocument();
    });

    it('should show delete button when onDelete provided', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onDelete={vi.fn()} />
        );
        const deleteBtn = screen.getByTestId('DeleteIcon');
        expect(deleteBtn).toBeInTheDocument();
    });

    it('should call onDelete when delete clicked', () => {
        const onDelete = vi.fn();
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onDelete={onDelete} />
        );
        const deleteBtn = screen.getByTestId('DeleteIcon').closest('button')!;
        fireEvent.click(deleteBtn);
        expect(onDelete).toHaveBeenCalledWith('cred-123');
    });

    it('should show edit button when onUpdate provided', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={vi.fn()} />
        );
        expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={onClose} />
        );
        const closeBtn = screen.getByTestId('CloseIcon').closest('button')!;
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('should show format field', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('JWT')).toBeInTheDocument();
    });

    it('should show data model version', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={vi.fn()} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // In edit mode, we should see the Save and Cancel buttons
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should switch to Raw JSON tab when entering edit mode', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={vi.fn()} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // Should be on Raw JSON tab with Save button visible
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Copy JSON')).toBeInTheDocument();
    });

    it('should call onUpdate with parsed JSON when Save is clicked with valid JSON', () => {
        const onUpdate = vi.fn();
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={onUpdate} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // Save with the pre-populated JSON (which is valid)
        fireEvent.click(screen.getByText('Save'));

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'cred-123' }));
    });

    it('should show error when Save is clicked with invalid JSON', () => {
        const onUpdate = vi.fn();
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={onUpdate} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // Find the textarea in the edit mode and change to invalid JSON
        const textareas = document.querySelectorAll('textarea');
        const editTextarea = Array.from(textareas).find((ta) => ta.value.includes('cred-123'));
        if (editTextarea) {
            fireEvent.change(editTextarea, { target: { value: '{invalid json here}' } });
        }

        fireEvent.click(screen.getByText('Save'));

        expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should return to view mode when Cancel is clicked in edit mode', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={vi.fn()} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        expect(screen.getByText('Save')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));

        // After cancel, Save should not be visible anymore
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('should copy JSON to clipboard when Copy JSON button is clicked', async () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);

        fireEvent.click(screen.getByText('Raw JSON'));

        fireEvent.click(screen.getByText('Copy JSON'));

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('"MembershipCredential"')
            );
        });
    });

    it('should show "Copied!" text after copying JSON', async () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);

        fireEvent.click(screen.getByText('Raw JSON'));
        fireEvent.click(screen.getByText('Copy JSON'));

        await waitFor(() => {
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });
    });

    it('should not show edit button when onUpdate is not provided', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />
        );
        expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
    });

    it('should not show delete button when onDelete is not provided', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />
        );
        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });

    it('should hide edit button while in editing mode', () => {
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={vi.fn()} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // Edit icon should be hidden during edit mode
        expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
    });

    it('should clear edit error when JSON is modified in edit mode', () => {
        const onUpdate = vi.fn();
        render(
            <CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} onUpdate={onUpdate} />
        );

        const editBtn = screen.getByTestId('EditIcon').closest('button')!;
        fireEvent.click(editBtn);

        // Set invalid JSON and trigger save
        const textareas = document.querySelectorAll('textarea');
        const editTextarea = Array.from(textareas).find((ta) => ta.value.includes('cred-123'));
        if (editTextarea) {
            fireEvent.change(editTextarea, { target: { value: '{bad json}' } });
        }

        fireEvent.click(screen.getByText('Save'));
        expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();

        // Modify the JSON -- error should clear
        if (editTextarea) {
            fireEvent.change(editTextarea, { target: { value: '{"id": "fixed"}' } });
        }

        expect(screen.queryByText('Invalid JSON format')).not.toBeInTheDocument();
    });

    it('should show holder DID field', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('did:web:holder.example')).toBeInTheDocument();
    });

    it('should show issuer DID field', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('did:web:issuer-did.example')).toBeInTheDocument();
    });

    it('should show all type chips', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('VerifiableCredential')).toBeInTheDocument();
        const membershipElements = screen.getAllByText('MembershipCredential');
        expect(membershipElements.length).toBeGreaterThanOrEqual(2); // title + chip
    });

    it('should show schema details', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('https://schema.example/1')).toBeInTheDocument();
        expect(screen.getByText('JsonSchema')).toBeInTheDocument();
    });

    it('should show status details including purpose', () => {
        render(<CredentialDetailModal credential={mockCredential} open={true} onClose={vi.fn()} />);
        expect(screen.getByText('https://status.example/1')).toBeInTheDocument();
        expect(screen.getByText('StatusList')).toBeInTheDocument();
        expect(screen.getByText('revocation')).toBeInTheDocument();
    });
});
