module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const botUrl   = process.env.SMC_BOT_URL;
  const key      = process.env.SMC_BOT_KEY || '';
  const symbol   = (req.query.symbol   || '').toUpperCase();
  const interval = (req.query.interval || 'D').toUpperCase();

  if (!botUrl) return res.status(500).json({ error: 'SMC_BOT_URL not set' });
  if (!symbol) return res.status(400).json({ error: 'symbol param required' });

  try {
    const url = botUrl.replace(/\/$/,'') +
      '/api/chart-data?symbol=' + encodeURIComponent(symbol) +
      '&interval=' + encodeURIComponent(interval) +
      '&key=' + encodeURIComponent(key);
    const r   = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const txt = await r.text();
    try   { return res.status(r.status).json(JSON.parse(txt)); }
    catch (_) { return res.status(500).json({ error: 'Bot non-JSON: ' + txt.slice(0,120) }); }
  } catch (e) { return res.status(500).json({ error: 'Fetch failed: ' + e.message }); }
};
