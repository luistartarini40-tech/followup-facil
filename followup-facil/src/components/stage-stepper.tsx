'use client';

import { useEffect, useState, useTransition } from 'react';
import { moveLeadStage } from '@/actions/leads';
import { STAGES, type StageId } from '@/lib/constants';
import { FormMessage } from './form-bits';

/** Etapas do funil como botões: um toque move o lead. */
export function StageStepper({ leadId, stage: serverStage }: { leadId: string; stage: StageId }) {
  const [stage, setStage] = useState(serverStage);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => setStage(serverStage), [serverStage]);

  function choose(next: StageId) {
    if (next === stage || pending) return;
    const previous = stage;
    setStage(next);
    setError('');
    startTransition(async () => {
      const result = await moveLeadStage(leadId, next);
      if (!result.ok) {
        setStage(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Etapa da negociação">
        {STAGES.map((option) => {
          const selected = option.id === stage;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              aria-pressed={selected}
              disabled={pending}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ring-inset disabled:cursor-wait ${
                selected ? option.badge : 'bg-white text-slate-500 ring-slate-200 hover:text-slate-800 hover:ring-slate-300'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${selected ? option.dot : 'bg-slate-300'}`} />
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="mt-3">
          <FormMessage error={error} />
        </div>
      )}
    </div>
  );
}
