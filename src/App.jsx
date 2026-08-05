import React, { useState, useEffect } from 'react';
import { useMarketData, useChartData } from './hooks/useData';
import TrendPanel    from './components/TrendPanel';
import OptionPanel   from './components/OptionPanel';
import CandleChart   from './components/CandleChart';
import LevelsOIPanel from './components/LevelsOIPanel';

const STYLES = {
  app:     { display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', overflow:'hidden' },
  header:  { display:'flex', alignItems:'center', gap:12, padding:'8px 16px', background:'var(--s1)', borderBottom:'1px solid var(--bd)', flexShrink:0 },
  brand:   { fontFamily:'var(--fn)', fontSize:14, fontWeight:700, color:'#fff', letterSpacing:2, flexShrink:0 },
  tabs:    { display:'flex', gap:2, flex:1, overflowX:'auto', scrollbarWidth:'none' },
  body:    { display:'grid', gridTemplateColumns:'260px 1fr 220px', gap:8, padding:10, flex:1, overflow:'hidden', minHeight:0 },
  col:     { display:'flex', flexDirection:'column', gap:8, overflow:'hidden', minHeight:0 },
  panel:   { background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:10, padding:'12px 14px', overflow:'hidden', flex:1, minHeight:0 },
  spinner: { display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--mu)', fontSize:12 },
};

function ScripTab({ scrip, active, onClick }) {
  const fired = scrip.signal?.fired;
  const score = scrip.signal?.confidence || 0;
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:6, border:'none', background: active ? 'var(--s2)' : 'transparent', color: active ? '#fff' : 'var(--mu)', cursor:'pointer', flexShrink:0, fontSize:11, fontFamily:'var(--fn)', fontWeight:600, borderBottom: active ? '2px solid var(--cy)' : '2px solid transparent' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: fired ? 'var(--gr)' : score >= 60 ? 'var(--am)' : 'var(--bd)', flexShrink:0, ...(fired ? {animation:'blink 1.5s infinite'} : {}) }} />
      {scrip.symbol}
      {scrip.currentPrice ? <span style={{ fontSize:9, color:'var(--mu)', fontWeight:400 }}>₹{Math.round(scrip.currentPrice).toLocaleString('en-IN')}</span> : null}
    </button>
  );
}

function Clock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const update = () => setT(new Date().toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata', hour12:false }));
    update(); const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily:'var(--fn)', fontSize:11, color:'var(--cy)', flexShrink:0 }}>IST {t}</span>;
}

export default function App() {
  const { data, error, loading, lastTs, refresh } = useMarketData(300);
  const [active, setActive] = useState(null);

  const scrips = data?.scrips || [];
  if (!active && scrips.length) setActive(scrips[0].symbol);
  const scrip = scrips.find(s => s.symbol === active);

  const { chart: chartData, chartLoading } = useChartData(active);

  if (error) return <div style={{ ...STYLES.app, ...STYLES.spinner }}>{error}</div>;

  const ts = lastTs ? lastTs.toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata', hour12:false }) : '—';

  return (
    <div style={STYLES.app}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {/* Header */}
      <div style={STYLES.header}>
        <div style={STYLES.brand}>SMC OPTIONS</div>
        <div style={STYLES.tabs}>
          {scrips.map(s => <ScripTab key={s.symbol} scrip={s} active={s.symbol === active} onClick={() => setActive(s.symbol)} />)}
        </div>
        <span style={{ fontSize:10, color:'var(--mu)', flexShrink:0 }}>
          {loading ? 'Loading...' : 'Updated ' + ts + ' IST'}
        </span>
        <button onClick={refresh} style={{ fontSize:10, padding:'4px 10px', borderRadius:5, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--tx)', cursor:'pointer', flexShrink:0 }}>
          ↻ Refresh
        </button>
        <Clock />
      </div>

      {/* Main layout */}
      {loading && !data ? (
        <div style={STYLES.spinner}>Connecting to SMC bot...</div>
      ) : !scrip ? (
        <div style={STYLES.spinner}>No data — trigger a cron run from GitHub Actions</div>
      ) : (
        <div style={STYLES.body}>
          {/* Left: Trend + Signal */}
          <div style={STYLES.col}>
            <div style={{ ...STYLES.panel, flex: '0 0 auto', maxHeight: '55%' }}>
              <TrendPanel scrip={scrip} />
            </div>
            <div style={{ ...STYLES.panel, flex: 1 }}>
              <OptionPanel scrip={scrip} />
            </div>
          </div>

          {/* Center: Chart */}
          <div style={STYLES.col}>
            <CandleChart chartData={chartData} height={560} />
            {chartLoading && <div style={{ fontSize:10, color:'var(--mu)', textAlign:'center' }}>Loading chart...</div>}
          </div>

          {/* Right: Levels + OI + Narrative */}
          <div style={{ ...STYLES.col }}>
            <div style={{ ...STYLES.panel }}>
              <LevelsOIPanel scrip={scrip} chartData={chartData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
