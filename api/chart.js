module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const botUrl   = process.env.SMC_BOT_URL;
  const key      = process.env.SMC_BOT_KEY || '';
  const symbol   = (req.query.symbol   || '').toUpperCase();
  const interval = (req.query.interval || 'D').toUpperCase();

  if (!botUrl) return res.status(500).json({ error: 'SMC_BOT_URL not set' });
  if (!symbol) return res.status(400).json({ error: 'symbol param required' });

  try {
    // Cache-busting timestamp — guarantees a fresh request every time
    const url = botUrl.replace(/\/$/,'') +
      '/api/chart-data?symbol=' + encodeURIComponent(symbol) +
      '&interval=' + encodeURIComponent(interval) +
      '&key=' + encodeURIComponent(key) +
      '&_t=' + Date.now();

    console.log('[proxy /api/chart] fetching:', url.replace(key, '***'));

    const r   = await fetch(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    const txt = await r.text();
    try {
      const d = JSON.parse(txt);
      console.log('[proxy /api/chart] response candles:', d.candles?.length, 'interval:', d.interval, 'debug:', JSON.stringify(d._debug));
      return res.status(r.status).json(d);
    } catch (_) {
      return res.status(500).json({ error: 'Bot non-JSON: ' + txt.slice(0,150) });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Fetch failed: ' + e.message });
  }
};
