import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../src/server.js';

let baseUrl;
let server;

const call = async (path, init) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
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

  it('404s unknown endpoints', async () => {
    const { status } = await call('/api/nope');
    assert.equal(status, 404);
  });
});
