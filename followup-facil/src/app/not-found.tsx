import Link from 'next/link';
import { Logo } from '@/components/icons';
import { btnPrimary } from '@/lib/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-2xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-slate-600">O endereço não existe ou este cliente não está mais na sua lista.</p>
      <Link href="/painel" className={`${btnPrimary} mt-6`}>
        Ir para o painel
      </Link>
    </div>
  );
}
