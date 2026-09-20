import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { routes } from './routes.js';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS ?? 120);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
};

const send = (res, status, payload) => {
  if (payload === null || status === 204) {
    res.writeHead(204, CORS_HEADERS).end();
    return;
  }
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createApp = () =>
  createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS).end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const route = routes.find((entry) => entry.method === req.method && entry.path.test(url.pathname));

    if (!route) {
      send(res, 404, { error: `No mock endpoint for ${req.method} ${url.pathname}` });
      return;
    }

    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    if (LATENCY_MS > 0 && url.pathname !== '/api/health') await delay(LATENCY_MS);

    const params = url.pathname.match(route.path)?.slice(1) ?? [];
    const result = route.handle(params, url.searchParams, body, req.headers);
    send(res, result.status, result.body);
  });

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isEntrypoint) {
  createApp().listen(PORT, HOST, () => {
    console.log(`Mock API listening on http://${HOST}:${PORT}`);
  });
}
