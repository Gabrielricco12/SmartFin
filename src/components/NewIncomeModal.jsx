import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Landmark, Tags, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

import { useAuthStore } from '../stores/useAuthStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { formatBRL } from '../utils/currency';
import { Button } from './ui/Button';

export function NewIncomeModal() {
  const user = useAuthStore((state) => state.user);
  const { isIncomeModalOpen, closeIncomeModal, createTransaction } = useTransactionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [amountInput, setAmountInput] = useState('0');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (!isIncomeModalOpen || !user?.id) return;
    async function loadSupportData() {
      const [accRes, catRes] = await Promise.all([
        supabase.from('accounts').select('id, name').eq('user_id', user.id),
        supabase.from('categories').select('id, name').eq('user_id', user.id).eq('type', 'income')
      ]);
      if (accRes.data) {
        setAccounts(accRes.data);
        if (accRes.data.length > 0) setAccountId(accRes.data[0].id);
      }
      if (catRes.data) setCategories(catRes.data);
    }
    loadSupportData();
  }, [isIncomeModalOpen, user?.id]);

  const handleAmountChange = (e) => setAmountInput(e.target.value.replace(/\D/g, ''));
  const amountInCents = parseInt(amountInput || '0', 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amountInCents === 0) return alert('O valor não pode ser zero.');
    if (!accountId) return alert('Selecione uma conta.');

    setIsSubmitting(true);
    
    // Encontra o nome da categoria selecionada
    const selectedCat = categories.find(c => c.id === categoryId);

    await createTransaction(user.id, {
      amountInCents, 
      type: 'income', 
      description, 
      date,
      account_id: accountId, 
      payment_method_id: null,
      category_id: categoryId || null, 
      category_name: selectedCat ? selectedCat.name : 'Outros',
      installments: 1
    });
    
    setIsSubmitting(false);
    resetForm();
  };

  const resetForm = () => {
    setAmountInput('0'); setDescription(''); setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <AnimatePresence>
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeIncomeModal} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full max-w-lg relative z-10 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <ArrowUpCircle size={24} />
                <h2 className="text-xl font-bold">Nova Receita</h2>
              </div>
              <button type="button" onClick={closeIncomeModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center py-2">
                <span className="text-sm font-medium text-gray-500 mb-1">Valor Recebido</span>
                <input type="text" inputMode="numeric" className="text-4xl font-bold text-center bg-transparent border-none outline-none w-full text-emerald-600" value={formatBRL(amountInCents)} onChange={handleAmountChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <FileText size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Origem (ex: Salário)" required className="bg-transparent w-full outline-none text-sm" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <Calendar size={18} className="text-gray-400 mr-2" />
                  <input type="date" required className="bg-transparent w-full outline-none text-sm text-gray-700" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Landmark size={18} className="text-gray-400 mr-3 shrink-0" />
                  <select required className="bg-transparent w-full outline-none text-sm text-gray-700" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="" disabled>Recebido em qual conta?</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Tags size={18} className="text-gray-400 mr-3 shrink-0" />
                  <select className="bg-transparent w-full outline-none text-sm text-gray-700" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Selecione uma Categoria</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <Button type="submit" isLoading={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 border-none">Registrar Receita</Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}