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

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import useAuth from '../../hooks/useAuth';
import ErrorPage from '../common/ErrorPage';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, error } = useAuth();

    if (isLoading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={3}
                sx={{ background: 'white', color: 'black' }}>
                <CircularProgress size={80} sx={{ color: 'black' }} />
                <Typography variant="h4" fontWeight="bold">Identity Hub</Typography>
                <Typography variant="h6">Authenticating...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <ErrorPage
                title="Authentication Error"
                message={error}
                causes={['Session expired or invalid', 'Authentication service unavailable']}
                showRefreshButton={true}
            />
        );
    }

    if (!isAuthenticated) {
        return fallback || (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={3}
                sx={{ background: 'white', color: 'black' }}>
                <CircularProgress size={80} sx={{ color: 'black' }} />
                <Typography variant="h4" fontWeight="bold">Identity Hub</Typography>
                <Typography variant="h6">Redirecting to login...</Typography>
            </Box>
        );
    }

    return <>{children}</>;
}

export default ProtectedRoute;
