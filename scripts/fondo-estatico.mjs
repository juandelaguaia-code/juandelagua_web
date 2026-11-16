// Genera las versiones fijas del fondo de mar (AVIF y WebP) en public/fondo/ a partir de
// src/assets/img/mar-fondo.jpg (horizontal) y mar-fondo-movil.jpg (vertical).
// Son archivos fijos para que carguen al instante también en las páginas que arma el servidor
// (blog, comunidad) y para que el navegador los reutilice en todo el sitio. Ver src/data/fondo.ts.
//
// Uso: node scripts/fondo-estatico.mjs
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}public/fondo`;
mkdirSync(out, { recursive: true });

const jobs = [
  [`${root}src/assets/img/mar-fondo.jpg`, 'mar', [1280, 1920]],
  [`${root}src/assets/img/mar-fondo-movil.jpg`, 'mar-movil', [640, 900, 1152]],
];
for (const [src, name, widths] of jobs) {
  for (const w of widths) {
    await sharp(src).resize({ width: w }).avif({ quality: 60, effort: 6 }).toFile(`${out}/${name}-${w}.avif`);
    await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(`${out}/${name}-${w}.webp`);
  }
}
console.log('public/fondo listo');
