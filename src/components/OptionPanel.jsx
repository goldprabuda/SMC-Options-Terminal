import React from 'react';

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
  const advice = scrip?.signal?.optionAdvice;

  if (!advice) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11, textAlign:'center', padding:16 }}>
      Option data loads after cron refresh
    </div>
  );

  const r   = advice.recommendation;
  const m   = r?.metrics;
  const alt = advice.alternatives || [];
  const isSignalBased = advice.signalBased;
  const isCE = advice.optionType === 'CE';
  if (!r || !m) return null;

  const ivBad = (advice.ivStatus||'').includes('ELEVATED');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>

      {/* IV status — moved to top */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, padding:'4px 8px', background:'var(--s2)', borderRadius:5 }}>
        <span style={{ fontSize:9, color:'var(--mu)' }}>IV</span>
        <span style={{ fontSize:10, fontWeight:700, color: ivBad?'var(--rd)':'var(--gr)' }}>{advice.ivStatus || '—'}</span>
      </div>

      {/* Strike header */}
      <div style={{ flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div>
          <span style={{ fontSize:9, color: isSignalBased?'var(--gr)':'var(--am)', fontWeight:600 }}>
            {isSignalBased ? '✓ CONFIRMED' : '⚠ DIRECTION ONLY'}
          </span>
          <div style={{ fontFamily:'monospace', fontSize:19, fontWeight:700, color: isCE?'var(--gr)':'var(--rd)' }}>
            {r.strike.toLocaleString('en-IN')} {advice.optionType}
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:9, color:'var(--mu)' }}>
          {advice.expiry}<br/>{advice.daysToExpiry}d · Lot {advice.lotSize}
        </div>
      </div>

      {/* Metrics grid — compact 2x2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, flexShrink:0 }}>
        <Cell label="Buy (ask)"   value={'₹'+fmt(m.ask)} color="var(--bl)" />
        <Cell label="Break-even"  value={'₹'+fmt(r.breakEven)} color="var(--am)" />
        <Cell label="Delta"       value={String(m.delta)} color={m.absDelta>=0.40?'var(--gr)':'var(--am)'} />
        <Cell label="Theta/day"   value={m.theta!=null?'-₹'+fmt(Math.abs(m.theta)):'—'} color="var(--rd)" />
      </div>

      {/* Combined: direction-only warning + P&L table in ONE box */}
      <div style={{ background:'var(--s2)', borderRadius:6, padding:'7px 9px', flex:'0 0 auto' }}>
        {!isSignalBased && (
          <div style={{ fontSize:9, color:'var(--am)', lineHeight:1.4, marginBottom:6, paddingBottom:6, borderBottom:'1px solid var(--bd)' }}>
            No confirmed signal — SMC direction only. Size down.
          </div>
        )}
        <div style={{ fontSize:9, color:'var(--mu)', marginBottom:4, letterSpacing:.5, textTransform:'uppercase' }}>Expected P&amp;L</div>
        {[
          { l:'T1', p:m.pnlAtT1Pct, a:m.pnlAtT1 },
          { l:'T2', p:m.pnlAtT2Pct, a:m.pnlAtT2 },
          { l:'SL', p:m.pnlAtSLPct, a:m.pnlAtSL },
        ].map(row => {
          const c = row.p>=0 ? 'var(--gr)' : 'var(--rd)';
          return (
            <div key={row.l} style={{ display:'flex', justifyContent:'space-between', fontSize:10, padding:'2px 0' }}>
              <span style={{ color:'var(--mu)' }}>{row.l}</span>
              <span style={{ fontFamily:'monospace', fontWeight:600, color:c }}>{pct(row.p)} ₹{fmt(row.a)}</span>
            </div>
          );
        })}
      </div>

      {/* Strike comparison — compact side list, not full table */}
      {alt.length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
          <div style={{ fontSize:8, color:'var(--mu)', marginBottom:3, letterSpacing:.5, textTransform:'uppercase' }}>Alternatives</div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 6px', background:'rgba(59,130,246,.1)', borderRadius:4, fontSize:9 }}>
              <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--bl)' }}>{r.strike.toLocaleString('en-IN')} ★</span>
              <span style={{ color:'var(--tx)' }}>₹{fmt(m.ask)}</span>
              <span style={{ color:'var(--cy)' }}>Δ{m.delta}</span>
              <span style={{ color:'var(--gr)' }}>{pct(m.pnlAtT1Pct)}</span>
            </div>
            {alt.map(a => (
              <div key={a.strike} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 6px', fontSize:9, color:'var(--mu)' }}>
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
