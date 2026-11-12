// Eventos del calendario: próximas ocurrencias (incluye recurrencia semanal o mensual simple) y .ics
export interface EventRow {
  id: number; title: string; description_md: string; starts_at: string; ends_at: string | null; tz: string;
  recurrence_rule: string | null; cover_url: string | null;
}

/** Próximas ocurrencias de un evento a partir de `from` (máximo `count`) */
export function occurrences(e: EventRow, from = new Date(), count = 3): { start: Date; end: Date | null }[] {
  const start = new Date(e.starts_at);
  const dur = e.ends_at ? +new Date(e.ends_at) - +start : null;
  const out: { start: Date; end: Date | null }[] = [];
  const push = (d: Date) => out.push({ start: d, end: dur != null ? new Date(+d + dur) : null });
  if (!e.recurrence_rule) {
    if (+start + (dur ?? 2 * 3600_000) >= +from) push(start);
    return out;
  }
  const monthly = e.recurrence_rule.startsWith('FREQ=MONTHLY');
  const d = new Date(start);
  for (let i = 0; i < 520 && out.length < count; i++) {
    if (+d + (dur ?? 2 * 3600_000) >= +from) push(new Date(d));
    if (monthly) d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);

export function toIcs(e: EventRow, url: string, location: string | null) {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(+start + 3600_000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//juandelagua.com//Comunidad//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:evento-${e.id}@juandelagua.com`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    ...(e.recurrence_rule ? [`RRULE:${e.recurrence_rule}`] : []),
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(`${e.description_md}\n\n${url}`)}`,
    ...(location ? [`LOCATION:${icsText(location)}`] : []),
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export const googleCalendarUrl = (e: EventRow, start: Date, end: Date | null, details: string) => {
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: e.title,
    dates: `${icsDate(start)}/${icsDate(end ?? new Date(+start + 3600_000))}`,
    details, ctz: e.tz,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
};
