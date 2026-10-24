import {
  onRequestGet as githubGet,
  onRequestPost as githubPost,
  onRequestOptions as githubOptions
} from './functions/api/github.js';

import {
  onRequestGet as fbGet,
  onRequestOptions as fbOptions
} from './functions/api/resolve-facebook.js';

function withNoIndex(response) {
  if (!response) return response;
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. GitHub API proxy endpoint (/api/github)
    if (url.pathname === '/api/github') {
      const context = { request, env, ctx };
      if (request.method === 'OPTIONS') {
        return withNoIndex(await githubOptions(context));
      }
      if (request.method === 'GET') {
        return withNoIndex(await githubGet(context));
      }
      if (request.method === 'POST') {
        return withNoIndex(await githubPost(context));
      }
      return withNoIndex(new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // 2. Facebook canonical resolver proxy endpoint (/api/resolve-facebook)
    if (url.pathname === '/api/resolve-facebook') {
      const context = { request, env, ctx };
      if (request.method === 'OPTIONS') {
        return withNoIndex(await fbOptions(context));
      }
      if (request.method === 'GET') {
        return withNoIndex(await fbGet(context));
      }
      return withNoIndex(new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // 3. Fallback to Cloudflare Static Assets
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
