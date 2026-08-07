import React from 'react';

const fmt  = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';
const fmtL = n => n != null ? (n >= 1e7 ? (n/1e7).toFixed(2)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(2)+'L' : fmt(n)) : '—';

function ChangeLabel({ pct }) {
  if (pct == null) return <span style={{ color:'var(--mu)' }}>—</span>;
  const color = pct > 0 ? 'var(--gr)' : pct < 0 ? 'var(--rd)' : 'var(--mu)';
  return <span style={{ color }}>{pct > 0 ? '+' : ''}{pct}%</span>;
}

function StrikeRow({ row }) {
  const maxOI = Math.max(row.ceOI || 0, row.peOI || 0, 1);
  const cePct = Math.round(((row.ceOI||0)/maxOI)*100);
  const pePct = Math.round(((row.peOI||0)/maxOI)*100);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'70px 46px 50px 90px 50px 46px 70px', alignItems:'center', gap:6,
      padding: row.isATM ? '7px 6px' : '5px 6px', borderRadius:6,
      background: row.isATM ? 'rgba(59,130,246,.12)' : 'transparent',
      border: row.isATM ? '1px solid rgba(59,130,246,.35)' : '1px solid transparent' }}>
      <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--tx)', textAlign:'right' }}>{fmtL(row.ceOI)}</span>
      <span style={{ fontSize:9, textAlign:'right' }}><ChangeLabel pct={row.ceChangePct} /></span>
      <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--cy)', textAlign:'right' }}>{row.ceDelta ?? '—'}</span>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ width:28, height:8, background:'var(--s1)', borderRadius:2, overflow:'hidden', transform:'scaleX(-1)' }}>
          <div style={{ height:8, width:cePct+'%', background:'rgba(34,197,94,.6)' }} />
        </div>
        <span style={{ fontFamily:'monospace', fontSize:12, fontWeight: row.isATM?800:600, color: row.isATM?'var(--bl)':'var(--tx)' }}>
          {row.strike.toLocaleString('en-IN')}
        </span>
        <div style={{ width:28, height:8, background:'var(--s1)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:8, width:pePct+'%', background:'rgba(239,68,68,.6)' }} />
        </div>
      </div>
      <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--cy)' }}>{row.peDelta ?? '—'}</span>
      <span style={{ fontSize:9 }}><ChangeLabel pct={row.peChangePct} /></span>
      <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--tx)' }}>{fmtL(row.peOI)}</span>
    </div>
  );
}

function PCRSparkline({ history }) {
  if (!history || history.length < 2) return null;
  const vals = history.map(h => h.pcr).filter(v => v != null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 0.1;
  const w = 200, h = 36, pad = 4;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad*2);
    const y = h - pad - ((v - min) / range) * (h - pad*2);
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
      {vals.map((v,i) => {
        const x = pad + (i/(vals.length-1))*(w-pad*2);
        const y = h-pad-((v-min)/range)*(h-pad*2);
        return <circle key={i} cx={x} cy={y} r={i===vals.length-1?2.5:1.5} fill={i===vals.length-1?'#06b6d4':'#374151'} />;
      })}
    </svg>
  );
}

function SummaryCell({ label, value, color }) {
  return (
    <div style={{ background:'var(--s2)', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
      <div style={{ fontSize:8, color:'var(--mu)' }}>{label}</div>
      <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

// Now a CONTROLLED component — receives data/loading/error/refresh as props
// from the shared useOIData hook in App.jsx (no longer fetches on its own).
export default function OIMatrix({ symbol, data, error, loading, secsAgo, refreshSec, setRefreshSec, REFRESH_OPTIONS }) {
  if (!symbol) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: loading?'var(--cy)':'var(--gr)', ...(loading?{animation:'spin .8s linear infinite',border:'1px solid var(--cy)',background:'transparent'}:{}) }} />
          <span style={{ fontSize:10, color:'var(--mu)', fontFamily:'monospace' }}>{loading ? 'refreshing...' : 'live · '+secsAgo+'s ago'}</span>
        </div>
        <div style={{ display:'flex', gap:2, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)' }}>
          {REFRESH_OPTIONS.map(opt => (
            <button key={opt.key} onClick={()=>setRefreshSec(opt.key)}
              style={{ fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:4, border:'none', cursor:'pointer',
                background: refreshSec===opt.key ? 'var(--cy)' : 'transparent',
                color:      refreshSec===opt.key ? '#000' : 'var(--mu)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ fontSize:11, color:'var(--rd)', padding:8 }}>{error}</div>}

      {data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, flexShrink:0 }}>
            <SummaryCell label="PCR" value={data.pcr != null ? data.pcr.toFixed(2) + (data.pcrRising?' ↑':data.pcrRising===false?' ↓':'') : '—'} color="var(--cy)" />
            <SummaryCell label="Total CE OI" value={fmtL(data.totalCE)} color="var(--gr)" />
            <SummaryCell label="Total PE OI" value={fmtL(data.totalPE)} color="var(--rd)" />
            <SummaryCell label="DTE" value={data.daysToExpiry ?? '—'} color="var(--am)" />
          </div>

          {data.pcrHistory?.length > 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'var(--s2)', borderRadius:6, padding:'6px 10px' }}>
              <span style={{ fontSize:9, color:'var(--mu)', flexShrink:0 }}>PCR trend</span>
              <PCRSparkline history={data.pcrHistory} />
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flexShrink:0 }}>
            <div style={{ background:'rgba(239,68,68,.08)', borderRadius:6, padding:'6px 8px', borderLeft:'2px solid var(--rd)' }}>
              <div style={{ fontSize:8, color:'var(--mu)' }}>Max Call OI (resistance)</div>
              <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--rd)' }}>{fmt(data.maxCEStrike)}</div>
            </div>
            <div style={{ background:'rgba(34,197,94,.08)', borderRadius:6, padding:'6px 8px', borderLeft:'2px solid var(--gr)' }}>
              <div style={{ fontSize:8, color:'var(--mu)' }}>Max Put OI (support)</div>
              <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--gr)' }}>{fmt(data.maxPEStrike)}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'70px 46px 50px 90px 50px 46px 70px', gap:6, fontSize:8, color:'var(--mu)', padding:'0 6px', flexShrink:0 }}>
            <span style={{ textAlign:'right' }}>CE OI</span>
            <span style={{ textAlign:'right' }}>Δ%</span>
            <span style={{ textAlign:'right' }}>Delta</span>
            <span style={{ textAlign:'center' }}>STRIKE</span>
            <span>Delta</span>
            <span>Δ%</span>
            <span>PE OI</span>
          </div>

          <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:2 }}>
            {data.strikes?.map(row => <StrikeRow key={row.strike} row={row} />)}
          </div>

          <div style={{ fontSize:8, color:'var(--mu)', flexShrink:0, lineHeight:1.4 }}>{data._note}</div>
        </>
      )}

      {!data && !error && <div style={{ fontSize:11, color:'var(--mu)', padding:8 }}>Loading OI matrix...</div>}
    </div>
  );
}
