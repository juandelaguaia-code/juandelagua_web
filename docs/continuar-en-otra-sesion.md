# Continuar el rediseño en otra sesión

Documento de traspaso: qué está hecho, dónde está cada cosa, las reglas que no se cambian y los pasos exactos para cambiar los videos. Al final están los prompts de Higgsfield que se usaron para la gran ola.

## 1. Prompt para pegar en una sesión nueva

Copia esto en una sesión nueva de Claude Code con este repositorio y agrega al final lo que quieras cambiar. Si traes videos o imágenes nuevos de Higgsfield, adjúntalos en el mismo mensaje.

```
Hola. Vas a continuar el rediseño de juandelagua.com (este repositorio, Astro). Antes de tocar nada, lee docs/continuar-en-otra-sesion.md y docs/paquete-diseno-home.md: ahí está lo hecho, el mapa de archivos, las reglas y los pasos exactos para procesar videos e imágenes nuevos.

Contexto corto:
- Soy Juan del Agua, consultor de IA y marketing para pymes en Chile. El sitio usa un mar generado con Higgsfield en los colores de mi marca (Marino, Corriente y Perla), viene en modo oscuro por defecto y el mar y la gran ola avanzan solo al hacer scroll, en computador y en celular.
- No gastes créditos de Higgsfield: mis generaciones ilimitadas no funcionan desde Claude Code. Yo genero los archivos en el chat de Claude y te los subo.
- Trabaja en tu rama, prueba en computador, notebook y celular (sección "Pruebas" del documento) y pregúntame antes de publicar en main (EasyPanel publica main automáticamente).

Lo que quiero ahora: [escribe aquí el cambio]
```

## 2. Estado actual (16 de noviembre de 2026)

- **Home "Emerges del mar":** al abrir, "Juan del Agua" en grande sobre el mar. Al bajar, Juan sube desde detrás de las olas del frente hasta el centro (se ven los brazos cruzados) y aparece la propuesta con el botón del diagnóstico. El mar de fondo es un video que avanza y retrocede con el scroll.
- **Frase central (gran ola versión 2):** la ola se curva, rompe y el mar queda en calma mientras aparecen "Menos trabajo manual", "Marketing con resultados" y "Recupera tiempo para vivir mejor". En celular y tablet vertical hay una versión vertical que sigue a la ola mientras rompe, con el texto arriba, sobre el cielo.
- **Video también en celular:** la portada, la gran ola y el fondo de las páginas interiores avanzan con el scroll en el teléfono, con versiones verticales livianas (0,6 a 1 MB cada una) que se piden recién cuando la página terminó de cargar. Con ahorro de datos o conexión 2G se ven imágenes fijas. Con "reducir movimiento" activado en el teléfono también avanza con el scroll (lo mueve la persona al bajar).
- **Páginas interiores** (ofertas, blog, comunidad, contacto, consultor IA, agendar, casos, 404 y el resto que usa `PageHero`): el mar es el fondo de la página completa, de arriba hasta el pie, y avanza con el scroll de toda la página.
- **Modo oscuro por defecto**, con botón sol y luna para pasar a claro. En modo claro las secciones son opacas y el mar se ve en la portada de cada página (a propósito: el texto oscuro necesita fondo claro).
- **Notebooks:** con menos de 720 px de alto, el texto de la portada va debajo del mar. Entre 720 y 859 px el nombre se achica un poco más al llegar.
- **Caché del navegador** (`deploy/server.mjs`): `/_astro/*` un año (nombres con hash) y `/videos/*` y `/fondo/*` una semana. Por eso, **al reemplazar un video o una imagen de esas carpetas se le cambia el nombre** (por ejemplo `gran-ola-3.mp4`); si no, quien ya visitó el sitio seguiría viendo el anterior hasta una semana.
- **Seguridad (CSP):** `media-src 'self' blob:` es necesario para que el video avance con el scroll en las páginas que arma el servidor (blog, comunidad). Está en `src/middleware.ts`.

## 3. Mapa de archivos

