import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function cleanFacebookUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
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

function devFacebookResolverPlugin() {
  return {
    name: 'dev-facebook-resolver',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/resolve-facebook')) {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const target = urlObj.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }
          try {
            const trimmed = target.trim();
            const targetUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
              ? trimmed
              : `https://${trimmed}`;
            const resp = await fetch(targetUrl, {
              method: 'GET',
              redirect: 'manual'
            });
            const locationHeader = resp.headers.get('location');
            const finalUrl = locationHeader || resp.url || targetUrl;
            const canonical = cleanFacebookUrl(finalUrl);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ originalUrl: target, canonicalUrl: canonical, resolved: canonical !== targetUrl }));
            return;
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), devFacebookResolverPlugin()],
  server: {
    port: 5173,
    open: false,
    allowedHosts: true
  }
});
