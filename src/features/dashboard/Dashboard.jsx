import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  Plus 
} from 'lucide-react';

import { useAuthStore } from '../../stores/useAuthStore';
import { useDateStore } from '../../stores/useDateStore';
import { useDashboard } from '../../hooks/useDashboard';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { formatBRL } from '../../utils/currency';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  
  const { nextMonth, prevMonth, getFormattedMonthName } = useDateStore();
  const { data, isLoading } = useDashboard(user?.id);
  const openExpenseModal = useTransactionStore((state) => state.openExpenseModal);

  // 1. Extração segura do primeiro nome
  const fullName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Usuário';
  const firstName = fullName.split(' ')[0];

  // 2. Lógica de Saudação por Horário
  const [greeting, setGreeting] = useState('Olá');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col gap-6 pb-6"
    >
      {/* HEADER: Saudação Dinâmica e Avatar */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}</h1>
          <p className="text-gray-500 text-sm">Aqui está o resumo do seu mês.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm border border-indigo-200">
          {firstName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* SELETOR DE MÊS */}
      <div className="flex items-center justify-center gap-6 py-2">
        <button 
          onClick={prevMonth} 
          className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-lg min-w-[140px] text-center text-gray-800 capitalize">
          {getFormattedMonthName()}
        </span>
        <button 
          onClick={nextMonth} 
          className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* BALANÇO PRINCIPAL (Receitas - Despesas) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 z-10">
          Balanço do mês
        </span>
        <h2 className={`text-4xl font-black tracking-tight z-10 ${data.totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {formatBRL(data.totalBalance)}
        </h2>
        
        <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none ${data.totalBalance >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`} />
      </div>

      {/* CARDS DE RECEITAS E DESPESAS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100/50 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-600 mb-3 relative z-10">
            <ArrowUpCircle size={20} />
            <span className="font-bold text-sm">Receitas</span>
          </div>
          <span className="text-xl font-black text-emerald-700 relative z-10">
            {formatBRL(data.income)}
          </span>
        </div>
        
        <div className="bg-red-50 rounded-3xl p-5 border border-red-100/50 relative overflow-hidden">
          <div className="flex items-center gap-2 text-red-600 mb-3 relative z-10">
            <ArrowDownCircle size={20} />
            <span className="font-bold text-sm">Despesas</span>
          </div>
          <span className="text-xl font-black text-red-700 relative z-10">
            {formatBRL(data.expense)}
          </span>
        </div>
      </div>

      {/* LISTAGEM DE DESPESAS RECENTES */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-gray-900">Despesas Recentes</h3>
          <button 
            onClick={() => openExpenseModal()} 
            className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={16} /> Nova
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {data.recentExpenses.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-gray-100 border-dashed">
              <Wallet size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium text-sm">Nenhuma despesa neste mês.</p>
            </div>
          ) : (
            data.recentExpenses.map(tx => (
              <div 
                key={tx.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">
                      {tx.description}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                      {tx.category} • {tx.accounts?.name}
                    </span>
                  </div>
                </div>
                <span className="font-black text-red-500 text-sm">
                  -{formatBRL(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </motion.div>
  );
}