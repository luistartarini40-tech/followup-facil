import Link from 'next/link';
import { FOLLOWUP_FILTERS, SOURCES, STAGES } from '@/lib/constants';
import type { LeadsPage } from '@/lib/data';
import { hasActiveFilters, leadsUrl, type LeadFilters } from '@/lib/filters';
import { formatBRL, pluralize } from '@/lib/format';
import { btnPrimary, btnSecondary, cardClass, inputClass } from '@/lib/ui';
import { FollowUpChip, StageBadge } from './badges';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './icons';
import { PageContainer, PageHeader } from './page-layout';
import { WhatsAppButton } from './whatsapp-button';

type Props = {
  filters: LeadFilters;
  result: LeadsPage;
  today: string;
};

const selectLabel = 'mb-1 block text-xs font-medium text-slate-500';

export function LeadsListView({ filters, result, today }: Props) {
  const { leads, total, page, pageCount } = result;
  const filtering = hasActiveFilters(filters);
  const sources = (SOURCES as readonly string[]).includes(filters.origem) || !filters.origem
    ? SOURCES
    : [...SOURCES, filters.origem];

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        subtitle={
          filtering
            ? `${total} ${pluralize(total, 'lead encontrado', 'leads encontrados')}`
            : `${total} ${pluralize(total, 'cliente cadastrado', 'clientes cadastrados')}`
        }
        actions={
          // no celular o botão "Novo lead" já está na barra do topo
          <span className="hidden lg:block">
            <Link href="/leads/novo" className={btnPrimary}>
              <PlusIcon className="h-4 w-4" />
              Novo lead
            </Link>
          </span>
        }
      />

      {/* Busca e filtros: é um formulário comum, o resultado fica na URL. */}
      <form method="get" action="/leads" className={`${cardClass} mb-5 p-4`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="q" className="sr-only">
              Buscar por nome ou telefone
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Buscar por nome ou telefone"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button type="submit" className={btnPrimary}>
            Buscar
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="etapa" className={selectLabel}>
              Etapa
            </label>
            <select id="etapa" name="etapa" defaultValue={filters.etapa} className={inputClass}>
              <option value="">Todas</option>
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="origem" className={selectLabel}>
              Origem
            </label>
            <select id="origem" name="origem" defaultValue={filters.origem} className={inputClass}>
              <option value="">Todas</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="retorno" className={selectLabel}>
              Retorno
            </label>
            <select id="retorno" name="retorno" defaultValue={filters.retorno} className={inputClass}>
              <option value="">Todos</option>
              {FOLLOWUP_FILTERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <details className="mt-3" open={Boolean(filters.de || filters.ate)}>
          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
            Filtrar por data de cadastro
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="de" className={selectLabel}>
                Cadastrado a partir de
              </label>
              <input id="de" name="de" type="date" defaultValue={filters.de} className={inputClass} />
            </div>
            <div>
              <label htmlFor="ate" className={selectLabel}>
                Até
              </label>
              <input id="ate" name="ate" type="date" defaultValue={filters.ate} className={inputClass} />
            </div>
          </div>
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" className={btnSecondary}>
            Aplicar filtros
          </button>
          {filtering && (
            <Link href="/leads" className="px-2 text-sm font-medium text-brand-700 hover:underline">
              Limpar filtros
            </Link>
          )}
        </div>
      </form>

      {leads.length === 0 ? (
        <div className={`${cardClass} px-6 py-12 text-center`}>
          {filtering ? (
            <>
              <p className="text-base font-semibold text-slate-900">Nenhum lead encontrado com esses filtros.</p>
              <Link href="/leads" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
                Limpar filtros
              </Link>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-900">Você ainda não cadastrou nenhum cliente.</p>
              <p className="mt-1 text-sm text-slate-500">Comece por quem está esperando um retorno seu.</p>
              <Link href="/leads/novo" className={`${btnPrimary} mt-5`}>
                <PlusIcon className="h-4 w-4" />
                Cadastrar cliente
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_7rem_minmax(0,1.3fr)] gap-4 border-b border-slate-200 bg-slate-50 py-2.5 pr-16 pl-5 text-xs font-semibold tracking-wide text-slate-500 uppercase md:grid">
            <span>Cliente</span>
            <span>Etapa</span>
            <span className="text-right">Valor</span>
            <span>Próximo contato</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_7rem_minmax(0,1.3fr)] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {lead.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {[lead.interest, lead.whatsapp ?? lead.phone, lead.source].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0 md:contents">
                    <span>
                      <StageBadge stage={lead.stage} />
                    </span>
                    <span className="text-sm font-medium text-slate-800 md:text-right">
                      {lead.estimated_value > 0 ? formatBRL(lead.estimated_value) : <span className="text-slate-300">—</span>}
                    </span>
                    <span>
                      <FollowUpChip
                        date={lead.next_contact_at}
                        today={today}
                        showEmpty={lead.stage !== 'fechado' && lead.stage !== 'perdido'}
                      />
                    </span>
                  </div>
                </div>
                <WhatsAppButton lead={lead} variant="icon" className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Paginação">
          {page > 1 ? (
            <Link href={leadsUrl(filters, { pagina: page - 1 })} className={btnSecondary}>
              <ChevronLeftIcon className="h-4 w-4" />
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">
            Página {page} de {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={leadsUrl(filters, { pagina: page + 1 })} className={btnSecondary}>
              Próxima
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </PageContainer>
  );
}
