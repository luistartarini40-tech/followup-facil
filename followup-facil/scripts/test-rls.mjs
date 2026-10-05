// =====================================================================
// Teste de isolamento entre empresas (RLS)
//
// Cria duas contas de teste (Empresa A e Empresa B), tenta fazer a
// Empresa B ler/alterar/apagar dados da Empresa A de todas as formas
// possíveis pela API e confere que nada vaza. No final apaga as contas.
//
// Uso:
//   1. Coloque no .env.local (NUNCA suba essa chave para o GitHub/Vercel
//      como variável pública):
//        SUPABASE_SERVICE_ROLE_KEY=...   (Supabase > Settings > API Keys)
//   2. npm run test:rls
// =====================================================================

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error(
    'Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${detail ? '→ ' + detail : ''}`);
  }
}

async function call(path, { method = 'GET', token = ANON, apikey = ANON, body, prefer } = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const rest = (path, opts) => call(`/rest/v1${path}`, opts);
const REP = 'return=representation';

async function createUser(label, metadata) {
  const email = `teste-rls-${label}-${Date.now()}@example.com`;
  const password = `Senha-${Math.random().toString(36).slice(2)}-9X`;
  const created = await call('/auth/v1/admin/users', {
    method: 'POST',
    token: SERVICE,
    apikey: SERVICE,
    body: { email, password, email_confirm: true, user_metadata: metadata },
  });
  if (created.status >= 300) {
    throw new Error(`Não consegui criar o usuário de teste: ${JSON.stringify(created.data)}`);
  }
  const login = await call('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  if (!login.data?.access_token) {
    throw new Error(`Não consegui fazer login de teste: ${JSON.stringify(login.data)}`);
  }
  return { id: created.data.id, email, token: login.data.access_token };
}

async function deleteUser(user) {
  // apaga a empresa (leva junto perfil, leads e histórico) e depois o login
  if (user.companyId) {
    await rest(`/companies?id=eq.${user.companyId}`, {
      method: 'DELETE',
      token: SERVICE,
      apikey: SERVICE,
    });
  }
  await call(`/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    token: SERVICE,
    apikey: SERVICE,
  });
}

const users = [];

async function main() {
  console.log('\nCriando contas de teste...');
  const a = await createUser('a', { full_name: 'Ana Teste', company_name: 'Empresa A' });
  users.push(a);
  const b = await createUser('b', {
    full_name: 'Bruno Teste',
    company_name: 'Empresa B',
    // tentativa de "entrar" na empresa de outra pessoa pelo cadastro
    company_id: '00000000-0000-0000-0000-000000000000',
  });
  users.push(b);

  console.log('\n1. Cadastro cria empresa e perfil próprios');
  const profA = await rest('/profiles?select=*', { token: a.token });
  const profB = await rest('/profiles?select=*', { token: b.token });
  check('A enxerga só o próprio perfil', profA.data?.length === 1 && profA.data[0].id === a.id);
  check('B enxerga só o próprio perfil', profB.data?.length === 1 && profB.data[0].id === b.id);
  a.companyId = profA.data?.[0]?.company_id;
  b.companyId = profB.data?.[0]?.company_id;
  check('A e B estão em empresas diferentes', a.companyId && b.companyId && a.companyId !== b.companyId);
  const compA = await rest('/companies?select=*', { token: a.token });
  check(
    'A enxerga só a própria empresa, com o nome do cadastro',
    compA.data?.length === 1 && compA.data[0].name === 'Empresa A',
  );

  console.log('\n2. A cadastra um lead');
  const leadA = await rest('/leads', {
    method: 'POST',
    token: a.token,
    prefer: REP,
    body: { name: 'João da Silva', whatsapp: '(11) 98888-7777', estimated_value: 850, source: 'Instagram' },
  });
  const lead = leadA.data?.[0];
  check('lead criado na empresa de A (sem enviar company_id)', lead?.company_id === a.companyId, JSON.stringify(leadA.data));
  check('busca por telefone só com dígitos', lead?.phone_search === '11988887777');
  const histA = await rest(`/lead_interactions?lead_id=eq.${lead.id}&select=*`, { token: a.token });
  check('histórico "Lead cadastrado" criado sozinho', histA.data?.some((i) => i.type === 'criacao'));

  console.log('\n3. B tenta LER dados de A');
  const r1 = await rest('/leads?select=*', { token: b.token });
  check('B não lista leads de A', Array.isArray(r1.data) && r1.data.length === 0);
  const r2 = await rest(`/leads?id=eq.${lead.id}&select=*`, { token: b.token });
  check('B não lê o lead de A pelo id', Array.isArray(r2.data) && r2.data.length === 0);
  const r3 = await rest(`/lead_interactions?lead_id=eq.${lead.id}&select=*`, { token: b.token });
  check('B não lê o histórico de A', Array.isArray(r3.data) && r3.data.length === 0);
  const r4 = await rest(`/companies?id=eq.${a.companyId}&select=*`, { token: b.token });
  check('B não lê a empresa de A', Array.isArray(r4.data) && r4.data.length === 0);
  const r5 = await rest(`/profiles?id=eq.${a.id}&select=*`, { token: b.token });
  check('B não lê o perfil de A', Array.isArray(r5.data) && r5.data.length === 0);

  console.log('\n4. B tenta ALTERAR / APAGAR dados de A');
  const w1 = await rest(`/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    token: b.token,
    prefer: REP,
    body: { name: 'INVADIDO', stage: 'perdido' },
  });
  check('B não altera o lead de A', Array.isArray(w1.data) && w1.data.length === 0);
  const w2 = await rest(`/leads?id=eq.${lead.id}`, { method: 'DELETE', token: b.token, prefer: REP });
  check('B não apaga o lead de A', Array.isArray(w2.data) && w2.data.length === 0);
  const w3 = await rest('/leads', {
    method: 'POST',
    token: b.token,
    prefer: REP,
    body: { name: 'Lead plantado', company_id: a.companyId },
  });
  check('B não cria lead dentro da empresa de A', w3.status === 403, `status ${w3.status}`);
  const w4 = await rest('/lead_interactions', {
    method: 'POST',
    token: b.token,
    prefer: REP,
    body: { lead_id: lead.id, content: 'nota invasora' },
  });
  check('B não escreve no histórico do lead de A', w4.status >= 400, `status ${w4.status}`);
  const w5 = await rest('/lead_interactions', {
    method: 'POST',
    token: b.token,
    prefer: REP,
    body: { lead_id: lead.id, company_id: a.companyId, content: 'nota invasora 2' },
  });
  check('...nem informando a empresa de A', w5.status === 403, `status ${w5.status}`);
  const w6 = await rest(`/lead_interactions?lead_id=eq.${lead.id}`, {
    method: 'DELETE',
    token: b.token,
    prefer: REP,
  });
  check('B não apaga histórico de A', Array.isArray(w6.data) && w6.data.length === 0);
  const w7 = await rest(`/companies?id=eq.${a.companyId}`, {
    method: 'PATCH',
    token: b.token,
    prefer: REP,
    body: { name: 'INVADIDA' },
  });
  check('B não renomeia a empresa de A', Array.isArray(w7.data) && w7.data.length === 0);

  console.log('\n5. B tenta TROCAR DE EMPRESA');
  const x1 = await rest(`/profiles?id=eq.${b.id}`, {
    method: 'PATCH',
    token: b.token,
    prefer: REP,
    body: { company_id: a.companyId },
  });
  check('B não muda o próprio company_id', x1.status === 403 || x1.status === 401, `status ${x1.status}`);
  const x2 = await rest(`/profiles?id=eq.${b.id}`, {
    method: 'PATCH',
    token: b.token,
    prefer: REP,
    body: { role: 'member' },
  });
  check('B não muda o próprio papel (role)', x2.status === 403 || x2.status === 401, `status ${x2.status}`);
  const x3 = await rest('/profiles', {
    method: 'POST',
    token: b.token,
    prefer: REP,
    body: { id: b.id, company_id: a.companyId },
  });
  check('B não cria um segundo perfil', x3.status >= 400, `status ${x3.status}`);
  const leadB = await rest('/leads', {
    method: 'POST',
    token: b.token,
    prefer: REP,
    body: { name: 'Cliente de B', estimated_value: 100 },
  });
  const x4 = await rest(`/leads?id=eq.${leadB.data?.[0]?.id}`, {
    method: 'PATCH',
    token: b.token,
    prefer: REP,
    body: { company_id: a.companyId },
  });
  const afterMove = await rest('/leads?select=id,name', { token: a.token });
  check(
    'B não "empurra" um lead seu para dentro da empresa de A',
    afterMove.data?.length === 1 && (x4.status >= 400 || x4.data?.[0]?.company_id === b.companyId),
  );

  console.log('\n6. Visitante sem login');
  const n1 = await rest('/leads?select=*');
  check('sem login não lê leads', n1.status === 401 || n1.status === 403, `status ${n1.status}`);
  const n2 = await rest('/rpc/dashboard_stats', { method: 'POST', body: {} });
  check('sem login não chama os indicadores', n2.status >= 400, `status ${n2.status}`);
  const n3 = await rest('/rpc/current_company_id', { method: 'POST', token: b.token, body: {} });
  check('funções internas não ficam expostas na API', n3.status === 404, `status ${n3.status}`);

  console.log('\n7. Indicadores e histórico automático');
  const up1 = await rest(`/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    token: a.token,
    prefer: REP,
    body: { stage: 'orcamento', next_contact_at: '2030-01-15' },
  });
  check('A move o próprio lead de etapa', up1.data?.[0]?.stage === 'orcamento');
  const hist2 = await rest(`/lead_interactions?lead_id=eq.${lead.id}&select=type,content`, { token: a.token });
  check(
    'histórico registra "Orçamento enviado — R$ 850,00"',
    hist2.data?.some((i) => i.content === 'Orçamento enviado — R$ 850,00'),
    JSON.stringify(hist2.data),
  );
  check(
    'histórico registra o próximo contato',
    hist2.data?.some((i) => i.content === 'Próximo contato marcado para 15/01/2030'),
  );
  const statsA = await rest('/rpc/dashboard_stats', { method: 'POST', token: a.token, body: { p_today: '2030-01-15' } });
  check(
    'indicadores de A contam só os leads de A',
    statsA.data?.total === 1 && statsA.data?.hoje === 1 && Number(statsA.data?.valor_negociacao) === 850,
    JSON.stringify(statsA.data),
  );
  const statsB = await rest('/rpc/dashboard_stats', { method: 'POST', token: b.token, body: {} });
  check(
    'indicadores de B não incluem nada de A',
    statsB.data?.total === 1 && Number(statsB.data?.valor_negociacao) === 100,
    JSON.stringify(statsB.data),
  );
  const up2 = await rest(`/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    token: a.token,
    prefer: REP,
    body: { stage: 'fechado' },
  });
  check(
    'fechar a venda limpa o retorno pendente e grava a data',
    up2.data?.[0]?.next_contact_at === null && !!up2.data?.[0]?.closed_at,
  );
  const note = await rest('/lead_interactions', {
    method: 'POST',
    token: a.token,
    prefer: REP,
    body: { lead_id: lead.id, content: 'Cliente disse que iria analisar' },
  });
  check('A adiciona anotação manual', note.status === 201 && note.data?.[0]?.type === 'nota');
  const upd = await rest(`/lead_interactions?id=eq.${note.data?.[0]?.id}`, {
    method: 'PATCH',
    token: a.token,
    prefer: REP,
    body: { content: 'reescrito' },
  });
  check('histórico não pode ser reescrito', upd.status >= 400, `status ${upd.status}`);
  const stillThere = await rest(`/leads?id=eq.${lead.id}&select=name`, { token: a.token });
  check('lead de A continua intacto', stillThere.data?.[0]?.name === 'João da Silva');
}

try {
  await main();
} catch (err) {
  failed++;
  console.error('\nErro durante o teste:', err.message);
} finally {
  console.log('\nApagando contas de teste...');
  for (const u of users) {
    try {
      await deleteUser(u);
    } catch {
      /* segue */
    }
  }
}

console.log(`\nResultado: ${passed} passaram, ${failed} falharam.\n`);
process.exit(failed ? 1 : 0);
