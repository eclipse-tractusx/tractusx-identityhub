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
import { render, screen } from '@testing-library/react';

vi.mock('../assets/styles/main.scss', () => ({}));

vi.mock('../routes', () => ({
    default: () => <div data-testid="app-routes">Mock AppRoutes</div>,
}));

import App from '../App';

describe('App', () => {
    it('should render without crashing', () => {
        render(<App />);
        expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    it('should render the AppRoutes component', () => {
        render(<App />);
        expect(screen.getByText('Mock AppRoutes')).toBeInTheDocument();
    });
});
