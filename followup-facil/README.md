# FollowUp Fácil

**Pare de perder clientes porque esqueceu de fazer o retorno.**

Sistema simples de acompanhamento de clientes para pequenos negócios: você cadastra o cliente, marca quando falar com ele de novo, e no dia certo ele aparece no topo da tela com o botão **Chamar no WhatsApp**.

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (PostgreSQL + Auth) com Row Level Security
- Pronto para Vercel

---

## 1. O que o MVP faz

| Tela | O que tem |
|---|---|
| **Painel** (`/painel`) | "Você tem N clientes para acompanhar hoje", lista de atrasados e de hoje com botão de WhatsApp, próximos 7 dias, números e resultados (conversão, em negociação, vendido) |
| **Leads** (`/leads`) | Lista com busca por nome/telefone (ignora acentos e máscara), filtros por etapa, origem, retorno e data, paginação |
| **Lead** (`/leads/[id]`) | Dados, etapa (um toque muda), próximo contato, histórico automático + anotações |
| **Pipeline** (`/pipeline`) | Kanban com 6 colunas; arrastar no computador, "Mover para" no celular |
| **Conta** | Criar conta, entrar, sair, recuperar senha, nome do negócio |

Fora do MVP de propósito: pagamentos, automações, IA, WhatsApp Business API, relatórios, agenda, convite de outros usuários.

---

## 2. Arquitetura

```
Navegador ──> Next.js na Vercel ──> Supabase
              (páginas e ações        (Auth + PostgreSQL com RLS)
               rodam no servidor)
```

- **Tudo passa pelo servidor.** As páginas buscam os dados no servidor e as alterações são *Server Actions*. O navegador nunca fala direto com o banco.
- **A sessão fica em cookies** (`@supabase/ssr`). O `src/proxy.ts` renova a sessão a cada página e manda para o login quem não está logado.
- **Quem protege os dados é o banco**, não o código da tela: toda consulta usa a sessão do usuário, e o RLS só devolve linhas da empresa dele.

### Banco de dados

```
companies  1 ──── N  profiles           (usuários; hoje 1 por empresa)
companies  1 ──── N  leads
leads      1 ──── N  lead_interactions  (histórico)
```

Só essas quatro tabelas. Pontos importantes do `supabase/schema.sql`:

- Ao criar a conta, um gatilho cria **uma empresa nova** e o perfil do usuário.
- A empresa do usuário vem sempre da tabela `profiles` (`private.current_company_id()`), nunca de um valor enviado pelo navegador.
- O usuário não tem permissão de alterar `company_id` nem `role` do próprio perfil.
- O histórico só pode apontar para um lead **da mesma empresa** (chave estrangeira composta).
- O histórico é escrito pelo próprio banco quando o lead é criado, muda de etapa ou ganha data de retorno.
- Os indicadores do painel são calculados por uma função no banco (`dashboard_stats`).

### Pastas

```
supabase/
  schema.sql          estrutura do banco, gatilhos, permissões e RLS
  demo_data.sql       clientes de exemplo para demonstração (opcional)
scripts/
  test-rls.mjs        teste de isolamento entre empresas
src/
  proxy.ts            sessão + proteção das rotas (antigo "middleware")
  app/
    page.tsx          página inicial pública
    (auth)/           entrar, criar conta, recuperar e redefinir senha
    auth/confirm/     destino dos links enviados por e-mail
    (app)/            área logada: painel, leads, pipeline, configurações
  actions/            Server Actions (auth, leads, configurações)
  components/         telas e componentes
  lib/                datas, dinheiro, WhatsApp, consultas, Supabase
```

---

## 3. Rodar na sua máquina

