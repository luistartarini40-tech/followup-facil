// Estilos reutilizados (Tailwind). Mantém botões e campos iguais no sistema todo.
//
// Regra: nunca "corrigir" um destes estilos somando outra classe da mesma
// propriedade (ex.: btnPrimary + 'py-3'). No Tailwind quem vence é a ordem do
// CSS, não a ordem das classes. Para outro tamanho ou cor, use a variante certa.

const btnShape =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const sizeSm = 'px-3 py-2 text-sm';
const sizeMd = 'px-4 py-2.5 text-sm';
const sizeLg = 'px-6 py-3 text-base';

const primary = 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600';
const secondary =
  'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-brand-600';

export const btnPrimary = `${btnShape} ${sizeMd} ${primary}`;
export const btnPrimarySm = `${btnShape} ${sizeSm} ${primary}`;
export const btnPrimaryLg = `${btnShape} ${sizeLg} ${primary}`;

export const btnSecondary = `${btnShape} ${sizeMd} ${secondary}`;
export const btnSecondaryLg = `${btnShape} ${sizeLg} ${secondary}`;

export const btnWhatsApp = `${btnShape} ${sizeMd} bg-green-700 text-white hover:bg-green-800 focus-visible:outline-green-700`;

export const btnDanger = `${btnShape} ${sizeMd} border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-600`;
export const btnDangerSolid = `${btnShape} ${sizeMd} bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600`;

/** Aparência dos campos, sem definir largura. */
export const inputBase =
  'rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none sm:text-sm';

/** Campo ocupando toda a largura (o caso comum). */
export const inputClass = `block w-full ${inputBase}`;

/** Campo com erro. */
export const inputErrorClass =
  'block w-full rounded-lg border border-red-400 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none sm:text-sm';

export const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

export const errorTextClass = 'mt-1.5 text-sm text-red-600';
