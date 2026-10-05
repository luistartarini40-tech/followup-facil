import type { Metadata } from 'next';
import { LeadsListView } from '@/components/leads-list-view';
import { getSessionContext } from '@/lib/auth';
import { loadLeads } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { parseLeadFilters } from '@/lib/filters';

export const metadata: Metadata = { title: 'Leads' };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const [{ supabase }, params] = await Promise.all([getSessionContext(), searchParams]);
  const today = todayISO();
  const filters = parseLeadFilters(params);
  const result = await loadLeads(supabase, filters, today);

  return <LeadsListView filters={filters} result={result} today={today} />;
}
