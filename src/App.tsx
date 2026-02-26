import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { DashboardLayout } from './components/layout';
import { LoginPage } from './pages/auth/LoginPage';
import {
  DashboardPage,
  StoresPage,
  BranchesPage,
  CategoriesPage,
  ItemsPage,
  InventoryPage,
  PosDevicesPage,
  OrdersPage,
  ShiftsPage,
  ReportsPage,
  UsersPage,
  RolesPage,
  AuditPage,
  LossPreventionPage,
} from './pages/dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="stores" element={<StoresPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="pos" element={<PosDevicesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="shifts" element={<ShiftsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="loss-prevention" element={<LossPreventionPage />} />
            </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
