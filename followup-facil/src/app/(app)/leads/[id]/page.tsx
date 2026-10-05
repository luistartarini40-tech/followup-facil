import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadDetailView } from '@/components/lead-detail-view';
import { getSessionContext } from '@/lib/auth';
import { loadLead } from '@/lib/data';
import { todayISO } from '@/lib/dates';

export const metadata: Metadata = { title: 'Lead' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadPage({ params }: Props) {
  const [{ supabase }, { id }] = await Promise.all([getSessionContext(), params]);

  // Lead de outra empresa também cai aqui: para o banco, ele "não existe".
  const data = await loadLead(supabase, id);
  if (!data) notFound();

  return <LeadDetailView lead={data.lead} interactions={data.interactions} today={todayISO()} />;
}
