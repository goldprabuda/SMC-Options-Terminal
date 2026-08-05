import React from 'react';

const DIM_LABELS = {
  ema: 'Price trend (EMA)', macd: 'Momentum (MACD)', rsi: 'Strength zone (RSI)',
  vwap: 'vs VWAP', volume: 'Volume spike', mtf: 'Timeframes agree'
};
const CHK_LABELS = {
  direction:'Direction', htfAlignment:'HTF clear', levels:'Value zone',
  volatility:'IV OK', theta:'DTE OK', liquidity:'Liquidity OK',
  momentum:'RSI+VWAP+Vol', risk:'Stop+Target set'
};

function ScoreBar({ score, max }) {
  const pct = max ? (score / max) * 100 : 0;
  const cls  = score === max ? '#22c55e' : score > 0 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height: 5, background: '#252936', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: 5, width: pct + '%', background: cls, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  );
}

export default function TrendPanel({ scrip }) {
  if (!scrip) return <div style={{ padding: 16, color: 'var(--mu)', fontSize: 12 }}>Select a scrip</div>;

  const sig = scrip.signal || {};
  const chk = scrip.checklist || {};
  const scores = sig.scores || {};

  const trendUp   = scrip.trend === 'up';
  const trendColor = trendUp ? 'var(--gr)' : scrip.trend === 'down' ? 'var(--rd)' : 'var(--mu)';
  const trendLabel = trendUp ? '↑ UPTREND' : scrip.trend === 'down' ? '↓ DOWNTREND' : '→ SIDEWAYS';

  const fired   = sig.fired;
  const scoreNum = sig.scoreLabel || '—/—';
  const conf     = sig.confidence || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', height: '100%' }}>

      {/* Trend + Score */}
      <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Trend & Signal</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: trendColor, marginBottom: 8 }}>{trendLabel}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--fn)', fontSize: 26, fontWeight: 700, color: fired ? 'var(--gr)' : conf >= 60 ? 'var(--am)' : 'var(--tx)' }}>{scoreNum}</span>
          <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fired ? '🟢 SIGNAL FIRED' : conf >= 60 ? '⚠ CLOSE — watching' : 'no signal'}</span>
        </div>
        {sig.reason && !fired && <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4, lineHeight: 1.4 }}>{sig.reason.slice(0, 100)}</div>}
        {fired && sig.retest?.type && sig.retest.type !== 'none' && (
          <div style={{ marginTop: 8, padding: '5px 8px', background: 'var(--bg-bl, rgba(59,130,246,.1))', borderRadius: 5, borderLeft: '2px solid var(--bl)', fontSize: 11, color: 'var(--bl)' }}>
            {sig.retest.type} retest @ ₹{sig.retest.level?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>

      {/* Score dimensions */}
      {Object.keys(scores).length > 0 && (
        <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Score breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(scores).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--mu)', width: 120, flexShrink: 0 }}>{DIM_LABELS[k] || k}</span>
                <ScoreBar score={v.score} max={v.max} />
                <span style={{ fontFamily: 'var(--fn)', fontSize: 10, width: 24, textAlign: 'right', color: v.score === v.max ? 'var(--gr)' : v.score > 0 ? 'var(--am)' : 'var(--rd)' }}>{v.score}/{v.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade plan if fired */}
      {fired && sig.entry && (
        <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Trade plan</div>
          {[
            { label: 'Entry', value: `₹${sig.entry.low?.toLocaleString('en-IN',{maximumFractionDigits:0})} – ${sig.entry.high?.toLocaleString('en-IN',{maximumFractionDigits:0})}`, color: 'var(--bl)' },
            { label: 'Stop', value: `₹${sig.sl?.toLocaleString('en-IN',{maximumFractionDigits:0})}`, color: 'var(--rd)' },
            { label: 'T1', value: `₹${sig.t1?.toLocaleString('en-IN',{maximumFractionDigits:0})}  R:R ${sig.rr}×`, color: 'var(--gr)' },
            { label: 'T2', value: `₹${sig.t2?.toLocaleString('en-IN',{maximumFractionDigits:0})}`, color: 'var(--cy)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--mu)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--fn)', fontSize: 12, fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Checklist pills */}
      {chk.items && (
        <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase' }}>Checklist</span>
            <span style={{ fontFamily: 'var(--fn)', fontSize: 11, color: chk.clearToTrade ? 'var(--gr)' : 'var(--rd)', fontWeight: 600 }}>
              {chk.passed}/{(chk.passed||0)+(chk.failed||0)} {chk.clearToTrade ? 'CLEAR' : 'NOT CLEAR'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(chk.items).map(([k, v]) => {
              const bg = v.status==='pass' ? 'rgba(34,197,94,.12)' : v.status==='fail' ? 'rgba(239,68,68,.12)' : v.status==='warn' ? 'rgba(245,158,11,.12)' : 'var(--s1)';
              const color = v.status==='pass' ? 'var(--gr)' : v.status==='fail' ? 'var(--rd)' : v.status==='warn' ? 'var(--am)' : 'var(--mu)';
              const icon = {pass:'✓',fail:'✗',warn:'!',unknown:'?'}[v.status]||'?';
              return (
                <span key={k} title={v.note || ''} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 12, background: bg, color, fontWeight: 500, cursor: 'default' }}>
                  {icon} {CHK_LABELS[k]||k}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
