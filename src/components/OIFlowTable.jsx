import React, { useState, useEffect, useCallback, useRef } from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN') : '—';
const fmtPrice = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const REFRESH_OPTIONS = [{ key: 60, label: '1M' }, { key: 300, label: '5M' }];

export default function OIFlowTable({ symbol }) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [secsAgo, setSecsAgo] = useState(0);
  const [refreshSec, setRefreshSec] = useState(60);
  const timerRef = useRef(null);
  const tickRef  = useRef(null);

  const load = useCallback(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/oi-flow?symbol=' + encodeURIComponent(symbol) + '&_t=' + Date.now(), { cache:'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setData(d); setError(null); setSecsAgo(0); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    setData(null); setError(null);
    load();
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(load, refreshSec * 1000);
    return () => window.clearInterval(timerRef.current);
  }, [symbol, refreshSec, load]);

  useEffect(() => {
    clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setSecsAgo(s => s+1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [symbol]);

  const cols = [
    { key:'timeIST',     label:'TIME' }, { key:'callsChngOI', label:'CALLS CHNG OI' },
    { key:'putsChngOI',  label:'PUTS CHNG OI' }, { key:'diffInOI',    label:'DIFF. IN OI' },
    { key:'coiPCR',      label:'COI PCR' }, { key:'signal',      label:'SIGNAL' },
    { key:'spotPrice',   label:'SPOT PRICE' }, { key:'pcr',         label:'PCR' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, flexShrink:0, flexWrap:'wrap', gap:6 }}>
        <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'5px 8px', lineHeight:1.4, flex:1, minWidth:200 }}>
          ⚠ SIGNAL is a simple OI-flow heuristic, not the SMC signal engine.
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
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
        </div>
      </div>

      {loading && !data && <div style={{ padding:16, color:'var(--mu)', fontSize:11 }}>Loading OI flow...</div>}
      {error && <div style={{ padding:16, color:'var(--rd)', fontSize:11 }}>{error}</div>}
      {data && !data.rows?.length && (
        <div style={{ padding:16, color:'var(--mu)', fontSize:11, lineHeight:1.5 }}>
          No flow data yet today. Builds up as snapshots accumulate.
        </div>
      )}

      {data?.rows?.length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10, fontFamily:'monospace' }}>
            <thead style={{ position:'sticky', top:0, zIndex:1 }}>
              <tr>
                {cols.map(c => (
                  <th key={c.key} style={{ background:'#2563eb', color:'#fff', padding:'7px 8px', textAlign:'left', fontSize:9, letterSpacing:.3, whiteSpace:'nowrap' }}>{c.label}</th>
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
      )}
    </div>
  );
}
