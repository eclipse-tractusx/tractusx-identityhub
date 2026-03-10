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

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import {
    whiteDialogPaperProps,
    coloredDialogTitleSx,
    dialogCloseButtonSx,
    whiteDialogContentSx,
    whiteDialogActionsSx,
    dialogCancelBtnSx,
    dialogSubmitBtnSx,
} from '../../theme/darkCardStyles';
import { useParticipant } from '../../contexts/ParticipantContext';

interface AddCredentialDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (json: string) => void;
}

const AddCredentialDialog: React.FC<AddCredentialDialogProps> = ({ open, onClose, onSubmit }) => {
    const { activeParticipantId } = useParticipant();
    const [credType, setCredType] = useState('');
    const [issuerDid, setIssuerDid] = useState('');
    const [subjectDid, setSubjectDid] = useState('');
    const [holderIdentifier, setHolderIdentifier] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setCredType('');
        setIssuerDid('');
        setSubjectDid('');
        setHolderIdentifier('');
        setExpirationDate('');
    };

    const handleSubmit = () => {
        const id = crypto.randomUUID();
        const body = {
            id,
            participantContextId: activeParticipantId,
            verifiableCredentialContainer: {
                credential: {
                    '@context': [
                        'https://www.w3.org/2018/credentials/v1',
                        'https://w3id.org/catenax/credentials/v1.0.0',
                    ],
                    id,
                    type: ['VerifiableCredential', credType.trim()],
                    issuer: issuerDid.trim(),
                    issuanceDate: new Date().toISOString(),
                    ...(expirationDate ? { expirationDate: new Date(expirationDate).toISOString() } : {}),
                    credentialSubject: [
                        {
                            id: subjectDid.trim(),
                            ...(holderIdentifier.trim() ? { holderIdentifier: holderIdentifier.trim() } : {}),
                        },
                    ],
                    credentialSchema: [
                        {
                            id: 'https://example.com/schema',
                            type: 'JsonSchemaValidator',
                        },
                    ],
                    credentialStatus: [
                        {
                            id: `https://example.com/status/${id}`,
                            type: 'CredentialStatusList2021',
                        },
                    ],
                },
            },
        };
        setSubmitting(true);
        onSubmit(JSON.stringify(body));
        resetForm();
        setSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValidDid = (v: string) => /^did:\w+:.+/.test(v.trim());
    const issuerDidError = !!issuerDid.trim() && !isValidDid(issuerDid);
    const subjectDidError = !!subjectDid.trim() && !isValidDid(subjectDid);
    const canSubmit = credType.trim() && isValidDid(issuerDid) && isValidDid(subjectDid) && !submitting;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={whiteDialogPaperProps}
        >
            <DialogTitle sx={coloredDialogTitleSx}>
                Add Credential
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
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
                    Add a new verifiable credential to the current participant context.
                </Typography>
                <TextField
                    fullWidth label="Credential Type" value={credType}
                    onChange={(e) => setCredType(e.target.value)}
                    placeholder="MembershipCredential"
                />
                <TextField
                    fullWidth label="Issuer DID" value={issuerDid}
                    onChange={(e) => setIssuerDid(e.target.value)}
                    placeholder="did:web:issuer.example.com"
                    error={issuerDidError}
                    helperText={issuerDidError ? 'Must be a valid DID (e.g. did:web:example.com)' : 'Format: did:<method>:<identifier>'}
                />
                <TextField
                    fullWidth label="Subject DID" value={subjectDid}
                    onChange={(e) => setSubjectDid(e.target.value)}
                    placeholder="did:web:subject.example.com"
                    error={subjectDidError}
                    helperText={subjectDidError ? 'Must be a valid DID (e.g. did:web:example.com)' : 'Format: did:<method>:<identifier>'}
                />
                <TextField
                    fullWidth label="Holder Identifier (BPN)" value={holderIdentifier}
                    onChange={(e) => setHolderIdentifier(e.target.value)}
                    placeholder={activeParticipantId}
                />
                <TextField
                    fullWidth label="Expiration Date" type="date" value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
            </DialogContent>
            <DialogActions sx={whiteDialogActionsSx}>
                <Button onClick={handleClose} variant="outlined" color="primary" size="large"
                    sx={dialogCancelBtnSx}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit}
                    variant="contained" color="primary" size="large"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : undefined}
                    sx={dialogSubmitBtnSx}>
                    {submitting ? 'Adding...' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCredentialDialog;
