import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

/**
 * Cliente do Supabase para uso no servidor (páginas, ações e rotas).
 * Usa a sessão do usuário guardada em cookies — por isso toda consulta
 * feita com ele passa pelas regras de segurança (RLS) do banco.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de uma página (Server Component), onde não é
          // permitido gravar cookies. Tudo bem: o proxy renova a sessão.
        }
      },
    },
  });
}
