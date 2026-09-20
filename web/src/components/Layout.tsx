import {
  Coffee,
  FileText,
  History,
  LayoutDashboard,
  ListPlus,
  LogOut,
  ShoppingCart,
  Table2,
  UtensilsCrossed,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useProfile } from '../api/hooks';
import { useAuth } from '../auth/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { to: '/orders', label: 'Order Rail', icon: ShoppingCart },
  { to: '/tables', label: 'Table Management', icon: Table2 },
  { to: '/addons', label: 'Addon Management', icon: ListPlus },
  { to: '/billing', label: 'Billing & Printing', icon: FileText },
  { to: '/history', label: 'Order History', icon: History },
];

export const Layout = () => {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="brand-name">{profile?.restaurant.name ?? 'Café Admin'}</h1>
            <p className="brand-tagline">{profile?.restaurant.tagline ?? 'Restaurant Management'}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="badge-dot" />
          </button>
          <div className="user-chip">
            <div className="avatar">{user?.initials ?? profile?.user.initials ?? 'AD'}</div>
            <div>
              <div className="user-name">{user?.name ?? profile?.user.name ?? 'Admin User'}</div>
              <div className="user-role">{user?.role ?? profile?.user.role ?? 'Manager'}</div>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <nav className="nav">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
