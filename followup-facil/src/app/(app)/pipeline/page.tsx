import type { Metadata } from 'next';
import Link from 'next/link';
import { KanbanBoard } from '@/components/kanban-board';
import { PlusIcon } from '@/components/icons';
import { PageContainer, PageHeader } from '@/components/page-layout';
import { getDashboardStats, getSessionContext } from '@/lib/auth';
import { loadPipeline } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { formatBRLShort } from '@/lib/format';
import { btnPrimary } from '@/lib/ui';

export const metadata: Metadata = { title: 'Pipeline' };

export default async function PipelinePage() {
  const { supabase } = await getSessionContext();
  const [leads, stats] = await Promise.all([loadPipeline(supabase), getDashboardStats(todayISO())]);

  return (
    <PageContainer wide>
      <PageHeader
        title="Pipeline"
        subtitle={`${stats.abertos} em negociação · ${formatBRLShort(stats.valor_negociacao)} em aberto. Arraste o cliente para mudar de etapa.`}
        actions={
          <span className="hidden lg:block">
            <Link href="/leads/novo" className={btnPrimary}>
              <PlusIcon className="h-4 w-4" />
              Novo lead
            </Link>
          </span>
        }
      />
      <KanbanBoard leads={leads} closedTotals={{ fechado: stats.fechados, perdido: stats.perdidos }} />
    </PageContainer>
  );
}
