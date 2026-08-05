import React from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const pct = n => n != null ? (n > 0 ? '+' : '') + n.toFixed(1) + '%' : '—';

function Cell({ label, value, color = 'var(--tx)' }) {
  return (
    <div style={{ background: 'var(--s1)', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ fontSize: 9, color: 'var(--mu)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--fn)', fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function PnLRow({ label, pct: p, abs }) {
  const color = p != null && p >= 0 ? 'var(--gr)' : 'var(--rd)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'var(--s1)', borderRadius: 4, marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: 'var(--mu)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--fn)', fontSize: 11, fontWeight: 600, color }}>{pct(p)}  ₹{fmt(abs)}</span>
    </div>
  );
}

export default function OptionPanel({ scrip }) {
  const advice = scrip?.signal?.optionAdvice;

  if (!advice) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: 12, textAlign: 'center', padding: 20 }}>
      Option data loads after<br />the cron refreshes the cache
    </div>
  );

  const r    = advice.recommendation;
  const m    = r?.metrics;
  const alt  = advice.alternatives || [];
  const isSignalBased = advice.signalBased;
  const isCE = advice.optionType === 'CE';

  if (!r || !m) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ background: isSignalBased ? 'rgba(34,197,94,.06)' : 'rgba(245,158,11,.05)', border: `1px solid ${isSignalBased ? 'rgba(34,197,94,.25)' : 'rgba(245,158,11,.2)'}`, borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          {isSignalBased ? '✓ Signal confirmed' : '⚠ SMC direction only (no signal yet)'}
        </div>
        <div style={{ fontFamily: 'var(--fn)', fontSize: 24, fontWeight: 700, color: isCE ? 'var(--gr)' : 'var(--rd)', marginBottom: 2 }}>
          {r.strike.toLocaleString('en-IN')} {advice.optionType}
        </div>
        <div style={{ fontSize: 11, color: 'var(--mu)' }}>
          {advice.expiry} &nbsp;·&nbsp; {advice.daysToExpiry} days &nbsp;·&nbsp; Lot: {advice.lotSize} units
        </div>
        {!isSignalBased && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--am)', lineHeight: 1.4 }}>
            No confirmed signal. Consider smaller size until score hits 7/10.
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <Cell label="Buy at (ask)" value={'₹' + fmt(m.ask)} color="var(--bl)" />
        <Cell label="Break-even at expiry" value={'₹' + fmt(r.breakEven)} color="var(--am)" />
        <Cell label={'Delta  ' + (m.delta >= 0.40 && m.delta <= 0.65 ? '✓ ideal' : m.delta < 0.40 ? '⚠ OTM' : 'ITM')} value={String(m.delta)} color={m.absDelta >= 0.40 ? 'var(--gr)' : 'var(--am)'} />
        <Cell label="Theta (daily loss)" value={m.theta != null ? '-₹' + fmt(Math.abs(m.theta)) : '—'} color="var(--rd)" />
      </div>

      {/* P&L table */}
      <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Expected P&L (approximate)</div>
        <PnLRow label={`At T1  ₹${fmt(advice.signal?.t1)}`}  pct={m.pnlAtT1Pct} abs={m.pnlAtT1} />
        <PnLRow label={`At T2  ₹${fmt(advice.signal?.t2)}`}  pct={m.pnlAtT2Pct} abs={m.pnlAtT2} />
        <PnLRow label={`At SL  ₹${fmt(advice.signal?.sl)}`}  pct={m.pnlAtSLPct} abs={m.pnlAtSL} />
      </div>

      {/* IV status */}
      <div style={{ background: 'var(--s2)', borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--mu)' }}>IV status</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: (advice.ivStatus||'').includes('ELEVATED') ? 'var(--rd)' : 'var(--gr)' }}>{advice.ivStatus || '—'}</span>
      </div>

      {/* Alternatives table */}
      {alt.length > 0 && (
        <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Strike comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--fn)' }}>
            <thead>
              <tr style={{ color: 'var(--mu)', fontSize: 9 }}>
                <th style={{ textAlign: 'left', padding: '3px 4px' }}>Strike</th>
                <th style={{ textAlign: 'right', padding: '3px 4px' }}>Ask</th>
                <th style={{ textAlign: 'right', padding: '3px 4px' }}>Delta</th>
                <th style={{ textAlign: 'right', padding: '3px 4px' }}>T1 gain</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'rgba(59,130,246,.1)' }}>
                <td style={{ padding: '5px 4px', fontWeight: 700, color: 'var(--bl)' }}>{r.strike.toLocaleString('en-IN')} ★</td>
                <td style={{ textAlign: 'right', padding: '5px 4px' }}>₹{fmt(m.ask)}</td>
                <td style={{ textAlign: 'right', padding: '5px 4px', color: 'var(--cy)' }}>{m.delta}</td>
                <td style={{ textAlign: 'right', padding: '5px 4px', color: 'var(--gr)' }}>{pct(m.pnlAtT1Pct)}</td>
              </tr>
              {alt.map(a => (
                <tr key={a.strike} style={{ borderTop: '1px solid var(--bd)' }}>
                  <td style={{ padding: '5px 4px', color: 'var(--mu)' }}>{a.strike.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', padding: '5px 4px', color: 'var(--mu)' }}>₹{fmt(a.metrics.ask)}</td>
                  <td style={{ textAlign: 'right', padding: '5px 4px', color: 'var(--mu)' }}>{a.metrics.delta}</td>
                  <td style={{ textAlign: 'right', padding: '5px 4px', color: 'var(--mu)' }}>{pct(a.metrics.pnlAtT1Pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--mu)', lineHeight: 1.5, padding: '4px 2px' }}>
        P&L estimates use delta-gamma approximation. Actual results depend on IV changes and holding period.
      </div>
    </div>
  );
}
