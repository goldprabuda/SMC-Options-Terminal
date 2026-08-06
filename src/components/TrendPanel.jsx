import React from 'react';

const DIM_ORDER  = ['ema','macd','rsi','vwap','volume','mtf'];
const DIM_LABELS = { ema:'EMA', macd:'MACD', rsi:'RSI', vwap:'VWAP', volume:'VOL', mtf:'MTF' };
const CHK_LABELS = {
  direction:'Direction', htfAlignment:'HTF', levels:'Value zone', volatility:'IV',
  theta:'DTE', liquidity:'Liquidity', momentum:'Momentum', risk:'Risk'
};
const CHK_ICONS = { pass:'✓', fail:'✗', warn:'!', unknown:'?' };

function GridCell({ label, value, color, border }) {
  return (
    <div style={{ border:'1px solid '+(border||'var(--bd)'), borderRadius:6, padding:'6px 4px', textAlign:'center', flex:1, minWidth:0 }}>
      <div style={{ fontSize:8, color:'var(--mu)', marginBottom:2, letterSpacing:.5 }}>{label}</div>
      <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color: color||'var(--tx)' }}>{value}</div>
    </div>
  );
}

export default function TrendPanel({ scrip }) {
  if (!scrip) return <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>Select a scrip</div>;

  const sig = scrip.signal || {};
  const chk = scrip.checklist || {};
  const scores = sig.scores || {};

  const trendUp = scrip.trend === 'up';
  const fired   = sig.fired;
  const conf    = sig.confidence || 0;

  // Dramatic headline logic — mirrors "STRONG BUY CE" style
  let headline, headColor;
  if (fired) {
    headline  = (conf >= 85 ? 'STRONG ' : '') + (trendUp ? 'BUY CALL' : 'BUY PUT');
    headColor = trendUp ? 'var(--gr)' : 'var(--rd)';
  } else if (conf >= 60) {
    headline  = 'WATCHING ' + (trendUp ? 'UP' : 'DOWN');
    headColor = 'var(--am)';
  } else {
    headline  = 'NO SETUP';
    headColor = 'var(--mu)';
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>

      {/* Big dramatic headline */}
      <div style={{ flexShrink:0 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:.5, color:headColor, lineHeight:1.1 }}>
          {headline}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--cy)', fontWeight:700 }}>
            {sig.scoreLabel || '—/—'} · {conf}%
          </span>
          {sig.bodyRatio != null && (
            <span style={{ fontSize:9, color:'var(--mu)' }}>body {sig.bodyRatio}%</span>
          )}
        </div>
      </div>

      {/* Retest / reason line */}
      {fired && sig.retest?.type && sig.retest.type !== 'none' ? (
        <div style={{ fontSize:9, color:'var(--bl)', background:'rgba(59,130,246,.1)', borderRadius:5, padding:'4px 8px', flexShrink:0 }}>
          {sig.retest.type} retest @ ₹{sig.retest.level?.toLocaleString('en-IN',{maximumFractionDigits:0})}
        </div>
      ) : !fired && sig.reason ? (
        <div style={{ fontSize:9, color:'var(--mu)', lineHeight:1.4, flexShrink:0 }}>{sig.reason.slice(0,85)}</div>
      ) : null}

      {/* Grid cells — T1 / T2 / SL / R:R (only when fired) */}
      {fired && sig.entry ? (
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <GridCell label="ENTRY" value={'₹'+Math.round((sig.entry.low+sig.entry.high)/2).toLocaleString('en-IN')} color="var(--bl)" border="rgba(59,130,246,.4)" />
          <GridCell label="T1"    value={'+'+Math.round(sig.t1 - (sig.entry.low+sig.entry.high)/2)}  color="var(--gr)" border="rgba(34,197,94,.4)" />
          <GridCell label="T2"    value={'+'+Math.round(sig.t2 - (sig.entry.low+sig.entry.high)/2)}  color="var(--cy)" border="rgba(6,182,212,.4)" />
          <GridCell label="SL"    value={Math.round(sig.sl - (sig.entry.low+sig.entry.high)/2)}       color="var(--rd)" border="rgba(239,68,68,.4)" />
          <GridCell label="R:R"   value={sig.rr+'×'} color="var(--am)" border="rgba(245,158,11,.4)" />
        </div>
      ) : null}

      {/* Checklist — full-width rows, simple icon, no tracker chips */}
      {chk.items && (
        <div style={{ flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:8, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Checklist</span>
            <span style={{ fontFamily:'monospace', fontSize:9, fontWeight:700, color: chk.clearToTrade?'var(--gr)':'var(--rd)' }}>
              {chk.passed}/{(chk.passed||0)+(chk.failed||0)} {chk.clearToTrade?'CLEAR':'NOT CLEAR'}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 8px' }}>
            {Object.entries(chk.items).map(([k,v]) => {
              const color = v.status==='pass'?'var(--gr)':v.status==='fail'?'var(--rd)':v.status==='warn'?'var(--am)':'var(--mu)';
              const icon  = v.status==='pass'?'✓':v.status==='fail'?'✗':'–';
              return (
                <div key={k} title={v.note||''} style={{ display:'flex', alignItems:'center', gap:5, padding:'2px 0' }}>
                  <span style={{ color, fontWeight:700, fontSize:11, width:12, flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:9, color:'var(--tx)' }}>{CHK_LABELS[k]||k}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer pushes indicator strip to bottom */}
      <div style={{ flex:1, minHeight:4 }} />

      {/* Bottom indicator strip — colored bars + labels, matching reference style */}
      {Object.keys(scores).length > 0 && (
        <div style={{ flexShrink:0 }}>
          <div style={{ display:'flex', gap:2, marginBottom:4 }}>
            {DIM_ORDER.map(k => {
              const v = scores[k];
              if (!v) return <div key={k} style={{ flex:1, height:4, borderRadius:2, background:'var(--s2)' }} />;
              const color = v.score===v.max ? 'var(--gr)' : v.score>0 ? 'var(--am)' : 'var(--s2)';
              return <div key={k} style={{ flex:1, height:4, borderRadius:2, background:color }} />;
            })}
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {DIM_ORDER.map(k => {
              const v = scores[k];
              const color = v ? (v.score===v.max ? 'var(--gr)' : v.score>0 ? 'var(--am)' : 'var(--mu)') : 'var(--mu)';
              return (
                <span key={k} title={v?.note||''} style={{ flex:1, fontSize:8, fontWeight:700, textAlign:'center', color, letterSpacing:.3 }}>
                  {DIM_LABELS[k]}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
