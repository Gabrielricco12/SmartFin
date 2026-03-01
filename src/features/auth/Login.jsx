import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error('Preencha todos os campos.');
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    if (error) {
      return toast.error('Email ou senha incorretos.');
    }

    toast.success('Bem-vindo de volta!');
    navigate('/dashboard');
  };

  return (
    <AuthLayout title="Acesse sua conta" subtitle="Gerencie suas finanças com inteligência.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input 
          label="Email" 
          type="email" 
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        
        <div className="flex flex-col gap-1.5">
          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="mt-2">
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Ainda não tem uma conta?{' '}
        <Link to="/register" className="text-gray-900 font-semibold hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}