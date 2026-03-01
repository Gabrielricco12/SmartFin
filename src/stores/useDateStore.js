import { create } from 'zustand';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useDateStore = create((set, get) => ({
  currentDate: new Date(),
  
  // Ações para navegar entre os meses
  nextMonth: () => set((state) => ({ currentDate: addMonths(state.currentDate, 1) })),
  prevMonth: () => set((state) => ({ currentDate: subMonths(state.currentDate, 1) })),
  setMonth: (date) => set({ currentDate: date }),

  // Seletores derivados úteis para as queries do Supabase
  getMonthStart: () => startOfMonth(get().currentDate),
  getMonthEnd: () => endOfMonth(get().currentDate),
  
  // Ex: "Janeiro", "Fevereiro"
  getFormattedMonthName: () => {
    const name = format(get().currentDate, 'MMMM', { locale: ptBR });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}));