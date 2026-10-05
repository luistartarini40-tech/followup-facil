'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition, type DragEvent } from 'react';
import { moveLeadStage } from '@/actions/leads';
import { CLOSED_STAGES, STAGES, type StageId } from '@/lib/constants';
import { formatBRLShort } from '@/lib/format';
import type { LeadSummary } from '@/lib/types';
import { useApp } from './app-context';
import { FollowUpChip } from './badges';
import { FormMessage } from './form-bits';
import { PlusIcon } from './icons';
import { WhatsAppButton } from './whatsapp-button';

type Props = {
  leads: LeadSummary[];
  /** Total real de fechados/perdidos (as colunas finais mostram só os mais recentes). */
  closedTotals: Record<'fechado' | 'perdido', number>;
};

/**
 * Pipeline em colunas (Kanban).
 * No computador: arraste o cartão para outra coluna.
 * No celular (ou sem mouse): use o campo "Mover para" de cada cartão.
 */
export function KanbanBoard({ leads: serverLeads, closedTotals }: Props) {
  const { today } = useApp();
  const [leads, setLeads] = useState(serverLeads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  // Quando o servidor manda dados novos (depois de salvar), usa os dele.
  useEffect(() => setLeads(serverLeads), [serverLeads]);

  function move(id: string, stage: StageId) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;

    const previous = leads;
    setError('');
    // Atualiza a tela na hora; se o servidor recusar, volta como estava.
    setLeads((current) =>
      current.map((l) =>
        l.id === id
          ? {
              ...l,
              stage,
              next_contact_at: (CLOSED_STAGES as string[]).includes(stage) ? null : l.next_contact_at,
            }
          : l,
      ),
    );

    startTransition(async () => {
      const result = await moveLeadStage(id, stage);
      if (!result.ok) {
        setLeads(previous);
        setError(result.error);
      }
    });
  }

  function onDragStart(event: DragEvent<HTMLElement>, id: string) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  }

  function onDrop(event: DragEvent<HTMLElement>, stage: StageId) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setOverStage(null);
    if (id) move(id, stage);
  }

  return (
    <div>
      {error && (
        <div className="mb-4">
          <FormMessage error={error} />
        </div>
      )}

      <div className="thin-scroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:snap-none lg:px-8">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.id);
          const isClosed = stage.id === 'fechado' || stage.id === 'perdido';
          const count = isClosed ? Math.max(closedTotals[stage.id], items.length) : items.length;
          const sum = items.reduce((total, l) => total + l.estimated_value, 0);
          const isOver = overStage === stage.id;

          return (
            <section
              key={stage.id}
              aria-label={`${stage.label}: ${count}`}
              data-stage={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (overStage !== stage.id) setOverStage(stage.id);
              }}
              onDragLeave={(event) => {
                // só limpa ao sair da coluna de verdade (não ao passar por um cartão)
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverStage(null);
              }}
              onDrop={(event) => onDrop(event, stage.id)}
              className={`flex w-[82vw] max-w-xs shrink-0 snap-center flex-col rounded-2xl border p-3 transition-colors sm:w-72 lg:w-60 2xl:max-w-none 2xl:min-w-60 2xl:flex-1 2xl:shrink ${
                isOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-slate-100/70'
              }`}
            >
              <header className="mb-3 px-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {isClosed && count > items.length
                    ? `Mostrando os ${items.length} mais recentes`
                    : sum > 0
                      ? formatBRLShort(sum)
                      : stage.hint}
                </p>
              </header>

              <div className="flex min-h-24 flex-1 flex-col gap-2.5">
                {items.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    data-lead-card={lead.id}
                    onDragStart={(event) => onDragStart(event, lead.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStage(null);
                    }}
                    className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
                      draggingId === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          draggable={false}
                          className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
                        >
                          {lead.name}
                        </Link>
                        {lead.interest && <p className="mt-0.5 truncate text-xs text-slate-500">{lead.interest}</p>}
                      </div>
                      <WhatsAppButton lead={lead} variant="icon" className="shrink-0" />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {lead.estimated_value > 0 && (
                        <span className="text-sm font-semibold text-slate-800">
                          {formatBRLShort(lead.estimated_value)}
                        </span>
                      )}
                      <FollowUpChip date={lead.next_contact_at} today={today} />
                    </div>

                    <label className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="shrink-0">Mover para</span>
                      <select
                        value={lead.stage}
                        onChange={(event) => move(lead.id, event.target.value as StageId)}
                        aria-label={`Mover ${lead.name} para outra etapa`}
                        className="min-w-0 flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-brand-500 focus:outline-none"
                      >
                        {STAGES.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}

                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                    {isOver ? 'Solte aqui' : 'Nenhum cliente nesta etapa'}
                  </p>
                )}
              </div>

              {isClosed ? (
                count > items.length && (
                  <Link
                    href={`/leads?etapa=${stage.id}`}
                    className="mt-3 block rounded-lg px-2 py-2 text-center text-xs font-medium text-brand-700 hover:bg-white"
                  >
                    Ver todos os {count}
                  </Link>
                )
              ) : (
                <Link
                  href={`/leads/novo?etapa=${stage.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-white hover:text-brand-700"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Adicionar
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
