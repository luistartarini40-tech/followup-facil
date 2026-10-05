'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeInternalPath } from '@/lib/safe-path';
import { createClient } from '@/lib/supabase/server';

export type AuthFormState = {
  error?: string;
  success?: string;
  values?: { email?: string; full_name?: string; company_name?: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

/** Endereço público do sistema, usado nos links enviados por e-mail. */
async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;

  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

type SupabaseAuthError = { message: string; code?: string; status?: number; name?: string };

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Em desenvolvimento, acrescenta a causa real ao aviso e explica como resolver.
 * Em produção o usuário vê só a frase simples (o detalhe vai para o log do servidor).
 */
function withDevHint(message: string, error: SupabaseAuthError, hint?: string): string {
  console.error('[auth] erro do Supabase:', {
    code: error.code,
    status: error.status,
    name: error.name,
    message: error.message,
  });
  if (!isDev) return message;
  const detail = [error.code, error.message].filter(Boolean).join(' — ');
  return `${message} [Só em desenvolvimento → ${hint ? `${hint} ` : ''}Detalhe: ${detail || 'sem detalhe'}]`;
}

/** Traduz os erros do Supabase Auth para frases que o usuário entende. */
function translateAuthError(error: SupabaseAuthError): string {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Você ainda não confirmou seu e-mail. Abra a mensagem que enviamos e clique no link.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) {
    return 'Este e-mail já tem uma conta. Faça login ou recupere sua senha.';
  }
  if (code === 'weak_password' || message.includes('password should')) {
    return `Senha fraca. Use pelo menos ${MIN_PASSWORD} caracteres.`;
  }
  if (code === 'same_password') {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (code.includes('rate_limit') || error.status === 429) {
    return withDevHint(
      'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
      error,
      'O envio de e-mails de teste do Supabase tem limite por hora. Para testar sem e-mail, desligue "Confirm email" em Authentication > Sign In / Providers > Email.',
    );
  }
  if (code === 'signup_disabled') {
    return withDevHint(
      'O cadastro de novas contas está desativado no momento.',
      error,
      'Ligue "Allow new users to sign up" em Authentication > Sign In / Providers.',
    );
  }
  if (code === 'email_provider_disabled') {
    return withDevHint(
      'O cadastro por e-mail está desativado no momento.',
      error,
      'Ligue o provedor "Email" em Authentication > Sign In / Providers.',
    );
  }
  if (code === 'email_address_not_authorized' || message.includes('not authorized')) {
    return withDevHint(
      'Não foi possível enviar o e-mail de confirmação.',
      error,
      'O e-mail de teste do Supabase só envia para o e-mail da sua própria conta Supabase. Desligue "Confirm email" em Authentication > Sign In / Providers > Email (ou configure um SMTP próprio).',
    );
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return withDevHint('Confira o e-mail informado.', error, 'Use um e-mail de verdade (o Supabase recusa endereços como teste@teste.com).');
  }
  if (message.includes('database error')) {
    return withDevHint(
      'Não foi possível criar a conta. Tente novamente em instantes.',
      error,
      'O banco recusou a criação da conta. Rode de novo o arquivo supabase/schema.sql INTEIRO no SQL Editor e veja se termina com "Success".',
    );
  }
  if (message.includes('invalid api key') || message.includes('no api key') || error.status === 401) {
    return withDevHint(
      'Não foi possível concluir. Tente novamente em instantes.',
      error,
      'A chave do Supabase no .env.local parece errada. Copie de novo a chave "anon" (ou "publishable") em Project Settings > API Keys, salve e reinicie o "npm run dev".',
    );
  }
  if (error.name === 'AuthRetryableFetchError' || message.includes('fetch failed') || !error.status) {
    return withDevHint(
      'Não foi possível conectar. Confira sua internet e tente de novo.',
      error,
      'O sistema não conseguiu falar com o Supabase. Confira NEXT_PUBLIC_SUPABASE_URL no .env.local (formato https://xxxxxxxx.supabase.co, sem nada depois), salve e reinicie o "npm run dev".',
    );
  }
  return withDevHint('Não foi possível concluir. Tente novamente em instantes.', error);
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, 'email').toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeInternalPath(text(formData, 'next'));

  if (!EMAIL_RE.test(email) || !password) {
    return { error: 'Informe seu e-mail e sua senha.', values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateAuthError(error), values: { email } };

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const full_name = text(formData, 'full_name').slice(0, 120);
  const company_name = text(formData, 'company_name').slice(0, 120);
  const email = text(formData, 'email').toLowerCase();
  const password = String(formData.get('password') ?? '');
  const values = { email, full_name, company_name };

  if (!full_name) return { error: 'Informe seu nome.', values };
  if (!company_name) return { error: 'Informe o nome do seu negócio.', values };
  if (!EMAIL_RE.test(email)) return { error: 'Informe um e-mail válido.', values };
  if (password.length < MIN_PASSWORD) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`, values };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Vai para o banco e é usado pelo gatilho que cria a empresa e o perfil.
      data: { full_name, company_name },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/painel`,
    },
  });

  if (error) return { error: translateAuthError(error), values };

  // Com "Confirm email" desligado no Supabase, o usuário já entra direto.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/painel');
  }

  // Com confirmação ligada: precisa clicar no link do e-mail.
  return {
    success:
      'Quase lá! Enviamos um link de confirmação para o seu e-mail. Abra a mensagem e clique no link para entrar.',
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, 'email').toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { error: 'Informe um e-mail válido.', values: { email } };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/redefinir-senha`,
  });

  if (error && (error.status === 429 || (error.code ?? '').includes('rate_limit'))) {
    return { error: translateAuthError(error), values: { email } };
  }

  // Mesma resposta exista ou não a conta: não revelamos quem é cliente.
  return {
    success:
      'Se existir uma conta com esse e-mail, você vai receber um link para criar uma nova senha em alguns minutos.',
  };
}

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < MIN_PASSWORD) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
  }
  if (password !== confirm) {
    return { error: 'As duas senhas não são iguais.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Seu link expirou. Peça um novo em "Esqueci minha senha".' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translateAuthError(error) };

  revalidatePath('/', 'layout');
  redirect('/painel?senha=alterada');
}
