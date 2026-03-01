import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Landmark, CreditCard, Tags, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

import { useAuthStore } from '../stores/useAuthStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { formatBRL } from '../utils/currency';
import { Button } from './ui/Button';

export function NewExpenseModal() {
  const user = useAuthStore((state) => state.user);
  const { isExpenseModalOpen, closeExpenseModal, createTransaction } = useTransactionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [categories, setCategories] = useState([]);

  const [amountInput, setAmountInput] = useState('0');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);

  useEffect(() => {
    if (!isExpenseModalOpen || !user?.id) return;
    async function loadSupportData() {
      const [accRes, catRes] = await Promise.all([
        supabase.from('accounts').select('id, name').eq('user_id', user.id),
        supabase.from('categories').select('id, name').eq('user_id', user.id).eq('type', 'expense')
      ]);
      if (accRes.data) {
        setAccounts(accRes.data);
        if (accRes.data.length > 0) setAccountId(accRes.data[0].id);
      }
      if (catRes.data) setCategories(catRes.data);
    }
    loadSupportData();
  }, [isExpenseModalOpen, user?.id]);

  useEffect(() => {
    if (!accountId) { setMethods([]); setMethodId(''); return; }
    async function loadMethods() {
      const { data } = await supabase.from('payment_methods').select('id, name, type').eq('account_id', accountId);
      setMethods(data || []);
      setMethodId('');
    }
    loadMethods();
  }, [accountId]);

  const selectedMethod = methods.find(m => m.id === methodId);
  const isCreditCard = selectedMethod?.type === 'credit';

  useEffect(() => {
    if (!isCreditCard) {
      setIsInstallment(false);
      setInstallments(2);
    }
  }, [isCreditCard]);

  const handleAmountChange = (e) => setAmountInput(e.target.value.replace(/\D/g, ''));
  const amountInCents = parseInt(amountInput || '0', 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amountInCents === 0) return alert('O valor não pode ser zero.');
    if (!accountId) return alert('Selecione uma conta.');

    setIsSubmitting(true);
    
    // SANITIZAÇÃO BLINDADA: Garante que strings vazias ou espaços virem "null" explícito
    const safeMethodId = methodId && methodId.trim() !== '' ? methodId : null;
    const safeCategoryId = categoryId && categoryId.trim() !== '' ? categoryId : null;
    
    // Encontra o nome da categoria para satisfazer a coluna 'category' do banco
    const selectedCat = categories.find(c => c.id === safeCategoryId);

    await createTransaction(user.id, {
      amountInCents, 
      type: 'expense', 
      description, 
      date,
      account_id: accountId, 
      payment_method_id: safeMethodId,
      category_id: safeCategoryId, 
      category_name: selectedCat ? selectedCat.name : 'Outros',
      installments: isInstallment ? Number(installments) : 1
    });
    
    setIsSubmitting(false);
    resetForm();
  };

  const resetForm = () => {
    setAmountInput('0'); setDescription(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    setIsInstallment(false); setInstallments(2);
  };

  return (
    <AnimatePresence>
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeExpenseModal} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full max-w-lg relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-red-600">
                <ArrowDownCircle size={24} />
                <h2 className="text-xl font-bold">Nova Despesa</h2>
              </div>
              <button type="button" onClick={closeExpenseModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center py-2">
                <span className="text-sm font-medium text-gray-500 mb-1">Valor da Despesa</span>
                <input type="text" inputMode="numeric" className="text-4xl font-bold text-center bg-transparent border-none outline-none w-full text-red-600" value={formatBRL(amountInCents)} onChange={handleAmountChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <FileText size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Descrição" required className="bg-transparent w-full outline-none text-sm" value={description} onChange={e => setDescription(e.target.value)} />
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
                    <option value="" disabled>Selecione a Conta...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>

                {methods.length > 0 && (
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <CreditCard size={18} className="text-gray-400 mr-3 shrink-0" />
                    <select className="bg-transparent w-full outline-none text-sm text-gray-700" value={methodId} onChange={e => setMethodId(e.target.value)}>
                      <option value="">Método de Pagamento</option>
                      {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Tags size={18} className="text-gray-400 mr-3 shrink-0" />
                  <select className="bg-transparent w-full outline-none text-sm text-gray-700" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Selecione uma Categoria</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              {isCreditCard && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-gray-300" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} />
                    <span className="text-sm font-medium text-gray-700">Compra Parcelada?</span>
                  </label>
                  {isInstallment && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <span className="text-sm text-gray-500">Número de parcelas:</span>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setInstallments(Math.max(2, installments - 1))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">-</button>
                        <span className="font-bold text-gray-900 w-4 text-center">{installments}x</span>
                        <button type="button" onClick={() => setInstallments(Math.min(48, installments + 1))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" isLoading={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 border-none">Registrar Despesa</Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
