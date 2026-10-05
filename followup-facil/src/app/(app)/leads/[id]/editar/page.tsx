import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { updateLead, type LeadFormValues } from '@/actions/leads';
import { DeleteLeadButton } from '@/components/delete-lead-button';
import { LeadForm } from '@/components/lead-form';
import { PageContainer, PageHeader } from '@/components/page-layout';
import { getSessionContext } from '@/lib/auth';
import { loadLead } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { formatMoneyInput } from '@/lib/format';

export const metadata: Metadata = { title: 'Editar lead' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditLeadPage({ params }: Props) {
  const [{ supabase }, { id }] = await Promise.all([getSessionContext(), params]);

  const data = await loadLead(supabase, id);
  if (!data) notFound();
  const { lead } = data;

  const initial: LeadFormValues = {
    name: lead.name,
    whatsapp: lead.whatsapp ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    source: lead.source,
    interest: lead.interest ?? '',
    estimated_value: formatMoneyInput(lead.estimated_value),
    stage: lead.stage,
    notes: lead.notes ?? '',
    next_contact_at: lead.next_contact_at ?? '',
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Editar lead" subtitle={lead.name} />
        <LeadForm
          action={updateLead.bind(null, lead.id)}
          initial={initial}
          today={todayISO()}
          submitLabel="Salvar alterações"
          cancelHref={`/leads/${lead.id}`}
        />
        <div className="mt-10 border-t border-slate-200 pt-6">
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
        </div>
      </div>
    </PageContainer>
  );
}
