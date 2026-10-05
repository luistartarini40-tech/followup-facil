// Etapas do funil. A ordem aqui é a ordem das colunas do pipeline.
export const STAGES = [
  {
    id: 'novo',
    label: 'Novo',
    hint: 'Acabou de chegar',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  {
    id: 'contato',
    label: 'Contato realizado',
    hint: 'Já conversamos',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  {
    id: 'orcamento',
    label: 'Orçamento enviado',
    hint: 'Proposta na mão do cliente',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  {
    id: 'aguardando',
    label: 'Aguardando resposta',
    hint: 'Cliente ficou de retornar',
    badge: 'bg-orange-50 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
  },
  {
    id: 'fechado',
    label: 'Fechado',
    hint: 'Venda feita',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    id: 'perdido',
    label: 'Perdido',
    hint: 'Não avançou',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

export const STAGE_IDS: StageId[] = STAGES.map((s) => s.id);
export const OPEN_STAGES: StageId[] = ['novo', 'contato', 'orcamento', 'aguardando'];
export const CLOSED_STAGES: StageId[] = ['fechado', 'perdido'];

export function isStageId(value: unknown): value is StageId {
  return typeof value === 'string' && (STAGE_IDS as string[]).includes(value);
}

export function getStage(id: string) {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

// Origens sugeridas no cadastro do lead.
export const SOURCES = [
  'WhatsApp',
  'Instagram',
  'Indicação',
  'Facebook',
  'Google',
  'Site',
  'Loja física',
  'Outro',
] as const;

// Filtros de retorno usados na lista de leads.
export const FOLLOWUP_FILTERS = [
  { id: 'pendentes', label: 'Para hoje + atrasados' },
  { id: 'hoje', label: 'Só para hoje' },
  { id: 'atrasados', label: 'Só atrasados' },
  { id: 'sem', label: 'Em aberto e sem data' },
] as const;

export type FollowUpFilter = (typeof FOLLOWUP_FILTERS)[number]['id'];

export const PAGE_SIZE = 25;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
