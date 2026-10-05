/**
 * Só aceita caminhos internos do próprio sistema ("/painel", "/leads/123").
 * Evita que um link malicioso use ?next=https://site-falso.com para
 * redirecionar o usuário depois do login.
 */
export function safeInternalPath(value: string | null | undefined, fallback = '/painel'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
