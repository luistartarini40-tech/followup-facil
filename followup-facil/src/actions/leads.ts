'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isStageId, UUID_RE, type StageId } from '@/lib/constants';
import { isISODate } from '@/lib/dates';
import { parseBRL } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

// Todas as ações usam o cliente do usuário logado: quem decide o que pode
// ser lido ou alterado é o RLS do banco, não o código do navegador.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VALUE = 9_999_999_999.99;
const SESSION_EXPIRED = 'Sua sessão expirou. Entre novamente.';
const GENERIC_ERROR = 'Não foi possível salvar. Tente novamente.';

export type LeadFormValues = {
  name: string;
  whatsapp: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
  estimated_value: string;
  stage: string;
  notes: string;
  next_contact_at: string;
};

export type LeadFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof LeadFormValues, string>>;
  values?: LeadFormValues;
};

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function refresh() {
  // painel, lista, pipeline e o contador do menu dependem dos leads
  revalidatePath('/', 'layout');
}

function parseLeadForm(formData: FormData) {
  const get = (key: keyof LeadFormValues, max: number) =>
    String(formData.get(key) ?? '').trim().slice(0, max);

  const values: LeadFormValues = {
    name: get('name', 200),
    whatsapp: get('whatsapp', 30),
    phone: get('phone', 30),
    email: get('email', 160),
    source: get('source', 60),
    interest: get('interest', 200),
    estimated_value: get('estimated_value', 30),
    stage: get('stage', 20),
    notes: get('notes', 4000),
    next_contact_at: get('next_contact_at', 10),
  };

  const fieldErrors: LeadFormState['fieldErrors'] = {};

  if (!values.name) fieldErrors.name = 'Informe o nome do cliente.';
  else if (values.name.length > 120) fieldErrors.name = 'Nome muito longo (máximo 120 letras).';

  if (values.email && !EMAIL_RE.test(values.email)) fieldErrors.email = 'E-mail inválido.';

  const value = parseBRL(values.estimated_value);
  if (value === null || value > MAX_VALUE) {
    fieldErrors.estimated_value = 'Valor inválido. Exemplo: 850,00';
  }

  if (values.next_contact_at && !isISODate(values.next_contact_at)) {
    fieldErrors.next_contact_at = 'Data inválida.';
  }

  const stage: StageId = isStageId(values.stage) ? values.stage : 'novo';

  const row = {
    name: values.name,
    whatsapp: values.whatsapp || null,
    phone: values.phone || null,
    email: values.email.toLowerCase() || null,
    source: values.source || 'Outro',
    interest: values.interest || null,
    estimated_value: value ?? 0,
    stage,
    notes: values.notes || null,
    next_contact_at: values.next_contact_at || null,
  };

  return { values, fieldErrors, row, hasErrors: Object.keys(fieldErrors).length > 0 };
}

export async function createLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const { values, fieldErrors, row, hasErrors } = parseLeadForm(formData);
  if (hasErrors) return { error: 'Confira os campos destacados.', fieldErrors, values };

  const supabase = await getAuthedClient();
  if (!supabase) return { error: SESSION_EXPIRED, values };

  // company_id e created_by são preenchidos pelo banco a partir do usuário logado
  const { data, error } = await supabase.from('leads').insert(row).select('id').single();
  if (error || !data) return { error: GENERIC_ERROR, values };

  refresh();
  redirect(`/leads/${data.id}`);
}

export async function updateLead(
  id: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { values, fieldErrors, row, hasErrors } = parseLeadForm(formData);
  if (hasErrors) return { error: 'Confira os campos destacados.', fieldErrors, values };
  if (!UUID_RE.test(id)) return { error: 'Lead não encontrado.', values };

  const supabase = await getAuthedClient();
  if (!supabase) return { error: SESSION_EXPIRED, values };

  const { data, error } = await supabase.from('leads').update(row).eq('id', id).select('id');
  if (error) return { error: GENERIC_ERROR, values };
  if (!data || data.length === 0) return { error: 'Lead não encontrado.', values };

  refresh();
  redirect(`/leads/${id}`);
}

export async function deleteLead(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Lead não encontrado.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) return { ok: false, error: 'Não foi possível excluir. Tente novamente.' };

  refresh();
  redirect('/leads');
}

