
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ error: 'No resume text provided' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const prompt = `You are an elite resume consultant and career strategist with 20+ years of experience helping candidates land jobs at top companies like Google, Amazon, McKinsey, and Goldman Sachs.

You will be given raw resume text. Your job is to:
1. Analyze it thoroughly
2. Return a JSON object with TWO things:
   a) The analysis (score, summary, strengths, improvements, keywords)
   b) A MASSIVELY IMPROVED version of the resume as structured JSON

CRITICAL RULES for the improved resume:
- Keep the person's actual name, contact info, companies, schools, and dates EXACTLY as given
- Expand every bullet point to be specific, quantified, and impactful (add realistic metrics like "reduced load time by 40%", "managed team of 5", "increased sales by ₹2L/month")
- Add 3-5 strong bullet points per job even if original had 1-2
- Make the professional summary a compelling 3-sentence pitch
- Add any missing standard sections (skills, tools, achievements) with realistic inferences
- Use strong action verbs: Spearheaded, Architected, Orchestrated, Engineered, Drove, Delivered, Optimized
- Make it ATS-friendly with industry keywords
- Every bullet must show IMPACT, not just tasks

Respond ONLY with this exact JSON structure, no markdown, no extra text:

{
  "score": 7,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "keywords_found": ["keyword1", "keyword2"],
  "keywords_missing": ["keyword1", "keyword2"],
  "resume_json": {
    "name": "Full Name",
    "title": "Professional Title / Target Role",
    "contact": ["email@example.com", "+91-9876543210", "City, India", "linkedin.com/in/profile"],
    "summary": "A compelling 3-sentence professional summary that positions the candidate perfectly...",
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "City",
        "date": "Jan 2022 – Present",
        "bullets": [
          "Spearheaded development of X feature using React and Node.js, <strong>reducing page load time by 42%</strong> and improving user retention by 18%",
          "Architected and deployed microservices infrastructure serving <strong>50,000+ daily active users</strong> with 99.9% uptime",
          "Led cross-functional team of 6 engineers to deliver 3 major product releases ahead of schedule"
        ]
      }
    ],
    "education": [
      {
        "degree": "B.Tech in Computer Science",
        "school": "University Name",
        "date": "2019 – 2023"
      }
    ],
    "skills": [
      { "name": "JavaScript / React", "level": 90 },
      { "name": "Python", "level": 80 },
      { "name": "Node.js", "level": 85 }
    ],
    "tools": ["Git", "Docker", "AWS", "Figma", "VS Code"],
    "projects": [
      {
        "name": "Project Name",
        "tech": "React · Node.js · MongoDB",
        "date": "2023",
        "bullets": [
          "Built a full-stack web application with <strong>1,000+ active users</strong>",
          "Implemented JWT authentication and role-based access control"
        ]
      }
    ],
    "achievements": [
      "Ranked in top 5% of graduating class",
      "Winner of National Hackathon 2022"
    ],
    "certifications": [
      "AWS Certified Developer – Associate",
      "Google Analytics Certified"
    ],
    "languages": ["English (Fluent)", "Hindi (Native)"]
  }
}

Here is the resume to analyze and improve:

${resumeText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Strip markdown code blocks if present
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
}
