// Datos de marca centralizados. Cambia aquí y se actualiza en todo el sitio.

export const SITE = {
  name: 'Juan del Agua',
  legalName: 'Juan del Agua Araneda Gattavara',
  url: 'https://juandelagua.com',
  tagline: 'Consultor de IA y marketing para empresas y pymes en Chile',
  /** Firma de marca */
  signature: 'IA y marketing con criterio, para que recuperes tu tiempo.',
  /** Frase corta de la propuesta (hero) */
  promise: 'Delega tu IA y tu marketing en una sola persona con criterio, y recupera tu tiempo.',
  description:
    'Agentes de IA, campañas y contenido para pymes y empresas en Chile: no pierdes ninguna consulta y sabes cuánto te cuesta cada cliente. Diagnóstico gratis.',
  locale: 'es_CL',
  region: 'Región de Valparaíso',
  city: 'Viña del Mar',
  // Servidor de Plausible (servicio "plausible" en EasyPanel, con este dominio)
  plausibleUrl: 'https://analytics.juandelagua.com',
  // Correo de contacto general
  email: 'juandelagua.ia@gmail.com',
  // Canal para ejercer derechos sobre datos personales (Ley 21.719). Cambiar a 'datos@juandelagua.com'
  // cuando el reenvío de correo de Cloudflare esté activo.
  privacyEmail: 'juandelagua.ia@gmail.com',
  // RUT del responsable (persona natural o empresa). Si está vacío, no se muestra en las páginas legales.
  rut: '',
  // Agenda del diagnóstico gratis (15 min) conectada a Google Calendar: link de tu "Agenda de citas"
  // (Google Calendar → Crear → Agenda de citas → Compartir → "Página de reservas"). Se muestra en /agendar.
  // Mientras esté vacío, /agendar ofrece WhatsApp.
  bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2h40Fxum9r_5rNzgYNAK7kGfH1BsFbdTVZR9zRzSsFAAVZkzcEkfh6cTqiMqeCUiszfqRQd811',
  whatsappNumber: '56984388246',
  whatsappDisplay: '+56 9 8438 8246',
  social: {
    linkedin: 'https://www.linkedin.com/in/juan-araneda-979a2236a/',
    youtube: 'https://www.youtube.com/channel/UCiTJhr_Ir6YS3ccHD46I5VQ',
    instagram: 'https://www.instagram.com/juandelagua.ia/',
  },
} as const;

/** Versiones vigentes de los documentos legales (se registran con cada consentimiento) */
export const LEGAL = { terms: '2.0', privacy: '2.2', rules: '1.0' } as const;

export const waLink = (message = 'Hola Juan, vengo desde su sitio web y me gustaría conversar sobre mi empresa.') =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const DIAG_MSG = 'Hola Juan, vengo desde tu sitio web y quiero agendar el diagnóstico gratis de 15 minutos.';

/** Link de los botones "Diagnóstico gratis": la página de agenda del sitio */
export const diagnosticoHref = () => "/agendar";

/** Subpáginas de Ofertas (menú desplegable y tarjetas de /ofertas) */
export const OFERTAS = [
  { href: '/ofertas/ia', label: 'Inteligencia artificial', short: 'Respuestas en minutos, a cualquier hora', desc: 'Un agente que atiende, resuelve dudas y agenda por WhatsApp o Instagram mientras tú te concentras en tu trabajo.' },
  { href: '/ofertas/marketing', label: 'Marketing', short: 'Campañas y contenido con resultados medibles', desc: 'Campañas en Meta y contenido semanal, con un reporte mensual de cuánto te cuesta cada cliente.' },
  { href: '/ofertas/webs', label: 'Sitios web', short: 'Landing page, web completa o tienda online', desc: 'Sitios rápidos y claros, pensados para que te contacten o te compren. El mantenimiento va incluido.' },
  { href: '/ofertas/consultoria', label: 'Consultoría personalizada', short: 'Solo lo que tu empresa necesita', desc: 'Primero entiendo cómo trabaja tu empresa; después te propongo solo lo necesario, con precio cerrado.' },
] as const;

export interface NavItem { href: string; label: string; children?: readonly { href: string; label: string; short?: string }[] }
export const NAV: readonly NavItem[] = [
  { href: '/ofertas', label: 'Ofertas', children: OFERTAS },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre-mi', label: 'Sobre mí' },
];

/**
 * Comunidad (producto endosado: "[nombre] by Juan del Agua").
 * El nombre es provisional: cámbialo aquí y se actualiza en todo el sitio.
 */
