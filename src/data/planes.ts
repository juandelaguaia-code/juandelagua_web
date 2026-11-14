/**
 * Precios públicos de los servicios. ÚNICO lugar donde se cambian.
 * Montos en pesos chilenos (CLP) + IVA, salvo la comunidad (IVA incluido, ver COMMUNITY en site.ts).
 * No poner aquí costos internos, márgenes ni precios de clientes piloto: el repo es público.
 */

export interface Plan {
  id: string;
  name: string;
  /** Línea: contenido (marketing) o automatización (IA) */
  line: 'contenido' | 'automatizacion' | 'web' | 'otro';
  /** Pago único de instalación (CLP + IVA). null = no aplica */
  setup: number | null;
  /** Mensualidad (CLP + IVA). null = no aplica */
  monthly: number | null;
  /** Texto en vez de cifra cuando el precio es "desde" o "según alcance" */
  setupLabel?: string;
  monthlyLabel?: string;
  /** Títulos de los precios (por defecto "Instalación" y "Mensualidad") */
  setupTitle?: string;
  monthlyTitle?: string;
  /** El precio parte desde este valor */
  from?: boolean;
  summary: string;
  includes: string[];
  excludes?: string[];
  star?: boolean;
  limited?: boolean;
  /** Suma de partes para mostrar el ahorro (tachado) */
  compareMonthly?: number;
  compareNote?: string;
  /** Página donde se explica el servicio */
  page?: string;
}

