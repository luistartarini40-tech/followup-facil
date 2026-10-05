// Lê as variáveis do Supabase e avisa com clareza quando faltam.

export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !key) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'no arquivo .env.local (ou nas variáveis de ambiente da Vercel).',
    );
  }

  // O painel do Supabase às vezes mostra a URL com "/rest/v1/" no final.
  // O sistema precisa só do endereço base (https://xxxxxxxx.supabase.co),
  // então descartamos qualquer coisa depois do domínio.
  let url: string;
  try {
    url = new URL(rawUrl).origin;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL inválida ("${rawUrl}"). O formato certo é https://xxxxxxxx.supabase.co`,
    );
  }

  return { url, key };
}
