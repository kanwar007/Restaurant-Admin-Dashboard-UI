import { Image, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  useCategories,
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenu,
  useToggleMenuItem,
} from '../api/hooks';
import { AddDishModal } from '../components/AddDishModal';
import { PageHead, QueryState, SearchInput } from '../components/ui';
import { formatCurrency } from '../lib/format';

export const MenuPage = () => {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: items, isLoading, error } = useMenu({ category, search });
  const toggleItem = useToggleMenuItem();
  const deleteItem = useDeleteMenuItem();
  const createItem = useCreateMenuItem();

  return (
    <>
      <PageHead
        title="Menu Management"
        subtitle="Manage your restaurant menu items and availability"
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            Add New Dish
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row row-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search dishes..." />
          {['All', ...categories].map((name) => (
            <button
              key={name}
              type="button"
              className={name === category ? 'chip active' : 'chip'}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {items?.length === 0 ? <div className="state">No dishes match your filters.</div> : null}

      <div className="grid grid-3">
        {items?.map((item) => (
          <article className="menu-card" key={item.id}>
            <div className={item.available ? 'menu-thumb' : 'menu-thumb unavailable'}>
              <Image size={48} strokeWidth={1.4} />
              {item.available ? null : <span className="out-of-stock">Out of Stock</span>}
              <button
                type="button"
                aria-label={`Toggle availability for ${item.name}`}
                className={item.available ? 'switch on' : 'switch'}
                onClick={() => toggleItem.mutate({ id: item.id, available: !item.available })}
              >
                <span />
              </button>
            </div>
            <div className="menu-body">
              <div className="menu-title-row">
                <h3 className="menu-name">{item.name}</h3>
                <span className="amount">{formatCurrency(item.price)}</span>
              </div>
              <div className="muted" style={{ fontSize: 14 }}>
                {item.category}
              </div>
              <div>
                <span className="tag">{item.addons} Add-ons</span>
              </div>
              <div className="row">
                <button className="btn btn-outline" type="button" style={{ flex: 1 }}>
                  <ListPlus size={16} />
                  Add-ons
                </button>
                <button className="btn btn-outline btn-icon" type="button" aria-label={`Edit ${item.name}`}>
                  <Pencil size={16} />
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <AddDishModal
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSubmit={(dish) => {
            createItem.mutate(dish);
            setModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
};
