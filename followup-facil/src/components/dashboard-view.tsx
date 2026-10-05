import Link from 'next/link';
import type { ReactNode } from 'react';
import { describeFollowUp, formatDayMonth, formatLongDate } from '@/lib/dates';
import { firstName, formatBRL, formatBRLShort, pluralize } from '@/lib/format';
import type { DashboardStats, LeadSummary } from '@/lib/types';
import { btnPrimary, cardClass } from '@/lib/ui';
import { PageContainer } from './page-layout';
import { FollowUpChip, StageBadge } from './badges';
import { FollowUpButton } from './follow-up-button';
import { FormMessage } from './form-bits';
import { AlertIcon, ArrowRightIcon, CalendarIcon, CheckCircleIcon, ClockIcon, PlusIcon } from './icons';
import { WhatsAppButton } from './whatsapp-button';

type Props = {
  userName: string;
  today: string;
  stats: DashboardStats;
  /** Retornos para hoje e atrasados (mais atrasado primeiro). */
  due: LeadSummary[];
  /** Retornos dos próximos 7 dias. */
  upcoming: LeadSummary[];
  notice?: string;
};

/** Um cliente que precisa de retorno, com os dois botões que importam. */
function FollowUpItem({ lead, today }: { lead: LeadSummary; today: string }) {
  const details = [lead.interest, lead.estimated_value > 0 ? formatBRL(lead.estimated_value) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Link href={`/leads/${lead.id}`} className="truncate text-base font-semibold text-slate-900 hover:text-brand-700">
            {lead.name}
          </Link>
          <FollowUpChip date={lead.next_contact_at} today={today} />
        </div>
        {details && <p className="mt-1 truncate text-sm text-slate-600">{details}</p>}
        <div className="mt-2">
          <StageBadge stage={lead.stage} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <WhatsAppButton lead={lead} />
        <FollowUpButton lead={lead} />
      </div>
    </li>
  );
}

