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

  const [side, setSide] = useState('auto');       // auto | bullish | bearish
  const [tradeMode, setTradeMode] = useState('scalp');  // scalp | swing — defaults to scalp
  useEffect(() => { setSide('auto'); }, [scrip?.symbol]);

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

  const ladders      = sig.optionAdvice;
  const scalpLadders = sig.scalpAdvice;
  const source       = tradeMode === 'scalp' ? scalpLadders : ladders;

  const HeaderRow = () => (
    <div style={{ flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:19, fontWeight:800, letterSpacing:.5, color:headColor, lineHeight:1.1 }}>{headline}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--cy)', fontWeight:700 }}>
            {sig.scoreLabel} · {conf}%
          </span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
        {/* Trade mode toggle */}
        <div style={{ display:'flex', gap:1, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)' }}>
          {[{key:'scalp',label:'SCALP'},{key:'swing',label:'SWING'}].map(opt => (
            <button key={opt.key} onClick={()=>setTradeMode(opt.key)}
              style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:4, border:'none', cursor:'pointer',
                background: tradeMode===opt.key ? 'var(--cy)' : 'transparent',
                color:      tradeMode===opt.key ? '#000' : 'var(--mu)' }}>
              {opt.label}
            </button>
          ))}
        </div>
        {/* Direction toggle */}
        <div style={{ display:'flex', gap:1, background:'var(--s2)', borderRadius:6, padding:2, border:'1px solid var(--bd)' }}>
          {[{key:'auto',label:'AUTO'},{key:'bullish',label:'CALL'},{key:'bearish',label:'PUT'}].map(opt => (
            <button key={opt.key} onClick={()=>setSide(opt.key)}
              style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:4, border:'none', cursor:'pointer',
                background: side===opt.key ? (opt.key==='bullish'?'var(--gr)':opt.key==='bearish'?'var(--rd)':'var(--cy)') : 'transparent',
                color:      side===opt.key ? '#000' : 'var(--mu)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!source) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>
      <HeaderRow />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mu)', fontSize:11, textAlign:'center' }}>
        Fetching option chain — usually clears on next refresh (~1-2 min)
      </div>
    </div>
  );

  const activeSide = side === 'auto' ? source.autoSide : side;
  const advice = source[activeSide];
  const isAutoMatch = activeSide === source.autoSide;
  if (!advice) return <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>No {activeSide} data available</div>;

  const isCE = advice.optionType === 'CE';

  // ── SCALP MODE — exact point-based math, no approximation ──────────────────
  if (tradeMode === 'scalp') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>
        <HeaderRow />
        {!isAutoMatch && (
          <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'4px 8px', flexShrink:0 }}>
            Manual view — system points {source.autoSide === 'bullish' ? 'up (CALL)' : 'down (PUT)'}
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
          <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color: isCE?'var(--gr)':'var(--rd)' }}>
            {advice.strike.toLocaleString('en-IN')} {advice.optionType}
          </div>
          <div style={{ textAlign:'right', fontSize:9, color:'var(--mu)' }}>
            {advice.expiry} · {advice.daysToExpiry}d · Lot {advice.lotSize}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, flexShrink:0 }}>
          <Cell label="Entry (ask)" value={'₹'+fmt(advice.entry)} color="var(--bl)" />
          <Cell label="Delta" value={advice.delta ?? '—'} color="var(--cy)" />
          <Cell label="Spread" value={advice.spreadPct!=null ? advice.spreadPct+'%' : '—'} color={advice.spreadPct>2?'var(--rd)':'var(--gr)'} />
        </div>

        {advice.liquidityWarning && (
          <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'4px 8px', flexShrink:0 }}>
            ⚠ {advice.liquidityWarning}
          </div>
        )}

        <div style={{ background:'var(--s2)', borderRadius:6, padding:'10px', flexShrink:0 }}>
          <div style={{ fontSize:9, color:'var(--mu)', marginBottom:6, letterSpacing:.5, textTransform:'uppercase' }}>
            Scalp Targets — exact, not modeled
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--mu)' }}>T1 (+5pt)</div>
              <div style={{ fontFamily:'monospace', fontSize:15, fontWeight:800, color:'var(--gr)' }}>₹{fmt(advice.t1)}</div>
              <div style={{ fontSize:9, color:'var(--gr)' }}>{pct(advice.gainAtT1Pct)} · ₹{fmt(advice.gainAtT1Rs)}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--mu)' }}>T2 (+10pt)</div>
              <div style={{ fontFamily:'monospace', fontSize:15, fontWeight:800, color:'var(--cy)' }}>₹{fmt(advice.t2)}</div>
              <div style={{ fontSize:9, color:'var(--cy)' }}>{pct(advice.gainAtT2Pct)} · ₹{fmt(advice.gainAtT2Rs)}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--mu)' }}>SL (−5pt)</div>
              <div style={{ fontFamily:'monospace', fontSize:15, fontWeight:800, color:'var(--rd)' }}>₹{fmt(advice.sl)}</div>
              <div style={{ fontSize:9, color:'var(--rd)' }}>{pct(advice.lossAtSLPct)} · ₹{fmt(advice.lossAtSLRs)}</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize:9, color:'var(--mu)', lineHeight:1.5, flexShrink:0 }}>
          Entry, T1, T2, SL are the actual live bid/ask ± exact points — no delta-gamma-theta modeling. R:R is 1:1 at T1, 2:1 at T2 against the 5pt stop.
        </div>
      </div>
    );
  }

  // ── SWING MODE — existing ATR/structural ladder ─────────────────────────────
  const r = advice.recommendation;
  const m = r?.metrics;
  if (!r || !m) return null;
  const ivBad = (advice.ivStatus||'').includes('ELEVATED');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>
      <HeaderRow />
      {!isAutoMatch && (
        <div style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:5, padding:'4px 8px', flexShrink:0 }}>
          Manual view — system points {source.autoSide === 'bullish' ? 'up (CALL)' : 'down (PUT)'}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
        <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color: isCE?'var(--gr)':'var(--rd)' }}>
          {r.strike.toLocaleString('en-IN')} {advice.optionType}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:'var(--mu)' }}>{advice.expiry} · {advice.daysToExpiry}d · Lot {advice.lotSize}</div>
          <div style={{ fontSize:10, fontWeight:700, color: ivBad?'var(--rd)':'var(--gr)', marginTop:2 }}>IV {advice.ivStatus}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:5, flexShrink:0 }}>
        <Cell label="Buy (ask)"  value={'₹'+fmt(m.ask)} color="var(--bl)" />
        <Cell label="Break-even" value={'₹'+fmt(r.breakEven)} color="var(--am)" />
        <Cell label="Delta"      value={String(m.delta)} color={m.absDelta>=0.40?'var(--gr)':'var(--am)'} />
        <Cell label="Theta/day"  value={m.theta!=null?'-₹'+fmt(Math.abs(m.theta)):'—'} color="var(--rd)" />
      </div>

      <div style={{ background:'var(--s2)', borderRadius:6, padding:'8px 10px', flexShrink:0 }}>
        <div style={{ fontSize:9, color:'var(--mu)', marginBottom:5, letterSpacing:.5, textTransform:'uppercase' }}>Expected P&amp;L</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          {[
            { l:'T1', p:m.pnlAtT1Pct, a:m.pnlAtT1, d:m.daysToT1, beyond:m.t1BeyondExpiry, natural:m.t1NaturalDays },
            { l:'T2', p:m.pnlAtT2Pct, a:m.pnlAtT2, d:m.daysToT2, beyond:m.t2BeyondExpiry, natural:m.t2NaturalDays },
            { l:'SL', p:m.pnlAtSLPct, a:m.pnlAtSL, d:1, beyond:false },
          ].map(row => {
            const c = row.p>=0 ? 'var(--gr)' : 'var(--rd)';
            return (
              <div key={row.l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--mu)' }}>{row.l} ({row.d}d)</div>
                <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:c }}>{pct(row.p)}</div>
                <div style={{ fontSize:9, color:'var(--mu)' }}>₹{fmt(row.a)}</div>
                {row.beyond && (
                  <div title={'Needs ~'+row.natural+' days at current pace, but only '+row.d+' left before expiry'}
                    style={{ fontSize:8, color:'var(--am)', marginTop:2, cursor:'default' }}>
                    ⚠ beyond expiry pace
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize:9, color:'var(--mu)', marginTop:'auto', flexShrink:0 }}>
        See Alternatives panel for more strikes →
      </div>
    </div>
  );
}
