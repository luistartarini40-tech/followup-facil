'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { signOut } from '@/actions/auth';
import { btnPrimary, btnPrimarySm } from '@/lib/ui';
import { ColumnsIcon, HomeIcon, Logo, LogOutIcon, PlusIcon, SettingsIcon, UsersIcon } from './icons';

const NAV = [
  { href: '/painel', label: 'Painel', short: 'Painel', icon: HomeIcon },
  { href: '/leads', label: 'Leads', short: 'Leads', icon: UsersIcon },
  { href: '/pipeline', label: 'Pipeline', short: 'Pipeline', icon: ColumnsIcon },
  { href: '/configuracoes', label: 'Configurações', short: 'Conta', icon: SettingsIcon },
] as const;

type Props = {
  userName: string;
  companyName: string;
  /** Retornos para hoje + atrasados (aparece como aviso no menu). */
  pendingCount: number;
  children: ReactNode;
};

export function AppShell({ userName, companyName, pendingCount, children }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Menu lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Link href="/painel" aria-label="FollowUp Fácil — ir para o painel">
            <Logo />
          </Link>
        </div>

        <div className="px-4">
          <Link href="/leads/novo" className={`${btnPrimary} w-full`}>
            <PlusIcon className="h-4 w-4" />
            Novo lead
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Menu principal">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/painel' && pendingCount > 0 && (
                  <span
                    className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white"
                    title="Clientes para acompanhar hoje"
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{companyName}</p>
          <p className="truncate text-xs text-slate-500">{userName}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <LogOutIcon className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Barra do topo (celular) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/painel" aria-label="FollowUp Fácil — ir para o painel">
          <Logo />
        </Link>
        <Link href="/leads/novo" className={btnPrimarySm}>
          <PlusIcon className="h-4 w-4" />
          Novo lead
        </Link>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-64">{children}</main>

      {/* Menu de baixo (celular) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Menu principal"
      >
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                active ? 'text-brand-700' : 'text-slate-500'
              }`}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === '/painel' && pendingCount > 0 && (
                  <span className="absolute -top-2 -right-3 rounded-full bg-red-600 px-1.5 text-[10px] leading-4 font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </span>
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
