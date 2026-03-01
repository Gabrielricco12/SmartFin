import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useDateStore } from '../stores/useDateStore';
import { useRefreshStore } from '../stores/useRefreshStore';

// 1. Extraímos a lógica para permitir o pré-carregamento (Prefetching)
export const fetchAccountsData = async (userId, targetDate) => {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // Busca todas as contas do usuário
  const { data: accountsData, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (accountsError) throw accountsError;

  // Busca as transações do MÊS ALVO para calcular o saldo
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, type, account_id, payment_methods(type)')
    .eq('user_id', userId)
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'));

  if (txError) throw txError;

  let totalConsolidated = 0;

  // O Cálculo Dinâmico
  const enrichedAccounts = accountsData?.map(acc => {
    let income = 0;
    let expense = 0;

    if (transactions) {
      transactions.forEach(tx => {
        if (tx.account_id === acc.id) {
          if (tx.type === 'income') {
            income += Number(tx.amount);
          } else if (tx.type === 'expense') {
            const isCreditCard = tx.payment_methods?.type === 'credit';
            if (!isCreditCard) {
              expense += Number(tx.amount);
            }
          }
        }
      });
    }

    const dynamicBalance = income - expense;
    totalConsolidated += dynamicBalance;

    return { ...acc, dynamicBalance };
  }) || [];

  return { accounts: enrichedAccounts, totalBalance: totalConsolidated };
};

export function useAccounts(userId) {
  const currentDate = useDateStore((state) => state.currentDate);
  const refreshKey = useRefreshStore((state) => state.refreshKey);
  const queryClient = useQueryClient();

  const monthCacheKey = format(currentDate, 'yyyy-MM');

  // 2. Busca Oficial (A que aparece na tela)
  const { data, isLoading } = useQuery({
    queryKey: ['accounts', userId, monthCacheKey, refreshKey],
    queryFn: () => fetchAccountsData(userId, currentDate),
    enabled: !!userId,
  });

  // 3. PREFETCHING SILENCIOSO (Carrega meses vizinhos)
  useEffect(() => {
    if (!userId) return;

    const prefetchMonth = (dateToPrefetch) => {
      const key = format(dateToPrefetch, 'yyyy-MM');
      queryClient.prefetchQuery({
        queryKey: ['accounts', userId, key, refreshKey],
        queryFn: () => fetchAccountsData(userId, dateToPrefetch),
      });
    };

    const nextMonthDate = addMonths(currentDate, 1);
    const prevMonthDate = subMonths(currentDate, 1);

    prefetchMonth(nextMonthDate);
    prefetchMonth(prevMonthDate);

  }, [currentDate, userId, refreshKey, queryClient]);

  const safeData = data || { accounts: [], totalBalance: 0 };

  return { data: safeData, isLoading };
}
