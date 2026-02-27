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

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: {} } });

// Mock window.ENV
Object.defineProperty(window, 'ENV', {
    value: {},
    writable: true,
    configurable: true,
});

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
    value: {
        ...window.location,
        reload: vi.fn(),
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        href: 'http://localhost:3000/',
    },
    writable: true,
    configurable: true,
});

// Mock window.history.replaceState
window.history.replaceState = vi.fn();

// Suppress console.error in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
