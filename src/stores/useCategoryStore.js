import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async (userId) => {
    if (!userId) return;
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar suas categorias.');
    } else {
      set({ categories: data || [] });
    }
    
    set({ isLoading: false });
  },

  createCategory: async (userId, categoryData) => {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        user_id: userId,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        type: categoryData.type,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria.');
      return false;
    }

    set((state) => ({ categories: [data, ...state.categories] }));
    toast.success('Categoria criada com sucesso!');
    return true;
  },

  deleteCategory: async (categoryId) => {
    // Como definimos ON DELETE SET NULL na migration, a transação não será apagada, apenas perderá a categoria.
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      toast.error('Erro ao remover a categoria.');
      return false;
    }

    set((state) => ({ categories: state.categories.filter(c => c.id !== categoryId) }));
    toast.success('Categoria removida.');
    return true;
  }
}));