function FollowUpSection({
  title,
  tone,
  icon,
  leads,
  today,
}: {
  title: string;
  tone: 'red' | 'amber';
  icon: ReactNode;
  leads: LeadSummary[];
  today: string;
}) {
  if (leads.length === 0) return null;
  const header = tone === 'red' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900';

  return (
    <section className={`${cardClass} overflow-hidden`}>
      <h2 className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold sm:px-5 ${header}`}>
        {icon}
        {title}
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{leads.length}</span>
      </h2>
      <ul className="divide-y divide-slate-100">
        {leads.map((lead) => (
          <FollowUpItem key={lead.id} lead={lead} today={today} />
        ))}
      </ul>
    </section>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className={`${cardClass} block p-4 transition-colors hover:border-brand-300`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </Link>
  );
}

function Indicator({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className={`${cardClass} p-4`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export function DashboardView({ userName, today, stats, due, upcoming, notice }: Props) {
  const overdue = due.filter((lead) => lead.next_contact_at !== null && lead.next_contact_at < today);
  const dueToday = due.filter((lead) => lead.next_contact_at === today);
  const pending = stats.hoje + stats.atrasados;
  const name = firstName(userName);
  const isNewAccount = stats.total === 0;

  const conversion = stats.total > 0 ? Math.round((stats.fechados / stats.total) * 100) : 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        {notice && <FormMessage success={notice} />}

        {/* A resposta para "quem eu preciso chamar hoje?" */}
        <section className="rounded-2xl bg-brand-600 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-medium text-brand-100">
            {name ? `Olá, ${name} · ` : ''}
            {formatLongDate(today)}
          </p>

          {isNewAccount ? (
            <>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Vamos cadastrar seu primeiro cliente?</h1>
              <p className="mt-2 max-w-xl text-brand-100">
                Anote quem pediu orçamento ou ficou de responder e marque quando falar de novo. No dia certo, ele
                aparece aqui.
              </p>
              <Link
                href="/leads/novo"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                <PlusIcon className="h-4 w-4" />
                Cadastrar cliente
              </Link>
            </>
          ) : pending > 0 ? (
            <>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Você tem {pending} {pluralize(pending, 'cliente', 'clientes')} para acompanhar hoje.
              </h1>
              <p className="mt-2 text-brand-100">
                {stats.hoje} {pluralize(stats.hoje, 'marcado', 'marcados')} para hoje
                {stats.atrasados > 0 && (
                  <>
                    {' · '}
                    <strong className="font-semibold text-white">
                      {stats.atrasados} {pluralize(stats.atrasados, 'atrasado', 'atrasados')}
                    </strong>
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
                <CheckCircleIcon className="h-7 w-7 shrink-0" />
                Tudo em dia. Ninguém para chamar hoje.
              </h1>
              <p className="mt-2 text-brand-100">Quando chegar o dia de um retorno, o cliente aparece aqui.</p>
            </>
          )}
        </section>

        <FollowUpSection
          title="Atrasados — chame primeiro"
          tone="red"
          icon={<AlertIcon className="h-4 w-4" />}
          leads={overdue}
          today={today}
        />

        <FollowUpSection
          title="Para hoje"
          tone="amber"
          icon={<ClockIcon className="h-4 w-4" />}
          leads={dueToday}
          today={today}
        />

        {pending > due.length && (
          <p className="text-sm text-slate-600">
            Mostrando os {due.length} primeiros.{' '}
            <Link href="/leads?retorno=pendentes" className="font-medium text-brand-700 hover:underline">
              Ver todos os {pending}
            </Link>
          </p>
        )}

        {stats.sem_retorno > 0 && (
          <Link
            href="/leads?retorno=sem"
            className={`${cardClass} flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand-300 sm:px-5`}
          >
            <span className="text-sm text-slate-700">
              <strong className="font-semibold text-slate-900">
                {stats.sem_retorno} {pluralize(stats.sem_retorno, 'negociação aberta', 'negociações abertas')}
              </strong>{' '}
              sem data de retorno. Marque uma data para não esquecer.
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        )}

        {upcoming.length > 0 && (
          <section className={`${cardClass} overflow-hidden`}>
            <h2 className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 sm:px-5">
              <CalendarIcon className="h-4 w-4" />
              Próximos 7 dias
            </h2>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {upcoming.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:px-5"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-800">{lead.name}</span>
                    <span className="shrink-0 text-slate-500">
                      {formatDayMonth(lead.next_contact_at)} · {describeFollowUp(lead.next_contact_at, today).toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isNewAccount && (
          <>
            <section aria-labelledby="numeros">
              <h2 id="numeros" className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
                Seus números
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Total de leads" value={stats.total} href="/leads" />
                <StatCard label="Novos leads" value={stats.novos} href="/leads?etapa=novo" />
                <StatCard label="Negociações abertas" value={stats.abertos} href="/pipeline" />
                <StatCard label="Orçamentos enviados" value={stats.orcamentos} href="/leads?etapa=orcamento" />
                <StatCard label="Vendas fechadas" value={stats.fechados} href="/leads?etapa=fechado" />
                <StatCard label="Oportunidades perdidas" value={stats.perdidos} href="/leads?etapa=perdido" />
              </div>
            </section>

            <section aria-labelledby="resultados">
              <h2 id="resultados" className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
                Resultados
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <Indicator
                  label="Taxa de conversão"
                  value={`${conversion}%`}
                  caption={`${stats.fechados} ${pluralize(stats.fechados, 'venda', 'vendas')} em ${stats.total} ${pluralize(stats.total, 'lead', 'leads')}`}
                />
                <Indicator
                  label="Em negociação"
                  value={formatBRLShort(stats.valor_negociacao)}
                  caption="Soma das negociações abertas"
                />
                <Indicator label="Vendido" value={formatBRLShort(stats.valor_vendido)} caption="Soma das vendas fechadas" />
              </div>
            </section>
          </>
        )}

        {isNewAccount && (
          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="text-base font-semibold text-slate-900">Como funciona</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
                Cadastre o cliente e marque quando falar com ele de novo.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
                No dia marcado, ele aparece no topo desta tela.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
                Clique em “Chamar no WhatsApp”, envie a mensagem pronta e marque o próximo retorno.
              </li>
            </ol>
            <Link href="/leads/novo" className={`${btnPrimary} mt-5`}>
              <PlusIcon className="h-4 w-4" />
              Cadastrar cliente
            </Link>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
