// Aparece enquanto a página busca os dados.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-busy="true" aria-label="Carregando">
      <div className="animate-pulse space-y-5">
        <div className="h-32 rounded-2xl bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-200/80" />
        <div className="h-20 rounded-2xl bg-slate-200/60" />
      </div>
    </div>
  );
}
