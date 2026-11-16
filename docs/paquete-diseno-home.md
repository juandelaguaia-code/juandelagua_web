# Paquete de diseño · Home "Emerges del mar"

Documento único con las decisiones de diseño de la home. La construcción lo usa tal cual: los textos van palabra por palabra y los números son puntos de partida que se validan con la prueba de scroll.

## 1. La idea de marca

**La corriente.** Hay un mar de información sobre IA y la mayoría de las empresas se enreda en él. Juan es quien conoce la corriente. La portada lo muestra literalmente: un mar en movimiento, tu nombre sobre el agua y Juan que sube desde las olas, tranquilo y de brazos cruzados. Cada sección después lleva al visitante del ruido (trabajo manual, consultas que se enfrían, publicidad sin números) a un plan con un solo responsable, y todo termina en una sola acción: agendar el diagnóstico gratis de 15 minutos.

## 2. Paleta (tokens)

Los colores oficiales de la marca, sin cambios. El fondo generado en Higgsfield se ajustó a estos mismos tonos para que el sitio y el mar se vean como un solo lugar.

```css
:root{
  --canvas:#f5f3ec;        /* Perla: fondo de las secciones claras */
  --canvas-dark:#0e2a43;   /* Marino: portada y secciones oscuras */
  --panel:#fbfaf6;         /* tarjetas */
  --accent:#1e9e93;        /* Corriente: botón principal y énfasis puntual */
  --accent-hover:#178a80;
  --accent-muted:rgba(30,158,147,.35);
  --text-primary:#12181f;  /* Tinta */
  --text-secondary:#5b6672;/* Piedra */
  /* olas */
  --ola-fondo:#0b2338; --ola-media:#123553; --ola-lejana:#174761;
  --espuma:#f5f3ec; --brillo:#5cc8bd;
}
```

## 3. Tipografía

- **Display:** Newsreader Variable (400 a 500, con itálica para "del Agua" y los énfasis).
- **Texto:** Plus Jakarta Sans Variable (400 a 700).
- **Sin tercera fuente monoespaciada:** decisión a propósito para no sumar peso. Las etiquetas pequeñas usan Plus Jakarta en mayúsculas con espaciado.

## 4. Mapa de la portada (scroll)

| Tramo | Rango (punto de partida) | Qué se mueve | Texto (literal) | Entrada |
|---|---|---|---|---|
| 1 | 0,00 a 0,30 | El mar fluye solo. Nombre quieto. | Línea superior: "Consultoría en IA y marketing para empresas en Chile". Nombre: "Juan del Agua" | Las letras emergen desde la línea del agua al abrir (una sola vez) |
| 2 | 0,00 a 0,72 | Juan sube desde detrás de las olas hasta el centro. El nombre sube más lento y queda detrás de él. | Indicador: "Desliza" (se apaga al empezar) | Subida con desaceleración suave |
| 3 | 0,58 a 1,00 | Llegada: propuesta a la izquierda, botón a la derecha (computador). En celular, el bloque aparece justo debajo del mar. | Ver bloque 5 | Palabras que suben desde la línea del agua, en orden de lectura, y luego los botones |

Recorrido de la portada: 120vh en computador y 95vh en celular, más la pantalla fija.

## 5. Bloque de llegada (y versión sin animación)

Es el mismo texto para todos: con movimiento reducido o sin JavaScript se muestra quieto, con Juan ya en el centro.

- Etiqueta: "IA y marketing con criterio"
- Título: "Tu operación y tus ventas, *con un solo responsable*"
- Bajada: "Para empresas donde el equipo cotiza a mano, las consultas esperan horas y nadie sabe qué campaña trae ventas. Diagnostico, armo un piloto y mido lo que cambia."
- Botón principal: "Agenda tu diagnóstico gratis"
- Nota bajo el botón: "15 minutos por videollamada. Te llevas 3 oportunidades concretas, trabajemos juntos o no."
- Botón secundario: "Ver ofertas y precios"
- Pruebas: "Certificado por Anthropic" · "Piloto antes de la inversión grande" · "Cuentas y datos a nombre de tu empresa" · "Todo Chile, remoto o presencial"

## 6. Secciones después de la portada

El orden y los textos de cada sección se mantienen como están aprobados hoy. Cambia el diseño, para que dos secciones seguidas nunca usen el mismo esqueleto, y todas empujan al mismo botón: el diagnóstico gratis.

1. **¿Te suena alguna?** Lista editorial con números grandes y una línea de corriente que se dibuja sola al bajar (antes era una grilla de 4 tarjetas).
2. **Frase central + el momento interactivo.** "Menos trabajo manual / Marketing con resultados / Recupera tiempo para vivir mejor" sobre líneas de agua enredadas. Botón "Mantén presionado": mientras lo sostienes, el mar enredado se ordena en una corriente tranquila. Si sueltas antes, vuelve con suavidad. Al completarlo aparece: "Así se siente avanzar con alguien que conoce la corriente." y el botón "Agenda tu diagnóstico gratis". Texto previo: "Hay un mar de información sobre IA. Mantén presionado para calmarlo." Con movimiento reducido se muestra directo el estado final.
3. **Cuatro formas de trabajar juntos.** Tarjetas de servicios (sin cambios de texto).
4. **Oferta estrella: Campaña + agente.** Sobre el mar pintado, con el diagrama de 4 pasos.
5. **Cómo partir.** Escalera que sube como la marea: cinco escalones conectados por una línea, cada uno un poco más alto.
6. **Blog**, **Comunidad**, **Quién está detrás** y **Preguntas frecuentes**, con sus textos actuales.
7. **Cierre:** banda final sobre el mar pintado, con el botón del diagnóstico y WhatsApp.

