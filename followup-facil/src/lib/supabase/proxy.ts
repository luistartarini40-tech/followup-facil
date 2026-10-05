import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './env';

// Áreas que exigem login.
const PROTECTED_PREFIXES = ['/painel', '/leads', '/pipeline', '/configuracoes'];
// Telas que não fazem sentido para quem já está logado.
const GUEST_ONLY = ['/login', '/cadastro', '/recuperar-senha'];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Roda antes de cada página: renova a sessão do Supabase (cookies) e
 * manda para o login quem tenta abrir uma área protegida sem estar logado.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Importante: não colocar código entre a criação do cliente e esta chamada.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = '';
    Object.entries(params ?? {}).forEach(([k, v]) => target.searchParams.set(k, v));
    const redirect = NextResponse.redirect(target);
    // leva junto os cookies de sessão que possam ter sido renovados
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && matches(pathname, PROTECTED_PREFIXES)) {
    return redirectTo('/login', { next: pathname });
  }

  if (!user && pathname === '/redefinir-senha') {
    return redirectTo('/recuperar-senha', { erro: 'link' });
  }

  if (user && matches(pathname, GUEST_ONLY)) {
    return redirectTo('/painel');
  }

  return response;
}
