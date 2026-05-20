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
    TablePagination,
} from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import MoreVert from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import httpClient from '../../services/HttpClient';
import { encodeParticipantId } from '../../services/participantUtils';
import { useParticipant } from '../../contexts/ParticipantContext';
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

interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string | null;
    publicKeyJwk?: Record<string, unknown>;
}

interface ServiceEndpoint {
    id: string;
    type: string;
    serviceEndpoint: string;
}

interface DidDocument {
    id: string;
    '@context': string[];
    service: ServiceEndpoint[];
    verificationMethod: VerificationMethod[];
    authentication: string[];
}

interface DidWithState {
    document: DidDocument;
    state: string;
}

type EndpointDialogMode = 'add' | 'replace' | null;

const API_BASE = '/api/identity/v1alpha';

const DidPage: React.FC = () => {
    const { activeParticipantId } = useParticipant();
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const getPid = useCallback(() => encodeURIComponent(encodeParticipantId(activeParticipantId)), [activeParticipantId]);
    const encodeDid = useCallback((did: string) => encodeURIComponent(btoa(did)), []);

    const fetchDidsList = useCallback(async (): Promise<DidWithState[]> => {
        const pidVal = getPid();
        const response = await httpClient.post(`${API_BASE}/participants/${pidVal}/dids/query`, {});
        const documents: DidDocument[] = Array.isArray(response.data) ? response.data : [];
        const didsWithStates = await Promise.all(
            documents.map(async (doc) => {
                try {
                    const resp = await httpClient.post(`${API_BASE}/participants/${pidVal}/dids/state`, { did: doc.id });
                    return { document: doc, state: String(resp.data) };
                } catch {
                    return { document: doc, state: 'GENERATED' };
                }
            })
        );
        return didsWithStates;
    }, [getPid]);

    const { data: dids, loading, error, refresh: fetchDids } = useCachedList<DidWithState>(
        `dids-${activeParticipantId}`,
        fetchDidsList,
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

    const visibleDids = useMemo(() => {
        return dids.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, dids]);

    const [endpointDialog, setEndpointDialog] = useState<EndpointDialogMode>(null);
    const [endpointDid, setEndpointDid] = useState('');
    const [endpointServiceId, setEndpointServiceId] = useState('');
    const [endpointServiceType, setEndpointServiceType] = useState('');
    const [endpointUrl, setEndpointUrl] = useState('');
    const [endpointSubmitting, setEndpointSubmitting] = useState(false);
    const [removeServiceId, setRemoveServiceId] = useState('');
    const [removeDialog, setRemoveDialog] = useState(false);
    const [removeDid, setRemoveDid] = useState('');
    const [removeSubmitting, setRemoveSubmitting] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedDid, setSelectedDid] = useState<DidWithState | null>(null);
    const openMenu = Boolean(anchorEl);
    const [endpointsDialogDid, setEndpointsDialogDid] = useState<DidWithState | null>(null);

    const handlePublish = async (did: string) => {
        try {
            await httpClient.post(`${API_BASE}/participants/${getPid()}/dids/publish`, { did });
            setSnackbar({ message: 'DID published successfully', severity: 'success' });
            fetchDids();
        } catch (err) {
            setSnackbar({ message: extractErrorMessage(err, 'Failed to publish DID'), severity: 'error' });
        }
    };

    const handleUnpublish = async (did: string) => {
        try {
            await httpClient.post(`${API_BASE}/participants/${getPid()}/dids/unpublish`, { did });
            setSnackbar({ message: 'DID unpublished', severity: 'success' });
            fetchDids();
        } catch (err) {
            setSnackbar({ message: extractErrorMessage(err, 'Failed to unpublish DID'), severity: 'error' });
        }
    };

    const openEndpointDialog = (did: string, mode: 'add' | 'replace', existing?: ServiceEndpoint) => {
        setEndpointDid(did);
        setEndpointDialog(mode);
        setEndpointServiceId(existing?.id || '');
        setEndpointServiceType(existing?.type || '');
        setEndpointUrl(existing?.serviceEndpoint || '');
    };

    const closeEndpointDialog = () => {
        setEndpointDialog(null);
        setEndpointDid('');
        setEndpointServiceId('');
        setEndpointServiceType('');
        setEndpointUrl('');
    };

    const extractErrorMessage = (err: unknown, fallback: string): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const resp = (err as { response?: { data?: unknown } }).response;
            if (resp?.data) {
                if (Array.isArray(resp.data) && resp.data.length > 0 && resp.data[0].message) {
                    return resp.data[0].message;
                }
                if (typeof resp.data === 'object' && 'message' in (resp.data as Record<string, unknown>)) {
                    return String((resp.data as Record<string, unknown>).message);
                }
                if (typeof resp.data === 'string') return resp.data;
            }
        }
        return err instanceof Error ? err.message : fallback;
    };

    const handleAddEndpoint = async () => {
        setEndpointSubmitting(true);
        try {
            await httpClient.post(
                `${API_BASE}/participants/${getPid()}/dids/${encodeDid(endpointDid)}/endpoints?autoPublish=true`,
                { id: endpointServiceId, type: endpointServiceType, serviceEndpoint: endpointUrl }
            );
            setSnackbar({ message: 'Service endpoint added', severity: 'success' });
            closeEndpointDialog();
            fetchDids();
        } catch (err) {
            setSnackbar({ message: extractErrorMessage(err, 'Failed to add endpoint'), severity: 'error' });
        } finally {
            setEndpointSubmitting(false);
        }
    };

    const handleReplaceEndpoint = async () => {
        setEndpointSubmitting(true);
        try {
            await httpClient.patch(
                `${API_BASE}/participants/${getPid()}/dids/${encodeDid(endpointDid)}/endpoints`,
                { id: endpointServiceId, type: endpointServiceType, serviceEndpoint: endpointUrl }
            );
            setSnackbar({ message: 'Service endpoint replaced', severity: 'success' });
            closeEndpointDialog();
            fetchDids();
        } catch (err) {
            setSnackbar({ message: extractErrorMessage(err, 'Failed to replace endpoint'), severity: 'error' });
        } finally {
            setEndpointSubmitting(false);
        }
    };

    const openRemoveDialog = (did: string, serviceId: string) => {
        setRemoveDid(did);
        setRemoveServiceId(serviceId);
        setRemoveDialog(true);
    };

    const handleRemoveEndpoint = async () => {
        setRemoveSubmitting(true);
        try {
            await httpClient.delete(
                `${API_BASE}/participants/${getPid()}/dids/${encodeDid(removeDid)}/endpoints?serviceId=${encodeURIComponent(removeServiceId)}`
            );
            setSnackbar({ message: 'Service endpoint removed', severity: 'success' });
            setRemoveDialog(false);
            fetchDids();
        } catch (err) {
            setSnackbar({ message: extractErrorMessage(err, 'Failed to remove endpoint'), severity: 'error' });
        } finally {
            setRemoveSubmitting(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setSnackbar({ message: 'Copied to clipboard', severity: 'success' });
    };

    const isPublished = (state: string) => state === 'PUBLISHED';

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Grid2 container direction="column" alignItems="center" sx={{ mb: 3 }}>
                <Grid2 className="page-catalog title flex flex-content-center">
                    <Typography className="text">DID Management</Typography>
                </Grid2>
            </Grid2>


            {loading ? (
                <Box className="custom-cards-list">
                    {[...Array(2)].map((_, i) => (
                        <Box key={i} className="custom-card-box">
                            <Box className="custom-card" sx={{ minHeight: '240px', opacity: 0.5 }}>
                                <Box className="custom-card-header">
                                    <Box sx={{ width: '80px', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-content">
                                    <Box sx={{ width: '80%', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px', mb: 1 }} />
                                    <Box sx={{ width: '60%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px' }} />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : dids.length === 0 ? (
                <Box sx={emptyStateSx}>
                    <DeviceHubIcon sx={{ fontSize: 64, color: accentColors.brandLightBlue, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: accentColors.brandText, mb: 1 }}>
                        No DIDs Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                        No Decentralized Identifiers found for participant {activeParticipantId}.
                    </Typography>
                </Box>
            ) : (
                <>
                <Box className="custom-cards-list">
                    {visibleDids.map((d) => (
                        <Box key={d.document.id} className="custom-card-box">
                            <Box className="custom-card" sx={{ minHeight: '200px' }}>
                                <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                                    <Chip label={d.state} variant="outlined"
                                        sx={isPublished(d.state)
                                            ? { color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: 'none', height: '32px' }
                                            : { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.4)', height: '32px' }
                                        }
                                    />
                                    <Box className="custom-card-header-buttons">
                                        <Tooltip title={isPublished(d.state) ? 'Unpublish' : 'Publish'} arrow>
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isPublished(d.state)) { handleUnpublish(d.document.id); } else { handlePublish(d.document.id); }
                                                }}
                                            >
                                                {isPublished(d.state)
                                                    ? <UnpublishedIcon sx={{ color: '#4caf50' }} />
                                                    : <PublishIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                }
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="More options" arrow>
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAnchorEl(e.currentTarget);
                                                    setSelectedDid(d);
                                                }}
                                            >
                                                <MoreVert sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', pb: 2.5 }}>
                                    <Tooltip title={d.document.id} arrow placement="top">
                                        <Typography variant="h5" sx={{ mb: 0.5, cursor: 'help' }}>
                                            {d.document.id}
                                        </Typography>
                                    </Tooltip>
                                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {d.document.verificationMethod.length > 0 && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                    Verification Methods
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.87)', lineHeight: 1.2 }}>
                                                    {d.document.verificationMethod.length}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box>
                                            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', mb: '2px' }}>
                                                Service Endpoints
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.76rem', color: d.document.service.length === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.87)', lineHeight: 1.2, fontStyle: d.document.service.length === 0 ? 'italic' : 'normal' }}>
                                                {d.document.service.length === 0 ? 'None' : d.document.service.length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                            </Box>
                        </Box>
                    ))}
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => { setAnchorEl(null); setSelectedDid(null); }}
                        MenuListProps={{ 'aria-labelledby': 'more-options-button' }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { backgroundColor: 'white !important' } }}
                    >
                        {selectedDid && (
                            <>
                                <Box
                                    onClick={() => {
                                        openEndpointDialog(selectedDid.document.id, 'add');
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <AddIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Add Endpoint</Box>
                                </Box>
                                <Box
                                    onClick={() => {
                                        setEndpointsDialogDid(selectedDid);
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <DeviceHubIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Manage Endpoints</Box>
                                </Box>
                                <Box
                                    onClick={() => {
                                        copyToClipboard(selectedDid.document.id);
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                >
                                    <ContentCopyIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Copy DID</Box>
                                </Box>
                            </>
                        )}
                    </Menu>
                </Box>
                <Grid2 size={12} className="flex flex-content-center" sx={{ mt: 'auto', pt: 3 }}>
                    <TablePagination
                        rowsPerPageOptions={[rowsPerPage]}
                        component="div"
                        count={dids.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        className="card-list-pagination"
                    />
                </Grid2>
                </>
            )}

            <Dialog open={!!endpointsDialogDid} onClose={() => setEndpointsDialogDid(null)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Manage Endpoints
                    <IconButton
                        aria-label="close"
                        onClick={() => setEndpointsDialogDid(null)}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ ...whiteDialogContentSx, gap: 0, p: 0, pt: '0 !important' }}>
                    {endpointsDialogDid?.document.service.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No service endpoints configured.
                            </Typography>
                        </Box>
                    )}
                    {endpointsDialogDid?.document.service.map((svc) => (
                        <Box key={svc.id} sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {svc.id}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {svc.type}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {svc.serviceEndpoint}
                                </Typography>
                            </Box>
                            <Tooltip title="Edit" arrow>
                                <IconButton size="small" onClick={() => {
                                    setEndpointsDialogDid(null);
                                    openEndpointDialog(endpointsDialogDid.document.id, 'replace', svc);
                                }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove" arrow>
                                <IconButton size="small" onClick={() => {
                                    setEndpointsDialogDid(null);
                                    openRemoveDialog(endpointsDialogDid.document.id, svc.id);
                                }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button
                        onClick={() => {
                            const did = endpointsDialogDid?.document.id;
                            setEndpointsDialogDid(null);
                            if (did) openEndpointDialog(did, 'add');
                        }}
                        variant="contained" color="primary" size="large"
                        startIcon={<AddIcon />}
                        sx={dialogSubmitBtnSx}
                    >
                        Add Endpoint
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!endpointDialog} onClose={closeEndpointDialog} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    {endpointDialog === 'add' ? 'Add Service Endpoint' : 'Replace Service Endpoint'}
                    <IconButton
                        aria-label="close"
                        onClick={closeEndpointDialog}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={whiteDialogContentSx}>
                    <TextField label="Service ID" value={endpointServiceId}
                        onChange={(e) => setEndpointServiceId(e.target.value)}
                        placeholder="e.g., credential-service"
                        disabled={endpointDialog === 'replace'}
                        fullWidth />
                    <TextField label="Type" value={endpointServiceType}
                        onChange={(e) => setEndpointServiceType(e.target.value)}
                        placeholder="e.g., CredentialService"
                        fullWidth />
                    <TextField label="Endpoint URL" value={endpointUrl}
                        onChange={(e) => setEndpointUrl(e.target.value)}
                        placeholder="https://example.com/api/credentials"
                        error={!!endpointUrl && !/^https?:\/\/.+/.test(endpointUrl)}
                        helperText={endpointUrl && !/^https?:\/\/.+/.test(endpointUrl) ? 'Must be a valid URL (https://...)' : ''}
                        fullWidth />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={closeEndpointDialog} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button
                        onClick={endpointDialog === 'add' ? handleAddEndpoint : handleReplaceEndpoint}
                        disabled={!endpointServiceId || !endpointUrl || !/^https?:\/\/.+/.test(endpointUrl) || endpointSubmitting}
                        variant="contained" color="primary" size="large"
                        startIcon={endpointSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {endpointSubmitting ? 'Saving...' : (endpointDialog === 'add' ? 'Add' : 'Replace')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={removeDialog} onClose={() => setRemoveDialog(false)} maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Remove Service Endpoint
                    <IconButton
                        aria-label="close"
                        onClick={() => setRemoveDialog(false)}
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
                        Remove service endpoint <strong>{removeServiceId}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => setRemoveDialog(false)} variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleRemoveEndpoint} variant="contained" color="error" size="large"
                        disabled={removeSubmitting}
                        startIcon={removeSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {removeSubmitting ? 'Removing...' : 'Remove'}
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

export default DidPage;
