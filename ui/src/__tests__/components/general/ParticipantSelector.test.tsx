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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import ParticipantSelector from '../../../components/general/ParticipantSelector';

const mockSetActiveParticipantId = vi.fn();
const mockUseParticipant = vi.fn();

vi.mock('../../../contexts/ParticipantContext', () => ({
    useParticipant: () => mockUseParticipant(),
}));

const mockParticipants = [
    { participantContextId: 'participant-1', did: 'did:web:example1', state: 200 },
    { participantContextId: 'participant-2', did: 'did:web:example2', state: 100 },
    { participantContextId: 'participant-3', did: 'did:web:example3', state: 300 },
];

describe('ParticipantSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParticipant.mockReturnValue({
            participants: mockParticipants,
            activeParticipantId: 'participant-1',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: false,
        });
    });

    it('should render the selector icon', () => {
        render(<ParticipantSelector />);
        expect(screen.getByTestId('AccountCircleIcon')).toBeInTheDocument();
    });

    it('should open popover on click and show participants', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Active Participant')).toBeInTheDocument();
        expect(screen.getByText('participant-1')).toBeInTheDocument();
        expect(screen.getByText('participant-2')).toBeInTheDocument();
        expect(screen.getByText('participant-3')).toBeInTheDocument();
    });

    it('should display state chips with correct labels', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        for (const [id, label, color] of [
            ['participant-1', 'Active', '#A8C556'],
            ['participant-2', 'Created', '#E6A817'],
            ['participant-3', 'Deactivated', '#FF5A5A'],
        ]) {
            const row = screen.getByText(id).parentElement!;
            const chip = within(row).getByText(label).closest('.MuiChip-root');
            expect(chip).toHaveStyle({ color });
        }
    });

    it.each([undefined, 999])('should show an unknown state for %s', (state) => {
        mockUseParticipant.mockReturnValue({
            participants: [{ participantContextId: 'participant-unknown', state }],
            activeParticipantId: 'participant-unknown',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: false,
        });
        render(<ParticipantSelector />);
        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Unknown').closest('.MuiChip-root')).toHaveStyle({ color: '#9E9E9E' });
        expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('should call setActiveParticipantId when selecting a participant', () => {
        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });
        act(() => { screen.getByText('participant-2').click(); });

        expect(mockSetActiveParticipantId).toHaveBeenCalledWith('participant-2');
    });

    it('should show loading message when loading with no participants', () => {
        mockUseParticipant.mockReturnValue({
            participants: [],
            activeParticipantId: '',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: true,
        });

        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('Loading participants...')).toBeInTheDocument();
    });

    it('should show empty message when no participants available', () => {
        mockUseParticipant.mockReturnValue({
            participants: [],
            activeParticipantId: '',
            setActiveParticipantId: mockSetActiveParticipantId,
            loading: false,
        });

        render(<ParticipantSelector />);

        act(() => { screen.getByTestId('AccountCircleIcon').parentElement!.parentElement!.click(); });

        expect(screen.getByText('No participants available.')).toBeInTheDocument();
    });
});
