import React, { useState, useEffect } from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const pct = n => n != null ? (n > 0 ? '+' : '') + n.toFixed(1) + '%' : '—';

function Cell({ label, value, color = 'var(--tx)' }) {
  return (
    <div style={{ background:'var(--s2)', borderRadius:5, padding:'6px 8px' }}>
      <div style={{ fontSize:8, color:'var(--mu)', marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

export default function OptionPanel({ scrip }) {
  const sig = scrip?.signal || {};
  const ladders = sig.optionAdvice;   // { bullish, bearish, autoSide }

  // 'auto' follows the system's own direction. 'bullish'/'bearish' = manual override.
  const [mode, setMode] = useState('auto');
  useEffect(() => { setMode('auto'); }, [scrip?.symbol]);  // reset toggle when switching scrips

  const trendUp = scrip?.trend === 'up';
  const fired = sig.fired;
  const conf  = sig.confidence || 0;

  let headline, headColor;
  if (fired) {
    headline  = (conf >= 85 ? 'STRONG ' : '') + (trendUp ? 'BUY CALL' : 'BUY PUT');
    headColor = trendUp ? 'var(--gr)' : 'var(--rd)';
  } else if (conf >= 60) {
    headline  = 'WATCHING — ' + (trendUp ? 'BULLISH' : 'BEARISH');
    headColor = 'var(--am)';
  } else {
    headline  = 'NO SETUP YET';
    headColor = 'var(--mu)';
  }

  if (!ladders) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>
      <div style={{ fontSize:20, fontWeight:800, color:headColor }}>{headline}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11, textAlign:'center' }}>
        Option data loads after cron refresh
      </div>
    </div>
  );

  const activeSide = mode === 'auto' ? ladders.autoSide : mode;
  const advice = ladders[activeSide];
  const isAutoMatch = activeSide === ladders.autoSide;

  if (!advice) return (
    <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>No {activeSide} option data available</div>
  );

  const r   = advice.recommendation;
  const m   = r?.metrics;
  const alt = advice.alternatives || [];
  const isCE = advice.optionType === 'CE';
  if (!r || !m) return null;

  const ivBad = (advice.ivStatus||'').includes('ELEVATED');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>

      {/* Headline + CE/PE toggle */}
      <div style={{ flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:19, fontWeight:800, letterSpacing:.5, color:headColor, lineHeight:1.1 }}>{headline}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--cy)', fontWeight:700 }}>
              {sig.scoreLabel} · {conf}%
            </span>
          </div>
        </div>

        {/* AUTO | CALL | PUT segmented toggle */}
        <div style={{ display:'flex', gap:1, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)', flexShrink:0 }}>
          {[
            { key:'auto',    label:'AUTO' },
            { key:'bullish', label:'CALL' },
            { key:'bearish', label:'PUT'  },
          ].map(opt => (
            <button key={opt.key} onClick={()=>setMode(opt.key)}
              style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:4, border:'none', cursor:'pointer',
                background: mode===opt.key ? (opt.key==='bullish'?'var(--gr)':opt.key==='bearish'?'var(--rd)':'var(--cy)') : 'transparent',
                color:      mode===opt.key ? '#000' : 'var(--mu)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual-view note when not showing the system's own direction */}
      {!isAutoMatch && (
        <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'4px 8px', flexShrink:0 }}>
          Manual view — system's own signal points {ladders.autoSide === 'bullish' ? 'up (CALL)' : 'down (PUT)'}. This is the opposite side for reference.
        </div>
      )}

      {/* Strike + IV */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
        <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color: isCE?'var(--gr)':'var(--rd)' }}>
          {r.strike.toLocaleString('en-IN')} {advice.optionType}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:'var(--mu)' }}>{advice.expiry} · {advice.daysToExpiry}d · Lot {advice.lotSize}</div>
          <div style={{ fontSize:10, fontWeight:700, color: ivBad?'var(--rd)':'var(--gr)', marginTop:2 }}>IV {advice.ivStatus}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:5, flexShrink:0 }}>
        <Cell label="Buy (ask)"  value={'₹'+fmt(m.ask)} color="var(--bl)" />
        <Cell label="Break-even" value={'₹'+fmt(r.breakEven)} color="var(--am)" />
        <Cell label="Delta"      value={String(m.delta)} color={m.absDelta>=0.40?'var(--gr)':'var(--am)'} />
        <Cell label="Theta/day"  value={m.theta!=null?'-₹'+fmt(Math.abs(m.theta)):'—'} color="var(--rd)" />
      </div>

      {/* P&L table */}
      <div style={{ background:'var(--s2)', borderRadius:6, padding:'8px 10px', flexShrink:0 }}>
        <div style={{ fontSize:9, color:'var(--mu)', marginBottom:5, letterSpacing:.5, textTransform:'uppercase' }}>Expected P&amp;L</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          {[
            { l:'T1', p:m.pnlAtT1Pct, a:m.pnlAtT1, d:m.daysToT1 },
            { l:'T2', p:m.pnlAtT2Pct, a:m.pnlAtT2, d:m.daysToT2 },
            { l:'SL', p:m.pnlAtSLPct, a:m.pnlAtSL, d:1 },
          ].map(row => {
            const c = row.p>=0 ? 'var(--gr)' : 'var(--rd)';
            return (
              <div key={row.l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--mu)' }}>{row.l} ({row.d}d)</div>
                <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:c }}>{pct(row.p)}</div>
                <div style={{ fontSize:9, color:'var(--mu)' }}>₹{fmt(row.a)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternatives */}
      {alt.length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
          <div style={{ fontSize:9, color:'var(--mu)', marginBottom:4, letterSpacing:.5, textTransform:'uppercase' }}>Alternative strikes</div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', background: isCE?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', borderRadius:5, fontSize:10 }}>
              <span style={{ fontFamily:'monospace', fontWeight:700, color: isCE?'var(--gr)':'var(--rd)' }}>{r.strike.toLocaleString('en-IN')} ★</span>
              <span style={{ color:'var(--tx)' }}>₹{fmt(m.ask)}</span>
              <span style={{ color:'var(--cy)' }}>Δ{m.delta}</span>
              <span style={{ color:'var(--gr)' }}>{pct(m.pnlAtT1Pct)}</span>
            </div>
            {alt.map(a => (
              <div key={a.strike} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', fontSize:10, color:'var(--mu)' }}>
                <span style={{ fontFamily:'monospace' }}>{a.strike.toLocaleString('en-IN')}</span>
                <span>₹{fmt(a.metrics.ask)}</span>
                <span>Δ{a.metrics.delta}</span>
                <span>{pct(a.metrics.pnlAtT1Pct)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
