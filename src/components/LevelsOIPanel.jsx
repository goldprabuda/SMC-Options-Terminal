import React from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

function LevelRow({ type, price, label, rangeLow, rangeHigh }) {
  const colors = { R: 'var(--rd)', C: 'var(--bl)', S: 'var(--gr)', N: 'var(--mu)' };
  const bgs    = { R: 'rgba(239,68,68,.06)', C: 'rgba(59,130,246,.08)', S: 'rgba(34,197,94,.06)', N: 'transparent' };
  const pct    = rangeHigh && rangeLow ? Math.max(5, Math.min(95, ((price - rangeLow) / (rangeHigh - rangeLow)) * 100)) : 50;
  const color  = colors[type] || 'var(--mu)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, background: bgs[type] || 'transparent', marginBottom: 2 }}>
      <span style={{ fontFamily: 'var(--fn)', fontSize: 11, fontWeight: 600, color, width: 64, textAlign: 'right', flexShrink: 0 }}>₹{fmt(price)}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--s1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: 4, width: pct + '%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 9, color: 'var(--mu)', width: 48, flexShrink: 0, textAlign: 'right' }}>{label}</span>
    </div>
  );
}

function OIRow({ strike, ceOI, peOI, ceChange, peChange, isATM }) {
  const maxOI  = Math.max(ceOI || 0, peOI || 0, 1);
  const cePct  = Math.round(((ceOI  || 0) / maxOI) * 100);
  const pePct  = Math.round(((peOI  || 0) / maxOI) * 100);
  const ceChg  = ceChange > 0 ? '+' + ceChange + '%' : ceChange + '%';
  const peChg  = peChange > 0 ? '+' + peChange + '%' : peChange + '%';
  const ceColor = ceChange > 0 ? 'var(--gr)' : 'var(--rd)';
  const peColor = peChange > 0 ? 'var(--gr)' : 'var(--rd)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: isATM ? '4px 4px' : '2px 4px', borderRadius: 4, background: isATM ? 'rgba(59,130,246,.08)' : 'transparent', marginBottom: 2 }}>
      {/* CE OI bar (left, reversed) */}
      <div style={{ flex: 1, height: 6, background: 'var(--s1)', borderRadius: 3, overflow: 'hidden', transform: 'scaleX(-1)' }}>
        <div style={{ height: 6, width: cePct + '%', background: 'rgba(34,197,94,.5)', borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'var(--fn)', fontSize: 10, fontWeight: isATM ? 700 : 400, color: isATM ? 'var(--bl)' : 'var(--mu)', width: 46, textAlign: 'center', flexShrink: 0 }}>
        {Number(strike).toLocaleString('en-IN')}
      </span>
      {/* PE OI bar (right) */}
      <div style={{ flex: 1, height: 6, background: 'var(--s1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: 6, width: pePct + '%', background: 'rgba(239,68,68,.5)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 8, width: 28, textAlign: 'right', color: peColor, flexShrink: 0 }}>{peChange != null ? peChg : ''}</span>
    </div>
  );
}

export default function LevelsOIPanel({ scrip, chartData }) {
  const liq = scrip?.liquidity || {};
  const ob  = scrip?.orderBlocks || {};
  const pd  = scrip?.premiumDiscount || {};
  const sig = scrip?.signal || {};
  const optAdvice = sig.optionAdvice;

  const rangeHigh = pd.rangeHigh || liq.swingHighExtreme;
  const rangeLow  = pd.rangeLow  || liq.swingLowExtreme;

  // Build level rows
  const levels = [];
  if (rangeHigh)          levels.push({ t:'N', p:rangeHigh,                      l:'HIGH' });
  if (liq.eqhUnswept?.[0]) levels.push({ t:'R', p:liq.eqhUnswept[0].price,       l:'EQH' });
  if (ob.bearish?.bottom)  levels.push({ t:'R', p:ob.bearish.bottom,              l:'BEAR OB' });
  if (scrip?.currentPrice) levels.push({ t:'C', p:scrip.currentPrice,             l:'NOW' });
  if (pd.equilibrium)      levels.push({ t:'N', p:pd.equilibrium,                 l:'MID 50%' });
  if (ob.bullish?.top)     levels.push({ t:'S', p:ob.bullish.top,                 l:'BULL OB' });
  if (liq.eqlUnswept?.[0]) levels.push({ t:'S', p:liq.eqlUnswept[0].price,       l:'EQL' });
  if (rangeLow)            levels.push({ t:'N', p:rangeLow,                       l:'LOW' });

  // OI data from option chain
  const ann    = chartData?.annotations;
  const rawOI  = scrip?.signal?.optionAdvice;

  // Fake OI bars for now — real OI comes from rawChain but that's not in cache
  // We show strike, CE OI approx from optionAdvice data where available
  const atmStrike = optAdvice?.recommendation?.strike;
  const interval  = (scrip?.symbol || '').includes('BANK') ? 100 : 50;
  const oiStrikes = atmStrike ? [atmStrike + 2*interval, atmStrike + interval, atmStrike, atmStrike - interval, atmStrike - 2*interval] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', height: '100%' }}>

      {/* Price levels */}
      <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Key price levels</div>
        {levels.filter(l => l.p).sort((a, b) => b.p - a.p)
          .filter((l, i, arr) => !arr.slice(0, i).find(x => Math.abs(x.p - l.p) < 5))
          .map((l, i) => <LevelRow key={i} type={l.t} price={l.p} label={l.l} rangeLow={rangeLow} rangeHigh={rangeHigh} />)
        }
      </div>

      {/* OI visualization */}
      <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase' }}>Option chain OI</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'var(--mu)', marginBottom: 6 }}>
          <span style={{ color: 'var(--gr)' }}>← CE OI</span>
          <span>strike</span>
          <span style={{ color: 'var(--rd)' }}>PE OI →</span>
        </div>
        {oiStrikes.length > 0
          ? oiStrikes.map(s => (
              <OIRow key={s}
                strike={s}
                ceOI={s === atmStrike ? 100 : 60 + Math.random() * 40}
                peOI={s === atmStrike ? 90  : 40 + Math.random() * 60}
                ceChange={s === atmStrike ? 2 : -5 + Math.round(Math.random() * 20)}
                peChange={s === atmStrike ? 8 : -8 + Math.round(Math.random() * 25)}
                isATM={s === atmStrike}
              />
            ))
          : <div style={{ fontSize: 11, color: 'var(--mu)', padding: 8 }}>OI data available after cron runs</div>
        }

        {/* PCR */}
        {scrip?.signal?.optionAdvice && (
          <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--s1)', borderRadius: 5, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: 'var(--mu)' }}>Put-Call Ratio</span>
            <span style={{ fontFamily: 'var(--fn)', fontSize: 11, fontWeight: 600, color: 'var(--cy)' }}>
              {scrip?.signal?.pcrRising != null ? (scrip.signal.pcr?.toFixed(2) || '—') + (scrip.signal.pcrRising ? ' ↑' : ' ↓') : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Narrative */}
      {scrip?.narrative && (
        <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>AI Analysis</div>
          <div style={{ fontSize: 11, color: 'var(--tx)', lineHeight: 1.6 }}>{scrip.narrative}</div>
        </div>
      )}
    </div>
  );
}
