import React from 'react';

const DIM_ORDER  = ['ema','macd','rsi','vwap','volume','mtf'];
const DIM_LABELS = { ema:'Price Trend', macd:'Momentum', rsi:'Strength', vwap:'Vs VWAP', volume:'Volume', mtf:'Timeframes' };
const CHK_LABELS = {
  direction:'Direction', htfAlignment:'Higher TF', levels:'Value Zone', volatility:'IV Level',
  theta:'Time Left', liquidity:'Liquidity', momentum:'Momentum', risk:'Risk Set'
};

function Bar({ score, max }) {
  const pct = max ? (score/max)*100 : 0;
  const color = score===max ? '#22c55e' : score>0 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height:6, background:'var(--s1)', borderRadius:3, overflow:'hidden', flex:1 }}>
      <div style={{ height:6, width:pct+'%', background:color, borderRadius:3 }} />
    </div>
  );
}

export default function ChecklistPanel({ scrip }) {
  if (!scrip) return <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>Select a scrip</div>;

  const sig = scrip.signal || {};
  const chk = scrip.checklist || {};
  const scores = sig.scores || {};

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>

      {/* Overall score badge */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s2)', borderRadius:6, padding:'7px 10px' }}>
        <span style={{ fontSize:9, color:'var(--mu)' }}>Signal score</span>
        <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color: sig.fired?'var(--gr)':sig.confidence>=60?'var(--am)':'var(--tx)' }}>
          {sig.scoreLabel || '—/—'}
        </span>
      </div>

      {/* Score dimension bars — full width, simple */}
      {Object.keys(scores).length > 0 && (
        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:5 }}>
          {DIM_ORDER.map(k => {
            const v = scores[k];
            if (!v) return null;
            return (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:9, color:'var(--mu)', width:64, flexShrink:0 }}>{DIM_LABELS[k]}</span>
                <Bar score={v.score} max={v.max} />
                <span style={{ fontFamily:'monospace', fontSize:9, width:22, textAlign:'right', color: v.score===v.max?'var(--gr)':v.score>0?'var(--am)':'var(--rd)' }}>{v.score}/{v.max}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height:1, background:'var(--bd)', flexShrink:0 }} />

      {/* Checklist gates — full-width rows, simple icon */}
      {chk.items && (
        <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Checklist</span>
            <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700, color: chk.clearToTrade?'var(--gr)':'var(--rd)' }}>
              {chk.passed}/{(chk.passed||0)+(chk.failed||0)}
            </span>
          </div>
          {Object.entries(chk.items).map(([k,v]) => {
            const color = v.status==='pass'?'var(--gr)':v.status==='fail'?'var(--rd)':v.status==='warn'?'var(--am)':'var(--mu)';
            const icon  = v.status==='pass'?'✓':v.status==='fail'?'✗':'–';
            return (
              <div key={k} title={v.note||''} style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
                <span style={{ color, fontWeight:700, fontSize:12, width:14, flexShrink:0 }}>{icon}</span>
                <span style={{ fontSize:10, color:'var(--tx)' }}>{CHK_LABELS[k]||k}</span>
              </div>
            );
          })}
          <div style={{ marginTop:2, fontSize:10, fontWeight:700, color: chk.clearToTrade?'var(--gr)':'var(--rd)', padding:'4px 8px', background: chk.clearToTrade?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', borderRadius:5, textAlign:'center' }}>
            {chk.clearToTrade ? 'CLEAR TO TRADE' : 'NOT CLEAR YET'}
          </div>
        </div>
      )}
    </div>
  );
}
