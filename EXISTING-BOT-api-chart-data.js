/**
 * api/chart-data.js  — ADD TO EXISTING SMC BOT (MCPNIFTY_claude)
 * GET /api/chart-data?symbol=NIFTY&key=SECRET
 *
 * Returns OHLC candles + SMC annotations for the Options Terminal chart.
 * Also adds CORS headers so the new React project can call this cross-origin.
 */
const { getActiveWatchlist } = require('../src/supabase');
const { getDailyHistorical }  = require('../src/dhan');
const { analyzeSMC, findSwings, findPremiumDiscount } = require('../src/smc');
const { readCache }           = require('../src/cache');

function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Generate daily timestamps for candles that have no timestamp field
function makeTimes(count) {
  const times = [];
  const msPerDay = 864e5;
  let t = new Date(); t.setHours(0,0,0,0);
  for (let i = count - 1; i >= 0; i--) {
    let d = new Date(t - i * msPerDay);
    // Skip weekends (Sat=6, Sun=0) — rough approximation
    while (d.getDay() === 0 || d.getDay() === 6) {
      i--;
      d = new Date(t - i * msPerDay);
    }
    times.push(Math.floor(d.getTime() / 1000));
  }
  return times;
}

module.exports = async (req, res) => {
  // CORS — allow the Options Terminal to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = process.env.DASHBOARD_SECRET;
  if (secret && req.query.key !== secret) return res.status(401).json({ error: 'Unauthorized' });

  const symbol = (req.query.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'symbol param required' });

  try {
    const watchlist = await getActiveWatchlist();
    const scrip = watchlist.find(s => s.symbol === symbol);
    if (!scrip) return res.status(404).json({ error: symbol + ' not in watchlist' });

    // Fetch 90 days of daily candles
    const candles = await getDailyHistorical({
      securityId:      scrip.security_id,
      exchangeSegment: scrip.exchange_segment,
      instrument:      scrip.instrument,
      fromDate:        daysAgoISO(90),
      toDate:          new Date().toISOString().slice(0, 10),
    });

    if (!candles || !candles.length) return res.status(500).json({ error: 'No candle data' });

    // Build chart candle array — use timestamp from Dhan if available, else generate
    const times = makeTimes(candles.length);
    const chartCandles = candles.map((c, i) => ({
      time:   c.timestamp ? Math.floor(c.timestamp / 1000) : times[i],
      open:   c.open,  high:   c.high,
      low:    c.low,   close:  c.close,
      volume: c.volume || 0,
    }));

    // SMC annotations
    const structure = analyzeSMC(candles, { eqTolerancePct: Number(scrip.eq_tolerance_pct) || 0.15 });
    const swings    = findSwings(candles, 2, 2);
    const pd        = findPremiumDiscount(swings, structure.currentPrice);

    // Also pull cached signal + option advice
    const cacheRows = await readCache();
    const cached    = cacheRows.find(r => r.symbol === symbol);
    const sig       = cached?.primary_signal || {};

    res.status(200).json({
      symbol,
      candles:     chartCandles,
      currentPrice: structure.currentPrice,
      trend:        structure.trend,
      annotations: {
        orderBlocks:     structure.orderBlocks,
        eqhUnswept:      (structure.liquidity?.eqhUnswept || []).slice(0, 3),
        eqlUnswept:      (structure.liquidity?.eqlUnswept || []).slice(0, 3),
        premiumDiscount: pd,
        recentBOS:       (structure.recentEvents || []).filter(e => e.type === 'BOS').slice(-2),
        signal: sig.fired ? {
          direction: sig.direction,
          entry:     sig.entry,
          sl:        sig.sl,
          t1:        sig.t1,
          t2:        sig.t2,
          retest:    sig.retest,
        } : null,
      },
    });
  } catch (err) {
    console.error('[chart-data]', err.message);
    res.status(500).json({ error: err.message });
  }
};
