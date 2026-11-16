# Continuar el rediseño en otra sesión

Documento de traspaso: qué está hecho, dónde está cada cosa, las reglas que no se cambian y los pasos exactos para reemplazar los videos. Al final están los prompts de Higgsfield para la gran ola nueva.

## 1. Prompt para pegar en una sesión nueva

Copia esto en una sesión nueva de Claude Code con este repositorio. Si vas a reemplazar la gran ola, adjunta el video y la imagen nuevos en el mismo mensaje.

```
Hola. Vas a continuar el rediseño de juandelagua.com (este repositorio, Astro). Antes de tocar nada, lee docs/continuar-en-otra-sesion.md y docs/paquete-diseno-home.md: ahí está lo hecho, el mapa de archivos, las reglas y los pasos exactos.

Contexto corto:
- Soy Juan del Agua, consultor de IA y marketing para pymes en Chile. El sitio usa un mar generado con Higgsfield en los colores de mi marca (Marino, Corriente y Perla), viene en modo oscuro por defecto y el mar se mueve solo al hacer scroll (video en computador, imagen fija en celular).
- La última ronda está en la rama claude/wonderful-newton-ld2d70. Si main todavía no la tiene, parte desde esa rama.
- No gastes créditos de Higgsfield: mis generaciones ilimitadas no funcionan desde Claude Code. Yo genero los archivos en el chat de Claude y te los subo.
- No publiques en main sin preguntarme antes (EasyPanel publica main automáticamente).

Lo que quiero ahora:
1. Te adjunto la gran ola nueva (un video mp4 y una imagen). Procésalos con la sección "Cómo reemplazar la gran ola" del documento y reemplaza public/videos/gran-ola.mp4 y src/assets/img/gran-ola.jpg.
2. Revisa el encuadre en computador y en celular (que las tres líneas de la frase no queden sobre la espuma) y mide el contraste en el peor cuadro del video.
3. Prueba el sitio como dice la sección "Pruebas" (home y páginas interiores, modo oscuro y claro, celular y notebook) y corrige lo que encuentres.
4. Haz commit en tu rama de trabajo y pregúntame antes de publicar en main.
```

## 2. Estado actual (16 de noviembre de 2026)

- **Home "Emerges del mar":** al abrir, "Juan del Agua" en grande sobre el mar. Al bajar, Juan sube desde detrás de las olas del frente hasta el centro (se ven los brazos cruzados) y aparece la propuesta con el botón del diagnóstico. El mar de fondo es un video que avanza y retrocede con el scroll.
- **Frase central:** la gran ola (video) se curva, rompe y se calma mientras aparecen "Menos trabajo manual", "Marketing con resultados" y "Recupera tiempo para vivir mejor".
- **Páginas interiores** (ofertas, blog, comunidad, contacto, consultor IA, agendar, casos, 404 y el resto que usa `PageHero`): el mar es el fondo de la página completa, de arriba hasta el pie. En computador es el mismo video de la portada, que avanza con el scroll de toda la página; en celular es la imagen fija, que se desplaza un poco con el scroll.
- **Modo oscuro por defecto**, con botón sol y luna para pasar a claro. En modo claro las secciones son opacas y el mar se ve en la portada de cada página (a propósito: el texto oscuro necesita fondo claro).
- **Notebooks:** con menos de 720 px de alto, el texto de la portada va debajo del mar (no cabe al lado de Juan sin chocar con el nombre). Entre 720 y 859 px el nombre se achica un poco más al llegar.
- **Seguridad (CSP):** `media-src 'self' blob:` es necesario para que el video avance con el scroll en las páginas que arma el servidor (blog, comunidad). Está en `src/middleware.ts`.

## 3. Mapa de archivos

| Qué | Dónde |
|---|---|
| Portada de la home | `src/components/HeroMar.astro` |
| Frase central sobre la gran ola | `src/components/Frase.astro` |
| Mar de página completa (páginas interiores) | `src/components/PageHero.astro` + reglas "Páginas interiores" al final de `src/styles/global.css` |
| Imagen del fondo de mar (todo el sitio) | `public/fondo/` (AVIF y WebP), `src/data/fondo.ts`, `src/components/FondoMar.astro` |
| Banda final con el mar | `src/components/CtaBand.astro` |
| Videos con scroll | `public/videos/mar-portada.mp4`, `public/videos/gran-ola.mp4`; lógica en `src/scripts/scrub.ts` |
| Imágenes maestras | `src/assets/img/mar-fondo.jpg`, `mar-fondo-movil.jpg`, `olas-frente.png`, `gran-ola.jpg`, `juan-agua.png` |
| Color de marca para material nuevo | `scripts/color-marca.py` |
| Regenerar `public/fondo/` | `node scripts/fondo-estatico.mjs` |
| Tema oscuro y claro | `src/styles/global.css`, `src/components/Header.astro`, `src/layouts/Base.astro` |
| Servidor de producción | `deploy/server.mjs` (compresión brotli y gzip) |

## 4. Reglas que no se cambian

