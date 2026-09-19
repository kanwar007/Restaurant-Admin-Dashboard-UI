import { ClipboardList, Clock, IndianRupee, Plus, QrCode, Users, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useDashboard } from '../api/hooks';
import type { DashboardStat } from '../api/types';
import { PageHead, QueryState, StatusPill } from '../components/ui';

const icons = {
  clipboard: ClipboardList,
  users: Users,
  clock: Clock,
  rupee: IndianRupee,
};

const StatCard = ({ stat }: { stat: DashboardStat }) => {
  const Icon = icons[stat.icon];
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={22} />
        </div>
        <span className={`stat-delta ${stat.tone === 'negative' ? 'negative' : ''}`}>{stat.delta}</span>
      </div>
      <p className="stat-label">{stat.label}</p>
      <p className="stat-value">{stat.value}</p>
    </div>
  );
};

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboard();

  return (
    <>
      <PageHead
        title="Dashboard Overview"
        subtitle="Welcome back! Here's what's happening today."
        actions={
          data ? (
            <div className="page-meta">
              {data.businessDate}
              <strong>{data.businessTime}</strong>
            </div>
          ) : null
        }
      />

      <QueryState isLoading={isLoading} error={error} />

      {data ? (
        <div className="stack">
          <div className="grid grid-4">
            {data.stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>

          <section className="card">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions">
              <Link className="btn btn-primary" to="/orders">
                <Plus size={18} />
                Create New Order
              </Link>
              <Link className="btn btn-outline" to="/tables">
                <QrCode size={18} />
                Scan / Generate QR
              </Link>
              <Link className="btn btn-outline" to="/menu">
                <UtensilsCrossed size={18} />
                Manage Menu
              </Link>
            </div>
          </section>

          <section className="card">
            <div className="row">
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                Latest Orders
              </h3>
              <div className="spacer" />
              <Link className="link" to="/history">
                View All Orders →
              </Link>
            </div>
            <div style={{ marginTop: 16 }}>
              {data.latestOrders.map((order) => (
                <div className="order-row" key={order.id}>
                  <span className="order-chip">{order.orderNo}</span>
                  <div>
                    <div className="strong">Table {order.table}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {order.items} items • {order.placedAgo}
                    </div>
                  </div>
                  <div className="spacer" />
                  <StatusPill status={order.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
};