/** Move o lead de etapa (pipeline e tela do lead). O banco registra no histórico. */
export async function moveLeadStage(id: string, stage: string): Promise<ActionResult> {
  if (!UUID_RE.test(id) || !isStageId(stage)) return { ok: false, error: 'Dados inválidos.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { data, error } = await supabase.from('leads').update({ stage }).eq('id', id).select('id');
  if (error) return { ok: false, error: 'Não foi possível mover o lead. Tente novamente.' };
  if (!data || data.length === 0) return { ok: false, error: 'Lead não encontrado.' };

  refresh();
  return { ok: true };
}

/** Define (ou limpa, com null) a data do próximo contato. */
export async function scheduleNextContact(id: string, date: string | null): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Lead não encontrado.' };
  if (date !== null && !isISODate(date)) return { ok: false, error: 'Data inválida.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { data, error } = await supabase
    .from('leads')
    .update({ next_contact_at: date })
    .eq('id', id)
    .select('id');
  if (error) return { ok: false, error: GENERIC_ERROR };
  if (!data || data.length === 0) return { ok: false, error: 'Lead não encontrado.' };

  refresh();
  return { ok: true };
}

/**
 * "Já falei com o cliente": grava no histórico o que aconteceu e marca
 * quando falar de novo (ou limpa a data, se nextDate for null).
 */
export async function registerFollowUp(
  id: string,
  input: { note: string; nextDate: string | null },
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Lead não encontrado.' };

  const note = String(input?.note ?? '').trim().slice(0, 1500);
  const nextDate = input?.nextDate ?? null;
  if (nextDate !== null && !isISODate(nextDate)) return { ok: false, error: 'Data inválida.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { error: historyError } = await supabase.from('lead_interactions').insert({
    lead_id: id,
    type: 'retorno',
    content: note ? `Retorno realizado — ${note}` : 'Retorno realizado',
  });
  if (historyError) return { ok: false, error: GENERIC_ERROR };

  const { error } = await supabase.from('leads').update({ next_contact_at: nextDate }).eq('id', id);
  if (error) return { ok: false, error: GENERIC_ERROR };

  refresh();
  return { ok: true };
}

/** Registra no histórico que o usuário chamou o cliente no WhatsApp. */
export async function logWhatsApp(id: string, message: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Lead não encontrado.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const text = String(message ?? '').replace(/\s+/g, ' ').trim();
  const preview = text.length > 160 ? `${text.slice(0, 160)}…` : text;

  const { error } = await supabase.from('lead_interactions').insert({
    lead_id: id,
    type: 'whatsapp',
    content: preview ? `Chamou no WhatsApp: “${preview}”` : 'Chamou no WhatsApp',
  });
  if (error) return { ok: false, error: GENERIC_ERROR };

  refresh();
  return { ok: true };
}

/** Anotação manual no histórico do lead. */
export async function addNote(leadId: string, content: string): Promise<ActionResult> {
  if (!UUID_RE.test(leadId)) return { ok: false, error: 'Lead não encontrado.' };

  const text = String(content ?? '').trim();
  if (!text) return { ok: false, error: 'Escreva a anotação antes de salvar.' };
  if (text.length > 2000) return { ok: false, error: 'Anotação muito longa (máximo 2.000 letras).' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { error } = await supabase
    .from('lead_interactions')
    .insert({ lead_id: leadId, type: 'nota', content: text });
  if (error) return { ok: false, error: GENERIC_ERROR };

  refresh();
  return { ok: true };
}

/** Apaga uma anotação manual (o banco não deixa apagar registros automáticos). */
export async function deleteNote(noteId: string): Promise<ActionResult> {
  if (!UUID_RE.test(noteId)) return { ok: false, error: 'Anotação não encontrada.' };

  const supabase = await getAuthedClient();
  if (!supabase) return { ok: false, error: SESSION_EXPIRED };

  const { error } = await supabase.from('lead_interactions').delete().eq('id', noteId).eq('type', 'nota');
  if (error) return { ok: false, error: 'Não foi possível apagar. Tente novamente.' };

  refresh();
  return { ok: true };
}
