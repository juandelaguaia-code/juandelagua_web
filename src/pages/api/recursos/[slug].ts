// Descarga de un recurso gratis: valida la cuenta en la base (resource_access) y entrega un link firmado por 5 minutos.
import type { APIRoute } from 'astro';
import { withMsg } from '../../../lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, redirect }) => {
  const slug = (params.slug ?? '').toLowerCase();
  const page = `/comunidad/recursos/${slug}`;
  const { supabase, user } = locals;
  if (!supabase || !user) return redirect(`/registro?next=${encodeURIComponent(page)}`);
  const { data, error } = await supabase.rpc('resource_access', { p_slug: slug });
  if (error) return redirect(withMsg(page, 'error', error.message.includes('email_not_verified') ? 'correo_no_verificado' : 'permiso'));
  const row = (data as { file_path: string | null; file_name: string | null; external_url: string | null }[])[0];
  if (row?.external_url) return redirect(row.external_url);
  if (row?.file_path) {
    const { data: signed } = await supabase.storage.from('recursos').createSignedUrl(row.file_path, 300, { download: row.file_name ?? true });
    if (signed?.signedUrl) return redirect(signed.signedUrl);
  }
  return redirect(withMsg(page, 'error', 'desconocido'));
};
