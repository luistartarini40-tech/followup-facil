-- =====================================================================
-- FollowUp Fácil — estrutura do banco (Supabase / PostgreSQL)
--
-- COMO USAR
--   Supabase > SQL Editor > New query > cole este arquivo inteiro > Run.
--   Pode ser executado mais de uma vez sem perder dados.
--
-- MODELO
--   companies          1 ── N  profiles           (usuários da empresa)
--   companies          1 ── N  leads              (clientes/oportunidades)
--   leads              1 ── N  lead_interactions  (histórico)
--
-- SEGURANÇA
--   Todas as tabelas têm Row Level Security. Cada linha pertence a uma
--   empresa (company_id) e só é visível/alterável por usuários daquela
--   empresa. A empresa do usuário vem SEMPRE do banco (tabela profiles),
--   nunca de um valor enviado pelo navegador.
-- =====================================================================

-- Schema "private": funções internas que não ficam expostas na API.
create schema if not exists private;

-- ---------------------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------------------

-- Empresa (o "tenant" do SaaS). Uma por conta criada.
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  created_at  timestamptz not null default now()
);

-- Perfil do usuário. Liga o login (auth.users) a uma empresa.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  role        text not null default 'owner' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles (company_id);

-- Empresa do usuário logado. É a base de todas as regras de segurança.
-- SECURITY DEFINER para poder ler profiles sem cair em recursão de RLS.
create or replace function private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = (select auth.uid());
$$;

-- Leads (clientes e oportunidades).
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null default private.current_company_id()
                     references public.companies (id) on delete cascade,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  name             text not null check (char_length(btrim(name)) between 1 and 120),
  phone            text check (char_length(phone) <= 30),
  whatsapp         text check (char_length(whatsapp) <= 30),
  email            text check (char_length(email) <= 160),
  source           text not null default 'WhatsApp' check (char_length(source) between 1 and 60),
  interest         text check (char_length(interest) <= 200),
  estimated_value  numeric(12, 2) not null default 0 check (estimated_value >= 0),
  stage            text not null default 'novo'
                     check (stage in ('novo', 'contato', 'orcamento', 'aguardando', 'fechado', 'perdido')),
  notes            text check (char_length(notes) <= 4000),
  next_contact_at  date,
  closed_at        timestamptz,
  -- texto de busca sem acentos e em minúsculas: achar "João" digitando "joao"
  search_text      text generated always as (
                     translate(
                       lower(name || ' ' || coalesce(interest, '') || ' ' || coalesce(email, '')),
                       'áàâãäéèêëíìîïóòôõöúùûüçñ',
                       'aaaaaeeeeiiiiooooouuuucn'
                     )
                   ) stored,
  -- só os dígitos de telefone + WhatsApp, para a busca funcionar com ou sem máscara
  phone_search     text generated always as (
                     regexp_replace(coalesce(phone, '') || ' ' || coalesce(whatsapp, ''), '[^0-9]', '', 'g')
                   ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- permite que o histórico aponte para (lead, empresa) ao mesmo tempo
  unique (id, company_id)
);

create index if not exists leads_company_stage_idx    on public.leads (company_id, stage);
create index if not exists leads_company_created_idx  on public.leads (company_id, created_at desc);
create index if not exists leads_company_followup_idx on public.leads (company_id, next_contact_at)
  where next_contact_at is not null;

-- Histórico de cada lead.
create table if not exists public.lead_interactions (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null,
  company_id  uuid not null default private.current_company_id(),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  type        text not null default 'nota'
                check (type in ('criacao', 'nota', 'etapa', 'agenda', 'whatsapp', 'retorno')),
  content     text not null check (char_length(btrim(content)) between 1 and 2000),
  -- clock_timestamp(): registros criados na mesma operação ficam na ordem certa
  created_at  timestamptz not null default clock_timestamp(),
  -- chave composta: o histórico só pode apontar para um lead DA MESMA empresa
  foreign key (lead_id, company_id) references public.leads (id, company_id) on delete cascade
);

create index if not exists lead_interactions_lead_idx
  on public.lead_interactions (lead_id, created_at desc);
create index if not exists lead_interactions_company_idx
  on public.lead_interactions (company_id);

