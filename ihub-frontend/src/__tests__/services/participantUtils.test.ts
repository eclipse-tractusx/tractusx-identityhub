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

import { describe, it, expect } from 'vitest';
import { encodeParticipantId, decodeParticipantId } from '../../services/participantUtils';

describe('participantUtils', () => {
    describe('encodeParticipantId', () => {
        it('should encode a plain string to base64', () => {
            const result = encodeParticipantId('BPNL00000003CRHK');
            expect(result).toBe(btoa('BPNL00000003CRHK'));
        });

        it('should not re-encode an already base64-encoded string', () => {
            const encoded = btoa('BPNL00000003CRHK');
            const result = encodeParticipantId(encoded);
            expect(result).toBe(encoded);
        });

        it('should encode strings that look like base64 but are not', () => {
            // A string that happens to be all base64 chars but isn't valid base64
            const result = encodeParticipantId('AB');
            expect(result).toBe(btoa('AB'));
        });

        it('should handle empty-ish strings', () => {
            const result = encodeParticipantId('test');
            expect(result).toBe(btoa('test'));
        });

        it('should handle strings with special characters', () => {
            const result = encodeParticipantId('did:web:example.com');
            expect(result).toBe(btoa('did:web:example.com'));
        });
    });

    describe('decodeParticipantId', () => {
        it('should decode a valid base64 string', () => {
            const encoded = btoa('BPNL00000003CRHK');
            expect(decodeParticipantId(encoded)).toBe('BPNL00000003CRHK');
        });

        it('should return the original string if decoding fails', () => {
            expect(decodeParticipantId('not-valid-base64!!!')).toBe('not-valid-base64!!!');
        });

        it('should decode a simple base64 string', () => {
            expect(decodeParticipantId(btoa('hello'))).toBe('hello');
        });
    });
});
