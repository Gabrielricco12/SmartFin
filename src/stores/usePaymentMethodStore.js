import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const usePaymentMethodStore = create((set, get) => ({
  methods: [],
  isLoading: false,

  fetchMethods: async (accountId) => {
    if (!accountId) return;
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      toast.error('Erro ao carregar os métodos de pagamento.');
    } else {
      set({ methods: data || [] });
    }
    
    set({ isLoading: false });
  },

  createMethod: async (accountId, userId, methodData) => {
    if (!accountId || !userId) return false;

    // Garante que só mandamos os dias se for cartão de crédito
    const isCredit = methodData.type === 'credit';

    const { data, error } = await supabase
      .from('payment_methods')
      .insert([{
        account_id: accountId,
        user_id: userId,
        name: methodData.name,
        type: methodData.type,
        closing_day: isCredit && methodData.closing_day ? parseInt(methodData.closing_day, 10) : null,
        due_day: isCredit && methodData.due_day ? parseInt(methodData.due_day, 10) : null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar método:', error);
      toast.error('Erro ao vincular o método de pagamento.');
      return false;
    }

    set((state) => ({ methods: [data, ...state.methods] }));
    toast.success('Método de pagamento adicionado!');
    return true;
  },

  deleteMethod: async (methodId) => {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      console.error('Erro ao eliminar método:', error);
      toast.error('Erro ao remover o método.');
      return false;
    }

    set((state) => ({ methods: state.methods.filter(m => m.id !== methodId) }));
    toast.success('Método removido com sucesso.');
    return true;
  }
}));