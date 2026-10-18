// Datos de marca centralizados. Cambia aquí y se actualiza en todo el sitio.

export const SITE = {
  name: 'Juan del Agua',
  legalName: 'Juan del Agua Araneda Gattavara',
  url: 'https://juandelagua.com',
  tagline: 'Consultor de IA y marketing para empresas y pymes en Chile',
  description:
    'Consultoría en inteligencia artificial y marketing para empresas y pymes en Chile: automatización de flujos, agentes de IA y estrategia digital medible.',
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
  whatsappNumber: '56984388246',
  whatsappDisplay: '+56 9 8438 8246',
  social: {
    linkedin: 'https://www.linkedin.com/in/juan-araneda-979a2236a/',
    youtube: 'https://www.youtube.com/channel/UCiTJhr_Ir6YS3ccHD46I5VQ',
    instagram: 'https://www.instagram.com/juandelagua.ia/',
  },
} as const;

export const waLink = (message = 'Hola Juan, vengo desde su sitio web y me gustaría conversar sobre mi empresa.') =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const NAV = [
  { href: '/consultor-ia', label: 'Consultor IA' },
  { href: '/marketing-digital', label: 'Marketing' },
  { href: '/sobre-mi', label: 'Sobre mí' },
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
  { name: 'Prototipar', q: 'Una versión acotada primero.', d: 'Se construye una versión pequeña del flujo para validar la idea antes de una inversión mayor.' },
  { name: 'Mostrar', q: 'Validación con casos reales.', d: 'El prototipo se revisa funcionando con datos y situaciones reales de la empresa, junto al equipo.' },
  { name: 'Implementar', q: 'Integración a la operación.', d: 'Se conecta con las herramientas que ya se usan, se documenta y se capacita al equipo. Nada queda como caja negra.' },
  { name: 'Medir', q: '¿Qué cambió en la práctica?', d: 'Se comparan indicadores antes y después: horas, tiempos de respuesta y solicitudes atendidas.' },
  { name: 'Mejorar', q: 'Ajuste continuo.', d: 'Con los datos de uso se afinan los flujos para que acompañen el crecimiento de la empresa.' },
] as const;
