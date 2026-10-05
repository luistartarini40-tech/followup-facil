'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthFormState,
} from '@/actions/auth';
import { btnPrimaryLg, inputClass, labelClass } from '@/lib/ui';
import { FormMessage } from './form-bits';

const EMPTY: AuthFormState = {};
const submitClass = `${btnPrimaryLg} w-full`;

export function LoginForm({ next, notice }: { next?: string; notice?: { error?: string; success?: string } }) {
  const [state, formAction, pending] = useActionState(signIn, EMPTY);
  const [email, setEmail] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />

      {!state.error && notice && <FormMessage error={notice.error} success={notice.success} />}
      <FormMessage error={state.error} />

      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Senha
          </label>
          <Link href="/recuperar-senha" className="text-sm font-medium text-brand-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, EMPTY);
  const [values, setValues] = useState({ full_name: '', company_name: '', email: '' });
  const set = (field: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  if (state.success) {
    return (
      <div className="space-y-4">
        <FormMessage success={state.success} />
        <p className="text-sm text-slate-600">
          Não chegou? Olhe a caixa de spam. Depois de confirmar, é só{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            entrar
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />

      <div>
        <label htmlFor="full_name" className={labelClass}>
          Seu nome
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          value={values.full_name}
          onChange={(e) => set('full_name')(e.target.value)}
          placeholder="Ex.: Maria Souza"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="company_name" className={labelClass}>
          Nome do seu negócio
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          autoComplete="organization"
          required
          maxLength={120}
          value={values.company_name}
          onChange={(e) => set('company_name')(e.target.value)}
          placeholder="Ex.: Studio Maria Souza"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
          placeholder="voce@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Crie uma senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-500">Pelo menos 8 caracteres.</p>
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? 'Criando sua conta...' : 'Criar minha conta'}
      </button>
    </form>
  );
}

export function ForgotPasswordForm({ notice }: { notice?: { error?: string } }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, EMPTY);
  const [email, setEmail] = useState('');

  if (state.success) {
    return <FormMessage success={state.success} />;
  }

  return (
    <form action={formAction} className="space-y-4">
      {!state.error && notice?.error && <FormMessage error={notice.error} />}
      <FormMessage error={state.error} />

      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail da sua conta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? 'Enviando...' : 'Enviar link para criar nova senha'}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />

      <div>
        <label htmlFor="password" className={labelClass}>
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-500">Pelo menos 8 caracteres.</p>
      </div>

      <div>
        <label htmlFor="confirm" className={labelClass}>
          Repita a nova senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  );
}
