import React from 'react';

const DIM_LABELS = {
  ema:'Trend', macd:'Momentum', rsi:'Strength', vwap:'VWAP', volume:'Volume', mtf:'MTF'
};
const CHK_LABELS = {
  direction:'Direction', htfAlignment:'HTF', levels:'Value zone', volatility:'IV',
  theta:'DTE', liquidity:'Liquidity', momentum:'Momentum', risk:'Risk'
};
const CHK_ICONS = { pass:'✓', fail:'✗', warn:'!', unknown:'?' };

function ScoreBar({ score, max }) {
  const pct = max ? (score/max)*100 : 0;
  const color = score===max ? '#22c55e' : score>0 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height:4, background:'#252936', borderRadius:2, overflow:'hidden', flex:1 }}>
      <div style={{ height:4, width:pct+'%', background:color, borderRadius:2 }} />
    </div>
  );
}

export default function TrendPanel({ scrip }) {
  if (!scrip) return <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>Select a scrip</div>;

  const sig = scrip.signal || {};
  const chk = scrip.checklist || {};
  const scores = sig.scores || {};

  const trendUp   = scrip.trend === 'up';
  const trendColor = trendUp ? 'var(--gr)' : scrip.trend==='down' ? 'var(--rd)' : 'var(--mu)';
  const trendLabel = trendUp ? '↑ UP' : scrip.trend==='down' ? '↓ DOWN' : '→ FLAT';
  const fired  = sig.fired;
  const conf   = sig.confidence || 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>

      {/* Checklist — moved to top, compact chips */}
      {chk.items && (
        <div style={{ flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Checklist</span>
            <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700, color: chk.clearToTrade?'var(--gr)':'var(--rd)' }}>
              {chk.passed}/{(chk.passed||0)+(chk.failed||0)} {chk.clearToTrade?'CLEAR':'NOT CLEAR'}
            </span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {Object.entries(chk.items).map(([k,v]) => {
              const bg = v.status==='pass'?'rgba(34,197,94,.12)':v.status==='fail'?'rgba(239,68,68,.12)':v.status==='warn'?'rgba(245,158,11,.12)':'var(--s2)';
              const color = v.status==='pass'?'var(--gr)':v.status==='fail'?'var(--rd)':v.status==='warn'?'var(--am)':'var(--mu)';
              return (
                <span key={k} title={v.note||''} style={{ fontSize:8, padding:'1px 5px', borderRadius:8, background:bg, color, fontWeight:600, cursor:'default' }}>
                  {CHK_ICONS[v.status]||'?'} {CHK_LABELS[k]||k}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Trend + score — compact single row */}
      <div style={{ background:'var(--s2)', borderRadius:6, padding:'8px 10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:15, fontWeight:700, color:trendColor }}>{trendLabel}</span>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color: fired?'var(--gr)':conf>=60?'var(--am)':'var(--tx)' }}>{sig.scoreLabel||'—/—'}</span>
          <span style={{ fontSize:9, color:'var(--mu)' }}>{fired?'FIRED':conf>=60?'watching':'no signal'}</span>
        </div>
      </div>

      {/* Retest note */}
      {fired && sig.retest?.type && sig.retest.type!=='none' && (
        <div style={{ padding:'4px 8px', background:'rgba(59,130,246,.1)', borderRadius:5, borderLeft:'2px solid var(--bl)', fontSize:10, color:'var(--bl)', flexShrink:0 }}>
          {sig.retest.type} retest @ ₹{sig.retest.level?.toLocaleString('en-IN',{maximumFractionDigits:0})}
        </div>
      )}
      {!fired && sig.reason && (
        <div style={{ fontSize:9, color:'var(--mu)', lineHeight:1.4, flexShrink:0 }}>{sig.reason.slice(0,90)}</div>
      )}

      {/* Score breakdown — compact 2-column grid */}
      {Object.keys(scores).length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
          <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Score breakdown</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px' }}>
            {Object.entries(scores).map(([k,v]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:9, color:'var(--mu)', width:52, flexShrink:0 }}>{DIM_LABELS[k]||k}</span>
                <ScoreBar score={v.score} max={v.max} />
                <span style={{ fontFamily:'monospace', fontSize:9, width:20, textAlign:'right', color: v.score===v.max?'var(--gr)':v.score>0?'var(--am)':'var(--rd)' }}>{v.score}/{v.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade plan — only if fired, compact */}
      {fired && sig.entry && (
        <div style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', borderRadius:6, padding:'6px 8px', flexShrink:0, fontSize:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'var(--mu)' }}>Entry ₹{sig.entry.low?.toLocaleString('en-IN',{maximumFractionDigits:0})}-{sig.entry.high?.toLocaleString('en-IN',{maximumFractionDigits:0})}</span>
            <span style={{ color:'var(--gr)', fontWeight:700 }}>R:R {sig.rr}×</span>
          </div>
        </div>
      )}
    </div>
  );
}
