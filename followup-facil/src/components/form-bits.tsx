import { AlertIcon, CheckCircleIcon } from './icons';

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <div role="alert" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div role="status" className="flex gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}
