import React from 'react';

const fmtL = n => n != null ? (n >= 1e7 ? (n/1e7).toFixed(2)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(2)+'L' : Number(n).toLocaleString('en-IN')) : '—';

function MoverRow({ strike, side, changePct, oi }) {
  const color = changePct > 0 ? 'var(--gr)' : 'var(--rd)';
  const sideColor = side === 'CE' ? 'var(--gr)' : 'var(--rd)';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px', background:'var(--s2)', borderRadius:5 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:9, fontWeight:700, color:sideColor, width:22 }}>{side}</span>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--tx)' }}>{strike.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:9, color:'var(--mu)' }}>{fmtL(oi)}</span>
        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color }}>{changePct > 0 ? '+' : ''}{changePct}%</span>
      </div>
    </div>
  );
}

export default function OIMoversCard({ oiData }) {
  const strikes = oiData?.strikes || [];

  // Build a flat list of {strike, side, changePct, oi} for both CE and PE legs, sorted by |change|
  const movers = [];
  strikes.forEach(s => {
    if (s.ceChangePct != null) movers.push({ strike: s.strike, side: 'CE', changePct: s.ceChangePct, oi: s.ceOI });
    if (s.peChangePct != null) movers.push({ strike: s.strike, side: 'PE', changePct: s.peChangePct, oi: s.peOI });
  });
  movers.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const top = movers.slice(0, 5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>OI Change — Biggest Movers</div>
      {!top.length && <div style={{ fontSize:10, color:'var(--mu)' }}>Loads with OI matrix</div>}
      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:4 }}>
        {top.map((m, i) => <MoverRow key={i} {...m} />)}
      </div>
    </div>
  );
}
