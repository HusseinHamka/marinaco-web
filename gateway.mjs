import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MARINACO_DIR = path.join(ROOT, 'apps', 'marinaco');
const UGARIT_DIR = path.join(ROOT, 'apps', 'ugarit');
const ALMARSA_DIR = path.join(ROOT, 'apps', 'almarsa');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8080);
const UGARIT_PORT = Number(process.env.UGARIT_PORT || 4177);
const ALMARSA_PORT = Number(process.env.ALMARSA_PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade']);

function fail(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function waitForPort(port, host = '127.0.0.1', timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({ host, port, path: '/api/menu', method: 'GET' }, (res) => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
        req.end();
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`Backend on port ${port} did not become ready`);
}

function spawnBackend(cwd, env) {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    console.error(`Backend exited (${cwd}) code=${code} signal=${signal}`);
    process.exit(code ?? 1);
  });
  return child;
}

function stripPrefix(pathname, prefix) {
  if (pathname === prefix || pathname === `${prefix}/`) return '/';
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || '/';
  return null;
}

function proxyRequest(req, res, targetPort, prefix) {
  const url = new URL(req.url, 'http://localhost');
  const downstreamPath = stripPrefix(url.pathname, prefix);
  if (!downstreamPath) {
    fail(res, 404, 'Not found');
    return;
  }

  const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  for (const key of HOP_BY_HOP) delete headers[key];

  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: `${downstreamPath}${url.search}`,
    method: req.method,
    headers,
  };

  const proxy = http.request(options, (upstream) => {
    const responseHeaders = { ...upstream.headers };
    for (const key of HOP_BY_HOP) delete responseHeaders[key];
    res.writeHead(upstream.statusCode ?? 502, responseHeaders);
    upstream.pipe(res);
  });

  proxy.on('error', (error) => {
    console.error('Proxy error:', error.message);
    if (!res.headersSent) fail(res, 502, 'Bad gateway');
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxy.end();
  } else {
    req.pipe(proxy);
  }
}

async function serveMarinaco(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  if (safePath.includes('..') || safePath.includes('\\')) {
    fail(res, 400, 'Invalid path');
    return;
  }

  const relative = safePath.replace(/^\//, '');
  const file = path.join(MARINACO_DIR, relative);
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext];
  if (!type) {
    fail(res, 404, 'Not found');
    return;
  }
  if (!(await exists(file))) {
    fail(res, 404, 'Not found');
    return;
  }

  const body = await fs.readFile(file);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

async function main() {
  spawnBackend(UGARIT_DIR, { PORT: String(UGARIT_PORT), HOST: '127.0.0.1' });
  spawnBackend(ALMARSA_DIR, { PORT: String(ALMARSA_PORT) });

  await Promise.all([waitForPort(UGARIT_PORT), waitForPort(ALMARSA_PORT)]);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;

      if (pathname.startsWith('/ugarit')) {
        proxyRequest(req, res, UGARIT_PORT, '/ugarit');
        return;
      }
      if (pathname.startsWith('/almarsa')) {
        proxyRequest(req, res, ALMARSA_PORT, '/almarsa');
        return;
      }
      if (pathname.startsWith('/api') || pathname.startsWith('/uploads') || pathname === '/admin' || pathname.startsWith('/admin.')) {
        fail(res, 404, 'Not found');
        return;
      }

      await serveMarinaco(req, res, pathname);
    } catch (error) {
      console.error('Gateway error:', error.message);
      if (!res.headersSent) fail(res, 500, 'Internal server error');
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`Marinaco hub: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
    console.log(`Ugarit menu: /ugarit/ | admin: /ugarit/admin`);
    console.log(`Al Marsa menu: /almarsa/ | admin: /almarsa/admin`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
