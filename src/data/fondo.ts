/**
 * Fondo de mar del sitio (generado con Higgsfield a partir del fondo de agua de la marca y ajustado
 * a Marino, Corriente y Perla). Versiones fijas en public/fondo/: cargan al instante también en las
 * páginas que se arman en el servidor (blog, comunidad) y el navegador las reutiliza en todo el sitio.
 * Para regenerarlas desde src/assets/img/mar-fondo*.jpg: node scripts/fondo-estatico.mjs (ver docs/continuar-en-otra-sesion.md).
 */
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/fondo/${name}-${w}.${ext} ${w}w`).join(', ');

export const FONDO = {
  desktopAvif: set('mar', [1280, 1920], 'avif'),
  desktopWebp: set('mar', [1280, 1920], 'webp'),
  mobileAvif: set('mar-movil', [640, 900, 1152], 'avif'),
  mobileWebp: set('mar-movil', [640, 900, 1152], 'webp'),
  fallback: '/fondo/mar-1920.webp',
  /** el mismo video de la portada: avanza con el scroll en computador (en celular, imagen fija) */
  video: '/videos/mar-portada.mp4',
} as const;