export const COMMUNITY = {
  name: 'Comunidad Corriente',
  endorsement: 'by Juan del Agua',
  // La comunidad vive en su propio subdominio (mismo servidor, ver deploy/server.mjs)
  url: 'https://comunidad.juandelagua.com',
  tagline: 'IA sin programar, con el proceso real en 1 minuto.',
  description:
    'Videos, plantillas y comunidad para usar IA sin programar y automatizar mensajes, reservas y contenido, con el proceso real en 1 minuto.',
  // Link al grupo de WhatsApp de avisos (solo se muestra a miembros activos). Vacío = no se muestra.
  whatsappGroupUrl: '',
  pricing: [
    { when: 'Hasta junio 2027', price: 'Gratis', note: 'Entras gratis mientras armamos la comunidad.' },
    { when: 'Desde julio 2027 · fundadores', price: '$5.000/mes', note: 'Precio congelado mientras sigas activo.' },
    { when: 'Desde diciembre 2027 · nuevos', price: '$9.900/mes', note: 'Precio para quienes entren desde esa fecha.' },
  ],
  pricingNote: 'Precios en pesos chilenos, IVA incluido.',
} as const;

/** Valores de marca (Brand Book) */
export const VALUES = [
  { name: 'Claridad estratégica', d: 'Antes de implementar, se entiende el problema. Cada decisión tiene un porqué y un plan medible.' },
  { name: 'Autenticidad y cercanía', d: 'De tú a tú, sin lenguaje corporativo. Se muestra el proceso real, con los errores incluidos.' },
  { name: 'Pragmatismo realista', d: 'Lo más simple que funcione. Y si no conviene automatizar, se dice.' },
  { name: 'Vivir bien', d: 'El objetivo no es solo facturar más: es recuperar tiempo para la familia, el deporte, la salud y el ocio.' },
] as const;

/** Manifiesto (texto literal del Brand Book) */
export const MANIFESTO = [
  'Hay un mar de información sobre inteligencia artificial. Todos los días aparece una herramienta nueva, una promesa nueva, un experto nuevo. Con tanto ruido, la mayoría de las personas y empresas se enreda, se cansa o ni siquiera se atreve a partir.',
  'Yo creo que la tecnología tiene que servir para algo concreto.',
  'Creo en el criterio por sobre la moda. No todo se automatiza, y decir cuándo no conviene también es parte del trabajo.',
  'Creo en mostrar el proceso completo, con pantallas reales y los errores incluidos.',
  'Y creo, sobre todo, que el objetivo no es solo facturar más. Es devolverle al equipo su eficiencia, a la gerencia su tranquilidad y a cada persona el tiempo para lo que importa cuando se apaga el computador: la familia, el deporte, la salud, los amigos, el ocio.',
  'Por eso hago lo que hago. Para que avances en este mar con calma, acompañado por alguien que conoce la corriente. Y para que, al final del día, te quede tiempo para vivir.',
] as const;

/**
 * Certificaciones de Anthropic Academy. `img` = número del archivo src/assets/img/certificado-N.jpg
 * y `url` = verificación oficial en Skilljar. Nombre, imagen y link van juntos para que no se crucen.
 */
export const CERTIFICATIONS = [
  { name: 'AI Fluency for Small Businesses', img: 1, url: 'https://verify.skilljar.com/c/czohpya84mv6' },
  { name: 'Teaching the AI Fluency Framework', img: 2, url: 'https://verify.skilljar.com/c/eby3swx96amw' },
  { name: 'Introduction to Claude Cowork', img: 3, url: 'https://verify.skilljar.com/c/j3qduh6p6k83' },
  { name: 'AI Fluency: Framework & Foundations', img: 4, url: 'https://verify.skilljar.com/c/yoy4ms4mciyr' },
] as const;

/** Método de la consultoría en IA (no aplica a marketing). */
export const METHOD = [
  { name: 'Escuchar', q: '¿Qué está consumiendo más tiempo?', d: 'Levantamiento de cómo opera la empresa hoy: responsables, canales de entrada de clientes y puntos donde el trabajo se detiene.' },
  { name: 'Detectar', q: '¿Qué conviene automatizar y qué no?', d: 'Se separa lo que vale la pena resolver con IA de lo que conviene ordenar primero o dejar como está. Cuando no conviene automatizar, se dice.' },
  { name: 'Prototipar', q: 'Un piloto acotado primero.', d: 'Se construye un piloto pequeño del flujo para validar la idea con casos reales antes de la inversión mayor. Si el piloto no convence, se para ahí.' },
  { name: 'Mostrar', q: 'Validación con casos reales.', d: 'El prototipo se revisa funcionando con datos y situaciones reales de la empresa, junto al equipo.' },
  { name: 'Implementar', q: 'Integración a la operación.', d: 'Se conecta con las herramientas que ya se usan, se documenta y se capacita al equipo. Nada queda como caja negra.' },
  { name: 'Medir', q: '¿Qué cambió en la práctica?', d: 'Se comparan indicadores antes y después: horas, tiempos de respuesta y solicitudes atendidas.' },
  { name: 'Mejorar', q: 'Ajuste continuo.', d: 'Con los datos de uso se afinan los flujos para que acompañen el crecimiento de la empresa.' },
] as const;
