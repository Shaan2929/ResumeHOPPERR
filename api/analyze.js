export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { resumeText } = req.body;
  if(!resumeText) return res.status(400).json({ error: 'No resume text provided' });

  const prompt = `You are an expert ATS resume reviewer and professional resume writer. Analyze this resume and return ONLY valid JSON with no markdown.

RESUME:
${resumeText.substring(0, 6000)}

Return exactly this JSON:
{
  "score": <integer 1-10>,
  "summary": "<2-3 sentence honest assessment>",
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "improvements": ["<improvement>", "<improvement>", "<improvement>", "<improvement>"],
  "keywords_found": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "keywords_missing": ["<missing>", "<missing>", "<missing>", "<missing>"],
  "improved_resume": "<full rewritten resume as plain text with sections NAME, CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS>"
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://resume-hopperr.vercel.app',
        'X-Title': 'ResumeHopper'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert ATS resume reviewer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    if(!response.ok) return res.status(500).json({ error: data.error?.message || 'OpenRouter error' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(raw);
    return res.status(200).json(result);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
