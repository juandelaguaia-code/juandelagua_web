/**
 * Exportaciones CSV del panel (solo admin+; la base valida el rol en admin_member_export / admin_resource_downloads).
 *   /api/comunidad/exportar?que=miembros
 *   /api/comunidad/exportar?que=recurso&id=3
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // Evita fórmulas al abrir en Excel/Sheets
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return 'sin datos\n';
  const cols = Object.keys(rows[0]);
  return `﻿${cols.join(',')}\n${rows.map((r) => cols.map((c) => cell(r[c])).join(',')).join('\n')}\n`;
};

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const { supabase, profile } = locals;
  if (!supabase || !profile) return redirect('/entrar');
  const que = url.searchParams.get('que');
  let rows: Record<string, unknown>[] = [];
  let name = 'export';
  if (que === 'miembros') {
    const { data, error } = await supabase.rpc('admin_member_export');
    if (error) return new Response('Sin permiso', { status: 403 });
    rows = data ?? [];
    name = 'miembros';
  } else if (que === 'recurso') {
    const id = Number(url.searchParams.get('id'));
    const { data, error } = await supabase.rpc('admin_resource_downloads', { p_resource: id });
    if (error) return new Response('Sin permiso', { status: 403 });
    rows = data ?? [];
    name = `descargas-recurso-${id}`;
  } else return new Response('No encontrado', { status: 404 });
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
