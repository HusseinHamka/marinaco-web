import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.ALMARSA_DATA_DIR || path.join(root, 'data'));
const uploadDir = path.resolve(process.env.ALMARSA_UPLOAD_DIR || path.join(root, 'public/uploads'));
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || 3000);
const envPassword = process.env.ALMARSA_ADMIN_PASSWORD;

const authPath = path.join(dataDir, 'admin-auth.json');
const settingsPath = path.join(dataDir, 'restaurant-settings.json');
const initialSettings = { dollarRate: 90000 };

const mime = {
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
  '.woff2': 'font/woff2',
};

await fs.mkdir(dataDir, { recursive: true });
await fs.mkdir(uploadDir, { recursive: true });

const sessions = new Map();
const limits = new Map();
const locks = new Map();

function safeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 256;
}

async function readOptional(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function load(name) {
  return JSON.parse(await fs.readFile(path.join(dataDir, name), 'utf8'));
}

async function atomicSave(file, object) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, JSON.stringify(object, null, 2), { mode: 0o600 });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

function update(name, updater) {
  const previous = locks.get(name) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const current = await load(name);
    const updated = await updater(current);
    await atomicSave(path.join(dataDir, name), updated);
    return updated;
  });
  locks.set(name, next);
  return next;
}

function matchPassword(plain, stored) {
  if (stored?.hash && stored?.salt) {
    const left = Buffer.from(passwordHash(plain, stored.salt), 'hex');
    const right = Buffer.from(stored.hash, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  if (!envPassword || envPassword.length < 12) return false;
  const left = crypto.createHash('sha256').update(plain).digest();
  const right = crypto.createHash('sha256').update(envPassword).digest();
  return crypto.timingSafeEqual(left, right);
}

function cookie(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((item) => item.trim().split('=').map(decodeURIComponent))
      .filter((parts) => parts.length === 2),
  );
}

function isAdmin(req) {
  const token = cookie(req).almarsa_session;
  const hash = token && crypto.createHash('sha256').update(token).digest('hex');
  const session = hash && sessions.get(hash);
  if (!session || session.expires < Date.now()) return false;
  return true;
}

function reply(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(JSON.stringify(data));
}

function fail(res, status, message) {
  reply(res, status, { error: message });
}

async function body(req, max = 1024 * 256) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) {
      const error = new Error('Request too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

function rateLimit(req, res, key, max, windowMs) {
  const id = `${req.socket.remoteAddress || 'unknown'}:${key}`;
  const now = Date.now();
  const times = (limits.get(id) || []).filter((time) => time > now - windowMs);
  if (times.length >= max) {
    const retryAfter = Math.ceil((times[0] + windowMs - now) / 1000);
    reply(res, 429, { error: 'Too many requests. Please try again later.' }, { 'Retry-After': String(retryAfter) });
    return false;
  }
  times.push(now);
  limits.set(id, times);
  return true;
}

function gated(req, res) {
  if (!isAdmin(req)) {
    fail(res, 401, 'Administrator login required');
    return false;
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        fail(res, 403, 'Invalid origin');
        return false;
      }
    } catch {
      fail(res, 403, 'Invalid origin');
      return false;
    }
  }

  return true;
}

function normalizeCurrency(value) {
  return value === 'LBP' ? 'LBP' : 'USD';
}

function normalizeDollarRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 10000000) {
    throw new Error('Invalid dollar rate');
  }
  return Math.round(rate);
}

function checkDish(input, previous) {
  if (!input || typeof input !== 'object' || !safeText(input.name, 120)) {
    throw new Error('Dish name is required');
  }

  const numericPrice = Number(input.price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 1000000000) {
    throw new Error('Invalid price');
  }

  const descriptionEn = safeText(input.descriptionEn ?? input.description ?? previous?.descriptionEn ?? previous?.description, 1500);
  const descriptionAr = safeText(input.descriptionAr ?? previous?.descriptionAr, 1500);

  return {
    id: previous?.id || crypto.randomUUID(),
    name: safeText(input.name, 120),
    description: descriptionEn,
    descriptionEn,
    descriptionAr,
    price: numericPrice,
    currency: normalizeCurrency(input.currency ?? previous?.currency),
    image: safeText(input.image ?? previous?.image, 400),
    order: Number.isInteger(Number(input.order)) ? Number(input.order) : 0,
    available: input.available !== false,
  };
}

