// Subida de imágenes a Supabase Storage con validación de tipo y tamaño en el servidor.
import type { SupabaseClient } from '@supabase/supabase-js';

const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export async function uploadImage(
  supabase: SupabaseClient,
  file: FormDataEntryValue | null,
  opts: { bucket: 'avatars' | 'media'; folder: string; maxBytes: number; allowGif?: boolean },
): Promise<{ url: string } | { error: 'archivo' } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext || (ext === 'gif' && !opts.allowGif) || file.size > opts.maxBytes) return { error: 'archivo' };
  // Verifica la firma del archivo (no solo el tipo declarado)
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpg = head[0] === 0xff && head[1] === 0xd8;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isGif = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
  const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!({ jpg: isJpg, png: isPng, gif: isGif, webp: isWebp } as Record<string, boolean>)[ext]) return { error: 'archivo' };

  const path = `${opts.folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from(opts.bucket).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) return { error: 'archivo' };
  return { url: supabase.storage.from(opts.bucket).getPublicUrl(path).data.publicUrl };
}
