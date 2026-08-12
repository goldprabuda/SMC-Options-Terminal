/**
 * api/data.js — proxy to the SMC bot's dashboard data.
 *
 * GUARANTEED index-only filter: regardless of what's actually in the
 * Supabase watchlist table (which has proven unreliable to clean up),
 * this hardcoded allowlist ensures only these symbols ever reach the
 * tab bar. If you add another index later, just add it to this array.
 */
const ALLOWED_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'SENSEX'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const botUrl = process.env.SMC_BOT_URL;
  const key    = process.env.SMC_BOT_KEY || '';
  if (!botUrl) return res.status(500).json({ ok: false, error: 'SMC_BOT_URL not set' });

  try {
    const url = botUrl.replace(/\/$/, '') + '/api/dashboard-data?key=' + encodeURIComponent(key) + '&_t=' + Date.now();
    const r   = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const txt = await r.text();
    let d;
    try { d = JSON.parse(txt); } catch (_) { return res.status(500).json({ ok: false, error: 'Bot non-JSON: ' + txt.slice(0,120) }); }

    if (d.scrips) {
      d.scrips = d.scrips.filter(s => ALLOWED_SYMBOLS.includes((s.symbol || '').toUpperCase()));
    }
    return res.status(r.status).json(d);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
