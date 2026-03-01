import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Configurações de Estado e Layout
import { useAuthStore } from './stores/useAuthStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Features / Telas
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { Dashboard } from './features/dashboard/Dashboard';
import { Accounts } from './features/accounts/Accounts';
import { AccountDetail } from './features/accounts/AccountDetail';
import { Transactions } from './features/transactions/Transactions';
import { Categories } from './features/categories/Categories';
import { UpdatePassword } from './features/auth/UpdatePassword';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      cleanup.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [initializeAuth]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#333', color: '#fff', borderRadius: '12px' },
          success: { duration: 3000, style: { background: '#059669' } },
          error: { duration: 5000, style: { background: '#dc2626' } },
        }} 
      />
      
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          {/* Rotas Protegidas (Blindadas e com Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/:id" element={<AccountDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
            </Route>
          </Route>

          {/* Fallback de Rota */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
