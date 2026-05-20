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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/HttpClient', () => ({
    default: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn() },
}));

vi.mock('../../../services/EnvironmentService', () => ({
    default: {
        isAuthEnabled: vi.fn(() => false),
        getApiConfig: vi.fn(() => ({ timeout: 30000 })),
        getApiHeaders: vi.fn(() => ({})),
    },
    getIhubBackendUrl: vi.fn(() => ''),
    isAuthEnabled: vi.fn(() => false),
}));

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: vi.fn(() => ({
        participants: [],
        activeParticipantId: '',
        setActiveParticipantId: vi.fn(),
        loading: false,
        refresh: vi.fn(),
    })),
}));

import Sidebar from '../../../components/general/Sidebar';

function renderSidebar(path = '/') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Sidebar />
        </MemoryRouter>
    );
}

describe('Sidebar', () => {
    it('should render navigation icons', () => {
        renderSidebar();
        expect(screen.getByTestId('PeopleIcon')).toBeInTheDocument();
        expect(screen.getByTestId('KeyIcon')).toBeInTheDocument();
        expect(screen.getByTestId('FingerprintIcon')).toBeInTheDocument();
        expect(screen.getByTestId('VerifiedUserIcon')).toBeInTheDocument();
    });

    it('should have correct aria-labels from tooltips', () => {
        renderSidebar();
        expect(screen.getByLabelText('Participants')).toBeInTheDocument();
        expect(screen.getByLabelText('Key Pairs')).toBeInTheDocument();
        expect(screen.getByLabelText('DIDs')).toBeInTheDocument();
        expect(screen.getByLabelText('Credentials')).toBeInTheDocument();
    });

    it('should mark active link for participants', () => {
        renderSidebar('/participants');
        const link = screen.getByLabelText('Participants');
        expect(link.className).toContain('active');
    });

    it('should mark active link for credentials', () => {
        renderSidebar('/credentials');
        const link = screen.getByLabelText('Credentials');
        expect(link.className).toContain('active');
    });

    it('should not mark other links as active', () => {
        renderSidebar('/participants');
        const credLink = screen.getByLabelText('Credentials');
        expect(credLink.className).not.toContain('active');
    });

    it('should have correct link destinations', () => {
        renderSidebar();
        const links = screen.getAllByRole('link');
        const hrefs = links.map(l => l.getAttribute('href'));
        expect(hrefs).toContain('/participants');
        expect(hrefs).toContain('/keypairs');
        expect(hrefs).toContain('/dids');
        expect(hrefs).toContain('/credentials');
        expect(hrefs).not.toContain('/search');
    });

    it('should not have /identity link', () => {
        renderSidebar();
        const links = screen.getAllByRole('link');
        const hrefs = links.map(l => l.getAttribute('href'));
        expect(hrefs).not.toContain('/identity');
    });
});
