export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  const { action, payment_id } = req.body;
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
        body: JSON.stringify({ payment_id: payment_id, status: 'pending' })
      });
      const text = await r.text();
      console.log('INSERT status:', r.status, 'body:', text);
      return res.status(200).json({ ok: true, supabase_status: r.status, supabase_body: text });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if(action === 'check'){
    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/payments?payment_id=eq.' + payment_id + '&select=status', { headers });
      const data = await r.json();
      if(data && data.length > 0 && data[0].status === 'verified'){
        return res.status(200).json({ verified: true });
      }
      return res.status(200).json({ verified: false });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
