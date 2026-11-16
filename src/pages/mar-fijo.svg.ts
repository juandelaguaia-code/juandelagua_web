// Patrón del fondo del sitio: filas de olas con franjas paralelas (como el fondo de agua de la marca),
// en líneas muy suaves. Se genera al construir y el navegador lo guarda en caché para todas las páginas.
import type { APIRoute } from 'astro';
import { crest, PERIOD } from '../lib/waves';

export const GET: APIRoute = () => {
  const rows = [56, 168, 280, 392];
  const paths = rows
    .map((y, i) => {
      const shape = { seed: 300 + i * 17, humps: 2 + (i % 2), base: y, amp: 13 + (i % 3) * 3 };
      return [0, 8, 16, 24]
        .map((dy, j) => `<path d="${crest(shape, dy, 1)}" stroke-opacity="${(0.1 - j * 0.022).toFixed(3)}"/>`)
        .join('');
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PERIOD}" height="448" viewBox="0 0 ${PERIOD} 448"><g fill="none" stroke="#0e2a43" stroke-width="1.1" stroke-linecap="round">${paths}</g></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=31536000' } });
};
