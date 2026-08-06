import React from 'react';

/**
 * NewsPanel — shows what we actually have live right now (expiry, IV regime).
 *
 * IMPORTANT: A real news/earnings/corporate-announcement feed is NOT wired
 * up yet — that needs a separate news API (e.g. NSE corporate announcements
 * feed or a financial news API) and isn't part of the current data pipeline.
 * Rather than fabricate fake headlines, this panel shows the real data we
 * have (expiry proximity, IV regime) and is honest about what's missing.
 */
export default function NewsPanel({ scrip }) {
  const sig = scrip?.signal || {};
  const advice = sig.optionAdvice;
  const dte = advice?.daysToExpiry;
  const ivBad = (advice?.ivStatus || '').includes('ELEVATED');

  const items = [];

  if (dte != null) {
    items.push({
      color: dte <= 1 ? 'var(--rd)' : dte <= 3 ? 'var(--am)' : 'var(--gr)',
      title: dte === 0 ? 'Expiry today' : dte + ' day' + (dte===1?'':'s') + ' to expiry',
      sub: dte <= 1 ? 'Theta decay is severe — same-day scalps only' : dte <= 3 ? 'Weekly expiry approaching' : 'Normal time value remaining',
    });
  }

  if (advice?.ivStatus) {
    items.push({
      color: ivBad ? 'var(--rd)' : 'var(--gr)',
      title: 'IV — ' + advice.ivStatus,
      sub: ivBad ? 'Premium expensive, consider smaller size' : 'Premium within normal range',
    });
  }

  if (advice?.thetaWarning) {
    items.push({ color:'var(--am)', title:'Theta warning', sub: advice.thetaWarning });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0, overflow:'auto' }}>
      <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>Market Info</div>

      {items.length === 0 && (
        <div style={{ fontSize:10, color:'var(--mu)' }}>Loads after option chain refresh</div>
      )}

      {items.map((it, i) => (
        <div key={i} style={{ padding:'6px 8px', background:'var(--s2)', borderRadius:5, borderLeft:'2px solid '+it.color }}>
          <div style={{ fontSize:10, fontWeight:700, color:it.color }}>{it.title}</div>
          <div style={{ fontSize:9, color:'var(--mu)', marginTop:2, lineHeight:1.4 }}>{it.sub}</div>
        </div>
      ))}

      <div style={{ marginTop:'auto', fontSize:8, color:'var(--mu)', lineHeight:1.4, padding:'6px 4px', borderTop:'1px solid var(--bd)' }}>
        Live news / earnings feed not connected yet — needs a separate news API integration.
      </div>
    </div>
  );
}
