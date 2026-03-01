import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, CreditCard, Zap, Landmark, X, Trash2, FileText, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePaymentMethodStore } from '../../stores/usePaymentMethodStore';
import { useDateStore } from '../../stores/useDateStore';
import { formatBRL } from '../../utils/currency';
import { Button } from '../../components/ui/Button';

// Configuração visual para os tipos de pagamento
const METHOD_TYPES = {
  credit: { label: 'Cartão de Crédito', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
  debit: { label: 'Cartão de Débito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
  pix: { label: 'Chave PIX', icon: Zap, color: 'text-teal-600', bg: 'bg-teal-100' },
  transfer: { label: 'Transferência Bancária', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  boleto: { label: 'Boleto', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { currentDate, getFormattedMonthName } = useDateStore(); // Puxamos a data global do app
  
  const { methods, isLoading, fetchMethods, createMethod, deleteMethod } = usePaymentMethodStore();
  
  const [account, setAccount] = useState(null);
  const [isFetchingAccount, setIsFetchingAccount] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', type: 'credit', closing_day: '', due_day: '' 
  });

  // CARREGAMENTO DA CONTA COM MATEMÁTICA DINÂMICA
  useEffect(() => {
    async function loadAccount() {
      if (!id) return;
      setIsFetchingAccount(true);
      
      // 1. Busca os dados base da conta
      const { data: acc, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Conta não encontrada', error);
        navigate('/accounts');
        return;
      }
      
      // 2. Define o período do mês selecionado no app
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // 3. Busca transações DESSA conta NESTE mês
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type, payment_methods(type)')
        .eq('account_id', id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      let income = 0;
      let expense = 0;

      // 4. Calcula o balanço ignorando gastos no cartão de crédito
      txs?.forEach(tx => {
        if (tx.type === 'income') income += Number(tx.amount);
        if (tx.type === 'expense' && tx.payment_methods?.type !== 'credit') {
          expense += Number(tx.amount);
        }
      });

      // Injeta o saldo calculado em tempo real no estado
      setAccount({ ...acc, dynamicBalance: income - expense });
      setIsFetchingAccount(false);
      
      // Carrega os cartões e chaves pix vinculadas
      fetchMethods(id);
    }

    loadAccount();
  }, [id, fetchMethods, navigate, currentDate]);

  const handleCreateMethod = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) return;

    setIsSubmitting(true);
    const success = await createMethod(id, user.id, formData);
    setIsSubmitting(false);

    if (success) {
      setIsModalOpen(false);
      setFormData({ name: '', type: 'credit', closing_day: '', due_day: '' });
    }
  };

  if (isFetchingAccount) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-20">
      
      {/* HEADER PREMIUM DE NAVEGAÇÃO */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate('/accounts')} 
          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{account?.name}</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Gerenciamento de Conta</p>
        </div>
      </div>

      {/* CARD DE BALANÇO DO MÊS (Reflete a nova lógica) */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center">
          
          <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md mb-4">
            <CalendarDays size={16} className="text-indigo-100" />
            <span className="text-indigo-50 text-sm font-semibold capitalize">
              Balanço de {getFormattedMonthName()}
            </span>
          </div>

          <h2 className="text-5xl font-black tracking-tight mb-2">
            {formatBRL(account?.dynamicBalance)}
          </h2>
          
          <span className="text-indigo-200 text-sm font-medium">
            Receitas - Despesas (Exceto Crédito)
          </span>
        </div>

        {/* Efeitos visuais de fundo */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SEÇÃO DE MÉTODOS DE PAGAMENTO */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold text-gray-900">Métodos de Pagamento</h3>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full transition-colors text-sm font-bold"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
              <CreditCard size={48} className="mb-4 text-gray-200" />
              <p className="text-base font-bold text-gray-800">Nenhum método configurado</p>
              <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                Vincule cartões de crédito, débito ou chaves PIX para usar nas suas transações.
              </p>
            </div>
          ) : (
            methods.map((method) => {
              const typeConfig = METHOD_TYPES[method.type] || METHOD_TYPES.credit;
              const Icon = typeConfig.icon;
              
              return (
                <motion.div 
                  key={method.id} 
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${typeConfig.bg} ${typeConfig.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg leading-tight">{method.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tight mt-1">
                        <span>{typeConfig.label}</span>
                        {method.type === 'credit' && method.closing_day && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>Fecha dia {method.closing_day}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteMethod(method.id)} 
                    className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE NOVO MÉTODO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Novo Método</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateMethod} className="flex flex-col gap-5">
                
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Nome de Identificação</label>
                  <input 
                    type="text" required placeholder="Ex: Cartão Nubank" 
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 transition-shadow"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Tipo de Pagamento</label>
                  <select 
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none text-gray-900 font-medium focus:ring-2 focus:ring-indigo-100 transition-shadow appearance-none"
                    value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {Object.entries(METHOD_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Aparece condicionalmente se for crédito */}
                <AnimatePresence>
                  {formData.type === 'credit' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-4 overflow-hidden">
                      <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2 text-center">Dia do Fechamento</label>
                        <input 
                          type="number" min="1" max="31" required placeholder="Ex: 25" 
                          className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none text-gray-900 font-bold text-center"
                          value={formData.closing_day} onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2 text-center">Dia do Vencimento</label>
                        <input 
                          type="number" min="1" max="31" required placeholder="Ex: 5" 
                          className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none text-gray-900 font-bold text-center"
                          value={formData.due_day} onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold border-none">
                  Cadastrar Método
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}