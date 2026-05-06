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
import { typographyDefinitions } from '../../theme/typography';

describe('typographyDefinitions', () => {
    it('should have fontFamily with Manrope', () => {
        expect(typographyDefinitions.fontFamily).toContain('Manrope');
    });

    it('should have htmlFontSize of 16', () => {
        expect(typographyDefinitions.htmlFontSize).toBe(16);
    });

    it('should have h1 definition', () => {
        expect(typographyDefinitions.h1.fontSize).toBe(56);
    });

    it('should have h2 definition', () => {
        expect(typographyDefinitions.h2.fontSize).toBe(36);
    });

    it('should have body1 definition', () => {
        expect(typographyDefinitions.body1.fontSize).toBe(18);
    });

    it('should have body2 definition', () => {
        expect(typographyDefinitions.body2.fontSize).toBe(16);
    });

    it('should have button definition', () => {
        expect(typographyDefinitions.button.fontSize).toBe(16);
    });

    it('should have all heading variants', () => {
        expect(typographyDefinitions.h1).toBeDefined();
        expect(typographyDefinitions.h2).toBeDefined();
        expect(typographyDefinitions.h3).toBeDefined();
        expect(typographyDefinitions.h4).toBeDefined();
        expect(typographyDefinitions.h5).toBeDefined();
    });

    it('should have label variants', () => {
        expect(typographyDefinitions.label1).toBeDefined();
        expect(typographyDefinitions.label2).toBeDefined();
        expect(typographyDefinitions.label3).toBeDefined();
        expect(typographyDefinitions.label4).toBeDefined();
        expect(typographyDefinitions.label5).toBeDefined();
    });

    it('should set primary text color for all variants', () => {
        expect(typographyDefinitions.allVariants.color).toBe('#111111');
    });
});
