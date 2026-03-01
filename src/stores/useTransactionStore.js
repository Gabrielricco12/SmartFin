import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { addMonths, format } from 'date-fns';
import { useAuthStore } from './useAuthStore';

export const useTransactionStore = create((set, get) => ({
  isExpenseModalOpen: false,
  isIncomeModalOpen: false,
  editingTransaction: null,
  
  openExpenseModal: (tx = null) => set({ isExpenseModalOpen: true, editingTransaction: tx }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false, editingTransaction: null }),
  
  openIncomeModal: (tx = null) => set({ isIncomeModalOpen: true, editingTransaction: tx }),
  closeIncomeModal: () => set({ isIncomeModalOpen: false, editingTransaction: null }),

  createTransaction: async (userId, data) => {
    if (!userId) return false;
    const { 
      amountInCents, type, description, date, account_id, 
      payment_method_id, category_id, category_name, installments, isCreditCard 
    } = data;

    const transactionsToInsert = [];
    const baseDate = new Date(`${date}T12:00:00`);

    if (installments > 1) {
      const val = Math.floor(amountInCents / installments);
      const rem = amountInCents - (val * installments);
      for (let i = 0; i < installments; i++) {
        transactionsToInsert.push({
          user_id: userId, amount: i === 0 ? val + rem : val, type, description,
          category_id: category_id || null, category: category_name || 'Outros',
          account_id, payment_method_id: payment_method_id || null,
          date: format(addMonths(baseDate, i), 'yyyy-MM-dd'),
          installment_current: i + 1, installment_total: installments
        });
      }
    } else {
      transactionsToInsert.push({
        user_id: userId, amount: amountInCents, type, description,
        category_id: category_id || null, category: category_name || 'Outros',
        account_id, payment_method_id: payment_method_id || null,
        date, installment_current: null, installment_total: null
      });
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert);
    if (error) { toast.error('Erro ao salvar no banco.'); return false; }

    if (!isCreditCard) {
      const modifier = type === 'income' ? amountInCents : -amountInCents;
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
      await supabase.from('accounts').update({ balance: Number(acc.balance) + modifier }).eq('id', account_id);
    }
    
    toast.success(installments > 1 ? `${installments} parcelas geradas!` : 'Salvo com sucesso!');
    set({ isExpenseModalOpen: false, isIncomeModalOpen: false });
    return true;
  },

  updateTransaction: async (userId, id, data) => {
    const { amountInCents, type, description, date, account_id, category_id, category_name, oldAmount, isCreditCard } = data;
    
    const { error } = await supabase.from('transactions').update({
      amount: amountInCents, description, date, category_id, category: category_name
    }).eq('id', id).eq('user_id', userId);

    if (error) { toast.error('Erro na atualização.'); return false; }

    if (!isCreditCard && amountInCents !== oldAmount) {
      const diff = amountInCents - oldAmount;
      const modifier = type === 'income' ? diff : -diff;
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
      await supabase.from('accounts').update({ balance: Number(acc.balance) + modifier }).eq('id', account_id);
    }

    toast.success('Atualizado com sucesso!');
    set({ isExpenseModalOpen: false, isIncomeModalOpen: false, editingTransaction: null });
    return true;
  },

  deleteTransaction: async (transaction, deleteAll = false) => {
    const authUserId = useAuthStore.getState().user?.id;
    const { id, user_id, description, installment_total, account_id, amount, type, payment_method_id } = transaction;
    const targetUserId = user_id || authUserId;
    const isCreditCard = payment_method_id !== null; 

    try {
      let query = supabase.from('transactions').delete().eq('user_id', targetUserId);

      if (deleteAll && installment_total > 1) {
        query = query.eq('description', description).eq('installment_total', installment_total);
      } else {
        query = query.eq('id', id);
      }

      const { error } = await query;
      if (error) throw error;

      if (!isCreditCard) {
        const { data: acc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
        const modifier = type === 'expense' ? amount : -amount;
        await supabase.from('accounts').update({ balance: Number(acc.balance) + modifier }).eq('id', account_id);
      }
      
      toast.success(deleteAll ? 'Série excluída.' : 'Transação removida.');
      return true;
    } catch (e) { 
      toast.error('Falha ao excluir.');
      return false; 
    }
  }
}));