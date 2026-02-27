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

import React, { useState } from 'react';
import { Box, Tooltip, Popover, Typography, Chip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useParticipant } from '../../contexts/ParticipantContext';
import { accentColors } from '../../theme/darkCardStyles';

const stateLabel = (state?: number): string => {
    switch (state) {
        case 0: return 'Created';
        case 1: return 'Active';
        case 2: return 'Deactivated';
        default: return 'Unknown';
    }
};

const stateColor = (state?: number): string => {
    switch (state) {
        case 1: return '#A8C556';
        case 0: return '#E6A817';
        case 2: return '#FF5A5A';
        default: return '#888888';
    }
};

const ParticipantSelector: React.FC = () => {
    const { participants, activeParticipantId, setActiveParticipantId, loading } = useParticipant();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const open = Boolean(anchorEl);

    const handleSelect = (id: string) => {
        setActiveParticipantId(id);
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title={activeParticipantId || 'Select participant'} placement="right" arrow>
                <Box
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    className={`iconButton ${activeParticipantId ? 'active' : ''}`}
                >
                    <Box className={`iconWrapper ${open ? 'active' : ''}`}>
                        <AccountCircleIcon />
                    </Box>
                </Box>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgb(0,0,0)',
                        border: `2px solid ${accentColors.brandBorder}`,
                        boxShadow: `0 0 12px ${accentColors.brandBlue}`,
                        borderRadius: '8px',
                        minWidth: 280,
                        maxWidth: 400,
                        maxHeight: 400,
                        overflow: 'auto',
                    },
                }}
            >
                <Box sx={{ p: 2, borderBottom: `1px solid ${accentColors.brandBorder}` }}>
                    <Typography variant="subtitle2" sx={{ color: accentColors.brandText, fontWeight: 700 }}>
                        Active Participant
                    </Typography>
                </Box>
                {loading && participants.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                            Loading participants...
                        </Typography>
                    </Box>
                ) : participants.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                            No participants available.
                        </Typography>
                    </Box>
                ) : (
                    participants.map((p) => (
                        <Box
                            key={p.participantContextId}
                            onClick={() => handleSelect(p.participantContextId)}
                            sx={{
                                p: 1.5,
                                px: 2,
                                cursor: 'pointer',
                                bgcolor: p.participantContextId === activeParticipantId
                                    ? 'rgba(1,32,96,0.5)'
                                    : 'transparent',
                                '&:hover': { bgcolor: 'rgba(1,32,96,0.3)' },
                                borderLeft: p.participantContextId === activeParticipantId
                                    ? `3px solid ${accentColors.brandLightBlue}`
                                    : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2" sx={{
                                color: accentColors.brandText,
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {p.participantContextId}
                            </Typography>
                            <Chip
                                label={stateLabel(p.state)}
                                size="small"
                                sx={{
                                    color: stateColor(p.state),
                                    border: `1px solid ${stateColor(p.state)}`,
                                    bgcolor: 'transparent',
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    flexShrink: 0,
                                }}
                            />
                        </Box>
                    ))
                )}
            </Popover>
        </>
    );
};

export default ParticipantSelector;
