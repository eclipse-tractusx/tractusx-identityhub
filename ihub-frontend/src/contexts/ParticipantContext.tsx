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

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import httpClient from '../services/HttpClient';
import { useCachedList } from '../hooks/useCachedFetch';

export interface ParticipantData {
    participantContextId: string;
    did?: string;
    state?: number;
    apiTokenAlias?: string;
    roles?: string[];
    properties?: Record<string, unknown>;
    createdAt?: number;
    lastModified?: number;
}

interface ParticipantContextValue {
    participants: ParticipantData[];
    activeParticipantId: string;
    setActiveParticipantId: (id: string) => void;
    loading: boolean;
    refresh: () => Promise<void>;
}

const ParticipantCtx = createContext<ParticipantContextValue | undefined>(undefined);

const STORAGE_KEY = 'ihub-active-participant';

// eslint-disable-next-line react-refresh/only-export-components
export function useParticipant() {
    const context = useContext(ParticipantCtx);
    if (!context) {
        throw new Error('useParticipant must be used within a ParticipantProvider');
    }
    return context;
}

const fetchParticipantsList = async (): Promise<ParticipantData[]> => {
    const response = await httpClient.get('/api/identity/v1alpha/participants');
    return Array.isArray(response.data) ? response.data : [];
};

interface ParticipantProviderProps {
    children: ReactNode;
}

export const ParticipantProvider: React.FC<ParticipantProviderProps> = ({ children }) => {
    const { data: participants, loading, refresh } = useCachedList<ParticipantData>(
        'participants-global',
        fetchParticipantsList,
    );

    const [activeParticipantId, setActiveState] = useState(
        () => localStorage.getItem(STORAGE_KEY) || ''
    );

    const setActiveParticipantId = useCallback((id: string) => {
        setActiveState(id);
        localStorage.setItem(STORAGE_KEY, id);
    }, []);

    useEffect(() => {
        if (participants.length > 0) {
            const isValid = participants.some(p => p.participantContextId === activeParticipantId);
            if (!activeParticipantId || !isValid) {
                setActiveParticipantId(participants[0].participantContextId);
            }
        }
    }, [participants, activeParticipantId, setActiveParticipantId]);

    return (
        <ParticipantCtx.Provider value={{ participants, activeParticipantId, setActiveParticipantId, loading, refresh }}>
            {children}
        </ParticipantCtx.Provider>
    );
};
