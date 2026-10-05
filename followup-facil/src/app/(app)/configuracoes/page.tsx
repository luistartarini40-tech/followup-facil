import type { Metadata } from 'next';
import { signOut } from '@/actions/auth';
import { LogOutIcon } from '@/components/icons';
import { PageContainer, PageHeader } from '@/components/page-layout';
import { SettingsForm } from '@/components/settings-form';
import { getSessionContext } from '@/lib/auth';
import { btnSecondary, cardClass } from '@/lib/ui';

export const metadata: Metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  const { user, profile, company } = await getSessionContext();

  return (
    <PageContainer>
      <div className="mx-auto max-w-xl">
        <PageHeader title="Configurações" subtitle="Dados da sua conta e do seu negócio." />

        <section className={`${cardClass} p-5 sm:p-6`}>
          <SettingsForm fullName={profile.full_name} companyName={company.name} />
        </section>

        <section className={`${cardClass} mt-5 p-5 sm:p-6`}>
          <h2 className="text-base font-semibold text-slate-900">Acesso</h2>
          <p className="mt-1 text-sm text-slate-600">
            Você entra com o e-mail <strong className="font-semibold text-slate-900">{user.email}</strong>.
          </p>
          <form action={signOut} className="mt-4">
            <button type="submit" className={btnSecondary}>
              <LogOutIcon className="h-4 w-4" />
              Sair da conta
            </button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
