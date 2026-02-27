import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCredentialDialog from '../../../features/credentials/AddCredentialDialog';

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: vi.fn(() => ({
        participants: [],
        activeParticipantId: 'BPNL00000003CRHK',
        setActiveParticipantId: vi.fn(),
        loading: false,
        refresh: vi.fn(),
    })),
}));

vi.mock('../../../services/EnvironmentService', () => ({
    default: {
        getParticipantId: vi.fn(() => 'BPNL00000003CRHK'),
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    getParticipantId: vi.fn(() => ''),
    isAuthEnabled: vi.fn(() => false),
}));

describe('AddCredentialDialog', () => {
    it('should render dialog when open', () => {
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Add Credential')).toBeInTheDocument();
        expect(screen.getByLabelText('Credential Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Issuer DID')).toBeInTheDocument();
        expect(screen.getByLabelText('Subject DID')).toBeInTheDocument();
        expect(screen.getByLabelText('Holder Identifier (BPN)')).toBeInTheDocument();
        expect(screen.getByLabelText('Expiration Date')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
        render(<AddCredentialDialog open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.queryByText('Add Credential')).not.toBeInTheDocument();
    });

    it('should have disabled Add button when required fields are empty', () => {
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
        const addBtn = screen.getByRole('button', { name: 'Add' });
        expect(addBtn).toBeDisabled();
    });

    it('should keep Add button disabled when only some required fields are filled', () => {
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:issuer.example.com' } });
        // Subject DID still empty
        const addBtn = screen.getByRole('button', { name: 'Add' });
        expect(addBtn).toBeDisabled();
    });

    it('should enable Add button when all required fields are filled with valid DIDs', () => {
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:issuer.example.com' } });
        fireEvent.change(screen.getByLabelText('Subject DID'), { target: { value: 'did:web:subject.example.com' } });
        const addBtn = screen.getByRole('button', { name: 'Add' });
        expect(addBtn).toBeEnabled();
    });

    it('should keep Add button disabled when DID format is invalid', () => {
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'not-a-did' } });
        fireEvent.change(screen.getByLabelText('Subject DID'), { target: { value: 'did:web:subject.example.com' } });
        const addBtn = screen.getByRole('button', { name: 'Add' });
        expect(addBtn).toBeDisabled();
    });

    it('should call onSubmit with JSON string when form is filled and Add clicked', () => {
        const onSubmit = vi.fn();
        // Mock crypto.randomUUID for deterministic output
        const mockUUID = '12345678-1234-1234-1234-123456789abc';
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={onSubmit} />);
        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:issuer.example.com' } });
        fireEvent.change(screen.getByLabelText('Subject DID'), { target: { value: 'did:web:subject.example.com' } });
        fireEvent.change(screen.getByLabelText('Holder Identifier (BPN)'), { target: { value: 'BPNL00000003CRHK' } });

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(onSubmit).toHaveBeenCalledOnce();
        const submittedJson = JSON.parse(onSubmit.mock.calls[0][0]);
        expect(submittedJson.id).toBe(mockUUID);
        expect(submittedJson.participantContextId).toBe('BPNL00000003CRHK');
        expect(submittedJson.verifiableCredentialContainer.credential.type).toEqual([
            'VerifiableCredential',
            'MembershipCredential',
        ]);
        expect(submittedJson.verifiableCredentialContainer.credential.issuer).toBe('did:web:issuer.example.com');
        expect(submittedJson.verifiableCredentialContainer.credential.credentialSubject[0].id).toBe(
            'did:web:subject.example.com',
        );
        expect(submittedJson.verifiableCredentialContainer.credential.credentialSubject[0].holderIdentifier).toBe(
            'BPNL00000003CRHK',
        );

        vi.restoreAllMocks();
    });

    it('should call onClose when Cancel clicked', () => {
        const onClose = vi.fn();
        render(<AddCredentialDialog open={true} onClose={onClose} onSubmit={vi.fn()} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('should reset form fields after successful submission', () => {
        const onSubmit = vi.fn();
        render(<AddCredentialDialog open={true} onClose={vi.fn()} onSubmit={onSubmit} />);

        fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'MembershipCredential' } });
        fireEvent.change(screen.getByLabelText('Issuer DID'), { target: { value: 'did:web:issuer.example.com' } });
        fireEvent.change(screen.getByLabelText('Subject DID'), { target: { value: 'did:web:subject.example.com' } });

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect((screen.getByLabelText('Credential Type') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('Issuer DID') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('Subject DID') as HTMLInputElement).value).toBe('');
    });
});
