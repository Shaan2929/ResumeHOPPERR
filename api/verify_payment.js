export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { action, token, plan, email } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation'
  };

  if(action === 'create'){
    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify({ token, plan: plan || 'token', status: 'pending', used: false })
      });
      const text = await r.text();
      return res.status(200).json({ ok: true, supabase_status: r.status });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if(action === 'check'){
    try {
      const identifier = token;
      const r = await fetch(SUPABASE_URL + '/rest/v1/payments?token=eq.' + encodeURIComponent(identifier) + '&select=status,plan,used', { headers });
      const data = await r.json();
      if(!data || data.length === 0) return res.status(200).json({ verified: false, reason: 'not_found' });
      const record = data[0];
      if(record.status !== 'verified') return res.status(200).json({ verified: false, reason: 'pending' });
      if(record.plan === 'token' && record.used) return res.status(200).json({ verified: false, reason: 'used' });
      if(record.plan === 'token'){
        await fetch(SUPABASE_URL + '/rest/v1/payments?token=eq.' + encodeURIComponent(identifier), {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ used: true })
        });
      }
      return res.status(200).json({ verified: true, plan: record.plan });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}