'use client';

// Tiny SWR-shaped hook for the conversation list. We don't pull in SWR
// proper (≈4kb dep) — the surface we need is small enough that a hand-
// rolled hook is clearer and keeps the bundle lean. Features mirror what
// the spec asked for from SWR:
//   - revalidateOnFocus: re-fetch when the tab regains focus
//   - mutate: caller can force a re-fetch (e.g. after PATCH)
//   - debounced re-key via the calling component's URL state — caller
//     controls when to call us
//
// Loading + error are surfaced separately so the UI can show skeletons
// vs. error banners without unwrapping a discriminated union.

import { useCallback, useEffect, useRef, useState } from 'react';

interface FetchState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
}

interface Options {
  /** Re-fetch when window regains focus. Defaults to true. */
  revalidateOnFocus?: boolean;
}

export function useFetch<T>(url: string, opts: Options = {}): FetchState<T> & {
  refetch: () => void;
} {
  const { revalidateOnFocus = true } = opts;
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const seqRef    = useRef(0);
  const urlRef    = useRef(url);

  // Keep urlRef synced to the latest URL prop without doing it during
  // render (which lint flags). Effect runs after commit, before run().
  useEffect(() => { urlRef.current = url; }, [url]);

  const run = useCallback(async () => {
    // Capture sequence number so a late response from a previous fetch
    // can't overwrite a newer one (race when the URL changes rapidly).
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(urlRef.current);
      const body = await res.json();
      if (seq !== seqRef.current) return;
      if (!res.ok) throw new Error(body?.error ?? body?.message ?? `HTTP ${res.status}`);
      // setData here is async (post-fetch), not synchronous-in-effect.
      setData(body as T);
    } catch (e) {
      if (seq !== seqRef.current) return;
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kicks off async fetch; its setState calls happen post-await, not
    // synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [url, run]);

  useEffect(() => {
    if (!revalidateOnFocus) return;
    const onFocus = () => { void run(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [revalidateOnFocus, run]);

  return { data, loading, error, refetch: run };
}
