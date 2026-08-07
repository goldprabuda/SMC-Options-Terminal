import React from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const pct = n => n != null ? (n > 0 ? '+' : '') + n.toFixed(1) + '%' : '—';

export default function AlternativesPanel({ scrip }) {
  const sig = scrip?.signal || {};
  const ladders = sig.optionAdvice;
  if (!ladders) return <div style={{ fontSize:10, color:'var(--mu)', padding:8 }}>Loads with option data</div>;

  const advice = ladders[ladders.autoSide];
  if (!advice) return null;

  const r   = advice.recommendation;
  const m   = r?.metrics;
  const alt = advice.alternatives || [];
  if (!r || !m) return null;

  const isCE = advice.optionType === 'CE';
  const all = [{ ...r, isRec: true }, ...alt.map(a => ({ ...a, isRec: false }))];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>
        Strike Alternatives — {advice.optionType}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'60px 55px 45px 50px 50px', gap:6, fontSize:8, color:'var(--mu)', padding:'0 4px', flexShrink:0 }}>
        <span>Strike</span><span>Ask</span><span>Delta</span><span>T1 gain</span><span>Break-even</span>
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:3 }}>
        {all.map((a, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'60px 55px 45px 50px 50px', gap:6, alignItems:'center',
            padding:'5px 4px', borderRadius:5,
            background: a.isRec ? (isCE?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)') : 'var(--s2)' }}>
            <span style={{ fontFamily:'monospace', fontSize:10, fontWeight: a.isRec?800:600, color: a.isRec?(isCE?'var(--gr)':'var(--rd)'):'var(--tx)' }}>
              {a.strike.toLocaleString('en-IN')}{a.isRec ? ' ★' : ''}
            </span>
            <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--tx)' }}>₹{fmt(a.metrics.ask)}</span>
            <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--cy)' }}>{a.metrics.delta}</span>
            <span style={{ fontFamily:'monospace', fontSize:10, color: a.metrics.pnlAtT1Pct>=0?'var(--gr)':'var(--rd)' }}>{pct(a.metrics.pnlAtT1Pct)}</span>
            <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--mu)' }}>₹{fmt(a.breakEven)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
