-- Datos iniciales de ejemplo (correr una vez después de las migraciones, desde el SQL Editor de Supabase
-- o con `supabase db reset` en local). Las categorías, niveles y ajustes ya vienen en las migraciones.

-- Curso de bienvenida (abierto)
insert into public.courses (slug, title, description, access, position, published)
values ('bienvenida', 'Bienvenida a la comunidad', 'Cómo funciona la comunidad, cómo sumar puntos y por dónde partir.', 'open', 0, true)
on conflict (slug) do nothing;

insert into public.modules (course_id, title, position)
select id, 'Primeros pasos', 0 from public.courses where slug = 'bienvenida'
and not exists (select 1 from public.modules m join public.courses c on c.id = m.course_id where c.slug = 'bienvenida');

insert into public.lessons (module_id, slug, title, body_md, position, published)
select m.id, v.slug, v.title, v.body, v.pos, true
from public.modules m join public.courses c on c.id = m.course_id and c.slug = 'bienvenida',
(values
  ('como-funciona', 'Cómo funciona la comunidad', 'Aquí preguntas, compartes tu avance y aprendes con el proceso real.

1. **Completa tu perfil** con foto y una bio corta.
2. **Preséntate** en la categoría Presentaciones.
3. **Pregunta sin miedo**: la respuesta llega en el día.', 0),
  ('puntos-y-niveles', 'Puntos y niveles', 'Cada me gusta que recibes en una publicación o comentario suma **1 punto**. Con los puntos subes de nivel (de Gota a Mar abierto) y desbloqueas cursos.', 1)
) as v(slug, title, body, pos)
on conflict (module_id, slug) do nothing;

-- Curso que se desbloquea en el nivel 2
insert into public.courses (slug, title, description, access, unlock_level, position, published)
values ('claude-en-1-hora', 'Claude en 1 hora', 'Grabaciones de los talleres mensuales. Se desbloquea en el nivel 2 (Arroyo).', 'level', 2, 1, true)
on conflict (slug) do nothing;

-- Taller mensual (primer lunes de diciembre 2026, 19:00 hora de Chile = 22:00 UTC en horario de verano)
insert into public.events (title, description_md, starts_at, ends_at, recurrence_rule)
select 'Taller mensual: Claude en 1 hora', 'Un caso real de principio a fin, en vivo y con pantalla compartida. Trae tus preguntas.',
       '2026-12-07 22:00:00+00', '2026-12-07 23:00:00+00', 'FREQ=MONTHLY'
where not exists (select 1 from public.events where title = 'Taller mensual: Claude en 1 hora');

-- Artículo de bienvenida como borrador (publícalo desde /admin/blog)
insert into public.blog_posts (slug, title, excerpt, body_md, category_id, series, status)
select 'creando-mi-marca-capitulo-1', 'Creando mi marca: capítulo 1', 'Por qué decidí mostrar el proceso completo, con errores incluidos.',
       'Este es el primer capítulo de la serie **Creando mi marca**. Aquí voy a contar, con números y pantallas reales, cómo construyo Juan del Agua.',
       (select id from public.blog_categories where slug = 'creando-mi-marca'), 'creando-mi-marca', 'draft'
where not exists (select 1 from public.blog_posts where slug = 'creando-mi-marca-capitulo-1');
