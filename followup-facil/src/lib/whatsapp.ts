import type { StageId } from './constants';
import { firstName, onlyDigits } from './format';

/**
 * Transforma o telefone digitado no formato que o WhatsApp espera
 * (só números, com código do país). Retorna null se não der para usar.
 *   '(11) 98888-7777'   -> '5511988887777'
 *   '+351 912 345 678'  -> '351912345678'
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const international = raw.trim().startsWith('+');
  let digits = onlyDigits(raw).replace(/^0+/, '');
  if (digits.length < 8) return null;
  if (international) return digits.length <= 15 ? digits : null;
  // já veio com 55 na frente
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  // DDD + número (fixo com 8 dígitos ou celular com 9)
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  else return null;
  return digits;
}

/** Número a usar para um lead: o WhatsApp, e se não tiver, o telefone. */
export function leadWhatsAppNumber(lead: { whatsapp: string | null; phone: string | null }): string | null {
  return normalizeWhatsAppNumber(lead.whatsapp) ?? normalizeWhatsAppNumber(lead.phone);
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const text = message.trim();
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export type MessageTemplate = { id: string; label: string; text: string };

type TemplateLead = { name: string; interest: string | null; stage: StageId };
type TemplateSender = { userName: string; companyName: string };

/** Mensagens prontas. O usuário sempre pode editar antes de enviar. */
export function buildTemplates(lead: TemplateLead, sender: TemplateSender): MessageTemplate[] {
  const nome = firstName(lead.name) || 'tudo bem';
  const eu = firstName(sender.userName);
  const empresa = sender.companyName.trim();
  const interesse = lead.interest?.trim();

  const apresentacao =
    eu && empresa && empresa !== 'Minha empresa'
      ? ` Aqui é ${eu}, da ${empresa}.`
      : eu
        ? ` Aqui é ${eu}.`
        : '';

  return [
    {
      id: 'primeiro',
      label: 'Primeiro contato',
      text: `Olá, ${nome}! Tudo bem?${apresentacao} Recebi seu contato${
        interesse ? ` sobre ${interesse}` : ''
      } e quero te ajudar. Podemos conversar?`,
    },
    {
      id: 'orcamento',
      label: 'Retorno de orçamento',
      text: `Olá, ${nome}! Tudo bem? Estou passando para saber se conseguiu analisar o orçamento que te enviei. Ficou alguma dúvida?`,
    },
    {
      id: 'retomar',
      label: 'Retomar conversa',
      text: `Olá, ${nome}! Tudo bem? Faz um tempinho que não nos falamos${
        interesse ? ` sobre ${interesse}` : ''
      }. Ainda posso te ajudar?`,
    },
    {
      id: 'posvenda',
      label: 'Pós-venda',
      text: `Olá, ${nome}! Tudo bem? Passando para saber se ficou tudo certo${
        interesse ? ` com ${interesse}` : ''
      }. Qualquer coisa, é só me chamar!`,
    },
  ];
}

/** Qual mensagem faz mais sentido para a etapa em que o lead está. */
export function defaultTemplateId(stage: StageId): string {
  switch (stage) {
    case 'novo':
      return 'primeiro';
    case 'orcamento':
    case 'aguardando':
      return 'orcamento';
    case 'fechado':
      return 'posvenda';
    default:
      return 'retomar';
  }
}
