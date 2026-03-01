import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Wallet, ArrowUpCircle, Utensils, Home, Edit2, Trash2, Tag, X } from 'lucide-react';
import { formatBRL } from '../../utils/currency';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDateStore } from '../../stores/useDateStore';
import { useTransactions } from '../../hooks/useTransactions';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';

const getCategoryIcon = (category) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('alimentação') || cat.includes('comida')) return { icon: Utensils, color: 'bg-red-500' };
  if (cat.includes('casa') || cat.includes('moradia')) return { icon: Home, color: 'bg-blue-500' };
  return { icon: Tag, color: 'bg-indigo-500' };
};

export function Transactions() {
  const user = useAuthStore((state) => state.user);
  const { nextMonth, prevMonth, getFormattedMonthName, currentDate } = useDateStore();
  
  // Estados de Pesquisa e Paginação
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Efeito de Debounce (espera 500ms o usuário parar de digitar para buscar)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reseta a página ao fazer uma nova busca
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reseta a página e a pesquisa ao trocar de mês
  useEffect(() => {
    setPage(1);
    setSearchInput('');
    setIsSearchOpen(false);
  }, [currentDate]);

  // Busca dos Dados Paginada
  const { data, pagination, isLoading, formatGroupDate } = useTransactions(user?.id, debouncedSearch, page, 15);
  const { openExpenseModal, openIncomeModal, deleteTransaction } = useTransactionStore();

  const [selectedTx, setSelectedTx] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const handleDeleteAction = async (deleteAll) => {
    const success = await deleteTransaction(selectedTx, deleteAll);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedTx(null);
      window.location.reload(); 
    }
  };

  const handleEditInit = (tx) => {
    setActiveMenuId(null);
    if (tx.type === 'expense') openExpenseModal(tx);
    else openIncomeModal(tx);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 flex flex-col min-h-screen bg-gray-50 pb-20">
      
      <div className="bg-indigo-600 px-6 pt-10 pb-24 rounded-b-[3rem] relative z-0">
        <div className="flex items-center justify-between text-white mb-8 h-10">
          
          {/* BARRA DE PESQUISA DINÂMICA */}
          {!isSearchOpen ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl tracking-tight">Transações</h1>
                <ChevronLeft size={18} className="-rotate-90 opacity-60" />
              </div>
              <div className="flex items-center gap-5">
                <button onClick={() => setIsSearchOpen(true)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <Search size={22} className="opacity-80" />
                </button>
                <Filter size={22} className="opacity-80" />
                <MoreVertical size={22} className="opacity-80" />
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, width: '80%' }} animate={{ opacity: 1, width: '100%' }} className="flex items-center w-full gap-3 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
              <Search size={20} className="text-white opacity-80" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar despesa..."
                className="bg-transparent border-none outline-none text-white placeholder:text-white/60 w-full font-medium"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchInput(''); }}>
                <X size={20} className="text-white opacity-80" />
              </button>
            </motion.div>
          )}

        </div>

        <div className="flex items-center justify-center gap-8 text-white">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={28} /></button>
          <span className="font-bold text-xl min-w-[140px] text-center">{getFormattedMonthName()}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={28} /></button>
        </div>
      </div>

      <div className="px-6 -mt-14 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-gray-100 p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1 w-1/2">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider"><Wallet size={14} /> Balanço do mês</div>
            <span className={`text-xl font-black ${data.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatBRL(data.balance)}</span>
          </div>
          <div className="w-px h-12 bg-gray-100"></div>
          <div className="flex flex-col gap-1 w-1/2 pl-6">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider"><ArrowUpCircle size={14} /> Receitas</div>
            <span className="text-xl font-black text-emerald-600">{formatBRL(data.income)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : Object.keys(data.transactionsByDate).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium text-gray-500">Nenhuma transação encontrada.</p>
          </div>
        ) : (
          Object.keys(data.transactionsByDate).sort((a, b) => new Date(b) - new Date(a)).map(dateKey => (
            <div key={dateKey} className="mb-8">
              <h3 className="font-black text-gray-900 text-base mb-4 ml-2 opacity-80">{formatGroupDate(dateKey)}</h3>
              <div className="flex flex-col gap-3">
                {data.transactionsByDate[dateKey].map(tx => {
                  const { icon: Icon, color } = getCategoryIcon(tx.category);
                  const isMenuOpen = activeMenuId === tx.id;

                  return (
                    <div key={tx.id} className="relative">
                      <motion.div 
                        onClick={() => setActiveMenuId(isMenuOpen ? null : tx.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border transition-all cursor-pointer ${isMenuOpen ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-transparent hover:border-gray-200'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} shadow-${color.split('-')[1]}-200`}><Icon size={22} /></div>
                          <div>
                            <h4 className="font-bold text-gray-900 leading-tight">
                              {tx.description || tx.category}
                              {tx.installment_total > 1 && <span className="ml-2 text-indigo-500 text-xs bg-indigo-50 px-2 py-0.5 rounded-full font-black">{tx.installment_current}/{tx.installment_total}</span>}
                            </h4>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{tx.category} • {tx.accounts?.name}</span>
                          </div>
                        </div>
                        <span className={`font-black text-base ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{formatBRL(tx.amount)}
                        </span>
                      </motion.div>
                      
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 z-20 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-gray-100">
                            <button onClick={(e) => { e.stopPropagation(); handleEditInit(tx); }} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"><Edit2 size={18}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); setIsDeleteModalOpen(true); setActiveMenuId(null); }} className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"><Trash2 size={18}/></button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* CONTROLES DE PAGINAÇÃO */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-10 pt-6 border-t border-gray-200">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <span className="text-sm font-bold text-gray-500">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>
        )}

      </div>

      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAction} isInstallment={selectedTx?.installment_total > 1} />
    </motion.div>
  );
}