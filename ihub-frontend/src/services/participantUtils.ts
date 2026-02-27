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

/**
 * The Identity Hub backend expects participant context IDs to be base64-encoded
 * in URL path segments. These utilities handle the encoding/decoding.
 */

function isAlreadyBase64Encoded(str: string): boolean {
    if (!/^[A-Za-z0-9+/]+=*$/.test(str) || str.length % 4 !== 0 || str.length < 4) {
        return false;
    }
    try {
        const decoded = atob(str);
        // If re-encoding the decoded value gives us back the original, it's valid base64.
        // Also check the decoded string is printable text (not binary garbage).
        return btoa(decoded) === str && /^[\x20-\x7E]*$/.test(decoded);
    } catch {
        return false;
    }
}

export function encodeParticipantId(participantId: string): string {
    if (isAlreadyBase64Encoded(participantId)) return participantId;
    return btoa(participantId);
}

export function decodeParticipantId(encoded: string): string {
    try {
        return atob(encoded);
    } catch {
        return encoded;
    }
}