-- ---------------------------------------------------------------------
-- 2. FUNÇÕES E GATILHOS
-- ---------------------------------------------------------------------

-- 2.1 Ao criar uma conta: cria a empresa e o perfil automaticamente.
-- Os nomes vêm do formulário de cadastro (metadados do usuário).
-- A empresa é sempre NOVA: ninguém consegue "entrar" em outra empresa
-- enviando dados no cadastro.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id   uuid;
  v_full_name    text;
  v_company_name text;
begin
  v_full_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  v_company_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''),
    'Minha empresa'
  );

  insert into public.companies (name)
  values (left(v_company_name, 120))
  returning id into v_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (new.id, v_company_id, left(v_full_name, 120), 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 2.2 Formata valores em reais para o histórico (1234.5 -> "R$ 1.234,50").
create or replace function private.format_brl(p_value numeric)
returns text
language sql
stable
set search_path = ''
as $$
  -- separadores fixos no padrão (não dependem da configuração do servidor)
  select 'R$ ' || translate(to_char(coalesce(p_value, 0), 'FM999,999,999,990.00'), ',.', '.,');
$$;

-- 2.3 Antes de gravar um lead: protege campos e mantém datas coerentes.
create or replace function private.leads_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);

  if tg_op = 'UPDATE' then
    -- campos que nunca mudam depois de criado
    new.company_id := old.company_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;

  if new.stage in ('fechado', 'perdido') then
    if tg_op = 'INSERT' then
      new.closed_at := now();
    else
      if old.stage is distinct from new.stage or new.closed_at is null then
        new.closed_at := now();
      end if;
      -- ao encerrar a negociação, o retorno pendente deixa de fazer sentido
      -- (o usuário ainda pode marcar um novo contato depois, ex.: pós-venda)
      if old.stage not in ('fechado', 'perdido')
         and new.next_contact_at is not distinct from old.next_contact_at then
        new.next_contact_at := null;
      end if;
    end if;
  else
    new.closed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_before_write on public.leads;
create trigger leads_before_write
  before insert or update on public.leads
  for each row execute function private.leads_before_write();

-- 2.4 Depois de gravar um lead: escreve o histórico automaticamente.
create or replace function private.leads_after_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_text text;
begin
  if tg_op = 'INSERT' then
    insert into public.lead_interactions (lead_id, company_id, created_by, type, content)
    values (new.id, new.company_id, auth.uid(), 'criacao',
            'Lead cadastrado — origem: ' || new.source);

    if new.next_contact_at is not null then
      insert into public.lead_interactions (lead_id, company_id, created_by, type, content)
      values (new.id, new.company_id, auth.uid(), 'agenda',
              'Próximo contato marcado para ' || to_char(new.next_contact_at, 'DD/MM/YYYY'));
    end if;

    return null;
  end if;

  -- daqui para baixo: UPDATE
  if new.stage is distinct from old.stage then
    v_text := case new.stage
      when 'novo'       then 'Voltou para a etapa Novo'
      when 'contato'    then 'Contato realizado'
      when 'orcamento'  then 'Orçamento enviado'
      when 'aguardando' then 'Aguardando resposta do cliente'
      when 'fechado'    then 'Venda fechada'
      when 'perdido'    then 'Oportunidade perdida'
    end;
    if new.stage in ('orcamento', 'fechado') and new.estimated_value > 0 then
      v_text := v_text || ' — ' || private.format_brl(new.estimated_value);
    end if;

    insert into public.lead_interactions (lead_id, company_id, created_by, type, content)
    values (new.id, new.company_id, auth.uid(), 'etapa', v_text);
  end if;

  if new.next_contact_at is not null
     and new.next_contact_at is distinct from old.next_contact_at then
    insert into public.lead_interactions (lead_id, company_id, created_by, type, content)
    values (new.id, new.company_id, auth.uid(), 'agenda',
            'Próximo contato marcado para ' || to_char(new.next_contact_at, 'DD/MM/YYYY'));
  end if;

  return null;
end;
$$;

drop trigger if exists leads_after_write on public.leads;
create trigger leads_after_write
  after insert or update on public.leads
  for each row execute function private.leads_after_write();

