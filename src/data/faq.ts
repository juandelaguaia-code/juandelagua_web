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
    q: '¿Se necesitan conocimientos técnicos para trabajar juntos?',
    a: 'No. La parte técnica queda a mi cargo y cada decisión se explica con ejemplos de la propia empresa. Lo importante es conocer en detalle cómo opera hoy el equipo.',
  },
  {
    q: '¿Trabajas con pymes y también con empresas más grandes?',
    a: 'Sí. Trabajo con empresas y pymes de distintos tamaños. El alcance y las fases se ajustan al tamaño del equipo y a la complejidad de los procesos.',
  },
  {
    q: '¿Atiendes fuera de la Región de Valparaíso?',
    a: 'Sí. La base está en Viña del Mar, pero atiendo empresas en todo Chile, incluida Santiago. La mayor parte del trabajo se puede hacer de forma remota y, cuando conviene, presencial.',
  },
  {
    q: '¿Cuánto cuesta y cómo parto?',
    a: 'Los precios están publicados en la página de planes, en pesos + IVA. Se parte con un diagnóstico gratis de 30 minutos y, si tiene sentido, recibes una propuesta en 48 horas.',
  },
  {
    q: '¿Qué pasa si el diagnóstico indica que no conviene automatizar?',
    a: 'Se dice con claridad. No todos los procesos justifican una automatización; a veces lo que corresponde es ordenar el proceso o mejorar la captación de clientes antes de sumar tecnología.',
  },
  {
    q: '¿Cómo se protegen los datos de mis clientes?',
    a: 'Según la Ley 21.719: acceso mínimo necesario, cuentas a nombre de tu empresa, registro de dónde queda cada dato y condiciones de tratamiento por escrito. NDA a solicitud.',
  },
];

/** Preguntas comunes sobre precios y contratación (en /planes y páginas de servicio) */
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
    a: 'Te lo digo en el diagnóstico, que es gratis. A veces lo que conviene es ordenar el proceso o partir por las campañas antes de sumar un agente.',
  },
  {
    q: '¿Se garantizan ventas?',
    a: 'No. Se garantizan entregas, plazos y un reporte mensual con cuánto cuesta cada contacto. Las ventas dependen también de tu oferta y de tu atención.',
  },
];
