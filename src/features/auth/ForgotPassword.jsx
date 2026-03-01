import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Informe seu email.');

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      return toast.error(error.message);
    }

    setIsSent(true);
    toast.success('Email de recuperação enviado!');
  };

  if (isSent) {
    return (
      <AuthLayout title="Verifique seu email" subtitle="Enviamos um link para você redefinir sua senha.">
        <div className="flex flex-col gap-4 mt-4">
          <Button variant="secondary" onClick={() => setIsSent(false)}>Tentar novamente</Button>
          <Link to="/login" className="text-center text-sm text-gray-600 hover:text-gray-900">
            Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Digite seu email para receber as instruções.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input 
          label="Email" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" isLoading={isLoading} className="mt-2">
          Enviar link
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          Voltar para o login
        </Link>
      </div>
    </AuthLayout>
  );
}