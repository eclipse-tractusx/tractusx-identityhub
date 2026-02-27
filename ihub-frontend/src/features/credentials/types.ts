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

export interface CredentialSubject {
    id: string;
    holderIdentifier?: string;
    type?: string;
    memberOf?: string;
    group?: string;
    useCase?: string;
    contractTemplate?: string;
    contractVersion?: string;
    [key: string]: unknown;
}

export interface CredentialSchema {
    id: string;
    type: string;
}

export interface CredentialStatus {
    id: string;
    type: string;
    statusPurpose?: string;
    statusListIndex?: string;
    statusListCredential?: string;
}

export interface Issuer {
    id: string;
    additionalProperties?: Record<string, unknown>;
}

export interface VerifiableCredential {
    id: string | null;
    type: string[];
    issuer: Issuer;
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: CredentialSubject[];
    credentialSchema?: CredentialSchema[];
    credentialStatus?: CredentialStatus[];
    description?: string | null;
    name?: string | null;
    dataModelVersion?: string;
    '@context'?: string[];
}

export interface VerifiableCredentialContainer {
    credential: VerifiableCredential;
    format?: string;
    rawVc?: string;
}

export interface CredentialResource {
    id: string;
    timestamp?: number;
    participantContextId?: string;
    issuerId?: string;
    holderId?: string;
    state?: number;
    metadata?: Record<string, unknown>;
    timeOfLastStatusUpdate?: number | null;
    issuancePolicy?: unknown;
    reissuancePolicy?: unknown;
    verifiableCredential: VerifiableCredentialContainer;
}

export const CREDENTIAL_STATES: Record<number, string> = {
    100: 'INITIAL',
    200: 'REQUESTED',
    300: 'ISSUING',
    400: 'ISSUED',
    500: 'STORED',
    600: 'REVOKED',
    700: 'SUSPENDED',
};

export function getStateName(state?: number): string {
    if (state === undefined || state === null) return 'Unknown';
    return CREDENTIAL_STATES[state] || `State ${state}`;
}
