/********************************************************************************
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Snackbar,
    Alert,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid2,
    Menu,
    FormControlLabel,
    Checkbox,
    TablePagination,
} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MoreVert from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import httpClient from '../../services/HttpClient';
import { encodeParticipantId } from '../../services/participantUtils';
import { useParticipant } from '../../contexts/ParticipantContext';
import { paletteDefinitions } from '../../theme/palette';
import { useCachedList } from '../../hooks/useCachedFetch';
import {
    accentColors,
    emptyStateSx,
    whiteDialogPaperProps,
    coloredDialogTitleSx,
    dialogCloseButtonSx,
    whiteDialogContentSx,
    whiteDialogActionsSx,
    dialogCancelBtnSx,
    dialogSubmitBtnSx,
} from '../../theme/darkCardStyles';

interface KeyPairResource {
    id: string;
    keyId: string;
    participantContextId?: string;
    keyContext?: string;
    state?: number;
    defaultPair?: boolean;
    serializedPublicKey?: string;
    privateKeyAlias?: string;
    groupName?: string | null;
    useDuration?: number;
    rotationDuration?: number;
    timestamp?: number;
}

const KEY_STATE_MAP: Record<number, { label: string; color: string; bg: string }> = Object.fromEntries(
    Object.entries(paletteDefinitions.keyState).map(([key, val]) => [
        Number(key),
        val as { label: string; color: string; bg: string },
    ])
);

const API_BASE = '/api/identity/v1alpha';

const KeyPairsPage: React.FC = () => {
    const { activeParticipantId } = useParticipant();
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const getPid = useCallback(
        () => encodeURIComponent(encodeParticipantId(activeParticipantId)),
        [activeParticipantId]
    );

    const fetchKeyPairsList = useCallback(async (): Promise<KeyPairResource[]> => {
        const response = await httpClient.get(`${API_BASE}/participants/${getPid()}/keypairs`);
        return Array.isArray(response.data) ? response.data : [];
    }, [getPid]);

    const { data: keyPairs, loading, error, refresh: fetchKeyPairs } = useCachedList<KeyPairResource>(
        `keypairs-${activeParticipantId}`,
        fetchKeyPairsList,
    );

    useEffect(() => {
        if (error) setSnackbar({ message: error, severity: 'error' });
    }, [error]);

    // Pagination state
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const handleChangePage = (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const visibleKeyPairs = useMemo(() => {
        return [...keyPairs].slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, keyPairs]);

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [newKeyId, setNewKeyId] = useState('');
    const [newPrivateKeyAlias, setNewPrivateKeyAlias] = useState('');
    const [makeDefault, setMakeDefault] = useState(false);
    const [creating, setCreating] = useState(false);

    // Rotate dialog state
    const [rotateOpen, setRotateOpen] = useState(false);
    const [rotateKeyId, setRotateKeyId] = useState('');
    const [rotateNewKeyId, setRotateNewKeyId] = useState('');
    const [rotateDuration, setRotateDuration] = useState('');
    const [rotating, setRotating] = useState(false);

    // Revoke dialog state
    const [revokeOpen, setRevokeOpen] = useState(false);
    const [revokeKeyId, setRevokeKeyId] = useState('');
    const [revokeNewKeyId, setRevokeNewKeyId] = useState('');
    const [revokeDuration, setRevokeDuration] = useState('');
    const [revoking, setRevoking] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedKp, setSelectedKp] = useState<KeyPairResource | null>(null);
    const openMenu = Boolean(anchorEl);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const keyId = newKeyId.trim() || `${activeParticipantId}-key-${Date.now()}`;
            const privateKeyAlias = newPrivateKeyAlias.trim() || `${activeParticipantId}-alias-${Date.now()}`;
            const body = {
                active: true,
                keyId,
                privateKeyAlias,
                type: 'Ed25519VerificationKey2020',
                keyGeneratorParams: { algorithm: 'EdDSA', curve: 'Ed25519' },
            };
            await httpClient.put(
                `${API_BASE}/participants/${getPid()}/keypairs?makeDefault=${makeDefault}`,
                body
            );
            setCreateOpen(false);
            setNewKeyId('');
            setNewPrivateKeyAlias('');
            setMakeDefault(false);
            setSnackbar({ message: 'Key pair created successfully', severity: 'success' });
            fetchKeyPairs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create key pair';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const openRotateDialog = (keyId: string) => {
        setRotateKeyId(keyId);
        setRotateNewKeyId('');
        setRotateDuration('');
        setRotateOpen(true);
    };

    const handleRotate = async () => {
        setRotating(true);
        try {
            const newKeyId = rotateNewKeyId.trim() || `${activeParticipantId}-key-${Date.now()}`;
            const body = {
                active: true,
                keyId: newKeyId,
                privateKeyAlias: `${newKeyId}-alias`,
                type: 'Ed25519VerificationKey2020',
                keyGeneratorParams: { algorithm: 'EdDSA', curve: 'Ed25519' },
            };
            const durationParam = rotateDuration.trim() ? `?duration=${parseInt(rotateDuration, 10)}` : '';
            await httpClient.post(
                `${API_BASE}/participants/${getPid()}/keypairs/${encodeURIComponent(rotateKeyId)}/rotate${durationParam}`,
                body
            );
            setRotateOpen(false);
            setSnackbar({ message: 'Key pair rotated successfully', severity: 'success' });
            fetchKeyPairs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to rotate key pair';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setRotating(false);
        }
    };

    const openRevokeDialog = (keyId: string) => {
        setRevokeKeyId(keyId);
        setRevokeNewKeyId('');
        setRevokeDuration('');
        setRevokeOpen(true);
    };

    const handleRevoke = async () => {
        setRevoking(true);
        try {
            const newKeyId = revokeNewKeyId.trim() || `${activeParticipantId}-key-${Date.now()}`;
            const body = {
                active: true,
                keyId: newKeyId,
                privateKeyAlias: `${newKeyId}-alias`,
                type: 'Ed25519VerificationKey2020',
                keyGeneratorParams: { algorithm: 'EdDSA', curve: 'Ed25519' },
            };
            await httpClient.post(
                `${API_BASE}/participants/${getPid()}/keypairs/${encodeURIComponent(revokeKeyId)}/revoke`,
                body
            );
            setRevokeOpen(false);
            setSnackbar({ message: 'Key pair revoked', severity: 'success' });
            fetchKeyPairs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to revoke key pair';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setRevoking(false);
        }
    };

    const handleActivate = async (keyId: string) => {
        try {
            await httpClient.post(
                `${API_BASE}/participants/${getPid()}/keypairs/${encodeURIComponent(keyId)}/activate`
            );
            setSnackbar({ message: 'Key pair activated', severity: 'success' });
            fetchKeyPairs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to activate key pair';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setSnackbar({ message: 'Copied to clipboard', severity: 'success' });
    };

    const getStateStyle = (state?: number) => {
        if (state === undefined || state === null) return { label: 'Unknown', color: '#888888', bg: 'transparent' };
        return KEY_STATE_MAP[state] || { label: `State ${state}`, color: '#5B9BD5', bg: 'transparent' };
    };

    const stateChipSx = (state?: number) => {
        switch (state) {
            case 200: // Active
                return { color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: 'none', height: '32px' };
            case 100: // Created
                return { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.4)', height: '32px' };
            case 300: // Rotated
                return { color: '#E6A817', backgroundColor: 'rgba(230,168,23,0.15)', borderRadius: '4px', border: '1px solid #E6A817', height: '32px' };
            case 400: // Revoked
                return { color: '#fff', backgroundColor: 'rgba(255,90,90,0.3)', borderRadius: '4px', border: '1px solid #FF5A5A', height: '32px' };
            default:
                return { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', height: '32px' };
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Grid2 container direction="column" alignItems="center" sx={{ mb: 3 }}>
                <Grid2 className="page-catalog title flex flex-content-center">
                    <Typography className="text">Key Pairs</Typography>
                </Grid2>
            </Grid2>

            <Grid2 size={12} container justifyContent="flex-end" marginRight={6} marginBottom={2} gap={1}>
                <Button
                    className="add-button"
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                >
                    Create Key Pair
                </Button>
            </Grid2>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', pt: 2 }}>
            {loading ? (
                <Box className="custom-cards-list">
                    {[...Array(3)].map((_, i) => (
                        <Box key={i} className="custom-card-box">
                            <Box className="custom-card" sx={{ minHeight: '240px', opacity: 0.5 }}>
                                <Box className="custom-card-header">
                                    <Box sx={{ width: '60px', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-content">
                                    <Box sx={{ width: '70%', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px', mb: 1 }} />
                                    <Box sx={{ width: '50%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px', mb: 0.5 }} />
                                    <Box sx={{ width: '90%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-button-box">
                                    <Box sx={{ height: '36px', bgcolor: 'rgba(35,35,38,0.76)', borderRadius: '0 0 8px 8px' }} />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : keyPairs.length === 0 ? (
                <Box sx={emptyStateSx}>
                    <VpnKeyIcon sx={{ fontSize: 64, color: accentColors.brandLightBlue, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: accentColors.brandText, mb: 1 }}>
                        No Key Pairs Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                        No key pairs found for participant {activeParticipantId}.
                    </Typography>
                </Box>
            ) : (
                <>
                <Box className="custom-cards-list">
                    {visibleKeyPairs.map((kp) => {
                        const stateStyle = getStateStyle(kp.state);
                        return (
                            <Box key={kp.keyId} className="custom-card-box">
                                <Box className="custom-card" sx={{ minHeight: '200px' }}>
                                    <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                                            <Chip label={stateStyle.label} variant="outlined"
                                                sx={stateChipSx(kp.state)} />
                                            {kp.defaultPair && (
                                                <Chip label="Default" size="small"
                                                    sx={{ color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', height: '32px' }} />
                                            )}
                                        </Box>
                                        <Box className="custom-card-header-buttons">
                                            <Tooltip title="More options" arrow>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAnchorEl(e.currentTarget);
                                                        setSelectedKp(kp);
                                                    }}
                                                >
                                                    <MoreVert sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', pb: 2.5 }}>
                                        <Tooltip title={kp.keyId} arrow placement="top">
                                            <Typography variant="h5" sx={{ mb: 0.5, cursor: 'help' }}>
                                                {kp.keyId}
                                            </Typography>
                                        </Tooltip>
                                        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {kp.privateKeyAlias && (
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                        Private Key Alias
                                                    </Typography>
                                                    <Tooltip title={kp.privateKeyAlias} arrow placement="top">
                                                        <Typography sx={{ fontFamily: 'Monaco, "Lucida Console", monospace', fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help' }}>
                                                            {kp.privateKeyAlias}
                                                        </Typography>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                            {kp.timestamp && (
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                        Created
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2 }}>
                                                        {new Date(kp.timestamp).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => { setAnchorEl(null); setSelectedKp(null); }}
                        MenuListProps={{ 'aria-labelledby': 'more-options-button' }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { backgroundColor: 'white !important' } }}
                    >
                        {selectedKp && (
                            <>
                                {selectedKp.state === 200 && (
                                    <Box
                                        onClick={() => {
                                            openRotateDialog(selectedKp.id);
                                            setAnchorEl(null);
                                            setSelectedKp(null);
                                        }}
                                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                    >
                                        <RotateLeftIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Rotate</Box>
                                    </Box>
                                )}
                                {selectedKp.state === 200 && (
                                    <Box
                                        onClick={() => {
                                            openRevokeDialog(selectedKp.id);
                                            setAnchorEl(null);
                                            setSelectedKp(null);
                                        }}
                                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                    >
                                        <BlockIcon fontSize="small" sx={{ marginRight: 1, color: '#ff9800 !important', fill: '#ff9800 !important' }} />
                                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Revoke</Box>
                                    </Box>
                                )}
                                {selectedKp.state === 100 && (
                                    <Box
                                        onClick={() => {
                                            handleActivate(selectedKp.id);
                                            setAnchorEl(null);
                                            setSelectedKp(null);
                                        }}
                                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                    >
                                        <CheckCircleIcon fontSize="small" sx={{ marginRight: 1, color: '#4caf50 !important', fill: '#4caf50 !important' }} />
                                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Activate</Box>
                                    </Box>
                                )}
                                <Box
                                    onClick={() => {
                                        copyToClipboard(selectedKp.keyId);
                                        setAnchorEl(null);
                                        setSelectedKp(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <ContentCopyIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Copy Key ID</Box>
                                </Box>
                            </>
                        )}
                    </Menu>
                </Box>
                <Grid2 size={12} className="flex flex-content-center" sx={{ mt: 'auto', pt: 3 }}>
                    <TablePagination
                        rowsPerPageOptions={[rowsPerPage]}
                        component="div"
                        count={keyPairs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        className="card-list-pagination"
                    />
                </Grid2>
                </>
            )}
            </Box>

            {/* Create Key Pair Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Create Key Pair
                    <IconButton
                        aria-label="close"
                        onClick={() => setCreateOpen(false)}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={whiteDialogContentSx}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Create a new key pair for the active participant context.
                    </Typography>
                    <TextField label="Key ID (optional)" value={newKeyId}
                        onChange={(e) => setNewKeyId(e.target.value)}
                        placeholder="Auto-generated if empty"
                        fullWidth />
                    <TextField label="Private Key Alias (optional)" value={newPrivateKeyAlias}
                        onChange={(e) => setNewPrivateKeyAlias(e.target.value)}
                        placeholder="Auto-generated if empty"
                        fullWidth />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={makeDefault}
                                onChange={(e) => setMakeDefault(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Set as default key pair"
                        sx={{ color: 'text.primary' }}
                    />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setCreateOpen(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" color="primary" size="large"
                        disabled={creating}
                        startIcon={creating ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {creating ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rotate Dialog */}
            <Dialog open={rotateOpen} onClose={() => setRotateOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Rotate Key Pair
                    <IconButton
                        aria-label="close"
                        onClick={() => setRotateOpen(false)}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={whiteDialogContentSx}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Rotate key <strong>{rotateKeyId}</strong>. Optionally specify a new key ID and duration.
                    </Typography>
                    <TextField label="New Key ID (optional)" value={rotateNewKeyId}
                        onChange={(e) => setRotateNewKeyId(e.target.value)}
                        placeholder="Leave empty to auto-generate"
                        fullWidth />
                    <TextField label="Duration in ms (optional)" value={rotateDuration}
                        onChange={(e) => setRotateDuration(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g., 86400000"
                        fullWidth />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setRotateOpen(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleRotate} variant="contained" color="primary" size="large"
                        disabled={rotating}
                        startIcon={rotating ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {rotating ? 'Rotating...' : 'Rotate'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Revoke Dialog */}
            <Dialog open={revokeOpen} onClose={() => setRevokeOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Revoke Key Pair
                    <IconButton
                        aria-label="close"
                        onClick={() => setRevokeOpen(false)}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={whiteDialogContentSx}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Revoke key <strong>{revokeKeyId}</strong>. Optionally specify a replacement key and duration.
                    </Typography>
                    <TextField label="New Key ID (optional)" value={revokeNewKeyId}
                        onChange={(e) => setRevokeNewKeyId(e.target.value)}
                        placeholder="Leave empty to auto-generate"
                        fullWidth />
                    <TextField label="Duration in ms (optional)" value={revokeDuration}
                        onChange={(e) => setRevokeDuration(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g., 86400000"
                        fullWidth />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setRevokeOpen(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleRevoke} variant="contained" color="error" size="large"
                        disabled={revoking}
                        startIcon={revoking ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {revoking ? 'Revoking...' : 'Revoke'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snackbar} autoHideDuration={4000}
                onClose={() => { setSnackbar(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar?.severity || 'error'}
                    onClose={() => { setSnackbar(null); }} variant="filled">
                    {snackbar?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default KeyPairsPage;
