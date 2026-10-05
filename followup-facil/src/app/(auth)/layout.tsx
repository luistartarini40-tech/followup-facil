import Link from 'next/link';
import { Logo } from '@/components/icons';

// Moldura das telas de entrar, criar conta e recuperar senha.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-50 px-4 py-10 sm:justify-center">
      <Link href="/" aria-label="FollowUp Fácil — página inicial" className="mb-8">
        <Logo />
      </Link>
      <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </main>
      <p className="mt-6 max-w-md text-center text-xs text-slate-500">
        Pare de perder clientes porque esqueceu de fazer o retorno.
      </p>
    </div>
  );
}
