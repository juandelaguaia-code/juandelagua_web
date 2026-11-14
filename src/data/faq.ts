export interface FaqItem { q: string; a: string }

export const faqSchema = (items: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const serviceSchema = (opts: { name: string; description: string; path: string; serviceType: string; offers?: Record<string, unknown> }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: opts.name,
  serviceType: opts.serviceType,
  description: opts.description,
  url: `https://juandelagua.com${opts.path}`,
  provider: { '@id': 'https://juandelagua.com/#negocio' },
  areaServed: { '@type': 'Country', name: 'Chile' },
  ...(opts.offers ? { offers: opts.offers } : {}),
});

export const FAQ_HOME: FaqItem[] = [
  {
    q: '¿Necesito saber de tecnología para trabajar contigo?',
    a: 'No. La parte técnica es mía. Lo que necesito de ti es que me cuentes con detalle cómo trabaja hoy tu equipo. Cada decisión te la explico con ejemplos de tu propia empresa.',
  },
  {
    q: '¿Trabajas solo con pymes?',
    a: 'No. Trabajo con pymes y con empresas más grandes. Lo que cambia es el alcance: en una empresa con varias áreas avanzamos por fases, partiendo por la que más horas consume.',
  },
  {
    q: '¿Atiendes fuera de la Región de Valparaíso?',
    a: 'Sí. Vivo en Viña del Mar y trabajo con empresas de todo Chile, incluida Santiago. Casi todo se puede hacer remoto y, cuando conviene ir en persona, voy.',
  },
  {
    q: '¿Cuánto cuesta y cómo parto?',
    a: 'Los precios están publicados en la página de ofertas, en pesos + IVA. Partimos con un diagnóstico gratis de 15 minutos y, si tiene sentido trabajar juntos, te mando una propuesta en 48 horas.',
  },
  {
    q: '¿Y si al final no conviene automatizar?',
    a: 'Te lo digo en el diagnóstico. Muchas veces conviene ordenar el proceso primero, o partir por cómo llegan los clientes, antes de sumar tecnología. Prefiero no cerrar un proyecto a venderte algo que tu equipo no va a usar.',
  },
  {
    q: '¿En qué se diferencia de contratar una agencia?',
    a: 'Hablas siempre con la persona que hace el trabajo, no con un ejecutivo de cuentas. Y la parte de IA y la de marketing las veo yo, así que no hay traspasos entre proveedores que se culpan entre sí cuando algo no funciona.',
  },
  {
    q: '¿Qué pasa si dejamos de trabajar juntos?',
    a: 'Todo queda tuyo: cuentas, accesos, datos, dominio y la documentación de lo que construí. No quedas amarrado a mí para seguir operando.',
  },
  {
    q: '¿Qué pasa con los datos de mis clientes?',
    a: 'Los trato según la Ley 21.719: acceso mínimo necesario, cuentas a nombre de tu empresa, registro de dónde queda cada dato y condiciones de tratamiento por escrito. Si lo necesitas, firmo un NDA.',
  },
];

/** Preguntas comunes sobre precios y contratación (en /ofertas y páginas de servicio) */
export const FAQ_PRECIOS: FaqItem[] = [
  {
    q: '¿Los precios publicados son los finales?',
    a: 'Sí, son los precios de lista en pesos chilenos + IVA. La propuesta escrita confirma el alcance. Si pagas el 100% de la instalación dentro de 10 días hábiles, tienes 15% de descuento en la instalación.',
  },
  {
    q: '¿Hay permanencia mínima?',
    a: 'Sí, 3 meses en las mensualidades. Después puedes terminar cuando quieras avisando con 30 días.',
  },
  {
    q: '¿De quién son las cuentas y los datos?',
    a: 'Tuyos. Las cuentas, accesos, dominio, datos y archivos quedan a nombre de tu empresa. Si algún día dejamos de trabajar juntos, todo sigue siendo tuyo.',
  },
  {
    q: '¿La pauta publicitaria está incluida?',
    a: 'No. La pagas directo a Meta, Google o LinkedIn con tu medio de pago, así controlas en todo momento cuánto se gasta.',
  },
  {
    q: '¿Qué pasa si no conviene automatizar?',
    a: 'Lo vemos en el diagnóstico, que es gratis. A veces conviene ordenar el proceso o partir por las campañas antes de sumar un agente.',
  },
  {
    q: '¿Se garantizan ventas?',
    a: 'No. Lo que sí garantizo son entregas, plazos y un reporte mensual con cuánto costó cada contacto. Las ventas dependen también de tu oferta y de cómo atiende tu equipo. Desconfía de quien te garantice ventas.',
  },
];
