import React from 'react';

export default function RecommendationCard({ scrip }) {
  const sig = scrip?.signal || {};
  const chk = scrip?.checklist || {};
  const ladders = sig.optionAdvice;
  const advice = ladders ? ladders[ladders.autoSide] : null;
  const m = advice?.recommendation?.metrics;

  // Delta fit check
  const deltaOK = m ? (m.absDelta >= 0.40 && m.absDelta <= 0.65) : null;

  // Option-based reward:risk (actual premium P&L, not underlying points)
  const rrOption = m && m.pnlAtT1 && m.pnlAtSL
    ? Math.round((Math.abs(m.pnlAtT1) / Math.abs(m.pnlAtSL)) * 10) / 10
    : null;

  const passCount = chk.passed || 0;
  const totalCount = (chk.passed || 0) + (chk.failed || 0);
  const failCount = chk.failed || 0;

  // Verdict logic
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

  // Caution notes folded in from what was the News panel
  const cautions = [];
  if (advice?.daysToExpiry != null && advice.daysToExpiry <= 1) {
    cautions.push('Expiry ' + (advice.daysToExpiry === 0 ? 'today' : 'tomorrow') + ' — severe theta decay');
  }
  if ((advice?.ivStatus || '').includes('ELEVATED')) {
    cautions.push('IV elevated — premium expensive');
  }
  if (advice?.thetaWarning) {
    cautions.push(advice.thetaWarning);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>
      <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', flexShrink:0 }}>Recommendation</div>

      <div style={{ fontSize:22, fontWeight:800, color:verdictColor, flexShrink:0, letterSpacing:.5 }}>{verdict}</div>

      {reasons.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ fontSize:10, color:'var(--tx)', display:'flex', gap:6 }}>
              <span style={{ color:verdictColor }}>•</span>{r}
            </div>
          ))}
        </div>
      )}

      {cautions.length > 0 && (
        <div style={{ marginTop:2, display:'flex', flexDirection:'column', gap:3 }}>
          {cautions.map((c, i) => (
            <div key={i} style={{ fontSize:9, color:'var(--am)', background:'rgba(245,158,11,.08)', borderRadius:4, padding:'3px 6px' }}>
              ⚠ {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
