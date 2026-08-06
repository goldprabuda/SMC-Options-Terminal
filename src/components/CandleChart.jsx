import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const C = {
  bg:'#0d0f14', grid:'#252936', text:'#6b7280',
  up:'#22c55e', dn:'#ef4444',
  eqh:'#ef4444', eql:'#22c55e',
  entry:'#3b82f6', sl:'#ef4444', t1:'#22c55e', t2:'#06b6d4',
};

const INTERVAL_LABELS = { '5':'5M', '15':'15M', '60':'1H', 'D':'Daily', 'W':'Weekly' };
const INTRADAY        = new Set(['5','15','60']);

async function fetchChartData(symbol, interval) {
  const url = '/api/chart?symbol=' + encodeURIComponent(symbol) +
              '&interval=' + encodeURIComponent(interval) +
              '&_t=' + Date.now();   // cache-bust every request
  const r   = await fetch(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  const txt = await r.text();
  try {
    const d = JSON.parse(txt);
    console.log('[CandleChart] fetched', symbol, interval, '→', d.candles?.length, 'candles', d._debug);
    return d;
  }
  catch (_) { throw new Error(txt.slice(0,100)); }
}

export default function CandleChart({ symbol, interval = 'D', height = 420 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volRef       = useRef(null);
  const priceLines   = useRef([]);

  const [chartData,  setChartData]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ── Fetch data when symbol or interval changes ───────────────────────────
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChartData(null);

    fetchChartData(symbol, interval)
      .then(d => {
        if (cancelled) return;
        if (d.error) { setError(d.error); return; }
        if (!d.candles?.length) { setError('No candles returned'); return; }
        setChartData(d);
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, interval]);  // ← re-fetches on every change

  // ── Init chart ONCE per mount ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const isIntraday = INTRADAY.has(interval);
    const initialHeight = containerRef.current.clientHeight || 400;
    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth || 600,
      height: Math.max(200, initialHeight - 4),
      layout: { background: { color: C.bg }, textColor: C.text },
      grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      crosshair:       { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: C.grid, scaleMargins: { top: 0.06, bottom: 0.22 } },
      timeScale:       { borderColor: C.grid, timeVisible: isIntraday, secondsVisible: false },
    });

    const cSeries = chart.addCandlestickSeries({
      upColor: C.up, downColor: C.dn,
      borderUpColor: C.up, borderDownColor: C.dn,
      wickUpColor:   C.up, wickDownColor:   C.dn,
    });

    const vSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' }, priceScaleId: 'vol',
      scaleMargins: { top: 0.80, bottom: 0 },
    });

    chartRef.current  = chart;
    seriesRef.current = cSeries;
    volRef.current    = vSeries;
    priceLines.current = [];

    const ro = new ResizeObserver(entries => {
      if (chartRef.current && entries[0]) {
        const { width, height: h } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height: Math.max(200, h) });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, []);  // only on mount — key prop in parent causes full remount per interval

  // ── Draw candles + annotations when data arrives ─────────────────────────
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartRef.current) return;

    const { candles = [], annotations = {} } = chartData;
    if (!candles.length) return;

    try {
      // Clear old price lines
      priceLines.current.forEach(pl => { try { seriesRef.current.removePriceLine(pl); } catch (_) {} });
      priceLines.current = [];

      // Candles
      seriesRef.current.setData(
        candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
      );

      // Volume
      if (volRef.current) {
        volRef.current.setData(
          candles.map(c => ({
            time: c.time, value: c.volume || 0,
            color: c.close >= c.open ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)',
          }))
        );
      }

      // Price lines helper
      const addLine = (price, color, lineWidth, ls, title, axisLabel) => {
        if (!price || isNaN(price)) return;
        priceLines.current.push(
          seriesRef.current.createPriceLine({ price, color, lineWidth, lineStyle: ls, title, axisLabelVisible: axisLabel })
        );
      };

      const ob = annotations.orderBlocks || {};
      if (ob.bullish?.top)    addLine(ob.bullish.top,    C.up, 1, LineStyle.Solid,  'Bull OB', true);
      if (ob.bullish?.bottom) addLine(ob.bullish.bottom, C.up, 1, LineStyle.Dotted, '',        false);
      if (ob.bearish?.top)    addLine(ob.bearish.top,    C.dn, 1, LineStyle.Dotted, '',        false);
      if (ob.bearish?.bottom) addLine(ob.bearish.bottom, C.dn, 1, LineStyle.Solid,  'Bear OB', true);

      const eqh = (annotations.eqhUnswept || [])[0];
      const eql = (annotations.eqlUnswept || [])[0];
      if (eqh) addLine(eqh.price, C.eqh, 1, LineStyle.Dashed, 'EQH', true);
      if (eql) addLine(eql.price, C.eql, 1, LineStyle.Dashed, 'EQL', true);

      const sig = annotations.signal;
      if (sig) {
        const mid = sig.entry ? (sig.entry.low + sig.entry.high) / 2 : null;
        if (mid)    addLine(mid,    C.entry, 2, LineStyle.Solid,  'Entry', true);
        if (sig.sl) addLine(sig.sl, C.sl,    1, LineStyle.Dashed, 'SL',    true);
        if (sig.t1) addLine(sig.t1, C.t1,    1, LineStyle.Dashed, 'T1',    true);
        if (sig.t2) addLine(sig.t2, C.t2,    1, LineStyle.Dashed, 'T2',    true);
      }

      chartRef.current.timeScale().fitContent();
    } catch (e) { console.error('[CandleChart] draw error:', e.message); }
  }, [chartData]);

  // ── Render ───────────────────────────────────────────────────────────────
  const ivLabel   = INTERVAL_LABELS[interval] || interval;
  const symLabel  = chartData?.symbol || symbol || '—';
  const trend     = chartData?.trend;
  const trendText = trend === 'up' ? '↑ Uptrend' : trend === 'down' ? '↓ Downtrend' : '';
  const trendColor= trend === 'up' ? 'var(--gr)' : 'var(--rd)';

  return (
    <div style={{ height, minHeight:0, background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding:'7px 12px', borderBottom:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, height:36 }}>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'var(--tx)' }}>
          {symLabel} · <span style={{ color:'var(--cy)' }}>{ivLabel}</span>
          {trendText && <span style={{ color:trendColor }}> · {trendText}</span>}
          {chartData?._debug && (
            <span style={{ fontSize:9, color:'var(--mu)', marginLeft:8, fontWeight:400 }}>
              ({chartData._debug.candleCount} candles · {chartData._debug.firstDate?.slice(0,10)} → {chartData._debug.lastDate?.slice(0,16).replace('T',' ')})
            </span>
          )}
        </span>
        <div style={{ display:'flex', gap:10, fontSize:9, color:'var(--mu)' }}>
          <span style={{ color:'var(--gr)' }}>── Bull OB</span>
          <span style={{ color:'var(--rd)' }}>── Bear OB</span>
          <span style={{ color:'var(--rd)', borderBottom:'1px dashed var(--rd)' }}>EQH</span>
          <span style={{ color:'var(--gr)', borderBottom:'1px dashed var(--gr)' }}>EQL</span>
          {chartData?.annotations?.signal && <span style={{ color:'var(--bl)' }}>── Signal</span>}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position:'absolute', top:36, left:0, right:0, bottom:0, background:'rgba(13,15,20,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, gap:8, fontSize:11, color:'var(--mu)' }}>
          <span style={{ display:'inline-block', animation:'spin .8s linear infinite' }}>◌</span>
          Loading {ivLabel} data...
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div style={{ position:'absolute', top:36, left:0, right:0, bottom:0, background:'rgba(13,15,20,.85)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10, gap:6 }}>
          <div style={{ color:'var(--rd)', fontSize:12 }}>Chart error</div>
          <div style={{ color:'var(--mu)', fontSize:10, padding:'0 20px', textAlign:'center' }}>{error}</div>
        </div>
      )}

      {/* Canvas — always mounted */}
      <div ref={containerRef} style={{ flex:1, minHeight:0 }} />
    </div>
  );
}
