/**
 * Video que avanza y retrocede con el scroll (estándar de la skill 10k-websites).
 *
 * - Pantallas horizontales (computador, notebook, celular girado): versión 16:9.
 *   Pantallas verticales (celular, tablet vertical): versión vertical liviana, si el componente la tiene.
 * - Imagen fija con movimiento reducido, con "ahorro de datos" activado o con conexión 2G.
 * - El video se descarga completo como Blob: así el salto a cualquier cuadro funciona aunque el
 *   servidor no soporte descargas parciales (Range).
 * - Los saltos (seeks) nunca se pisan: si llega uno nuevo mientras otro está en curso, se guarda
 *   solo el último y se ejecuta al terminar. Un error libera el bloqueo para que nunca se congele.
 * - Quién ve qué se decide en vivo: rotar, cambiar el tamaño, activar movimiento reducido o el
 *   ahorro de datos re-evalúa (y la carga anterior se cancela y se libera de la memoria).
 */

/** Pantallas verticales: usan la versión vertical del video. */
export const PORTRAIT_GATES = [
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
];
/** La misma condición, lista para un atributo `media` (p. ej. el <source> de la imagen vertical). */
export const PORTRAIT_MEDIA = PORTRAIT_GATES.join(', ');
const REDUCE = '(prefers-reduced-motion: reduce)';

type Conn = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, f: () => void) => void };
const conn = (): Conn | undefined => (navigator as Navigator & { connection?: Conn }).connection;
/** Ahorro de datos o conexión 2G: imagen fija (la página queda completa igual). */
const lite = () => {
  const c = conn();
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
};

export interface ScrubSources { desktop: string; mobile?: string }

export const isPortrait = () => PORTRAIT_GATES.some((q) => matchMedia(q).matches);

/** Qué fuente corresponde ahora: null = imagen fija. */
export function pickSource(src: ScrubSources): string | null {
  if (matchMedia(REDUCE).matches || lite()) return null;
  return isPortrait() ? src.mobile ?? null : src.desktop;
}

/** Llama a `fn` cada vez que cambia alguna condición (rotación, tamaño, movimiento reducido, datos). */
export function onGateChange(fn: () => void) {
  const lists = [...PORTRAIT_GATES, REDUCE].map((q) => matchMedia(q));
  lists.forEach((m) => m.addEventListener('change', fn));
  conn()?.addEventListener?.('change', fn);
  return lists; // se mantienen referenciadas a propósito
}

export interface Scrub {
  /** fracción 0..1 del video */
  seek(frac: number): void;
  readonly ready: boolean;
}

/** Carga en curso de cada video: al pedir otra fuente (p. ej. al girar el celular) la anterior se cancela. */
const active = new WeakMap<HTMLVideoElement, () => void>();

/**
 * Prepara el video: descarga la fuente como Blob y avisa cuando hay cuadros para mostrar.
 * `onReady` recibe el control; `onFail` deja la imagen fija (la página queda completa igual).
 */
export function loadScrub(video: HTMLVideoElement, url: string, onReady: (s: Scrub) => void, onFail: () => void) {
  active.get(video)?.();
  let busy = false;
  let pending: number | null = null;
  let ready = false;
  let dead = false;
  let objectUrl = '';
  const ac = new AbortController();

  const go = (t: number) => {
    if (dead || !ready || !video.duration) return;
    const tt = Math.max(0, Math.min(video.duration - 0.05, t));
    if (busy) { pending = tt; return; }
    if (Math.abs(video.currentTime - tt) < 0.008) return;
    busy = true;
    video.currentTime = tt;
  };
  const ctrl: Scrub = {
    seek: (frac) => go(frac * (video.duration || 0)),
    get ready() { return ready; },
  };
  const markReady = () => {
    if (dead || ready) return;
    ready = true;
    onReady(ctrl);
  };
  const onSeeked = () => {
    busy = false;
    // Safari en iPhone a veces entrega el primer cuadro recién con el primer salto
    if (!ready && video.readyState >= 2) markReady();
    if (pending !== null) { const t = pending; pending = null; go(t); }
  };
  const onMeta = () => {
    if (ready || busy) return;
    busy = true;
    video.currentTime = 0.001; // pide el primer cuadro sin reproducir
  };
  const onError = () => { busy = false; pending = null; if (!ready && !dead) onFail(); };
  video.addEventListener('seeked', onSeeked);
  video.addEventListener('loadeddata', markReady);
  video.addEventListener('loadedmetadata', onMeta);
  video.addEventListener('error', onError);

  active.set(video, () => {
    dead = true;
    ac.abort();
    video.removeEventListener('seeked', onSeeked);
    video.removeEventListener('loadeddata', markReady);
    video.removeEventListener('loadedmetadata', onMeta);
    video.removeEventListener('error', onError);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });

  (async () => {
    try {
      const watchdog = setTimeout(() => ac.abort(), 25000); // sin respuesta en 25 s: imagen fija
      const res = await fetch(url, { signal: ac.signal, priority: 'low' } as RequestInit);
      if (!res.ok) throw new Error(`video ${res.status}`);
      const blob = await res.blob();
      clearTimeout(watchdog);
      if (dead) return;
      objectUrl = URL.createObjectURL(blob);
      video.preload = 'auto';
      video.src = objectUrl;
      video.load();
      // Último recurso para algunos iPhone: un play y pausa en silencio destraba el primer cuadro.
      setTimeout(() => {
        if (!ready && !dead) video.play().then(() => video.pause()).catch(() => {});
      }, 2500);
    } catch {
      if (!dead) onFail();
    }
  })();

  return ctrl;
}
