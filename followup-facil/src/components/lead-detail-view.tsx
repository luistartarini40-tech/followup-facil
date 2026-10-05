import Link from 'next/link';
import type { ReactNode } from 'react';
import { describeFollowUp, followUpStatus, formatDateBR, formatDateTimeBR } from '@/lib/dates';
import { formatBRL } from '@/lib/format';
import type { Interaction, Lead } from '@/lib/types';
import { btnSecondary, cardClass } from '@/lib/ui';
import { StageBadge } from './badges';
import { FollowUpButton, RescheduleButton } from './follow-up-button';
import { AddNoteForm, Timeline } from './history';
import { AlertIcon, CalendarIcon, ChevronLeftIcon, ClockIcon, MailIcon, PencilIcon, PhoneIcon } from './icons';
import { PageContainer } from './page-layout';
import { StageStepper } from './stage-stepper';
import { WhatsAppButton } from './whatsapp-button';

type Props = {
  lead: Lead;
  interactions: Interaction[];
  today: string;
};

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm break-words text-slate-800">{children}</dd>
    </div>
  );
}

const empty = <span className="text-slate-400">Não informado</span>;

export function LeadDetailView({ lead, interactions, today }: Props) {
  const status = followUpStatus(lead.next_contact_at, today);

  const followUpBox = {
    atrasado: { box: 'border-red-200 bg-red-50', text: 'text-red-800', icon: <AlertIcon className="h-5 w-5" /> },
    hoje: { box: 'border-amber-200 bg-amber-50', text: 'text-amber-900', icon: <ClockIcon className="h-5 w-5" /> },
    futuro: { box: 'border-slate-200 bg-white', text: 'text-slate-800', icon: <CalendarIcon className="h-5 w-5" /> },
    sem: { box: 'border-dashed border-slate-300 bg-white', text: 'text-slate-600', icon: <CalendarIcon className="h-5 w-5" /> },
  }[status];

  const followUpText = {
    atrasado: `${describeFollowUp(lead.next_contact_at, today)} — era para ${formatDateBR(lead.next_contact_at)}`,
    hoje: 'O retorno deste cliente é hoje',
    futuro: `Próximo contato em ${formatDateBR(lead.next_contact_at)} (${describeFollowUp(lead.next_contact_at, today).toLowerCase()})`,
    sem: 'Sem data de retorno marcada',
  }[status];

  return (
    <PageContainer>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ChevronLeftIcon className="h-4 w-4" />
        Leads
      </Link>

      <div className="space-y-5">
        {/* Cabeçalho: quem é e o que fazer agora */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-2xl font-bold tracking-tight break-words text-slate-900">{lead.name}</h1>
                <StageBadge stage={lead.stage} />
              </div>
              <p className="mt-1.5 text-sm text-slate-600">
                {[lead.interest, lead.estimated_value > 0 ? formatBRL(lead.estimated_value) : null]
                  .filter(Boolean)
                  .join(' · ') || 'Sem interesse informado'}
              </p>
            </div>
            <Link href={`/leads/${lead.id}/editar`} className={btnSecondary}>
              <PencilIcon className="h-4 w-4" />
              Editar
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <WhatsAppButton lead={lead} />
            <FollowUpButton lead={lead} />
          </div>
        </section>

        {/* Próximo contato */}
        <section className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 sm:px-6 ${followUpBox.box}`}>
          <p className={`flex items-center gap-2.5 text-sm font-semibold ${followUpBox.text}`}>
            {followUpBox.icon}
            {followUpText}
          </p>
          <RescheduleButton lead={lead} label={status === 'sem' ? 'Marcar data' : 'Alterar data'} />
        </section>

        {/* Etapa */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Etapa da negociação</h2>
          <StageStepper leadId={lead.id} stage={lead.stage} />
        </section>

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Histórico */}
          <section className={`${cardClass} p-5 sm:p-6 lg:col-span-3`}>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Histórico</h2>
            <AddNoteForm leadId={lead.id} />
            <div className="mt-6 border-t border-slate-100 pt-5">
              <Timeline interactions={interactions} />
            </div>
          </section>

          {/* Dados do cliente */}
          <section className={`${cardClass} self-start p-5 sm:p-6 lg:col-span-2`}>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Dados do cliente</h2>
            <dl className="space-y-4">
              <Detail label="WhatsApp">{lead.whatsapp || empty}</Detail>
              <Detail label="Outro telefone">
                {lead.phone ? (
                  <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                ) : (
                  empty
                )}
              </Detail>
              <Detail label="E-mail">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
                    <MailIcon className="h-3.5 w-3.5" />
                    {lead.email}
                  </a>
                ) : (
                  empty
                )}
              </Detail>
              <Detail label="Origem">{lead.source}</Detail>
              <Detail label="Valor estimado">{lead.estimated_value > 0 ? formatBRL(lead.estimated_value) : empty}</Detail>
              <Detail label="Observações">
                {lead.notes ? <span className="whitespace-pre-line">{lead.notes}</span> : empty}
              </Detail>
              <Detail label="Cadastrado em">{formatDateTimeBR(lead.created_at)}</Detail>
            </dl>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
