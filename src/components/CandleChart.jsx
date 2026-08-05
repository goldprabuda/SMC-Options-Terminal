import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const COLORS = {
  bg: '#0d0f14', grid: '#252936', text: '#6b7280',
  up: '#22c55e', dn: '#ef4444', wick: '#4b5563',
  bulOB: 'rgba(34,197,94,0.15)', bearOB: 'rgba(239,68,68,0.15)',
  vwap: '#06b6d4', eqh: '#ef4444', eql: '#22c55e',
  entry: 'rgba(59,130,246,0.2)', t1: '#22c55e', t2: '#06b6d4', sl: '#ef4444',
};

export default function CandleChart({ chartData, height = 380 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volRef       = useRef(null);

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: height - 4,
      layout: { background: { color: COLORS.bg }, textColor: COLORS.text },
      grid:   { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: COLORS.grid },
      timeScale: { borderColor: COLORS.grid, timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: COLORS.up, downColor: COLORS.dn,
      borderUpColor: COLORS.up, borderDownColor: COLORS.dn,
      wickUpColor: COLORS.up, wickDownColor: COLORS.dn,
    });

    const volSeries = chart.addHistogramSeries({
      color: 'rgba(99,102,241,0.3)', priceFormat: { type: 'volume' },
      priceScaleId: 'vol', scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current  = chart;
    seriesRef.current = candleSeries;
    volRef.current    = volSeries;

    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [height]);

  // Update data + annotations when chartData changes
  useEffect(() => {
    if (!chartData || !seriesRef.current || !chartRef.current) return;
    const { candles = [], annotations = {} } = chartData;

    // Candles
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    seriesRef.current.setData(sorted.map(c => ({
      time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    })));

    // Volume
    if (volRef.current) {
      volRef.current.setData(sorted.map(c => ({
        time: c.time, value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
      })));
    }

    // Clear existing price lines
    const series = seriesRef.current;

    // Order blocks
    if (annotations.orderBlocks?.bullish) {
      const ob = annotations.orderBlocks.bullish;
      series.createPriceLine({ price: ob.top,    color: COLORS.up, lineWidth: 1, lineStyle: LineStyle.Solid,  title: 'Bull OB top',    axisLabelVisible: true });
      series.createPriceLine({ price: ob.bottom, color: COLORS.up, lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'Bull OB bottom', axisLabelVisible: false });
    }
    if (annotations.orderBlocks?.bearish) {
      const ob = annotations.orderBlocks.bearish;
      series.createPriceLine({ price: ob.top,    color: COLORS.dn, lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'Bear OB top',    axisLabelVisible: false });
      series.createPriceLine({ price: ob.bottom, color: COLORS.dn, lineWidth: 1, lineStyle: LineStyle.Solid,  title: 'Bear OB bottom', axisLabelVisible: true });
    }

    // EQH/EQL (unswept liquidity pools)
    (annotations.eqhUnswept || []).slice(0, 2).forEach((l, i) => {
      series.createPriceLine({ price: l.price, color: COLORS.eqh, lineWidth: 1, lineStyle: LineStyle.Dashed, title: i === 0 ? 'EQH' : '', axisLabelVisible: i === 0 });
    });
    (annotations.eqlUnswept || []).slice(0, 2).forEach((l, i) => {
      series.createPriceLine({ price: l.price, color: COLORS.eql, lineWidth: 1, lineStyle: LineStyle.Dashed, title: i === 0 ? 'EQL' : '', axisLabelVisible: i === 0 });
    });

    // Signal levels
    const sig = annotations.signal;
    if (sig) {
      if (sig.entry) {
        series.createPriceLine({ price: (sig.entry.low + sig.entry.high) / 2, color: COLORS.bl, lineWidth: 2, lineStyle: LineStyle.Solid, title: 'Entry', axisLabelVisible: true });
      }
      if (sig.sl) series.createPriceLine({ price: sig.sl, color: COLORS.sl, lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'SL', axisLabelVisible: true });
      if (sig.t1) series.createPriceLine({ price: sig.t1, color: COLORS.t1, lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'T1', axisLabelVisible: true });
      if (sig.t2) series.createPriceLine({ price: sig.t2, color: COLORS.t2, lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'T2', axisLabelVisible: true });
    }

    chartRef.current.timeScale().fitContent();
  }, [chartData]);

  if (!chartData) return (
    <div style={{ height, background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', borderRadius: 8, border: '1px solid var(--bd)', fontSize: 12 }}>
      Select a scrip to load chart
    </div>
  );

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bd)', background: COLORS.bg }}>
      <div style={{ padding: '8px 12px', background: 'var(--s1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)' }}>
        <span style={{ fontFamily: 'var(--fn)', fontSize: 11, fontWeight: 600, color: 'var(--tx)' }}>{chartData.symbol} · Daily</span>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--mu)' }}>
          <span style={{ color: 'var(--gr)' }}>█ Bull OB</span>
          <span style={{ color: 'var(--rd)' }}>█ Bear OB</span>
          <span style={{ color: 'var(--rd)', borderBottom: '1px dashed' }}>EQH</span>
          <span style={{ color: 'var(--gr)', borderBottom: '1px dashed' }}>EQL</span>
          {chartData.annotations?.signal && <span style={{ color: 'var(--bl)' }}>── Signal</span>}
        </div>
      </div>
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
