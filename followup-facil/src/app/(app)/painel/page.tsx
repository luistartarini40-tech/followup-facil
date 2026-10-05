import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard-view';
import { getDashboardStats, getSessionContext } from '@/lib/auth';
import { loadDueLeads, loadUpcomingLeads } from '@/lib/data';
import { todayISO } from '@/lib/dates';

export const metadata: Metadata = { title: 'Painel' };

type Props = {
  searchParams: Promise<{ senha?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { supabase, profile } = await getSessionContext();
  const today = todayISO();

  const [stats, due, upcoming, params] = await Promise.all([
    getDashboardStats(today),
    loadDueLeads(supabase, today),
    loadUpcomingLeads(supabase, today),
    searchParams,
  ]);

  return (
    <DashboardView
      userName={profile.full_name}
      today={today}
      stats={stats}
      due={due}
      upcoming={upcoming}
      notice={params.senha === 'alterada' ? 'Senha alterada com sucesso.' : undefined}
    />
  );
}
