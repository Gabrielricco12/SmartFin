import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null, // Novo estado para a tabela profiles
  session: null,
  isLoading: true,

  initializeAuth: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) console.error('Erro ao buscar sessão:', error.message);

    // Função interna para buscar o perfil
   const fetchProfile = async (userId) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // <- ALTERE AQUI: maybeSingle() evita o erro 406 se a tabela estiver vazia

      if (error) {
         console.error('Erro ao buscar perfil:', error.message);
      }
      return data;
    };
    const user = session?.user || null;
    const profile = await fetchProfile(user?.id);

    set({ session, user, profile, isLoading: false });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      const currentProfile = await fetchProfile(currentUser?.id);
      
      set({ session, user: currentUser, profile: currentProfile, isLoading: false });
    });

    return () => subscription.unsubscribe();
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null, session: null });
  }
}));