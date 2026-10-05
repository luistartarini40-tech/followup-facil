'use client';

import { useActionState, useState } from 'react';
import { updateSettings, type SettingsFormState } from '@/actions/settings';
import { btnPrimary, inputClass, labelClass } from '@/lib/ui';
import { FormMessage } from './form-bits';

export function SettingsForm({ fullName, companyName }: { fullName: string; companyName: string }) {
  const [state, formAction, pending] = useActionState(updateSettings, {} as SettingsFormState);
  const [values, setValues] = useState({ full_name: fullName, company_name: companyName });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="company_name" className={labelClass}>
          Nome do seu negócio
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          required
          maxLength={120}
          value={values.company_name}
          onChange={(e) => setValues((v) => ({ ...v, company_name: e.target.value }))}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-500">Aparece nas mensagens prontas do WhatsApp.</p>
      </div>

      <div>
        <label htmlFor="full_name" className={labelClass}>
          Seu nome
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={120}
          value={values.full_name}
          onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
          className={inputClass}
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