| Qué | Dónde |
|---|---|
| Portada de la home | `src/components/HeroMar.astro` |
| Frase central sobre la gran ola | `src/components/Frase.astro` |
| Mar de página completa (páginas interiores) | `src/components/PageHero.astro` + reglas "Páginas interiores" al final de `src/styles/global.css` |
| Imagen del fondo de mar (todo el sitio) | `public/fondo/` (AVIF y WebP), `src/data/fondo.ts`, `src/components/FondoMar.astro` |
| Banda final con el mar | `src/components/CtaBand.astro` |
| Videos con scroll | `public/videos/mar-portada.mp4` y `mar-portada-movil.mp4`, `gran-ola-2.mp4` y `gran-ola-2-movil.mp4`; lógica en `src/scripts/scrub.ts` |
| Imágenes maestras | `src/assets/img/mar-fondo.jpg`, `mar-fondo-movil.jpg`, `olas-frente.png`, `gran-ola.jpg`, `gran-ola-movil.jpg`, `juan-agua.png` |
| Color de marca para material nuevo | `scripts/color-marca.py` |
| Regenerar `public/fondo/` | `node scripts/fondo-estatico.mjs` |
| Tema oscuro y claro | `src/styles/global.css`, `src/components/Header.astro`, `src/layouts/Base.astro` |
| Servidor de producción | `deploy/server.mjs` (compresión brotli y gzip, caché del navegador) |

## 4. Reglas que no se cambian

1. **Cero gasto en Higgsfield.** Las generaciones ilimitadas no se pueden usar desde Claude Code. Juan genera en el chat de Claude (o Cowork) y sube los archivos a la sesión.
2. **Publicar en main solo con el visto bueno de Juan.** EasyPanel despliega main solo; antes de eso se trabaja en la rama de la sesión.
3. **Sin olas hechas con código.** El agua es imagen o video generado.
4. **Nada se mueve solo:** el mar y la ola avanzan únicamente con el scroll. Solo se animan `transform` y `opacity`.
5. **Celular con video liviano:** versión vertical de cada video (cerca de 1 MB), pedida después de la carga. Como todo avanza solo con el scroll, funciona también con "reducir movimiento" activado (ahí las palabras aparecen sin desplazarse y el fondo no hace paralaje). Imagen fija solo con ahorro de datos o 2G.
6. **Textos:** cero guiones largos y cero palabras de relleno (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions, testament, landscape, delve, elevate).
7. **Contraste medido sobre el peor píxel:** 4,5:1 o más para texto normal; 3:1 para títulos grandes.

## 5. Cómo reemplazar la gran ola

Parte desde la raíz del repositorio. `NUEVO.mp4` (1280 × 720, 24 cuadros por segundo) y `NUEVA.png` (la imagen de inicio del video) son los archivos que subió Juan. Cambia el número de versión en los nombres (aquí `3`).

1. Color de marca (la versión 2 usa mezcla 0,5, que conserva el carácter del grabado):
   ```bash
   python3 scripts/color-marca.py lut /tmp/marca-50.cube 0.5
   ```
2. Video para computador: sin audio y con un cuadro clave cada 8 cuadros (así retroceder también es fluido). La versión 2 quedó en 3,5 MB:
   ```bash
   ffmpeg -y -i NUEVO.mp4 -vf "lut3d=file=/tmp/marca-50.cube:interp=tetrahedral" -c:v libx264 -crf 24 -preset slow -tune animation -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an public/videos/gran-ola-3.mp4
   ```
3. Video para celular: recorte vertical de 406 × 720 que sigue a la ola. `C` es el centro del recorte (fracción del ancho) en el tiempo: en la versión 2 parte en 0,60 (la cresta completa) y se mueve a 0,47 entre los 0,3 y los 3,6 segundos, siguiendo la rompiente. Mira los cuadros del video nuevo y ajusta esos números. Se trabaja al doble de tamaño para que el movimiento sea suave. La versión 2 quedó en 1 MB:
   ```bash
   C="(0.60-0.13*pow(clip((t-0.3)/3.3\,0\,1)\,2)*(3-2*clip((t-0.3)/3.3\,0\,1)))"
   ```
   ```bash
   ffmpeg -y -i NUEVO.mp4 -vf "lut3d=file=/tmp/marca-50.cube:interp=tetrahedral,scale=2560:1440:flags=lanczos,crop=812:1440:x='2560*$C-406':y=0,scale=406:720:flags=lanczos" -c:v libx264 -crf 25 -preset slow -tune animation -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an public/videos/gran-ola-3-movil.mp4
   ```
