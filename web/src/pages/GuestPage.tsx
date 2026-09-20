import { CheckCircle2, Coffee, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAddons, useCategories, useMenu, usePlaceGuestOrder } from '../api/hooks';
import type { MenuItem, Order } from '../api/types';
import { QueryState, SearchInput } from '../components/ui';
import { formatCurrency } from '../lib/format';

interface CartLine {
  name: string;
  price: number;
  quantity: number;
  addons: string[];
}

const TABLES = Array.from({ length: 12 }, (_, index) => `T-${String(index + 1).padStart(2, '0')}`);

export const GuestPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [table, setTable] = useState(TABLES[0]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [placed, setPlaced] = useState<Order | null>(null);

  const { data: categories } = useCategories();
  const { data: menu, isLoading, error } = useMenu({ category, search });
  const { data: addons } = useAddons();
  const placeOrder = usePlaceGuestOrder();

  const total = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const addonTotal = line.addons.reduce(
          (addonSum, name) => addonSum + (addons?.find((addon) => addon.name === name)?.price ?? 0),
          0,
        );
        return sum + (line.price + addonTotal) * line.quantity;
      }, 0),
    [cart, addons],
  );

  const addonsFor = (dish: string) => addons?.filter((addon) => addon.linkedDishes.includes(dish)) ?? [];

  const addToCart = (item: MenuItem) =>
    setCart((current) => {
      const existing = current.find((line) => line.name === item.name);
      if (existing) {
        return current.map((line) =>
          line.name === item.name ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { name: item.name, price: item.price, quantity: 1, addons: [] }];
    });

  const changeQuantity = (name: string, delta: number) =>
    setCart((current) =>
      current
        .map((line) => (line.name === name ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );

  const toggleAddon = (name: string, addon: string) =>
    setCart((current) =>
      current.map((line) =>
        line.name === name
          ? {
              ...line,
              addons: line.addons.includes(addon)
                ? line.addons.filter((entry) => entry !== addon)
                : [...line.addons, addon],
            }
          : line,
      ),
    );

  const submit = async () => {
    const order = await placeOrder.mutateAsync({
      table,
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
      items: cart.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        addons: line.addons.length ? line.addons : undefined,
      })),
    });
    setPlaced(order);
    setCart([]);
    setNotes('');
  };

  if (placed) {
    return (
      <div className="guest-shell">
        <GuestHeader />
        <main className="guest-main guest-confirmation">
          <div className="card guest-confirm-card">
            <CheckCircle2 size={44} className="confirm-icon" />
            <h2>Order placed</h2>
            <p>
              Your order <strong>{placed.orderNo}</strong> for table <strong>{placed.table}</strong> has
              gone to the kitchen at {placed.time}.
            </p>
            <ul className="confirm-items">
              {placed.items.map((item) => (
                <li key={item.name}>
                  <span className="qty-chip">{item.quantity}x</span> {item.name}
                  {item.addons?.length ? <em> + {item.addons.join(', ')}</em> : null}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary" type="button" onClick={() => setPlaced(null)}>
              Order something else
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="guest-shell">
      <GuestHeader />

      <main className="guest-main">
        <section className="guest-menu">
          <div className="card filter-bar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search the menu..." />
            <div className="chip-row">
              {['All', ...(categories ?? [])].map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={entry === category ? 'chip active' : 'chip'}
                  onClick={() => setCategory(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <QueryState isLoading={isLoading} error={error} />

          <div className="guest-grid">
            {menu?.map((item) => (
              <article key={item.id} className={item.available ? 'card guest-dish' : 'card guest-dish sold-out'}>
                <div className="guest-dish-body">
                  <div>
                    <h3>{item.name}</h3>
                    <p className="muted">{item.category}</p>
                  </div>
                  <span className="amount">{formatCurrency(item.price)}</span>
                </div>
                <button
                  className="btn btn-primary guest-add"
                  type="button"
                  disabled={!item.available}
                  onClick={() => addToCart(item)}
                >
                  <Plus size={16} />
                  {item.available ? 'Add to order' : 'Unavailable'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="card guest-cart">
          <h3 className="cart-title">
            <ShoppingBag size={18} /> Your order
          </h3>

          {cart.length === 0 ? (
            <p className="muted cart-empty">Pick a few dishes to get started.</p>
          ) : (
            <ul className="cart-lines">
              {cart.map((line) => (
                <li key={line.name} className="cart-line">
                  <div className="cart-line-head">
                    <span className="cart-line-name">{line.name}</span>
                    <span className="amount">{formatCurrency(line.price * line.quantity)}</span>
                  </div>
                  <div className="cart-line-controls">
                    <button type="button" aria-label={`Remove one ${line.name}`} onClick={() => changeQuantity(line.name, -1)}>
                      <Minus size={14} />
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label={`Add one ${line.name}`} onClick={() => changeQuantity(line.name, 1)}>
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => changeQuantity(line.name, -line.quantity)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {addonsFor(line.name).length ? (
                    <div className="chip-row">
                      {addonsFor(line.name).map((addon) => (
                        <button
                          key={addon.id}
                          type="button"
                          className={line.addons.includes(addon.name) ? 'chip active' : 'chip'}
                          onClick={() => toggleAddon(line.name, addon.name)}
                        >
                          {addon.name} +{formatCurrency(addon.price)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            <span className="field-label">Table</span>
            <select value={table} onChange={(event) => setTable(event.target.value)}>
              {TABLES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Your name (optional)</span>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Vijay" />
          </label>

          <label className="field">
            <span className="field-label">Notes (optional)</span>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Less sugar" />
          </label>

          <div className="cart-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {placeOrder.error ? (
            <p className="auth-error">{(placeOrder.error as Error).message}</p>
          ) : null}

          <button
            className="btn btn-primary"
            type="button"
            disabled={cart.length === 0 || placeOrder.isPending}
            onClick={submit}
          >
            {placeOrder.isPending ? 'Sending…' : 'Place order'}
          </button>
        </aside>
      </main>
    </div>
  );
};

const GuestHeader = () => (
  <header className="topbar">
    <div className="brand">
      <div className="brand-mark">
        <Coffee size={24} />
      </div>
      <div>
        <h1 className="brand-name">Café Admin</h1>
        <p className="brand-tagline">Order from your table — no sign-in needed</p>
      </div>
    </div>
    <Link className="btn btn-outline" to="/login">
      Staff login
    </Link>
  </header>
);
