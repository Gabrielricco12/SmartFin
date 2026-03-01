import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    // Retornando um loading state centralizado básico com Tailwind v4. 
    // Pode ser substituído por um componente <Spinner /> depois.
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <span className="text-sm font-medium animate-pulse">Verificando sessão...</span>
      </div>
    );
  }

  if (!user) {
    // Redireciona para login e substitui o histórico para evitar que o botão "Voltar" quebre
    return <Navigate to="/login" replace />;
  }

  // Renderiza a rota filha correspondente (ex: /dashboard)
  return <Outlet />;
};