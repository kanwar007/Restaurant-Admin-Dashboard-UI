import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useAddons, useCreateAddon, useDeleteAddon } from '../api/hooks';
import { PageHead, QueryState, SearchInput } from '../components/ui';
import { formatCurrency } from '../lib/format';

export const AddonsPage = () => {
  const [search, setSearch] = useState('');
  const { data: addons, isLoading, error } = useAddons(search);
  const createAddon = useCreateAddon();
  const deleteAddon = useDeleteAddon();

  return (
    <>
      <PageHead
        title="Addon Management"
        subtitle="Manage add-ons and their linked dishes"
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => createAddon.mutate({ name: 'New Addon', price: 25, linkedDishes: [] })}
          >
            <Plus size={18} />
            Add New Addon
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search add-ons..." />
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {addons ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Addon Name</th>
                <th>Price</th>
                <th>Linked Dishes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.id}>
                  <td className="strong">{addon.name}</td>
                  <td className="amount">{formatCurrency(addon.price)}</td>
                  <td>
                    <div className="row row-wrap" style={{ gap: 8 }}>
                      {addon.linkedDishes.map((dish) => (
                        <span className="tag" key={dish}>
                          {dish}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-icon" type="button" aria-label={`Edit ${addon.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        aria-label={`Delete ${addon.name}`}
                        onClick={() => deleteAddon.mutate(addon.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
};
