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

import { Box, Tooltip } from "@mui/material";
import { NavLink, useLocation } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import KeyIcon from '@mui/icons-material/Key';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ParticipantSelector from './ParticipantSelector';

const identityItems = [
    { icon: <PeopleIcon />, path: '/participants', label: 'Participants' },
    { icon: <KeyIcon />, path: '/keypairs', label: 'Key Pairs' },
    { icon: <FingerprintIcon />, path: '/dids', label: 'DIDs' },
    { icon: <VerifiedUserIcon />, path: '/credentials', label: 'Credentials' },
];

const Sidebar = () => {
    const location = useLocation();

    const renderNavItem = (item: { icon: React.ReactElement; path: string; label: string }) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
            <Tooltip key={item.path} title={item.label} placement="right" arrow>
                <NavLink
                    to={item.path}
                    className={`iconButton ${isActive ? "active" : ""}`}
                >
                    <Box className={`iconWrapper ${isActive ? 'active' : ''}`}>
                        {item.icon}
                    </Box>
                </NavLink>
            </Tooltip>
        );
    };

    return (
        <Box className="sidebarContainer">
            <Box className="regularItems">
                {identityItems.map(renderNavItem)}
            </Box>
            <Box sx={{ mt: 'auto', pb: 2 }}>
                <ParticipantSelector />
            </Box>
        </Box>
    );
};

export default Sidebar;
