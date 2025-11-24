export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queueLength = global.requestQueue?.queue?.length || 0;
  const processing = global.requestQueue?.processing || false;

  res.status(200).json({
    queueLength,
    processing
  });
}
