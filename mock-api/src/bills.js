import { addonPriceFor, priceFor, staticData, store } from './store.js';

const lineTotal = (item) => {
  const addonsTotal = (item.addons ?? []).reduce((sum, name) => sum + addonPriceFor(name), 0);
  return (priceFor(item.name) + addonsTotal) * item.quantity;
};

const round = (value) => Math.round(value);

export const buildBill = (orderNo, format) => {
  const order = store.orders.find((entry) => entry.orderNo === orderNo);
  if (!order) return null;

  const { restaurant } = staticData;
  const lines = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    addons: item.addons ?? [],
    unitPrice: priceFor(item.name),
    amount: lineTotal(item),
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const gst = round(subtotal * restaurant.gstRate);

  const base = {
    format,
    orderNo: order.orderNo,
    table: order.table,
    date: order.date,
    time: order.time,
    notes: order.notes ?? null,
    lines,
    restaurant: {
      name: restaurant.name,
      tagline: restaurant.tagline,
      address: restaurant.address,
      phone: restaurant.phone,
      gstin: restaurant.gstin,
    },
  };

  if (format === 'kot') {
    return { ...base, title: 'KITCHEN ORDER TICKET', showPricing: false };
  }

  if (format === 'ca') {
    const halfGst = round(gst / 2);
    return {
      ...base,
      title: 'TAX INVOICE',
      showPricing: true,
      totals: {
        subtotal,
        cgst: halfGst,
        sgst: gst - halfGst,
        gst,
        total: subtotal + gst,
      },
    };
  }

  if (format === 'restaurant') {
    return {
      ...base,
      title: 'RESTAURANT COPY',
      showPricing: true,
      totals: { subtotal, gst, total: subtotal + gst },
      settlement: { paymentMode: 'upi', server: staticData.user.name },
    };
  }

  return {
    ...base,
    title: restaurant.name,
    showPricing: true,
    totals: { subtotal, gst, total: subtotal + gst },
    footer: 'Thank you for dining with us!',
  };
};
