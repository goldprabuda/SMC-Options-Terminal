module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const botUrl = process.env.SMC_BOT_URL;
  const key    = process.env.SMC_BOT_KEY || '';
  const symbol = (req.query.symbol || '').toUpperCase();
  const strike = req.query.strike || '';
  const type   = (req.query.type || '').toUpperCase();

  if (!botUrl) return res.status(500).json({ error: 'SMC_BOT_URL not set' });
  if (!symbol || !strike || !type) return res.status(400).json({ error: 'symbol, strike, type required' });

  try {
    const url = botUrl.replace(/\/$/,'') +
      '/api/oi-history?symbol=' + encodeURIComponent(symbol) +
      '&strike=' + encodeURIComponent(strike) +
      '&type=' + encodeURIComponent(type) +
      '&key=' + encodeURIComponent(key) + '&_t=' + Date.now();
    const r   = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const txt = await r.text();
    try { return res.status(r.status).json(JSON.parse(txt)); }
    catch (_) { return res.status(500).json({ error: 'Bot non-JSON: ' + txt.slice(0,120) }); }
  } catch (e) { return res.status(500).json({ error: 'Fetch failed: ' + e.message }); }
};
