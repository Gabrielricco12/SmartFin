import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store de Autenticação
import { useAuthStore } from './stores/useAuthStore';

// Layout Principal
import { AppLayout } from './components/layout/AppLayout';

// Telas (Públicas e Privadas)
import { Login } from './features/auth/Login';
import { UpdatePassword } from './features/auth/UpdatePassword';
import { Dashboard } from './features/dashboard/Dashboard';
import { Accounts } from './features/accounts/Accounts';
import { AccountDetail } from './features/accounts/AccountDetail';
import { Transactions } from './features/transactions/Transactions';
import { Categories } from './features/categories/Categories';

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Inicializa o ouvinte do Supabase assim que o App abre
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Tela de carregamento enquanto o Supabase decide se o usuário tem sessão ou não
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Container global de notificações */}
      <Toaster position="top-right" />
      
      <Routes>
        {/* ==========================================
            ROTAS PÚBLICAS (Abertas para todos)
        ========================================== */}
        
        {/* Se já estiver logado, não tem porque ver o Login, vai pro Dashboard */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* A MÁGICA AQUI: A rota de atualizar a senha fica 100% livre do bloqueio. 
            Assim, o React não expulsa o usuário antes de o Supabase ler o token do e-mail. */}
        <Route 
          path="/update-password" 
          element={<UpdatePassword />} 
        />

        {/* ==========================================
            ROTAS PROTEGIDAS (Só entra se user existir)
        ========================================== */}
        <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          
          {/* Todas as rotas que ficam dentro do Menu Lateral */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          
          {/* Rota raiz "/" redireciona para o Dashboard se estiver logado */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ==========================================
            ROTA FALLBACK (Se o usuário digitar uma URL que não existe)
        ========================================== */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
