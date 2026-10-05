import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Recuperar senha' };

type Props = {
  searchParams: Promise<{ erro?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  const notice =
    params.erro === 'link'
      ? {
          error:
            'Esse link expirou ou foi aberto em outro navegador. Peça um novo abaixo e abra o e-mail neste mesmo aparelho.',
        }
      : undefined;

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Esqueceu a senha?</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Informe seu e-mail e enviaremos um link para você criar uma nova.
      </p>

      <ForgotPasswordForm notice={notice} />

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
