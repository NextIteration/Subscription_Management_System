import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

import { Dashboard } from './pages/dashboard/Dashboard';
import { CustomerList } from './pages/customers/CustomerList';
import { ProductList } from './pages/products/ProductList';
import { PlanList } from './pages/plans/PlanList';
import { QuotationList } from './pages/quotations/QuotationList';
import { SubscriptionList } from './pages/subscriptions/SubscriptionList';
import { InvoiceList } from './pages/invoices/InvoiceList';
import { PaymentList } from './pages/payments/PaymentList';
import { TaxesDiscountsPage } from './pages/taxes-discounts/TaxesDiscountsPage';
import { FinancialReportsPage } from './pages/reports/FinancialReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Customer Portal Pages
import { CustomerPortalDashboard } from './pages/portal/CustomerPortalDashboard';
import { CustomerMySubscriptions } from './pages/portal/CustomerMySubscriptions';
import { CustomerMyInvoices } from './pages/portal/CustomerMyInvoices';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#dcebf5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0e1013] border-t-transparent animate-spin"></div>
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
};

// Strict Role Guard
const RoleRoute: React.FC<{
  allowedRoles: ('admin' | 'staff' | 'customer')[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser, role, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#dcebf5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0e1013] border-t-transparent animate-spin"></div>
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!allowedRoles.includes(role)) {
    if (role === 'customer') {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Root index route based on authenticated role
const RootIndex: React.FC = () => {
  const { role } = useAuth();
  if (role === 'customer') {
    return <Navigate to="/portal" replace />;
  }
  return <Dashboard />;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* Main Unified App Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Root Index: Admin/Staff -> Dashboard, Customer -> /portal */}
        <Route index element={<RootIndex />} />

        {/* Operational Modules (Admin & Staff) */}
        <Route
          path="customers"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <CustomerList />
            </RoleRoute>
          }
        />
        <Route
          path="quotations"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <QuotationList />
            </RoleRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <SubscriptionList />
            </RoleRoute>
          }
        />
        <Route
          path="invoices"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <InvoiceList />
            </RoleRoute>
          }
        />
        <Route
          path="payments"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <PaymentList />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <FinancialReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleRoute allowedRoles={['admin', 'staff']}>
              <SettingsPage />
            </RoleRoute>
          }
        />

        {/* Admin-Only Management (Products, Plans, Taxes & Discounts per PRD 2.3 & 2.4) */}
        <Route
          path="products"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ProductList />
            </RoleRoute>
          }
        />
        <Route
          path="plans"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <PlanList />
            </RoleRoute>
          }
        />
        <Route
          path="taxes-discounts"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <TaxesDiscountsPage />
            </RoleRoute>
          }
        />

        {/* Customer-Only Self-Service Portal */}
        <Route
          path="portal"
          element={
            <RoleRoute allowedRoles={['customer']}>
              <CustomerPortalDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="portal/subscriptions"
          element={
            <RoleRoute allowedRoles={['customer']}>
              <CustomerMySubscriptions />
            </RoleRoute>
          }
        />
        <Route
          path="portal/invoices"
          element={
            <RoleRoute allowedRoles={['customer']}>
              <CustomerMyInvoices />
            </RoleRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
