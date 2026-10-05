'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { addNote, deleteNote } from '@/actions/leads';
import { formatDateTimeBR } from '@/lib/dates';
import type { Interaction, InteractionType } from '@/lib/types';
import { btnPrimary, inputClass } from '@/lib/ui';
import { FormMessage } from './form-bits';
import { CalendarIcon, ChatIcon, CheckIcon, ColumnsIcon, NoteIcon, TrashIcon, UserPlusIcon } from './icons';

const TYPE_STYLE: Record<InteractionType, { icon: typeof NoteIcon; color: string; label: string }> = {
  criacao: { icon: UserPlusIcon, color: 'bg-sky-100 text-sky-700', label: 'Cadastro' },
  nota: { icon: NoteIcon, color: 'bg-slate-100 text-slate-600', label: 'Anotação' },
  etapa: { icon: ColumnsIcon, color: 'bg-indigo-100 text-indigo-700', label: 'Etapa' },
  agenda: { icon: CalendarIcon, color: 'bg-amber-100 text-amber-800', label: 'Agenda' },
  whatsapp: { icon: ChatIcon, color: 'bg-green-100 text-green-800', label: 'WhatsApp' },
  retorno: { icon: CheckIcon, color: 'bg-emerald-100 text-emerald-700', label: 'Retorno' },
};

/** Campo para o usuário anotar algo no histórico do lead. */
export function AddNoteForm({ leadId }: { leadId: string }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await addNote(leadId, content);
      if (result.ok) setContent('');
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="new-note" className="sr-only">
        Nova anotação
      </label>
      <textarea
        id="new-note"
        rows={2}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={2000}
        placeholder="Anote o que aconteceu. Ex.: Cliente disse que iria analisar."
        className={inputClass}
      />
      <FormMessage error={error} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending || !content.trim()} className={btnPrimary}>
          {pending ? 'Salvando...' : 'Adicionar ao histórico'}
        </button>
      </div>
    </form>
  );
}

function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Apagar anotação"
        title="Apagar anotação"
        className="cursor-pointer rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteNote(noteId);
            setConfirming(false);
          })
        }
        className="cursor-pointer font-semibold text-red-700 hover:underline"
      >
        {pending ? 'Apagando...' : 'Apagar'}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="cursor-pointer text-slate-500 hover:underline">
        Cancelar
      </button>
    </span>
  );
}

/** Linha do tempo do lead (mais recente em cima). */
export function Timeline({ interactions }: { interactions: Interaction[] }) {
  if (interactions.length === 0) {
    return <p className="text-sm text-slate-500">Ainda não há nada no histórico.</p>;
  }

  return (
    <ol className="space-y-4">
      {interactions.map((item) => {
        const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.nota;
        return (
          <li key={item.id} className="flex gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.color}`}>
              <style.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm break-words whitespace-pre-line text-slate-800">{item.content}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDateTimeBR(item.created_at)} · {style.label}
              </p>
            </div>
            {item.type === 'nota' && <DeleteNoteButton noteId={item.id} />}
          </li>
        );
      })}
    </ol>
  );
}
