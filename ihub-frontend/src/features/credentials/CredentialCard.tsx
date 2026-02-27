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
    Typography,
    Chip,
    Box,
    Tooltip,
    IconButton,
    Menu,
} from '@mui/material';
import MoreVert from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { CredentialResource, getStateName } from './types';

interface CredentialCardProps {
    credential: CredentialResource;
    onViewDetail: (id: string) => void;
    onRevoke?: (id: string) => void;
    onSuspend?: (id: string) => void;
    onResume?: (id: string) => void;
    onDelete?: (id: string) => void;
}

function getCredentialTypeName(types: string[]): string {
    const filtered = types.filter(t => t !== 'VerifiableCredential');
    return filtered.length > 0 ? filtered[0] : 'VerifiableCredential';
}

function isExpired(expirationDate?: string): boolean {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
}

const CredentialCard: React.FC<CredentialCardProps> = ({
    credential,
    onViewDetail,
    onRevoke,
    onSuspend,
    onResume,
    onDelete,
}) => {
    const vc = credential.verifiableCredential.credential;
    const typeName = getCredentialTypeName(vc.type);
    const expired = isExpired(vc.expirationDate);
    const subject = vc.credentialSubject?.[0];
    const stateName = getStateName(credential.state);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const menuOpen = Boolean(anchorEl);

    const canRevoke = credential.state === 400 || credential.state === 500;
    const canSuspend = credential.state === 400 || credential.state === 500;
    const canResume = credential.state === 700;
    const hasActions = canRevoke || canSuspend || canResume || !!onDelete;

    return (
        <Box className="custom-card-box">
            <Box
                className="custom-card"
                sx={{ minHeight: '200px' }}
                onClick={() => onViewDetail(credential.id)}
            >
                <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                    <Chip
                        label={stateName}
                        variant="outlined"
                        sx={credential.state === 400 || credential.state === 500
                            ? { color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: 'none', height: '32px' }
                            : credential.state === 600 || credential.state === 700
                                ? { color: '#fff', backgroundColor: 'rgba(255,90,90,0.3)', borderRadius: '4px', border: '1px solid #FF5A5A', height: '32px' }
                                : { color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.4)', height: '32px' }
                        }
                    />
                    {expired && (
                        <Chip
                            label="Expired"
                            size="small"
                            sx={{ color: '#fff', backgroundColor: 'rgba(255,90,90,0.3)', borderRadius: '4px', border: '1px solid #FF5A5A', height: '32px' }}
                        />
                    )}
                    <Box className="custom-card-header-buttons">
                        {hasActions && (
                            <Tooltip title="More options" arrow>
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAnchorEl(e.currentTarget);
                                    }}
                                >
                                    <MoreVert sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', pb: 2.5 }}>
                    <Tooltip title={typeName} arrow placement="top">
                        <Typography variant="h5" sx={{ mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word', cursor: 'help' }}>
                            {typeName}
                        </Typography>
                    </Tooltip>

                    <Box sx={{ mt: 0.5, flex: 1, minHeight: 0 }}>
                        {subject && (
                            <>
                                <Typography
                                    sx={{
                                        fontSize: '0.65rem',
                                        color: 'rgba(255,255,255,0.45)',
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px',
                                        mb: '0px',
                                        display: 'block'
                                    }}
                                >
                                    Holder
                                </Typography>
                                <Tooltip title={subject.holderIdentifier || subject.id} arrow placement="top">
                                    <Typography
                                        sx={{
                                            fontFamily: 'Monaco, "Lucida Console", monospace',
                                            fontSize: '0.76rem',
                                            color: 'rgba(255,255,255,0.87)',
                                            lineHeight: 1.1,
                                            fontWeight: 500,
                                            letterSpacing: '0.1px',
                                            display: 'block',
                                            mb: '4px',
                                            maxWidth: '100%',
                                            cursor: 'help',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {subject.holderIdentifier || subject.id}
                                    </Typography>
                                </Tooltip>
                            </>
                        )}

                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                color: 'rgba(255,255,255,0.45)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                mb: '0px',
                                display: 'block'
                            }}
                        >
                            Expires
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'Monaco, "Lucida Console", monospace',
                                fontSize: '0.76rem',
                                color: expired ? '#FF5A5A' : 'rgba(255,255,255,0.87)',
                                lineHeight: 1.1,
                                fontWeight: 500,
                                letterSpacing: '0.1px',
                                display: 'block',
                                mb: '0px',
                            }}
                        >
                            {vc.expirationDate ? new Date(vc.expirationDate).toLocaleDateString() : 'No expiration'}
                        </Typography>
                    </Box>
                </Box>

            </Box>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => setAnchorEl(null)}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { backgroundColor: 'white !important' } }}
            >
                {canRevoke && onRevoke && (
                    <Box
                        onClick={() => {
                            onRevoke(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                        <BlockIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Revoke</Box>
                    </Box>
                )}
                {canSuspend && onSuspend && (
                    <Box
                        onClick={() => {
                            onSuspend(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                        <PauseCircleIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Suspend</Box>
                    </Box>
                )}
                {canResume && onResume && (
                    <Box
                        onClick={() => {
                            onResume(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                        <PlayCircleIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Resume</Box>
                    </Box>
                )}
                {onDelete && (
                    <Box
                        onClick={() => {
                            onDelete(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{ display: 'flex', alignItems: 'center', padding: '4px 16px', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                        <DeleteIcon fontSize="small" sx={{ marginRight: 1, color: '#000 !important', fill: '#000 !important' }} />
                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>Delete</Box>
                    </Box>
                )}
            </Menu>
        </Box>
    );
};

export default CredentialCard;
