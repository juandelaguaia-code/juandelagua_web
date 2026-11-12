/**
 * Convierte una cuenta ya registrada en owner (dueño) de la comunidad. Nunca se hace desde la interfaz pública.
 *
 * Uso (con las variables de .env cargadas):
 *   node --env-file=.env scripts/crear-owner.mjs tu-correo@ejemplo.com
 *
 * Requisitos: haberse registrado antes en /registro y confirmado el correo.
 * Solo puede haber un owner (índice único en la base de datos).
 */
const email = process.argv[2]?.toLowerCase();
const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) {
  console.error('Uso: node --env-file=.env scripts/crear-owner.mjs correo@ejemplo.com (requiere PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

let user = null;
for (let page = 1; page <= 20 && !user; page++) {
  const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
  const { users = [] } = await res.json();
  user = users.find((u) => u.email?.toLowerCase() === email);
  if (users.length < 200) break;
}
if (!user) { console.error('No existe una cuenta con ese correo. Regístrate primero en /registro.'); process.exit(1); }

const res = await fetch(`${url}/rest/v1/profiles?id=eq.${user.id}`, {
  method: 'PATCH',
  headers: { ...headers, Prefer: 'return=representation' },
  body: JSON.stringify({ role: 'owner', status: 'active', membership: 'comp' }),
});
if (!res.ok) { console.error('No se pudo actualizar:', res.status, await res.text()); process.exit(1); }
const [p] = await res.json();
console.log(`Listo: @${p.username} ahora es owner y está activo.`);
