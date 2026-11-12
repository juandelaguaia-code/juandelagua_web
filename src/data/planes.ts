/**
 * Precios públicos de los servicios. ÚNICO lugar donde se cambian.
 * Montos en pesos chilenos (CLP) + IVA, salvo la comunidad (IVA incluido, ver COMMUNITY en site.ts).
 * No poner aquí costos internos, márgenes ni precios de clientes piloto: el repo es público.
 */

export interface Plan {
  id: string;
  name: string;
  /** Línea: contenido (marketing) o automatización (IA) */
  line: 'contenido' | 'automatizacion' | 'otro';
  /** Pago único de instalación (CLP + IVA). null = no aplica */
  setup: number | null;
  /** Mensualidad (CLP + IVA). null = no aplica */
  monthly: number | null;
  /** Texto en vez de cifra cuando el precio es "desde" o "según alcance" */
  setupLabel?: string;
  monthlyLabel?: string;
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
  base: {
    id: 'base', name: 'Plan Base', line: 'contenido', setup: 290_000, monthly: null, page: '/marketing-digital',
    summary: 'Ordena tu marca y tus canales para partir bien.',
    includes: ['Auditoría de tu marca y canales', 'Brandbook básico', '8 plantillas de contenido', 'Bio y enlace único', 'WhatsApp Business configurado', 'Capacitación para usarlo'],
    excludes: ['Gestión mensual de redes', 'Pauta publicitaria'],
  },
  crecer: {
    id: 'crecer', name: 'Plan Crecer', line: 'contenido', setup: 590_000, monthly: 450_000, limited: true, page: '/marketing-digital',
    summary: 'Base + contenido semanal y presencia web, con reporte cada mes.',
    includes: ['Todo el Plan Base', 'Plan de marketing', '2 reels y 2 carruseles por semana', 'Web y catálogo', 'Google Business Profile', 'Reporte mensual', 'Tope de 16 horas al mes: tú grabas; yo hago guion, edición y reporte'],
    excludes: ['Pauta publicitaria', 'Grabación en terreno'],
  },
  escalar: {
    id: 'escalar', name: 'Plan Escalar', line: 'contenido', setup: 990_000, monthly: 690_000, limited: true, page: '/marketing-digital',
    summary: 'Crecer + más contenido, automatización de mensajes y CRM.',
    includes: ['Todo el Plan Crecer', '3 reels y 3 carruseles por semana', 'Automatización de DM y WhatsApp', 'CRM configurado', 'Reunión mensual de resultados', 'Tope de 24 horas al mes'],
    excludes: ['Pauta publicitaria', 'Grabación en terreno'],
  },
  campanas: {
    id: 'campanas', name: 'Gestión de campañas Meta', line: 'contenido', setup: 120_000, monthly: 190_000, page: '/marketing-digital',
    summary: 'Campañas en Instagram y Facebook medidas desde el primer día.',
    includes: ['Estrategia de campaña', 'Creatividades', 'Públicos', 'Optimización continua', 'Reporte de costo por contacto'],
    excludes: ['La pauta: la pagas tú directo a Meta'],
  },
  starter: {
    id: 'starter', name: 'Agente Starter', line: 'automatizacion', setup: 590_000, monthly: 89_000, page: '/consultor-ia',
    summary: 'Un agente de IA con tu catálogo que atiende, vende y agenda en un canal.',
    includes: ['Un agente con tu catálogo en WhatsApp o Instagram', 'Atiende, vende y agenda', 'Deriva a una persona cuando corresponde', 'Mantención, ajustes y reporte mensual'],
    excludes: ['Cuentas de IA, Cloudflare y WhatsApp: van a tu nombre y se pagan aparte (aprox. $5.000–30.000/mes)'],
  },
  combo: {
    id: 'combo', name: 'Campaña + agente', line: 'automatizacion', setup: 790_000, monthly: 259_000, star: true, page: '/consultor-ia',
    compareMonthly: 89_000 + 190_000, compareNote: 'Agente $89.000 + campañas $190.000',
    summary: 'La campaña trae la consulta; tu agente la responde en minutos, la califica y agenda.',
    includes: ['Gestión de campañas Meta', 'Agente de IA en WhatsApp o Instagram', 'El agente responde, califica y agenda', 'Reporte mensual de costo por contacto'],
    excludes: ['La pauta: la pagas tú directo a Meta', 'Cuentas de IA y WhatsApp a tu nombre (costo aparte)'],
  },
  consultoria: {
    id: 'consultoria', name: 'Consultoría IA por fases', line: 'automatizacion', setup: 1_500_000, monthly: null, from: true, page: '/consultor-ia',
    setupLabel: 'desde $1.500.000 por fase', monthlyLabel: 'según alcance',
    summary: 'Flujos, agentes integrados e IA para el equipo en empresas medianas.',
    includes: ['Método de 7 pasos con piloto acotado', 'Flujos y agentes integrados a tus herramientas', 'IA para el equipo', 'Documentación y capacitación'],
  },
  web: {
    id: 'web', name: 'Mantención web', line: 'otro', setup: null, monthly: 40_000,
    summary: 'Tu sitio al día sin preocuparte.',
    includes: ['Hosting, dominio y SSL', 'Respaldos y monitoreo', '1 hora de cambios al mes'],
  },
} satisfies Record<string, Plan>;

export type PlanId = keyof typeof PLANES;

/** Orden de las tarjetas: en contenido, de menor a mayor. En automatización, la estrella al medio. */
export const CONTENIDO_ORDER: PlanId[] = ['base', 'crecer', 'escalar'];
export const AUTOMATIZACION_ORDER: PlanId[] = ['starter', 'combo', 'consultoria'];

/** Precio de lanzamiento: 3 primeros clientes de Agente Starter o Campaña + agente. Edita `left` cuando se ocupe un cupo. */
export const LAUNCH = { total: 3, left: 3, discount: 20, months: 6 } as const;

export const DIAGNOSTICO = {
  minutes: 30,
  summary: 'Conversación de 30 minutos, por videollamada o presencial en la Región de Valparaíso, para entender tu caso y llevarte 3 oportunidades concretas.',
  excludes: 'No incluye informe escrito.',
} as const;

/** Tiempos de respuesta comerciales */
export const RESPUESTA = {
  reply: 'Respondo en menos de 2 horas hábiles',
  proposal: 'Propuesta en 48 horas después del diagnóstico',
} as const;

/** Condiciones comerciales (se muestran en /planes y /terminos) */
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
    url: 'https://juandelagua.com/planes',
    offers:
      offers.length > 1
        ? { '@type': 'AggregateOffer', priceCurrency: 'CLP', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: offers.length, offers }
        : offers[0],
  };
};
