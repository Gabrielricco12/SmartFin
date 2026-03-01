import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Landmark, Wallet, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useDateStore } from '../../stores/useDateStore';
import { formatBRL } from '../../utils/currency';
import { Button } from '../../components/ui/Button';

export function Accounts() {
  const user = useAuthStore(state => state.user);
  
  // Integração com a data global do app
  const { currentDate, nextMonth, prevMonth, getFormattedMonthName } = useDateStore();
  const { accounts, totalBalance, isLoading, fetchAccounts, createAccount } = useAccountStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'checking' });

  // Recarrega as contas e transações sempre que o mês mudar
  useEffect(() => {
    fetchAccounts(user?.id, currentDate);
  }, [user?.id, currentDate, fetchAccounts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await createAccount(user.id, formData);
    setIsSubmitting(false);
    
    if (success) {
      setIsModalOpen(false);
      setFormData({ name: '', type: 'checking' });
      fetchAccounts(user?.id, currentDate);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 flex flex-col min-h-screen bg-gray-50">
      
      {/* HEADER ROXO E SELETOR DE MÊS */}
      <div className="bg-indigo-600 px-6 pt-10 pb-24 rounded-b-[3rem] relative z-0">
        <div className="flex items-center justify-between text-white mb-8">
          <h1 className="font-bold text-xl tracking-tight">Suas Contas</h1>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors text-sm font-semibold backdrop-blur-md">
            <Plus size={16} /> Nova Conta
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 text-white">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={28} /></button>
          <span className="font-bold text-xl min-w-[140px] text-center capitalize">{getFormattedMonthName()}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={28} /></button>
        </div>
      </div>

      {/* CARD DO SALDO CONSOLIDADO DO MÊS */}
      <div className="px-6 -mt-14 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Wallet size={16} /> Saldo Total Consolidado
          </div>
          <span className={`text-4xl font-black tracking-tight ${totalBalance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
            {formatBRL(totalBalance)}
          </span>
        </div>
      </div>

      {/* LISTAGEM DAS CONTAS */}
      <div className="px-6 mt-8 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
            <Landmark size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="font-medium text-gray-500">Nenhuma conta cadastrada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {accounts.map(acc => (
              <Link key={acc.id} to={`/accounts/${acc.id}`}>
                <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-5 rounded-3xl shadow-sm border border-transparent hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Landmark size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{acc.name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Conta Financeira</p>
                    </div>
                  </div>
                  <span className={`font-black text-lg ${acc.dynamicBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                    {formatBRL(acc.dynamicBalance)}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE NOVA CONTA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nova Conta</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Nome da Instituição</label>
                  <input type="text" required placeholder="Ex: Nubank, Itaú..." className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none text-gray-900 font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <Button type="submit" isLoading={isSubmitting} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold border-none">
                  Criar Conta
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}