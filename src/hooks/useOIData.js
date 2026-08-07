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

  const load = useCallback(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/oi?symbol=' + encodeURIComponent(symbol) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); setSecsAgo(0); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    load();
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(load, refreshSec * 1000);
    return () => window.clearInterval(timerRef.current);
  }, [load, refreshSec]);

  useEffect(() => {
    clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setSecsAgo(s => s+1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [symbol]);

  return { data, error, loading, secsAgo, refreshSec, setRefreshSec, refresh: load, REFRESH_OPTIONS };
}
