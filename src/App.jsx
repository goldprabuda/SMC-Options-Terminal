import React, { useState, useEffect } from 'react';
import { useMarketData } from './hooks/useData';
import { useLiveAnalysis } from './hooks/useLiveAnalysis';
import { useOIData } from './hooks/useOIData';
import ChecklistPanel     from './components/ChecklistPanel';
import OptionPanel        from './components/OptionPanel';
import LevelsPanel        from './components/LevelsPanel';
import RecommendationCard from './components/RecommendationCard';
import OIMatrix            from './components/OIMatrix';
import OIHistoryPanel      from './components/OIHistoryPanel';
import OIFlowTable         from './components/OIFlowTable';
import SignalScoreBar      from './components/SignalScoreBar';
import CollapsibleCard     from './components/CollapsibleCard';

const ZOOM_STEPS = [0.85, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
const ZOOM_KEY = 'smc_ui_zoom';

function ScripTab({ scrip, active, onClick }) {
  const fired = scrip.signal?.fired;
  const score = scrip.signal?.confidence || 0;
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:6,border:'none',
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

function ZoomControl({ zoom, setZoom }) {
  const idx = ZOOM_STEPS.indexOf(zoom);
  const dec = () => setZoom(ZOOM_STEPS[Math.max(0, idx - 1)]);
  const inc = () => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)]);
  const reset = () => setZoom(1);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)', flexShrink:0 }}>
      <button onClick={dec} style={{ width:22, height:20, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:'var(--mu)', cursor:'pointer', borderRadius:4 }}>−</button>
      <button onClick={reset} style={{ fontSize:9, fontFamily:'monospace', padding:'0 6px', height:20, border:'none', background:'transparent', color:'var(--tx)', cursor:'pointer' }}>{Math.round(zoom*100)}%</button>
      <button onClick={inc} style={{ width:22, height:20, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:'var(--mu)', cursor:'pointer', borderRadius:4 }}>+</button>
    </div>
  );
}

function LoadingBox() {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, color:'var(--mu)', fontSize:11, minHeight:80 }}>
      <span style={{ width:16, height:16, border:'2px solid var(--bd)', borderTopColor:'var(--cy)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      Computing...
    </div>
  );
}

