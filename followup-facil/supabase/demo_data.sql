-- =====================================================================
-- FollowUp Fácil — dados de demonstração (OPCIONAL)
--
-- Enche a SUA conta com clientes de exemplo para você mostrar o sistema
-- a um possível cliente em poucos minutos: tem retorno atrasado, retorno
-- para hoje, orçamento enviado, venda fechada e oportunidade perdida.
--
-- COMO USAR
--   1. Crie sua conta pelo sistema (tela "Criar conta").
--   2. Troque o e-mail na linha marcada abaixo pelo e-mail dessa conta.
--   3. Supabase > SQL Editor > cole este arquivo > Run.
--
-- PARA APAGAR OS EXEMPLOS DEPOIS: veja o comando no final do arquivo.
-- =====================================================================

do $$
declare
  v_email   text := 'SEU_EMAIL_AQUI';   -- <<< TROQUE PELO E-MAIL DA SUA CONTA
  v_user    uuid;
  v_company uuid;
  v_today   date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select p.id, p.company_id
    into v_user, v_company
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(u.email) = lower(v_email);

  if v_company is null then
    raise exception 'Não encontrei conta com o e-mail "%". Crie a conta pelo sistema antes e confira o e-mail digitado.', v_email;
  end if;

  insert into public.leads
    (company_id, created_by, name, whatsapp, source, interest, estimated_value, stage, next_contact_at, notes, created_at)
  values
    -- atrasados (aparecem em vermelho no painel)
    (v_company, v_user, 'Carla Mendes',     '(11) 97777-1111', 'Instagram',   'Design de sobrancelhas',       180.00, 'aguardando', v_today - 3, 'Exemplo. Ficou de confirmar o horário.',          now() - interval '9 days'),
    (v_company, v_user, 'Oficina do Zé',    '(11) 96666-2222', 'Indicação',   'Site para a oficina',         2400.00, 'orcamento',  v_today - 1, 'Exemplo. Orçamento enviado por PDF.',             now() - interval '6 days'),
    -- para hoje
    (v_company, v_user, 'João Pereira',     '(11) 98888-7777', 'WhatsApp',    'Pintura de apartamento',       850.00, 'orcamento',  v_today,     'Exemplo. Pediu desconto à vista.',                now() - interval '4 days'),
    (v_company, v_user, 'Mariana Costa',    '(21) 95555-3333', 'Instagram',   'Ensaio fotográfico de casal', 1200.00, 'contato',    v_today,     'Exemplo. Quer fotos ao ar livre.',                now() - interval '2 days'),
    (v_company, v_user, 'Pedro Álvares',    '(31) 94444-4444', 'Google',      'Logotipo e cartão de visita',  600.00, 'novo',       v_today,     'Exemplo. Chegou hoje pelo site.',                 now() - interval '3 hours'),
    -- próximos dias
    (v_company, v_user, 'Studio Aurora',    '(11) 93333-5555', 'Indicação',   'Pacote mensal de posts',      1500.00, 'aguardando', v_today + 2, 'Exemplo. Vai falar com a sócia.',                 now() - interval '8 days'),
    (v_company, v_user, 'Rafael Nunes',     '(41) 92222-6666', 'Facebook',    'Corte e barba — plano mensal', 120.00, 'contato',    v_today + 5, 'Exemplo.',                                        now() - interval '1 day'),
    -- em aberto e sem data (o painel avisa)
    (v_company, v_user, 'Ana Beatriz Lima', '(11) 91111-7777', 'Loja física', 'Vestido sob medida',           980.00, 'novo',       null,        'Exemplo. Passou na loja e deixou o contato.',     now() - interval '5 days'),
    -- encerrados
    (v_company, v_user, 'Lucas Ferreira',   '(11) 90000-8888', 'Indicação',   'Troca de óleo e revisão',      450.00, 'fechado',    null,        'Exemplo. Fechou na hora.',                        now() - interval '12 days'),
    (v_company, v_user, 'Clínica Bem Viver','(11) 98765-4321', 'Site',        'Limpeza de pele — pacote',     720.00, 'fechado',    null,        'Exemplo.',                                        now() - interval '15 days'),
    (v_company, v_user, 'Sônia Rocha',      '(11) 91234-5678', 'Instagram',   'Reforma de cozinha',          5000.00, 'perdido',    null,        'Exemplo. Achou caro, fechou com outro.',          now() - interval '20 days');

  raise notice 'Pronto! Dados de exemplo criados para %.', v_email;
end $$;

-- ---------------------------------------------------------------------
-- PARA APAGAR OS EXEMPLOS (troque o e-mail e rode só este trecho):
--
-- delete from public.leads l
--  using public.profiles p, auth.users u
--  where l.company_id = p.company_id
--    and p.id = u.id
--    and lower(u.email) = lower('SEU_EMAIL_AQUI')
--    and l.notes like 'Exemplo.%';
-- ---------------------------------------------------------------------
