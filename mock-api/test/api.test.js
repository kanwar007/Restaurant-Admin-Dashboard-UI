import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../src/server.js';

let baseUrl;
let server;

const call = async (path, init) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
};

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

describe('mock api', () => {
  it('reports health', async () => {
    const { status, body } = await call('/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
  });

  it('filters the menu by category and search', async () => {
    const byCategory = await call('/api/menu?category=Bakery');
    assert.deepEqual(
      byCategory.body.map((item) => item.name),
      ['Croissant', 'Blueberry Muffin'],
    );

    const bySearch = await call('/api/menu?search=latte');
    assert.equal(bySearch.body.length, 1);
    assert.equal(bySearch.body[0].name, 'Latte');
  });

  it('toggles dish availability', async () => {
    const { body } = await call('/api/menu/1', {
      method: 'PATCH',
      body: JSON.stringify({ available: false }),
    });
    assert.equal(body.available, false);
    await call('/api/reset', { method: 'POST' });
  });

  it('moves an order through the rail and rejects unknown statuses', async () => {
    const promoted = await call('/api/orders/1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'kot-printed' }),
    });
    assert.equal(promoted.body.status, 'kot-printed');

    const rejected = await call('/api/orders/1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'flying' }),
    });
    assert.equal(rejected.status, 400);
    await call('/api/reset', { method: 'POST' });
  });

  it('builds a CA bill with split GST', async () => {
    const { body } = await call('/api/bills/%23001?format=ca');
    assert.equal(body.title, 'TAX INVOICE');
    assert.equal(body.totals.subtotal, 520);
    assert.equal(body.totals.cgst + body.totals.sgst, body.totals.gst);
    assert.equal(body.totals.total, body.totals.subtotal + body.totals.gst);
  });

  it('omits pricing from the KOT', async () => {
    const { body } = await call('/api/bills/%23001?format=kot');
    assert.equal(body.showPricing, false);
    assert.equal(body.totals, undefined);
  });

  it('summarises order history', async () => {
    const { body } = await call('/api/order-history?status=completed');
    assert.equal(body.summary.cancelled, 0);
    assert.equal(
      body.summary.totalRevenue,
      body.rows.reduce((sum, row) => sum + row.totalAmount, 0),
    );
  });

  it('clears the current order when a table is vacated', async () => {
    const { body } = await call('/api/tables/3', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'vacant' }),
    });
    assert.equal(body.status, 'vacant');
    assert.equal(body.currentOrder, undefined);
    await call('/api/reset', { method: 'POST' });
  });

  it('signs a user in, resolves the session, and signs out', async () => {
    const login = await call('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.name, 'Admin User');
    assert.equal(login.body.user.password, undefined);

    const auth = { Authorization: `Bearer ${login.body.token}` };
    const me = await call('/api/auth/me', { headers: auth });
    assert.equal(me.body.user.username, 'admin');

    const profile = await call('/api/profile', { headers: auth });
    assert.equal(profile.body.user.name, 'Admin User');

    await call('/api/auth/logout', { method: 'POST', headers: auth });
    const afterLogout = await call('/api/auth/me', { headers: auth });
    assert.equal(afterLogout.status, 401);
  });

  it('rejects bad credentials and unknown sessions', async () => {
    const badPassword = await call('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'nope' }),
    });
    assert.equal(badPassword.status, 401);

    const missingFields = await call('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin' }),
    });
    assert.equal(missingFields.status, 400);

    const noSession = await call('/api/auth/me', { headers: { Authorization: 'Bearer nope' } });
    assert.equal(noSession.status, 401);
  });

  it('accepts a guest order without a session and seats the table', async () => {
    const created = await call('/api/guest/orders', {
      method: 'POST',
      body: JSON.stringify({
        table: 'T-02',
        customerName: 'Vijay',
        items: [{ name: 'Latte', quantity: 2, addons: ['Extra Shot'] }],
      }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.source, 'guest');
    assert.equal(created.body.status, 'new');
    assert.equal(created.body.items[0].quantity, 2);

    const tables = await call('/api/tables');
    const seated = tables.body.find((table) => table.number === 'T-02');
    assert.equal(seated.status, 'occupied');
    assert.equal(seated.currentOrder, created.body.orderNo);

    const orders = await call('/api/orders');
    assert.ok(orders.body.some((order) => order.orderNo === created.body.orderNo));
    await call('/api/reset', { method: 'POST' });
  });

  it('validates guest orders', async () => {
    const noTable = await call('/api/guest/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ name: 'Latte', quantity: 1 }] }),
    });
    assert.equal(noTable.status, 400);

    const noItems = await call('/api/guest/orders', {
      method: 'POST',
      body: JSON.stringify({ table: 'T-02', items: [] }),
    });
    assert.equal(noItems.status, 400);

    const unavailable = await call('/api/guest/orders', {
      method: 'POST',
      body: JSON.stringify({ table: 'T-02', items: [{ name: 'Blueberry Muffin', quantity: 1 }] }),
    });
    assert.equal(unavailable.status, 400);

    const badQuantity = await call('/api/guest/orders', {
      method: 'POST',
      body: JSON.stringify({ table: 'T-02', items: [{ name: 'Latte', quantity: 0 }] }),
    });
    assert.equal(badQuantity.status, 400);
  });

  it('404s unknown endpoints', async () => {
    const { status } = await call('/api/nope');
    assert.equal(status, 404);
  });
});
