import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const C = {
  bg:'#0d0f14', grid:'#252936', text:'#6b7280',
  up:'#22c55e', dn:'#ef4444',
  eqh:'#ef4444', eql:'#22c55e',
  entry:'#3b82f6', sl:'#ef4444', t1:'#22c55e', t2:'#06b6d4',
};

export default function CandleChart({ chartData, chartErr, chartLoading, height = 420 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volRef       = useRef(null);
  const priceLines   = useRef([]);   // ← tracks every price line so we can remove them
  const [initErr, setInitErr] = useState(null);

  // ── Init chart ONCE ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth || 600,
        height: height - 44,
        layout: { background: { color: C.bg }, textColor: C.text },
        grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: C.grid,
          scaleMargins: { top: 0.06, bottom: 0.22 },
        },
        timeScale: { borderColor: C.grid, timeVisible: false },
      });

      const cSeries = chart.addCandlestickSeries({
        upColor: C.up, downColor: C.dn,
        borderUpColor: C.up, borderDownColor: C.dn,
        wickUpColor:   C.up, wickDownColor:   C.dn,
      });

      const vSeries = chart.addHistogramSeries({
        priceFormat:   { type: 'volume' },
        priceScaleId:  'vol',
        scaleMargins:  { top: 0.80, bottom: 0 },
      });

      chartRef.current  = chart;
      seriesRef.current = cSeries;
      volRef.current    = vSeries;
      priceLines.current = [];

      // Responsive width
      const ro = new ResizeObserver(entries => {
        if (chartRef.current && entries[0]) {
          chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        }
      });
      ro.observe(containerRef.current);

      return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
    } catch (e) { setInitErr(e.message); }
  }, []);   // height excluded intentionally — only init once

  // ── Update data + annotations when symbol/data changes ────────────────────
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartRef.current) return;

    try {
      const { candles = [], annotations = {} } = chartData;
      if (!candles.length) return;

      // 1. CLEAR ALL OLD PRICE LINES before anything else
      priceLines.current.forEach(pl => {
        try { seriesRef.current.removePriceLine(pl); } catch (_) {}
      });
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

      // Helper: add a price line and track it for future removal
      function addLine(price, color, lineWidth, lineStyle, title, axisLabelVisible) {
        if (!price || isNaN(price)) return;
        const pl = seriesRef.current.createPriceLine({ price, color, lineWidth, lineStyle, title, axisLabelVisible });
        priceLines.current.push(pl);
      }

      // 4. Order blocks — only add ONCE per OB (top OR bottom, not both duplicated)
      if (annotations.orderBlocks?.bullish) {
        const ob = annotations.orderBlocks.bullish;
        addLine(ob.top,    C.up, 1, LineStyle.Solid,  'Bull OB', true);
        addLine(ob.bottom, C.up, 1, LineStyle.Dotted, '',        false);
      }
      if (annotations.orderBlocks?.bearish) {
        const ob = annotations.orderBlocks.bearish;
        addLine(ob.top,    C.dn, 1, LineStyle.Dotted, '',         false);
        addLine(ob.bottom, C.dn, 1, LineStyle.Solid,  'Bear OB', true);
      }

      // 5. EQH / EQL — only first unswept level per side (not all of them)
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

      // 7. Fit to show all candles
      chartRef.current.timeScale().fitContent();

    } catch (e) {
      console.error('[CandleChart] update error:', e.message);
    }
  }, [chartData]);   // re-runs whenever symbol changes (new chartData object)

  // ── Render ──────────────────────────────────────────────────────────────────
  const wrap = { height, background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden' };

  if (initErr) return (
    <div style={wrap}>
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--rd)',fontSize:12 }}>
        Chart init failed: {initErr}
      </div>
    </div>
  );

  const showCanvas = !chartLoading && chartData && !chartErr;

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ padding:'7px 12px', borderBottom:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, height:36 }}>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'var(--tx)' }}>
          {chartData?.symbol || '—'} · Daily ·&nbsp;
          <span style={{ color: chartData?.trend==='up' ? 'var(--gr)' : chartData?.trend==='down' ? 'var(--rd)' : 'var(--mu)' }}>
            {chartData?.trend==='up' ? '↑ Uptrend' : chartData?.trend==='down' ? '↓ Downtrend' : 'Analysing...'}
          </span>
        </span>
        <div style={{ display:'flex', gap:12, fontSize:9, color:'var(--mu)' }}>
          <span style={{ color:'var(--gr)' }}>── Bull OB</span>
          <span style={{ color:'var(--rd)' }}>── Bear OB</span>
          <span style={{ color:'var(--rd)', borderBottom:'1px dashed var(--rd)' }}>EQH</span>
          <span style={{ color:'var(--gr)', borderBottom:'1px dashed var(--gr)' }}>EQL</span>
          {chartData?.annotations?.signal && <span style={{ color:'var(--bl)' }}>── Signal active</span>}
        </div>
      </div>

      {/* Status overlays */}
      {chartLoading && !chartData && (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--mu)',fontSize:11,gap:8 }}>
          <span style={{ display:'inline-block',animation:'spin .8s linear infinite' }}>◌</span> Loading chart...
        </div>
      )}
      {chartErr && !chartLoading && (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'var(--rd)',fontSize:11,padding:16,textAlign:'center',gap:6 }}>
          <div>Chart error</div>
          <div style={{ color:'var(--mu)',fontSize:10 }}>{chartErr}</div>
          <div style={{ color:'var(--mu)',fontSize:10,marginTop:4 }}>Ensure api/chart-data.js is in the MCPNIFTY_claude repo</div>
        </div>
      )}
      {!chartLoading && !chartErr && !chartData && (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--mu)',fontSize:11 }}>
          Select a scrip to load chart
        </div>
      )}

      {/* Chart canvas — always mounted so the chart element exists, hidden when no data */}
      <div ref={containerRef} style={{ flex:1, display: showCanvas ? 'block' : 'none' }} />
    </div>
  );
}
