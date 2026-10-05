'use client';

import { useState, useTransition } from 'react';
import { deleteLead } from '@/actions/leads';
import { btnDanger, btnDangerSolid, btnSecondary } from '@/lib/ui';
import { FormMessage } from './form-bits';
import { TrashIcon } from './icons';

/** Excluir lead, com confirmação na própria tela (sem janelas do navegador). */
export function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={btnDanger}>
        <TrashIcon className="h-4 w-4" />
        Excluir lead
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">
        Excluir {leadName}? O histórico dele também será apagado e não dá para desfazer.
      </p>
      {error && (
        <div className="mt-3">
          <FormMessage error={error} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteLead(leadId);
              if (result && !result.ok) setError(result.error);
            })
          }
          className={btnDangerSolid}
        >
          {pending ? 'Excluindo...' : 'Sim, excluir'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={btnSecondary}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
