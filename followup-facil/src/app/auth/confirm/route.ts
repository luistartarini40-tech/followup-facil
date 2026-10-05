import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { safeInternalPath } from '@/lib/safe-path';
import { createClient } from '@/lib/supabase/server';

/**
 * Destino dos links enviados por e-mail (confirmar cadastro e recuperar senha).
 * Aceita os dois formatos do Supabase:
 *   ?code=...                 (padrão)
 *   ?token_hash=...&type=...  (se você personalizar os modelos de e-mail — ver README)
 * Em ambos, troca o código por uma sessão e segue para a página certa.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const isRecovery = type === 'recovery' || searchParams.get('next') === '/redefinir-senha';
  const next = safeInternalPath(searchParams.get('next'), isRecovery ? '/redefinir-senha' : '/painel');

  const go = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return go(next);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return go(next);
  }

  return go(isRecovery ? '/recuperar-senha?erro=link' : '/login?erro=link');
}
