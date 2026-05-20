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

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    IconButton,
    Grid2,
    Menu,
    TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SyncIcon from '@mui/icons-material/Sync';
import MoreVert from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CircularProgress from '@mui/material/CircularProgress';
import httpClient from '../../services/HttpClient';
import { encodeParticipantId } from '../../services/participantUtils';
import { useParticipant, ParticipantData } from '../../contexts/ParticipantContext';
import { accentColors, emptyStateSx } from '../../theme/darkCardStyles';
import {
    whiteDialogPaperProps,
    coloredDialogTitleSx,
    dialogCloseButtonSx,
    whiteDialogContentSx,
    whiteDialogActionsSx,
    dialogCancelBtnSx,
    dialogSubmitBtnSx,
} from '../../theme/darkCardStyles';
import { useCachedList } from '../../hooks/useCachedFetch';

const stateLabel = (state?: number): string => {
    switch (state) {
        case 0: return 'Created';
        case 1: return 'Active';
        case 2: return 'Deactivated';
        default: return 'Unknown';
    }
};

const stateChipSx = (state?: number) => {
    switch (state) {
        case 1:
            return { color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: 'none', height: '32px' };
        case 0:
            return { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.4)', height: '32px' };
        case 2:
            return { color: '#fff', backgroundColor: 'rgba(255,90,90,0.3)', borderRadius: '4px', border: '1px solid #FF5A5A', height: '32px' };
        default:
            return { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', height: '32px' };
    }
};

const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fetchParticipantsList = async (): Promise<ParticipantData[]> => {
    const response = await httpClient.get('/api/identity/v1alpha/participants');
    return Array.isArray(response.data) ? response.data : [];
};

const ParticipantsPage: React.FC = () => {
    const { refresh: refreshGlobal } = useParticipant();

    const { data: participants, loading, error, refresh: fetchParticipants } = useCachedList<ParticipantData>(
        'participants',
        fetchParticipantsList,
    );

    const [createOpen, setCreateOpen] = useState(false);
    const [newParticipantId, setNewParticipantId] = useState('');
    const [newKeyId, setNewKeyId] = useState('');
    const [newPrivateKeyAlias, setNewPrivateKeyAlias] = useState('');
    const [newDid, setNewDid] = useState('');
    const [creating, setCreating] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [createResult, setCreateResult] = useState<Record<string, unknown> | null>(null);
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedParticipant, setSelectedParticipant] = useState<ParticipantData | null>(null);
    const openMenu = Boolean(anchorEl);

    // Pagination state
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const handleChangePage = (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const visibleParticipants = useMemo(() => {
        return [...participants].slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, participants]);

    // Roles dialog state
    const [rolesOpen, setRolesOpen] = useState(false);
    const [rolesParticipantId, setRolesParticipantId] = useState('');
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [newRole, setNewRole] = useState('');
    const [savingRoles, setSavingRoles] = useState(false);

    useEffect(() => {
        if (error) setSnackbar({ message: error, severity: 'error' });
    }, [error]);

    const refreshAll = () => {
        setPage(0);
        fetchParticipants();
        refreshGlobal();
    };

    const handleCreate = async () => {
        if (!newParticipantId.trim()) return;
        setCreating(true);
        try {
            const pid = newParticipantId.trim();
            const key: Record<string, unknown> = {
                keyId: newKeyId.trim() || `${pid}-key`,
                privateKeyAlias: newPrivateKeyAlias.trim() || `${pid}-alias`,
                keyGeneratorParams: { algorithm: 'EdDSA', curve: 'Ed25519' },
            };
            const body: Record<string, unknown> = {
                participantId: pid,
                active: true,
                did: newDid.trim() || `did:web:${pid}`,
                key,
            };

            const response = await httpClient.post('/api/identity/v1alpha/participants', body);
            setCreateOpen(false);
            setNewParticipantId('');
            setNewKeyId('');
            setNewPrivateKeyAlias('');
            setNewDid('');

            if (response.data && typeof response.data === 'object' &&
                (response.data.apiKey || response.data.clientId || response.data.clientSecret)) {
                setCreateResult(response.data as Record<string, unknown>);
                setResultOpen(true);
            } else {
                setSnackbar({ message: 'Participant created successfully', severity: 'success' });
            }
            refreshAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create participant';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (participantId: string) => {
        try {
            await httpClient.delete(`/api/identity/v1alpha/participants/${encodeURIComponent(encodeParticipantId(participantId))}`);
            setSnackbar({ message: 'Participant deleted', severity: 'success' });
            refreshAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete participant';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleActivate = async (participantId: string) => {
        try {
            await httpClient.post(
                `/api/identity/v1alpha/participants/${encodeURIComponent(encodeParticipantId(participantId))}/state?isActive=true`
            );
            setSnackbar({ message: 'Participant activated', severity: 'success' });
            refreshAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to activate participant';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleDeactivate = async (participantId: string) => {
        try {
            await httpClient.post(
                `/api/identity/v1alpha/participants/${encodeURIComponent(encodeParticipantId(participantId))}/state?isActive=false`
            );
            setSnackbar({ message: 'Participant deactivated', severity: 'success' });
            refreshAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to deactivate participant';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleRegenerateToken = async (participantId: string) => {
        try {
            const response = await httpClient.post(
                `/api/identity/v1alpha/participants/${encodeURIComponent(encodeParticipantId(participantId))}/token`
            );
            const token = response.data?.token || response.data;
            if (typeof token === 'string') {
                await navigator.clipboard.writeText(token);
                setSnackbar({ message: 'New token generated and copied to clipboard', severity: 'success' });
            } else {
                setSnackbar({ message: 'Token regenerated', severity: 'success' });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to regenerate token';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const openRolesDialog = (participant: ParticipantData) => {
        setRolesParticipantId(participant.participantContextId);
        setEditRoles(participant.roles ? [...participant.roles] : []);
        setNewRole('');
        setRolesOpen(true);
    };

    const handleAddRole = () => {
        const role = newRole.trim();
        if (role && !editRoles.includes(role)) {
            setEditRoles([...editRoles, role]);
            setNewRole('');
        }
    };

    const handleRemoveRole = (role: string) => {
        setEditRoles(editRoles.filter(r => r !== role));
    };

    const handleSaveRoles = async () => {
        setSavingRoles(true);
        try {
            await httpClient.put(
                `/api/identity/v1alpha/participants/${encodeURIComponent(encodeParticipantId(rolesParticipantId))}/roles`,
                editRoles
            );
            setRolesOpen(false);
            setSnackbar({ message: 'Roles updated', severity: 'success' });
            refreshAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update roles';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setSavingRoles(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setSnackbar({ message: 'Copied to clipboard', severity: 'success' });
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Grid2 container direction="column" alignItems="center" sx={{ mb: 3 }}>
                <Grid2 className="page-catalog title flex flex-content-center">
                    <Typography className="text">Participant Context</Typography>
                </Grid2>
            </Grid2>

            <Grid2 size={12} container justifyContent="flex-end" marginRight={6} marginBottom={2} gap={1}>
                <Button
                    className="add-button"
                    variant="outlined"
                    size="small"
                    onClick={() => setCreateOpen(true)}
                    startIcon={<AddIcon />}
                >
                    Create Participant
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
                                    <Box sx={{ width: '60%', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px', mb: 1 }} />
                                    <Box sx={{ width: '80%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-button-box">
                                    <Box sx={{ height: '36px', bgcolor: 'rgba(35,35,38,0.76)', borderRadius: '0 0 8px 8px' }} />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : participants.length === 0 ? (
                <Box sx={emptyStateSx}>
                    <Typography variant="h6" sx={{ color: accentColors.brandText, mb: 1 }}>
                        No Participants Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                        Create a participant context to get started.
                    </Typography>
                </Box>
            ) : (
                <>
                <Box className="custom-cards-list">
                    {visibleParticipants.map((p) => (
                        <Box key={p.participantContextId} className="custom-card-box">
                            <Box className="custom-card" sx={{ minHeight: '200px' }}>
                                <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                                    <Chip
                                        label={stateLabel(p.state)}
                                        variant="outlined"
                                        sx={stateChipSx(p.state)}
                                    />
                                    <Box className="custom-card-header-buttons">
                                        <Tooltip title={p.state === 1 ? 'Deactivate' : 'Activate'} arrow>
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (p.state === 1) { handleDeactivate(p.participantContextId); } else { handleActivate(p.participantContextId); }
                                                }}
                                            >
                                                <PowerSettingsNewIcon sx={{ color: p.state === 1 ? '#4caf50' : 'rgba(255, 255, 255, 0.5)' }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="More options" arrow>
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAnchorEl(e.currentTarget);
                                                    setSelectedParticipant(p);
                                                }}
                                            >
                                                <MoreVert sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', pb: 2.5 }}>
                                    <Tooltip title={p.participantContextId} arrow placement="top">
                                        <Typography variant="h5" sx={{ mb: 0.5, cursor: 'help' }}>
                                            {p.participantContextId}
                                        </Typography>
                                    </Tooltip>
                                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {p.did && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                    DID
                                                </Typography>
                                                <Tooltip title={p.did} arrow placement="top">
                                                    <Typography sx={{ fontFamily: 'Monaco, "Lucida Console", monospace', fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help' }}>
                                                        {p.did}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                    Created
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2 }}>
                                                    {formatDate(p.createdAt)}
                                                </Typography>
                                            </Box>
                                            {p.roles && p.roles.length > 0 && (
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                        Roles
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2 }}>
                                                        {p.roles.join(', ')}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        {p.apiTokenAlias && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                    API Token Alias
                                                </Typography>
                                                <Typography sx={{ fontFamily: 'Monaco, "Lucida Console", monospace', fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {p.apiTokenAlias}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                            </Box>
                        </Box>
                    ))}
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => { setAnchorEl(null); setSelectedParticipant(null); }}
                        MenuListProps={{ 'aria-labelledby': 'more-options-button' }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { backgroundColor: 'white !important' } }}
                    >
                        {selectedParticipant && (
                            <>
                                {selectedParticipant.state !== 1 && (
                                    <Box
                                        onClick={() => {
                                            handleActivate(selectedParticipant.participantContextId);
                                            setAnchorEl(null);
                                            setSelectedParticipant(null);
                                        }}
                                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                    >
                                        <PowerSettingsNewIcon fontSize="small" sx={{ marginRight: 1, color: '#4caf50 !important', fill: '#4caf50 !important' }} />
                                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Activate</Box>
                                    </Box>
                                )}
                                {selectedParticipant.state === 1 && (
                                    <Box
                                        onClick={() => {
                                            handleDeactivate(selectedParticipant.participantContextId);
                                            setAnchorEl(null);
                                            setSelectedParticipant(null);
                                        }}
                                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                    >
                                        <PowerSettingsNewIcon fontSize="small" sx={{ marginRight: 1, color: '#ff9800 !important', fill: '#ff9800 !important' }} />
                                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Deactivate</Box>
                                    </Box>
                                )}
                                <Box
                                    onClick={() => {
                                        openRolesDialog(selectedParticipant);
                                        setAnchorEl(null);
                                        setSelectedParticipant(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <AdminPanelSettingsIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Manage Roles</Box>
                                </Box>
                                <Box
                                    onClick={() => {
                                        handleRegenerateToken(selectedParticipant.participantContextId);
                                        setAnchorEl(null);
                                        setSelectedParticipant(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <SyncIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Regenerate Token</Box>
                                </Box>
                                <Box
                                    onClick={() => {
                                        copyToClipboard(selectedParticipant.participantContextId);
                                        setAnchorEl(null);
                                        setSelectedParticipant(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <ContentCopyIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Copy ID</Box>
                                </Box>
                                <Box
                                    onClick={() => {
                                        handleDelete(selectedParticipant.participantContextId);
                                        setAnchorEl(null);
                                        setSelectedParticipant(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <DeleteIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Delete</Box>
                                </Box>
                            </>
                        )}
                    </Menu>
                </Box>
                <Grid2 size={12} className="flex flex-content-center" sx={{ mt: 'auto', pt: 3 }}>
                    <TablePagination
                        rowsPerPageOptions={[rowsPerPage]}
                        component="div"
                        count={participants.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        className="card-list-pagination"
                    />
                </Grid2>
                </>
            )}
            </Box>

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Create Participant
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
                    <TextField
                        autoFocus fullWidth label="Participant ID *" value={newParticipantId}
                        onChange={(e) => setNewParticipantId(e.target.value)}
                        placeholder="e.g., BPNL00000003CRHK"
                    />
                    <TextField
                        fullWidth label="Key ID (optional)" value={newKeyId}
                        onChange={(e) => setNewKeyId(e.target.value)}
                        placeholder="Auto-generated if empty"
                    />
                    <TextField
                        fullWidth label="Private Key Alias (optional)" value={newPrivateKeyAlias}
                        onChange={(e) => setNewPrivateKeyAlias(e.target.value)}
                        placeholder="Auto-generated if empty"
                    />
                    <TextField
                        fullWidth label="DID (optional)" value={newDid}
                        onChange={(e) => setNewDid(e.target.value)}
                        placeholder="did:web:example.com - auto-generated if empty"
                    />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setCreateOpen(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" color="primary" size="large"
                        disabled={creating || !newParticipantId.trim()}
                        startIcon={creating ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {creating ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Result dialog showing apiKey/clientId/clientSecret */}
            <Dialog open={resultOpen} onClose={() => setResultOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Participant Created
                    <IconButton
                        aria-label="close"
                        onClick={() => setResultOpen(false)}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ ...whiteDialogContentSx, gap: 1.5 }}>
                    <Alert severity="warning" sx={{ mb: 1 }}>
                        Save these credentials now. They will not be shown again.
                    </Alert>
                    {createResult && Object.entries(createResult).map(([key, value]) => (
                        <Box key={key}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {key}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="body2" sx={{
                                    fontFamily: 'monospace', fontSize: '0.85rem',
                                    wordBreak: 'break-all', flex: 1,
                                    p: 1.5, borderRadius: '4px',
                                    bgcolor: 'grey.100', color: 'text.primary',
                                    border: '1px solid', borderColor: 'divider',
                                }}>
                                    {String(value)}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(String(value))}
                                    sx={{ color: 'primary.main', flexShrink: 0 }}>
                                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setResultOpen(false)} variant="contained" color="primary" size="large"
                        sx={dialogSubmitBtnSx}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Roles Dialog */}
            <Dialog open={rolesOpen} onClose={() => setRolesOpen(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Manage Roles
                    <IconButton
                        aria-label="close"
                        onClick={() => setRolesOpen(false)}
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
                        Manage roles for participant <strong>{rolesParticipantId}</strong>.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {editRoles.map((role) => (
                            <Chip
                                key={role}
                                label={role}
                                onDelete={() => handleRemoveRole(role)}
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: '#fff',
                                    '& .MuiChip-deleteIcon': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: 16,
                                        '&:hover': { color: '#fff' },
                                    },
                                }}
                            />
                        ))}
                        {editRoles.length === 0 && (
                            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                No roles assigned
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="Add role"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
                            placeholder="e.g., admin"
                            fullWidth
                            size="small"
                        />
                        <Button
                            variant="outlined"
                            onClick={handleAddRole}
                            disabled={!newRole.trim()}
                            sx={{ textTransform: 'none', minWidth: 'auto', px: 2 }}
                        >
                            Add
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setRolesOpen(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveRoles} variant="contained" color="primary" size="large"
                        disabled={savingRoles}
                        startIcon={savingRoles ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {savingRoles ? 'Saving...' : 'Save Roles'}
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

export default ParticipantsPage;