Formulario: no hay formulario propio. El botón lleva a `/agendar` (agenda de Google Calendar) y el botón de WhatsApp abre el chat con el mensaje listo. Ambos llegan directo a Juan.

## 7. Capa vectorial

- **Mar de la portada:** tres planos de olas dibujadas en SVG (lejano, medio y frente), cada uno con dos capas que se cruzan en direcciones opuestas. El borde visible cambia de forma todo el tiempo, por eso las olas fluyen en vez de deslizarse tiesas. Cada banda lleva líneas paralelas como tu fondo de agua, con una línea de espuma Perla en la cresta.
- **Uniones entre secciones (todo el sitio):** el mismo sistema en tamaño chico, con el color de la sección siguiente subiendo como una ola.
- **Fondo del sitio:** patrón muy suave de líneas de olas, fijo detrás de las secciones claras, para que bajar se sienta como avanzar por el mismo mar.
- **Líneas que se dibujan solas** en "¿Te suena alguna?" y en "Cómo partir".
- Todo se detiene fuera de pantalla y en pestañas ocultas, y con movimiento reducido queda quieto en su estado final.

## 8. Lista técnica

- Portada fija con recorrido medido en altura de pantalla. Un solo detector de scroll, suavizado que no depende de la frecuencia de la pantalla y que se detiene al llegar.
- Solo se animan `transform` y `opacity`. Las olas son capas que mueve la tarjeta gráfica, sin trabajo del procesador en cada cuadro.
- Escrituras al DOM solo cuando el valor cambia.
- Sin video: el mar es código y una sola imagen, así que celular y computador ven exactamente lo mismo.
- La portada funciona completa sin JavaScript y con movimiento reducido (Juan ya en el centro, sin fijar la pantalla).
- Imágenes en AVIF y WebP, con recorte vertical del fondo para celular. Fuentes de la portada precargadas.
- Piso de calidad: contraste medido, encabezados en orden, foco visible, botones de 44 px en pantallas táctiles, sin desplazamiento lateral.

## 9. Regla de textos

Todo texto visible de este paquete va literal, y la página construida debe pasar la revisión antes de mostrarse: cero guiones largos, cero palabras de relleno (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions) y la revisión de muletillas de IA en los párrafos.

## 10. Segunda ronda (pedidos de Juan)

- **Modo oscuro por defecto**, con un botón (sol y luna) en el encabezado para cambiar a claro. La elección queda guardada en el navegador del visitante y se aplica antes de pintar la página.
- **Sin olas hechas con código.** Se quitaron el patrón de líneas del fondo, las olas de las uniones entre secciones, las olas animadas de la portada y el botón de mantener presionado. Las uniones son degradados suaves.
- **El agua es imagen y video generados.** La portada usa el mar pintado (Higgsfield) en dos capas: detrás de Juan y otra vez delante de él en la franja de abajo, para que siga emergiendo del agua. Se mueve solo al hacer scroll.
- **El mismo fondo marino** en la portada de ofertas, blog, comunidad y el resto de las páginas interiores (PageHero), con las mismas versiones de imagen que la home (quedan en caché).
- **Videos generados por Juan** con sus generaciones ilimitadas de Higgsfield (no se permiten desde Claude Code), ajustados a la paleta Marino, Corriente y Perla:
  - **Mar de la portada:** avanza y retrocede con el scroll mientras Juan sube; las olas del frente (PNG transparente) le tapan la cintura con un borde nítido. Se pide recién cuando la página terminó de cargar.
  - **Gran ola:** la frase central se fija en pantalla; la ola se curva, rompe y se calma mientras aparecen "Menos trabajo manual", "Marketing con resultados" y "Recupera tiempo para vivir mejor". Contraste medido sobre el peor cuadro: 7:1 o más.
  - **Celular y movimiento reducido:** imágenes fijas nítidas que se mueven con el scroll (sin descargar video).

## 11. Cuarta ronda (pedidos de Juan)

- **Olas del frente más bajas:** la franja de olas delante de Juan ocupa cerca de un 20 % del alto de la pantalla (antes tapaba demasiado). Se recorta desde abajo, así queda la cresta nítida y se ven los brazos cruzados.
- **Sin choques en notebooks:** el texto de llegada parte justo bajo el nombre ya achicado, calculado con el alto real de la pantalla. Entre 720 y 859 px de alto el nombre se achica un poco más; con menos de 720 px el texto va debajo del mar, como en tablet.
- **Mar de página completa en todas las páginas interiores** (ofertas, blog, comunidad, contacto y el resto): una capa fija detrás de todo, de la portada hasta el pie. En computador es el mismo video de la portada y avanza con el scroll de toda la página; en celular es la imagen fija, que se desplaza un poco. En modo oscuro las secciones son semitransparentes para que el mar se vea entero; en modo claro quedan opacas.
- **Blog y comunidad con fondo:** la imagen del mar ahora es un archivo fijo (`public/fondo/`), igual en todo el sitio, así carga también en las páginas que arma el servidor. El video necesitaba permiso `blob:` en la política de seguridad para avanzar con el scroll en esas páginas.
- **Contraste medido en cada página interior** sobre el peor píxel del video (arriba, a un tercio y a dos tercios de la página): 4,4:1 o más en todos los textos.
- **Gran ola versión 2:** prompts nuevos en `docs/continuar-en-otra-sesion.md` (ola de abajo completa, sin columnas de bruma, mar del fondo con textura).
