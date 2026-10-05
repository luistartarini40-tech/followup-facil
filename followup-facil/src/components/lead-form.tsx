'use client';

import Link from 'next/link';
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import type { LeadFormState, LeadFormValues } from '@/actions/leads';
import { SOURCES, STAGES } from '@/lib/constants';
import { addDaysISO, describeFollowUp } from '@/lib/dates';
import { formatPhoneBR } from '@/lib/format';
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  errorTextClass,
  inputBase,
  inputClass,
  inputErrorClass,
  labelClass,
} from '@/lib/ui';
import { FormMessage } from './form-bits';

type Props = {
  action: (prev: LeadFormState, formData: FormData) => Promise<LeadFormState>;
  initial: LeadFormValues;
  today: string;
  submitLabel: string;
  cancelHref: string;
};

const QUICK_DATES = [
  { label: 'Hoje', days: 0 },
  { label: 'Amanhã', days: 1 },
  { label: 'Em 3 dias', days: 3 },
  { label: 'Em 1 semana', days: 7 },
];

/** Formulário de lead (usado para cadastrar e para editar). */
export function LeadForm({ action, initial, today, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as LeadFormState);
  // Campos controlados: se o servidor recusar algo, nada do que foi digitado se perde.
  const [values, setValues] = useState<LeadFormValues>(initial);

  const set = (field: keyof LeadFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  // Enviamos pelo onSubmit (e não por <form action>) de propósito: com "action",
  // o React 19 limpa o formulário ao terminar e os campos <select> voltam para a
  // primeira opção mesmo quando o servidor recusou o envio.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const errors = state.fieldErrors ?? {};
  const sources = (SOURCES as readonly string[]).includes(values.source) || !values.source
    ? SOURCES
    : [...SOURCES, values.source];

  const field = (hasError: boolean) => (hasError ? inputErrorClass : inputClass);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-slate-900">Quem é o cliente</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>
              Nome <span className="text-red-600">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={120}
              autoComplete="off"
              autoFocus={!initial.name}
              value={values.name}
              onChange={(e) => set('name')(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              placeholder="Ex.: João da Silva"
              className={field(Boolean(errors.name))}
            />
            {errors.name && <p className={errorTextClass}>{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="whatsapp" className={labelClass}>
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={values.whatsapp}
              onChange={(e) => set('whatsapp')(formatPhoneBR(e.target.value))}
              placeholder="(11) 98888-7777"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">Com DDD. É o número usado no botão do WhatsApp.</p>
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Outro telefone <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={values.phone}
              onChange={(e) => set('phone')(formatPhoneBR(e.target.value))}
              placeholder="(11) 3333-4444"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              maxLength={160}
              value={values.email}
              onChange={(e) => set('email')(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              placeholder="cliente@email.com"
              className={field(Boolean(errors.email))}
            />
            {errors.email && <p className={errorTextClass}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="source" className={labelClass}>
              Por onde chegou
            </label>
            <select
              id="source"
              name="source"
              value={values.source}
              onChange={(e) => set('source')(e.target.value)}
              className={inputClass}
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-slate-900">O que ele quer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="interest" className={labelClass}>
              Serviço ou produto de interesse
            </label>
            <input
              id="interest"
              name="interest"
              type="text"
              maxLength={200}
              autoComplete="off"
              value={values.interest}
              onChange={(e) => set('interest')(e.target.value)}
              placeholder="Ex.: Pacote de fotos para casamento"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="estimated_value" className={labelClass}>
              Valor estimado
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                R$
              </span>
              <input
                id="estimated_value"
                name="estimated_value"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={values.estimated_value}
                onChange={(e) => set('estimated_value')(e.target.value.replace(/[^\d.,]/g, ''))}
                aria-invalid={Boolean(errors.estimated_value)}
                placeholder="0,00"
                className={`${field(Boolean(errors.estimated_value))} pl-10`}
              />
            </div>
            {errors.estimated_value && <p className={errorTextClass}>{errors.estimated_value}</p>}
          </div>

          <div>
            <label htmlFor="stage" className={labelClass}>
              Etapa
            </label>
            <select
              id="stage"
              name="stage"
              value={values.stage}
              onChange={(e) => set('stage')(e.target.value)}
              className={inputClass}
            >
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>
              Observações <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={4000}
              value={values.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Ex.: Prefere ser chamado depois das 18h."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Quando falar com ele de novo?</h2>
        <p className="mt-1 text-sm text-slate-600">
          No dia marcado, este cliente aparece no topo do seu painel.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {QUICK_DATES.map((option) => {
            const date = addDaysISO(today, option.days);
            const selected = values.next_contact_at === date;
            return (
              <button
                key={option.days}
                type="button"
                onClick={() => set('next_contact_at')(date)}
                aria-pressed={selected}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700'
                }`}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => set('next_contact_at')('')}
            aria-pressed={values.next_contact_at === ''}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              values.next_contact_at === ''
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            Sem data
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="next_contact_at" className="text-sm text-slate-600">
            Ou escolha a data:
          </label>
          <input
            id="next_contact_at"
            name="next_contact_at"
            type="date"
            value={values.next_contact_at}
            onChange={(e) => set('next_contact_at')(e.target.value)}
            aria-invalid={Boolean(errors.next_contact_at)}
            className={inputBase}
          />
          {values.next_contact_at && (
            <span className="text-sm text-slate-600">{describeFollowUp(values.next_contact_at, today)}</span>
          )}
        </div>
        {errors.next_contact_at && <p className={errorTextClass}>{errors.next_contact_at}</p>}
      </section>

      <FormMessage error={state.error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={btnSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
