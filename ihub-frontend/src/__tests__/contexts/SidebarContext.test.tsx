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
import { render, screen, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

function TestConsumer() {
    const { isVisible, content, showSidebar, hideSidebar, toggleSidebar } = useSidebar();
    return (
        <div>
            <span data-testid="visible">{isVisible ? 'yes' : 'no'}</span>
            <span data-testid="content">{content}</span>
            <button onClick={() => showSidebar(<span>sidebar content</span>)}>show</button>
            <button onClick={() => hideSidebar()}>hide</button>
            <button onClick={() => toggleSidebar()}>toggle</button>
        </div>
    );
}

describe('SidebarContext', () => {
    it('should provide default values', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should show sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('show').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('yes');
        expect(screen.getByText('sidebar content')).toBeInTheDocument();
    });

    it('should hide sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('show').click(); });
        act(() => { screen.getByText('hide').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should toggle sidebar', () => {
        render(
            <SidebarProvider>
                <TestConsumer />
            </SidebarProvider>
        );
        act(() => { screen.getByText('toggle').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('yes');
        act(() => { screen.getByText('toggle').click(); });
        expect(screen.getByTestId('visible').textContent).toBe('no');
    });

    it('should throw when used outside provider', () => {
        expect(() => render(<TestConsumer />)).toThrow('useSidebar must be used within a SidebarProvider');
    });
});
