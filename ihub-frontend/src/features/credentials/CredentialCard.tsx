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

import React, { useState } from 'react';
import {
    Typography,
    Chip,
    Box,
    Tooltip,
    IconButton,
    Menu,
    Button,
} from '@mui/material';
import MoreVert from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
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
        <>
            <Box
                sx={{
                    height: '100%',
                    minHeight: {
                        xs: 320, sm: 340, md: 360,
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: {
                        xs: '20px',
                        sm: '24px',
                    },
                    cursor: 'pointer',

                    m: {
                        xs: 1, sm: 1.5, md: 2,
                    },

                    p: {
                        xs: 2, sm: 2.5, md: 3,
                    },

                    background:
                        'linear-gradient(180deg, rgba(9,14,24,0.98) 0%, rgba(4,8,20,0.98) 100%)',

                    border: '1px solid rgba(0, 212, 255, 0.15)',

                    boxShadow:
                        '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',

                    transition: 'all 0.3s ease',

                    '&:hover': {
                        transform: {
                            xs: 'translateY(-2px)',
                            sm: 'translateY(-4px)',
                            md: 'translateY(-6px)',
                        },
                        borderColor: 'rgba(0, 212, 255, 0.35)',
                        boxShadow:
                            '0 30px 80px rgba(0,0,0,0.55), 0 0 20px rgba(0,212,255,0.08)',
                    },
                }}
                onClick={() => onViewDetail(credential.id)}
            >
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

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        p: 3,
                        pb: 2,
                    }}
                >

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Chip
                            label={stateName.toUpperCase()}
                            size="small"
                            sx={{
                                height: 30,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                borderRadius: '8px',
                                ...(credential.state === 400 ||
                                    credential.state === 500
                                    ? {
                                        color: '#0B0F1A',
                                        backgroundColor: '#FFFFFF',
                                    }
                                    : credential.state === 600 ||
                                        credential.state === 700
                                        ? {
                                            color: '#FF5A5A',
                                            backgroundColor:
                                                'rgba(255,90,90,0.12)',
                                            border:
                                                '1px solid rgba(255,90,90,0.35)',
                                        }
                                        : {
                                            color:
                                                'rgba(255,255,255,0.75)',
                                            backgroundColor:
                                                'rgba(255,255,255,0.05)',
                                            border:
                                                '1px dashed rgba(255,255,255,0.20)',
                                        }),
                            }}
                        />

                        {expired && (
                            <Chip
                                label="EXPIRED"
                                size="small"
                                sx={{
                                    height: 30,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    borderRadius: '8px',
                                    color: '#FF5A5A',
                                    backgroundColor:
                                        'rgba(255,90,90,0.12)',
                                    border:
                                        '1px solid rgba(255,90,90,0.35)',
                                }}
                            />
                        )}
                    </Box>

                    {/* Burger Menu */}
                    {hasActions && (
                        <Tooltip title="More options" arrow>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAnchorEl(e.currentTarget);
                                }}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    color: 'rgba(255,255,255,0.65)',
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
                    )}
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        px: 3,
                        pb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        color: '#ffffff',
                    }}
                >
                    {/* Credential Type */}
                    <Tooltip title={typeName} arrow placement="top">
                        <Typography
                            sx={{
                                fontFamily:
                                    '"SF Mono", "Roboto Mono", monospace',
                                fontSize: '1.9rem',
                                fontWeight: 700,
                                lineHeight: 1.1,
                                mb: 2,
                                letterSpacing: '-0.02em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'help',
                            }}
                        >
                            {typeName}
                        </Typography>
                    </Tooltip>

                    {/* Holder */}
                    {subject && (
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
                                HOLDER
                            </Typography>

                            <Tooltip
                                title={
                                    subject.holderIdentifier ||
                                    subject.id
                                }
                                arrow
                            >
                                <Typography
                                    sx={{
                                        fontFamily:
                                            '"SF Mono", "Roboto Mono", monospace',
                                        fontSize: '0.78rem',
                                        lineHeight: 1.5,
                                        color:
                                            'rgba(255,255,255,0.90)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        cursor: 'help',
                                    }}
                                >
                                    {subject.holderIdentifier ||
                                        subject.id}
                                </Typography>
                            </Tooltip>
                        </Box>
                    )}

                    {/* Expires */}
                    <Box sx={{ mb: 2 }}>
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
                            EXPIRES
                        </Typography>

                        <Typography
                            sx={{
                                fontFamily:
                                    '"SF Mono", "Roboto Mono", monospace',
                                fontSize: '0.82rem',
                                color: expired
                                    ? '#FF5A5A'
                                    : 'rgba(255,255,255,0.85)',
                            }}
                        >
                            {vc.expirationDate
                                ? new Date(
                                    vc.expirationDate,
                                ).toLocaleDateString()
                                : 'No expiration'}
                        </Typography>
                    </Box>

                    {/* Push footer to bottom */}
                    <Box sx={{ flex: 1 }} />

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
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(credential.id);
                            }}
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

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => setAnchorEl(null)}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{
                    horizontal: 'right',
                    vertical: 'top',
                }}
                anchorOrigin={{
                    horizontal: 'right',
                    vertical: 'bottom',
                }}
                PaperProps={{
                    sx: {
                        
                        background:
                            'linear-gradient(180deg, rgba(9,14,24,1) 0%, rgba(4,8,20,1) 100%)',

                                   color: '#FFFFFF',

                        
                        borderRadius: '20px',

                        
                        minWidth: 220,

                        
                        border: '1px solid rgba(0, 212, 255, 0.15)',

                        
                        boxShadow:
                            '0 20px 60px rgba(0,0,0,0.45), 0 0 20px rgba(0,212,255,0.08)',

                        
                        py: 0.5,

                        
                        backdropFilter: 'blur(20px)',

                        
                        mt: 1,

                        
                        '& .MuiSvgIcon-root': {
                            color: 'inherit',
                        },
                    },
                }}
            >
                {canRevoke && onRevoke && (
                    <Box
                        onClick={() => {
                            onRevoke(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: '#08befa',
                            },
                        }}
                    >
                        <BlockIcon
                            fontSize="small"
                            sx={{ color: '#111827' }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.875rem',
                                color: '#ffffff',
                                fontWeight: 500,
                            }}
                        >
                            Revoke
                        </Typography>
                    </Box>
                )}

                {canSuspend && onSuspend && (
                    <Box
                        onClick={() => {
                            onSuspend(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: '#08befa',
                            },
                        }}
                    >
                        <PauseCircleIcon
                            fontSize="small"
                            sx={{ color: '#111827' }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.875rem',
                                color: '#FFFFFF',
                                fontWeight: 500,
                            }}
                        >
                            Suspend
                        </Typography>
                    </Box>
                )}

                {canResume && onResume && (
                    <Box
                        onClick={() => {
                            onResume(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: '#08befa',
                            },
                        }}
                    >
                        <PlayCircleIcon
                            fontSize="small"
                            sx={{ color: '#111827' }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                fontWeight: 500,
                            }}
                        >
                            Resume
                        </Typography>
                    </Box>
                )}

                {onDelete && (
                    <Box
                        onClick={() => {
                            onDelete(credential.id);
                            setAnchorEl(null);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: '#08befa',
                            },
                        }}
                    >
                        <DeleteIcon
                            fontSize="small"
                            sx={{ color: '#ffffff' }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.875rem',
                                color: '#ffffff',
                                fontWeight: 500,
                            }}
                        >
                            Delete
                        </Typography>
                    </Box>
                )}
            </Menu>
        </>
    );
};

export default CredentialCard;
