// Fechas en hora de Chile (America/Santiago), con cambio de horario incluido.
export const TZ = 'America/Santiago';

function offsetMinutes(utcMs: number, tz = TZ) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - utcMs) / 60000;
}

/** "2027-01-04T09:00" (hora de Chile) → ISO UTC */
export function chileLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = naive - offsetMinutes(naive) * 60000;
  utc = naive - offsetMinutes(utc) * 60000;
  return new Date(utc).toISOString();
}

/** ISO UTC → "2027-01-04T09:00" en hora de Chile (para <input type="datetime-local">) */
export function isoToChileLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = +new Date(iso);
  return new Date(ms + offsetMinutes(ms) * 60000).toISOString().slice(0, 16);
}

/** Próximo lunes a las 09:00 de Chile */
export function nextMondayNine(): string {
  const now = new Date();
  const local = new Date(+now + offsetMinutes(+now) * 60000);
  const days = ((8 - local.getUTCDay()) % 7) || 7;
  local.setUTCDate(local.getUTCDate() + days);
  return `${local.toISOString().slice(0, 10)}T09:00`;
}

export const formatChile = (iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'full', timeStyle: 'short' }) =>
  new Intl.DateTimeFormat('es-CL', { ...opts, timeZone: TZ }).format(new Date(iso));

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
