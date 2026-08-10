import React, { useState, useEffect } from 'react';

const fmtL = n => n != null ? (n >= 1e7 ? (n/1e7).toFixed(2)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(2)+'L' : Number(n).toLocaleString('en-IN')) : '—';

export default function OIHistoryPanel({ selected, onClose }) {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setData(null);
    fetch('/api/oi-history?symbol=' + encodeURIComponent(selected.symbol) +
          '&strike=' + encodeURIComponent(selected.strike) +
          '&type=' + encodeURIComponent(selected.type) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (!selected) return null;

  const points = data?.points || [];
  const color = selected.type === 'CE' ? 'var(--gr)' : 'var(--rd)';

  // Sparkline
  let sparkline = null;
  if (points.length > 1) {
    const vals = points.map(p => p.oi).filter(v => v != null);
    const min = Math.min(...vals), max = Math.max(...vals), range = (max - min) || 1;
    const w = 200, h = 32, pad = 3;
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad*2);
      const y = h - pad - ((v - min) / range) * (h - pad*2);
      return x + ',' + y;
    }).join(' ');
    sparkline = (
      <svg width={w} height={h} style={{ display:'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>
          OI History — <span style={{ color }}>{selected.strike} {selected.type}</span>
        </span>
        <button onClick={onClose} style={{ fontSize:9, color:'var(--mu)', background:'none', border:'none', cursor:'pointer' }}>✕ back to movers</button>
      </div>

      {loading && <div style={{ fontSize:10, color:'var(--mu)' }}>Loading today's history...</div>}
      {error && <div style={{ fontSize:10, color:'var(--rd)' }}>{error}</div>}

      {data && points.length === 0 && (
        <div style={{ fontSize:10, color:'var(--mu)', padding:8, lineHeight:1.5 }}>
          No history captured yet today for this strike. Snapshots build up as the
          dashboard stays open, plus a background capture every ~5 min. Check back
          in a few minutes, or after market open tomorrow.
        </div>
      )}

      {points.length > 0 && (
        <>
          {sparkline && (
            <div style={{ flexShrink:0, background:'var(--s2)', borderRadius:6, padding:'6px 8px' }}>
              {sparkline}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 60px', gap:6, fontSize:8, color:'var(--mu)', padding:'0 4px', flexShrink:0 }}>
            <span>Time</span><span>OI</span><span style={{ textAlign:'right' }}>Change</span>
          </div>
          <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:2 }}>
            {points.slice().reverse().map((p, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'50px 1fr 60px', gap:6, alignItems:'center',
                padding:'3px 4px', borderRadius:4, background: i===0 ? 'rgba(59,130,246,.1)' : 'transparent' }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--tx)' }}>{p.timeIST}</span>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--tx)' }}>{fmtL(p.oi)}</span>
                <span style={{ fontFamily:'monospace', fontSize:9, textAlign:'right',
                  color: p.oiChange > 0 ? 'var(--gr)' : p.oiChange < 0 ? 'var(--rd)' : 'var(--mu)' }}>
                  {p.oiChange != null ? (p.oiChange > 0 ? '+' : '') + fmtL(p.oiChange) : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
