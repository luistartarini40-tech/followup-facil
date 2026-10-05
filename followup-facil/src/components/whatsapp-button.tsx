'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { logWhatsApp, scheduleNextContact } from '@/actions/leads';
import { formatDateBR } from '@/lib/dates';
import { firstName } from '@/lib/format';
import type { LeadSummary } from '@/lib/types';
import { btnPrimary, btnSecondary, btnWhatsApp, inputClass } from '@/lib/ui';
import { buildTemplates, buildWhatsAppUrl, defaultTemplateId, leadWhatsAppNumber } from '@/lib/whatsapp';
import { useApp } from './app-context';
import { FormMessage } from './form-bits';
import { ChatIcon } from './icons';
import { Modal } from './modal';
import { NextContactPicker } from './next-contact-picker';

type Props = {
  lead: Pick<LeadSummary, 'id' | 'name' | 'phone' | 'whatsapp' | 'interest' | 'stage' | 'next_contact_at'>;
  /** 'full' = botão com texto · 'icon' = só o ícone (cartões do pipeline e tabelas) */
  variant?: 'full' | 'icon';
  className?: string;
};

/**
 * "Chamar no WhatsApp": abre uma janela com a mensagem pronta (editável),
 * abre o WhatsApp do cliente e, na volta, pergunta quando falar de novo.
 */
export function WhatsAppButton({ lead, variant = 'full', className = '' }: Props) {
  const { today, userName, companyName } = useApp();
  const number = leadWhatsAppNumber(lead);

  const templates = useMemo(
    () => buildTemplates(lead, { userName, companyName }),
    [lead, userName, companyName],
  );

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'mensagem' | 'agendar'>('mensagem');
  const [templateId, setTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [nextDate, setNextDate] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => setOpen(false), []);

  function openDialog() {
    const id = defaultTemplateId(lead.stage);
    setTemplateId(id);
    setMessage(templates.find((t) => t.id === id)?.text ?? '');
    setStep('mensagem');
    setNextDate(undefined);
    setError('');
    setOpen(true);
  }

  function chooseTemplate(id: string) {
    setTemplateId(id);
    setMessage(templates.find((t) => t.id === id)?.text ?? '');
  }

  // O clique segue normalmente para o link (abre o WhatsApp em outra aba);
  // aqui só registramos no histórico e passamos para o próximo passo.
  function handleOpenWhatsApp() {
    startTransition(async () => {
      await logWhatsApp(lead.id, message);
    });
    setStep('agendar');
  }

  function saveNextContact() {
    if (nextDate === undefined) return;
    setError('');
    startTransition(async () => {
      const result = await scheduleNextContact(lead.id, nextDate);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  // Sem número: em vez de um botão que não funciona, leva para o cadastro.
  if (!number) {
    if (variant === 'icon') {
      return (
        <Link
          href={`/leads/${lead.id}/editar`}
          title="Cadastre o WhatsApp deste cliente"
          aria-label={`Cadastrar o WhatsApp de ${lead.name}`}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 ${className}`}
        >
          <ChatIcon className="h-4 w-4" />
        </Link>
      );
    }
    return (
      <Link href={`/leads/${lead.id}/editar`} className={`${btnSecondary} ${className}`}>
        <ChatIcon className="h-4 w-4" />
        Cadastrar WhatsApp
      </Link>
    );
  }

  const nome = firstName(lead.name) || 'o cliente';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={openDialog}
          title="Chamar no WhatsApp"
          aria-label={`Chamar ${lead.name} no WhatsApp`}
          className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-green-700 text-white transition-colors hover:bg-green-800 ${className}`}
        >
          <ChatIcon className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={openDialog} className={`${btnWhatsApp} ${className}`}>
          <ChatIcon className="h-4 w-4" />
          Chamar no WhatsApp
        </button>
      )}

      <Modal
        open={open}
        onClose={close}
        title={step === 'mensagem' ? `Chamar ${nome} no WhatsApp` : `Quando falar com ${nome} de novo?`}
        subtitle={step === 'mensagem' ? (lead.whatsapp ?? lead.phone ?? undefined) : undefined}
      >
        {step === 'mensagem' ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Mensagem pronta</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => chooseTemplate(template.id)}
                    aria-pressed={templateId === template.id}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      templateId === template.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`wa-message-${lead.id}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                Edite se quiser
              </label>
              <textarea
                id={`wa-message-${lead.id}`}
                rows={5}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setTemplateId('');
                }}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Nada é enviado sozinho: o WhatsApp abre com o texto e você confere antes de enviar.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} className={btnSecondary}>
                Cancelar
              </button>
              <a
                href={buildWhatsAppUrl(number, message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenWhatsApp}
                className={btnWhatsApp}
              >
                <ChatIcon className="h-4 w-4" />
                Abrir WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Registramos esse contato no histórico. Marque o próximo retorno para {nome} não cair no
              esquecimento.
              {lead.next_contact_at && lead.next_contact_at > today && (
                <> Hoje ele está marcado para {formatDateBR(lead.next_contact_at)}.</>
              )}
            </p>

            <NextContactPicker today={today} value={nextDate} onChange={setNextDate} />

            <FormMessage error={error} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} className={btnSecondary}>
                Agora não
              </button>
              <button
                type="button"
                onClick={saveNextContact}
                disabled={nextDate === undefined || pending}
                className={btnPrimary}
              >
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
