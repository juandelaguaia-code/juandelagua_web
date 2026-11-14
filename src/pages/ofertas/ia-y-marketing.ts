// /ofertas/ia-y-marketing se dividió en /ofertas/ia y /ofertas/marketing.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => new Response(null, { status: 301, headers: { Location: '/ofertas/ia' } });
