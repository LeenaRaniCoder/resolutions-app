// Netlify Function to analyze goals with OpenAI
// The API key is stored as an environment variable, not in the code

export default async (request, context) => {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { title, description } = await request.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Netlify.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentYear = new Date().getFullYear();
    const prompt = `You are a goal-setting coach. Analyze this New Year's resolution and help make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

Resolution: "${title}"
${description ? `Description: "${description}"` : ''}

Respond in JSON format with this exact structure:
{
  "isSmart": boolean (true if the goal is already SMART enough),
  "analysis": {
    "specific": { "pass": boolean, "feedback": "brief feedback" },
    "measurable": { "pass": boolean, "feedback": "brief feedback" },
    "achievable": { "pass": boolean, "feedback": "brief feedback" },
    "relevant": { "pass": boolean, "feedback": "brief feedback" },
    "timeBound": { "pass": boolean, "feedback": "brief feedback" }
  },
  "improvedGoal": "A more specific, measurable version of the goal (or the same if already good)",
  "improvedDescription": "A brief description with clear success criteria",
  "suggestedMilestones": [
    { "title": "milestone name", "targetPercent": 25, "targetDate": "${currentYear}-03-31" },
    { "title": "milestone name", "targetPercent": 50, "targetDate": "${currentYear}-06-30" },
    { "title": "milestone name", "targetPercent": 75, "targetDate": "${currentYear}-09-30" },
    { "title": "milestone name", "targetPercent": 100, "targetDate": "${currentYear}-12-31" }
  ]
}

Keep milestones practical and achievable within ${currentYear}. Only include 3-4 milestones.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      let errorMessage = 'AI service error';
      try {
        const errorData = JSON.parse(error);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {}
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Invalid AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
