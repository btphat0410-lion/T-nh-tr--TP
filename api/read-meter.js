// Vercel serverless function: đọc số đồng hồ bằng Claude
// Cần đặt biến môi trường ANTHROPIC_API_KEY trong Vercel (không ghi key vào code)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_api_key' });
  const { image, prompt } = req.body || {};
  if (!image || typeof image !== 'string' || image.length > 4000000)
    return res.status(400).json({ error: 'bad_image' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 100,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: String(prompt || 'Đọc chỉ số đồng hồ. Trả về JSON {"reading": số}').slice(0, 800) }
        ] }]
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'upstream', detail: j.error && j.error.message });
    const t = (j.content || []).map(c => c.text || '').join('');
    const m = t.match(/\{[\s\S]*?\}/);
    let reading = null;
    try { reading = m ? JSON.parse(m[0]).reading : null; } catch (e) {}
    return res.status(200).json({ reading });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
