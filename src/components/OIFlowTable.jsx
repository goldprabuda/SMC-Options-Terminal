import React, { useState, useEffect } from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN') : '—';
const fmtPrice = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';

export default function OIFlowTable({ symbol }) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setData(null);
    fetch('/api/oi-flow?symbol=' + encodeURIComponent(symbol) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading && !data) return <div style={{ padding:16, color:'var(--mu)', fontSize:11 }}>Loading OI flow...</div>;
  if (error) return <div style={{ padding:16, color:'var(--rd)', fontSize:11 }}>{error}</div>;
  if (!data || !data.rows?.length) return (
    <div style={{ padding:16, color:'var(--mu)', fontSize:11, lineHeight:1.5 }}>
      No flow data yet today. This builds up as snapshots accumulate — check back after a few refreshes,
      or once the background 5-min capture has run a few times.
    </div>
  );

  const cols = [
    { key:'timeIST',     label:'TIME' },
    { key:'callsChngOI', label:'CALLS CHNG OI' },
    { key:'putsChngOI',  label:'PUTS CHNG OI' },
    { key:'diffInOI',    label:'DIFF. IN OI' },
    { key:'coiPCR',      label:'COI PCR' },
    { key:'signal',      label:'SIGNAL' },
    { key:'spotPrice',   label:'SPOT PRICE' },
    { key:'pcr',         label:'PCR' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'5px 8px', marginBottom:6, flexShrink:0, lineHeight:1.4 }}>
        ⚠ SIGNAL here is a simple OI-flow heuristic (which side is building OI faster since open) —
        not the SMC signal engine. Treat as market-flow context, not a standalone trade call.
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10, fontFamily:'monospace' }}>
          <thead style={{ position:'sticky', top:0, zIndex:1 }}>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={{ background:'#2563eb', color:'#fff', padding:'7px 8px', textAlign:'left', fontSize:9, letterSpacing:.3, whiteSpace:'nowrap' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)' }}>
                <td style={{ padding:'6px 8px', color:'var(--tx)' }}>{row.timeIST}</td>
                <td style={{ padding:'6px 8px', color:'var(--tx)' }}>{fmt(row.callsChngOI)}</td>
                <td style={{ padding:'6px 8px', color:'var(--tx)' }}>{fmt(row.putsChngOI)}</td>
                <td style={{ padding:'6px 8px', color: row.diffInOI < 0 ? 'var(--rd)' : row.diffInOI > 0 ? 'var(--gr)' : 'var(--mu)', fontWeight:700 }}>
                  {row.diffInOI != null ? (row.diffInOI > 0 ? '+' : '') + fmt(row.diffInOI) : '—'}
                </td>
                <td style={{ padding:'6px 8px', color:'var(--cy)' }}>{row.coiPCR ?? '—'}</td>
                <td style={{ padding:'6px 8px', fontWeight:800, color: row.signal==='SELL'?'var(--rd)':row.signal==='BUY'?'var(--gr)':'var(--mu)' }}>{row.signal}</td>
                <td style={{ padding:'6px 8px', color:'var(--tx)' }}>{fmtPrice(row.spotPrice)}</td>
                <td style={{ padding:'6px 8px', color:'var(--tx)' }}>{row.pcr ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
