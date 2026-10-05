import type { StageId } from './constants';

export type Company = {
  id: string;
  name: string;
};

export type Profile = {
  id: string;
  company_id: string;
  full_name: string;
  role: 'owner' | 'member';
};

// Campos usados em listas, painel e pipeline.
export type LeadSummary = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  interest: string | null;
  source: string;
  estimated_value: number;
  stage: StageId;
  next_contact_at: string | null; // 'AAAA-MM-DD'
  created_at: string;
};

export type Lead = LeadSummary & {
  email: string | null;
  notes: string | null;
  closed_at: string | null;
  updated_at: string;
};

export type InteractionType = 'criacao' | 'nota' | 'etapa' | 'agenda' | 'whatsapp' | 'retorno';

export type Interaction = {
  id: string;
  lead_id: string;
  type: InteractionType;
  content: string;
  created_at: string;
};

export type DashboardStats = {
  total: number;
  novos: number;
  abertos: number;
  orcamentos: number;
  fechados: number;
  perdidos: number;
  hoje: number;
  atrasados: number;
  sem_retorno: number;
  valor_negociacao: number;
  valor_vendido: number;
};

// Resposta padrão das ações chamadas por botões (sem formulário).
export type ActionResult = { ok: true } | { ok: false; error: string };
