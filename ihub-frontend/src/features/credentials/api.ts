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

import httpClient from '../../services/HttpClient';
import { CredentialResource } from './types';
import { encodeParticipantId } from '../../services/participantUtils';

const API_BASE = '/api/identity/v1alpha';

function pid(participantId: string): string {
    return encodeURIComponent(encodeParticipantId(participantId));
}

export async function getCredentials(participantId: string): Promise<CredentialResource[]> {
    const response = await httpClient.get<CredentialResource[]>(
        `${API_BASE}/participants/${pid(participantId)}/credentials`
    );
    return response.data;
}

export async function getCredentialById(participantId: string, credentialId: string): Promise<CredentialResource> {
    const response = await httpClient.get<CredentialResource>(
        `${API_BASE}/participants/${pid(participantId)}/credentials/${encodeURIComponent(credentialId)}`
    );
    return response.data;
}

export async function getAllCredentials(): Promise<CredentialResource[]> {
    const response = await httpClient.get<CredentialResource[]>(
        `${API_BASE}/credentials`
    );
    return response.data;
}

export async function deleteCredential(participantId: string, credentialId: string): Promise<void> {
    await httpClient.delete(
        `${API_BASE}/participants/${pid(participantId)}/credentials/${encodeURIComponent(credentialId)}`
    );
}

export async function createCredential(participantId: string, credential: Partial<CredentialResource>): Promise<void> {
    await httpClient.post(
        `${API_BASE}/participants/${pid(participantId)}/credentials`,
        credential
    );
}

export async function updateCredential(participantId: string, credential: CredentialResource): Promise<void> {
    await httpClient.put(
        `${API_BASE}/participants/${pid(participantId)}/credentials`,
        credential
    );
}

export async function requestCredential(participantId: string, body: Record<string, unknown>): Promise<void> {
    await httpClient.post(
        `${API_BASE}/participants/${pid(participantId)}/credentials/request`,
        body
    );
}

export async function revokeCredential(participantId: string, credentialId: string): Promise<void> {
    await httpClient.post(
        `${API_BASE}/participants/${pid(participantId)}/credentials/${encodeURIComponent(credentialId)}/revoke`
    );
}

export async function suspendCredential(participantId: string, credentialId: string): Promise<void> {
    await httpClient.post(
        `${API_BASE}/participants/${pid(participantId)}/credentials/${encodeURIComponent(credentialId)}/suspend`
    );
}

export async function resumeCredential(participantId: string, credentialId: string): Promise<void> {
    await httpClient.post(
        `${API_BASE}/participants/${pid(participantId)}/credentials/${encodeURIComponent(credentialId)}/resume`
    );
}
