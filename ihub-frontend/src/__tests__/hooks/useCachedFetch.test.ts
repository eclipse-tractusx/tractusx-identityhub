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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCachedList, invalidateCache } from '../../hooks/useCachedFetch';

describe('useCachedList', () => {
    beforeEach(() => {
        invalidateCache('');
    });

    it('should return loading state initially then resolve with data', async () => {
        const fetcher = vi.fn().mockResolvedValue(['a', 'b', 'c']);

        const { result } = renderHook(() => useCachedList('test-key', fetcher));

        expect(result.current.loading).toBe(true);
        expect(result.current.data).toEqual([]);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(['a', 'b', 'c']);
        expect(result.current.error).toBeNull();
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it('should use cached data on subsequent renders with same key', async () => {
        const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);

        const { result, unmount } = renderHook(() => useCachedList('cache-key', fetcher));
        await waitFor(() => { expect(result.current.loading).toBe(false); });
        unmount();

        const fetcher2 = vi.fn().mockResolvedValue([1, 2, 3]);
        const { result: result2 } = renderHook(() => useCachedList('cache-key', fetcher2));

        // Should have cached data immediately (no loading)
        expect(result2.current.data).toEqual([1, 2, 3]);
        expect(result2.current.loading).toBe(false);
    });

    it('should set error state on fetch failure', async () => {
        const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useCachedList('error-key', fetcher));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.data).toEqual([]);
    });

    it('should handle non-Error rejection', async () => {
        const fetcher = vi.fn().mockRejectedValue('string error');

        const { result } = renderHook(() => useCachedList('non-error-key', fetcher));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch');
    });

    it('should refresh data when refresh is called', async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce(['old'])
            .mockResolvedValueOnce(['new']);

        const { result } = renderHook(() => useCachedList('refresh-key', fetcher));

        await waitFor(() => { expect(result.current.data).toEqual(['old']); });

        await act(async () => { await result.current.refresh(); });

        expect(result.current.data).toEqual(['new']);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should handle non-array response gracefully', async () => {
        const fetcher = vi.fn().mockResolvedValue('not an array' as unknown);

        const { result } = renderHook(() => useCachedList('non-array-key', fetcher));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
    });
});

describe('invalidateCache', () => {
    beforeEach(() => {
        invalidateCache('');
    });

    it('should clear cache entries matching the prefix', async () => {
        const fetcher1 = vi.fn().mockResolvedValue(['data1']);
        const fetcher2 = vi.fn().mockResolvedValue(['data2']);

        const { result: r1, unmount: u1 } = renderHook(() => useCachedList('prefix-a', fetcher1));
        const { result: r2, unmount: u2 } = renderHook(() => useCachedList('prefix-b', fetcher2));

        await waitFor(() => { expect(r1.current.loading).toBe(false); });
        await waitFor(() => { expect(r2.current.loading).toBe(false); });
        u1();
        u2();

        invalidateCache('prefix-a');

        // prefix-a should be cleared (loading again)
        const fetcher3 = vi.fn().mockResolvedValue(['data3']);
        const { result: r3 } = renderHook(() => useCachedList('prefix-a', fetcher3));
        expect(r3.current.loading).toBe(true);

        // prefix-b should still be cached
        const fetcher4 = vi.fn().mockResolvedValue(['data4']);
        const { result: r4 } = renderHook(() => useCachedList('prefix-b', fetcher4));
        expect(r4.current.data).toEqual(['data2']);
    });

    it('should clear all cache entries with empty prefix', async () => {
        const fetcher = vi.fn().mockResolvedValue(['cached']);
        const { result, unmount } = renderHook(() => useCachedList('any-key', fetcher));
        await waitFor(() => { expect(result.current.loading).toBe(false); });
        unmount();

        invalidateCache('');

        const fetcher2 = vi.fn().mockResolvedValue(['fresh']);
        const { result: r2 } = renderHook(() => useCachedList('any-key', fetcher2));
        expect(r2.current.loading).toBe(true);
    });
});
