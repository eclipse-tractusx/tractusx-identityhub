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
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Chip,
    Divider,
    Button,
    Tabs,
    Tab,
    TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { CredentialResource, getStateName } from './types';
import { whiteDialogPaperProps, coloredDialogTitleSx } from '../../theme/darkCardStyles';

interface CredentialDetailModalProps {
    credential: CredentialResource | null;
    open: boolean;
    onClose: () => void;
    onDelete?: (credentialId: string) => void;
    onUpdate?: (credential: CredentialResource) => void;
    onRevoke?: (credentialId: string) => void;
    onSuspend?: (credentialId: string) => void;
    onResume?: (credentialId: string) => void;
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                {value}
            </Typography>
        </Box>
    );
}

const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
    credential,
    open,
    onClose,
    onDelete,
    onUpdate,
    onRevoke,
    onSuspend,
    onResume,
}) => {
    const [tab, setTab] = useState(0);
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editJson, setEditJson] = useState('');
    const [editError, setEditError] = useState<string | null>(null);
    const [revokeConfirm, setRevokeConfirm] = useState(false);

    useEffect(() => {
        if (!open) {
            setEditing(false);
            setEditJson('');
            setEditError(null);
            setTab(0);
            setRevokeConfirm(false);
        }
    }, [open]);

    if (!credential) return null;

    const vc = credential.verifiableCredential.credential;
    const typeName = vc.type.filter(t => t !== 'VerifiableCredential')[0] || 'VerifiableCredential';
    const expired = vc.expirationDate ? new Date(vc.expirationDate) < new Date() : false;
    const issuerId = vc.issuer?.id || '';
    const stateName = getStateName(credential.state);

    const canRevoke = credential.state === 400 || credential.state === 500;
    const canSuspend = credential.state === 400 || credential.state === 500;
    const canResume = credential.state === 700;

    const handleCopyJson = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(vc, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    ...whiteDialogPaperProps.sx,
                    maxHeight: '85vh',
                },
            }}
        >
            <DialogTitle sx={{
                ...coloredDialogTitleSx,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                pr: 14,
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'inherit' }}>
                        {typeName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {expired ? (
                            <Chip label="Expired" size="small" sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.4)',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                            }} />
                        ) : (
                            <Chip label="Active" size="small" sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.4)',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                            }} />
                        )}
                        <Chip label={stateName} size="small" sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.4)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                        }} />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, position: 'absolute', right: 21, top: 21 }}>
                    {onUpdate && !editing && (
                        <IconButton onClick={() => {
                            setEditJson(JSON.stringify(credential, null, 2));
                            setEditing(true);
                            setTab(1);
                        }} sx={{ color: 'inherit', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <EditIcon />
                        </IconButton>
                    )}
                    {onDelete && (
                        <IconButton onClick={() => onDelete(credential.id)}
                            sx={{ color: 'inherit', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <DeleteIcon />
                        </IconButton>
                    )}
                    <IconButton onClick={onClose}
                        sx={{ color: 'inherit', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 1, backgroundColor: '#fff' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { color: 'text.secondary', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                        '& .Mui-selected': { color: 'primary.main' },
                        '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
                    }}>
                    <Tab label="Details" />
                    <Tab label="Raw JSON" />
                </Tabs>
            </Box>

            <Divider />

            <DialogContent sx={{ pt: 2, backgroundColor: '#fff' }}>
                {tab === 0 && (
                    <Box>
                        {(canRevoke || canSuspend || canResume) && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                {canRevoke && onRevoke && !revokeConfirm && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<BlockIcon />}
                                        onClick={() => setRevokeConfirm(true)}
                                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                    >
                                        Revoke
                                    </Button>
                                )}
                                {revokeConfirm && onRevoke && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'error.main', borderRadius: 1, p: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8rem' }}>
                                            Revocation is irreversible. Continue?
                                        </Typography>
                                        <Button size="small" variant="contained" color="error"
                                            onClick={() => { onRevoke(credential.id); setRevokeConfirm(false); }}
                                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                                            Confirm
                                        </Button>
                                        <Button size="small" onClick={() => setRevokeConfirm(false)}
                                            sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                                {canSuspend && onSuspend && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<PauseCircleIcon />}
                                        onClick={() => onSuspend(credential.id)}
                                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                    >
                                        Suspend
                                    </Button>
                                )}
                                {canResume && onResume && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<PlayCircleIcon />}
                                        onClick={() => onResume(credential.id)}
                                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                    >
                                        Resume
                                    </Button>
                                )}
                            </Box>
                        )}

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
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
                                <DetailField label="Data Model Version" value={vc.dataModelVersion} />
                            )}
                            {credential.verifiableCredential.format && (
                                <DetailField label="Format" value={credential.verifiableCredential.format} />
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>Types</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {vc.type.map((t, i) => (
                                <Chip key={i} label={t} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                            ))}
                        </Box>

                        {vc.credentialSchema && vc.credentialSchema.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>Schema</Typography>
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
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>Status</Typography>
                                {vc.credentialStatus.map((status, i) => (
                                    <Box key={i} sx={{ mb: 1 }}>
                                        <DetailField label="Status ID" value={status.id} />
                                        <DetailField label="Status Type" value={status.type} />
                                        {status.statusPurpose && <DetailField label="Purpose" value={status.statusPurpose} />}
                                    </Box>
                                ))}
                            </>
                        )}
                    </Box>
                )}

                {tab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                            {editing && (
                                <>
                                    <Button size="small" onClick={() => { setEditing(false); setEditError(null); }}
                                        sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}>
                                        Cancel
                                    </Button>
                                    <Button size="small" variant="outlined" color="success" onClick={() => {
                                        try {
                                            const parsed = JSON.parse(editJson);
                                            setEditError(null);
                                            onUpdate?.(parsed);
                                            setEditing(false);
                                        } catch {
                                            setEditError('Invalid JSON format');
                                        }
                                    }} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                                        Save
                                    </Button>
                                </>
                            )}
                            <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyJson}
                                sx={{ textTransform: 'none', color: 'primary.main', fontSize: '0.8rem' }}>
                                {copied ? 'Copied!' : 'Copy JSON'}
                            </Button>
                        </Box>
                        {editError && (
                            <Typography variant="body2" sx={{ color: 'error.main', mb: 1, fontSize: '0.8rem' }}>
                                {editError}
                            </Typography>
                        )}
                        {editing ? (
                            <TextField
                                fullWidth multiline minRows={14} maxRows={20} value={editJson}
                                onChange={(e) => { setEditJson(e.target.value); setEditError(null); }}
                                sx={{
                                    backgroundColor: '#fff',
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#fff',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem',
                                        '& fieldset': { borderColor: 'divider' },
                                        '&:hover fieldset': { borderColor: 'primary.main' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                    },
                                }}
                            />
                        ) : (
                            <Box
                                component="pre"
                                sx={{
                                    background: '#f5f5f5',
                                    color: 'text.primary',
                                    p: 2,
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    maxHeight: 400,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                {JSON.stringify(vc, null, 2)}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CredentialDetailModal;
