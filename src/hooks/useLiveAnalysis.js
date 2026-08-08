import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLiveAnalysis — fetches fresh, on-demand analysis for one symbol.
 * No cache dependency. Same pattern the working Chart/OI panels already use.
 *
 * Auto-refreshes every 90s while a symbol is active (respects the ~10-20s
 * per-call cost of live analysis — no point hammering faster than that).
 * Also exposes a manual refresh() and elapsed-seconds-since-fetch counter.
 */
export function useLiveAnalysis(symbol) {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [secsAgo, setSecsAgo] = useState(0);
  const timerRef  = useRef(null);
  const tickRef   = useRef(null);
  const reqIdRef  = useRef(0);   // guards against stale responses when symbol changes mid-flight

  const load = useCallback(() => {
    if (!symbol) return;
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    fetch('/api/analyze?symbol=' + encodeURIComponent(symbol) + '&_t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (reqIdRef.current !== myReqId) return;  // a newer request superseded this one — ignore
        if (!d.ok) { setError(d.error || 'Analysis failed'); return; }
        setData(d);
        setError(null);
        setSecsAgo(0);
      })
      .catch(e => { if (reqIdRef.current === myReqId) setError(e.message); })
      .finally(() => { if (reqIdRef.current === myReqId) setLoading(false); });
  }, [symbol]);

  useEffect(() => {
    setData(null);
    setError(null);
    load();
    timerRef.current = window.setInterval(load, 90000);
    return () => window.clearInterval(timerRef.current);
  }, [symbol, load]);

  useEffect(() => {
    tickRef.current = window.setInterval(() => setSecsAgo(s => s + 1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [symbol]);

  return { data, error, loading, secsAgo, refresh: load };
}
