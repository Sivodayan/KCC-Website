/**
 * Cloudflare Worker / Pages Function: /api/github
 *
 * Secure server-side proxy endpoint for committing website content to GitHub.
 * The GitHub Personal Access Token (GITHUB_TOKEN) is stored as an
 * encrypted secret within Cloudflare environment variables or passed via
 * authenticated session payload.
 */

/**
 * Safe UTF-8 to Base64 encoder for Cloudflare Workers / Pages Functions V8 runtime.
 * Handles multibyte characters such as Tamil Unicode script without throwing errors.
 *
 * @param {string} str - UTF-8 text to encode.
 * @returns {string} Base64-encoded string.
 */
function utf8ToBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Extracts and sanitizes the GitHub token from Cloudflare environment, globalThis, or request headers.
 * Supports multiple casing variations and environments for maximum resilience.
 *
 * @param {Object} context - Cloudflare context { request, env }
 * @returns {string} Clean token or empty string
 */
function getSecretToken(context) {
  const env = context?.env || {};
  const candidates = [
    'GITHUB_TOKEN',
    'github_token',
    'GitHub_Token',
    'GH_TOKEN',
    'gh_token',
    'VITE_GITHUB_TOKEN',
    'vite_github_token',
    'GIT_TOKEN',
    'GITHUB_PAT',
    'TOKEN'
  ];

  // 1. Check known candidate keys on env
  for (const k of candidates) {
    if (env[k] && typeof env[k] === 'string' && env[k].trim()) {
      return env[k].trim();
    }
  }

  // 2. Case-insensitive search on env
  for (const k in env) {
    const lk = k.toLowerCase();
    if ((lk.includes('github') || lk.includes('token')) && typeof env[k] === 'string' && env[k].trim()) {
      return env[k].trim();
    }
  }

  // 3. Check globalThis (Service Worker / legacy worker runtime)
  if (typeof globalThis !== 'undefined') {
    for (const k of candidates) {
      if (globalThis[k] && typeof globalThis[k] === 'string' && globalThis[k].trim()) {
        return globalThis[k].trim();
      }
    }
  }

  // 4. Check process.env (Node compatibility flag)
  if (typeof process !== 'undefined' && process.env) {
    for (const k of candidates) {
      if (process.env[k] && typeof process.env[k] === 'string' && process.env[k].trim()) {
        return process.env[k].trim();
      }
    }
  }

  // 5. Check Authorization header
  if (context?.request && typeof context.request.headers?.get === 'function') {
    try {
      const auth = context.request.headers.get('Authorization') || '';
      if (auth.startsWith('Bearer ')) {
        const val = auth.slice(7).trim();
        if (val) return val;
      }
      if (auth.startsWith('token ')) {
        const val = auth.slice(6).trim();
        if (val) return val;
      }
    } catch {}
  }

  return '';
}

/**
 * Inspects all available environment bindings without leaking secret values.
 */
function inspectEnvironment(context) {
  const env = context?.env || {};
  const keys = new Set();

  for (const k in env) keys.add(k);
  try {
    for (const k of Object.getOwnPropertyNames(env)) keys.add(k);
  } catch {}

  try {
    const proto = Object.getPrototypeOf(env);
    if (proto && proto !== Object.prototype) {
      for (const k of Object.getOwnPropertyNames(proto)) {
        if (k !== 'constructor') keys.add(k);
      }
    }
  } catch {}

  const safeKeys = Array.from(keys).filter(k => k !== 'ASSETS');
  return {
    totalKeys: safeKeys.length,
    keysFound: safeKeys
  };
}

/**
 * Handle OPTIONS for preflight requests
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Handle GET to check if GitHub publishing is configured server-side
 */
export async function onRequestGet(context) {
  const token = getSecretToken(context);
  const isConfigured = Boolean(token);
  const envInfo = inspectEnvironment(context);

  return new Response(
    JSON.stringify({
      configured: isConfigured,
      targetRepo: 'YOUR_USERNAME/KCC-Project',
      branch: 'main',
      hasToken: isConfigured,
      totalKeys: envInfo.totalKeys,
      bindingsFound: envInfo.keysFound,
      checkedAt: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

/**
 * Handle POST to perform atomic Git commit
 */
export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON request body: ' + err.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Token priority: Server environment secret -> Client provided fallback token
  const serverToken = getSecretToken(context);
  const clientToken = (body?.token || '').trim();
  const token = serverToken || clientToken;

  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'GitHub Personal Access Token is required. Please set GITHUB_TOKEN in Cloudflare or provide a session token.'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  const {
    owner = 'YOUR_USERNAME',
    repo = 'KCC-Project',
    path = 'src/data/siteContent.json',
    branch = 'main',
    contentString,
    commitMessage
  } = body || {};

  if (!contentString || typeof contentString !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing required field: contentString.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Security whitelist: Restrict commits to designated repository and content directory
  if (owner !== 'YOUR_USERNAME' || repo !== 'KCC-Project') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized repository target.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  if (path !== 'src/data/siteContent.json' && !path.startsWith('src/data/')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized path. Commits are restricted to src/data/.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  const userAgent = 'Cloudflare-Worker-KCC/1.0';
  const defaultCommitMsg = `Update website content via KCC Admin Panel [${new Date().toISOString()}]`;
  const message = commitMessage?.trim() || defaultCommitMsg;

  try {
    // 1. Fetch current file SHA from GitHub to support atomic in-place updates
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': userAgent
      }
    });

    let currentSha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      currentSha = data.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      if (getRes.status === 401) {
        return new Response(
          JSON.stringify({ error: 'GitHub authentication failed: Provided token is invalid or lacks repo permissions.' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      return new Response(
        JSON.stringify({ error: err.message || `Failed to query repository contents (${getRes.status})` }),
        {
          status: getRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 2. Base64 encode UTF-8 content
    const encodedContent = utf8ToBase64(contentString);

    // 3. Commit updated content via GitHub Contents API (PUT)
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const payload = {
      message,
      content: encodedContent,
      branch
    };
    if (currentSha) {
      payload.sha = currentSha;
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': userAgent
      },
      body: JSON.stringify(payload)
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      let errMsg = errJson.message || `GitHub commit failed (${putRes.status})`;
      if (putRes.status === 409) {
        errMsg = 'Branch conflict (409): Target file was modified concurrently. Please refresh and retry.';
      } else if (putRes.status === 401) {
        errMsg = 'Unauthorized: GitHub token lacks write access or is expired.';
      } else if (putRes.status === 404) {
        errMsg = `Repository ${owner}/${repo} or branch ${branch} not found.`;
      }
      return new Response(
        JSON.stringify({ error: errMsg }),
        {
          status: putRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const result = await putRes.json();
    const commitSha = result.commit?.sha || '';
    const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;

    return new Response(
      JSON.stringify({
        success: true,
        commitSha: commitSha.slice(0, 7),
        fullSha: commitSha,
        commitUrl,
        branch,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error processing GitHub commit.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
