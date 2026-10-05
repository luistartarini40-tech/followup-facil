'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SettingsFormState = {
  error?: string;
  success?: string;
  values?: { full_name: string; company_name: string };
};

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const full_name = String(formData.get('full_name') ?? '').trim().slice(0, 120);
  const company_name = String(formData.get('company_name') ?? '').trim().slice(0, 120);
  const values = { full_name, company_name };

  if (!full_name) return { error: 'Informe seu nome.', values };
  if (!company_name) return { error: 'Informe o nome do seu negócio.', values };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.', values };

  // O RLS só deixa alterar o próprio perfil e a própria empresa.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)
    .select('company_id')
    .maybeSingle();

  if (profileError || !profile) {
    return { error: 'Não foi possível salvar seu nome. Tente novamente.', values };
  }

  const { error: companyError } = await supabase
    .from('companies')
    .update({ name: company_name })
    .eq('id', profile.company_id);

  if (companyError) {
    return { error: 'Não foi possível salvar o nome do negócio. Tente novamente.', values };
  }

  revalidatePath('/', 'layout');
  return { success: 'Dados salvos.', values };
}
