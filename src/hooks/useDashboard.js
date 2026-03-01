import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useDateStore } from '../stores/useDateStore';
import { useRefreshStore } from '../stores/useRefreshStore';

// 1. Extraímos a lógica de busca para que ela possa ser reaproveitada 
// tanto para o mês atual (na tela) quanto para os meses invisíveis (prefetch)
const fetchDashboardData = async (userId, targetDate) => {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  
  const startDateStr = format(monthStart, 'yyyy-MM-dd');
  const endDateStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, amount, type, category, description, date, accounts(name)')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: false });

  if (error) {
    console.error("Erro ao buscar dashboard:", error);
    throw error;
  }

  let income = 0;
  let expense = 0;
  const recentExpenses = [];

  if (transactions) {
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') {
        expense += Number(t.amount);
        if (recentExpenses.length < 10) recentExpenses.push(t);
      }
    });
  }

  return { 
    totalBalance: income - expense, 
    income, 
    expense, 
    recentExpenses 
  };
};

export function useDashboard(userId) {
  const currentDate = useDateStore((state) => state.currentDate);
  const refreshKey = useRefreshStore((state) => state.refreshKey);
  
  // O QueryClient nos dá o poder de manipular o cache diretamente
  const queryClient = useQueryClient();

  // Chave do mês atual
  const monthCacheKey = format(currentDate, 'yyyy-MM');

  // 2. Busca Oficial (A que aparece na tela do usuário)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', userId, monthCacheKey, refreshKey],
    queryFn: () => fetchDashboardData(userId, currentDate),
    enabled: !!userId,
  });

  // 3. PREFETCHING SILENCIOSO (A Mágica da UX Perfeita)
  useEffect(() => {
    if (!userId) return;

    // Função auxiliar para mandar o React Query buscar sem mostrar loading
    const prefetchMonth = (dateToPrefetch) => {
      const key = format(dateToPrefetch, 'yyyy-MM');
      queryClient.prefetchQuery({
        queryKey: ['dashboard', userId, key, refreshKey],
        queryFn: () => fetchDashboardData(userId, dateToPrefetch),
      });
    };

    // Calculamos quem são os "vizinhos" do mês atual
    const nextMonthDate = addMonths(currentDate, 1);
    const prevMonthDate = subMonths(currentDate, 1);

    // Disparamos as buscas ocultas em paralelo
    prefetchMonth(nextMonthDate);
    prefetchMonth(prevMonthDate);
    
  }, [currentDate, userId, refreshKey, queryClient]);

  // Retorno de segurança
  const safeData = data || {
    totalBalance: 0,
    income: 0,
    expense: 0,
    recentExpenses: [],
  };

  return { data: safeData, isLoading };
}
