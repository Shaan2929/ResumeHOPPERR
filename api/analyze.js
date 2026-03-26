export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { resumeText } = req.body;
  if(!resumeText) return res.status(400).json({ error: 'No resume text provided' });

  if(!process.env.OPENROUTER_API_KEY){
    return res.status(500).json({ error: 'API key not configured' });
  }

  const analysisPrompt = `You are a world-class professional resume writer and ATS expert with 15+ years of experience helping candidates land jobs at top companies like Google, Microsoft, Amazon, and McKinsey. Your task is to analyze and completely rewrite the given resume to make it exceptional.

ORIGINAL RESUME:
${resumeText.substring(0, 6000)}

INSTRUCTIONS FOR ANALYSIS:
Analyze the resume carefully and return a JSON object. Be honest but constructive.

INSTRUCTIONS FOR IMPROVED RESUME:
Rewrite the entire resume following these strict rules:
1. Use STRONG action verbs (Spearheaded, Orchestrated, Engineered, Accelerated, Transformed, Delivered, Optimized, Pioneered, etc.)
2. QUANTIFY every achievement with numbers/percentages where possible (e.g., "Increased sales by 40%", "Managed team of 8", "Reduced costs by ₹2L")
3. Add relevant ATS keywords for the person's field naturally throughout
4. Make the summary section compelling and specific — not generic
5. Each bullet point should follow: Action Verb + Task + Result/Impact
6. Include a strong SKILLS section with both technical and soft skills
7. Professional email format, LinkedIn placeholder if not present
8. Keep it clean, scannable, and achievement-focused
9. Fix all grammar, spelling, and formatting issues
10. Make it sound like a TOP 1% candidate

FORMAT THE improved_resume FIELD EXACTLY LIKE THIS (use these exact markers):
==NAME==
[Full Name Here]

==CONTACT==
[Email] | [Phone] | [LinkedIn] | [Location]

==SUMMARY==
[2-3 powerful sentences about who they are and what value they bring]

==EXPERIENCE==
[Job Title] | [Company Name] | [Start Date] - [End Date]
• [Strong bullet with quantified achievement]
• [Strong bullet with quantified achievement]
• [Strong bullet with quantified achievement]

[Job Title] | [Company Name] | [Start Date] - [End Date]
• [Strong bullet with quantified achievement]
• [Strong bullet with quantified achievement]

==EDUCATION==
[Degree] | [Institution] | [Year]
• [Relevant achievement or GPA if strong]

==SKILLS==
Technical: [skill1, skill2, skill3, skill4, skill5]
Soft Skills: [skill1, skill2, skill3, skill4]
Tools & Technologies: [tool1, tool2, tool3, tool4]

==CERTIFICATIONS==
• [Certification Name] | [Issuing Body] | [Year]

==PROJECTS== (include only if relevant)
[Project Name] | [Tech Stack Used]
• [What it does and impact]

Return ONLY this JSON with no markdown, no code fences:
{
  "score": <integer 1-10, be honest>,
  "summary": "<2-3 sentence honest overall assessment of original resume>",
  "strengths": [
    "<specific strength found in resume>",
    "<specific strength found in resume>",
    "<specific strength found in resume>"
  ],
  "improvements": [
    "<specific actionable improvement>",
    "<specific actionable improvement>",
    "<specific actionable improvement>",
    "<specific actionable improvement>",
    "<specific actionable improvement>"
  ],
  "keywords_found": [
    "<important keyword found>",
    "<important keyword found>",
    "<important keyword found>",
    "<important keyword found>",
    "<important keyword found>"
  ],
  "keywords_missing": [
    "<important missing keyword for their field>",
    "<important missing keyword>",
    "<important missing keyword>",
    "<important missing keyword>"
  ],
  "improved_resume": "<the complete rewritten resume using the ==SECTION== markers format above. Make it exceptional. Do NOT cut corners. This is the most important field — make it the BEST resume possible for this person.>"
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
          {
            role: 'system',
            content: 'You are a world-class professional resume writer and ATS expert. You write exceptional resumes that help candidates land jobs at top companies. Always respond with valid JSON only — no markdown, no code fences, just raw JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 4000
      })
    });

    const data = await response.json();

    if(!response.ok){
      return res.status(500).json({ error: data.error?.message || 'OpenRouter API error' });
    }

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch(parseErr) {
      // Try to extract JSON if there's extra text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if(jsonMatch){
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return res.status(200).json(result);

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
