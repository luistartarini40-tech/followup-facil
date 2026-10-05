import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// No Next.js 16 o antigo "middleware" passou a se chamar "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // tudo, menos arquivos estáticos e imagens
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
