import { Plus, QrCode, Users } from 'lucide-react';

import { useCreateTable, useTables, useUpdateTable } from '../api/hooks';
import type { TableStatus } from '../api/types';
import { PageHead, QueryState, StatusPill } from '../components/ui';

const legend: { status: TableStatus; label: string; color: string }[] = [
  { status: 'vacant', label: 'Vacant', color: 'var(--status-served)' },
  { status: 'occupied', label: 'Occupied', color: 'var(--status-progress)' },
  { status: 'reserved', label: 'Reserved', color: 'var(--status-new)' },
  { status: 'bill-pending', label: 'Bill Pending', color: '#f6274e' },
];

export const TablesPage = () => {
  const { data: tables, isLoading, error } = useTables();
  const updateTable = useUpdateTable();
  const createTable = useCreateTable();

  const countOf = (status: TableStatus) => tables?.filter((table) => table.status === status).length ?? 0;

  return (
    <>
      <PageHead
        title="Table Management"
        subtitle="Manage table status and generate QR codes"
        actions={
          <>
            <button className="btn btn-outline" type="button">
              <QrCode size={18} />
              Generate QR Code
            </button>
            <button className="btn btn-primary" type="button" onClick={() => createTable.mutate({ capacity: 4 })}>
              <Plus size={18} />
              Add New Table
            </button>
          </>
        }
      />

      <QueryState isLoading={isLoading} error={error} />

      {tables ? (
        <div className="stack">
          <div className="grid grid-4">
            {legend.map(({ status, label, color }) => (
              <div className="card legend-card" key={status}>
                <div className="legend-top">
                  <i style={{ background: color }} />
                  {label}
                </div>
                <strong>{countOf(status)}</strong>
              </div>
            ))}
          </div>

          <div className="grid grid-4">
            {tables.map((table) => (
              <article className="table-card" key={table.id}>
                <div className="row">
                  <h3 className="table-number">{table.number}</h3>
                  <div className="spacer" />
                  <StatusPill status={table.status} />
                </div>

                <div className="row muted" style={{ fontSize: 14 }}>
                  <Users size={16} />
                  {table.capacity} seats
                </div>

                {table.currentOrder ? (
                  <div className="current-order">
                    <span>Current Order</span>
                    <strong>{table.currentOrder}</strong>
                  </div>
                ) : null}

                <div className="row">
                  <button className="btn btn-outline" type="button" style={{ flex: 1 }}>
                    <QrCode size={16} />
                    QR Code
                  </button>
                  {table.status === 'vacant' ? (
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => updateTable.mutate({ id: table.id, status: 'reserved' })}
                    >
                      Reserve
                    </button>
                  ) : null}
                  {table.status === 'bill-pending' ? (
                    <button
                      className="btn btn-success"
                      type="button"
                      onClick={() => updateTable.mutate({ id: table.id, status: 'vacant' })}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};
