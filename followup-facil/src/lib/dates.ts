// Datas do sistema.
// "Hoje" é sempre calculado no fuso do negócio (padrão: Brasília), e não no
// fuso do servidor — na Vercel o servidor roda em UTC, e às 22h de Brasília
// já seria "amanhã" se usássemos a data do servidor.

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Sao_Paulo';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function partsInZone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Data de hoje no fuso do negócio, no formato 'AAAA-MM-DD'. */
export function todayISO(now: Date = new Date()): string {
  const p = partsInZone(now);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Soma dias a uma data 'AAAA-MM-DD'. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Quantos dias de `from` até `to` (positivo = `to` está no futuro). */
export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** 'AAAA-MM-DD' -> 'DD/MM' */
export function formatDayMonth(iso: string | null | undefined): string {
  if (!iso) return '';
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}`;
}

/** Data e hora (vinda do banco em UTC) no fuso do negócio: 'DD/MM/AAAA às HH:MM'. */
export function formatDateTimeBR(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const p = partsInZone(date);
  return `${pad(p.day)}/${pad(p.month)}/${p.year} às ${pad(p.hour)}:${pad(p.minute)}`;
}

/** Só a data (no fuso do negócio) de um timestamp do banco: 'AAAA-MM-DD'. */
export function timestampToISODate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return todayISO(date);
}

/** Ex.: 'domingo, 4 de outubro' */
export function formatLongDate(iso: string): string {
  const text = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${iso}T12:00:00Z`));
  return text;
}

/**
 * Instante (UTC) em que um dia começa no fuso do negócio.
 * Usado para filtrar "criado entre as datas X e Y".
 */
export function zonedDayStart(iso: string): string {
  const utcMidnight = new Date(`${iso}T00:00:00Z`);
  const p = partsInZone(utcMidnight);
  const asIfUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMs = asIfUTC - utcMidnight.getTime();
  return new Date(utcMidnight.getTime() - offsetMs).toISOString();
}

export type FollowUpStatus = 'sem' | 'atrasado' | 'hoje' | 'futuro';

export function followUpStatus(next: string | null, today: string): FollowUpStatus {
  if (!next) return 'sem';
  if (next < today) return 'atrasado';
  if (next === today) return 'hoje';
  return 'futuro';
}

/** Texto curto para o usuário: 'Hoje', 'Atrasado há 3 dias', 'Amanhã', 'Em 5 dias'. */
export function describeFollowUp(next: string | null, today: string): string {
  if (!next) return 'Sem data de retorno';
  const days = diffDays(today, next);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Atrasado desde ontem';
  if (days < 0) return `Atrasado há ${-days} dias`;
  return `Em ${days} dias`;
}
