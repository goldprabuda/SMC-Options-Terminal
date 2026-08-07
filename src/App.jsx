import React, { useState, useEffect } from 'react';
import { useMarketData } from './hooks/useData';
import { useLiveAnalysis } from './hooks/useLiveAnalysis';
import { useOIData } from './hooks/useOIData';
import ChecklistPanel     from './components/ChecklistPanel';
import OptionPanel        from './components/OptionPanel';
import LevelsPanel        from './components/LevelsPanel';
import RecommendationCard from './components/RecommendationCard';
import AlternativesPanel  from './components/AlternativesPanel';
import OIMoversCard       from './components/OIMoversCard';
import OIMatrix           from './components/OIMatrix';

function ScripTab({ scrip, active, onClick }) {
  const fired = scrip.signal?.fired;
  const score = scrip.signal?.confidence || 0;
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:6,border:'none',
      background:active?'var(--s2)':'transparent',color:active?'#fff':'var(--mu)',cursor:'pointer',
      flexShrink:0,fontSize:12,fontFamily:'monospace',fontWeight:700,
      borderBottom:active?'2px solid var(--cy)':'2px solid transparent' }}>
      <span style={{ width:7,height:7,borderRadius:'50%',flexShrink:0,
        background:fired?'var(--gr)':score>=60?'var(--am)':'var(--bd)',
        ...(fired?{animation:'blink 1.5s infinite'}:{}) }} />
      {scrip.symbol}
      {scrip.currentPrice && <span style={{ fontSize:10,color:'var(--mu)',fontWeight:400 }}>₹{Math.round(scrip.currentPrice).toLocaleString('en-IN')}</span>}
    </button>
  );
}

function Clock() {
  const [t,setT] = useState('');
  useEffect(()=>{
    const u = () => setT(new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false}));
    u(); const id = window.setInterval(u,1000); return () => window.clearInterval(id);
  },[]);
  return <span style={{ fontFamily:'monospace',fontSize:11,color:'var(--cy)',flexShrink:0 }}>IST {t}</span>;
}

function Cell({ area, accent, children, style }) {
  return (
    <div style={{
      gridArea: area, background:'var(--s1)', border:'1px solid var(--bd)',
      borderTop: accent ? '2px solid '+accent : '1px solid var(--bd)',
      borderRadius:10, padding:'10px 12px',
      minWidth:0, minHeight:0, overflow:'hidden',
      display:'flex', flexDirection:'column',
      ...style,
    }}>
      {children}
    </div>
  );
}

function LiveStatus({ loading, error, secsAgo, onRefresh }) {
  let text, color;
  if (loading)     { text = 'Computing live analysis...'; color = 'var(--cy)'; }
  else if (error)  { text = 'Failed: ' + error; color = 'var(--rd)'; }
  else             { text = 'Live · ' + secsAgo + 's ago'; color = 'var(--gr)'; }
  return (
    <div style={{ gridArea:'status', display:'flex', alignItems:'center', gap:8, padding:'0 2px' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, ...(loading?{animation:'spin .8s linear infinite', border:'1px solid '+color, background:'transparent'}:{}) }} />
      <span style={{ fontSize:10, color, fontFamily:'monospace' }}>{text}</span>
      <button onClick={onRefresh} disabled={loading} style={{ fontSize:9, padding:'2px 8px', borderRadius:4, border:'1px solid var(--bd)', background:'var(--s2)', color: loading?'var(--mu)':'var(--tx)', cursor: loading?'default':'pointer', marginLeft:'auto' }}>
        ↻ Refresh now
      </button>
    </div>
  );
}

function LoadingBox() {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, color:'var(--mu)', fontSize:11 }}>
      <span style={{ width:16, height:16, border:'2px solid var(--bd)', borderTopColor:'var(--cy)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      Computing...
    </div>
  );
}