4. Imágenes fijas (se ven mientras carga el video y con movimiento reducido o ahorro de datos): `src/assets/img/gran-ola.jpg` es la imagen de inicio con color de marca, recortada al encuadre exacto del primer cuadro del video (en la versión 2, `x` de 12 a 1997 de 2000 px). `src/assets/img/gran-ola-movil.jpg` es el mismo recorte vertical que el primer cuadro del video para celular (centro 0,60). Para el color: `python3 scripts/color-marca.py imagen NUEVA.png salida.jpg 0.5`.
5. En `src/pages/index.astro` cambia los nombres de los dos videos.
6. Encuadre y sombra: en `src/components/Frase.astro`, `.ola-scrim` oscurece el lado del texto en computador y la parte de arriba en celular. Las líneas aparecen en los tramos `bands = [0.12, 0.42, 0.72]` del scroll (la ola sube, rompe y queda en calma).
7. Compila y prueba (sección 7). Mide el contraste de las tres líneas en varios momentos: al subir la ola, cuando rompe y al final.

Para el **mar de la portada** el proceso es igual con mezcla 0,8 (`marca-80.cube`) y `-crf 20`; su versión para celular es un recorte vertical fijo y centrado de 424 × 720 (`crop=424:720:(iw-424)/2:0`, `-crf 25`). Las **olas del frente** (PNG transparente) se pasan por `color-marca.py imagen … 0.8` y se recortan al alto de las olas (2000 × 388 px hoy), sin franja transparente de sobra arriba.

## 6. Cómo cambiar la imagen del mar

1. Reemplaza `src/assets/img/mar-fondo.jpg` (horizontal, 2560 px de ancho, igual al primer cuadro del video del mar) y `mar-fondo-movil.jpg` (vertical, 1152 × 1536: el centro de la horizontal), ya pasadas por `color-marca.py` con mezcla 0,8.
2. Corre `node scripts/fondo-estatico.mjs` para regenerar `public/fondo/` y cámbiales el nombre a los archivos (y en `src/data/fondo.ts`) por la caché de una semana.

## 7. Pruebas

1. `npm run build` y luego `PORT=4322 HOST=127.0.0.1 node deploy/server.mjs` (o `astro dev --background` para desarrollo).
2. Con Playwright (ya instalado) usa `waitUntil: 'load'`, no `networkidle`: el video se descarga como blob y la red nunca queda quieta.
3. Revisa:
   - Portada en 1280 × 720, 1366 × 657 (texto debajo del mar), 1440 × 900 y 1920 × 1080: el nombre no choca con el texto, se ven los brazos de Juan sobre las olas del frente.
   - iPhone 13, Pixel 7 y iPad vertical: la portada, la gran ola y las páginas interiores bajan la versión vertical y avanzan con el scroll, también con "reducir movimiento" activado. Con ahorro de datos no se descarga ningún video.
   - Celular lento simulado (CPU 4 veces más lenta y 4G): el video debe seguir el scroll sin saltos (la versión 2 da unos 24 saltos de video por segundo y la gran ola queda lista antes de llegar).
   - Ofertas, blog, comunidad y contacto en modo oscuro (mar de arriba a abajo) y en modo claro.
   - En un teléfono real, abrir cualquier página con `?diagnostico` al final (por ejemplo `juandelagua.com/?diagnostico`): muestra si ese aparato recibe video o imagen, si tiene "reducir movimiento" o ahorro de datos, y los errores.
   - Consola sin errores (si aparece un error de "Content Security Policy" con `blob:`, revisa `media-src` en `src/middleware.ts`).
   - Sin desplazamiento lateral y contraste según la regla 7.
   - Peso en celular: unos 350 KB hasta que la página termina de cargar; recorriendo la home completa, unos 2 MB con los dos videos verticales.

