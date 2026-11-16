/**
 * Olas vectoriales que se repiten sin costura.
 *
 * Cada ola es una secuencia de crestas y valles de ancho y alto irregulares (con semilla,
 * así sale igual en cada build) unida con curvas suaves. El SVG trae 3 períodos: la capa
 * se desplaza exactamente un período en bucle y nunca se ve el corte.
 */

export const PERIOD = 960;
export const PERIODS = 3;

export interface WaveShape {
  seed: number;
  /** crestas por período */
  humps: number;
  /** altura media de la línea de agua (en unidades del viewBox) */
  base: number;
  /** amplitud media */
  amp: number;
  /** 0..1, cuánto varían anchos y alturas entre crestas */
  irregular?: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function points(o: WaveShape): [number, number][] {
  const r = rng(o.seed * 7919 + 13);
  const n = o.humps * 2;
  const irr = o.irregular ?? 0.4;
  const widths = Array.from({ length: n }, () => 1 + (r() - 0.5) * irr);
  const total = widths.reduce((a, b) => a + b, 0);
  const out: [number, number][] = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const crest = i % 2 === 0;
    const a = o.amp * (1 + (r() - 0.5) * 2 * irr);
    // crestas redondas y valles más cortos: se parece más al mar que una sinusoide pareja
    out.push([x, crest ? o.base - a : o.base + a * 0.55]);
    x += (widths[i] / total) * PERIOD;
  }
  return out;
}

// Enteros: con viewBox de 960 por período sobra precisión y el HTML pesa la mitad.
const f = (v: number) => Math.round(v);

/** Trazo de la cresta a lo largo de `periods` períodos. `dy` baja la línea (para las franjas). */
export function crest(o: WaveShape, dy = 0, periods = PERIODS): string {
  const base = points(o);
  const n = base.length;
  const pts: [number, number][] = [];
  for (let k = -1; k <= periods * n + 1; k++) {
    const i = ((k % n) + n) % n;
    const per = Math.floor(k / n);
    pts.push([base[i][0] + per * PERIOD, base[i][1] + dy]);
  }
  let d = `M${f(pts[1][0])} ${f(pts[1][1])}`;
  const t = 1 / 6;
  for (let k = 1; k <= periods * n; k++) {
    const [p0, p1, p2, p3] = [pts[k - 1], pts[k], pts[k + 1], pts[k + 2]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t)} ${f(p1[1] + (p2[1] - p0[1]) * t)} ${f(p2[0] - (p3[0] - p1[0]) * t)} ${f(p2[1] - (p3[1] - p1[1]) * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/**
 * Banda rellena: cresta y todo lo de abajo hasta el borde inferior del viewBox.
 * Se pasa 2 unidades del borde derecho para que las copias contiguas (<use>) se solapen y no
 * quede una línea fina entre período y período.
 */
export function band(o: WaveShape, height: number, periods = PERIODS): string {
  return `${crest(o, 0, periods)}h2V${height}H0Z`;
}