-- 2.5 Indicadores do painel, calculados no banco (rápido e sem limite de linhas).
-- SECURITY INVOKER: respeita o RLS de quem chama.
create or replace function public.dashboard_stats(p_today date default current_date)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  select json_build_object(
    'total',            count(*),
    'novos',            count(*) filter (where stage = 'novo'),
    'abertos',          count(*) filter (where stage not in ('fechado', 'perdido')),
    'orcamentos',       count(*) filter (where stage = 'orcamento'),
    'fechados',         count(*) filter (where stage = 'fechado'),
    'perdidos',         count(*) filter (where stage = 'perdido'),
    'hoje',             count(*) filter (where next_contact_at = p_today),
    'atrasados',        count(*) filter (where next_contact_at < p_today),
    'sem_retorno',      count(*) filter (where stage not in ('fechado', 'perdido')
                                           and next_contact_at is null),
    'valor_negociacao', coalesce(sum(estimated_value)
                                 filter (where stage not in ('fechado', 'perdido')), 0),
    'valor_vendido',    coalesce(sum(estimated_value) filter (where stage = 'fechado'), 0)
  )
  from public.leads
  where company_id = (select private.current_company_id());
$$;

-- ---------------------------------------------------------------------
-- 3. PERMISSÕES (quem pode tocar em quê)
-- ---------------------------------------------------------------------
-- Visitante sem login (anon) não acessa nada. Usuário logado
-- (authenticated) recebe só o necessário; o RLS abaixo filtra as linhas.

revoke all on public.companies, public.profiles, public.leads, public.lead_interactions
  from anon, authenticated;

grant select                         on public.companies         to authenticated;
grant update (name)                  on public.companies         to authenticated;
grant select                         on public.profiles          to authenticated;
grant update (full_name)             on public.profiles          to authenticated;
grant select, insert, update, delete on public.leads             to authenticated;
grant select, insert, delete         on public.lead_interactions to authenticated;

grant all on public.companies, public.profiles, public.leads, public.lead_interactions
  to service_role;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

revoke all on function private.current_company_id()  from public, anon;
revoke all on function private.handle_new_user()     from public, anon, authenticated;
revoke all on function public.dashboard_stats(date)  from public, anon;
grant execute on function private.current_company_id() to authenticated, service_role;
grant execute on function private.format_brl(numeric)  to authenticated, service_role;
grant execute on function public.dashboard_stats(date) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.companies         enable row level security;
alter table public.profiles          enable row level security;
alter table public.leads             enable row level security;
alter table public.lead_interactions enable row level security;

-- companies: o usuário vê e renomeia apenas a própria empresa.
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select to authenticated
  using (id = (select private.current_company_id()));

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update to authenticated
  using (id = (select private.current_company_id()))
  with check (id = (select private.current_company_id()));

-- profiles: vê os perfis da própria empresa; altera só o próprio nome.
-- (company_id e role não têm permissão de UPDATE — ver seção 3.)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (company_id = (select private.current_company_id()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and company_id = (select private.current_company_id())
  );

-- leads: tudo restrito à empresa do usuário.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads
  for select to authenticated
  using (company_id = (select private.current_company_id()));

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads
  for insert to authenticated
  with check (company_id = (select private.current_company_id()));

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  for update to authenticated
  using (company_id = (select private.current_company_id()))
  with check (company_id = (select private.current_company_id()));

drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads
  for delete to authenticated
  using (company_id = (select private.current_company_id()));

-- lead_interactions: lê e escreve só no histórico da própria empresa.
-- Não existe UPDATE: o histórico não é reescrito. Só anotações manuais
-- podem ser apagadas.
drop policy if exists lead_interactions_select on public.lead_interactions;
create policy lead_interactions_select on public.lead_interactions
  for select to authenticated
  using (company_id = (select private.current_company_id()));

drop policy if exists lead_interactions_insert on public.lead_interactions;
create policy lead_interactions_insert on public.lead_interactions
  for insert to authenticated
  with check (
    company_id = (select private.current_company_id())
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists lead_interactions_delete on public.lead_interactions;
create policy lead_interactions_delete on public.lead_interactions
  for delete to authenticated
  using (
    company_id = (select private.current_company_id())
    and type = 'nota'
  );
