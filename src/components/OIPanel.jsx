import React, { useState, useEffect, useCallback } from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

function OIBar({ row }) {
  const maxOI = Math.max(row.ceOI || 0, row.peOI || 0, 1);
  const cePct = Math.round(((row.ceOI||0)/maxOI)*100);
  const pePct = Math.round(((row.peOI||0)/maxOI)*100);
  const ceColor = row.ceChangePct > 0 ? 'var(--gr)' : row.ceChangePct < 0 ? 'var(--rd)' : 'var(--mu)';
  const peColor = row.peChangePct > 0 ? 'var(--gr)' : row.peChangePct < 0 ? 'var(--rd)' : 'var(--mu)';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding: row.isATM?'6px 5px':'4px 5px',
      borderRadius:5, background: row.isATM ? 'rgba(59,130,246,.1)' : 'var(--s2)', border: row.isATM ? '1px solid rgba(59,130,246,.3)' : '1px solid transparent' }}>
      <span style={{ fontSize:9, color:ceColor, width:34, textAlign:'right', flexShrink:0 }}>
        {row.ceChangePct != null ? (row.ceChangePct>0?'+':'')+row.ceChangePct+'%' : '—'}
      </span>
      <div style={{ flex:1, height:9, background:'var(--s1)', borderRadius:3, overflow:'hidden', transform:'scaleX(-1)' }}>
        <div style={{ height:9, width:cePct+'%', background:'rgba(34,197,94,.55)', borderRadius:3 }} />
      </div>
      <span style={{ fontFamily:'monospace', fontSize:12, fontWeight: row.isATM?700:500, color: row.isATM?'var(--bl)':'var(--tx)', width:52, textAlign:'center', flexShrink:0 }}>
        {row.strike.toLocaleString('en-IN')}
      </span>
      <div style={{ flex:1, height:9, background:'var(--s1)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:9, width:pePct+'%', background:'rgba(239,68,68,.55)', borderRadius:3 }} />
      </div>
      <span style={{ fontSize:9, color:peColor, width:34, flexShrink:0 }}>
        {row.peChangePct != null ? (row.peChangePct>0?'+':'')+row.peChangePct+'%' : '—'}
      </span>
    </div>
  );
}

export default function OIPanel({ symbol }) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [secsAgo, setSecsAgo] = useState(0);

  const load = useCallback(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/oi?symbol=' + encodeURIComponent(symbol) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); setSecsAgo(0); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => { load(); const id = window.setInterval(load, 60000); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { const id = window.setInterval(() => setSecsAgo(s => s+1), 1000); return () => window.clearInterval(id); }, [symbol]);

  if (!symbol) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Live Option Chain OI</span>
        <button onClick={load} style={{ fontSize:9, color: loading?'var(--mu)':'var(--cy)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          {loading ? '···' : '↻ ' + secsAgo + 's ago'}
        </button>
      </div>

      {error && <div style={{ fontSize:10, color:'var(--rd)', padding:6 }}>{error}</div>}

      {data && (
        <>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <div style={{ flex:1, background:'var(--s2)', borderRadius:5, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--mu)' }}>PCR</div>
              <div style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'var(--cy)' }}>
                {data.pcr != null ? data.pcr.toFixed(2) : '—'} {data.pcrRising ? '↑' : data.pcrRising===false ? '↓' : ''}
              </div>
            </div>
            <div style={{ flex:1, background:'var(--s2)', borderRadius:5, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--mu)' }}>ATM Δ (CE)</div>
              <div style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'var(--gr)' }}>
                {data.strikes?.find(s=>s.isATM)?.ceDelta ?? '—'}
              </div>
            </div>
            <div style={{ flex:1, background:'var(--s2)', borderRadius:5, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--mu)' }}>DTE</div>
              <div style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'var(--am)' }}>{data.daysToExpiry ?? '—'}</div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:'var(--mu)', flexShrink:0 }}>
            <span style={{ color:'var(--gr)' }}>← CE OI Δ%</span><span>strike</span><span style={{ color:'var(--rd)' }}>PE OI Δ% →</span>
          </div>

          <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {data.strikes?.map(row => <OIBar key={row.strike} row={row} />)}
          </div>

          <div style={{ fontSize:8, color:'var(--mu)', flexShrink:0, lineHeight:1.3 }}>
            Live snapshot · change vs previous session close (not 5-min intraday)
          </div>
        </>
      )}

      {!data && !error && <div style={{ fontSize:10, color:'var(--mu)', padding:8 }}>Loading OI...</div>}
    </div>
  );
}
