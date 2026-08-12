import React, { useState, useEffect, useCallback, useRef } from 'react';

const fmtL = n => n != null ? (n >= 1e7 ? (n/1e7).toFixed(2)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(2)+'L' : Number(n).toLocaleString('en-IN')) : '—';

const REFRESH_OPTIONS = [{ key: 60, label: '1M' }, { key: 300, label: '5M' }];

function ChangeCell({ pct }) {
  if (pct == null) return <span style={{ color:'var(--mu)' }}>—</span>;
  const color = pct > 0 ? 'var(--gr)' : pct < 0 ? 'var(--rd)' : 'var(--mu)';
  return <span style={{ color }}>{pct > 0 ? '+' : ''}{pct}%</span>;
}

export default function OIHistoryPanel({ selected, onClose }) {
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [secsAgo, setSecsAgo]   = useState(0);
  const [refreshSec, setRefreshSec] = useState(60);
  const timerRef = useRef(null);
  const tickRef  = useRef(null);

  const load = useCallback(() => {
    if (!selected) return;
    setLoading(true);
    fetch('/api/oi-strike-history?symbol=' + encodeURIComponent(selected.symbol) +
          '&strike=' + encodeURIComponent(selected.strike) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); setSecsAgo(0); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    setData(null); setError(null);
    load();
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(load, refreshSec * 1000);
    return () => window.clearInterval(timerRef.current);
  }, [selected, refreshSec, load]);

  useEffect(() => {
    clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setSecsAgo(s => s+1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [selected]);

  if (!selected) return null;
  const points = data?.points || [];

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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, flexWrap:'wrap', gap:6 }}>
        <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>
          History — <span style={{ color:'var(--bl)' }}>{selected.strike}</span> · <span style={{ color:'var(--gr)' }}>CE</span> + <span style={{ color:'var(--rd)' }}>PE</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:9, color:'var(--mu)', fontFamily:'monospace' }}>{loading ? 'refreshing...' : secsAgo+'s ago'}</span>
          <div style={{ display:'flex', gap:2, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)' }}>
            {REFRESH_OPTIONS.map(opt => (
              <button key={opt.key} onClick={()=>setRefreshSec(opt.key)}
                style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:4, border:'none', cursor:'pointer',
                  background: refreshSec===opt.key ? 'var(--cy)' : 'transparent', color: refreshSec===opt.key ? '#000' : 'var(--mu)' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ fontSize:9, color:'var(--mu)', background:'none', border:'none', cursor:'pointer' }}>✕ back</button>
        </div>
      </div>

      {loading && !data && <div style={{ fontSize:10, color:'var(--mu)' }}>Loading today's history...</div>}
      {error && <div style={{ fontSize:10, color:'var(--rd)' }}>{error}</div>}

      {data && points.length === 0 && (
        <div style={{ fontSize:10, color:'var(--mu)', padding:8, lineHeight:1.5 }}>
          No history captured yet today for this strike. Builds up as the dashboard stays open, plus a background capture every ~5 min.
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
