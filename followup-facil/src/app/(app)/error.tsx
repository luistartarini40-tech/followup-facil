'use client';

import { btnPrimary } from '@/lib/ui';

// Tela de erro da área logada.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-600">
        Não conseguimos carregar esta tela. Confira sua internet e tente de novo.
      </p>
      {process.env.NODE_ENV !== 'production' && error.message && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900">
          <strong>Detalhe (só aparece em desenvolvimento):</strong> {error.message}
        </p>
      )}
      <button type="button" onClick={reset} className={`${btnPrimary} mt-6`}>
        Tentar de novo
      </button>
    </div>
  );
}
