import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDateStore } from '../stores/useDateStore';

export function useTransactions(userId, searchTerm = '', page = 1, limit = 15) {
  const [data, setData] = useState({ transactionsByDate: {}, income: 0, expense: 0, balance: 0 });
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = useDateStore((state) => state.currentDate);

  useEffect(() => {
    if (!userId) return;

    async function fetchTransactions() {
      setIsLoading(true);

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');

      // 1. CÁLCULO DO BALANÇO MENSAL (Busca todos os valores do mês ignorando paginação/pesquisa)
      const { data: balanceData } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      let income = 0; let expense = 0;
      if (balanceData) {
        balanceData.forEach(t => {
          if (t.type === 'income') income += Number(t.amount);
          if (t.type === 'expense') expense += Number(t.amount);
        });
      }

      // 2. BUSCA DA LISTAGEM (Aplicando Paginação e Pesquisa)
      let query = supabase
        .from('transactions')
        .select('id, user_id, amount, type, category, description, date, installment_current, installment_total, account_id, payment_method_id, accounts(name)', { count: 'exact' })
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (searchTerm) {
        // Usa o ilike para pesquisar na descrição ignorando maiúsculas e minúsculas
        query = query.ilike('description', `%${searchTerm}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: transactions, count } = await query;

      const grouped = {};
      if (transactions) {
        transactions.forEach(t => {
          const dateKey = t.date;
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(t);
        });
      }

      setData({ transactionsByDate: grouped, income, expense, balance: income - expense });
      setPagination({ 
        totalPages: Math.ceil((count || 0) / limit), 
        currentPage: page, 
        totalItems: count || 0 
      });
      
      setIsLoading(false);
    }

    fetchTransactions();
  }, [userId, currentDate, searchTerm, page, limit]);

  const formatGroupDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    const formatted = format(date, "EEEE, dd", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return { data, pagination, isLoading, formatGroupDate };
}