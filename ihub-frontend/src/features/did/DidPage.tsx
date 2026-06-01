/********************************************************************************
 * Copyright (c) 2026 ARENA2036 e.V.
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
    blueDialogActionsSx,
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
                    <Grid2
                        container
                        spacing={3}
                        sx={{
                            width: '100%',
                            px: { xs: 1, sm: 2, md: 3 },
                        }}
                    >
                        {visibleDids.map((d) => (
                            <Grid2
                                size={{ xs: 12, sm: 6, lg: 3 }}
                                key={d.document.id}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        minHeight: 360,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '24px',
                                        background:
                                            'linear-gradient(180deg, rgba(9,14,24,0.98) 0%, rgba(4,8,20,0.98) 100%)',
                                        border: '1px solid rgba(0, 212, 255, 0.15)',
                                        boxShadow:
                                            '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            borderColor: 'rgba(0, 212, 255, 0.35)',
                                            boxShadow:
                                                '0 30px 80px rgba(0,0,0,0.55), 0 0 20px rgba(0,212,255,0.08)',
                                        },
                                    }}
                                >
                                    {/* Top Glow Line */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 24,
                                            right: 24,
                                            height: '2px',
                                            background:
                                                'linear-gradient(90deg, transparent, #00D4FF, transparent)',
                                        }}
                                    />

                                    {/* Header */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            p: 3,
                                            pb: 2,
                                        }}
                                    >
                                        <Chip
                                            label={d.state.toUpperCase()}
                                            size="small"
                                            sx={{
                                                height: 30,
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.08em',
                                                borderRadius: '8px',
                                                ...(isPublished(d.state)
                                                    ? {
                                                        color: '#0B0F1A',
                                                        backgroundColor: '#FFFFFF',
                                                    }
                                                    : {
                                                        color: 'rgba(255,255,255,0.75)',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        border:
                                                            '1px dashed rgba(255,255,255,0.20)',
                                                    }),
                                            }}
                                        />

                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {/* Publish / Unpublish */}
                                            <Tooltip
                                                title={
                                                    isPublished(d.state)
                                                        ? 'Unpublish'
                                                        : 'Publish'
                                                }
                                                arrow
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isPublished(d.state)) {
                                                            handleUnpublish(
                                                                d.document.id,
                                                            );
                                                        } else {
                                                            handlePublish(
                                                                d.document.id,
                                                            );
                                                        }
                                                    }}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        color: isPublished(d.state)
                                                            ? '#22C55E'
                                                            : 'rgba(255,255,255,0.45)',
                                                        backgroundColor:
                                                            'rgba(255,255,255,0.04)',
                                                        border:
                                                            '1px solid rgba(255,255,255,0.06)',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                'rgba(255,255,255,0.08)',
                                                        },
                                                    }}
                                                >
                                                    {isPublished(d.state) ? (
                                                        <UnpublishedIcon fontSize="small" />
                                                    ) : (
                                                        <PublishIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </Tooltip>

                                            {/* Burger Menu */}
                                            <Tooltip title="More options" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAnchorEl(
                                                            e.currentTarget,
                                                        );
                                                        setSelectedDid(d);
                                                    }}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        color:
                                                            'rgba(255,255,255,0.65)',
                                                        backgroundColor:
                                                            'rgba(255,255,255,0.04)',
                                                        border:
                                                            '1px solid rgba(255,255,255,0.06)',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                'rgba(255,255,255,0.08)',
                                                        },
                                                    }}
                                                >
                                                    <MoreVert fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    {/* Content */}
                                    <Box
                                        sx={{
                                            px: 3,
                                            pb: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            flex: 1,
                                            color: '#FFFFFF',
                                        }}
                                    >
                                        {/* DID */}
                                        <Tooltip title={d.document.id} arrow>
                                            <Typography
                                                sx={{
                                                    fontFamily:
                                                        '"SF Mono", "Roboto Mono", monospace',
                                                    fontSize: '1.35rem',
                                                    fontWeight: 700,
                                                    lineHeight: 1.2,
                                                    mb: 2,
                                                    letterSpacing: '-0.02em',
                                                    wordBreak: 'break-word',
                                                    cursor: 'help',
                                                }}
                                            >
                                                {d.document.id}
                                            </Typography>
                                        </Tooltip>

                                        {/* Verification Methods */}
                                        <Box sx={{ mb: 2.5 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.14em',
                                                    textTransform: 'uppercase',
                                                    color:
                                                        'rgba(255,255,255,0.42)',
                                                    mb: 0.75,
                                                }}
                                            >
                                                Verification Methods
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontSize: '0.82rem',
                                                    color:
                                                        'rgba(255,255,255,0.90)',
                                                }}
                                            >
                                                {d.document.verificationMethod.length}
                                            </Typography>
                                        </Box>

                                        {/* Service Endpoints */}
                                        <Box sx={{ mt: 'auto', mb: 2 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.14em',
                                                    textTransform: 'uppercase',
                                                    color:
                                                        'rgba(255,255,255,0.42)',
                                                    mb: 0.75,
                                                }}
                                            >
                                                Service Endpoints
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontSize: '0.82rem',
                                                    color:
                                                        d.document.service.length === 0
                                                            ? 'rgba(255,255,255,0.50)'
                                                            : 'rgba(255,255,255,0.90)',
                                                    fontStyle:
                                                        d.document.service.length === 0
                                                            ? 'italic'
                                                            : 'normal',
                                                }}
                                            >
                                                {d.document.service.length === 0
                                                    ? 'None'
                                                    : d.document.service.length}
                                            </Typography>
                                        </Box>

                                        {/* Footer */}
                                        <Box
                                            sx={{
                                                pt: 2,
                                                borderTop:
                                                    '1px solid rgba(255,255,255,0.08)',
                                            }}
                                        >
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() =>
                                                    setEndpointsDialogDid(d)
                                                }
                                                sx={{
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    color: '#00D4FF',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        color: '#33DDFF',
                                                    },
                                                }}
                                            >
                                                View Details →
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid2>
                        ))}
                    </Grid2>
                    

                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => {
                            setAnchorEl(null);
                            setSelectedDid(null);
                        }}
                        MenuListProps={{ 'aria-labelledby': 'more-options-button' }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                            sx: {
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                minWidth: 240,
                                boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                                border: '1px solid rgba(1,86,255,0.12)',
                                py: 0.5,
                            },
                        }}
                    >
                        {selectedDid && (
                            <>
                                {/* Add Endpoint */}
                                <Box
                                    onClick={() => {
                                        // Preserves existing business logic exactly
                                        openEndpointDialog(selectedDid.document.id, 'add');
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#f5f9ff',
                                        },
                                    }}
                                >
                                    <AddIcon
                                        fontSize="small"
                                        sx={{ color: '#0F71CB' }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: '#111827',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Add Endpoint
                                    </Typography>
                                </Box>

                                {/* Manage Endpoints */}
                                <Box
                                    onClick={() => {
                                        // Preserves existing business logic exactly
                                        setEndpointsDialogDid(selectedDid);
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#f5f9ff',
                                        },
                                    }}
                                >
                                    <DeviceHubIcon
                                        fontSize="small"
                                        sx={{ color: '#0F71CB' }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: '#111827',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Manage Endpoints
                                    </Typography>
                                </Box>

                                {/* Copy DID */}
                                <Box
                                    onClick={() => {
                                        // Preserves existing business logic exactly
                                        copyToClipboard(selectedDid.document.id);
                                        setAnchorEl(null);
                                        setSelectedDid(null);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    }}
                                >
                                    <ContentCopyIcon
                                        fontSize="small"
                                        sx={{ color: '#0F71CB' }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: '#111827',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Copy DID
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Menu>
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
                            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                No service endpoints configured.
                            </Typography>
                        </Box>
                    )}
                    {endpointsDialogDid?.document.service.map((svc) => (
                        <Box key={svc.id} sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                    {svc.id}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#FFFFFF', display: 'block' }}>
                                    {svc.type}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#FFFFFF', display: 'block', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <DialogActions sx={blueDialogActionsSx}>
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
                <DialogActions sx={blueDialogActionsSx}>
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
