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

vi.mock('../../config/ConfigFactory', () => ({
    ConfigFactory: {
        create: vi.fn(),
        reload: vi.fn(),
        clearCache: vi.fn(),
    },
}));

vi.mock('../../config/schema', () => ({
    ConfigurationError: class ConfigurationError extends Error {
        field?: string;
        constructor(message: string, field?: string) {
            super(message);
            this.name = 'ConfigurationError';
            this.field = field;
        }
    },
}));

describe('config/index exports', () => {
    it('should export ConfigFactory', async () => {
        const configIndex = await import('../../config/index');
        expect(configIndex.ConfigFactory).toBeDefined();
    });

    it('should export ConfigurationError', async () => {
        const configIndex = await import('../../config/index');
        expect(configIndex.ConfigurationError).toBeDefined();
    });

    it('should export ConfigurationError as a class that can be instantiated', async () => {
        const configIndex = await import('../../config/index');
        const error = new configIndex.ConfigurationError('test error');
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('test error');
        expect(error.name).toBe('ConfigurationError');
    });

    it('should export ConfigFactory with expected methods', async () => {
        const configIndex = await import('../../config/index');
        expect(typeof configIndex.ConfigFactory.create).toBe('function');
        expect(typeof configIndex.ConfigFactory.reload).toBe('function');
        expect(typeof configIndex.ConfigFactory.clearCache).toBe('function');
    });
});
