import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth-forms';
import { safeInternalPath } from '@/lib/safe-path';

export const metadata: Metadata = { title: 'Entrar' };

type Props = {
  searchParams: Promise<{ next?: string; erro?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  const notice =
    params.erro === 'link'
      ? {
          error:
            'Não foi possível entrar por esse link (ele pode ter expirado ou sido aberto em outro navegador). ' +
            'Se você estava confirmando seu e-mail, ele já foi confirmado: é só entrar com e-mail e senha.',
        }
      : undefined;

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Entrar na sua conta</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Veja quem precisa de retorno hoje.</p>

      <LoginForm next={safeInternalPath(params.next)} notice={notice} />

      <p className="mt-6 text-center text-sm text-slate-600">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-brand-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </>
  );
}
