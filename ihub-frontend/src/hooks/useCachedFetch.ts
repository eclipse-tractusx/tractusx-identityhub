/********************************************************************************
 * Eclipse Tractus-X - Identity Hub Frontend
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { useState, useEffect, useCallback, useRef } from 'react';

const cache = new Map<string, unknown[]>();

/**
 * Hook that caches list data in module-level memory.
 * - First load (no cache): shows loading skeleton
 * - Subsequent loads (cache hit): shows cached data instantly, refreshes in background
 * - Key change (e.g. participant switch): uses cache if available, otherwise skeleton
 * - Stale fetch results are discarded when the key changes mid-flight
 */
export function useCachedList<T>(
    key: string,
    fetcher: () => Promise<T[]>,
): {
    data: T[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
} {
    const cached = cache.get(key) as T[] | undefined;
    const [data, setData] = useState<T[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    // Track active key to discard stale fetch results
    const activeKeyRef = useRef(key);
    activeKeyRef.current = key;

    // Synchronously reset state when key changes — prevents one-frame flash of stale data
    const [prevKey, setPrevKey] = useState(key);
    if (prevKey !== key) {
        setPrevKey(key);
        const c = cache.get(key) as T[] | undefined;
        setData(c ?? []);
        setLoading(!c);
        setError(null);
    }

    const refresh = useCallback(async () => {
        if (!cache.has(key)) setLoading(true);
        setError(null);
        try {
            const result = await fetcherRef.current();
            if (activeKeyRef.current !== key) return;
            const arr = Array.isArray(result) ? result : [];
            cache.set(key, arr);
            setData(arr);
        } catch (err) {
            if (activeKeyRef.current !== key) return;
            const message = err instanceof Error ? err.message : 'Failed to fetch';
            setError(message);
            if (!cache.has(key)) setData([]);
        } finally {
            if (activeKeyRef.current === key) {
                setLoading(false);
            }
        }
    }, [key]);

    useEffect(() => {
        refresh();
    }, [key, refresh]);

    return { data, loading, error, refresh };
}

export function invalidateCache(keyPrefix: string) {
    for (const k of cache.keys()) {
        if (k.startsWith(keyPrefix)) cache.delete(k);
    }
}
