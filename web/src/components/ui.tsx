import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

export const PageHead = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="page-head">
    <div>
      <h2 className="page-title">{title}</h2>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
    {actions ? <div className="row row-wrap">{actions}</div> : null}
  </div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="search">
    <Search size={17} />
    <input
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const labels: Record<string, string> = {
  new: 'New',
  'kot-printed': 'KOT Printed',
  served: 'Served',
  vacant: 'Vacant',
  occupied: 'Occupied',
  reserved: 'Reserved',
  'bill-pending': 'Bill Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const StatusPill = ({ status }: { status: string }) => (
  <span className={`pill pill-${status}`}>{labels[status] ?? status}</span>
);

export const QueryState = ({ isLoading, error }: { isLoading: boolean; error: unknown }) => {
  if (isLoading) return <div className="state">Loading…</div>;
  if (error) return <div className="state">Could not load data from the mock API.</div>;
  return null;
};
