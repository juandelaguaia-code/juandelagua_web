import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import {
  INFORME_SCHEMA,
  SYSTEM_PROMPT,
  esInforme,
  informeReglas,
  parseRespuestas,
  promptUsuario,
  type Informe,
  type Respuestas,
} from '../../lib/diagnostico';

// Esta ruta corre en el servidor (las páginas del sitio son estáticas).
export const prerender = false;

const MODEL = 'claude-opus-5-5';

// Límite simple por IP: evita abuso del endpoint público (memoria del proceso).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

// Variables de entorno en tiempo de ejecución (EasyPanel → Environment).
// En desarrollo local además se carga el archivo .env si existe.
if (import.meta.env.DEV) {
  try { process.loadEnvFile(); } catch { /* sin .env: el diagnóstico usa el informe por reglas */ }
}
const env = (name: string): string | undefined => process.env[name] || undefined;

async function informeIA(r: Respuestas): Promise<Informe | null> {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: INFORME_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: promptUsuario(r) }],
    });
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return null;
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;
    const parsed: unknown = JSON.parse(text.text);
    return esInforme(parsed) ? parsed : null;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.error('[diagnostico] rate limit de la API');
    else if (error instanceof Anthropic.APIError) console.error(`[diagnostico] API error ${error.status}: ${error.message}`);
    else console.error('[diagnostico] error', error);
    return null;
  }
}

/** Si hay un webhook configurado (n8n, CRM…) y la persona dio consentimiento, se envía el lead. */
async function enviarLead(r: Respuestas, informe: Informe) {
  const url = env('LEAD_WEBHOOK_URL');
  if (!url || !r.contacto || !r.consentimiento) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fuente: 'diagnostico-web', fecha: new Date().toISOString(), respuestas: r, informe }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error('[diagnostico] no se pudo enviar el lead', error);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'desconocida';
  if (limited(ip)) {
    return json({ error: 'Alcanzaste el límite de diagnósticos por hora. Escríbeme por WhatsApp y lo reviso directamente.' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  const r = parseRespuestas(body);
  if (!r) return json({ error: 'Faltan respuestas para generar el diagnóstico.' }, 400);
  if (r.contacto && !r.consentimiento) return json({ error: 'Para dejar tus datos de contacto necesito tu autorización.' }, 400);

  const ia = await informeIA(r);
  const informe = ia ?? informeReglas(r);
  await enviarLead(r, informe);

  return json({ informe, fuente: ia ? 'ia' : 'reglas' });
};
