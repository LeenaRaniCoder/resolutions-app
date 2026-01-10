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

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Netlify.env.get('OPENAI_API_KEY');

    // Debug: log key prefix to verify it's being read
    console.log('API key prefix:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET');

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentYear = new Date().getFullYear();
    const prompt = `You are an expert goal-setting coach specializing in behavioral psychology, habit formation, and strategic planning. Analyze this New Year's resolution and transform it into a comprehensive, actionable plan.

Resolution: "${title}"
${description ? `Description: "${description}"` : ''}

First, detect the goal category (health, money/career, family/life_balance, learning, or other).

Then respond in JSON format with this exact structure:

{
  "category": "health" | "money_career" | "family_life_balance" | "learning" | "other",
  "isSmart": boolean,
  "analysis": {
    "specific": { "pass": boolean, "feedback": "brief feedback" },
    "measurable": { "pass": boolean, "feedback": "brief feedback" },
    "achievable": { "pass": boolean, "feedback": "brief feedback" },
    "relevant": { "pass": boolean, "feedback": "brief feedback" },
    "timeBound": { "pass": boolean, "feedback": "brief feedback" }
  },
  "improvedGoal": "A SMART rewrite of the goal",
  "improvedDescription": "Clear success criteria and what achieving this looks like",
  "identityStatement": "Who you become by achieving this (e.g., 'I am someone who...')",
  "quarterlyPlan": [
    {
      "quarter": "Q1",
      "theme": "Foundation Building",
      "targetPercent": 25,
      "targetDate": "${currentYear}-03-31",
      "successMetrics": ["Specific measurable outcome 1", "Outcome 2"],
      "leadingIndicators": ["Weekly/monthly actions that predict success"],
      "laggingIndicators": ["Results that prove it's working"],
      "monthlyProgression": {
        "month1": "Focus and actions for January",
        "month2": "Focus and actions for February",
        "month3": "Focus and actions for March"
      }
    },
    {
      "quarter": "Q2",
      "theme": "Building Momentum",
      "targetPercent": 50,
      "targetDate": "${currentYear}-06-30",
      "successMetrics": [],
      "leadingIndicators": [],
      "laggingIndicators": [],
      "monthlyProgression": { "month1": "", "month2": "", "month3": "" }
    },
    {
      "quarter": "Q3",
      "theme": "Acceleration",
      "targetPercent": 75,
      "targetDate": "${currentYear}-09-30",
      "successMetrics": [],
      "leadingIndicators": [],
      "laggingIndicators": [],
      "monthlyProgression": { "month1": "", "month2": "", "month3": "" }
    },
    {
      "quarter": "Q4",
      "theme": "Completion & Sustainability",
      "targetPercent": 100,
      "targetDate": "${currentYear}-12-31",
      "successMetrics": [],
      "leadingIndicators": [],
      "laggingIndicators": [],
      "monthlyProgression": { "month1": "", "month2": "", "month3": "" }
    }
  ],
  "risks": [
    {
      "risk": "Description of failure point 1",
      "likelihood": "high" | "medium" | "low",
      "mitigation": "How to prevent or recover from this"
    },
    {
      "risk": "Description of failure point 2",
      "likelihood": "high" | "medium" | "low",
      "mitigation": "How to prevent or recover from this"
    },
    {
      "risk": "Description of failure point 3",
      "likelihood": "high" | "medium" | "low",
      "mitigation": "How to prevent or recover from this"
    }
  ],
  "trackingSystem": {
    "type": "daily_checklist" | "weekly_scorecard" | "dashboard" | "habit_tracker",
    "description": "How to track progress simply",
    "keyMetrics": ["What to measure", "What to measure"],
    "reviewCadence": "When to review (daily/weekly/monthly)"
  },
  "minimumViableProgress": {
    "description": "The bare minimum to maintain momentum on busy/hard weeks",
    "timeRequired": "X minutes",
    "actions": ["Simple action 1", "Simple action 2"]
  },
  "categorySpecific": {
    // For health goals:
    "habitStack": "Existing habit to attach this to (After I [existing habit], I will [new habit])",
    "identityShift": "The identity-based behavior change framing",

    // For money/career goals:
    "skillMilestones": ["Skill to acquire by Q1", "Skill by Q2", etc.],
    "leveragePoints": ["High-impact actions that multiply results"],

    // For family/life balance goals:
    "sustainabilityConstraints": ["Boundaries to prevent burnout"],
    "recoveryProtocols": ["What to do when overwhelmed"],

    // For learning goals:
    "retentionLoops": ["How to retain what you learn"],
    "practiceSchedule": "Spaced repetition or practice plan"
  },
  "suggestedMilestones": [
    { "title": "Q1: [milestone name]", "targetPercent": 25, "targetDate": "${currentYear}-03-31" },
    { "title": "Q2: [milestone name]", "targetPercent": 50, "targetDate": "${currentYear}-06-30" },
    { "title": "Q3: [milestone name]", "targetPercent": 75, "targetDate": "${currentYear}-09-30" },
    { "title": "Q4: [milestone name]", "targetPercent": 100, "targetDate": "${currentYear}-12-31" }
  ]
}

IMPORTANT GUIDELINES:
- Be specific and actionable, not generic
- Include only the categorySpecific fields relevant to the detected category
- Make the minimum viable progress truly minimal (5-10 minutes)
- Leading indicators should be things within the person's control
- Lagging indicators should be observable results
- Risks should be realistic failure points, not generic obstacles
- The identity statement should be present-tense and empowering`;

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
        max_tokens: 4000,
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
