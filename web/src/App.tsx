import { Route, Routes } from 'react-router-dom';

import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { AddonsPage } from './pages/AddonsPage';
import { BillingPage } from './pages/BillingPage';
import { DashboardPage } from './pages/DashboardPage';
import { GuestPage } from './pages/GuestPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { OrderRailPage } from './pages/OrderRailPage';
import { TablesPage } from './pages/TablesPage';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/guest" element={<GuestPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="orders" element={<OrderRailPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="addons" element={<AddonsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="history" element={<OrderHistoryPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
