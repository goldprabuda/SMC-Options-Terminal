module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const botUrl = process.env.SMC_BOT_URL;
  const key    = process.env.SMC_BOT_KEY;
  const symbol = req.query.symbol || '';
  if (!botUrl) return res.status(500).json({ error: 'SMC_BOT_URL not set' });
  try {
    const r = await fetch(botUrl + '/api/chart-data?symbol=' + encodeURIComponent(symbol) + '&key=' + encodeURIComponent(key || ''));
    const d = await r.json();
    res.status(r.status).json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