export default function App() {
  const { data, error: listError, loading: listLoading } = useMarketData(300);
  const [active, setActive] = useState(null);

  const scrips = data?.scrips || [];
  useEffect(() => { if (!active && scrips.length) setActive(scrips[0].symbol); }, [scrips]);

  const { data: live, error: liveError, loading: liveLoading, secsAgo, refresh } = useLiveAnalysis(active);
  const oi = useOIData(active);   // shared: feeds both OIMatrix and OIMoversCard

  if (listError) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',
      color:'var(--rd)',flexDirection:'column',gap:10,background:'var(--bg)',fontFamily:'monospace',fontSize:12 }}>
      <div>Connection error</div><div style={{ color:'var(--mu)' }}>{listError}</div>
    </div>
  );

  const sig = live?.signal;
  const signalAccent = sig?.fired ? 'var(--gr)' : (sig?.confidence >= 60 ? 'var(--am)' : 'var(--bd)');
  const optAccent = sig?.optionAdvice ? (sig.optionAdvice[sig.optionAdvice.autoSide]?.optionType==='CE' ? 'var(--gr)' : 'var(--rd)') : 'var(--bd)';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', overflow:'hidden' }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'var(--s1)', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
        <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:700, color:'#fff', letterSpacing:2, flexShrink:0 }}>SMC · INDEX OPTIONS</span>
        <div style={{ display:'flex', gap:3, flex:1 }}>
          {scrips.map(s => <ScripTab key={s.symbol} scrip={s} active={s.symbol===active} onClick={()=>setActive(s.symbol)} />)}
        </div>
        <Clock />
      </div>

      {/* Body */}
      {listLoading && !data ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>Connecting to SMC bot...</div>
      ) : !active ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>No index scrips active — check watchlist</div>
      ) : (
        // No chart, no AI narrative panel. OI matrix stays the wide centerpiece.
        // Left: Checklist (options-specific, grouped) + Option (single recommended strike).
        // Right: Recommendation verdict + Levels + Alternatives (expanded) + OI Movers.
        <div style={{
          display:'grid',
          gridTemplateColumns: '260px 1fr 260px',
          gridTemplateRows:    '20px 1fr',
          gridTemplateAreas: `
            "status status status"
            "left   oi     right"
          `,
          gap:8, padding:10, flex:1, minHeight:0, minWidth:0, overflow:'hidden',
        }}>
          <LiveStatus loading={liveLoading} error={liveError} secsAgo={secsAgo} onRefresh={refresh} />

          {/* Left column */}
          <div style={{ gridArea:'left', display:'grid', gridTemplateRows:'1fr auto', gap:8, minHeight:0 }}>
            <Cell accent={signalAccent}>
              {liveLoading && !live ? <LoadingBox /> : <ChecklistPanel scrip={live} />}
            </Cell>
            <Cell accent={optAccent} style={{ maxHeight:280 }}>
              {liveLoading && !live ? <LoadingBox /> : <OptionPanel scrip={live} />}
            </Cell>
          </div>

          {/* Center — OI matrix */}
          <Cell area="oi" accent="var(--cy)">
            <OIMatrix symbol={active} {...oi} />
          </Cell>

          {/* Right column — Recommendation / Levels / Alternatives / OI Movers */}
          <div style={{ gridArea:'right', display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:8, minHeight:0 }}>
            <Cell accent={sig?.fired ? 'var(--gr)' : 'var(--am)'} style={{ maxHeight:150 }}>
              {liveLoading && !live ? <LoadingBox /> : <RecommendationCard scrip={live} />}
            </Cell>
            <Cell accent="var(--bd)" style={{ maxHeight:150 }}>
              {liveLoading && !live ? <LoadingBox /> : <LevelsPanel scrip={live} />}
            </Cell>
            <Cell accent="var(--bl)">
              {liveLoading && !live ? <LoadingBox /> : <AlternativesPanel scrip={live} />}
            </Cell>
            <Cell accent="var(--am)" style={{ maxHeight:220 }}>
              <OIMoversCard oiData={oi.data} />
            </Cell>
          </div>

        </div>
      )}
    </div>
  );
}
