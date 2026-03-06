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
import { paletteDefinitions } from '../../theme/palette';

describe('paletteDefinitions', () => {
    it('should have primary colors', () => {
        expect(paletteDefinitions.primary.main).toBe('rgb(1,32,96)');
        expect(paletteDefinitions.primary.contrastText).toBe('#fff');
    });

    it('should have secondary colors', () => {
        expect(paletteDefinitions.secondary.main).toBe('#eaf1fe');
    });

    it('should have text colors', () => {
        expect(paletteDefinitions.text.primary).toBe('#111111');
        expect(paletteDefinitions.text.secondary).toBe('#252525');
        expect(paletteDefinitions.text.tertiary).toBe('#888888');
    });

    it('should have brand colors', () => {
        expect(paletteDefinitions.brand.brand01).toBe('#FFA600');
        expect(paletteDefinitions.brand.brand02).toBe('#B3CB2D');
    });

    it('should have danger colors', () => {
        expect(paletteDefinitions.danger.danger).toBe('#D91E18');
    });

    it('should have support colors', () => {
        expect(paletteDefinitions.support.success).toBe('#00AA55');
        expect(paletteDefinitions.support.error).toBe('#D91E18');
    });

    it('should have background colors', () => {
        expect(paletteDefinitions.background.background01).toBe('#F9F9F9');
    });

    it('should have chip colors', () => {
        expect(paletteDefinitions.chip.release).toBe('#0D61AE');
        expect(paletteDefinitions.chip.active).toBe('#88982D');
    });

    it('should have common colors', () => {
        expect(paletteDefinitions.common.white).toBe('#fff');
        expect(paletteDefinitions.common.black).toBe('#000');
    });
});
