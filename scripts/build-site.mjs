import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const client = join(dist, 'client');
const server = join(dist, 'server');

const workerSource = `
const CACHE_CONTROL = 'public, max-age=300';

function normalizePath(pathname) {
  if (pathname === '/' || pathname === '') return '/index.html';
  if (pathname.endsWith('/')) return pathname + 'index.html';
  return pathname;
}

function withHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', CACHE_CONTROL);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetPath = normalizePath(url.pathname);
    const assetUrl = new URL(assetPath, url.origin);
    const assetRequest = new Request(assetUrl, request);
    const response = await env.ASSETS.fetch(assetRequest);

    if (response.status !== 404) return withHeaders(response);

    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    return withHeaders(fallback);
  },
};
`.trimStart();

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await mkdir(join(dist, '.openai'), { recursive: true });

await cp(join(root, 'index.html'), join(client, 'index.html'));
await cp(join(root, 'styles.css'), join(client, 'styles.css'));
await cp(join(root, 'src'), join(client, 'src'), { recursive: true });
await cp(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));
await writeFile(join(server, 'index.js'), workerSource);
