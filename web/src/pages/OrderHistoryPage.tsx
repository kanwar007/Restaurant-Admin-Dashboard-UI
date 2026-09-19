import { Calendar, Eye, Filter, Printer } from 'lucide-react';
import { useState } from 'react';

import { useOrderHistory } from '../api/hooks';
import { PageHead, QueryState, SearchInput, StatusPill } from '../components/ui';
import { formatCurrency } from '../lib/format';

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const OrderHistoryPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading, error } = useOrderHistory({ search, status });

  return (
    <>
      <PageHead title="Order History" subtitle="View and manage past orders" />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row row-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by order number, table..." />
          <button className="btn btn-outline" type="button">
            <Calendar size={16} />
            Date Range
          </button>
          <button className="btn btn-outline" type="button">
            <Filter size={16} />
            More Filters
          </button>
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={filter.id === status ? 'chip active' : 'chip'}
              onClick={() => setStatus(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {data ? (
        <div className="stack">
          <div className="grid grid-4">
            <div className="card">
              <p className="stat-label" style={{ marginTop: 0 }}>
                Total Orders
              </p>
              <p className="stat-value">{data.summary.totalOrders}</p>
            </div>
            <div className="card">
              <p className="stat-label" style={{ marginTop: 0 }}>
                Completed
              </p>
              <p className="stat-value">{data.summary.completed}</p>
            </div>
            <div className="card">
              <p className="stat-label" style={{ marginTop: 0 }}>
                Cancelled
              </p>
              <p className="stat-value">{data.summary.cancelled}</p>
            </div>
            <div className="card">
              <p className="stat-label" style={{ marginTop: 0 }}>
                Total Revenue
              </p>
              <p className="stat-value amount">{formatCurrency(data.summary.totalRevenue)}</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Table</th>
                  <th>Date &amp; Time</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="strong">{row.orderNo}</td>
                    <td>
                      <span className="tag">{row.table}</span>
                    </td>
                    <td>
                      <div>{row.date}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {row.time}
                      </div>
                    </td>
                    <td className="muted">{row.items} items</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                    <td>
                      <span className={`tag tag-payment-${row.paymentMode}`}>
                        {row.paymentMode.toUpperCase()}
                      </span>
                    </td>
                    <td className="amount">
                      {row.status === 'cancelled' ? '—' : formatCurrency(row.totalAmount)}
                    </td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-icon"
                          type="button"
                          aria-label={`View ${row.orderNo}`}
                        >
                          <Eye size={16} />
                        </button>
                        {row.status === 'completed' ? (
                          <button
                            className="btn btn-outline btn-icon"
                            type="button"
                            aria-label={`Print ${row.orderNo}`}
                          >
                            <Printer size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length === 0 ? <div className="state">No orders match your filters.</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
};
