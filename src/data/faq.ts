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
    a: 'Sí. Trabajo con pymes y empresas de distintos tamaños. El alcance y las fases se ajustan al tamaño del equipo y a la complejidad de los procesos.',
  },
  {
    q: '¿Atiendes fuera de la Región de Valparaíso?',
    a: 'Sí. La base está en Viña del Mar, pero atiendo empresas en todo Chile, incluida Santiago. La mayor parte del trabajo se puede hacer de forma remota y, cuando conviene, presencial.',
  },
  {
    q: '¿Cómo se cotiza un proyecto?',
    a: 'Cada proyecto parte con un diagnóstico y, a partir de él, se entrega una propuesta por fases con presupuesto. Claude para equipos es la excepción: tiene un valor fijo de $150.000 CLP.',
  },
  {
    q: '¿Qué pasa si el diagnóstico indica que no conviene automatizar?',
    a: 'Se dice con claridad. No todos los procesos justifican una automatización; a veces lo que corresponde es ordenar el proceso o mejorar la captación de clientes antes de sumar tecnología.',
  },
];
