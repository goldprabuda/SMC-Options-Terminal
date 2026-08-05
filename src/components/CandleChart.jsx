import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const C = {
  bg:'#0d0f14', grid:'#252936', text:'#6b7280',
  up:'#22c55e', dn:'#ef4444',
  eqh:'#ef4444', eql:'#22c55e',
  entry:'#3b82f6', sl:'#ef4444', t1:'#22c55e', t2:'#06b6d4',
};

const INTERVAL_LABELS = {
  '5':'5M', '15':'15M', '60':'1H', 'D':'Daily', 'W':'Weekly',
};
const INTRADAY = new Set(['5','15','60']);

export default function CandleChart({ chartData, chartErr, chartLoading, interval='D', height=420 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volRef       = useRef(null);
  const priceLines   = useRef([]);
  const [initErr,    setInitErr] = useState(null);

  // Init chart ONCE — only re-init if interval switches between intraday ↔ daily
  // (timeVisible must change for that)
  const isIntraday = INTRADAY.has(interval);

  useEffect(() => {
    if (!containerRef.current) return;
    // Destroy previous chart if exists
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    try {
      const chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth || 600,
        height: height - 44,
        layout: { background: { color: C.bg }, textColor: C.text },
        grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: C.grid, scaleMargins: { top: 0.06, bottom: 0.22 } },
        timeScale: {
          borderColor:  C.grid,
          timeVisible:  isIntraday,   // show HH:MM for intraday, just date for D/W
          secondsVisible: false,
        },
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
          chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        }
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
    } catch (e) { setInitErr(e.message); }
  }, [isIntraday]);  // re-create chart when switching intraday ↔ daily (timeVisible change)

  // Update data + annotations when chartData changes
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartRef.current) return;
    try {
      const { candles = [], annotations = {} } = chartData;
      if (!candles.length) return;

      // 1. Remove all existing price lines
      priceLines.current.forEach(pl => { try { seriesRef.current.removePriceLine(pl); } catch (_) {} });
      priceLines.current = [];

      // 2. Set candle data
      seriesRef.current.setData(
        candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
      );

      // 3. Volume
      if (volRef.current) {
        volRef.current.setData(
          candles.map(c => ({
            time: c.time, value: c.volume || 0,
            color: c.close >= c.open ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)',
          }))
        );
      }

      // Helper: track price line for removal
      const addLine = (price, color, lineWidth, lineStyle, title, axisLabelVisible) => {
        if (!price || isNaN(price)) return;
        const pl = seriesRef.current.createPriceLine({ price, color, lineWidth, lineStyle, title, axisLabelVisible });
        priceLines.current.push(pl);
      };

      // 4. Order blocks (one label per OB, not duplicated)
      const ob = annotations.orderBlocks || {};
      if (ob.bullish?.top)    addLine(ob.bullish.top,    C.up, 1, LineStyle.Solid,  'Bull OB', true);
      if (ob.bullish?.bottom) addLine(ob.bullish.bottom, C.up, 1, LineStyle.Dotted, '',        false);
      if (ob.bearish?.top)    addLine(ob.bearish.top,    C.dn, 1, LineStyle.Dotted, '',        false);
      if (ob.bearish?.bottom) addLine(ob.bearish.bottom, C.dn, 1, LineStyle.Solid,  'Bear OB', true);

      // 5. EQH / EQL — nearest unswept level only
      const eqh = (annotations.eqhUnswept || [])[0];
      const eql = (annotations.eqlUnswept || [])[0];
      if (eqh) addLine(eqh.price, C.eqh, 1, LineStyle.Dashed, 'EQH', true);
      if (eql) addLine(eql.price, C.eql, 1, LineStyle.Dashed, 'EQL', true);

      // 6. Signal lines (only when fired)
      const sig = annotations.signal;
      if (sig) {
        const mid = sig.entry ? (sig.entry.low + sig.entry.high) / 2 : null;
        if (mid)    addLine(mid,    C.entry, 2, LineStyle.Solid,  'Entry', true);
        if (sig.sl) addLine(sig.sl, C.sl,    1, LineStyle.Dashed, 'SL',    true);
        if (sig.t1) addLine(sig.t1, C.t1,    1, LineStyle.Dashed, 'T1',    true);
        if (sig.t2) addLine(sig.t2, C.t2,    1, LineStyle.Dashed, 'T2',    true);
      }

      chartRef.current.timeScale().fitContent();
    } catch (e) { console.error('[CandleChart] update error:', e.message); }
  }, [chartData]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const ivLabel    = INTERVAL_LABELS[interval] || interval;
  const trendText  = chartData?.trend === 'up' ? '↑ Uptrend' : chartData?.trend === 'down' ? '↓ Downtrend' : '';
  const trendColor = chartData?.trend === 'up' ? 'var(--gr)' : 'var(--rd)';
  const symLabel   = chartData?.symbol || '—';

  const wrap = {
    height, background:'var(--s1)', border:'1px solid var(--bd)',
    borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative',
  };

  if (initErr) return (
    <div style={wrap}>
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--rd)',fontSize:12 }}>
        Chart init error: {initErr}
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ padding:'7px 12px',borderBottom:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,height:36 }}>
        <span style={{ fontFamily:'monospace',fontSize:11,fontWeight:600,color:'var(--tx)' }}>
          {symLabel} · <span style={{ color:'var(--cy)' }}>{ivLabel}</span>
          {trendText && <span style={{ color:trendColor }}> · {trendText}</span>}
        </span>
        <div style={{ display:'flex',gap:12,fontSize:9,color:'var(--mu)' }}>
          <span style={{ color:'var(--gr)' }}>── Bull OB</span>
          <span style={{ color:'var(--rd)' }}>── Bear OB</span>
          <span style={{ color:'var(--rd)',borderBottom:'1px dashed var(--rd)' }}>EQH</span>
          <span style={{ color:'var(--gr)',borderBottom:'1px dashed var(--gr)' }}>EQL</span>
          {chartData?.annotations?.signal && <span style={{ color:'var(--bl)' }}>── Signal</span>}
        </div>
      </div>

      {/* Loading overlay — keeps canvas visible underneath */}
      {chartLoading && (
        <div style={{ position:'absolute',top:36,left:0,right:0,bottom:0,background:'rgba(13,15,20,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,fontSize:11,color:'var(--mu)',gap:8 }}>
          <span style={{ display:'inline-block',animation:'spin .8s linear infinite' }}>◌</span>
          Loading {ivLabel} data...
        </div>
      )}

      {/* Error */}
      {chartErr && !chartLoading && (
        <div style={{ position:'absolute',top:36,left:0,right:0,bottom:0,background:'rgba(13,15,20,.85)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',zIndex:10,gap:6 }}>
          <div style={{ color:'var(--rd)',fontSize:12 }}>Chart error</div>
          <div style={{ color:'var(--mu)',fontSize:10,padding:'0 20px',textAlign:'center' }}>{chartErr}</div>
        </div>
      )}

      {/* No data placeholder */}
      {!chartLoading && !chartErr && !chartData && (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--mu)',fontSize:11 }}>
          Select a scrip to load chart
        </div>
      )}

      {/* Chart canvas — always mounted so lightweight-charts element stays alive */}
      <div ref={containerRef} style={{ flex:1 }} />
    </div>
  );
}
