/**
 * api/data.js — proxy to the SMC bot, now merges FRESH live prices on top
 * of the (possibly stale-cache) dashboard data, so the tab bar price is
 * never wrong even if the background cron hasn't run recently.
 */
const ALLOWED_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'SENSEX'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const botUrl = process.env.SMC_BOT_URL;
  const key    = process.env.SMC_BOT_KEY || '';
  if (!botUrl) return res.status(500).json({ ok: false, error: 'SMC_BOT_URL not set' });

  try {
    const base = botUrl.replace(/\/$/, '');

    // Fetch cached dashboard data (for fired-dot/score context) and fresh
    // live prices in parallel — live prices always win for the price field.
    const [dashRes, priceRes] = await Promise.allSettled([
      fetch(base + '/api/dashboard-data?key=' + encodeURIComponent(key) + '&_t=' + Date.now(), { signal: AbortSignal.timeout(15000), cache: 'no-store' }),
      fetch(base + '/api/live-prices?key=' + encodeURIComponent(key) + '&_t=' + Date.now(), { signal: AbortSignal.timeout(20000), cache: 'no-store' }),
    ]);

    let d = { ok: true, scrips: [] };
    if (dashRes.status === 'fulfilled') {
      try { d = JSON.parse(await dashRes.value.text()); } catch (_) {}
    }

    let livePrices = {};
    if (priceRes.status === 'fulfilled') {
      try { const pd = JSON.parse(await priceRes.value.text()); if (pd.ok) livePrices = pd.prices || {}; } catch (_) {}
    }

    if (d.scrips) {
      d.scrips = d.scrips
        .filter(s => ALLOWED_SYMBOLS.includes((s.symbol || '').toUpperCase()))
        .map(s => ({ ...s, currentPrice: livePrices[s.symbol] ?? s.currentPrice }));
    } else {
      // dashboard-data failed entirely — build a minimal list from live prices alone
      d.scrips = ALLOWED_SYMBOLS.filter(sym => livePrices[sym] != null).map(sym => ({ symbol: sym, currentPrice: livePrices[sym], signal: null }));
      d.ok = true;
    }

    return res.status(200).json(d);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
