import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Company, DashboardStats, Profile } from '@/lib/types';
import { loadDashboardStats } from '@/lib/data';

/**
 * Usuário logado + perfil + empresa.
 * `cache` garante uma única consulta por requisição, mesmo que o layout e
 * a página chamem esta função.
 */
export const getSessionContext = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, role, companies ( id, name )')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar seu perfil: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      'Sua conta existe, mas não tem perfil no banco. Confira se o arquivo supabase/schema.sql ' +
        'foi executado no SQL Editor do Supabase ANTES de criar a conta.',
    );
  }

  const row = data as unknown as Profile & { companies: Company | Company[] | null };
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;

  if (!company) {
    throw new Error('Não foi possível carregar os dados da sua empresa.');
  }

  const profile: Profile = {
    id: row.id,
    company_id: row.company_id,
    full_name: row.full_name,
    role: row.role,
  };

  return { supabase, user: { id: user.id, email: user.email ?? '' }, profile, company };
});

/** Indicadores do painel (uma consulta por requisição). */
export const getDashboardStats = cache(async (today: string): Promise<DashboardStats> => {
  const { supabase } = await getSessionContext();
  return loadDashboardStats(supabase, today);
});
