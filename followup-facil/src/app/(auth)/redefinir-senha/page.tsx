import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Nova senha' };

// Só chega aqui quem clicou no link do e-mail (o proxy barra quem não tem sessão).
export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Criar nova senha</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Escolha uma senha nova para a sua conta.</p>
      <ResetPasswordForm />
    </>
  );
}