function checkCategory(input, previous = {}) {
  if (!input || !safeText(input.name, 120)) {
    throw new Error('Category name is required');
  }

  return {
    ...previous,
    id: previous.id || crypto.randomUUID(),
    name: safeText(input.name, 120),
    subtitle: '',
    icon: safeText(input.icon ?? previous.icon, 8),
    cover: safeText(input.cover ?? previous.cover, 400),
    order: Number.isInteger(Number(input.order)) ? Number(input.order) : 0,
    dishes: previous.dishes || [],
  };
}

async function serveFile(res, file, head = false, noCache = false) {
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return false;
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': noCache ? 'no-store' : 'public, max-age=300',
    });
    if (head) {
      res.end();
    } else {
      res.end(await fs.readFile(file));
    }
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    const method = req.method;

    if (route === '/api/menu' && method === 'GET') {
      const menu = await load('menu.json');
      const visible = menu
        .filter((category) => !category.hidden)
        .sort((a, b) => a.order - b.order)
        .map((category) => ({
          ...category,
          dishes: category.dishes
            .filter((dish) => dish.available !== false)
            .sort((a, b) => a.order - b.order),
        }));
      return reply(res, 200, visible);
    }

    if (route === '/api/feedback' && method === 'POST') {
      if (!rateLimit(req, res, 'feedback', 5, 3600000)) return;
      const input = await body(req);
      if (input.website) return reply(res, 200, { ok: true });

      const rating = Number(input.rating);
      const message = safeText(input.message, 500);
      const name = safeText(input.name, 80);
      const contact = safeText(input.contact ?? input.email, 160);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !message || !contact) {
        return fail(res, 400, 'Invalid feedback');
      }

      const entry = {
        id: crypto.randomUUID(),
        name,
        contact,
        email: contact,
        rating,
        message,
        occasion: safeText(input.occasion, 80),
        createdAt: new Date().toISOString(),
        status: 'new',
      };

      await update('feedback.json', (list) => [entry, ...list]);
      return reply(res, 201, { ok: true });
    }

    if (route === '/api/admin/login' && method === 'POST') {
      if (!rateLimit(req, res, 'login', 10, 900000)) return;
      const stored = await readOptional(authPath, null);
      if (!stored && (!envPassword || envPassword.length < 12)) {
        return fail(res, 503, 'Configure ALMARSA_ADMIN_PASSWORD (minimum 12 characters)');
      }

      const input = await body(req);
      if (!matchPassword(String(input.password || ''), stored)) {
        return fail(res, 401, 'Invalid credentials');
      }

      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(crypto.createHash('sha256').update(token).digest('hex'), {
        expires: Date.now() + 8 * 3600000,
      });

      return reply(
        res,
        200,
        { ok: true },
        {
          'Set-Cookie': `almarsa_session=${token}; Path=/almarsa/api/admin; HttpOnly; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
        },
      );
    }

    if (route === '/api/admin/session' && method === 'GET') {
      return reply(res, 200, { authenticated: isAdmin(req) });
    }

    if (route.startsWith('/api/admin/')) {
      if (!gated(req, res)) return;

      if (route === '/api/admin/logout' && method === 'POST') {
        const token = cookie(req).almarsa_session;
        if (token) {
          sessions.delete(crypto.createHash('sha256').update(token).digest('hex'));
        }
        return reply(res, 200, { ok: true }, {
          'Set-Cookie': 'almarsa_session=; Path=/almarsa/api/admin; Max-Age=0; HttpOnly; SameSite=Strict',
        });
      }

      if (route === '/api/admin/settings' && method === 'GET') {
        const settings = await readOptional(settingsPath, initialSettings);
        return reply(res, 200, { ...initialSettings, ...settings, dollarRate: normalizeDollarRate((settings && settings.dollarRate) || initialSettings.dollarRate) });
      }

      if (route === '/api/admin/settings' && method === 'PATCH') {
        const input = await body(req);
        const previous = await readOptional(settingsPath, initialSettings);
        const next = { ...previous };
        if (Object.hasOwn(input, 'dollarRate')) {
          next.dollarRate = normalizeDollarRate(input.dollarRate);
        }
        await atomicSave(settingsPath, next);
        return reply(res, 200, next);
      }

      if (route === '/api/admin/password' && method === 'POST') {
        if (!rateLimit(req, res, 'password', 5, 900000)) return;
        const input = await body(req);
        const stored = await readOptional(authPath, null);

        if (!matchPassword(String(input.currentPassword || ''), stored)) {
          return fail(res, 401, 'Current password is incorrect');
        }
        if (!isStrongPassword(input.newPassword)) {
          return fail(res, 400, 'New password must be 12–256 characters');
        }
        if (input.currentPassword === input.newPassword) {
          return fail(res, 400, 'Choose a different password');
        }

        const salt = crypto.randomBytes(32).toString('hex');
        await atomicSave(authPath, {
          version: 1,
          salt,
          hash: passwordHash(input.newPassword, salt),
        });
        sessions.clear();
        return reply(res, 200, { ok: true, reauthenticate: true }, {
          'Set-Cookie': 'almarsa_session=; Path=/almarsa/api/admin; Max-Age=0; HttpOnly; SameSite=Strict',
        });
      }

      if (route === '/api/admin/menu' && method === 'GET') {
        return reply(res, 200, await load('menu.json'));
      }

      if (route === '/api/admin/feedback' && method === 'GET') {
        return reply(res, 200, await load('feedback.json'));
      }

      if (route === '/api/admin/categories' && method === 'POST') {
        const input = await body(req);
        let item;
        await update('menu.json', (list) => {
          item = checkCategory(input);
          list.push(item);
          return list;
        });
        return reply(res, 201, item);
      }

      let match = route.match(/^\/api\/admin\/categories\/([^/]+)$/);
      if (match && (method === 'PATCH' || method === 'DELETE')) {
        const input = method === 'PATCH' ? await body(req) : null;
        let item;
        await update('menu.json', (list) => {
          const index = list.findIndex((category) => category.id === match[1]);
          if (index < 0) {
            const error = new Error('Category not found');
            error.status = 404;
            throw error;
          }
          if (method === 'DELETE') {
            if (list[index].dishes.length) {
              const error = new Error('Delete or move the dishes first');
              error.status = 409;
              throw error;
            }
            list.splice(index, 1);
          } else {
            item = list[index] = checkCategory(input, list[index]);
          }
          return list;
        });
        return reply(res, 200, { ok: true, item });
      }

      if (route === '/api/admin/dishes' && method === 'POST') {
        const input = await body(req);
        let item;
        await update('menu.json', (list) => {
          const category = list.find((entry) => entry.id === input.categoryId);
          if (!category) {
            const error = new Error('Category not found');
            error.status = 404;
            throw error;
          }
          item = checkDish(input);
          category.dishes.push(item);
          return list;
        });
        return reply(res, 201, item);
      }

      match = route.match(/^\/api\/admin\/dishes\/([^/]+)$/);
      if (match && (method === 'PATCH' || method === 'DELETE')) {
        const input = method === 'PATCH' ? await body(req) : null;
        let item;
        await update('menu.json', (list) => {
          const category = list.find((entry) => entry.dishes.some((dish) => dish.id === match[1]));
          if (!category) {
            const error = new Error('Dish not found');
            error.status = 404;
            throw error;
          }

          const index = category.dishes.findIndex((dish) => dish.id === match[1]);

          if (method === 'DELETE') {
            category.dishes.splice(index, 1);
            return list;
          }

          item = checkDish(input, category.dishes[index]);
          if (input.categoryId && input.categoryId !== category.id) {
            const target = list.find((entry) => entry.id === input.categoryId);
            if (!target) {
              const error = new Error('Target category not found');
              error.status = 404;
              throw error;
            }
            category.dishes.splice(index, 1);
            target.dishes.push(item);
          } else {
            category.dishes[index] = item;
          }
          return list;
        });
        return reply(res, 200, { ok: true, item });
      }

      match = route.match(/^\/api\/admin\/feedback\/([^/]+)$/);
      if (match && (method === 'PATCH' || method === 'DELETE')) {
        const input = method === 'PATCH' ? await body(req) : null;
        await update('feedback.json', (list) => {
          const index = list.findIndex((entry) => entry.id === match[1]);
          if (index < 0) {
            const error = new Error('Feedback not found');
            error.status = 404;
            throw error;
          }
          if (method === 'DELETE') {
            list.splice(index, 1);
          } else {
            if (!['new', 'read', 'resolved'].includes(input.status)) {
              throw new Error('Invalid status');
            }
            list[index].status = input.status;
          }
          return list;
        });
        return reply(res, 200, { ok: true });
      }

      if (route === '/api/admin/upload' && method === 'POST') {
        const input = await body(req, 8 * 1024 * 1024);
        const matchUpload = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(input.data || '');
        if (!matchUpload) return fail(res, 400, 'Use a PNG, JPEG or WebP image');

        const bytes = Buffer.from(matchUpload[2], 'base64');
        if (bytes.length > 5 * 1024 * 1024 || bytes.length < 20) {
          return fail(res, 400, 'Image must be below 5 MB');
        }

        const type = matchUpload[1];
        const validSignature = type === 'png'
          ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
          : type === 'jpeg'
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';

        if (!validSignature) return fail(res, 400, 'Invalid image content');

        const filename = `${crypto.randomUUID()}.${type === 'jpeg' ? 'jpg' : type}`;
        await fs.writeFile(path.join(uploadDir, filename), bytes, { flag: 'wx' });
        return reply(res, 201, { url: `/uploads/${filename}` });
      }

      return fail(res, 404, 'Unknown admin route');
    }

    if (route.startsWith('/api/')) {
      return fail(res, 404, 'Unknown API route');
    }

    if (!['GET', 'HEAD'].includes(method)) {
      return fail(res, 405, 'Method not allowed');
    }

    if (route.startsWith('/uploads/')) {
      const name = route.slice(9);
      if (!/^[a-zA-Z0-9-]+\.(png|jpg|webp)$/.test(name)) {
        return fail(res, 404, 'Not found');
      }
      if (await serveFile(res, path.join(uploadDir, name), method === 'HEAD')) return;
      return fail(res, 404, 'Not found');
    }

    const publicPath = route === '/admin' ? '/admin.html' : route;
    if (publicPath.includes('..') || publicPath.includes('\\') || publicPath.startsWith('/data/') || publicPath.startsWith('/src/')) {
      return fail(res, 404, 'Not found');
    }

    const relative = publicPath === '/' ? 'index.html' : publicPath.replace(/^\//, '');

    if (['admin.html', 'admin.js', 'admin.css'].includes(relative)) {
      if (await serveFile(res, path.join(root, 'public', relative), method === 'HEAD', true)) return;
      return fail(res, 404, 'Admin asset not found');
    }

    if (await serveFile(res, path.join(distDir, relative), method === 'HEAD')) return;
    if (await serveFile(res, path.join(root, 'public', relative), method === 'HEAD')) return;
    if (!path.extname(relative) && await serveFile(res, path.join(distDir, 'index.html'), method === 'HEAD')) return;

    return fail(res, 404, 'Not found');
  } catch (error) {
    console.error('Request error:', error.message);
    const known = error.status || (/required|Invalid|price|name|status|password|dollar rate/i.test(error.message) ? 400 : 500);
    return fail(res, known, known === 400 ? error.message : 'Server error');
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, () => console.log(`Al Marsa running on http://localhost:${port}`));
}

export default server;
