import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Trash2, Tags, ShoppingCart, Car, Home, Coffee, Zap, 
  Briefcase, GraduationCap, HeartPulse, Gamepad2, Plane, Gift, Monitor, Utensils, Smartphone
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// Dicionário de Ícones Disponíveis
const AVAILABLE_ICONS = {
  Tags, ShoppingCart, Car, Home, Coffee, Zap, Briefcase, 
  GraduationCap, HeartPulse, Gamepad2, Plane, Gift, Monitor, Utensils, Smartphone
};

// Dicionário de Cores Disponíveis (Classes do Tailwind)
const AVAILABLE_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export function Categories() {
  const user = useAuthStore((state) => state.user);
  const { categories, isLoading, fetchCategories, createCategory, deleteCategory } = useCategoryStore();
  
  const [filterType, setFilterType] = useState('expense'); // expense | income
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: 'Tags',
    color: 'bg-indigo-500'
  });

  useEffect(() => {
    fetchCategories(user?.id);
  }, [user?.id, fetchCategories]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    const success = await createCategory(user.id, formData);
    setIsSubmitting(false);

    if (success) {
      setIsModalOpen(false);
      setFormData({ name: '', type: filterType, icon: 'Tags', color: 'bg-indigo-500' });
    }
  };

  const filteredCategories = categories.filter(c => c.type === filterType);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 relative">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500">Organize suas transações por grupos.</p>
        </div>
        <Button onClick={() => { setFormData(prev => ({...prev, type: filterType})); setIsModalOpen(true); }} className="w-auto px-4 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md">
          <Plus size={20} className="mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* TABS DE FILTRO */}
      <div className="flex bg-gray-200/50 p-1 rounded-xl w-full max-w-sm">
        <button 
          onClick={() => setFilterType('expense')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Despesas
        </button>
        <button 
          onClick={() => setFilterType('income')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Receitas
        </button>
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center text-gray-400">
            <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <Tags size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhuma categoria</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Crie categorias para organizar suas {filterType === 'expense' ? 'despesas' : 'receitas'}.</p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const Icon = AVAILABLE_ICONS[category.icon] || AVAILABLE_ICONS['Tags'];
            return (
              <div key={category.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${category.color} shadow-sm`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                </div>
                <button onClick={() => deleteCategory(category.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nova Categoria</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <Input 
                  label="Nome da Categoria" 
                  type="text" 
                  required
                  placeholder="Ex: Supermercado, Salário..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                
                {/* Seletor de Ícone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selecione um Ícone</label>
                  <div className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 h-40 overflow-y-auto">
                    {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: key })}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${formData.icon === key ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'text-gray-500 hover:bg-gray-200'}`}
                      >
                        <Icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor de Cor */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selecione uma Cor</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_COLORS.map((colorClass) => (
                      <button
                        key={colorClass}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: colorClass })}
                        className={`w-10 h-10 rounded-full ${colorClass} shadow-sm transition-transform ${formData.color === colorClass ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : 'hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" isLoading={isSubmitting} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                  Salvar Categoria
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}