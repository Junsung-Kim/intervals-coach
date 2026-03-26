const ALLOWED_ORIGINS = [
  'https://chatgpt.com',
  'https://chat.openai.com',
];

function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // server-to-server (no Origin header)
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!isAllowedOrigin(request)) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/data') {
      return new Response('Not found', { status: 404 });
    }

    try {
      const [summary, wellness, activities, events] = await Promise.all([
        env.BUCKET.get('summary.txt'),
        env.BUCKET.get('wellness.txt'),
        env.BUCKET.get('activities.txt'),
        env.BUCKET.get('events.txt'),
      ]);

      const data = {
        summary: summary ? await summary.text() : '',
        wellness: wellness ? await wellness.text() : '',
        activities: activities ? await activities.text() : '',
        events: events ? await events.text() : '',
      };

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders(request),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
      });
    }
  },
};
