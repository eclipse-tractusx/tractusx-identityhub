import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCredentials, getCredentialById, getAllCredentials, deleteCredential, createCredential, updateCredential, requestCredential } from '../../../features/credentials/api';

vi.mock('../../../services/HttpClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../../services/participantUtils', () => ({
    encodeParticipantId: vi.fn((id: string) => btoa(id)),
}));

import httpClient from '../../../services/HttpClient';

const mockCredentials = [
    {
        id: 'cred-1',
        state: 400,
        verifiableCredential: {
            credential: {
                id: 'vc-1',
                type: ['VerifiableCredential', 'MembershipCredential'],
                issuer: { id: 'did:web:issuer.example' },
                issuanceDate: '2025-01-01T00:00:00Z',
                credentialSubject: [{ id: 'did:web:subject.example' }],
            },
        },
    },
];

describe('credentials api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getCredentials should call correct endpoint', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockCredentials });
        const result = await getCredentials('BPNL00000003CRHK');
        expect(httpClient.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/identity/v1alpha/participants/')
        );
        expect(httpClient.get).toHaveBeenCalledWith(
            expect.stringContaining('/credentials')
        );
        expect(result).toEqual(mockCredentials);
    });

    it('getCredentialById should call correct endpoint', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockCredentials[0] });
        const result = await getCredentialById('BPNL00000003CRHK', 'cred-1');
        expect(httpClient.get).toHaveBeenCalledWith(
            expect.stringContaining('/credentials/cred-1')
        );
        expect(result).toEqual(mockCredentials[0]);
    });

    it('getAllCredentials should call credentials endpoint', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockCredentials });
        const result = await getAllCredentials();
        expect(httpClient.get).toHaveBeenCalledWith('/api/identity/v1alpha/credentials');
        expect(result).toEqual(mockCredentials);
    });

    it('deleteCredential should call delete endpoint', async () => {
        vi.mocked(httpClient.delete).mockResolvedValue({});
        await deleteCredential('BPNL00000003CRHK', 'cred-1');
        expect(httpClient.delete).toHaveBeenCalledWith(
            expect.stringContaining('/credentials/cred-1')
        );
    });

    it('createCredential should post to correct endpoint', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({});
        const newCred = { id: 'new-cred' };
        await createCredential('BPNL00000003CRHK', newCred);
        expect(httpClient.post).toHaveBeenCalledWith(
            expect.stringContaining('/credentials'),
            newCred
        );
    });

    it('updateCredential should put to correct endpoint', async () => {
        vi.mocked(httpClient.put).mockResolvedValue({});
        await updateCredential('BPNL00000003CRHK', mockCredentials[0] as any);
        expect(httpClient.put).toHaveBeenCalledWith(
            expect.stringContaining('/credentials'),
            mockCredentials[0]
        );
    });

    it('requestCredential should post to request endpoint', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({});
        const body = { type: 'MembershipCredential' };
        await requestCredential('BPNL00000003CRHK', body);
        expect(httpClient.post).toHaveBeenCalledWith(
            expect.stringContaining('/credentials/request'),
            body
        );
    });
});
