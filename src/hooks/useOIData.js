import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_OPTIONS = [
  { key: 60,  label: '1M' },
  { key: 300, label: '5M' },
];

export function useOIData(symbol) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [secsAgo, setSecsAgo] = useState(0);
  const [refreshSec, setRefreshSec] = useState(60);
  const timerRef = useRef(null);
  const tickRef  = useRef(null);
  const reqIdRef = useRef(0);   // guards against a stale/slow response overwriting a newer one

  const fetchOnce = useCallback((sym) => {
    return fetch('/api/oi?symbol=' + encodeURIComponent(sym) + '&_t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json());
  }, []);

  const load = useCallback(() => {
    if (!symbol) return;
    const myReqId = ++reqIdRef.current;
    const mySymbol = symbol;
    setLoading(true);

    fetchOnce(mySymbol)
      .then(d => {
        if (reqIdRef.current !== myReqId) return;  // a newer request already superseded this one
        if (!d.error) { setData(d); setError(null); setSecsAgo(0); return; }
        // One retry on failure — NIFTY/BANKNIFTY genuinely having no chain is rare,
        // this is usually a transient Dhan hiccup rather than a real absence.
        return fetchOnce(mySymbol).then(d2 => {
          if (reqIdRef.current !== myReqId) return;
          if (!d2.error) { setData(d2); setError(null); setSecsAgo(0); }
          else { setError(d2.error); setData(null); }  // clear stale data on confirmed failure
        });
      })
      .catch(e => { if (reqIdRef.current === myReqId) { setError(e.message); setData(null); } })
      .finally(() => { if (reqIdRef.current === myReqId) setLoading(false); });
  }, [symbol, fetchOnce]);

  useEffect(() => {
    // Clear immediately on symbol change — never show a previous symbol's
    // data underneath a new symbol's loading/error state.
    setData(null);
    setError(null);
    load();
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(load, refreshSec * 1000);
    return () => window.clearInterval(timerRef.current);
  }, [symbol, refreshSec, load]);

  useEffect(() => {
    clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setSecsAgo(s => s+1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [symbol]);

  return { data, error, loading, secsAgo, refreshSec, setRefreshSec, refresh: load, REFRESH_OPTIONS };
}