export const PLANES = {
  // ---------- Marketing y contenido ----------
  base: {
    id: 'base', name: 'Plan Base', line: 'contenido', setup: 290_000, monthly: null, page: '/marketing-digital',
    summary: 'Tu marca ordenada y lista para vender: lo justo para dejar de improvisar.',
    includes: ['Auditoría de tu marca y tus canales', 'Brandbook básico', '8 plantillas de contenido listas para usar', 'Bio y enlace único que convierten', 'WhatsApp Business bien configurado', 'Capacitación para que lo manejes tú'],
    excludes: ['Gestión mensual de redes', 'Pauta en Meta (la pagas directo)'],
  },
  crecer: {
    id: 'crecer', name: 'Plan Crecer', line: 'contenido', setup: 590_000, monthly: 450_000, limited: true, page: '/marketing-digital',
    summary: 'Contenido todas las semanas y presencia web, sin que tengas que pensar en qué publicar.',
    includes: ['Todo el Plan Base', 'Plan de marketing con objetivos', '2 reels y 2 carruseles por semana, con fotos y videos generados con IA', 'Web y catálogo', 'Google Business Profile', 'Reporte mensual de resultados', 'Hasta 16 horas de trabajo al mes'],
    excludes: ['Grabación presencial (se cotiza aparte)', 'Pauta en Meta (la pagas directo)'],
  },
  escalar: {
    id: 'escalar', name: 'Plan Escalar', line: 'contenido', setup: 990_000, monthly: 690_000, limited: true, page: '/marketing-digital',
    summary: 'Más contenido, mensajes automáticos y un CRM: para cuando ya no das abasto.',
    includes: ['Todo el Plan Crecer', '3 reels y 3 carruseles por semana, con fotos y videos generados con IA', 'Respuestas automáticas en DM y WhatsApp', 'CRM configurado', 'Reunión mensual de resultados', 'Hasta 24 horas de trabajo al mes'],
    excludes: ['Grabación presencial (se cotiza aparte)', 'Pauta en Meta (la pagas directo)'],
  },
  campanas: {
    id: 'campanas', name: 'Campañas en Meta', line: 'contenido', setup: 150_000, monthly: 120_000, page: '/marketing-digital',
    summary: 'Anuncios en Instagram y Facebook que se miden: sabes cuánto te cuesta cada contacto.',
    includes: ['Estrategia de campaña', 'Creatividades (fotos y videos generados con IA)', 'Públicos y segmentación', 'Optimización continua', 'Reporte mensual de costo por contacto'],
    excludes: ['Pauta en Meta (la pagas directo)', 'Grabación presencial (se cotiza aparte)'],
  },
  google: {
    id: 'google', name: 'Campañas en Google Ads', line: 'contenido', setup: 150_000, monthly: 140_000, page: '/marketing-digital',
    summary: 'Aparece cuando te buscan en Google: anuncios en búsqueda y mapas para gente que ya quiere comprar.',
    includes: ['Investigación de palabras clave', 'Anuncios de búsqueda y de Google Maps', 'Medición de llamadas, formularios y WhatsApp', 'Optimización continua', 'Reporte mensual de costo por contacto'],
    excludes: ['Pauta en Google (la pagas directo)'],
  },
  // ---------- Agentes de IA y automatización ----------
  starter: {
    id: 'starter', name: 'Agente Starter', line: 'automatizacion', setup: 590_000, monthly: 89_000, page: '/consultor-ia',
    summary: 'Un agente de IA que conoce tu catálogo y atiende, vende y agenda mientras tú trabajas.',
    includes: ['Un agente con tu catálogo en WhatsApp o Instagram', 'Responde en minutos, a cualquier hora', 'Califica, vende y agenda', 'Pasa la conversación a una persona cuando corresponde', 'Mantenimiento, ajustes y reporte mensual'],
    excludes: ['Créditos de IA, Cloudflare y WhatsApp (a tu nombre, se pagan aparte)'],
  },
  combo: {
    id: 'combo', name: 'Campaña + agente', line: 'automatizacion', setup: 790_000, monthly: 189_000, star: true, page: '/consultor-ia',
    summary: 'La campaña trae la consulta y tu agente la responde en minutos, la califica y la agenda.',
    includes: ['Gestión de campañas Meta', 'Agente de IA en WhatsApp o Instagram', 'Cada consulta respondida, calificada y agendada', 'Reporte mensual de costo por contacto'],
    excludes: ['Pauta en Meta (la pagas directo)', 'Créditos de IA (se pagan aparte)'],
  },
  consultoria: {
    id: 'consultoria', name: 'Consultoría IA por fases', line: 'automatizacion', setup: 1_500_000, monthly: null, from: true, page: '/consultor-ia',
    setupLabel: 'desde $1.500.000 por fase', monthlyLabel: 'según alcance',
    summary: 'Para empresas con equipo y varias áreas: flujos, agentes conectados a tus sistemas e IA para todo el equipo.',
    includes: ['Método de 7 pasos con piloto acotado', 'Flujos y agentes conectados a tus herramientas', 'IA aplicada al trabajo del equipo', 'Documentación y capacitación'],
    excludes: ['Créditos de IA (se pagan aparte)'],
  },
  // ---------- Sitios web ----------
  landing: {
    id: 'landing', name: 'Landing page', line: 'web', setup: 150_000, monthly: 20_000, page: '/marketing-digital', setupTitle: 'Desarrollo', monthlyTitle: 'Mantenimiento',
    summary: 'Una página enfocada en una sola cosa: que te escriban o te compren.',
    includes: ['1 página con tu oferta, testimonios y llamado a la acción', 'Botón a WhatsApp y formulario', 'Adaptada a celular y rápida', 'SEO básico y analítica', 'Mantenimiento: hosting, SSL, respaldos y 30 min de cambios al mes'],
    excludes: ['Dominio (a tu nombre, se paga aparte)'],
  },
  webpro: {
    id: 'webpro', name: 'Página web pro', line: 'web', setup: 450_000, monthly: 40_000, page: '/marketing-digital', setupTitle: 'Desarrollo', monthlyTitle: 'Mantenimiento',
    summary: 'El sitio completo de tu negocio: explica lo que haces y convierte visitas en clientes.',
    includes: ['Hasta 6 secciones (inicio, servicios, nosotros, contacto…)', 'Textos orientados a vender', 'SEO local y Google Business Profile', 'Blog listo para publicar', 'Analítica y medición de contactos', 'Mantenimiento: hosting, SSL, respaldos, monitoreo y 1 hora de cambios al mes'],
    excludes: ['Dominio (a tu nombre, se paga aparte)'],
  },
  ecommerce: {
    id: 'ecommerce', name: 'E-commerce', line: 'web', setup: 750_000, monthly: 70_000, page: '/marketing-digital', setupTitle: 'Desarrollo', monthlyTitle: 'Mantenimiento',
    summary: 'Tu tienda online lista para vender: catálogo, pagos y despachos.',
    includes: ['Catálogo de hasta 50 productos', 'Pagos en línea (Webpay, Mercado Pago o Flow)', 'Configuración de despachos', 'Correos de compra automáticos', 'Capacitación para cargar productos', 'Mantenimiento: hosting, SSL, respaldos, actualizaciones de seguridad y 2 horas de cambios al mes'],
    excludes: ['Dominio y comisiones de la pasarela de pago (se pagan aparte)'],
  },
  // ---------- A tu medida ----------
  medida: {
    id: 'medida', name: 'Consultoría personalizada', line: 'otro', setup: null, monthly: null,
    setupTitle: 'Precio', setupLabel: 'Propuesta a tu medida',
    summary: 'Primero entiendo cómo funciona tu empresa; después te propongo solo lo que de verdad necesitas.',
    includes: ['Levantamiento de tus procesos, canales y números', 'Mapa de qué conviene hacer, en qué orden y qué no', 'Propuesta con alcance, plazos y precio cerrado', 'Puedes tomar solo una parte o todo'],
  },
} satisfies Record<string, Plan>;

export type PlanId = keyof typeof PLANES;

/** Orden de las tarjetas: en contenido, de menor a mayor. En automatización, la estrella al medio. */
export const CONTENIDO_ORDER: PlanId[] = ['base', 'crecer', 'escalar'];
export const AUTOMATIZACION_ORDER: PlanId[] = ['starter', 'combo', 'consultoria'];
export const WEB_ORDER: PlanId[] = ['landing', 'webpro', 'ecommerce'];

