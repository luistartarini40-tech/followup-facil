'use client';

import { useCallback, useState, useTransition } from 'react';
import { registerFollowUp, scheduleNextContact } from '@/actions/leads';
import { firstName } from '@/lib/format';
import type { LeadSummary } from '@/lib/types';
import { btnPrimary, btnSecondary, inputClass, labelClass } from '@/lib/ui';
import { useApp } from './app-context';
import { FormMessage } from './form-bits';
import { CalendarIcon, CheckIcon } from './icons';
import { Modal } from './modal';
import { NextContactPicker } from './next-contact-picker';

type Props = {
  lead: Pick<LeadSummary, 'id' | 'name'>;
  label?: string;
  className?: string;
};

/**
 * "Registrar retorno": o usuário já falou com o cliente (por qualquer meio),
 * anota o que aconteceu e marca quando falar de novo.
 */
export function FollowUpButton({ lead, label = 'Registrar retorno', className = btnSecondary }: Props) {
  const { today } = useApp();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => setOpen(false), []);

  function openDialog() {
    setNote('');
    setNextDate(undefined);
    setError('');
    setOpen(true);
  }

  function save() {
    if (nextDate === undefined) {
      setError('Escolha quando falar de novo (ou "Sem próximo contato").');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await registerFollowUp(lead.id, { note, nextDate });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        <CheckIcon className="h-4 w-4" />
        {label}
      </button>

      <Modal open={open} onClose={close} title="Registrar retorno" subtitle={lead.name}>
        <div className="space-y-5">
          <div>
            <label htmlFor={`followup-note-${lead.id}`} className={labelClass}>
              O que aconteceu? <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id={`followup-note-${lead.id}`}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1500}
              placeholder="Ex.: Disse que vai analisar e pediu para chamar na sexta."
              className={inputClass}
            />
          </div>

          <div>
            <p className={labelClass}>Quando falar com {firstName(lead.name) || 'o cliente'} de novo?</p>
            <NextContactPicker today={today} value={nextDate} onChange={setNextDate} />
          </div>

          <FormMessage error={error} />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className={btnSecondary}>
              Cancelar
            </button>
            <button type="button" onClick={save} disabled={pending} className={btnPrimary}>
              {pending ? 'Salvando...' : 'Salvar retorno'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** "Alterar data": só muda quando falar de novo, sem registrar um retorno. */
export function RescheduleButton({
  lead,
  label = 'Alterar data',
  className = btnSecondary,
}: {
  lead: Pick<LeadSummary, 'id' | 'name' | 'next_contact_at'>;
  label?: string;
  className?: string;
}) {
  const { today } = useApp();
  const [open, setOpen] = useState(false);
  const [nextDate, setNextDate] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => setOpen(false), []);

  function openDialog() {
    setNextDate(lead.next_contact_at ?? undefined);
    setError('');
    setOpen(true);
  }

  function save() {
    if (nextDate === undefined) return;
    setError('');
    startTransition(async () => {
      const result = await scheduleNextContact(lead.id, nextDate);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        <CalendarIcon className="h-4 w-4" />
        {label}
      </button>

      <Modal open={open} onClose={close} title="Próximo contato" subtitle={lead.name}>
        <div className="space-y-5">
          <NextContactPicker today={today} value={nextDate} onChange={setNextDate} includeToday />
          <FormMessage error={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className={btnSecondary}>
              Cancelar
            </button>
            <button type="button" onClick={save} disabled={pending || nextDate === undefined} className={btnPrimary}>
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
