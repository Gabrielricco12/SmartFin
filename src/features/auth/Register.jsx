import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: '', phone: '', email: '', password: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      return toast.error('Preencha os campos obrigatórios.');
    }

    setIsLoading(true);
    
    // O trigger no DB vai pegar o full_name e phone de options.data
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone || null,
        }
      }
    });

    setIsLoading(false);

    if (error) {
      return toast.error(error.message);
    }

    toast.success('Conta criada com sucesso! Faça login para continuar.');
    navigate('/login');
  };

  return (
    <AuthLayout title="Crie sua conta" subtitle="Comece a organizar sua vida financeira hoje.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input 
          label="Nome Completo *" 
          type="text" 
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
        <Input 
          label="Telefone" 
          type="tel" 
          placeholder="(00) 00000-0000"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input 
          label="Email *" 
          type="email" 
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input 
          label="Senha *" 
          type="password" 
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <Button type="submit" isLoading={isLoading} className="mt-2">
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-gray-900 font-semibold hover:underline">
          Fazer login
        </Link>
      </p>
    </AuthLayout>
  );
}