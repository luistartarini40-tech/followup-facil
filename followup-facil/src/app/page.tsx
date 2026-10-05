import Link from 'next/link';
import { AlertIcon, ChatIcon, CheckIcon, ClockIcon, Logo } from '@/components/icons';
import { btnPrimary, btnPrimaryLg, btnSecondaryLg } from '@/lib/ui';

// Página inicial pública (simples por enquanto; a landing page de vendas vem depois).

const STEPS = [
  {
    title: 'Cadastre o cliente',
    text: 'Nome, WhatsApp, o que ele quer e o valor do orçamento. Leva 20 segundos.',
  },
  {
    title: 'Marque quando falar de novo',
    text: 'Amanhã, em 3 dias, semana que vem. No dia certo o cliente aparece no topo da tela.',
  },
  {
    title: 'Chame no WhatsApp com um clique',
    text: 'A mensagem já vem pronta. Você confere, envia e marca o próximo retorno.',
  },
];

const AUDIENCE = [
  'Clínicas de estética e salões',
  'Barbearias',
  'Fotógrafos e designers',
  'Lojas e oficinas',
  'Prestadores de serviço',
  'Quem trabalha com orçamento',
];

function PreviewRow({ name, detail, late }: { name: string; detail: string; late?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
          {name}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              late ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200'
            }`}
          >
            {late ? <AlertIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
            {late ? 'Atrasado há 2 dias' : 'Hoje'}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white">
        <ChatIcon className="h-3.5 w-3.5" />
        WhatsApp
      </span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Entrar
          </Link>
          <span className="hidden sm:block">
            <Link href="/cadastro" className={btnPrimary}>
              Criar conta
            </Link>
          </span>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div>
            <h1 className="text-4xl leading-tight font-bold tracking-tight text-slate-900 sm:text-5xl">
              Pare de perder clientes porque esqueceu de fazer o retorno.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              O FollowUp Fácil mostra, todo dia, quem você precisa chamar. Um clique e o WhatsApp abre com a
              mensagem pronta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className={btnPrimaryLg}>
                Criar minha conta
              </Link>
              <Link href="/login" className={btnSecondaryLg}>
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Sem instalar nada. Funciona no celular e no computador.</p>
          </div>

          {/* Ilustração da tela principal */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5" aria-hidden="true">
            <div className="rounded-2xl bg-brand-600 p-5 text-white">
              <p className="text-xs font-medium text-brand-100">Hoje</p>
              <p className="mt-1 text-xl font-bold">Você tem 3 clientes para acompanhar hoje.</p>
            </div>
            <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <PreviewRow name="Carla Mendes" detail="Design de sobrancelhas · R$ 180,00" late />
              <PreviewRow name="João Pereira" detail="Orçamento de pintura · R$ 850,00" />
              <PreviewRow name="Studio Aurora" detail="Ensaio fotográfico · R$ 1.200,00" />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Como funciona</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Feito para quem atende pelo WhatsApp</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Se você anota clientes em caderno, planilha ou na memória, já sabe quanto orçamento fica sem resposta.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/cadastro" className={`${btnPrimaryLg} mt-10`}>
            Começar agora
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-500 sm:px-6">FollowUp Fácil</div>
      </footer>
    </div>
  );
}
