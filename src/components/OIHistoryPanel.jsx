import React, { useState, useEffect } from 'react';

const fmtL = n => n != null ? (n >= 1e7 ? (n/1e7).toFixed(2)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(2)+'L' : Number(n).toLocaleString('en-IN')) : '—';
const fmtP = n => n != null ? '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';

function ChangeCell({ pct }) {
  if (pct == null) return <span style={{ color:'var(--mu)' }}>—</span>;
  const color = pct > 0 ? 'var(--gr)' : pct < 0 ? 'var(--rd)' : 'var(--mu)';
  return <span style={{ color }}>{pct > 0 ? '+' : ''}{pct}%</span>;
}

export default function OIHistoryPanel({ selected, onClose }) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setData(null);
    fetch('/api/oi-strike-history?symbol=' + encodeURIComponent(selected.symbol) +
          '&strike=' + encodeURIComponent(selected.strike) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (!selected) return null;

  const points = data?.points || [];

  // Dual sparkline — CE (green) and PE (red) OI overlaid on one chart
  let sparkline = null;
  if (points.length > 1) {
    const ceVals = points.map(p => p.ceOI).filter(v => v != null);
    const peVals = points.map(p => p.peOI).filter(v => v != null);
    const allVals = [...ceVals, ...peVals];
    if (allVals.length > 1) {
      const min = Math.min(...allVals), max = Math.max(...allVals), range = (max - min) || 1;
      const w = 220, h = 36, pad = 3;
      const toPts = (vals) => vals.map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (w - pad*2);
        const y = h - pad - ((v - min) / range) * (h - pad*2);
        return x + ',' + y;
      }).join(' ');
      sparkline = (
        <svg width={w} height={h} style={{ display:'block' }}>
          <polyline points={toPts(ceVals)} fill="none" stroke="var(--gr)" strokeWidth="1.5" />
          <polyline points={toPts(peVals)} fill="none" stroke="var(--rd)" strokeWidth="1.5" />
        </svg>
      );
    }
  }

  const latest = points[points.length - 1];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>
          History — <span style={{ color:'var(--bl)' }}>{selected.strike}</span> · <span style={{ color:'var(--gr)' }}>CE</span> + <span style={{ color:'var(--rd)' }}>PE</span>
        </span>
        <button onClick={onClose} style={{ fontSize:9, color:'var(--mu)', background:'none', border:'none', cursor:'pointer' }}>✕ back to movers</button>
      </div>

      {loading && <div style={{ fontSize:10, color:'var(--mu)' }}>Loading today's history...</div>}
      {error && <div style={{ fontSize:10, color:'var(--rd)' }}>{error}</div>}

      {data && points.length === 0 && (
        <div style={{ fontSize:10, color:'var(--mu)', padding:8, lineHeight:1.5 }}>
          No history captured yet today for this strike. Builds up as the
          dashboard stays open, plus a background capture every ~5 min.
        </div>
      )}

      {points.length > 0 && (
        <>
          {sparkline && (
            <div style={{ flexShrink:0, background:'var(--s2)', borderRadius:6, padding:'6px 8px' }}>
              {sparkline}
              <div style={{ display:'flex', gap:10, fontSize:8, color:'var(--mu)', marginTop:3 }}>
                <span style={{ color:'var(--gr)' }}>— CE OI</span>
                <span style={{ color:'var(--rd)' }}>— PE OI</span>
              </div>
            </div>
          )}

          {/* Current snapshot summary */}
          {latest && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flexShrink:0 }}>
              <div style={{ background:'rgba(34,197,94,.08)', borderRadius:5, padding:'5px 7px', borderLeft:'2px solid var(--gr)' }}>
                <div style={{ fontSize:8, color:'var(--mu)' }}>CE now</div>
                <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--gr)', fontWeight:700 }}>{fmtL(latest.ceOI)} · Δ{latest.ceDelta ?? '—'}</div>
              </div>
              <div style={{ background:'rgba(239,68,68,.08)', borderRadius:5, padding:'5px 7px', borderLeft:'2px solid var(--rd)' }}>
                <div style={{ fontSize:8, color:'var(--mu)' }}>PE now</div>
                <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--rd)', fontWeight:700 }}>{fmtL(latest.peOI)} · Δ{latest.peDelta ?? '—'}</div>
              </div>
            </div>
          )}
          {latest?.localPCR != null && (
            <div style={{ fontSize:9, color:'var(--cy)', flexShrink:0 }}>Local PCR at this strike: <strong>{latest.localPCR}</strong></div>
          )}

          {/* Combined table */}
          <div style={{ display:'grid', gridTemplateColumns:'42px 1fr 1fr 46px', gap:4, fontSize:7, color:'var(--mu)', padding:'0 4px', flexShrink:0 }}>
            <span>Time</span><span>CE OI (Δ%)</span><span>PE OI (Δ%)</span><span style={{ textAlign:'right' }}>PCR</span>
          </div>
          <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:2 }}>
            {points.slice().reverse().map((p, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'42px 1fr 1fr 46px', gap:4, alignItems:'center',
                padding:'3px 4px', borderRadius:4, fontSize:9, background: i===0 ? 'rgba(59,130,246,.1)' : 'transparent' }}>
                <span style={{ fontFamily:'monospace', color:'var(--tx)' }}>{p.timeIST}</span>
                <span style={{ fontFamily:'monospace', color:'var(--gr)' }}>{fmtL(p.ceOI)} <ChangeCell pct={p.ceOIChangePct} /></span>
                <span style={{ fontFamily:'monospace', color:'var(--rd)' }}>{fmtL(p.peOI)} <ChangeCell pct={p.peOIChangePct} /></span>
                <span style={{ fontFamily:'monospace', color:'var(--cy)', textAlign:'right' }}>{p.localPCR ?? '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
