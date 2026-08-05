import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const C = {
  bg:'#0d0f14', grid:'#252936', text:'#6b7280',
  up:'#22c55e', dn:'#ef4444',
  eqh:'#ef4444', eql:'#22c55e',
  bulOBTop:'#22c55e', bearOBBot:'#ef4444',
  entry:'#3b82f6', sl:'#ef4444', t1:'#22c55e', t2:'#06b6d4',
};

export default function CandleChart({ chartData, chartErr, chartLoading, height = 380 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volRef       = useRef(null);
  const [initError, setInitError] = useState(null);

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const w = containerRef.current.clientWidth || 600;
      const chart = createChart(containerRef.current, {
        width: w, height: height - 40,
        layout: { background: { color: C.bg }, textColor: C.text },
        grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: C.grid, scaleMargins: { top: 0.08, bottom: 0.2 } },
        timeScale: { borderColor: C.grid, timeVisible: false },
      });

      const cSeries = chart.addCandlestickSeries({
        upColor: C.up, downColor: C.dn,
        borderUpColor: C.up, borderDownColor: C.dn,
        wickUpColor: C.up, wickDownColor: C.dn,
      });

      const vSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      chartRef.current  = chart;
      seriesRef.current = cSeries;
      volRef.current    = vSeries;

      const ro = new ResizeObserver(entries => {
        if (entries[0] && chartRef.current) {
          chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        }
      });
      ro.observe(containerRef.current);

      return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
    } catch (e) {
      setInitError(e.message);
    }
  }, [height]);

  // Update data + annotations when chartData changes
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartRef.current) return;
    try {
      const { candles = [], annotations = {} } = chartData;
      if (!candles.length) return;

      // Set candle data
      seriesRef.current.setData(candles.map(c => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
      })));

      // Volume
      if (volRef.current) {
        volRef.current.setData(candles.map(c => ({
          time: c.time, value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)',
        })));
      }

      // Price lines — order blocks
      if (annotations.orderBlocks?.bullish) {
        const ob = annotations.orderBlocks.bullish;
        if (ob.top)    seriesRef.current.createPriceLine({ price: ob.top,    color: C.up, lineWidth: 1, lineStyle: LineStyle.Solid,  axisLabelVisible: true,  title: 'Bull OB' });
        if (ob.bottom) seriesRef.current.createPriceLine({ price: ob.bottom, color: C.up, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' });
      }
      if (annotations.orderBlocks?.bearish) {
        const ob = annotations.orderBlocks.bearish;
        if (ob.top)    seriesRef.current.createPriceLine({ price: ob.top,    color: C.dn, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' });
        if (ob.bottom) seriesRef.current.createPriceLine({ price: ob.bottom, color: C.dn, lineWidth: 1, lineStyle: LineStyle.Solid,  axisLabelVisible: true,  title: 'Bear OB' });
      }

      // EQH / EQL
      (annotations.eqhUnswept || []).slice(0, 2).forEach((l, i) => {
        seriesRef.current.createPriceLine({ price: l.price, color: C.eqh, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: i === 0, title: i === 0 ? 'EQH' : '' });
      });
      (annotations.eqlUnswept || []).slice(0, 2).forEach((l, i) => {
        seriesRef.current.createPriceLine({ price: l.price, color: C.eql, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: i === 0, title: i === 0 ? 'EQL' : '' });
      });

      // Signal lines (only when signal fired)
      const sig = annotations.signal;
      if (sig) {
        const mid = sig.entry ? (sig.entry.low + sig.entry.high) / 2 : null;
        if (mid) seriesRef.current.createPriceLine({ price: mid, color: C.entry, lineWidth: 2, lineStyle: LineStyle.Solid,  axisLabelVisible: true, title: 'Entry' });
        if (sig.sl) seriesRef.current.createPriceLine({ price: sig.sl, color: C.sl, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'SL' });
        if (sig.t1) seriesRef.current.createPriceLine({ price: sig.t1, color: C.t1, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'T1' });
        if (sig.t2) seriesRef.current.createPriceLine({ price: sig.t2, color: C.t2, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'T2' });
      }

      chartRef.current.timeScale().fitContent();
    } catch (e) {
      console.error('[CandleChart] data error:', e.message);
    }
  }, [chartData]);

  // Placeholder / error / loading states
  const boxStyle = { height, background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden' };

  if (initError) return (
    <div style={boxStyle}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, color:'var(--rd)', fontSize:12, padding:20 }}>
        Chart init error: {initError}
      </div>
    </div>
  );

  return (
    <div style={boxStyle}>
      {/* Header */}
      <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'var(--tx)' }}>
          {chartData?.symbol || '—'} · Daily · {chartData?.trend === 'up' ? '↑ Uptrend' : chartData?.trend === 'down' ? '↓ Downtrend' : 'SMC levels'}
        </span>
        <div style={{ display:'flex', gap:10, fontSize:9, color:'var(--mu)' }}>
          <span style={{ color:'var(--gr)' }}>— Bull OB</span>
          <span style={{ color:'var(--rd)' }}>— Bear OB</span>
          <span style={{ color:'var(--rd)', textDecoration:'underline dotted' }}>EQH</span>
          <span style={{ color:'var(--gr)', textDecoration:'underline dotted' }}>EQL</span>
          {chartData?.annotations?.signal && <span style={{ color:'var(--bl)' }}>── Signal</span>}
        </div>
      </div>

      {/* Chart or status */}
      {chartLoading && !chartData && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11, gap:8 }}>
          <span style={{ animation:'spin .8s linear infinite', display:'inline-block' }}>◌</span> Loading chart data...
        </div>
      )}
      {chartErr && !chartLoading && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'var(--rd)', fontSize:11, padding:16, textAlign:'center', gap:6 }}>
          <div>Chart data error</div>
          <div style={{ color:'var(--mu)', fontSize:10 }}>{chartErr}</div>
          <div style={{ color:'var(--mu)', fontSize:10, marginTop:4 }}>Check: /api/chart-data exists in MCPNIFTY_claude repo</div>
        </div>
      )}
      {!chartLoading && !chartErr && !chartData && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11 }}>
          Select a scrip above to load chart
        </div>
      )}

      <div ref={containerRef} style={{ flex:1, display: (!chartLoading && chartData) ? 'block' : 'none' }} />
    </div>
  );
}
