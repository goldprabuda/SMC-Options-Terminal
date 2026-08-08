module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const botUrl = process.env.SMC_BOT_URL;
  const key    = process.env.SMC_BOT_KEY || '';
  const symbol = (req.query.symbol || '').toUpperCase();
  if (!botUrl) return res.status(500).json({ ok:false, error: 'SMC_BOT_URL not set' });
  if (!symbol) return res.status(400).json({ ok:false, error: 'symbol param required' });

  try {
    const url = botUrl.replace(/\/$/,'') + '/api/live-analyze?symbol=' + encodeURIComponent(symbol) + '&key=' + encodeURIComponent(key) + '&_t=' + Date.now();
    // Long timeout — live analysis genuinely takes 8-18s (multiple sequential Dhan calls + narrative)
    const r   = await fetch(url, { signal: AbortSignal.timeout(50000), cache: 'no-store' });
    const txt = await r.text();
    try { return res.status(r.status).json(JSON.parse(txt)); }
    catch (_) { return res.status(500).json({ ok:false, error: 'Bot non-JSON: ' + txt.slice(0,150) }); }
  } catch (e) {
    return res.status(500).json({ ok:false, error: 'Fetch failed: ' + e.message });
  }
};
