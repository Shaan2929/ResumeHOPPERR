export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 30) {
    return res.status(400).json({ error: 'Resume text too short or missing.' });
  }

  const prompt = `You are an expert ATS resume reviewer. Analyze this resume and return ONLY valid JSON with no markdown, no code fences.

RESUME:
${resumeText.substring(0, 7000)}

Return exactly this JSON:
{
  "score": <integer 1-10>,
  "summary": "<2-3 sentence honest assessment>",
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "improvements": ["<improvement>", "<improvement>", "<improvement>", "<improvement>"],
  "keywords_found": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "keywords_missing": ["<missing>", "<missing>", "<missing>", "<missing>"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert ATS resume reviewer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'OpenAI error' });
    }

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(raw);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}