/** Lo que se cobra aparte en todos los planes */
export const APARTE = 'En todos los planes, los créditos de IA y la pauta en Meta se pagan aparte, directo al proveedor y a tu nombre.';
/** Nota de contenido: fotos y videos generados con IA */
export const CONTENIDO_IA = 'Las fotos y los videos se generan con IA. Si prefieres grabar en persona, la grabación se cotiza aparte.';

/** Precio de lanzamiento: 3 primeros clientes de Agente Starter o Campaña + agente. Edita `left` cuando se ocupe un cupo. */
export const LAUNCH = { total: 3, left: 3, discount: 20, months: 6 } as const;

export const DIAGNOSTICO = {
  minutes: 15,
  summary: 'Una videollamada de 15 minutos para entender tu caso. Te llevas 3 oportunidades concretas, sin compromiso.',
  excludes: 'No incluye informe escrito.',
} as const;

/** Tiempos de respuesta comerciales */
export const RESPUESTA = {
  reply: 'Respondo en menos de 2 horas hábiles',
  proposal: 'Propuesta en 48 horas después del diagnóstico',
} as const;

/** Condiciones comerciales (se muestran en /ofertas y /terminos) */
export const CONDICIONES = [
  'Pronto pago: 15% de descuento en la instalación si pagas el 100% dentro de 10 días hábiles desde la propuesta. No aplica a mensualidades.',
  `Precio de lanzamiento: los ${LAUNCH.total} primeros clientes de Agente Starter o Campaña + agente que autoricen publicar su caso (con nombre o anónimo) pagan ${LAUNCH.discount}% menos en la mensualidad durante ${LAUNCH.months} meses.`,
  'Permanencia mínima de 3 meses en las mensualidades; después, puedes terminar con 30 días de aviso.',
  'Instalación: 50% al contratar y 50% en la primera entrega. Mensualidad anticipada, dentro de los primeros 5 días del mes.',
  'Precios en pesos chilenos + IVA, con reajuste anual por IPC. Si ya eres cliente, conservas tu precio por 12 meses.',
  'Cuentas, accesos, dominio, datos y archivos quedan a tu nombre.',
  'La pauta publicitaria la pagas tú directo a Meta, Google o LinkedIn.',
  'Dos rondas de cambios por pieza, con aprobación en 48 horas.',
  'No se garantizan ventas; sí entregas, plazos y un reporte mensual.',
  'Casos y testimonios solo con autorización escrita; si no, anónimos y con cifras agregadas (Ley 21.719). NDA a solicitud.',
  'Los traslados fuera de la Región de Valparaíso se cobran aparte.',
] as const;

export const clp = (n: number) => `$${n.toLocaleString('es-CL')}`;

/** Precio corto para mostrar "desde …" en páginas de servicio */
export const desde = (p: Plan) =>
  p.setupLabel ?? (p.monthly != null ? `${clp(p.monthly)}/mes + IVA` : p.setup != null ? `${clp(p.setup)} + IVA` : '');

/** Offers de schema.org para un plan (CLP, sin IVA incluido) */
const offerSchema = (p: Plan) => {
  const offers: Record<string, unknown>[] = [];
  if (p.setup != null)
    offers.push({
      '@type': 'Offer', name: `${p.name}: instalación${p.from ? ' (desde)' : ''}`, price: p.setup, priceCurrency: 'CLP',
      priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'CLP', valueAddedTaxIncluded: false, ...(p.from ? { minPrice: p.setup } : { price: p.setup }) },
    });
  if (p.monthly != null)
    offers.push({
      '@type': 'Offer', name: `${p.name}: mensualidad`, price: p.monthly, priceCurrency: 'CLP',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: p.monthly, priceCurrency: 'CLP', valueAddedTaxIncluded: false, unitText: 'mes', billingDuration: 'P1M' },
    });
  return offers;
};

/** Service con Offer/AggregateOffer (para JSON-LD) */
export const planServiceSchema = (p: Plan) => {
  const offers = offerSchema(p);
  const prices = offers.map((o) => o.price as number);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: p.name,
    description: `${p.summary} Precios en pesos chilenos + IVA.`,
    provider: { '@id': 'https://juandelagua.com/#negocio' },
    areaServed: { '@type': 'Country', name: 'Chile' },
    url: `https://juandelagua.com${p.line === 'web' ? '/ofertas/webs' : p.id === 'consultoria' || p.id === 'medida' ? '/ofertas/consultoria' : p.line === 'automatizacion' ? '/ofertas/ia' : '/ofertas/marketing'}`,
    offers:
      offers.length > 1
        ? { '@type': 'AggregateOffer', priceCurrency: 'CLP', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: offers.length, offers }
        : offers[0],
  };
};