Você precisa do [Node.js](https://nodejs.org) 20.9 ou mais novo.

### 3.1 Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com) e crie um projeto. **Região: South America (São Paulo)**.
2. **SQL Editor → New query** → cole todo o conteúdo de `supabase/schema.sql` → **Run**.
   Faça isso **antes** de criar qualquer conta.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: adicione `http://localhost:3000/**`
4. **Authentication → Sign In / Providers → Email**: para testar sem depender de e-mail, desligue **Confirm email** (você liga de novo antes de vender — ver item 5.4).

### 3.2 Configurar e rodar

```bash
cp .env.example .env.local     # no Windows: copy .env.example .env.local
```

Abra o `.env.local` e preencha com os dados de **Project Settings → API Keys / Data API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (chave "anon" ou "publishable")
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>, clique em **Criar conta** e cadastre seu primeiro cliente.

### 3.3 Dados de demonstração (opcional)

Para mostrar o sistema cheio a um possível cliente: abra `supabase/demo_data.sql`, troque `SEU_EMAIL_AQUI` pelo e-mail da sua conta e rode no SQL Editor. Ele cria 11 clientes de exemplo (atrasados, de hoje, orçamentos, vendas fechadas). O comando para apagá-los está no fim do arquivo.

---

## 4. Testar o isolamento entre empresas

O teste cria duas contas, faz a Empresa B tentar ler, alterar, apagar e "invadir" os dados da Empresa A de 35 formas diferentes pela API, e apaga tudo no final.

1. No `.env.local`, preencha `SUPABASE_SERVICE_ROLE_KEY` (chave **secreta** — "service_role" ou "secret"). Ela só é usada por este script, na sua máquina.
2. Rode:

```bash
npm run test:rls
```

O esperado é `35 passaram, 0 falharam`. Rode de novo sempre que mexer no `schema.sql`.

> **Nunca** coloque a chave secreta na Vercel nem em variável que comece com `NEXT_PUBLIC_`. O sistema não precisa dela para funcionar.

---

## 5. Colocar no ar (Vercel)

### 5.1 GitHub

```bash
git init
git add .
git commit -m "FollowUp Fácil — MVP"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/followup-facil.git
git push -u origin main
```

O `.gitignore` já impede que o `.env.local` suba.

### 5.2 Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
2. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → o endereço final, ex.: `https://followupfacil.com.br` (sem barra no final)
   - `NEXT_PUBLIC_APP_TIMEZONE` → `America/Sao_Paulo`
3. **Deploy**. O `vercel.json` já coloca o servidor em São Paulo (`gru1`), perto do banco.

### 5.3 Avisar o Supabase do endereço novo

**Authentication → URL Configuration**

- Site URL: `https://seudominio.com.br`
- Redirect URLs: `https://seudominio.com.br/**` (mantenha o `http://localhost:3000/**` para desenvolver)

### 5.4 E-mails (obrigatório antes de vender)

O envio de e-mail embutido do Supabase serve só para teste (poucos e-mails por hora). Para produção:

1. Configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (Resend, Brevo, Amazon SES...).
2. Ligue de novo o **Confirm email**.
3. Em **Authentication → Emails → Templates**, troque o link dos dois modelos abaixo. Com esse formato o link funciona mesmo se a pessoa abrir o e-mail em outro aparelho, e foi o formato testado:

**Confirm signup**

```html
<h2>Confirme seu e-mail</h2>
<p>Clique para ativar sua conta no FollowUp Fácil:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/painel">Confirmar meu e-mail</a></p>
```

**Reset password**

```html
<h2>Criar nova senha</h2>
<p>Clique para escolher uma nova senha:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha">Criar nova senha</a></p>
```

### 5.5 Domínio

Vercel → projeto → **Settings → Domains** → adicione o domínio e crie no seu provedor (Registro.br etc.) os registros DNS que a Vercel mostrar. Depois atualize `NEXT_PUBLIC_SITE_URL` (Vercel) e a Site URL / Redirect URLs (Supabase) e faça um novo deploy.

---

## 6. O que foi testado

Tudo abaixo rodou contra um PostgreSQL 16 real com o servidor de autenticação (GoTrue) e a API de dados (PostgREST) que o Supabase usa:

- **Banco e RLS:** `schema.sql` aplicado duas vezes (pode repetir sem erro) e os 35 testes de isolamento, inclusive num banco que começa com permissões abertas por padrão.
- **Fluxos no navegador (108 verificações):** cadastro, login, sair, recuperar senha por e-mail, confirmação de e-mail, cadastro/edição/exclusão de lead, painel, WhatsApp com mensagem editável, registrar retorno, histórico, pipeline (arrastar e "Mover para"), busca, todos os filtros, paginação, configurações, isolamento entre duas empresas pela interface e telas no celular (390 px).
- **Funções de data, dinheiro, telefone e WhatsApp:** 55 verificações (ex.: às 23h de Brasília ainda é "hoje", mesmo com o servidor em UTC).

### O que NÃO foi possível testar no ambiente em que o projeto foi escrito

Esse ambiente não tinha acesso ao registro do npm, então **`npm install` e `next build` não foram executados**. As telas, as ações e as consultas foram testadas com um ambiente equivalente montado à mão (mesmo React 19, mesmo Tailwind 4, mesmo código-fonte), mas **não com os pacotes reais do Next.js e do `@supabase/ssr`**. Na prática:

- Rode `npm install && npm run build` antes de qualquer coisa. Se aparecer algum erro de compilação, ele deve ser pequeno e pontual.
- O link de e-mail no formato padrão do Supabase (`?code=...`) não foi exercitado; o formato com `token_hash` do item 5.4 foi.

---

## 7. Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | roda em desenvolvimento em <http://localhost:3000> |
| `npm run build` | gera a versão de produção |
| `npm start` | roda a versão de produção |
| `npm run typecheck` | confere os tipos do TypeScript |
| `npm run test:rls` | testa o isolamento entre empresas |

---

## 8. Próximos passos (depois do MVP)

1. Assinaturas (planos Básico e Profissional) — sugestão: Stripe ou Asaas/Mercado Pago, com período de teste.
2. Landing page de vendas.
3. Convidar outros usuários para a mesma empresa (o banco já está preparado: `profiles.role`).
4. Lembrete diário por e-mail ou WhatsApp ("você tem 4 clientes para acompanhar hoje").
5. Termos de uso e política de privacidade (LGPD).
