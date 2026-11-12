/**
 * Markdown → HTML seguro. Sin HTML arbitrario: se sanitiza todo lo que sale de marked.
 * Links externos con rel="nofollow ugc noopener" (contenido de usuarios) o "noopener" (contenido propio).
 * @menciones → enlace al perfil.
 */
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { SITE } from '../data/site';

const marked = new Marked({ gfm: true, breaks: true });

const SITE_HOST = new URL(SITE.url).host;

export function renderMarkdown(md: string, opts: { ugc?: boolean; mentions?: boolean } = {}) {
  const { ugc = true, mentions = true } = opts;
  let src = md ?? '';
  if (mentions) src = src.replace(/(^|[^\w@/])@([a-zA-Z0-9_]{3,30})\b/g, '$1[@$2](/comunidad/u/$2)');
  const raw = marked.parse(src, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'strong', 'em', 'del', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title', 'rel', 'target'], img: ['src', 'alt', 'title', 'loading'], code: ['class'], th: ['align'], td: ['align'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    transformTags: {
      // Títulos de usuario no compiten con el h1/h2 de la página
      h1: 'h2',
      a: (tag, attribs) => {
        const href = attribs.href ?? '';
        let external = false;
        try { external = /^https?:/i.test(href) && new URL(href).host !== SITE_HOST; } catch { external = false; }
        return {
          tagName: 'a',
          attribs: external
            ? { href, rel: ugc ? 'nofollow ugc noopener' : 'noopener', target: '_blank' }
            : { href },
        };
      },
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
    },
  });
}

/** Texto plano (para resúmenes y meta description) */
export const plainText = (md: string, max = 160) => {
  const t = sanitizeHtml(marked.parse(md ?? '', { async: false }) as string, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/** Embebe videos de YouTube, Vimeo o Loom a partir de su URL (o null) */
export function videoEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.searchParams.get('v')!)}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.split('/')[2])}`;
    if (u.hostname.includes('vimeo.com')) { const id = u.pathname.split('/').filter(Boolean).pop(); if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`; }
    if (u.hostname.includes('loom.com') && u.pathname.startsWith('/share/')) return `https://www.loom.com/embed/${encodeURIComponent(u.pathname.split('/')[2])}`;
  } catch { /* URL inválida */ }
  return null;
}
