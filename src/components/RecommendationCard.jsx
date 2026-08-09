import React from 'react';

export default function RecommendationCard({ scrip, compact }) {
  const sig = scrip?.signal || {};
  const chk = scrip?.checklist || {};
  const ladders = sig.optionAdvice;
  const advice = ladders ? ladders[ladders.autoSide] : null;
  const m = advice?.recommendation?.metrics;

  const deltaOK = m ? (m.absDelta >= 0.40 && m.absDelta <= 0.65) : null;
  const rrOption = m && m.pnlAtT1 && m.pnlAtSL ? Math.round((Math.abs(m.pnlAtT1) / Math.abs(m.pnlAtSL)) * 10) / 10 : null;

  const passCount = chk.passed || 0;
  const totalCount = (chk.passed || 0) + (chk.failed || 0);
  const failCount = chk.failed || 0;

  let verdict, verdictColor, reasons = [];
  if (!sig.scoreLabel) {
    verdict = 'LOADING'; verdictColor = 'var(--mu)';
  } else if (sig.fired && chk.clearToTrade && deltaOK !== false && (rrOption == null || rrOption >= 1.2)) {
    verdict = 'ENTER'; verdictColor = 'var(--gr)';
    reasons.push(passCount + '/' + totalCount + ' checklist conditions met');
    if (deltaOK) reasons.push('Delta ' + m.delta + ' in ideal range');
    if (rrOption) reasons.push('Option R:R ' + rrOption + '×');
  } else if (failCount === 0 && sig.confidence >= 50) {
    verdict = 'WATCH'; verdictColor = 'var(--am)';
    reasons.push('Setup forming — ' + sig.scoreLabel + ' score');
    if (deltaOK === false) reasons.push('Delta not in ideal range yet');
  } else {
    verdict = 'WAIT'; verdictColor = 'var(--rd)';
    if (failCount > 0) reasons.push(failCount + ' checklist condition(s) failed');
    if (deltaOK === false) reasons.push('Delta outside 0.40–0.65 sweet spot');
    if (rrOption != null && rrOption < 1.2) reasons.push('Option R:R only ' + rrOption + '× — weak');
  }

  const cautions = [];
  if (advice?.daysToExpiry != null && advice.daysToExpiry <= 1) {
    cautions.push('Expiry ' + (advice.daysToExpiry === 0 ? 'today' : 'tomorrow'));
  }
  if ((advice?.ivStatus || '').includes('ELEVATED')) cautions.push('IV elevated');
  if (advice?.thetaWarning) cautions.push('High theta decay');

  // Compact horizontal mode — for the slim row above the OI matrix
  if (compact) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:14, height:'100%', minHeight:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:10, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Recommendation</span>
          <span style={{ fontSize:19, fontWeight:800, color:verdictColor, letterSpacing:.5 }}>{verdict}</span>
        </div>
        {reasons.length > 0 && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', flex:1, minWidth:0 }}>
            {reasons.map((r, i) => (
              <span key={i} style={{ fontSize:10, color:'var(--tx)', whiteSpace:'nowrap' }}>• {r}</span>
            ))}
          </div>
        )}
        {cautions.length > 0 && (
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            {cautions.map((c, i) => (
              <span key={i} style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.1)', borderRadius:4, padding:'2px 7px' }}>⚠ {c}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full vertical mode (kept for reuse elsewhere if needed)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ fontSize:10, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>Recommendation</div>
      <div style={{ fontSize:24, fontWeight:800, color:verdictColor, flexShrink:0, letterSpacing:.5 }}>{verdict}</div>
      {reasons.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
          {reasons.map((r, i) => <div key={i} style={{ fontSize:11, color:'var(--tx)', display:'flex', gap:6 }}><span style={{ color:verdictColor }}>•</span>{r}</div>)}
        </div>
      )}
      {cautions.length > 0 && (
        <div style={{ marginTop:2, display:'flex', flexDirection:'column', gap:3 }}>
          {cautions.map((c, i) => <div key={i} style={{ fontSize:10, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:4, padding:'3px 6px' }}>⚠ {c}</div>)}
        </div>
      )}
    </div>
  );
}
