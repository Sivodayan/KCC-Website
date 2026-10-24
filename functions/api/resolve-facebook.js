/**
 * Cloudflare Pages Function: /api/resolve-facebook
 *
 * Resolves short Facebook mobile share URLs (e.g., https://www.facebook.com/share/p/...)
 * to their canonical permanent post permalinks by following the HTTP redirect.
 * Facebook's social plugin iframe explicitly requires the canonical post URL
 * and displays "This post is no longer available" when given temporary /share/ links.
 */

function cleanFacebookUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    // Retain essential query parameters for permalink.php or video embeds
    const keepKeys = ['story_fbid', 'id', 'fbid', 'v', 'p'];
    const newParams = new URLSearchParams();
    for (const key of keepKeys) {
      if (urlObj.searchParams.has(key)) {
        newParams.set(key, urlObj.searchParams.get(key));
      }
    }
    const cleanQuery = newParams.toString() ? `?${newParams.toString()}` : '';
    return `${urlObj.origin}${urlObj.pathname}${cleanQuery}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Handle OPTIONS for preflight requests
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  const urlParam = new URL(context.request.url).searchParams.get('url');
  if (!urlParam || !urlParam.trim()) {
    return new Response(JSON.stringify({ error: 'Missing url parameter.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const trimmed = urlParam.trim();
  const targetUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsedTarget = new URL(targetUrl);
    const host = parsedTarget.hostname.toLowerCase();

    // Security check: only resolve Facebook domain URLs
    if (!host.endsWith('facebook.com') && !host.endsWith('fb.watch') && !host.endsWith('fb.com')) {
      return new Response(JSON.stringify({ error: 'Invalid URL. Only Facebook links can be resolved.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual'
    });

    const locationHeader = response.headers.get('location');
    const finalUrl = locationHeader || response.url || targetUrl;
    const canonicalUrl = cleanFacebookUrl(finalUrl);

    return new Response(JSON.stringify({
      originalUrl: urlParam,
      canonicalUrl,
      resolved: canonicalUrl !== targetUrl
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || 'Failed to resolve Facebook URL',
      originalUrl: urlParam
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
