import React from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

function LevelRow({ type, price, label, rangeLow, rangeHigh }) {
  const colors = { R:'var(--rd)', C:'var(--bl)', S:'var(--gr)', N:'var(--mu)' };
  const bgs    = { R:'rgba(239,68,68,.06)', C:'rgba(59,130,246,.08)', S:'rgba(34,197,94,.06)', N:'transparent' };
  const pct    = rangeHigh && rangeLow ? Math.max(5, Math.min(95, ((price-rangeLow)/(rangeHigh-rangeLow))*100)) : 50;
  const color  = colors[type] || 'var(--mu)';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'5px 6px', borderRadius:5, background:bgs[type]||'transparent' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <span style={{ fontSize:8, color:'var(--mu)' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color }}>₹{fmt(price)}</span>
      </div>
      <div style={{ height:3, background:'var(--s1)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:3, width:pct+'%', background:color, borderRadius:2 }} />
      </div>
    </div>
  );
}

export default function LevelsPanel({ scrip }) {
  const liq = scrip?.liquidity || {};
  const ob  = scrip?.orderBlocks || {};
  const pd  = scrip?.premiumDiscount || {};

  const rangeHigh = pd.rangeHigh || liq.swingHighExtreme;
  const rangeLow  = pd.rangeLow  || liq.swingLowExtreme;

  const levels = [];
  if (rangeHigh)           levels.push({ t:'N', p:rangeHigh,               l:'RANGE HIGH' });
  if (liq.eqhUnswept?.[0])  levels.push({ t:'R', p:liq.eqhUnswept[0].price, l:'EQH' });
  if (ob.bearish?.bottom)   levels.push({ t:'R', p:ob.bearish.bottom,      l:'BEAR OB' });
  if (scrip?.currentPrice)  levels.push({ t:'C', p:scrip.currentPrice,     l:'CURRENT' });
  if (pd.equilibrium)       levels.push({ t:'N', p:pd.equilibrium,         l:'MID 50%' });
  if (ob.bullish?.top)      levels.push({ t:'S', p:ob.bullish.top,        l:'BULL OB' });
  if (liq.eqlUnswept?.[0])  levels.push({ t:'S', p:liq.eqlUnswept[0].price,l:'EQL' });
  if (rangeLow)             levels.push({ t:'N', p:rangeLow,               l:'RANGE LOW' });

  const rows = levels.filter(l=>l.p).sort((a,b)=>b.p-a.p)
    .filter((l,i,arr)=>!arr.slice(0,i).find(x=>Math.abs(x.p-l.p)<5));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, height:'100%', minHeight:0, overflow:'auto' }}>
      <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>Key Levels</div>
      {rows.map((l,i) => <LevelRow key={i} type={l.t} price={l.p} label={l.l} rangeLow={rangeLow} rangeHigh={rangeHigh} />)}
      {!rows.length && <div style={{ fontSize:10, color:'var(--mu)' }}>No levels mapped yet</div>}
    </div>
  );
}
