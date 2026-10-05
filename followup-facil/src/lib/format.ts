const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/** 850 -> 'R$ 850,00' */
export function formatBRL(value: number | string | null | undefined): string {
  return brl.format(Number(value) || 0);
}

/** 850 -> 'R$ 850' (sem centavos, para cartões e colunas) */
export function formatBRLShort(value: number | string | null | undefined): string {
  return brlCompact.format(Number(value) || 0);
}

/** Valor para preencher o campo do formulário: 1250.5 -> '1.250,50' */
export function formatMoneyInput(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  if (n === 0) return '';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * Entende o que o usuário digitou como dinheiro:
 * '850', '850,00', '1.250,50', 'R$ 1.250', '1250.50' -> número.
 * Retorna null se não for um valor válido.
 */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[R$\s]/g, '');
  if (s === '') return 0;
  if (s.includes(',')) {
    // padrão brasileiro: ponto é milhar, vírgula é decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // '1.250' sem vírgula: ponto é milhar
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Máscara de telefone brasileiro enquanto digita: (11) 98888-7777 */
export function formatPhoneBR(value: string): string {
  const raw = value.trim();
  // números internacionais (+351...) ficam como o usuário digitou
  if (raw.startsWith('+')) return raw.slice(0, 20);
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
