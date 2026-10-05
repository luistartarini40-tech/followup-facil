import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Criar sua conta</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Leva menos de um minuto. Seus dados ficam só com você.</p>

      <SignUpForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
