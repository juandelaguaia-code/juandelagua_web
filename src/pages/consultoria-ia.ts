// La página se movió a /consultor-ia. Redirección permanente (301) para conservar
// el posicionamiento y los enlaces antiguos. Corre en el servidor Node (no se pre-genera).
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(null, { status: 301, headers: { Location: '/consultor-ia' } });
