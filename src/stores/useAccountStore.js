import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const useAccountStore = create((set) => ({
  accounts: [],
  totalBalance: 0,
  isLoading: false,

  fetchAccounts: async (userId, currentDate) => {
    if (!userId) return;
    set({ isLoading: true });

    // Pega o intervalo do mês selecionado
    const targetDate = currentDate || new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // 1. Busca todas as contas
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // 2. Busca as transações DO MÊS, incluindo o tipo de método de pagamento (para ignorar crédito)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, account_id, payment_methods(type)')
      .eq('user_id', userId)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'));

    let totalConsolidated = 0;

    // 3. O Cálculo Dinâmico Mágico
    const enrichedAccounts = accountsData?.map(acc => {
      let income = 0;
      let expense = 0;

      if (transactions) {
        transactions.forEach(tx => {
          if (tx.account_id === acc.id) {
            if (tx.type === 'income') {
              income += Number(tx.amount);
            } else if (tx.type === 'expense') {
              // Só debita do saldo da conta se NÃO for cartão de crédito
              const isCreditCard = tx.payment_methods?.type === 'credit';
              if (!isCreditCard) {
                expense += Number(tx.amount);
              }
            }
          }
        });
      }

      // Balanço exato do mês para aquela conta
      const dynamicBalance = income - expense;
      totalConsolidated += dynamicBalance;

      // Substitui o `balance` antigo sujo do banco pela matemática em tempo real
      return { ...acc, dynamicBalance }; 
    }) || [];

    set({ accounts: enrichedAccounts, totalBalance: totalConsolidated, isLoading: false });
  },

  createAccount: async (userId, data) => {
    if (!userId) return false;
    const { error } = await supabase.from('accounts').insert([{
      user_id: userId,
      name: data.name,
      type: data.type || 'checking',
      balance: 0 // Campo legado anulado
    }]);

    if (error) {
      toast.error('Erro ao criar conta.');
      return false;
    }
    toast.success('Conta criada com sucesso!');
    return true;
  }
}));