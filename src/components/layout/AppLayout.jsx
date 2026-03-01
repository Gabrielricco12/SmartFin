import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Wallet, ArrowRightLeft, Tags, LogOut, Plus, Menu, 
  ChevronLeft, ArrowDownCircle, ArrowUpCircle 
} from 'lucide-react';

import { useAuthStore } from '../../stores/useAuthStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { NewExpenseModal } from '../NewExpenseModal';
import { NewIncomeModal } from '../NewIncomeModal';

// Nosso novo ouvinte invisível de WebSockets
import { RealtimeSync } from '../RealtimeSync';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Painel', icon: Home },
  { path: '/accounts', label: 'Contas', icon: Wallet },
  { path: '/transactions', label: 'Transações', icon: ArrowRightLeft },
  { path: '/categories', label: 'Categorias', icon: Tags },
];

export function AppLayout() {
  const { pathname } = useLocation();
  const signOut = useAuthStore((state) => state.signOut);
  const { openExpenseModal, openIncomeModal } = useTransactionStore();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const handleActionClick = (action) => {
    setIsActionMenuOpen(false);
    if (action === 'expense') openExpenseModal();
    if (action === 'income') openIncomeModal();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      
      {/* OUVINTE DE ATUALIZAÇÕES EM TEMPO REAL */}
      <RealtimeSync />

      {isActionMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsActionMenuOpen(false)} 
        />
      )}

      <motion.aside 
        initial={false} 
        animate={{ width: isSidebarOpen ? '260px' : '80px' }} 
        className="hidden md:flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-50"
      >
        <div className="flex items-center justify-between p-6">
          {isSidebarOpen ? (
            <span className="text-xl font-bold text-gray-900">SmartFin</span>
          ) : (
            <span className="text-xl font-bold text-gray-900 mx-auto">SF</span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 absolute -right-3 top-6 bg-white border border-gray-100 shadow-sm"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <div className="px-4 pb-6 relative">
          <button 
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} 
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm relative z-50"
          >
            <Plus size={20} className={isActionMenuOpen ? "rotate-45 transition-transform" : "transition-transform"} />
            {isSidebarOpen && <span>Nova Transação</span>}
          </button>

          <AnimatePresence>
            {isActionMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="absolute left-4 right-4 top-16 bg-white border border-gray-100 shadow-xl rounded-xl p-2 z-[60] flex flex-col gap-1"
              >
                <button onClick={() => handleActionClick('expense')} className="flex items-center gap-3 w-full p-2 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold transition-colors">
                  <ArrowDownCircle size={18} /> Nova Despesa
                </button>
                <button onClick={() => handleActionClick('income')} className="flex items-center gap-3 w-full p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold transition-colors">
                  <ArrowUpCircle size={18} /> Nova Receita
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto z-50">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} to={item.path} onClick={() => setIsActionMenuOpen(false)} 
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${!isSidebarOpen && 'justify-center'}`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 z-50">
          <button onClick={handleSignOut} className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full text-red-600 hover:bg-red-50 transition-colors ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={20} />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto pb-24 md:pb-0 z-10">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] pb-safe">
        <Link to="/dashboard" onClick={() => setIsActionMenuOpen(false)} className={`flex flex-col items-center p-2 w-16 ${pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}><Home size={22} /><span className="text-[10px] mt-1 font-medium">Início</span></Link>
        <Link to="/accounts" onClick={() => setIsActionMenuOpen(false)} className={`flex flex-col items-center p-2 w-16 ${pathname.startsWith('/accounts') ? 'text-indigo-600' : 'text-gray-400'}`}><Wallet size={22} /><span className="text-[10px] mt-1 font-medium">Contas</span></Link>
        
        <div className="relative -top-6 z-50">
          <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 flex items-center justify-center relative z-50">
            <Plus size={24} className={isActionMenuOpen ? "rotate-45 transition-transform" : "transition-transform"} />
          </button>

          <AnimatePresence>
            {isActionMenuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-[60] items-center">
                <button onClick={() => handleActionClick('income')} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-xl border border-gray-100 text-emerald-600 font-semibold text-sm w-36 justify-center"><ArrowUpCircle size={18} /> Receita</button>
                <button onClick={() => handleActionClick('expense')} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-xl border border-gray-100 text-red-600 font-semibold text-sm w-36 justify-center"><ArrowDownCircle size={18} /> Despesa</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to="/transactions" onClick={() => setIsActionMenuOpen(false)} className={`flex flex-col items-center p-2 w-16 ${pathname === '/transactions' ? 'text-indigo-600' : 'text-gray-400'}`}><ArrowRightLeft size={22} /><span className="text-[10px] mt-1 font-medium">Transações</span></Link>
        <Link to="/categories" onClick={() => setIsActionMenuOpen(false)} className={`flex flex-col items-center p-2 w-16 ${pathname === '/categories' ? 'text-indigo-600' : 'text-gray-400'}`}><Tags size={22} /><span className="text-[10px] mt-1 font-medium">Categorias</span></Link>
      </nav>
      
      <NewExpenseModal />
      <NewIncomeModal />
    </div>
  );
}