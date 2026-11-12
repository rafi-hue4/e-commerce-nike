import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_BAG_ENTRIES = 50;

export const CATALOG = {
  source: 'https://nike-makknzjs.myshopify.com/pages/runway',
  looks: [
    { name: 'The City Edit', description: 'A charcoal knit and easy denim.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-1.webp', products: ['tatum-5-orbit-copy', 'tshirt', 'sweatshirt'] },
    { name: 'Gallery Opening', description: 'A clean white tee and relaxed denim.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-5.webp', products: ['tatum-5-orbit', 'hoodie-black', 'tshirt'] },
    { name: 'Gallery Opening', description: 'Olive knitwear. A grounded palette.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-4.webp', products: ['sweatshirt-plus', 'tatum-5-orbit', 'tshirt'] },
    { name: 'Studio Day', description: 'Black, white and laid-back denim.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-6.webp', products: ['hoodie-black', 'tatum-5-orbit-copy', 'tshirt'] },
    { name: 'Studio Day', description: 'Burgundy layers. A tailored perspective.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-3.webp', products: ['sweatshirt', 'tatum-5-orbit', 'tshirt'] },
    { name: 'Studio Day', description: 'A grey crew and your favourite denim.', image: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-2.webp', products: ['hoodie', 'air-jordan-12-retro-copy', 'tshirt'] }
  ],
  items: [
    {
      id: 'tatum-5-orbit-copy', name: 'Air Jordan 12 Retro', type: 'From the original lookbook', price: 149.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit-copy.webp',
      sizes: ['40', '41', '42', '43', '44', '45', '46'],
      variants: [
        { id: 57015167025457, a: true, o: ['40'] }, { id: 57015167058225, a: true, o: ['41'] },
        { id: 57015167090993, a: true, o: ['42'] }, { id: 57015167123761, a: true, o: ['43'] },
        { id: 57015167156529, a: true, o: ['44'] }, { id: 57015167189297, a: true, o: ['45'] },
        { id: 57015167222065, a: true, o: ['46'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy'
    },
    {
      id: 'tshirt', name: 'Tshirt', type: 'From the original lookbook', price: 199.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tshirt.webp',
      sizes: ['S', 'L', 'M', 'XL'],
      variants: [
        { id: 56835911582001, a: true, o: ['S'] }, { id: 56835911614769, a: true, o: ['L'] },
        { id: 56835911647537, a: true, o: ['M'] }, { id: 56835911680305, a: true, o: ['XL'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/tshirt'
    },
    {
      id: 'sweatshirt', name: 'Sweatshirt', type: 'From the original lookbook', price: 199.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt.webp',
      sizes: ['S', 'L', 'M', 'XL'],
      variants: [
        { id: 56835806396721, a: true, o: ['S'] }, { id: 56835806429489, a: true, o: ['L'] },
        { id: 56835806462257, a: true, o: ['M'] }, { id: 56835806495025, a: true, o: ['XL'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt'
    },
    {
      id: 'tatum-5-orbit', name: 'Tatum 5 Orbit', type: 'From the original lookbook', price: 149.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit.webp',
      sizes: ['40', '41', '42', '43', '44', '45', '46'],
      variants: [
        { id: 57015166730545, a: true, o: ['40'] }, { id: 57015166763313, a: true, o: ['41'] },
        { id: 57015166796081, a: true, o: ['42'] }, { id: 57015166828849, a: true, o: ['43'] },
        { id: 57015166861617, a: true, o: ['44'] }, { id: 57015166894385, a: true, o: ['45'] },
        { id: 57015166927153, a: true, o: ['46'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit'
    },
    {
      id: 'hoodie-black', name: 'Hoodie Black', type: 'From the original lookbook', price: 199.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie-black.webp',
      sizes: ['S', 'L', 'M', 'XL'],
      variants: [
        { id: 56836251681073, a: true, o: ['S'] }, { id: 56836251713841, a: true, o: ['L'] },
        { id: 56836251746609, a: true, o: ['M'] }, { id: 56836251779377, a: true, o: ['XL'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black'
    },
    {
      id: 'sweatshirt-plus', name: 'Sweatshirt Plus', type: 'From the original lookbook', price: 199.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt-plus.webp',
      sizes: ['S', 'L', 'M', 'XL'],
      variants: [
        { id: 56836143743281, a: true, o: ['S'] }, { id: 56836143776049, a: true, o: ['L'] },
        { id: 56836143808817, a: true, o: ['M'] }, { id: 56836143841585, a: true, o: ['XL'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus'
    },
    {
      id: 'hoodie', name: 'Hoodie', type: 'From the original lookbook', price: 199.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie.webp',
      sizes: ['S', 'L', 'M', 'XL'],
      variants: [
        { id: 56836002185521, a: true, o: ['S'] }, { id: 56836002218289, a: true, o: ['L'] },
        { id: 56836002251057, a: true, o: ['M'] }, { id: 56836002283825, a: true, o: ['XL'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/hoodie'
    },
    {
      id: 'air-jordan-12-retro-copy', name: 'Luka 5', type: 'From the original lookbook', price: 149.0,
      image: 'https://reel-ref-try-the-look.vercel.app/assets/source-air-jordan-12-retro-copy.webp',
      sizes: ['40', '41', '42', '43', '44', '45', '46'],
      variants: [
        { id: 57015176364337, a: true, o: ['40'] }, { id: 57015176397105, a: true, o: ['41'] },
        { id: 57015176429873, a: true, o: ['42'] }, { id: 57015176462641, a: true, o: ['43'] },
        { id: 57015176495409, a: true, o: ['44'] }, { id: 57015176528177, a: true, o: ['45'] },
        { id: 57015176560945, a: true, o: ['46'] }
      ],
      url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy'
    }
  ]
};

const variantMap = new Map();
for (const item of CATALOG.items) {
  for (const variant of item.variants) {
    variantMap.set(variant.id, { item, variant });
  }
}

function getSessionId(req, res) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === 'rw_sid') {
      const val = decodeURIComponent(rest.join('='));
      if (UUID_RE.test(val)) return val;
    }
  }
  const sid = crypto.randomUUID();
  res.setHeader('Set-Cookie', `rw_sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
  return sid;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', () => reject(Object.assign(new Error('Request error'), { status: 400 })));
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

export function createApp({
  dbPath = path.join(__dirname, 'data', 'runway.db'),
  publicDir = path.join(__dirname, 'public')
} = {}) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bag_items (
      session_id TEXT NOT NULL,
      variant_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (session_id, variant_id)
    );
  `);

  const qList = db.prepare('SELECT variant_id AS id, quantity FROM bag_items WHERE session_id = ? ORDER BY rowid ASC');
  const qCount = db.prepare('SELECT COUNT(*) AS cnt FROM bag_items WHERE session_id = ?');
  const qExists = db.prepare('SELECT 1 FROM bag_items WHERE session_id = ? AND variant_id = ?');
  const qUpsert = db.prepare(`
    INSERT INTO bag_items (session_id, variant_id, quantity, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(session_id, variant_id) DO UPDATE SET
      quantity = MIN(20, bag_items.quantity + excluded.quantity),
      updated_at = excluded.updated_at
  `);
  const qDelete = db.prepare('DELETE FROM bag_items WHERE session_id = ? AND variant_id = ?');

  const indexHtmlPath = path.join(publicDir, 'index.html');
  const publicRoot = path.resolve(publicDir);
  const catalogJson = JSON.stringify(CATALOG);
  const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const pathname = url.pathname;

      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'GET' && pathname === '/api/catalog') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.end(catalogJson);
      }

      if (pathname === '/api/bag' && req.method === 'GET') {
        const sid = getSessionId(req, res);
        return sendJson(res, 200, { items: qList.all(sid) });
      }

      if (pathname === '/api/bag/items' && req.method === 'POST') {
        const sid = getSessionId(req, res);
        const body = await readJsonBody(req);
        if (!body || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_BAG_ENTRIES) {
          return sendJson(res, 400, { error: 'Please choose an available size.' });
        }

        const parsed = [];
        for (const entry of body.items) {
          const id = Number(entry?.id);
          const qty = entry?.quantity === undefined ? 1 : Number(entry.quantity);
          const hit = variantMap.get(id);
          if (!Number.isSafeInteger(id) || !hit || !hit.variant.a || !Number.isSafeInteger(qty) || qty < 1 || qty > 20) {
            return sendJson(res, 400, { error: 'Please choose an available size.' });
          }
          parsed.push({ id, qty });
        }

        const now = new Date().toISOString();
        db.exec('BEGIN');
        try {
          let currentCount = qCount.get(sid).cnt;
          const seenNew = new Set();
          for (const { id } of parsed) {
            if (!qExists.get(sid, id) && !seenNew.has(id)) {
              seenNew.add(id);
              currentCount++;
            }
          }
          if (currentCount > MAX_BAG_ENTRIES) {
            db.exec('ROLLBACK');
            return sendJson(res, 400, { error: 'Your styling bag is full.' });
          }
          for (const { id, qty } of parsed) {
            qUpsert.run(sid, id, qty, now);
          }
          db.exec('COMMIT');
        } catch (err) {
          try { db.exec('ROLLBACK'); } catch { }
          throw err;
        }

        return sendJson(res, 200, { items: qList.all(sid) });
      }

      if (pathname.startsWith('/api/bag/items/') && req.method === 'DELETE') {
        const sid = getSessionId(req, res);
        const id = Number(pathname.slice('/api/bag/items/'.length));
        if (!Number.isSafeInteger(id) || id <= 0) {
          return sendJson(res, 400, { error: 'Invalid item id.' });
        }
        qDelete.run(sid, id);
        return sendJson(res, 200, { items: qList.all(sid) });
      }

      if (pathname === '/api/bag/export' && req.method === 'GET') {
        const sid = getSessionId(req, res);
        const entries = qList.all(sid);
        const parts = [
          'RUNWAY — STYLING SHORTLIST',
          'Reference prices; no order or payment has been placed.',
          ''
        ];
        for (const entry of entries) {
          const hit = variantMap.get(entry.id);
          if (!hit) continue;
          parts.push(`${hit.item.name} · Size ${hit.variant.o.join(' / ')} · Quantity ${entry.quantity}\n${hit.item.url}`);
        }
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="runway-outfit-shortlist.txt"',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store'
        });
        return res.end(parts.join('\n\n'));
      }

      if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        getSessionId(req, res);
        const html = fs.readFileSync(indexHtmlPath);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.end(html);
      }

      if (req.method === 'GET' && (pathname.startsWith('/css/') || pathname.startsWith('/js/'))) {
        const ext = path.extname(pathname);
        const mime = MIME_TYPES[ext];
        if (mime) {
          const target = path.resolve(publicRoot, '.' + pathname);
          if (target.startsWith(publicRoot + path.sep) && fs.existsSync(target) && fs.statSync(target).isFile()) {
            res.writeHead(200, {
              'Content-Type': mime,
              'X-Content-Type-Options': 'nosniff'
            });
            return res.end(fs.readFileSync(target));
          }
        }
      }

      if (pathname.startsWith('/api/')) {
        return sendJson(res, 404, { error: 'Not found' });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    } catch (err) {
      const status = err?.status || 500;
      return sendJson(res, status, { error: status === 500 ? 'Internal server error' : err.message });
    }
  });

  return {
    server,
    db,
    close() {
      return new Promise((resolve) => {
        server.close(() => {
          try { db.close(); } catch { }
          resolve();
        });
      });
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  const { server } = createApp();
  server.listen(port, () => {
    console.log(`Try the Look — Runway running at http://localhost:${port}`);
  });
}

