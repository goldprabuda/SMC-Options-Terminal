import React, { useState, useEffect } from 'react';
import { useMarketData, useChartData } from './hooks/useData';
import TrendPanel    from './components/TrendPanel';
import OptionPanel   from './components/OptionPanel';
import CandleChart   from './components/CandleChart';
import LevelsOIPanel from './components/LevelsOIPanel';

const INTERVALS = [
  { key:'5',  label:'5M'  },
  { key:'15', label:'15M' },
  { key:'60', label:'1H'  },
  { key:'D',  label:'D'   },
  { key:'W',  label:'W'   },
];

function ScripTab({ scrip, active, onClick }) {
  const fired = scrip.signal?.fired;
  const score = scrip.signal?.confidence || 0;
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:6,border:'none',
      background:active?'var(--s2)':'transparent',color:active?'#fff':'var(--mu)',cursor:'pointer',
      flexShrink:0,fontSize:11,fontFamily:'monospace',fontWeight:600,
      borderBottom:active?'2px solid var(--cy)':'2px solid transparent' }}>
      <span style={{ width:6,height:6,borderRadius:'50%',flexShrink:0,
        background:fired?'var(--gr)':score>=60?'var(--am)':'var(--bd)',
        ...(fired?{animation:'blink 1.5s infinite'}:{}) }} />
      {scrip.symbol}
      {scrip.currentPrice && <span style={{ fontSize:9,color:'var(--mu)',fontWeight:400 }}>
        ₹{Math.round(scrip.currentPrice).toLocaleString('en-IN')}
      </span>}
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

export default function App() {
  const { data,error,loading,lastTs,refresh } = useMarketData(300);
  const [active,       setActive]       = useState(null);
  const [chartInterval,setChartInterval]= useState('D');  // renamed — avoids window.setInterval conflict

  const scrips = data?.scrips || [];
  useEffect(()=>{ if(!active && scrips.length) setActive(scrips[0].symbol); },[scrips]);

  const scrip = scrips.find(s=>s.symbol===active);
  const { chart:chartData, chartErr, chartLoading } = useChartData(active, chartInterval);

  const ts = lastTs ? lastTs.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false}) : '—';

  if(error) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',
      color:'var(--rd)',flexDirection:'column',gap:10,background:'var(--bg)',fontFamily:'monospace',fontSize:12 }}>
      <div>Connection error</div>
      <div style={{ color:'var(--mu)' }}>{error}</div>
      <div style={{ color:'var(--mu)',fontSize:10 }}>Check SMC_BOT_URL + SMC_BOT_KEY in Vercel env vars</div>
    </div>
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg)',overflow:'hidden' }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:'var(--s1)',borderBottom:'1px solid var(--bd)',flexShrink:0 }}>
        <span style={{ fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#fff',letterSpacing:2,flexShrink:0 }}>SMC OPTIONS</span>

        {/* Scrip tabs */}
        <div style={{ display:'flex',gap:2,flex:1,overflowX:'auto' }}>
          {scrips.map(s=>(
            <ScripTab key={s.symbol} scrip={s} active={s.symbol===active} onClick={()=>setActive(s.symbol)} />
          ))}
        </div>

        {/* Interval selector — uses setChartInterval not setInterval */}
        <div style={{ display:'flex',gap:2,flexShrink:0,background:'var(--s2)',borderRadius:6,padding:2,border:'1px solid var(--bd)' }}>
          {INTERVALS.map(iv=>(
            <button key={iv.key}
              onClick={()=> setChartInterval(iv.key)}
              style={{ fontSize:10,fontWeight:600,fontFamily:'monospace',padding:'3px 9px',borderRadius:4,border:'none',cursor:'pointer',
                background: chartInterval===iv.key ? 'var(--cy)' : 'transparent',
                color:      chartInterval===iv.key ? '#000'      : 'var(--mu)',
                transition:'all .15s' }}>
              {iv.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize:10,color:'var(--mu)',flexShrink:0 }}>
          {loading ? 'Loading...' : 'Updated '+ts+' IST'}
        </span>
        <button onClick={refresh} style={{ fontSize:10,padding:'4px 10px',borderRadius:5,border:'1px solid var(--bd)',background:'var(--s2)',color:'var(--tx)',cursor:'pointer',flexShrink:0 }}>↻</button>
        <Clock />
      </div>

      {/* Body */}
      {loading && !data ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>
          Connecting to SMC bot...
        </div>
      ) : !scrip ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'var(--mu)',fontSize:12 }}>
          No data — trigger a cron run from GitHub Actions
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'260px 1fr 220px',gap:8,padding:10,flex:1,overflow:'hidden',minHeight:0 }}>

          {/* Left */}
          <div style={{ display:'flex',flexDirection:'column',gap:8,overflow:'hidden',minHeight:0 }}>
            <div style={{ background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',overflow:'auto',maxHeight:'52%' }}>
              <TrendPanel scrip={scrip} />
            </div>
            <div style={{ background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',overflow:'auto',flex:1 }}>
              <OptionPanel scrip={scrip} />
            </div>
          </div>

          {/* Center — pass interval so chart shows correct label + timeVisible setting */}
          <div style={{ overflow:'hidden',minHeight:0 }}>
            <CandleChart
              key={active + '-' + chartInterval}
              chartData={chartData}
              chartErr={chartErr}
              chartLoading={chartLoading}
              interval={chartInterval}
              height={window.innerHeight - 80}
            />
          </div>

          {/* Right */}
          <div style={{ background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',overflow:'auto' }}>
            <LevelsOIPanel scrip={scrip} chartData={chartData} />
          </div>

        </div>
      )}
    </div>
  );
}