## 8. Pendientes conocidos

- **Encabezado de la comunidad en celular:** "Unirme gratis" se parte en dos líneas al lado del logo (detalle anterior a este rediseño).
- **Video propio para las páginas interiores (opcional):** hoy usan el mismo video de la portada y funciona bien. Si algún día se quiere uno distinto, ver el prompt opcional de la sección 9.

## 9. Prompts de Higgsfield (gran ola, versión 2)

Con estos prompts se generó la gran ola que está hoy en el sitio. Se pegan en un chat de Claude con el conector de Higgsfield, usando las generaciones ilimitadas. Corrigieron tres cosas de la versión 1: la ola chica de abajo a la izquierda aparecía cortada, salían columnas de bruma que se veían artificiales y el mar del fondo era una mancha plana.

```
Con mi conector de Higgsfield, usando solo mis generaciones ilimitadas (sin gastar créditos), genera estas 2 piezas en orden y al final dame los links de descarga.

1) IMAGEN "gran ola v2": Nano Banana Pro, 16:9, la mayor resolución que permita el ilimitado. Prompt:
"A great ocean wave in the style of a classic Japanese woodblock print, inspired by the famous Great Wave. One tall curling wave on the right half of the frame, fully inside the frame with clear space above its crest, claw-like foam fingers along the crest, fine engraved line work and subtle paper grain. In front of it, a continuous band of smaller rolling waves runs across the entire bottom of the frame, from the left edge to the right edge: complete, unbroken wave shapes with foam lines, nothing cut off or truncated on the left side. The open sea behind and to the left is never flat: gentle swells and long low waves drawn with fine horizontal engraved lines and soft tonal gradation, deeper navy in the foreground and a slightly lighter teal navy toward the horizon, kept low in contrast so large pearl white text can sit over the left half. A low horizon about one third from the top, under a soft sky of layered clouds with paper texture, deep navy at the top fading to muted teal near the horizon. Palette only deep ink navy, midnight blue, teal and pearl white foam. Clean, elegant, high detail, 16:9. No mist, no fog, no smoke, no spray columns, no light rays, no vertical streaks. No text, no logos, no lettering, no boats, no mountain, no people, no border."

2) VIDEO "gran ola v2": Seedance 2.0, imagen a video, 16:9, 6 segundos, sin audio, la mayor resolución que permita el ilimitado. Imagen de inicio: la imagen del punto 1. Prompt:
"One continuous shot, no cuts. Locked off camera with a very slow push in. The great curling wave on the right rises a little, its claw-like foam crest curls forward and breaks into white foam that tumbles down and spreads into rolling water. The spray stays low and falls back as small droplets and lace-like foam: no mist, no fog, no smoke, no columns or plumes rising into the sky, no light rays. The whole sea stays alive: distant swells keep rolling across the open water toward the horizon, the band of smaller waves in front keeps rolling from right to left, and the clouds drift slowly to the left. Keep the woodblock print style, the engraved line work, the paper grain and the navy, teal and pearl palette of the start image in every frame. The shot ends calm but not empty: a textured navy sea with gentle rolling swells and thin foam lines across the lower third, a visible horizon and soft clouds, the left side calm and open. No text, no logos, no lettering, no boats, no people."
```

**Opcional, video propio para las páginas interiores** (no hace falta: el actual funciona). Seedance 2.0, imagen a video, 16:9, 8 segundos, sin audio, imagen de inicio `mar-fondo.jpg`:

```
"One continuous shot, no cuts, locked off camera. The stylized ocean of layered wave bands with parallel stripes drifts slowly and evenly from right to left, like a calm current. Every band keeps moving at the same gentle pace from the first frame to the last, with no camera move, no zoom and no splashes. Keep the exact illustration style, clean line work and the deep navy, teal and pearl colors of the start image. No text, no logos, no lettering, no people, no boats."
```
