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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Snackbar,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    TablePagination,
    Grid2,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import { CredentialResource } from './types';
import {
    getCredentials,
    deleteCredential,
    createCredential,
    updateCredential,
    requestCredential,
    revokeCredential,
    suspendCredential,
    resumeCredential,
} from './api';
import { useCachedList } from '../../hooks/useCachedFetch';
import { useParticipant } from '../../contexts/ParticipantContext';
import CredentialCard from './CredentialCard';
import CredentialDetailModal from './CredentialDetailModal';
import AddCredentialDialog from './AddCredentialDialog';
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

const CredentialsPage: React.FC = () => {
    const { activeParticipantId } = useParticipant();

    const [selectedCredential, setSelectedCredential] = useState<CredentialResource | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);
    const [reqIssuerDid, setReqIssuerDid] = useState('');
    const [reqHolderPid, setReqHolderPid] = useState('');
    const [reqCredType, setReqCredType] = useState('');
    const [reqCredFormat, setReqCredFormat] = useState('ldp_vc');
    const [requesting, setRequesting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const fetchCredentialsList = useCallback(
        () => getCredentials(activeParticipantId),
        [activeParticipantId],
    );

    const { data: credentials, loading, error, refresh: fetchCredentials } = useCachedList<CredentialResource>(
        `credentials-${activeParticipantId}`,
        fetchCredentialsList,
    );

    useEffect(() => {
        if (error) setSnackbar({ message: error, severity: 'error' });
    }, [error]);

    useEffect(() => {
        setPage(0);
    }, [activeParticipantId]);

    const paginatedCredentials = useMemo(() => {
        const start = page * rowsPerPage;
        return credentials.slice(start, start + rowsPerPage);
    }, [credentials, page, rowsPerPage]);

    const handleChangePage = (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleViewDetail = (credentialId: string) => {
        const cred = credentials.find(c => c.id === credentialId);
        if (cred) setSelectedCredential(cred);
    };

    const handleDelete = async (credentialId: string) => {
        try {
            await deleteCredential(activeParticipantId, credentialId);
            setSelectedCredential(null);
            setSnackbar({ message: 'Credential deleted', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleAdd = async (json: string) => {
        try {
            const parsed = JSON.parse(json);
            await createCredential(activeParticipantId, parsed);
            setAddOpen(false);
            setSnackbar({ message: 'Credential added', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleUpdate = async (updated: CredentialResource) => {
        try {
            await updateCredential(activeParticipantId, updated);
            setSelectedCredential(null);
            setSnackbar({ message: 'Credential updated', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleRevoke = async (credentialId: string) => {
        try {
            await revokeCredential(activeParticipantId, credentialId);
            setSelectedCredential(null);
            setSnackbar({ message: 'Credential revoked', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to revoke credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleSuspend = async (credentialId: string) => {
        try {
            await suspendCredential(activeParticipantId, credentialId);
            setSelectedCredential(null);
            setSnackbar({ message: 'Credential suspended', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to suspend credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const handleResume = async (credentialId: string) => {
        try {
            await resumeCredential(activeParticipantId, credentialId);
            setSelectedCredential(null);
            setSnackbar({ message: 'Credential resumed', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resume credential';
            setSnackbar({ message, severity: 'error' });
        }
    };

    const resetRequestForm = () => {
        setReqIssuerDid('');
        setReqHolderPid('');
        setReqCredType('');
        setReqCredFormat('ldp_vc');
    };

    const handleRequest = async () => {
        setRequesting(true);
        try {
            const body = {
                issuerDid: reqIssuerDid.trim(),
                holderPid: reqHolderPid.trim(),
                credentials: [
                    {
                        format: reqCredFormat.trim() || 'ldp_vc',
                        id: crypto.randomUUID(),
                        type: reqCredType.trim(),
                    },
                ],
            };
            await requestCredential(activeParticipantId, body);
            setRequestOpen(false);
            resetRequestForm();
            setSnackbar({ message: 'Credential request sent', severity: 'success' });
            fetchCredentials();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to request credential';
            setSnackbar({ message, severity: 'error' });
        } finally {
            setRequesting(false);
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Grid2 container direction="column" alignItems="center" sx={{ mb: 3 }}>
                <Grid2 className="page-catalog title flex flex-content-center">
                    <Typography className="text">Verifiable Credentials</Typography>
                </Grid2>
            </Grid2>

            <Grid2 size={12} container justifyContent="flex-end" marginRight={6} marginBottom={2} gap={1}>
                <Button
                    className="add-button"
                    variant="outlined"
                    size="small"
                    startIcon={<SendIcon />}
                    onClick={() => setRequestOpen(true)}
                >
                    Request
                </Button>
                <Button
                    className="add-button"
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddOpen(true)}
                >
                    Add Credential
                </Button>
            </Grid2>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', pt: 2 }}>
            {loading ? (
                <Box className="custom-cards-list">
                    {[...Array(4)].map((_, i) => (
                        <Box key={i} className="custom-card-box">
                            <Box className="custom-card" sx={{ minHeight: '240px', opacity: 0.5 }}>
                                <Box className="custom-card-header">
                                    <Box sx={{ width: '60px', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-content">
                                    <Box sx={{ width: '70%', height: '22px', bgcolor: 'rgba(248,249,250,0.1)', borderRadius: '4px', mb: 1 }} />
                                    <Box sx={{ width: '50%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px', mb: 0.5 }} />
                                    <Box sx={{ width: '80%', height: '14px', bgcolor: 'rgba(248,249,250,0.06)', borderRadius: '4px' }} />
                                </Box>
                                <Box className="custom-card-button-box">
                                    <Box sx={{ height: '36px', bgcolor: 'rgba(35,35,38,0.76)', borderRadius: '0 0 8px 8px' }} />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : credentials.length === 0 ? (
                <Box sx={emptyStateSx}>
                    <VerifiedUserIcon sx={{ fontSize: 64, color: accentColors.brandLightBlue, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: accentColors.brandText, mb: 1 }}>
                        No Credentials Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                        No verifiable credentials are available for participant {activeParticipantId}.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Box className="custom-cards-list">
                        {paginatedCredentials.map((cred) => (
                            <CredentialCard
                                key={cred.id}
                                credential={cred}
                                onViewDetail={handleViewDetail}
                                onRevoke={handleRevoke}
                                onSuspend={handleSuspend}
                                onResume={handleResume}
                                onDelete={handleDelete}
                            />
                        ))}
                    </Box>
                    <Grid2 size={12} className="flex flex-content-center" sx={{ mt: 'auto', pt: 3 }}>
                        <TablePagination
                            rowsPerPageOptions={[rowsPerPage]}
                            component="div"
                            count={credentials.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            className="card-list-pagination"
                        />
                    </Grid2>
                </>
            )}
            </Box>

            <CredentialDetailModal
                credential={selectedCredential}
                open={!!selectedCredential}
                onClose={() => setSelectedCredential(null)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onRevoke={handleRevoke}
                onSuspend={handleSuspend}
                onResume={handleResume}
            />

            <AddCredentialDialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                onSubmit={handleAdd}
            />

            <Dialog open={requestOpen} onClose={() => { setRequestOpen(false); resetRequestForm(); }}
                maxWidth="sm" fullWidth PaperProps={whiteDialogPaperProps}>
                <DialogTitle sx={coloredDialogTitleSx}>
                    Request Credential
                    <IconButton
                        aria-label="close"
                        onClick={() => { setRequestOpen(false); resetRequestForm(); }}
                        sx={(theme) => ({
                            ...dialogCloseButtonSx,
                            color: theme.palette.primary.contrastText,
                        })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={whiteDialogContentSx}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Send a credential issuance request via the DCP protocol.
                    </Typography>
                    <TextField
                        fullWidth label="Issuer DID" value={reqIssuerDid}
                        onChange={(e) => setReqIssuerDid(e.target.value)}
                        placeholder="did:web:issuer.example.com"
                        helperText="Format: did:<method>:<identifier>"
                    />
                    <TextField
                        fullWidth label="Holder PID" value={reqHolderPid}
                        onChange={(e) => setReqHolderPid(e.target.value)}
                        placeholder="did:web:holder.example.com"
                        helperText="Format: did:<method>:<identifier>"
                    />
                    <TextField
                        fullWidth label="Credential Type" value={reqCredType}
                        onChange={(e) => setReqCredType(e.target.value)}
                        placeholder="MembershipCredential"
                    />
                    <TextField
                        fullWidth label="Format" value={reqCredFormat}
                        onChange={(e) => setReqCredFormat(e.target.value)}
                        placeholder="ldp_vc"
                    />
                </DialogContent>
                <DialogActions sx={whiteDialogActionsSx}>
                    <Button onClick={() => { setRequestOpen(false); resetRequestForm(); }}
                        variant="outlined" color="primary" size="large"
                        sx={dialogCancelBtnSx}>
                        Cancel
                    </Button>
                    <Button onClick={handleRequest}
                        disabled={!reqIssuerDid.trim() || !reqHolderPid.trim() || !reqCredType.trim() || requesting}
                        variant="contained" color="primary" size="large"
                        startIcon={requesting ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={dialogSubmitBtnSx}>
                        {requesting ? 'Sending...' : 'Send Request'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbar}
                autoHideDuration={4000}
                onClose={() => { setSnackbar(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar?.severity || 'error'}
                    onClose={() => { setSnackbar(null); }}
                    variant="filled"
                >
                    {snackbar?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CredentialsPage;
