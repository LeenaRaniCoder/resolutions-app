// Netlify Function to detect goal category with AI

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

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Categorize this New Year's resolution into exactly ONE of these categories:
- health (fitness, exercise, diet, sleep, mental health, wellness, weight loss, meditation, yoga, etc.)
- money_career (job, salary, savings, investing, business, promotion, side hustle, professional development, etc.)
- family_life_balance (relationships, family time, travel, hobbies, social life, work-life balance, relaxation, etc.)
- learning (education, reading, courses, new skills, languages, certifications, creative skills, etc.)
- other (anything that doesn't fit the above categories)

Resolution: "${title}"
${description ? `Description: "${description}"` : ''}

Respond with ONLY the category name, nothing else. Just one word from: health, money_career, family_life_balance, learning, other`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return new Response(JSON.stringify({ category: 'other' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim().toLowerCase();

    // Validate the category
    const validCategories = ['health', 'money_career', 'family_life_balance', 'learning', 'other'];
    const category = validCategories.includes(content) ? content : 'other';

    return new Response(JSON.stringify({ category }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ category: 'other' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
