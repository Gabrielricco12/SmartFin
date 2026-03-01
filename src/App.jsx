import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store de Autenticação
import { useAuthStore } from './stores/useAuthStore';

// Layout Principal (Menu lateral e barra inferior)
import { AppLayout } from './components/layout/AppLayout';

// Telas de Autenticação (Públicas)
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register'; // <-- RESTAURADO
import { ForgotPassword } from './features/auth/ForgotPassword'; // <-- RESTAURADO
import { UpdatePassword } from './features/auth/UpdatePassword';

// Telas do Sistema (Protegidas)
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
        
        {/* Login */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Cadastro (Register) */}
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Esqueci a Senha */}
        <Route 
          path="/forgot-password" 
          element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Atualizar Senha (Vindo do link do e-mail - DEVE ser 100% pública) 
            Nota: Aqui NÃO colocamos o validador "!user", porque ao clicar no e-mail 
            o Supabase injeta o usuário na sessão. Se bloquearmos, a tela não abre. */}
        <Route 
          path="/update-password" 
          element={<UpdatePassword />} 
        />

        {/* ==========================================
            ROTAS PROTEGIDAS (Só entra se user existir)
        ========================================== */}
        <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          
          {/* Rota raiz "/" redireciona para o Dashboard se estiver logado */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ==========================================
            ROTA FALLBACK (Se digitar URL inexistente)
        ========================================== */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
