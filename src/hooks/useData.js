import { useState, useEffect, useCallback, useRef } from 'react';

async function safeFetch(url) {
  const r   = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const txt = await r.text();
  try { return JSON.parse(txt); }
  catch (_) { throw new Error('Non-JSON response from ' + url + ': ' + txt.slice(0, 100)); }
}

export function useMarketData(refreshSec = 300) {
  const [data,   setData]   = useState(null);
  const [error,  setError]  = useState(null);
  const [loading,setLoading]= useState(true);
  const [lastTs, setLastTs] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await safeFetch('/api/data');
      if (!d.ok) throw new Error(d.error || 'API returned error');
      setData(d);
      setLastTs(new Date());
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timerRef.current);
  }, [load, refreshSec]);

  return { data, error, loading, lastTs, refresh: load };
}

export function useChartData(symbol) {
  const [chart,        setChart]       = useState(null);
  const [chartErr,     setChartErr]    = useState(null);
  const [chartLoading, setChartLoading]= useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setChartLoading(true);
    safeFetch('/api/chart?symbol=' + encodeURIComponent(symbol))
      .then(d  => { if (!cancelled) { setChart(d); setChartErr(null); } })
      .catch(e => { if (!cancelled) setChartErr(e.message); })
      .finally(()=> { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [symbol]);

  return { chart, chartErr, chartLoading };
}
