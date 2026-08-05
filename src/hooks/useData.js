import { useState, useEffect, useCallback, useRef } from 'react';

export function useMarketData(refreshSec = 300) {
  const [data,   setData]   = useState(null);
  const [error,  setError]  = useState(null);
  const [loading,setLoading]= useState(true);
  const [lastTs, setLastTs] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch('/api/data');
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'API error');
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
  const [chart,   setChart]   = useState(null);
  const [chartErr,setChartErr]= useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setChartLoading(true);
    fetch('/api/chart?symbol=' + encodeURIComponent(symbol))
      .then(r => r.json())
      .then(d => { if (!cancelled) { setChart(d); setChartErr(null); } })
      .catch(e => { if (!cancelled) setChartErr(e.message); })
      .finally(() => { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [symbol]);

  return { chart, chartErr, chartLoading };
}
