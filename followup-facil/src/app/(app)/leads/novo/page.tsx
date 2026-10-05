import type { Metadata } from 'next';
import { createLead, type LeadFormValues } from '@/actions/leads';
import { LeadForm } from '@/components/lead-form';
import { PageContainer, PageHeader } from '@/components/page-layout';
import { isStageId } from '@/lib/constants';
import { todayISO } from '@/lib/dates';

export const metadata: Metadata = { title: 'Novo lead' };

type Props = {
  searchParams: Promise<{ etapa?: string }>;
};

export default async function NewLeadPage({ searchParams }: Props) {
  const { etapa } = await searchParams;
  const today = todayISO();

  const initial: LeadFormValues = {
    name: '',
    whatsapp: '',
    phone: '',
    email: '',
    source: 'WhatsApp',
    interest: '',
    estimated_value: '',
    stage: isStageId(etapa) ? etapa : 'novo',
    notes: '',
    // já nasce com retorno para hoje: lead novo é para responder logo
    next_contact_at: today,
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Novo lead" subtitle="Só o nome é obrigatório. O resto você completa depois." />
        <LeadForm action={createLead} initial={initial} today={today} submitLabel="Salvar lead" cancelHref="/leads" />
      </div>
    </PageContainer>
  );
}
