/**
 * Líneas de "Calma el mar" (MarCalmo.astro).
 * k = 0: mar enredado (cada línea con su propia frecuencia, cruzándose).
 * k = 1: corriente tranquila (todas paralelas, con un mismo oleaje suave).
 * Todas las frecuencias son enteras en un período de W: el SVG (2 períodos) se desplaza en bucle sin costura.
 */

export const W = 1200;
export const H = 600;
export const LINES = 12;
const STEP = 24;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** `step`: el estado tranquilo (curvas suaves) se ve igual con menos puntos; el enredado necesita más. */
export function calmPath(i: number, k: number, step = STEP): string {
  const e = ease(Math.min(1, Math.max(0, k)));
  const baseC = 60 + i * 44;
  // la corriente tranquila pasa bajo la frase, a la altura del botón (no detrás del texto)
  const baseS = H * 0.66 - ((LINES - 1) * 13) / 2 + i * 13;
  const base = baseC + (baseS - baseC) * e;
  const aC = (24 + (i % 4) * 12) * (1 - e);
  const fC = 2 + (i % 3);
  const phC = i * 1.7;
  const aS = 30 * e;
  let d = '';
  // un período: el segundo lo dibuja un <use> en MarCalmo.astro
  for (let x = 0; x <= W; x += step) {
    const u = (x / W) * Math.PI * 2;
    const y = base + aC * Math.sin(fC * u + phC) + aC * 0.35 * Math.sin((fC + 2) * u - phC) + aS * Math.sin(u + 0.6 + i * 0.06);
    d += `${x ? 'L' : 'M'}${x} ${Math.round(y)}`;
  }
  return d;
}
