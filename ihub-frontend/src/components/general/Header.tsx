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

import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Policy from '@mui/icons-material/Policy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import { Chip, Divider, ListItemIcon, Typography, Tooltip } from '@mui/material';
import { Logout, ContentCopy, Settings, SwapHoriz } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import { useParticipant } from '../../contexts/ParticipantContext';

export default function Header() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
    const [scrolled, setScrolled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    const { isAuthenticated, user, logout } = useAuth();
    const { participants, activeParticipantId, setActiveParticipantId } = useParticipant();
    const participantId = activeParticipantId || 'CX-Operator';

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setShowParticipants(false);
        handleMobileMenuClose();
    };

    const handleLogout = async () => {
        try {
            handleMenuClose();
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const handleCopyParticipantId = async () => {
        try {
            await navigator.clipboard.writeText(participantId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            id={menuId}
            open={isMenuOpen}
            onClose={handleMenuClose}
            PaperProps={{
                elevation: 8,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.15))',
                    mt: 1.5,
                    minWidth: 280,
                    borderRadius: 2,
                    '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                    },
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <Box sx={{ px: 2, py: 2, background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)' }}>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
                >
                    {isAuthenticated && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Felipe Bustillo'}
                </Typography>
                {isAuthenticated && user?.email && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                        {user.email}
                    </Typography>
                )}
                <Box
                    sx={{
                        mt: 1,
                        px: 1.5,
                        py: 0.75,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        borderRadius: 1,
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            letterSpacing: '0.3px',
                            flex: 1
                        }}
                    >
                        Company ID: {participantId}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <Tooltip title={copied ? "Copied!" : "Copy ID"} arrow>
                            <IconButton
                                size="small"
                                onClick={handleCopyParticipantId}
                                sx={{
                                    padding: '4px',
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.15)'
                                    }
                                }}
                            >
                                <ContentCopy sx={{ fontSize: '0.875rem' }} />
                            </IconButton>
                        </Tooltip>
                        {participants.length > 1 && (
                            <Tooltip title="Switch participant" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowParticipants(!showParticipants)}
                                    sx={{
                                        padding: '4px',
                                        color: 'primary.main',
                                        '&:hover': {
                                            backgroundColor: 'rgba(25, 118, 210, 0.15)'
                                        }
                                    }}
                                >
                                    <SwapHoriz sx={{ fontSize: '0.875rem' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
                {showParticipants && participants.length > 1 && (
                    <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        {participants.map((p) => (
                            <Box
                                key={p.participantContextId}
                                onClick={() => {
                                    setActiveParticipantId(p.participantContextId);
                                    setShowParticipants(false);
                                }}
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    borderRadius: 1,
                                    bgcolor: p.participantContextId === activeParticipantId
                                        ? 'rgba(25, 118, 210, 0.12)'
                                        : 'transparent',
                                    borderLeft: p.participantContextId === activeParticipantId
                                        ? '3px solid'
                                        : '3px solid transparent',
                                    borderLeftColor: p.participantContextId === activeParticipantId
                                        ? 'primary.main'
                                        : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.7rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'text.primary',
                                    }}
                                >
                                    {p.participantContextId}
                                </Typography>
                                <Chip
                                    label={p.state === 1 ? 'Active' : p.state === 0 ? 'Created' : p.state === 2 ? 'Deactivated' : 'Unknown'}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        bgcolor: 'transparent',
                                        color: p.state === 1 ? '#00aa55' : p.state === 0 ? '#ffa602' : p.state === 2 ? '#D91E18' : '#888',
                                        border: '1px solid',
                                        borderColor: p.state === 1 ? '#00aa55' : p.state === 0 ? '#ffa602' : p.state === 2 ? '#D91E18' : '#888',
                                        flexShrink: 0,
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 1 }} />

            <MenuItem
                onClick={handleMenuClose}
                sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': { backgroundColor: 'rgba(66, 165, 245, 0.08)' }
                }}
            >
                <ListItemIcon>
                    <AccountCircle fontSize="small" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <Typography variant="body2">Profile</Typography>
            </MenuItem>

            <MenuItem
                onClick={handleMenuClose}
                sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': { backgroundColor: 'rgba(66, 165, 245, 0.08)' }
                }}
            >
                <ListItemIcon>
                    <Settings fontSize="small" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <Typography variant="body2">Settings</Typography>
            </MenuItem>

            <Divider sx={{ my: 1 }} />

            <MenuItem
                onClick={handleLogout}
                sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.08)' }
                }}
            >
                <ListItemIcon>
                    <Logout fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <Typography variant="body2" color="error">Logout</Typography>
            </MenuItem>
        </Menu>
    );

    const mobileMenuId = 'primary-search-account-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem>
                <IconButton size="large" aria-label="show notifications">
                    <Badge badgeContent={17} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <p>Notifications</p>
            </MenuItem>
            <MenuItem>
                <IconButton size="large" aria-label="configure policies">
                    <Policy />
                </IconButton>
                <p>Policy Config</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton size="large" aria-label="account of current user">
                    <AccountCircle />
                </IconButton>
                <p>Profile</p>
            </MenuItem>
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" className={`ichub-header ${scrolled ? "scrolled" : ""}`}>
                <Toolbar>
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'flex-start' }}>
                        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="/241117_Tractus_X_Logo_Only_RGB.png"
                                alt="Eclipse Tractus-X logo"
                                className='small-logo'
                                style={{ display: 'block' }}
                            />
                        </a>
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'flex-start' }}>
                        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="/241117_Tractus_X_Logo_RGB_Light_Version.png"
                                alt="Eclipse Tractus-X logo"
                                className='main-logo'
                                style={{ display: 'block' }}
                            />
                        </a>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: '1.6rem', md: '2rem' },
                                fontWeight: '700',
                                color: 'white',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '0.5px'
                            }}
                        >
                            Identity Hub
                        </Typography>
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                        <Tooltip title="Notifications are coming soon" arrow>
                            <IconButton
                                size="large"
                                aria-label="show 17 new notifications"
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <Badge badgeContent={17} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Policy/Governance Configuration is coming soon" arrow>
                            <IconButton
                                size="large"
                                aria-label="configure policies"
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <Policy />
                            </IconButton>
                        </Tooltip>
                        <IconButton
                            size="large"
                            edge="end"
                            aria-label="account of current user"
                            aria-controls={menuId}
                            aria-haspopup="true"
                            onClick={handleProfileMenuOpen}
                            className='user-button'
                        >
                            <AccountCircle />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="show more"
                            aria-controls={mobileMenuId}
                            aria-haspopup="true"
                            onClick={handleMobileMenuOpen}
                            color="inherit"
                        >
                            <MoreIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            {renderMobileMenu}
            {renderMenu}
        </Box>
    );
}
