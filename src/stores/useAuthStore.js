import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,

  // 1. INICIALIZAÇÃO E ESCUTA DA SESSÃO
  initializeAuth: async () => {
    try {
      // Pega a sessão atual ao abrir o app
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      set({ session, user: session?.user || null, isLoading: false });

      // Escuta mudanças em tempo real (Login, Logout, Token Expirado, Recuperação de Senha)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user || null, isLoading: false });
      });
    } catch (error) {
      console.error('Erro na inicialização da auth:', error);
      set({ isLoading: false });
    }
  },

  // 2. CADASTRO DE NOVO USUÁRIO
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Salva o nome nos metadados para usarmos no Dashboard
          },
        },
      });

      if (error) throw error;
      
      // Validação extra caso o Supabase não retorne erro explícito para e-mail duplicado
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error('Este e-mail já está em uso.');
        return false;
      }

      toast.success('Conta criada com sucesso!');
      return true;
    } catch (error) {
      toast.error(error.message || 'Erro ao criar conta.');
      return false;
    }
  },

  // 3. LOGIN DO USUÁRIO
  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      toast.error('E-mail ou senha incorretos.');
      return false;
    }
  },

  // 4. LOGOUT (SAIR DA CONTA)
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, session: null });
      toast.success('Você saiu da sua conta.');
    } catch (error) {
      toast.error('Erro ao sair da conta.');
    }
  },

  // 5. RECUPERAÇÃO DE SENHA (ENVIO DO LINK)
  resetPassword: async (email) => {
    try {
      // Em produção, se você tiver um domínio (ex: meudominio.com), mude aqui se necessário.
      // O window.location.origin pega automaticamente o http://localhost:5173 ou o domínio real.
      const redirectTo = `${window.location.origin}/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.');
      return true;
    } catch (error) {
      toast.error(error.message || 'Erro ao enviar e-mail de recuperação.');
      return false;
    }
  },

  // 6. ATUALIZAÇÃO DA SENHA (APÓS CLICAR NO LINK)
  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      return true;
    } catch (error) {
      toast.error(error.message || 'Erro ao atualizar a senha.');
      return false;
    }
  }
}));