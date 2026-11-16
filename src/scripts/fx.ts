/**
 * Animaciones ligadas al scroll ("como agua").
 *
 * Cada elemento con [data-fx] recibe la variable CSS --p (0 → 1) según cuánto ha
 * entrado en pantalla; el CSS decide qué hacer con ella (emerger, llenarse, dibujar
 * una línea...). Así la página se "anima como video" al hacer scroll, en cualquier
 * navegador, sin librerías. [data-fx-exit] recibe --x (0 → 1) mientras sale por arriba.
 * La raíz recibe --scroll (progreso total de la página).
 *
 * Liviano a propósito: solo se miden los elementos cerca de la pantalla, lo que ya emergió
 * deja de medirse, cada variable se escribe solo si cambió, las olas se detienen fuera de
 * pantalla y todo se pausa cuando la pestaña no está visible.
 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Tracked { el: HTMLElement; range: number; offset: number; delay: number; once: boolean; max: number; last: string }

// [data-reveal] = bloques que "emergen del agua"; un --d:120ms en línea los escalona.
const enter: Tracked[] = [...document.querySelectorAll<HTMLElement>('[data-fx], [data-reveal]')].map((el) => ({
  el,
  // fracción de la pantalla que tarda en completarse (data-fx-range="0.5")
  range: Number(el.dataset.fxRange) || (el.hasAttribute('data-reveal') ? 0.26 : 0.45),
  offset: Number(el.dataset.fxOffset) || 0.02,
  delay: (parseFloat(el.style.getPropertyValue('--d')) || 0) / 2000,
  // Lo que ya emergió se queda visible; los efectos [data-fx] sí retroceden con el scroll.
  once: el.hasAttribute('data-reveal'),
  max: 0,
  last: '',
}));
const exit = [...document.querySelectorAll<HTMLElement>('[data-fx-exit]')];
const active = new Set<Tracked>();
const byEl = new Map<Element, Tracked>(enter.map((t) => [t.el, t]));

let ticking = false;
let lastScroll = '';

function measure(t: Tracked, vh: number) {
  const r = t.el.getBoundingClientRect();
  // 0 cuando el borde superior toca el fondo de la pantalla, 1 tras recorrer `range` de pantalla
  let p = clamp((vh * (1 - t.offset) - r.top) / (vh * t.range) - t.delay);
  if (t.once) p = t.max = Math.max(t.max, p);
  const s = p.toFixed(3);
  if (s !== t.last) { t.last = s; t.el.style.setProperty('--p', s); }
  return p;
}

function update() {
  ticking = false;
  const vh = window.innerHeight;
  for (const t of active) {
    if (measure(t, vh) >= 1 && t.once) { active.delete(t); near?.unobserve(t.el); }
  }
  for (const el of exit) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', clamp(-r.top / Math.max(r.height, 1)).toFixed(3));
  }
  const max = root.scrollHeight - vh;
  const sc = (max > 0 ? window.scrollY / max : 0).toFixed(3);
  if (sc !== lastScroll) { lastScroll = sc; root.style.setProperty('--scroll', sc); }
}

function request() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

let near: IntersectionObserver | null = null;

if (reduce) {
  // Sin movimiento: todo visible desde el inicio.
  enter.forEach((t) => t.el.style.setProperty('--p', '1'));
} else {
  // Primera medición de todo, en el mismo cuadro en que se activa .fx: nada parpadea al cargar.
  const vh = window.innerHeight;
  root.classList.add('fx');
  for (const t of enter) if (!(t.once && measure(t, vh) >= 1)) active.add(t);
  update();

  // Después solo se mide lo que está cerca de la pantalla.
  if ('IntersectionObserver' in window) {
    active.clear();
    near = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const t = byEl.get(e.target);
        if (!t) continue;
        if (e.isIntersecting) active.add(t);
        else { measure(t, window.innerHeight); active.delete(t); }
      }
      request();
    }, { rootMargin: '25% 0px 25% 0px' });
    for (const t of enter) if (!(t.once && t.max >= 1)) near.observe(t.el);
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);

  // [data-rise]: el texto emerge palabra por palabra al entrar en pantalla (una sola vez).
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }),
    { rootMargin: '0px 0px -20% 0px', threshold: 0.2 },
  );
  document.querySelectorAll('[data-rise]').forEach((el) => io.observe(el));

  // Olas: se mueven solo cuando están cerca de la pantalla.
  if ('IntersectionObserver' in window) {
    const waves = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)),
      { rootMargin: '160px 0px' },
    );
    document.querySelectorAll('[data-wave]').forEach((el) => waves.observe(el));
  }
}

// Pestaña oculta: se pausa todo lo que se mueve.
document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
