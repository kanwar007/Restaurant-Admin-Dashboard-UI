import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './useAuth';

export const RequireAuth = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <div className="auth-loading">Checking your session…</div>;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
