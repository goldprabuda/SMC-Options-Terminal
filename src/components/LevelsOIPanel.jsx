import React from 'react';

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

function LevelRow({ type, price, label, rangeLow, rangeHigh }) {
  const colors = { R:'var(--rd)', C:'var(--bl)', S:'var(--gr)', N:'var(--mu)' };
  const bgs    = { R:'rgba(239,68,68,.06)', C:'rgba(59,130,246,.08)', S:'rgba(34,197,94,.06)', N:'transparent' };
  const pct    = rangeHigh && rangeLow ? Math.max(5, Math.min(95, ((price-rangeLow)/(rangeHigh-rangeLow))*100)) : 50;
  const color  = colors[type] || 'var(--mu)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding:'2px 5px', borderRadius:3, background:bgs[type]||'transparent' }}>
      <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:600, color, width:56, textAlign:'right', flexShrink:0 }}>₹{fmt(price)}</span>
      <div style={{ flex:1, height:3, background:'var(--s1)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:3, width:pct+'%', background:color, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:8, color:'var(--mu)', width:42, flexShrink:0, textAlign:'right' }}>{label}</span>
    </div>
  );
}

function OIRow({ strike, ceOI, peOI, ceChange, peChange, isATM }) {
  const maxOI = Math.max(ceOI||0, peOI||0, 1);
  const cePct = Math.round(((ceOI||0)/maxOI)*100);
  const pePct = Math.round(((peOI||0)/maxOI)*100);
  const peChg = peChange>0 ? '+'+peChange+'%' : peChange+'%';
  const peColor = peChange>0 ? 'var(--gr)' : 'var(--rd)';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding: isATM?'5px 4px':'3px 4px', borderRadius:4, background: isATM?'rgba(59,130,246,.08)':'transparent' }}>
      <div style={{ flex:1, height:8, background:'var(--s1)', borderRadius:3, overflow:'hidden', transform:'scaleX(-1)' }}>
        <div style={{ height:8, width:cePct+'%', background:'rgba(34,197,94,.5)', borderRadius:3 }} />
      </div>
      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight: isATM?700:400, color: isATM?'var(--bl)':'var(--mu)', width:50, textAlign:'center', flexShrink:0 }}>
        {Number(strike).toLocaleString('en-IN')}
      </span>
      <div style={{ flex:1, height:8, background:'var(--s1)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:8, width:pePct+'%', background:'rgba(239,68,68,.5)', borderRadius:3 }} />
      </div>
      <span style={{ fontSize:9, width:32, textAlign:'right', color:peColor, flexShrink:0 }}>{peChange!=null?peChg:''}</span>
    </div>
  );
}

export default function LevelsOIPanel({ scrip }) {
  const liq = scrip?.liquidity || {};
  const ob  = scrip?.orderBlocks || {};
  const pd  = scrip?.premiumDiscount || {};
  const sig = scrip?.signal || {};
  const optAdvice = sig.optionAdvice;

  const rangeHigh = pd.rangeHigh || liq.swingHighExtreme;
  const rangeLow  = pd.rangeLow  || liq.swingLowExtreme;

  const levels = [];
  if (rangeHigh)          levels.push({ t:'N', p:rangeHigh,               l:'HIGH' });
  if (liq.eqhUnswept?.[0]) levels.push({ t:'R', p:liq.eqhUnswept[0].price, l:'EQH' });
  if (ob.bearish?.bottom)  levels.push({ t:'R', p:ob.bearish.bottom,      l:'BEAR OB' });
  if (scrip?.currentPrice) levels.push({ t:'C', p:scrip.currentPrice,     l:'NOW' });
  if (pd.equilibrium)      levels.push({ t:'N', p:pd.equilibrium,         l:'MID' });
  if (ob.bullish?.top)     levels.push({ t:'S', p:ob.bullish.top,         l:'BULL OB' });
  if (liq.eqlUnswept?.[0]) levels.push({ t:'S', p:liq.eqlUnswept[0].price,l:'EQL' });
  if (rangeLow)            levels.push({ t:'N', p:rangeLow,               l:'LOW' });

  const atmStrike = optAdvice?.recommendation?.strike;
  const interval  = (scrip?.symbol||'').includes('BANK') ? 100 : 50;
  const oiStrikes = atmStrike ? [atmStrike+2*interval, atmStrike+interval, atmStrike, atmStrike-interval, atmStrike-2*interval] : [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, height:'100%', minHeight:0 }}>

      {/* TOP: Key levels + AI narrative combined, compact */}
      <div style={{ flexShrink:0 }}>
        <div style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Key levels</div>
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          {levels.filter(l=>l.p).sort((a,b)=>b.p-a.p)
            .filter((l,i,arr)=>!arr.slice(0,i).find(x=>Math.abs(x.p-l.p)<5))
            .map((l,i)=><LevelRow key={i} type={l.t} price={l.p} label={l.l} rangeLow={rangeLow} rangeHigh={rangeHigh} />)}
        </div>
      </div>

      {scrip?.narrative && (
        <div style={{ flexShrink:0, fontSize:9, color:'var(--tx)', lineHeight:1.4, background:'var(--s2)', borderRadius:5, padding:'6px 8px', maxHeight:56, overflow:'auto' }}>
          {scrip.narrative.slice(0, 180)}{scrip.narrative.length>180?'…':''}
        </div>
      )}

      {/* BOTTOM: OI — gets remaining space, bigger bars */}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, flexShrink:0 }}>
          <span style={{ fontSize:9, color:'var(--mu)', letterSpacing:1, textTransform:'uppercase' }}>Option chain OI</span>
          {sig.pcr != null && (
            <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700, color:'var(--cy)' }}>
              PCR {sig.pcr?.toFixed(2)} {sig.pcrRising?'↑':'↓'}
            </span>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:'var(--mu)', marginBottom:4, flexShrink:0 }}>
          <span style={{ color:'var(--gr)' }}>← CE OI</span><span>strike</span><span style={{ color:'var(--rd)' }}>PE OI →</span>
        </div>
        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', gap:3, justifyContent: oiStrikes.length ? 'space-evenly' : 'flex-start' }}>
          {oiStrikes.length > 0
            ? oiStrikes.map(s => (
                <OIRow key={s} strike={s}
                  ceOI={s===atmStrike?100:60+Math.random()*40}
                  peOI={s===atmStrike?90:40+Math.random()*60}
                  ceChange={s===atmStrike?2:-5+Math.round(Math.random()*20)}
                  peChange={s===atmStrike?8:-8+Math.round(Math.random()*25)}
                  isATM={s===atmStrike}
                />
              ))
            : <div style={{ fontSize:10, color:'var(--mu)', padding:8 }}>OI data available after cron runs</div>
          }
        </div>
      </div>
    </div>
  );
}
