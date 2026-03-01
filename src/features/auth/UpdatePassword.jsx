import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';

export function UpdatePassword() {
  const navigate = useNavigate();
  const updatePassword = useAuthStore((state) => state.updatePassword);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      return alert('A nova senha deve ter no mínimo 6 caracteres.');
    }
    if (password !== confirmPassword) {
      return alert('As senhas não coincidem.');
    }

    setIsLoading(true);
    const success = await updatePassword(password);
    setIsLoading(false);

    if (success) {
      // Se deu certo, joga o usuário para o Dashboard, pois ele já está autenticado!
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Crie uma nova senha</h2>
        <p className="text-gray-500 text-center text-sm mb-8">
          Sua identidade foi confirmada. Digite abaixo a sua nova senha de acesso.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Nova Senha"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none text-gray-900 font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirme a Nova Senha"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none text-gray-900 font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="mt-4 w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold border-none">
            Salvar Nova Senha
          </Button>
        </form>
      </motion.div>
    </div>
  );
}