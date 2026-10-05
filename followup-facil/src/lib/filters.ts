import { FOLLOWUP_FILTERS, isStageId, type FollowUpFilter, type StageId } from './constants';
import { isISODate } from './dates';

export type LeadFilters = {
  q: string;
  etapa: StageId | '';
  origem: string;
  retorno: FollowUpFilter | '';
  de: string; // criado a partir de (AAAA-MM-DD)
  ate: string; // criado até (AAAA-MM-DD)
  pagina: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Lê os filtros da URL (?q=...&etapa=...) validando cada um. */
export function parseLeadFilters(params: RawParams): LeadFilters {
  const etapa = first(params.etapa);
  const retorno = first(params.retorno);
  const de = first(params.de);
  const ate = first(params.ate);
  const pagina = Number.parseInt(first(params.pagina), 10);

  return {
    q: first(params.q).trim().slice(0, 80),
    etapa: isStageId(etapa) ? etapa : '',
    origem: first(params.origem).trim().slice(0, 60),
    retorno: FOLLOWUP_FILTERS.some((f) => f.id === retorno) ? (retorno as FollowUpFilter) : '',
    de: isISODate(de) ? de : '',
    ate: isISODate(ate) ? ate : '',
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  };
}

export function hasActiveFilters(f: LeadFilters): boolean {
  return Boolean(f.q || f.etapa || f.origem || f.retorno || f.de || f.ate);
}

/** Monta a URL da lista mantendo os filtros (usado na paginação). */
export function leadsUrl(f: LeadFilters, overrides: Partial<LeadFilters> = {}): string {
  const merged = { ...f, ...overrides };
  const qs = new URLSearchParams();
  if (merged.q) qs.set('q', merged.q);
  if (merged.etapa) qs.set('etapa', merged.etapa);
  if (merged.origem) qs.set('origem', merged.origem);
  if (merged.retorno) qs.set('retorno', merged.retorno);
  if (merged.de) qs.set('de', merged.de);
  if (merged.ate) qs.set('ate', merged.ate);
  if (merged.pagina > 1) qs.set('pagina', String(merged.pagina));
  const s = qs.toString();
  return s ? `/leads?${s}` : '/leads';
}
