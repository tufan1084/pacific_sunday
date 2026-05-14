"use client";

import { useState, useEffect, useRef } from "react";
import { cache, CACHE_TTL } from "@/app/services/cache";

/**
 * Cache-first data fetching.
 * Checks the shared cache synchronously before first render.
 * If cached → renders instantly with no loading state.
 * If not cached → shows loading, fetches, renders.
 */
export function usePageData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM,
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const cached = cache.get<T>(key);
  const [data, setData] = useState<T | null>(cached);
  const [loading, setLoading] = useState(cached === null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (result !== null && result !== undefined) {
        cache.set(key, result, ttl);
        setData(result);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const refresh = () => doFetch(false);

  useEffect(() => {
    // Already have fresh data — skip fetch entirely
    if (cached !== null) {
      const age = cache.getAge(key);
      if (age <= ttl / 2) return; // fresh — do nothing
      doFetch(false); // stale — silent background refresh
      return;
    }
    // No cache — fetch with loading state
    doFetch(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, refresh };
}
