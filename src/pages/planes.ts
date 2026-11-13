// /planes pasó a /ofertas (con subpáginas). Redirección permanente para conservar enlaces y posicionamiento.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => new Response(null, { status: 301, headers: { Location: '/ofertas' } });
