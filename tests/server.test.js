import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.js';

describe('Runway Full-Stack API & Server', () => {
  let app;
  let baseUrl;
  let tmpDir;
  let sidCookie;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-test-'));
    app = createApp({
      dbPath: path.join(tmpDir, 'test-runway.db'),
      publicDir: path.resolve('public')
    });
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    const { port } = app.server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await app.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /api/health returns ok: true', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });

  it('GET / serves index.html and sets HttpOnly rw_sid cookie', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const setCookie = res.headers.get('set-cookie') || '';
    assert.match(setCookie, /rw_sid=[0-9a-f-]{36}/i);
    assert.match(setCookie, /HttpOnly/i);
    sidCookie = setCookie.split(';')[0];

    const html = await res.text();
    assert.match(html, /<runway-section\b/);
    assert.match(html, /\/css\/runway\.css/);
    assert.match(html, /\/css\/archive\.css/);
    assert.match(html, /\/js\/app\.js/);
  });

  it('serves split static CSS/JS modules and blocks path traversal', async () => {
    const cssRes = await fetch(`${baseUrl}/css/archive.css`);
    assert.equal(cssRes.status, 200);
    assert.match(cssRes.headers.get('content-type') || '', /text\/css/);

    const jsRes = await fetch(`${baseUrl}/js/runway-section.js`);
    assert.equal(jsRes.status, 200);
    assert.match(jsRes.headers.get('content-type') || '', /application\/javascript/);
    assert.match(await jsRes.text(), /customElements\.define\('runway-section'/);

    const traversalRes = await fetch(`${baseUrl}/js/../server.js`);
    assert.equal(traversalRes.status, 404);
  });

  it('GET /api/catalog returns 6 looks and 8 items', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(res.status, 200);
    const catalog = await res.json();
    assert.equal(catalog.looks.length, 6);
    assert.equal(catalog.items.length, 8);
  });

  it('GET /api/bag starts empty for the session', async () => {
    const res = await fetch(`${baseUrl}/api/bag`, {
      headers: { Cookie: sidCookie }
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { items: [] });
  });

  it('POST /api/bag/items rejects invalid payloads and unknown variants', async () => {
    for (const payload of [
      { items: [] },
      { items: [{ id: 99999999999999, quantity: 1 }] },
      { items: [{ id: 57015167090993, quantity: 0 }] },
      { items: [{ id: 57015167090993, quantity: 21 }] }
    ]) {
      const res = await fetch(`${baseUrl}/api/bag/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sidCookie },
        body: JSON.stringify(payload)
      });
      assert.equal(res.status, 400);
    }
  });

  it('POST /api/bag/items persists items, caps quantity at 20, and isolates sessions', async () => {
    const addRes = await fetch(`${baseUrl}/api/bag/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sidCookie },
      body: JSON.stringify({ items: [{ id: 57015167090993, quantity: 1 }] })
    });
    assert.equal(addRes.status, 200);
    assert.deepEqual(await addRes.json(), { items: [{ id: 57015167090993, quantity: 1 }] });

    const bumpRes = await fetch(`${baseUrl}/api/bag/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sidCookie },
      body: JSON.stringify({ items: [{ id: 57015167090993, quantity: 20 }] })
    });
    assert.equal(bumpRes.status, 200);
    assert.deepEqual(await bumpRes.json(), { items: [{ id: 57015167090993, quantity: 20 }] });

    const otherBagRes = await fetch(`${baseUrl}/api/bag`);
    assert.equal(otherBagRes.status, 200);
    assert.deepEqual(await otherBagRes.json(), { items: [] });
  });

  it('GET /api/bag/export returns formatted text shortlist for the saved session', async () => {
    const res = await fetch(`${baseUrl}/api/bag/export`, {
      headers: { Cookie: sidCookie }
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/plain/);
    assert.match(res.headers.get('content-disposition') || '', /runway-outfit-shortlist\.txt/);
    const text = await res.text();
    assert.match(text, /RUNWAY — STYLING SHORTLIST/);
    assert.match(text, /Air Jordan 12 Retro · Size 42 · Quantity 20/);
    assert.match(text, /https:\/\/nike-makknzjs\.myshopify\.com\/products\/tatum-5-orbit-copy/);
  });

  it('DELETE /api/bag/items/:id validates id and removes saved item', async () => {
    const badRes = await fetch(`${baseUrl}/api/bag/items/not-a-number`, {
      method: 'DELETE',
      headers: { Cookie: sidCookie }
    });
    assert.equal(badRes.status, 400);

    const delRes = await fetch(`${baseUrl}/api/bag/items/57015167090993`, {
      method: 'DELETE',
      headers: { Cookie: sidCookie }
    });
    assert.equal(delRes.status, 200);
    assert.deepEqual(await delRes.json(), { items: [] });

    const checkRes = await fetch(`${baseUrl}/api/bag`, {
      headers: { Cookie: sidCookie }
    });
    assert.deepEqual(await checkRes.json(), { items: [] });
  });
});

