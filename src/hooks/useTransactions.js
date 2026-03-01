import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDateStore } from '../stores/useDateStore';
import { useRefreshStore } from '../stores/useRefreshStore';

// 1. Função de busca separada (para servir à tela e ao Prefetching invisível)
const fetchTransactionsData = async (userId, targetDate, searchTerm = '', page = 1, limit = 15) => {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const startDateStr = format(monthStart, 'yyyy-MM-dd');
  const endDateStr = format(monthEnd, 'yyyy-MM-dd');

  // A. CÁLCULO DO BALANÇO GERAL DO MÊS
  const { data: balanceData, error: balanceError } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  if (balanceError) throw balanceError;

  let income = 0; 
  let expense = 0;
  if (balanceData) {
    balanceData.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expense += Number(t.amount);
    });
  }

  // B. BUSCA DA LISTAGEM PAGINADA E FILTRADA
  let query = supabase
    .from('transactions')
    .select('id, user_id, amount, type, category, description, date, installment_current, installment_total, account_id, payment_method_id, accounts(name)', { count: 'exact' })
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: false });

  if (searchTerm) {
    query = query.ilike('description', `%${searchTerm}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: transactions, count, error: listError } = await query;

  if (listError) throw listError;

  const grouped = {};
  if (transactions) {
    transactions.forEach(t => {
      const dateKey = t.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    });
  }

  return { 
    data: { transactionsByDate: grouped, income, expense, balance: income - expense },
    pagination: { totalPages: Math.ceil((count || 0) / limit), currentPage: page, totalItems: count || 0 }
  };
};

export function useTransactions(userId, searchTerm = '', page = 1, limit = 15) {
  const currentDate = useDateStore((state) => state.currentDate);
  const refreshKey = useRefreshStore((state) => state.refreshKey);
  const queryClient = useQueryClient();

  const monthCacheKey = format(currentDate, 'yyyy-MM');

  // 2. BUSCA OFICIAL DA TELA
  const { data: queryResult, isLoading } = useQuery({
    // A QueryKey agora inclui pesquisa e paginação para separar os caches perfeitamente!
    queryKey: ['transactions', userId, monthCacheKey, searchTerm, page, limit, refreshKey],
    queryFn: () => fetchTransactionsData(userId, currentDate, searchTerm, page, limit),
    enabled: !!userId,
  });

  // 3. PREFETCHING INTELIGENTE EM DOIS NÍVEIS
  useEffect(() => {
    if (!userId) return;

    // Nível A: Pré-carregar os meses vizinhos (sempre na página 1 e sem pesquisa, que é o padrão ao trocar de mês)
    const prefetchAdjacentMonth = (dateToPrefetch) => {
      const key = format(dateToPrefetch, 'yyyy-MM');
      queryClient.prefetchQuery({
        queryKey: ['transactions', userId, key, '', 1, limit, refreshKey],
        queryFn: () => fetchTransactionsData(userId, dateToPrefetch, '', 1, limit),
      });
    };

    const nextMonthDate = addMonths(currentDate, 1);
    const prevMonthDate = subMonths(currentDate, 1);

    prefetchAdjacentMonth(nextMonthDate);
    prefetchAdjacentMonth(prevMonthDate);

    // Nível B: Pré-carregar a PRÓXIMA página do mês atual (se houver)
    if (queryResult?.pagination?.currentPage < queryResult?.pagination?.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['transactions', userId, monthCacheKey, searchTerm, page + 1, limit, refreshKey],
        queryFn: () => fetchTransactionsData(userId, currentDate, searchTerm, page + 1, limit),
      });
    }

  }, [currentDate, userId, refreshKey, queryClient, limit, queryResult, searchTerm, page, monthCacheKey]);

  // Função utilitária para formatar as datas na UI ("Hoje", "Ontem", etc)
  const formatGroupDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    const formatted = format(date, "EEEE, dd", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Retornos de Segurança para a Tela não quebrar enquanto carrega
  const defaultData = { transactionsByDate: {}, income: 0, expense: 0, balance: 0 };
  const defaultPagination = { totalPages: 1, currentPage: 1, totalItems: 0 };

  return { 
    data: queryResult?.data || defaultData, 
    pagination: queryResult?.pagination || defaultPagination, 
    isLoading, 
    formatGroupDate 
  };
}
