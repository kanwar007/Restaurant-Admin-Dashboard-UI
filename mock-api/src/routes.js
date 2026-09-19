import { buildBill } from './bills.js';
import { staticData, store } from './store.js';

const notFound = { status: 404, body: { error: 'Not found' } };
const badRequest = (message) => ({ status: 400, body: { error: message } });

const matches = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase());

export const routes = [
  {
    method: 'GET',
    path: /^\/api\/health$/,
    handle: () => ({ status: 200, body: { status: 'ok', uptime: process.uptime() } }),
  },
  {
    method: 'GET',
    path: /^\/api\/profile$/,
    handle: () => ({ status: 200, body: { restaurant: staticData.restaurant, user: staticData.user } }),
  },
  {
    method: 'GET',
    path: /^\/api\/dashboard$/,
    handle: () => ({ status: 200, body: staticData.dashboard }),
  },
  {
    method: 'GET',
    path: /^\/api\/menu\/categories$/,
    handle: () => ({ status: 200, body: staticData.categories }),
  },
  {
    method: 'GET',
    path: /^\/api\/menu$/,
    handle: (_params, query) => {
      const category = query.get('category');
      const search = query.get('search') ?? '';
      const items = store.menuItems
        .filter((item) => !category || category === 'All' || item.category === category)
        .filter((item) => !search || matches(item.name, search));
      return { status: 200, body: items };
    },
  },
  {
    method: 'POST',
    path: /^\/api\/menu$/,
    handle: (_params, _query, body) => {
      if (!body?.name || !body?.category || typeof body?.price !== 'number') {
        return badRequest('name, category and price are required');
      }
      const item = {
        id: store.nextId(store.menuItems),
        name: body.name,
        category: body.category,
        price: body.price,
        available: body.available ?? true,
        addons: body.addons ?? 0,
      };
      store.menuItems.push(item);
      return { status: 201, body: item };
    },
  },
  {
    method: 'PATCH',
    path: /^\/api\/menu\/([^/]+)$/,
    handle: (params, _query, body) => {
      const item = store.menuItems.find((entry) => entry.id === params[0]);
      if (!item) return notFound;
      Object.assign(item, body, { id: item.id });
      return { status: 200, body: item };
    },
  },
  {
    method: 'DELETE',
    path: /^\/api\/menu\/([^/]+)$/,
    handle: (params) => {
      const index = store.menuItems.findIndex((entry) => entry.id === params[0]);
      if (index === -1) return notFound;
      store.menuItems.splice(index, 1);
      return { status: 204, body: null };
    },
  },
  {
    method: 'GET',
    path: /^\/api\/addons$/,
    handle: (_params, query) => {
      const search = query.get('search') ?? '';
      const items = store.addons.filter((addon) => !search || matches(addon.name, search));
      return { status: 200, body: items };
    },
  },
  {
    method: 'POST',
    path: /^\/api\/addons$/,
    handle: (_params, _query, body) => {
      if (!body?.name || typeof body?.price !== 'number') {
        return badRequest('name and price are required');
      }
      const addon = {
        id: store.nextId(store.addons),
        name: body.name,
        price: body.price,
        linkedDishes: body.linkedDishes ?? [],
      };
      store.addons.push(addon);
      return { status: 201, body: addon };
    },
  },
  {
    method: 'PATCH',
    path: /^\/api\/addons\/([^/]+)$/,
    handle: (params, _query, body) => {
      const addon = store.addons.find((entry) => entry.id === params[0]);
      if (!addon) return notFound;
      Object.assign(addon, body, { id: addon.id });
      return { status: 200, body: addon };
    },
  },
  {
    method: 'DELETE',
    path: /^\/api\/addons\/([^/]+)$/,
    handle: (params) => {
      const index = store.addons.findIndex((entry) => entry.id === params[0]);
      if (index === -1) return notFound;
      store.addons.splice(index, 1);
      return { status: 204, body: null };
    },
  },
  {
    method: 'GET',
    path: /^\/api\/orders$/,
    handle: () => ({ status: 200, body: store.orders }),
  },
  {
    method: 'PATCH',
    path: /^\/api\/orders\/([^/]+)\/status$/,
    handle: (params, _query, body) => {
      const allowed = ['new', 'kot-printed', 'served'];
      if (!allowed.includes(body?.status)) return badRequest(`status must be one of ${allowed.join(', ')}`);
      const order = store.orders.find((entry) => entry.id === params[0]);
      if (!order) return notFound;
      order.status = body.status;
      return { status: 200, body: order };
    },
  },
  {
    method: 'DELETE',
    path: /^\/api\/orders\/([^/]+)$/,
    handle: (params) => {
      const index = store.orders.findIndex((entry) => entry.id === params[0]);
      if (index === -1) return notFound;
      store.orders.splice(index, 1);
      return { status: 204, body: null };
    },
  },
  {
    method: 'GET',
    path: /^\/api\/tables$/,
    handle: () => ({ status: 200, body: store.tables }),
  },
  {
    method: 'POST',
    path: /^\/api\/tables$/,
    handle: (_params, _query, body) => {
      if (typeof body?.capacity !== 'number') return badRequest('capacity is required');
      const id = store.nextId(store.tables);
      const table = {
        id,
        number: body.number ?? `T-${id.padStart(2, '0')}`,
        capacity: body.capacity,
        status: 'vacant',
      };
      store.tables.push(table);
      return { status: 201, body: table };
    },
  },
  {
    method: 'PATCH',
    path: /^\/api\/tables\/([^/]+)$/,
    handle: (params, _query, body) => {
      const allowed = ['vacant', 'occupied', 'reserved', 'bill-pending'];
      const table = store.tables.find((entry) => entry.id === params[0]);
      if (!table) return notFound;
      if (body?.status && !allowed.includes(body.status)) {
        return badRequest(`status must be one of ${allowed.join(', ')}`);
      }
      if (body?.status === 'vacant') delete table.currentOrder;
      Object.assign(table, body, { id: table.id });
      return { status: 200, body: table };
    },
  },
  {
    method: 'GET',
    path: /^\/api\/order-history$/,
    handle: (_params, query) => {
      const search = query.get('search') ?? '';
      const status = query.get('status');
      const rows = store.orderHistory
        .filter((entry) => !status || status === 'all' || entry.status === status)
        .filter((entry) => !search || matches(entry.orderNo, search) || matches(entry.table, search));
      return {
        status: 200,
        body: {
          rows,
          summary: {
            totalOrders: rows.length,
            completed: rows.filter((entry) => entry.status === 'completed').length,
            cancelled: rows.filter((entry) => entry.status === 'cancelled').length,
            totalRevenue: rows.reduce((sum, entry) => sum + entry.totalAmount, 0),
          },
        },
      };
    },
  },
  {
    method: 'GET',
    path: /^\/api\/bills\/([^/]+)$/,
    handle: (params, query) => {
      const allowed = ['kot', 'customer', 'ca', 'restaurant'];
      const format = query.get('format') ?? 'kot';
      if (!allowed.includes(format)) return badRequest(`format must be one of ${allowed.join(', ')}`);
      const bill = buildBill(decodeURIComponent(params[0]), format);
      if (!bill) return notFound;
      return { status: 200, body: bill };
    },
  },
  {
    method: 'POST',
    path: /^\/api\/reset$/,
    handle: () => {
      store.reset();
      return { status: 200, body: { status: 'reset' } };
    },
  },
];
