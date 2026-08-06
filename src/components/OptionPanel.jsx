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
  const sig = scrip?.signal || {};
  const advice = sig.optionAdvice;
  const trendUp = scrip?.trend === 'up';
  const fired = sig.fired;
  const conf  = sig.confidence || 0;

  // Dramatic headline — merged in from the old TrendPanel
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

  if (!advice) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>
      <div style={{ fontSize:20, fontWeight:800, color:headColor }}>{headline}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11, textAlign:'center' }}>
        Option data loads after cron refresh
      </div>
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
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>

      {/* Headline */}
      <div style={{ flexShrink:0 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:.5, color:headColor, lineHeight:1.1 }}>{headline}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--cy)', fontWeight:700 }}>
            {sig.scoreLabel} · {conf}%
          </span>
          <span style={{ fontSize:9, fontWeight:700, color: isSignalBased?'var(--gr)':'var(--am)' }}>
            {isSignalBased ? '✓ Signal confirmed' : '⚠ Direction only — size down'}
          </span>
        </div>
      </div>

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

      {/* Alternatives — compact row list */}
      {alt.length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
          <div style={{ fontSize:9, color:'var(--mu)', marginBottom:4, letterSpacing:.5, textTransform:'uppercase' }}>Alternative strikes</div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', background:'rgba(59,130,246,.1)', borderRadius:5, fontSize:10 }}>
              <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--bl)' }}>{r.strike.toLocaleString('en-IN')} ★</span>
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
