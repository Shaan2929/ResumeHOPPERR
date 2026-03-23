export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { action, password, token } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation'
  };

  if(action === 'login') return res.status(200).json({ ok: password === ADMIN_PASS });
  if(password !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });

  if(action === 'list'){
    const r = await fetch(SUPABASE_URL + '/rest/v1/payments?select=*&order=created_at.desc', { headers });
    const data = await r.json();
    return res.status(200).json({ payments: Array.isArray(data) ? data : [] });
  }

  if(action === 'verify'){
    await fetch(SUPABASE_URL + '/rest/v1/payments?token=eq.' + encodeURIComponent(token), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'verified' })
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}