/********************************************************************************
 * Eclipse Tractus-X - Identity Hub Frontend
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Chip,
    CircularProgress,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CredentialResource, getStateName } from './types';
import { getCredentialById } from './api';
import { useParticipant } from '../../contexts/ParticipantContext';
import { cardSx, accentColors, jsonPreSx, chipTransparentBg } from '../../theme/darkCardStyles';

const CredentialDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { activeParticipantId } = useParticipant();

    const participantId = searchParams.get('participant') || activeParticipantId;

    const [credential, setCredential] = useState<CredentialResource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCredential = async () => {
            if (!id || !participantId) return;
            setLoading(true);
            try {
                const data = await getCredentialById(participantId, id);
                setCredential(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load credential');
            } finally {
                setLoading(false);
            }
        };
        fetchCredential();
    }, [id, participantId]);

    const handleCopyJson = async () => {
        if (!credential) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(credential.verifiableCredential.credential, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
                <CircularProgress sx={{ color: accentColors.brandLightBlue }} />
            </Box>
        );
    }

    if (error || !credential) {
        return (
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/credentials')}
                    sx={{ color: accentColors.brandText, mb: 2, textTransform: 'none' }}>
                    Back to Credentials
                </Button>
                <Typography variant="h6" sx={{ color: '#FF5A5A' }}>
                    {error || 'Credential not found'}
                </Typography>
            </Box>
        );
    }

    const vc = credential.verifiableCredential.credential;
    const typeName = vc.type.filter(t => t !== 'VerifiableCredential')[0] || 'VerifiableCredential';
    const expired = vc.expirationDate ? new Date(vc.expirationDate) < new Date() : false;
    const issuerId = vc.issuer?.id || '';
    const stateName = getStateName(credential.state);

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/credentials')}
                sx={{ color: accentColors.brandText, mb: 3, textTransform: 'none' }}>
                Back to Credentials
            </Button>

            <Paper sx={{ ...cardSx, p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: accentColors.brandText }}>
                            {typeName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {expired ? (
                                <Chip label="Expired" size="small" sx={chipTransparentBg('#FF5A5A')} />
                            ) : (
                                <Chip label="Active" size="small" sx={chipTransparentBg('#A8C556')} />
                            )}
                            <Chip label={stateName} size="small" variant="outlined"
                                sx={{ borderColor: accentColors.brandBorder, color: accentColors.brandTextMuted }} />
                            {vc.type.map((t) => (
                                <Chip key={t} label={t} size="small" variant="outlined"
                                    sx={{ borderColor: accentColors.brandBorder, color: accentColors.brandTextMuted }} />
                            ))}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: accentColors.brandBorder }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <DetailField label="Credential ID" value={credential.id} />
                    <DetailField label="Issuer" value={issuerId} />
                    {vc.credentialSubject?.[0] && (
                        <DetailField label="Subject ID" value={vc.credentialSubject[0].id} />
                    )}
                    {vc.credentialSubject?.[0]?.holderIdentifier && (
                        <DetailField label="Holder" value={vc.credentialSubject[0].holderIdentifier} />
                    )}
                    <DetailField label="Issuance Date" value={new Date(vc.issuanceDate).toLocaleString()} />
                    {vc.expirationDate && (
                        <DetailField label="Expiration Date" value={new Date(vc.expirationDate).toLocaleString()} />
                    )}
                    {credential.participantContextId && (
                        <DetailField label="Participant Context" value={credential.participantContextId} />
                    )}
                    {credential.holderId && (
                        <DetailField label="Holder DID" value={credential.holderId} />
                    )}
                    {credential.issuerId && (
                        <DetailField label="Issuer DID" value={credential.issuerId} />
                    )}
                    {vc.dataModelVersion && (
                        <DetailField label="Data Model" value={vc.dataModelVersion} />
                    )}
                    {credential.verifiableCredential.format && (
                        <DetailField label="Format" value={credential.verifiableCredential.format} />
                    )}
                </Box>

                {vc.credentialSchema && vc.credentialSchema.length > 0 && (
                    <>
                        <Divider sx={{ my: 2, borderColor: accentColors.brandBorder }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: accentColors.brandLightBlue }}>Schema</Typography>
                        {vc.credentialSchema.map((schema, i) => (
                            <Box key={i} sx={{ mb: 1 }}>
                                <DetailField label="Schema ID" value={schema.id} />
                                <DetailField label="Schema Type" value={schema.type} />
                            </Box>
                        ))}
                    </>
                )}

                {vc.credentialStatus && vc.credentialStatus.length > 0 && (
                    <>
                        <Divider sx={{ my: 2, borderColor: accentColors.brandBorder }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: accentColors.brandLightBlue }}>Status</Typography>
                        {vc.credentialStatus.map((status, i) => (
                            <Box key={i} sx={{ mb: 1 }}>
                                <DetailField label="Status ID" value={status.id} />
                                <DetailField label="Status Type" value={status.type} />
                                {status.statusPurpose && <DetailField label="Purpose" value={status.statusPurpose} />}
                            </Box>
                        ))}
                    </>
                )}
            </Paper>

            <Paper sx={{ ...cardSx, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: accentColors.brandText }}>
                        Raw Credential JSON
                    </Typography>
                    <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyJson}
                        sx={{ textTransform: 'none', color: accentColors.brandLightBlue }}>
                        {copied ? 'Copied!' : 'Copy JSON'}
                    </Button>
                </Box>
                <Box
                    component="pre"
                    sx={{
                        ...jsonPreSx,
                        maxHeight: 500,
                    }}
                >
                    {JSON.stringify(vc, null, 2)}
                </Box>
            </Paper>
        </Box>
    );
};

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: accentColors.brandLightBlue, fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', color: accentColors.brandText }}>
                {value}
            </Typography>
        </Box>
    );
}

export default CredentialDetailPage;
