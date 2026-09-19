import {
  addons,
  categories,
  dashboard,
  menuItems,
  orderHistory,
  orders,
  restaurant,
  tables,
  user,
} from './data.js';

const clone = (value) => structuredClone(value);

const createState = () => ({
  menuItems: clone(menuItems),
  addons: clone(addons),
  orders: clone(orders),
  tables: clone(tables),
  orderHistory: clone(orderHistory),
});

let state = createState();

export const store = {
  reset() {
    state = createState();
  },
  get menuItems() {
    return state.menuItems;
  },
  get addons() {
    return state.addons;
  },
  get orders() {
    return state.orders;
  },
  get tables() {
    return state.tables;
  },
  get orderHistory() {
    return state.orderHistory;
  },
  nextId(collection) {
    return String(collection.reduce((max, entry) => Math.max(max, Number(entry.id) || 0), 0) + 1);
  },
};

export const staticData = { restaurant, user, categories, dashboard };

export const priceFor = (dishName) =>
  state.menuItems.find((item) => item.name === dishName)?.price ?? 0;

export const addonPriceFor = (addonName) =>
  state.addons.find((addon) => addon.name === addonName)?.price ?? 0;
