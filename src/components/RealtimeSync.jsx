import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useRefreshStore } from '../stores/useRefreshStore';

export function RealtimeSync() {
  const user = useAuthStore((state) => state.user);
  const triggerRefresh = useRefreshStore((state) => state.triggerRefresh);

  useEffect(() => {
    if (!user?.id) return;

    // Cria um canal WebSocket com o Supabase
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        triggerRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        triggerRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => {
        triggerRefresh();
      })
      .subscribe();

    // Limpeza ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, triggerRefresh]);

  return null; // É um componente invisível, não renderiza nada na tela
}