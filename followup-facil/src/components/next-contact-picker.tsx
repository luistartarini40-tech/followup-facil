'use client';

import { useId } from 'react';
import { addDaysISO, describeFollowUp, formatDateBR } from '@/lib/dates';
import { inputBase } from '@/lib/ui';

const QUICK_OPTIONS = [
  { label: 'Amanhã', days: 1 },
  { label: 'Em 2 dias', days: 2 },
  { label: 'Em 3 dias', days: 3 },
  { label: 'Em 1 semana', days: 7 },
  { label: 'Em 15 dias', days: 15 },
  { label: 'Em 30 dias', days: 30 },
];

type Props = {
  today: string;
  /** undefined = ainda não escolheu · null = sem próximo contato · 'AAAA-MM-DD' = data */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  /** Mostra a opção "Hoje" (útil ao cadastrar um lead novo). */
  includeToday?: boolean;
  /** Texto da opção de não agendar. */
  noneLabel?: string;
};

const chip = (selected: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    selected
      ? 'border-brand-600 bg-brand-600 text-white'
      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700'
  }`;

/** Escolha rápida de quando falar com o cliente de novo. */
export function NextContactPicker({
  today,
  value,
  onChange,
  includeToday = false,
  noneLabel = 'Sem próximo contato',
}: Props) {
  const inputId = useId();
  const options = includeToday ? [{ label: 'Hoje', days: 0 }, ...QUICK_OPTIONS] : QUICK_OPTIONS;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const date = addDaysISO(today, option.days);
          return (
            <button
              key={option.days}
              type="button"
              onClick={() => onChange(date)}
              aria-pressed={value === date}
              className={chip(value === date)}
            >
              {option.label}
            </button>
          );
        })}
        <button type="button" onClick={() => onChange(null)} aria-pressed={value === null} className={chip(value === null)}>
          {noneLabel}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600" htmlFor={inputId}>
          Ou escolha a data:
        </label>
        <input
          id={inputId}
          type="date"
          min={today}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || null)}
          className={inputBase}
        />
      </div>

      {value && (
        <p className="mt-3 text-sm text-slate-600">
          Próximo contato: <strong className="text-slate-900">{formatDateBR(value)}</strong> (
          {describeFollowUp(value, today).toLowerCase()})
        </p>
      )}
    </div>
  );
}
