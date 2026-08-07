import React from 'react';

const DIM_ORDER  = ['ema','macd','rsi','vwap','volume','mtf'];
const DIM_LABELS = { ema:'Price Trend', macd:'Momentum', rsi:'Strength', vwap:'Vs VWAP', volume:'Volume', mtf:'Timeframes' };

function Bar({ score, max }) {
  const p = max ? (score/max)*100 : 0;
  const color = score===max ? '#22c55e' : score>0 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height:6, background:'var(--s1)', borderRadius:3, overflow:'hidden', flex:1 }}>
      <div style={{ height:6, width:p+'%', background:color, borderRadius:3 }} />
    </div>
  );
}

function Row({ icon, iconColor, label, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
      <span style={{ color:iconColor, fontWeight:700, fontSize:12, width:14, flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:10, color:'var(--tx)', flex:1 }}>{label}</span>
      {sub && <span style={{ fontSize:9, color:'var(--mu)', fontFamily:'monospace' }}>{sub}</span>}
    </div>
  );
}

function GroupHeader({ children }) {
  return <div style={{ fontSize:8, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', marginTop:6, marginBottom:2 }}>{children}</div>;
}

const gateIcon = (status) => status==='pass' ? { icon:'✓', color:'var(--gr)' } : status==='fail' ? { icon:'✗', color:'var(--rd)' } : status==='warn' ? { icon:'!', color:'var(--am)' } : { icon:'–', color:'var(--mu)' };

export default function ChecklistPanel({ scrip }) {
  if (!scrip) return <div style={{ padding:12, color:'var(--mu)', fontSize:11 }}>Select a scrip</div>;

  const sig = scrip.signal || {};
  const chk = scrip.checklist || {};
  const scores = sig.scores || {};
  const items = chk.items || {};

  // Two NEW options-specific checks, computed here from optionAdvice data
  const ladders = sig.optionAdvice;
  const advice = ladders ? ladders[ladders.autoSide] : null;
  const m = advice?.recommendation?.metrics;

  const deltaStatus = !m ? 'unknown' : (m.absDelta >= 0.40 && m.absDelta <= 0.65) ? 'pass' : (m.absDelta >= 0.30 && m.absDelta <= 0.80) ? 'warn' : 'fail';
  const deltaSub = m ? String(m.delta) : null;

  const rrOption = m && m.pnlAtT1 && m.pnlAtSL ? Math.abs(m.pnlAtT1) / Math.abs(m.pnlAtSL) : null;
  const rrStatus = rrOption == null ? 'unknown' : rrOption >= 1.5 ? 'pass' : rrOption >= 0.8 ? 'warn' : 'fail';
  const rrSub = rrOption != null ? rrOption.toFixed(1) + '×' : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>

      {/* Overall score badge */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s2)', borderRadius:6, padding:'7px 10px' }}>
        <span style={{ fontSize:9, color:'var(--mu)' }}>Signal score</span>
        <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color: sig.fired?'var(--gr)':sig.confidence>=60?'var(--am)':'var(--tx)' }}>
          {sig.scoreLabel || '—/—'}
        </span>
      </div>

      {/* Score dimension bars */}
      {Object.keys(scores).length > 0 && (
        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:4 }}>
          {DIM_ORDER.map(k => {
            const v = scores[k];
            if (!v) return null;
            return (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:9, color:'var(--mu)', width:60, flexShrink:0 }}>{DIM_LABELS[k]}</span>
                <Bar score={v.score} max={v.max} />
                <span style={{ fontFamily:'monospace', fontSize:9, width:20, textAlign:'right', color: v.score===v.max?'var(--gr)':v.score>0?'var(--am)':'var(--rd)' }}>{v.score}/{v.max}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ flex:1, minHeight:0, overflow:'auto' }}>

        <GroupHeader>Signal Setup</GroupHeader>
        {['direction','htfAlignment','levels'].map(k => {
          const v = items[k]; if (!v) return null;
          const { icon, color } = gateIcon(v.status);
          return <Row key={k} icon={icon} iconColor={color} label={{direction:'Direction confirmed',htfAlignment:'Higher timeframes clear',levels:'Entry from value zone'}[k]} />;
        })}

        <GroupHeader>Option Health</GroupHeader>
        {['volatility','theta','liquidity'].map(k => {
          const v = items[k]; if (!v) return null;
          const { icon, color } = gateIcon(v.status);
          return <Row key={k} icon={icon} iconColor={color} label={{volatility:'IV not extreme',theta:'Enough time to expiry',liquidity:'Spread & OI liquid'}[k]} />;
        })}
        {(() => { const { icon, color } = gateIcon(deltaStatus); return <Row icon={icon} iconColor={color} label="Delta in sweet spot (0.40–0.65)" sub={deltaSub} />; })()}

        <GroupHeader>Trade Safety</GroupHeader>
        {['momentum','risk'].map(k => {
          const v = items[k]; if (!v) return null;
          const { icon, color } = gateIcon(v.status);
          return <Row key={k} icon={icon} iconColor={color} label={{momentum:'Momentum confirms',risk:'Position size set'}[k]} />;
        })}
        {(() => { const { icon, color } = gateIcon(rrStatus); return <Row icon={icon} iconColor={color} label="Reward:Risk (option premium)" sub={rrSub} />; })()}

        <div style={{ marginTop:8, fontSize:10, fontWeight:700, color: chk.clearToTrade?'var(--gr)':'var(--rd)', padding:'5px 8px', background: chk.clearToTrade?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', borderRadius:5, textAlign:'center' }}>
          {chk.passed}/{(chk.passed||0)+(chk.failed||0)} · {chk.clearToTrade ? 'CLEAR TO TRADE' : 'NOT CLEAR YET'}
        </div>
      </div>
    </div>
  );
}
