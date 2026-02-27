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
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Chip,
    Snackbar,
    Alert,
    Grid2,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SyncLockIcon from '@mui/icons-material/SyncLock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import httpClient from '../../services/HttpClient';
import { CredentialResource, getStateName } from '../credentials/types';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../../contexts/ParticipantContext';
import { encodeParticipantId } from '../../services/participantUtils';
import { paletteDefinitions } from '../../theme/palette';
import { cardSx, textFieldSx, accentColors, emptyStateSx, chipTransparentBg } from '../../theme/darkCardStyles';

type EntityType = 'all' | 'credentials' | 'keypairs' | 'dids';

interface SearchResult {
    type: EntityType;
    id: string;
    title: string;
    subtitle: string;
    chipLabel: string;
    chipColor: string;
    path: string;
}

function getCredentialStateStyle(state?: number): { bg: string; color: string } {
    if (state === undefined) return { bg: 'transparent', color: '#5B9BD5' };
    const stateMap = paletteDefinitions.credentialState as Record<number, { bg: string; color: string }>;
    return stateMap[state] || { bg: 'transparent', color: '#5B9BD5' };
}

const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const { activeParticipantId } = useParticipant();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [entityFilter, setEntityFilter] = useState<EntityType>('all');

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        setError(null);
        const allResults: SearchResult[] = [];
        const q = query.trim().toLowerCase();

        try {
            // Search credentials (cross-participant)
            const credResponse = await httpClient.get('/api/identity/v1alpha/credentials', {
                params: { query: query.trim() },
            });
            const credentials: CredentialResource[] = Array.isArray(credResponse.data) ? credResponse.data : [];
            for (const cred of credentials) {
                const vc = cred.verifiableCredential.credential;
                const typeName = vc.type.filter(t => t !== 'VerifiableCredential')[0] || 'VerifiableCredential';
                const stateStyle = getCredentialStateStyle(cred.state);
                allResults.push({
                    type: 'credentials',
                    id: cred.id,
                    title: typeName,
                    subtitle: cred.id,
                    chipLabel: getStateName(cred.state),
                    chipColor: stateStyle.color,
                    path: `/credentials/${encodeURIComponent(cred.id)}`,
                });
            }

            // Search keypairs (for active participant)
            if (activeParticipantId) {
                try {
                    const pid = encodeURIComponent(encodeParticipantId(activeParticipantId));
                    const kpResponse = await httpClient.get(`/api/identity/v1alpha/participants/${pid}/keypairs`);
                    const keypairs = Array.isArray(kpResponse.data) ? kpResponse.data : [];
                    for (const kp of keypairs) {
                        const keyId = kp.keyId || kp.id || '';
                        if (keyId.toLowerCase().includes(q) ||
                            (kp.privateKeyAlias || '').toLowerCase().includes(q)) {
                            allResults.push({
                                type: 'keypairs',
                                id: keyId,
                                title: keyId,
                                subtitle: kp.privateKeyAlias || 'No alias',
                                chipLabel: 'Key Pair',
                                chipColor: accentColors.brandLightBlue,
                                path: '/keypairs',
                            });
                        }
                    }
                } catch {
                    // Silently skip keypairs if endpoint fails
                }

                // Search DIDs (for active participant)
                try {
                    const pid = encodeURIComponent(encodeParticipantId(activeParticipantId));
                    const didResponse = await httpClient.post(`/api/identity/v1alpha/participants/${pid}/dids/query`, {});
                    const dids = Array.isArray(didResponse.data) ? didResponse.data : [];
                    for (const doc of dids) {
                        const didId = doc.id || '';
                        if (didId.toLowerCase().includes(q)) {
                            allResults.push({
                                type: 'dids',
                                id: didId,
                                title: didId,
                                subtitle: `${(doc.verificationMethod || []).length} verification methods`,
                                chipLabel: 'DID',
                                chipColor: '#A8C556',
                                path: '/dids',
                            });
                        }
                    }
                } catch {
                    // Silently skip DIDs if endpoint fails
                }
            }

            setResults(allResults);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setError(message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const filteredResults = entityFilter === 'all'
        ? results
        : results.filter(r => r.type === entityFilter);

    const getTypeIcon = (type: EntityType) => {
        switch (type) {
            case 'credentials': return <SyncLockIcon sx={{ fontSize: 14, mr: 0.5 }} />;
            case 'keypairs': return <VpnKeyIcon sx={{ fontSize: 14, mr: 0.5 }} />;
            case 'dids': return <DeviceHubIcon sx={{ fontSize: 14, mr: 0.5 }} />;
            default: return null;
        }
    };

    const countByType = (type: EntityType) =>
        type === 'all' ? results.length : results.filter(r => r.type === type).length;

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Grid2 container direction="column" alignItems="center" sx={{ mb: 3 }}>
                <Grid2 className="page-catalog title flex flex-content-center">
                    <Typography className="text">Search</Typography>
                </Grid2>
            </Grid2>

            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Search credentials, key pairs, DIDs..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={textFieldSx}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: accentColors.brandLightBlue }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            {searched && results.length > 0 && (
                <Box sx={{ maxWidth: 800, mx: 'auto', mb: 2 }}>
                    <ToggleButtonGroup
                        value={entityFilter}
                        exclusive
                        onChange={(_, val) => { if (val !== null) setEntityFilter(val); }}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                color: accentColors.brandTextMuted,
                                borderColor: accentColors.brandBorder,
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                px: 2,
                                '&.Mui-selected': {
                                    color: accentColors.brandText,
                                    bgcolor: 'rgba(1,32,96,0.5)',
                                    borderColor: accentColors.brandLightBlue,
                                },
                            },
                        }}
                    >
                        <ToggleButton value="all">All ({countByType('all')})</ToggleButton>
                        <ToggleButton value="credentials">Credentials ({countByType('credentials')})</ToggleButton>
                        <ToggleButton value="keypairs">Key Pairs ({countByType('keypairs')})</ToggleButton>
                        <ToggleButton value="dids">DIDs ({countByType('dids')})</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {loading && (
                <Typography sx={{ textAlign: 'center', color: accentColors.brandTextMuted }}>
                    Searching...
                </Typography>
            )}

            {searched && !loading && filteredResults.length === 0 && (
                <Box sx={emptyStateSx}>
                    <SearchIcon sx={{ fontSize: 64, color: accentColors.brandLightBlue, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: accentColors.brandText, mb: 1 }}>
                        No Results
                    </Typography>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted }}>
                        No {entityFilter === 'all' ? 'results' : entityFilter} found matching &quot;{query}&quot;.
                    </Typography>
                </Box>
            )}

            {filteredResults.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted, mb: 1 }}>
                        {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
                    </Typography>
                    {filteredResults.map((result) => (
                        <Card
                            key={`${result.type}-${result.id}`}
                            onClick={() => navigate(result.path)}
                            sx={{
                                ...cardSx,
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'rgba(15,113,203,0.85)', transform: 'translateX(4px)' },
                            }}
                        >
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {getTypeIcon(result.type)}
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.9rem', color: accentColors.brandText }}>
                                            {result.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: accentColors.brandTextMuted, fontSize: '0.75rem' }}>
                                        {result.subtitle}
                                    </Typography>
                                </Box>
                                <Chip label={result.chipLabel} size="small"
                                    sx={chipTransparentBg(result.chipColor)} />
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {!searched && !loading && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <SearchIcon sx={{ fontSize: 64, color: accentColors.brandLightBlue, opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: accentColors.brandTextMuted }}>
                        Search across credentials, key pairs, and DIDs in the Identity Hub.
                    </Typography>
                </Box>
            )}

            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="error" onClose={() => setError(null)} variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SearchPage;
