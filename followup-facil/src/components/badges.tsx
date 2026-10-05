import { getStage } from '@/lib/constants';
import { describeFollowUp, followUpStatus, formatDayMonth } from '@/lib/dates';
import { AlertIcon, CalendarIcon, ClockIcon } from './icons';

export function StageBadge({ stage }: { stage: string }) {
  const s = getStage(stage);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Etiqueta do próximo contato: vermelho = atrasado, amarelo = hoje. */
export function FollowUpChip({
  date,
  today,
  showEmpty = false,
}: {
  date: string | null;
  today: string;
  showEmpty?: boolean;
}) {
  const status = followUpStatus(date, today);

  if (status === 'sem') {
    if (!showEmpty) return null;
    return <span className="text-xs text-slate-400">Sem data de retorno</span>;
  }

  const styles = {
    atrasado: 'bg-red-50 text-red-700 ring-red-200',
    hoje: 'bg-amber-50 text-amber-800 ring-amber-200',
    futuro: 'bg-slate-50 text-slate-600 ring-slate-200',
  }[status];

  const IconComponent = status === 'atrasado' ? AlertIcon : status === 'hoje' ? ClockIcon : CalendarIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${styles}`}
      title={`Próximo contato: ${formatDayMonth(date)}`}
    >
      <IconComponent className="h-3.5 w-3.5" />
      {status === 'futuro' ? `${formatDayMonth(date)} · ${describeFollowUp(date, today).toLowerCase()}` : describeFollowUp(date, today)}
    </span>
  );
}
