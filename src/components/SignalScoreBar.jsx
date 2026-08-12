import React from 'react';

const DIM_ORDER = ['ema','macd','rsi','vwap','volume','mtf'];
const DIM_LABELS = { ema:'EMA', macd:'MACD', rsi:'RSI', vwap:'VWAP', volume:'VOL', mtf:'MTF' };

export default function SignalScoreBar({ scrip }) {
  const sig = scrip?.signal || {};
  const scores = sig.scores || {};
  const trendUp = scrip?.trend === 'up';
  const trendColor = trendUp ? 'var(--gr)' : scrip?.trend==='down' ? 'var(--rd)' : 'var(--mu)';
  const trendLabel = trendUp ? '↑ Bullish' : scrip?.trend==='down' ? '↓ Bearish' : '→ Flat';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 10px', background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:6, flexWrap:'wrap', minHeight:0 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: sig.fired?'var(--gr)':'var(--bd)', flexShrink:0, ...(sig.fired?{animation:'blink 1.5s infinite'}:{}) }} />
      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--tx)' }}>{scrip?.symbol}</span>
      <span style={{ fontFamily:'monospace', fontSize:11, color: sig.fired?'var(--gr)':'var(--mu)' }}>Score {sig.scoreLabel || '—/—'} ({sig.confidence||0}%)</span>
      <span style={{ fontSize:11, color:trendColor, fontWeight:600 }}>{trendLabel}</span>
      <div style={{ display:'flex', gap:3, marginLeft:'auto', flexShrink:0 }}>
        {DIM_ORDER.map(k => {
          const v = scores[k];
          const color = !v ? 'var(--bd)' : v.score===v.max ? 'var(--gr)' : v.score>0 ? 'var(--am)' : 'var(--bd)';
          return <span key={k} title={DIM_LABELS[k]+': '+(v?v.score+'/'+v.max:'—')} style={{ width:7, height:7, borderRadius:2, background:color, cursor:'default' }} />;
        })}
      </div>
    </div>
  );
}
