import type { SupabaseClient } from '@supabase/supabase-js';
import { CLOSED_STAGES, OPEN_STAGES, PAGE_SIZE, UUID_RE } from './constants';
import { addDaysISO, zonedDayStart } from './dates';
import type { LeadFilters } from './filters';
import { onlyDigits } from './format';
import type { DashboardStats, Interaction, Lead, LeadSummary } from './types';

// Consultas ao banco. Todas recebem o cliente do usuário logado, então o
// RLS garante que só voltam dados da empresa dele.

const SUMMARY_COLUMNS =
  'id, name, phone, whatsapp, interest, source, estimated_value, stage, next_contact_at, created_at';

const LEAD_COLUMNS = `${SUMMARY_COLUMNS}, email, notes, closed_at, updated_at`;

const EMPTY_STATS: DashboardStats = {
  total: 0,
  novos: 0,
  abertos: 0,
  orcamentos: 0,
  fechados: 0,
  perdidos: 0,
  hoje: 0,
  atrasados: 0,
  sem_retorno: 0,
  valor_negociacao: 0,
  valor_vendido: 0,
};

function fail(what: string, message: string): never {
  throw new Error(`Não foi possível carregar ${what}: ${message}`);
}

function toSummary<T extends LeadSummary>(row: T): T {
  return { ...row, estimated_value: Number(row.estimated_value) || 0 };
}

export async function loadDashboardStats(supabase: SupabaseClient, today: string): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('dashboard_stats', { p_today: today });
  if (error) fail('os indicadores', error.message);

  const raw = (data ?? {}) as Partial<Record<keyof DashboardStats, number | string>>;
  const stats = { ...EMPTY_STATS };
  (Object.keys(stats) as (keyof DashboardStats)[]).forEach((key) => {
    stats[key] = Number(raw[key]) || 0;
  });
  return stats;
}

/** Leads com retorno para hoje ou atrasado (mais atrasados primeiro). */
export async function loadDueLeads(supabase: SupabaseClient, today: string): Promise<LeadSummary[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(SUMMARY_COLUMNS)
    .lte('next_contact_at', today)
    .order('next_contact_at', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) fail('os retornos de hoje', error.message);
  return ((data ?? []) as unknown as LeadSummary[]).map(toSummary);
}

/** Próximos retornos (de amanhã até 7 dias), para o usuário se planejar. */
export async function loadUpcomingLeads(supabase: SupabaseClient, today: string): Promise<LeadSummary[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(SUMMARY_COLUMNS)
    .gt('next_contact_at', today)
    .lte('next_contact_at', addDaysISO(today, 7))
    .order('next_contact_at', { ascending: true })
    .limit(8);

  if (error) fail('os próximos retornos', error.message);
  return ((data ?? []) as unknown as LeadSummary[]).map(toSummary);
}

export type LeadsPage = {
  leads: LeadSummary[];
  total: number;
  page: number;
  pageCount: number;
};

/**
 * Prepara o texto de busca: sem acentos, em minúsculas (igual à coluna
 * search_text do banco) e sem caracteres com significado especial no filtro.
 */
function sanitizeSearch(q: string): string {
  return q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[%*\\"(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function loadLeads(
  supabase: SupabaseClient,
  filters: LeadFilters,
  today: string,
): Promise<LeadsPage> {
  let query = supabase.from('leads').select(SUMMARY_COLUMNS, { count: 'exact' });

  const term = sanitizeSearch(filters.q);
  if (term) {
    const parts = [`search_text.ilike."*${term}*"`];
    const digits = onlyDigits(term);
    if (digits.length >= 3) parts.push(`phone_search.ilike."*${digits}*"`);
    query = query.or(parts.join(','));
  }

  if (filters.etapa) query = query.eq('stage', filters.etapa);
  if (filters.origem) query = query.eq('source', filters.origem);
  if (filters.de) query = query.gte('created_at', zonedDayStart(filters.de));
  if (filters.ate) query = query.lt('created_at', zonedDayStart(addDaysISO(filters.ate, 1)));

  if (filters.retorno === 'hoje') query = query.eq('next_contact_at', today);
  if (filters.retorno === 'atrasados') query = query.lt('next_contact_at', today);
  if (filters.retorno === 'pendentes') query = query.lte('next_contact_at', today);
  if (filters.retorno === 'sem') query = query.is('next_contact_at', null).in('stage', OPEN_STAGES);

  const byFollowUp = filters.retorno && filters.retorno !== 'sem';
  query = byFollowUp
    ? query.order('next_contact_at', { ascending: true }).order('created_at', { ascending: false })
    : query.order('created_at', { ascending: false });

  const from = (filters.pagina - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  // página além do fim: devolve lista vazia em vez de erro
  if (error && error.code !== 'PGRST103') fail('os leads', error.message);

  const total = count ?? 0;
  return {
    leads: ((data ?? []) as unknown as LeadSummary[]).map(toSummary),
    total,
    page: filters.pagina,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function loadLead(
  supabase: SupabaseClient,
  id: string,
): Promise<{ lead: Lead; interactions: Interaction[] } | null> {
  if (!UUID_RE.test(id)) return null;

  const [leadResult, historyResult] = await Promise.all([
    supabase.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle(),
    supabase
      .from('lead_interactions')
      .select('id, lead_id, type, content, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (leadResult.error) fail('o lead', leadResult.error.message);
  if (!leadResult.data) return null;
  if (historyResult.error) fail('o histórico', historyResult.error.message);

  return {
    lead: toSummary(leadResult.data as unknown as Lead),
    interactions: (historyResult.data ?? []) as unknown as Interaction[],
  };
}

export const PIPELINE_OPEN_LIMIT = 400;
export const PIPELINE_CLOSED_LIMIT = 15;

/**
 * Leads do pipeline: todas as negociações abertas e só os fechados/perdidos
 * mais recentes (para as colunas finais não ficarem enormes).
 */
export async function loadPipeline(supabase: SupabaseClient): Promise<LeadSummary[]> {
  const open = supabase
    .from('leads')
    .select(SUMMARY_COLUMNS)
    .in('stage', OPEN_STAGES)
    .order('next_contact_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(PIPELINE_OPEN_LIMIT);

  const closed = CLOSED_STAGES.map((stage) =>
    supabase
      .from('leads')
      .select(SUMMARY_COLUMNS)
      .eq('stage', stage)
      .order('closed_at', { ascending: false, nullsFirst: false })
      .limit(PIPELINE_CLOSED_LIMIT),
  );

  const results = await Promise.all([open, ...closed]);
  const leads: LeadSummary[] = [];
  for (const { data, error } of results) {
    if (error) fail('o pipeline', error.message);
    leads.push(...((data ?? []) as unknown as LeadSummary[]).map(toSummary));
  }
  return leads;
}
