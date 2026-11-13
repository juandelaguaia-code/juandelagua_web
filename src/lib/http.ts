// Utilidades para páginas con formularios (POST → redirect).
import type { AstroGlobal, APIContext } from 'astro';

type Ctx = AstroGlobal | APIContext;

export const isPost = (ctx: Ctx) => ctx.request.method === 'POST';

export async function form(ctx: Ctx) {
  const fd = await ctx.request.formData();
  const str = (k: string, max = 20000) => String(fd.get(k) ?? '').trim().slice(0, max);
  return { fd, str, bool: (k: string) => fd.get(k) === 'on' || fd.get(k) === 'true' || fd.get(k) === '1', int: (k: string) => Number.parseInt(String(fd.get(k) ?? ''), 10) };
}

/** Normaliza un nombre de usuario: "Juan Araneda" → "juan_araneda" (letras, números y _; máx. 30) */
export const normalizeUsername = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
    .replace(/[\s.-]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);

/** Solo rutas internas (evita redirecciones abiertas) */
export const safeNext = (next: string | null | undefined, fallback = '/comunidad/feed') =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;

/** Agrega ?ok= / ?error= a una ruta */
export const withMsg = (path: string, kind: 'ok' | 'error', code: string) => `${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(code)}`;

export const clientIp = (ctx: Ctx) =>
  ctx.request.headers.get('cf-connecting-ip') ?? ctx.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? (ctx as APIContext).clientAddress ?? 'desconocida';

/** Límite de intentos en memoria (por proceso). Supabase Auth aplica además sus propios límites. */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.n += 1;
  return b.n <= max;
}

/** Hash de IP para registrar consentimientos sin guardar la IP */
export async function ipHash(ip: string) {
  const data = new TextEncoder().encode(`jda:${ip}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Mensajes para ?ok= / ?error= */
export const MESSAGES: Record<string, string> = {
  // errores
  credenciales: 'Correo o contraseña incorrectos.',
  demasiados: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  captcha: 'No pudimos verificar que eres una persona. Inténtalo de nuevo.',
  password_corta: 'La contraseña debe tener al menos 8 caracteres.',
  password_distinta: 'Las contraseñas no coinciden.',
  password_debil: 'Esa contraseña aparece en filtraciones conocidas o es muy débil. Elige otra.',
  correo_invalido: 'Revisa el correo: no parece válido.',
  correo_no_verificado: 'Primero confirma tu correo con el enlace que te enviamos.',
  usuario_tomado: 'Ese nombre de usuario ya existe.',
  usuario_invalido: 'El nombre de usuario debe tener entre 3 y 30 letras, números o guion bajo.',
  enlace: 'El enlace no es válido o ya expiró. Pide uno nuevo.',
  sesion: 'Tu sesión expiró. Vuelve a entrar.',
  consentimiento: 'Para continuar debes aceptar los términos, la política de privacidad y las normas.',
  confirmacion: 'Escribe ELIMINAR para confirmar.',
  archivo: 'El archivo no es válido (formato o tamaño).',
  permiso: 'No tienes permiso para hacer eso.',
  bloqueado: 'Esta publicación está cerrada a nuevos comentarios.',
  desconocido: 'Algo salió mal. Inténtalo de nuevo.',
  no_configurado: 'Las cuentas aún no están habilitadas en este sitio.',
  // ok
  registrado: 'Te enviamos un correo para confirmar tu cuenta. Revisa también la carpeta de spam.',
  enlace_enviado: 'Si el correo existe, te enviamos un enlace. Revisa tu bandeja de entrada.',
  password_cambiada: 'Tu contraseña se actualizó.',
  perfil: 'Perfil guardado.',
  correo_cambio: 'Te enviamos un enlace al correo nuevo (y al actual) para confirmar el cambio.',
  preferencias: 'Preferencias guardadas.',
  guardado: 'Cambios guardados.',
  solicitud: 'Recibimos tu solicitud. Te avisaremos cuando sea aprobada.',
  publicado: 'Publicado.',
  eliminado: 'Eliminado.',
  reportado: 'Gracias, el equipo de moderación revisará el reporte.',
  salir: 'Cerraste sesión.',
};

export const flash = (url: URL) => {
  const ok = url.searchParams.get('ok');
  const error = url.searchParams.get('error');
  if (error) return { kind: 'error' as const, text: MESSAGES[error] ?? MESSAGES.desconocido };
  if (ok?.startsWith('aviso_')) return { kind: 'ok' as const, text: `Aviso enviado a ${ok.slice(6)} miembros.` };
  if (ok) return { kind: 'ok' as const, text: MESSAGES[ok] ?? MESSAGES.guardado };
  return null;
};

/** Traduce errores de Supabase Auth / Postgres a un código de MESSAGES */
export function errorCode(e: { message?: string; code?: string; status?: number } | null | undefined): string {
  const m = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  if (!e) return 'desconocido';
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'credenciales';
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'correo_no_verificado';
  if (m.includes('captcha')) return 'captcha';
  if (m.includes('rate limit') || m.includes('over_') || e.status === 429) return 'demasiados';
  if (m.includes('weak') || m.includes('pwned') || m.includes('leaked')) return 'password_debil';
  if (m.includes('password') && m.includes('characters')) return 'password_corta';
  if (m.includes('profiles_username_key') || m.includes('duplicate key value') && m.includes('username')) return 'usuario_tomado';
  if (m.includes('username')) return 'usuario_invalido';
  if (m.includes('post_locked')) return 'bloqueado';
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('forbidden')) return 'permiso';
  if (m.includes('expired') || m.includes('invalid') && m.includes('token')) return 'enlace';
  return 'desconocido';
}
