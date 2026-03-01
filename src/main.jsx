import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Importe o React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Crie o "Motor de Cache"
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Os dados ficam "frescos" por 5 minutos antes de precisar ir no banco de novo
      refetchOnWindowFocus: false, // Evita recarregar do banco só porque você mudou de aba no Chrome
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Envolva o App com o Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
