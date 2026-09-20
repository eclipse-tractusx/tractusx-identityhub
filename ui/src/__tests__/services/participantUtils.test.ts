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
import { encodeParticipantId } from '../../services/participantUtils';

describe('participantUtils', () => {
    it.each([
        ['BPNL00000003CRHK', 'BPNL00000003CRHK'],
        ['cGFydGljaXBhbnQ=', 'cGFydGljaXBhbnQ%3D'],
        ['did:web:example.com%3A8080:alice', 'did%3Aweb%3Aexample.com%253A8080%3Aalice'],
        ['participant/a b?c#d', 'participant%2Fa%20b%3Fc%23d'],
        ['café', 'caf%C3%A9'],
    ])('encodes the raw ID %s without changing its identity', (id, path) => {
        expect(encodeParticipantId(id)).toBe(path);
        expect(decodeURIComponent(encodeParticipantId(id))).toBe(id);
    });
});
