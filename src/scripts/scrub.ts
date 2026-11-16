/**
 * Video que avanza y retrocede con el scroll (estándar de la skill 10k-websites).
 *
 * - El video se descarga completo como Blob: así el salto a cualquier cuadro funciona aunque el
 *   servidor no soporte descargas parciales (Range).
 * - Los saltos (seeks) nunca se pisan: si llega uno nuevo mientras otro está en curso, se guarda
 *   solo el último y se ejecuta al terminar. Un error libera el bloqueo para que nunca se congele.
 * - Quién ve video y quién ve imagen fija se decide en vivo (rotar, cambiar tamaño o activar
 *   movimiento reducido re-evalúa). En celular solo hay video si existe una versión liviana vertical.
 */

/** Las cinco condiciones de imagen fija (celulares, tablets verticales, táctiles verticales,
 *  celulares horizontales y movimiento reducido). */
export const STATIC_GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
];
const REDUCE = '(prefers-reduced-motion: reduce)';

export interface ScrubSources { desktop: string; mobile?: string }

/** Qué fuente corresponde ahora: null = imagen fija. */
export function pickSource(src: ScrubSources): string | null {
  if (matchMedia(REDUCE).matches) return null;
  const small = STATIC_GATES.some((q) => matchMedia(q).matches);
  if (!small) return src.desktop;
  return src.mobile ?? null;
}

/** Llama a `fn` cada vez que cambia alguna condición (rotación, tamaño, movimiento reducido). */
export function onGateChange(fn: () => void) {
  const lists = [...STATIC_GATES, REDUCE].map((q) => matchMedia(q));
  lists.forEach((m) => m.addEventListener('change', fn));
  return lists; // se mantienen referenciadas a propósito
}

export interface Scrub {
  /** fracción 0..1 del video */
  seek(frac: number): void;
  readonly ready: boolean;
}

/**
 * Prepara el video: descarga la fuente como Blob y avisa cuando hay cuadros para mostrar.
 * `onReady` recibe el control; `onFail` deja la imagen fija (la página queda completa igual).
 */
export function loadScrub(video: HTMLVideoElement, url: string, onReady: (s: Scrub) => void, onFail: () => void) {
  let busy = false;
  let pending: number | null = null;
  let ready = false;

  const go = (t: number) => {
    if (!ready || !video.duration) return;
    const tt = Math.max(0, Math.min(video.duration - 0.05, t));
    if (busy) { pending = tt; return; }
    if (Math.abs(video.currentTime - tt) < 0.008) return;
    busy = true;
    video.currentTime = tt;
  };
  video.addEventListener('seeked', () => {
    busy = false;
    if (pending !== null) { const t = pending; pending = null; go(t); }
  });
  video.addEventListener('error', () => { busy = false; pending = null; if (!ready) onFail(); });

  const ctrl: Scrub = {
    seek: (frac) => go(frac * (video.duration || 0)),
    get ready() { return ready; },
  };

  (async () => {
    try {
      const ac = new AbortController();
      const watchdog = setTimeout(() => ac.abort(), 25000); // sin progreso en 25 s: imagen fija
      const res = await fetch(url, { signal: ac.signal, priority: 'low' } as RequestInit);
      if (!res.ok) throw new Error(`video ${res.status}`);
      const blob = await res.blob();
      clearTimeout(watchdog);
      video.src = URL.createObjectURL(blob);
      video.addEventListener('loadeddata', () => { ready = true; onReady(ctrl); }, { once: true });
      video.load();
    } catch {
      onFail();
    }
  })();

  return ctrl;
}
