/**
 * IndexNow: avisa a Bing (y demás buscadores de IndexNow) que el sitio se actualizó.
 *
 * Corre al arrancar el contenedor en producción (ver Dockerfile), en segundo plano:
 * 1. Espera a que el dominio público sirva ESTA versión (compara la portada en vivo con dist/).
 *    Así no avisa mientras el contenedor anterior sigue respondiendo.
 * 2. Envía todas las URLs del sitemap a api.indexnow.org.
 *
 * La clave es el archivo public/<32 hex>.txt (Bing lo descarga para verificar el dominio).
 * Si algo falla, solo lo registra en el log: nunca detiene la web.
 */
import { readFileSync, readdirSync } from 'node:fs';

const SITE = 'https://juandelagua.com';
const HOST = new URL(SITE).host;
const CLIENT = new URL('../dist/client/', import.meta.url);
const WAIT_MS = 10 * 60 * 1000; // máximo 10 minutos esperando que el deploy quede en línea
const POLL_MS = 15 * 1000;

const log = (msg) => console.log(`[indexnow] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const keyFile = readdirSync(CLIENT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!keyFile) return log('no hay archivo de clave en dist/client; se omite');
  const key = keyFile.slice(0, -4);

  const sitemap = readFileSync(new URL('sitemap-0.xml', CLIENT), 'utf8');
  const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (!urlList.length) return log('el sitemap no tiene URLs; se omite');

  // 1. Esperar a que la portada en vivo sea idéntica a la de este build
  const local = readFileSync(new URL('index.html', CLIENT), 'utf8');
  const deadline = Date.now() + WAIT_MS;
  let live = false;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${SITE}/?indexnow=${Date.now()}`, { cache: 'no-store' });
      if (res.ok && (await res.text()) === local) { live = true; break; }
    } catch { /* el dominio aún no responde: reintentar */ }
    await sleep(POLL_MS);
  }
  if (!live) return log('la versión nueva no apareció en línea a tiempo; no se avisa');

  // 2. Avisar a IndexNow
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
  });
  // 200 = recibido, 202 = recibido y la clave se validará después
  log(`${urlList.length} URLs enviadas → HTTP ${res.status}`);
}

main().catch((error) => log(`error: ${error instanceof Error ? error.message : error}`));