1. **Cero gasto en Higgsfield.** Las generaciones ilimitadas no se pueden usar desde Claude Code. Juan genera en el chat de Claude (o Cowork) y sube los archivos a la sesión.
2. **Publicar en main solo con el visto bueno de Juan.** EasyPanel despliega main solo; antes de eso se trabaja en la rama de la sesión.
3. **Sin olas hechas con código.** El agua es imagen o video generado.
4. **Nada se mueve solo:** el mar y la ola avanzan únicamente con el scroll. Solo se animan `transform` y `opacity`.
5. **Celular sin video:** imágenes fijas nítidas (también con movimiento reducido).
6. **Textos:** cero guiones largos y cero palabras de relleno (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions, testament, landscape, delve, elevate).
7. **Contraste medido sobre el peor píxel:** 4,5:1 o más para texto normal; 3:1 para títulos grandes.

## 5. Cómo reemplazar la gran ola

Parte desde la raíz del repositorio. `NUEVO.mp4` y `NUEVA.png` son los archivos que subió Juan.

1. Prepara el color de marca (mezcla 0,7 para la gran ola):
   ```bash
   python3 scripts/color-marca.py lut /tmp/marca-70.cube 0.7
   ```
2. Codifica el video para el scroll: 1280 px de ancho, sin audio y con un cuadro clave cada 8 cuadros (así retroceder también es fluido). Debe quedar cerca de 3 MB:
   ```bash
   ffmpeg -y -i NUEVO.mp4 -vf "scale=1280:-2,lut3d=file=/tmp/marca-70.cube:interp=tetrahedral" -c:v libx264 -crf 22 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an public/videos/gran-ola.mp4
   ```
   Si pesa mucho más de 4 MB, sube `-crf` a 24.
3. Imagen fija (se ve en celular y mientras carga el video). Idealmente la misma imagen que se usó como inicio del video, para que el paso de imagen a video no salte:
   ```bash
   python3 scripts/color-marca.py imagen NUEVA.png src/assets/img/gran-ola.jpg 0.7
   ```
   Déjala en unos 2000 px de ancho (Astro genera las versiones AVIF y WebP al compilar).
4. Encuadre: en `src/components/Frase.astro` el celular usa `object-position: 57% 50%` para que el texto no quede sobre la espuma. Si la ola nueva cambia de lugar, ajusta ese valor y la sombra (`.ola-scrim`).
5. Compila y prueba (sección 7). Mide el contraste de las tres líneas en el inicio, en la mitad (cuando rompe la ola) y al final del video.

Para el **mar de la portada** el proceso es igual con mezcla 0,8 (`marca-80.cube`) y `-crf 20`. Las **olas del frente** (PNG transparente) se pasan por `color-marca.py imagen … 0.8` y se recortan al alto de las olas (2000 × 388 px hoy), sin franja transparente de sobra arriba.

## 6. Cómo cambiar la imagen del mar

1. Reemplaza `src/assets/img/mar-fondo.jpg` (horizontal, 2560 px de ancho) y `mar-fondo-movil.jpg` (vertical, 1152 × 1536), ya pasadas por `color-marca.py` con mezcla 0,8.
2. Corre `node scripts/fondo-estatico.mjs` para regenerar `public/fondo/`.

## 7. Pruebas

1. `npm run build` y luego `PORT=4322 HOST=127.0.0.1 node deploy/server.mjs` (o `astro dev --background` para desarrollo).
2. Con Playwright (ya instalado) usa `waitUntil: 'load'`, no `networkidle`: el video se descarga como blob y la red nunca queda quieta.
3. Revisa:
   - Portada en 1280 × 720, 1366 × 657 (texto debajo del mar), 1440 × 900 y 1920 × 1080: el nombre no choca con el texto, se ven los brazos de Juan sobre las olas del frente.
   - iPhone 13: portada, frase de la gran ola y páginas interiores sin descargar video.
   - Ofertas, blog, comunidad y contacto en modo oscuro (mar de arriba a abajo, el video avanza con el scroll en computador) y en modo claro.
   - Consola sin errores (si aparece un error de "Content Security Policy" con `blob:`, revisa `media-src` en `src/middleware.ts`).
   - Sin desplazamiento lateral y contraste según la regla 7.
   - Peso: la home en celular ronda los 350 KB; en computador los videos se piden recién cuando la página terminó de cargar.

## 8. Pendientes conocidos

- **Gran ola nueva:** prompts en la sección 9. Cuando Juan suba los archivos, seguir la sección 5.
- **Encabezado de la comunidad en celular:** "Unirme gratis" se parte en dos líneas al lado del logo (detalle anterior a este rediseño).
- **Video propio para las páginas interiores (opcional):** hoy usan el mismo video de la portada y funciona bien. Si algún día se quiere uno distinto, ver el prompt opcional de la sección 9.

## 9. Prompts de Higgsfield (gran ola, versión 2)

Se pegan en un chat de Claude con el conector de Higgsfield, usando las generaciones ilimitadas. Corrigen tres cosas de la versión 1: la ola chica de abajo a la izquierda aparecía cortada, salían columnas de bruma que se veían artificiales y el mar del fondo era una mancha plana.

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
