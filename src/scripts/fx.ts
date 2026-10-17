/**
 * Animaciones ligadas al scroll ("como agua").
 *
 * Cada elemento con [data-fx] recibe la variable CSS --p (0 → 1) según cuánto ha
 * entrado en pantalla; el CSS decide qué hacer con ella (emerger, llenarse, dibujar
 * una línea...). Así la página se "anima como video" al hacer scroll, en cualquier
 * navegador, sin librerías. [data-fx-exit] recibe --x (0 → 1) mientras sale por arriba.
 * La raíz recibe --scroll (progreso total de la página).
 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Tracked { el: HTMLElement; range: number; offset: number; delay: number; once: boolean; max: number }

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
}));
const exit = [...document.querySelectorAll<HTMLElement>('[data-fx-exit]')];

let ticking = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  for (const t of enter) {
    const r = t.el.getBoundingClientRect();
    // 0 cuando el borde superior toca el fondo de la pantalla, 1 tras recorrer `range` de pantalla
    let p = clamp((vh * (1 - t.offset) - r.top) / (vh * t.range) - t.delay);
    if (t.once) p = t.max = Math.max(t.max, p);
    t.el.style.setProperty('--p', p.toFixed(3));
  }
  for (const el of exit) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', clamp(-r.top / Math.max(r.height, 1)).toFixed(3));
  }
  const max = root.scrollHeight - vh;
  root.style.setProperty('--scroll', (max > 0 ? window.scrollY / max : 0).toFixed(4));
}

function request() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

if (reduce) {
  // Sin movimiento: todo visible desde el inicio.
  enter.forEach((t) => t.el.style.setProperty('--p', '1'));
} else {
  root.classList.add('fx');
  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
}
