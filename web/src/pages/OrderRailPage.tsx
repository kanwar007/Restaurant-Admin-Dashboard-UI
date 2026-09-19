import { Check, Clock, Pencil, Printer, X } from 'lucide-react';

import { useCancelOrder, useOrders, useUpdateOrderStatus } from '../api/hooks';
import type { Order, OrderStatus } from '../api/types';
import { PageHead, QueryState } from '../components/ui';

const columns: { status: OrderStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'kot-printed', label: 'In Progress' },
  { status: 'served', label: 'Served' },
];

const OrderCard = ({
  order,
  onPrintKot,
  onServe,
  onCancel,
}: {
  order: Order;
  onPrintKot: () => void;
  onServe: () => void;
  onCancel: () => void;
}) => (
  <article className={`rail-card ${order.status}`}>
    <div className="rail-card-head">
      <span className="rail-order-no">{order.orderNo}</span>
      <span className="tag">{order.table}</span>
      <div className="spacer" />
      <span className="rail-time">
        <Clock size={14} />
        {order.time}
      </span>
    </div>

    {order.items.map((item) => (
      <div className="rail-item" key={`${order.id}-${item.name}`}>
        <span className="qty">{item.quantity}x</span>
        <div>
          <div className="strong">{item.name}</div>
          {item.addons?.length ? (
            <div className="rail-item-addons">+ {item.addons.join(', ')}</div>
          ) : null}
        </div>
      </div>
    ))}

    {order.notes ? <div className="rail-note">📝 {order.notes}</div> : null}

    {order.status === 'new' ? (
      <div className="row">
        <button className="btn btn-primary" type="button" style={{ flex: 1 }} onClick={onPrintKot}>
          <Printer size={16} />
          KOT
        </button>
        <button className="btn btn-danger" type="button" aria-label={`Cancel ${order.orderNo}`} onClick={onCancel}>
          <X size={16} />
        </button>
      </div>
    ) : null}

    {order.status === 'kot-printed' ? (
      <div className="row">
        <button className="btn btn-success" type="button" style={{ flex: 1 }} onClick={onServe}>
          <Check size={16} />
          Done
        </button>
        <button className="btn btn-outline btn-icon" type="button" aria-label={`Edit ${order.orderNo}`}>
          <Pencil size={16} />
        </button>
      </div>
    ) : null}

    {order.status === 'served' ? (
      <div className="rail-done">
        <Check size={16} />
        Completed
      </div>
    ) : null}
  </article>
);

export const OrderRailPage = () => {
  const { data: orders, isLoading, error } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  const byStatus = (status: OrderStatus) => orders?.filter((order) => order.status === status) ?? [];

  return (
    <>
      <PageHead
        title="Order Rail"
        actions={
          orders ? (
            <div className="rail-counts">
              <span>
                <i style={{ background: 'var(--status-new)' }} />
                {byStatus('new').length}
              </span>
              <span>
                <i style={{ background: 'var(--status-progress)' }} />
                {byStatus('kot-printed').length}
              </span>
              <span>
                <i style={{ background: 'var(--status-served)' }} />
                {byStatus('served').length}
              </span>
            </div>
          ) : null
        }
      />

      <QueryState isLoading={isLoading} error={error} />

      {orders ? (
        <div className="rail">
          {columns.map(({ status, label }) => (
            <div className="rail-column" key={status}>
              <div className={`rail-header ${status}`}>
                <span className="dot" />
                {label} ({byStatus(status).length})
              </div>
              {byStatus(status).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPrintKot={() => updateStatus.mutate({ id: order.id, status: 'kot-printed' })}
                  onServe={() => updateStatus.mutate({ id: order.id, status: 'served' })}
                  onCancel={() => cancelOrder.mutate(order.id)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};
