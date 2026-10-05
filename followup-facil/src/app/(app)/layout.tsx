import { AppProvider } from '@/components/app-context';
import { AppShell } from '@/components/app-shell';
import { getDashboardStats, getSessionContext } from '@/lib/auth';
import { todayISO } from '@/lib/dates';

// Moldura da área logada: confere a sessão e monta o menu.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, company } = await getSessionContext();
  const today = todayISO();
  const stats = await getDashboardStats(today);

  return (
    <AppProvider value={{ today, userName: profile.full_name, companyName: company.name }}>
      <AppShell
        userName={profile.full_name}
        companyName={company.name}
        pendingCount={stats.hoje + stats.atrasados}
      >
        {children}
      </AppShell>
    </AppProvider>
  );
}
