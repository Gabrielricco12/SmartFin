import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useDateStore } from '../stores/useDateStore';

export function useDashboard(userId) {
  const [data, setData] = useState({
    totalBalance: 0,
    income: 0,
    expense: 0,
    recentExpenses: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = useDateStore((state) => state.currentDate);

  useEffect(() => {
    if (!userId) return;

    async function fetchDashboardData() {
      setIsLoading(true);

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, type, category, description, date, accounts(name)')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

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

      // Balanço do Mês (Receitas - Despesas)
      const totalBalance = income - expense;

      setData({ totalBalance, income, expense, recentExpenses });
      setIsLoading(false);
    }

    fetchDashboardData();
  }, [userId, currentDate]);

  return { data, isLoading };
}