export default function App() {
  const { data, error: listError, loading: listLoading } = useMarketData(300);
  const [active, setActive] = useState(null);
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [heroTab, setHeroTab] = useState('live');  // 'live' | 'history' | 'flow'
  const [zoom, setZoomState] = useState(() => { try { return Number(localStorage.getItem(ZOOM_KEY)) || 1; } catch (_) { return 1; } });
  const setZoom = (z) => { setZoomState(z); try { localStorage.setItem(ZOOM_KEY, String(z)); } catch (_) {} };

  const scrips = data?.scrips || [];
  useEffect(() => { if (!active && scrips.length) setActive(scrips[0].symbol); }, [scrips]);
  useEffect(() => { setSelectedStrike(null); setHeroTab('live'); }, [active]);

  const { data: live, error: liveError, loading: liveLoading, secsAgo, refresh } = useLiveAnalysis(active);
  const oi = useOIData(active);

  const handleSelectStrike = (sel) => { setSelectedStrike(sel); setHeroTab('history'); };

  if (listError) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',
      color:'var(--rd)',flexDirection:'column',gap:10,background:'var(--bg)',fontFamily:'monospace',fontSize:12 }}>
      <div>Connection error</div><div style={{ color:'var(--mu)' }}>{listError}</div>
    </div>
  );

  const sig = live?.signal;
  const optAccent = sig?.optionAdvice ? (sig.optionAdvice[sig.optionAdvice.autoSide]?.optionType==='CE' ? 'var(--gr)' : 'var(--rd)') : 'var(--bd)';
  const chkClear = live?.checklist?.clearToTrade;
  const recVerdictColor = sig?.fired ? 'var(--gr)' : 'var(--am)';

  return (
    <div style={{ zoom, height:'100%' }}>
    <div className="app-root" style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', overflow:'auto' }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dash-body { display:grid; grid-template-rows: auto 1fr auto; gap:8px; padding:10px; flex:1; min-height:700px; }
        .ref-row { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; }
        .hero-tabs button { font-size:11px; font-weight:700; padding:6px 16px; border-radius:6px; border:none; cursor:pointer; }
        @media (max-width: 820px) {
          .ref-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 520px) {
          .ref-row { grid-template-columns: 1fr; }
          .header-brand { display:none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--s1)', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
        <span className="header-brand" style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'#fff', letterSpacing:2, flexShrink:0 }}>SMC</span>
        <div style={{ display:'flex', gap:3, flex:1, overflowX:'auto' }}>
          {scrips.map(s => <ScripTab key={s.symbol} scrip={s} active={s.symbol===active} onClick={()=>setActive(s.symbol)} />)}
        </div>
        <ZoomControl zoom={zoom} setZoom={setZoom} />
        <Clock />
      </div>

      {listLoading && !data ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>Connecting...</div>
      ) : !active ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>No index scrips active</div>
      ) : (
        <div className="dash-body">

          {/* Row 1 — signal score, one line */}
          <SignalScoreBar scrip={live} />

          {/* Row 2 — HERO: LIVE / HISTORY / FLOW tabs */}
          <div style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderTop:'2px solid var(--cy)', borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', minHeight:400, overflow:'hidden' }}>
            <div className="hero-tabs" style={{ display:'flex', gap:2, marginBottom:8, flexShrink:0 }}>
              <button onClick={()=>setHeroTab('live')} style={{ background: heroTab==='live'?'var(--cy)':'var(--s2)', color: heroTab==='live'?'#000':'var(--mu)' }}>LIVE OI</button>
              <button onClick={()=>setHeroTab('history')} style={{ background: heroTab==='history'?'var(--cy)':'var(--s2)', color: heroTab==='history'?'#000':'var(--mu)' }}>
                STRIKE HISTORY {selectedStrike ? '· ' + selectedStrike.strike : ''}
              </button>
              <button onClick={()=>setHeroTab('flow')} style={{ background: heroTab==='flow'?'var(--cy)':'var(--s2)', color: heroTab==='flow'?'#000':'var(--mu)' }}>OI FLOW</button>
            </div>
            <div style={{ flex:1, minHeight:0, overflow:'hidden' }}>
              {heroTab === 'live' && <OIMatrix symbol={active} {...oi} onSelectStrike={handleSelectStrike} />}
              {heroTab === 'history' && (
                selectedStrike
                  ? <OIHistoryPanel selected={selectedStrike} onClose={()=>setHeroTab('live')} />
                  : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--mu)', fontSize:11, textAlign:'center', padding:20 }}>
                      Click any strike price in the LIVE tab to see its history here
                    </div>
              )}
              {heroTab === 'flow' && <OIFlowTable symbol={active} />}
            </div>
          </div>

          {/* Row 3 — small collapsible reference cards */}
          <div className="ref-row">
            <CollapsibleCard title="Option" accent={optAccent}
              summary={sig?.optionAdvice ? sig.optionAdvice[sig.optionAdvice.autoSide]?.optionType + ' via ' + (sig.scalpAdvice ? 'scalp' : 'swing') : '—'}
              summaryColor={optAccent}>
              {liveLoading && !live ? <LoadingBox /> : <OptionPanel scrip={live} />}
            </CollapsibleCard>

            <CollapsibleCard title="Checklist" accent={chkClear?'var(--gr)':'var(--rd)'}
              summary={live?.checklist ? live.checklist.passed+'/'+((live.checklist.passed||0)+(live.checklist.failed||0))+' pass' : '—'}
              summaryColor={chkClear?'var(--gr)':'var(--rd)'}>
              {liveLoading && !live ? <LoadingBox /> : <ChecklistPanel scrip={live} />}
            </CollapsibleCard>

            <CollapsibleCard title="Levels" accent="var(--bd)"
              summary={live?.currentPrice ? '₹'+Math.round(live.currentPrice).toLocaleString('en-IN') : '—'}>
              {liveLoading && !live ? <LoadingBox /> : <LevelsPanel scrip={live} />}
            </CollapsibleCard>

            <CollapsibleCard title="Verdict" accent={recVerdictColor}
              summary={sig?.fired ? 'ENTER' : (sig?.confidence>=50 ? 'WATCH' : 'WAIT')}
              summaryColor={recVerdictColor}>
              {liveLoading && !live ? <LoadingBox /> : <RecommendationCard scrip={live} />}
            </CollapsibleCard>
          </div>

        </div>
      )}
    </div>
    </div>
  );
}
