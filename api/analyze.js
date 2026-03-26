export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { resumeText } = req.body;
  if(!resumeText) return res.status(400).json({ error: 'No resume text provided' });
  if(!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const prompt = `You are a world-class professional resume writer and ATS expert with 15+ years of experience helping candidates land jobs at Google, Microsoft, Amazon, and McKinsey.

ORIGINAL RESUME:
${resumeText.substring(0, 6000)}

Your job is to:
1. Analyze the resume critically and honestly
2. Completely rewrite it as a stunning, ATS-optimized professional resume
3. Use STRONG action verbs (Spearheaded, Orchestrated, Engineered, Accelerated, Transformed, Delivered, Optimized, Pioneered)
4. QUANTIFY every achievement with numbers/percentages (e.g. "Increased sales by 40%", "Managed team of 8", "Reduced costs by 20%")
5. Add relevant ATS keywords naturally throughout
6. Each bullet point: Action Verb + Task + Result/Impact
7. Make it sound like a TOP 1% candidate

Return ONLY this exact JSON with no markdown, no code fences:
{
  "score": <integer 1-10>,
  "summary": "<2-3 sentence honest assessment of original resume>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "improvements": ["<specific actionable improvement>", "<improvement>", "<improvement>", "<improvement>", "<improvement>"],
  "keywords_found": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "keywords_missing": ["<missing keyword>", "<missing>", "<missing>", "<missing>"],
  "resume_json": {
    "name": "<Full Name>",
    "title": "<Professional Title e.g. Software Engineer | Full Stack Developer>",
    "contact": ["<email>", "<phone>", "<LinkedIn URL or 'LinkedIn: /in/name'>", "<City, Country>"],
    "summary": "<3-4 sentence compelling professional summary with keywords and value proposition>",
    "experience": [
      {
        "title": "<Job Title>",
        "company": "<Company Name>",
        "location": "<City, Country>",
        "date": "<Month Year - Month Year>",
        "bullets": [
          "<Strong bullet: Action verb + task + quantified result>",
          "<Strong bullet: Action verb + task + quantified result>",
          "<Strong bullet: Action verb + task + quantified result>"
        ]
      }
    ],
    "education": [
      {
        "degree": "<Degree Name e.g. B.Tech Computer Science>",
        "school": "<University/School Name>",
        "date": "<Year - Year or Expected Year>"
      }
    ],
    "skills": [
      {"name": "<Skill Name>", "level": <integer 60-95>},
      {"name": "<Skill Name>", "level": <integer 60-95>},
      {"name": "<Skill Name>", "level": <integer 60-95>},
      {"name": "<Skill Name>", "level": <integer 60-95>},
      {"name": "<Skill Name>", "level": <integer 60-95>}
    ],
    "tools": ["<Tool/Technology>", "<Tool>", "<Tool>", "<Tool>", "<Tool>", "<Tool>"],
    "languages": ["<Language - Native>", "<Language - Professional>"],
    "certifications": ["<Certification Name - Issuing Body - Year>"],
    "achievements": ["<Key achievement or award>", "<Key achievement>"],
    "projects": [
      {
        "name": "<Project Name>",
        "tech": "<Tech Stack Used>",
        "date": "<Year>",
        "bullets": ["<What it does and impact>", "<Key feature or result>"]
      }
    ]
  }
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
          { role: 'system', content: 'You are a world-class professional resume writer and ATS expert. Always respond with valid JSON only — no markdown, no code fences, just raw JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    if(!response.ok) return res.status(500).json({ error: data.error?.message || 'OpenRouter API error' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch(e) {
      const match = raw.match(/\{[\s\S]*\}/);
      if(match) result = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response as JSON');
    }

    return res.status(200).json(result);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
