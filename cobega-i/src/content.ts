export type Lang = 'es' | 'en';

/* Los ids son comunes a los dos idiomas; el motor de scroll solo usa los ids */
export const SECTIONS = [
  { id: 'inicio' },
  { id: 'activo' },
  { id: 'propuesta' },
  { id: 'escenarios' },
  { id: 'marketing' },
  { id: 'app' },
  { id: 'ficha' },
  { id: 'cierre' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

type Step = { name: string; title: string; body: string };
type Pair = { k: string; v: string };

export type Copy = {
  htmlLang: string;
  docTitle: string;
  timeLocale: string;
  sections: Record<SectionId, string>;
  ui: {
    loading: string;
    brandSub: string;
    backTop: string;
    sectionsAria: string;
    explode: string;
    assemble: string;
    index: string;
    close: string;
    start: string;
    cue: string;
    goTo: string;
    clockCity: string;
    langAria: string;
    glFallback: string;
  };
  hero: { eyebrow: string; title: string; lead: string };
  activo: { eyebrow: string; title: string; body: string[]; facts: Pair[] };
  propuesta: { eyebrow: string; title: string; steps: Step[] };
  escenarios: { eyebrow: string; title: string; body: string; items: Pair[]; note: string };
  marketing: { eyebrow: string; title: string; lead: string; phases: { tag: string; name: string; aud: string; items: Pair[] }[]; foot: string };
  app: {
    eyebrow: string; title: string; lead: string; demo: string; open: string;
    kpi: { sold: string; price: string; months: string; leads: string };
    phaseLabel: string; phases: { name: string; aud: string }[];
    paceLabel: string; paces: string[];
    dec: { title: string; rows: string[]; lot: string; abs: string[]; recs: string[]; risks: string[] };
    approve: string; approveLast: string; gate: string;
    curve: string; plan: string; forecast: string; units: string; mo: string; today: string;
    feedTitle: string; feed: string[][]; approved: string; unitWord: string;
  };
  ficha: { eyebrow: string; title: string; rows: Pair[] };
  cierre: { eyebrow: string; title: string; line: string; foot: string };
};

const ES: Copy = {
  htmlLang: 'es',
  docTitle: 'Cobega I · Propuesta para PATRIZIA',
  timeLocale: 'es-ES',
  sections: {
    inicio: 'Inicio',
    activo: 'La pregunta',
    propuesta: 'El sistema',
    escenarios: 'La prueba',
    marketing: 'Marketing',
    app: 'Cobega Live',
    ficha: 'Resumen',
    cierre: 'Cierre',
  },
  ui: {
    loading: 'Cargando',
    brandSub: 'Para PATRIZIA',
    backTop: 'Volver al inicio',
    sectionsAria: 'Secciones',
    explode: 'Despiece',
    assemble: 'Montar',
    index: 'Índice',
    close: 'Cerrar',
    start: 'Volver al inicio',
    cue: 'Desliza para descubrir',
    goTo: 'Ir a',
    clockCity: 'Barcelona',
    langAria: 'Idioma',
    glFallback: 'Este navegador no puede mostrar el reloj en 3D. El contenido está completo abajo.',
  },
  hero: {
    eyebrow: 'Propuesta para PATRIZIA · Sant Martí, Barcelona',
    title: 'COBEGA I',
    lead: '¿Cómo se maximiza el valor de 225 viviendas cuando casi nueve de cada diez siguen ocupadas? No vendiendo más rápido: vendiendo en el orden correcto.',
  },
  activo: {
    eyebrow: '01 · La pregunta',
    title: 'Cobega I no son 225 transacciones. Es una sola estrategia de valor.',
    body: [
      'Casi nueve de cada diez viviendas siguen ocupadas. Por eso el primer problema no es vender producto: es controlar cuándo ese producto estará disponible.',
      'Cada unidad está conectada con ocupación, renta, disponibilidad, comprador, precio, absorción y riesgo. El valor no depende solo del precio: depende de la secuencia.',
    ],
    facts: [
        { k: 'Viviendas', v: '225' },
        { k: 'Ocupación', v: '~90 %' },
        { k: 'Ecuación', v: 'Precio × Timing × Disponibilidad × Absorción' },
        { k: 'Decisiones', v: 'Qué · Cuándo · A quién · Precio · Después' },
    ],
  },
  propuesta: {
    eyebrow: '02 · El sistema',
    title: 'Seis piezas. Un único sistema de decisión.',
    steps: [
      { name: 'Operación', title: 'La venta empieza antes de que la unidad llegue al mercado.', body: 'Property Management no es soporte: es información anticipada. Ocupación, vencimientos, renovaciones e incidencias llegan a Residential preparados, documentados y con fecha prevista.' },
      { name: 'Demanda', title: 'Cada comprador nos enseña algo sobre la siguiente venta.', body: 'Residential Sales no mide actividad, mide aprendizaje: leads, visitas, reservas, objeciones y absorción. Todo vuelve al sistema.' },
      { name: 'Decisión', title: 'No decidimos cuánto vender. Decidimos qué maximiza el valor total.', body: 'Capital Markets decide desde el portfolio: liberar, retener, reposicionar, incentivar o esperar, protegiendo el resultado agregado, la flexibilidad y la velocidad de recuperación de capital.' },
      { name: 'Ciclo', title: 'Detectar. Decidir. Ejecutar. Medir.', body: 'Cada unidad tiene un estado operativo, una señal de demanda, una decisión de precio y un responsable. Y se vuelve al principio.' },
      { name: 'Fuente única', title: 'Una sola fuente de verdad.', body: 'Prinex, Power BI, reporting y decisión: visión global, información integrada, trazabilidad, menor incertidumbre y mayor opcionalidad.' },
      { name: 'Gobierno', title: 'Control es saber qué decisión hay que tomar.', body: 'Comité operativo semanal (leads, reservas, absorción, pricing, disponibilidad) y comité de dirección mensual (resultado, escenario, riesgos, phasing). Sin cajas negras.' },
    ],
  },
  escenarios: {
    eyebrow: '03 · La prueba',
    title: 'Precedentes, no promesas.',
    body: 'No partimos de cero. Casos comparables en ocupación, complejidad operativa, sensibilidad reputacional y venta unidad a unidad: sabemos mantener un activo bajo control mientras se vende.',
    items: [
        { k: 'Avenida Barcelona 111', v: 'Activo ocupado, 126 unidades, 100 % sell-out.' },
        { k: 'Barcelona-2', v: '244 unidades con inquilinos, 80 % de recuperación de capital en tres años.' },
        { k: 'SkyPark', v: 'Más de 60 unidades comprometidas en cinco meses, con ajuste positivo frente al asking inicial.' },
        { k: 'AXA', v: 'Privatización con ajustes de pricing durante la comercialización.' },
    ],
    note: 'Evidencia comparable: situación, actuación, resultado.',
  },
  marketing: {
    eyebrow: '04 · Marketing',
    title: 'Cada comprador, su oportunidad. No 225 viviendas.',
    lead: 'Marketing por oleadas, tipologías y segmentos, con mensajes diferenciados. Cada campaña genera demanda y genera información para mejorar la siguiente decisión comercial.',
    phases: [
      { tag: 'Fase 0', name: 'Preparar', aud: 'Para ambas audiencias', items: [
        { k: 'Contenido', v: 'web, vídeo y tour 3D' },
        { k: 'Dossier', v: 'uno por audiencia' },
        { k: 'Cobega Live', v: 'CRM único y app de control' },
      ] },
      { tag: 'Fase 1', name: 'Inquilinos', aud: 'Primero, sin presión', items: [
        { k: 'Trato personal', v: 'carta y reunión' },
        { k: 'Acceso privado', v: 'su vivienda, precio y simulador de cuota' },
        { k: 'Ayuda para comprar', v: 'hipoteca con acuerdos bancarios' },
      ] },
      { tag: 'Fase 2', name: 'Inversores', aud: 'Preventa discreta', items: [
        { k: 'Preventa discreta', v: 'vacías, red Savills y LinkedIn' },
        { k: 'Visita virtual y data room', v: 'tour 3D, contratos, rentas y planos' },
        { k: 'Seguimiento en directo', v: 'informe a la propiedad' },
      ] },
      { tag: 'Fase 3', name: 'Lanzamiento', aud: 'Inquilinos + inversores', items: [
        { k: 'Portales, RRSS y prensa', v: 'tour 3D, dossier y enlace a la web' },
        { k: 'Puertas abiertas', v: 'vivienda piloto + tour 3D' },
        { k: 'Oleadas de precio', v: 'el stock restante, tramo a tramo' },
      ] },
    ],
    foot: 'La demanda también se gestiona: sin lanzamientos masivos y sin urgencia artificial.',
  },
  app: {
    eyebrow: '05 · Cobega Live',
    title: 'Aquí se ve el control.',
    lead: 'Una sola pantalla: qué decisión toca, con qué datos, quién la recomienda y quién la aprueba. Patrizia decide: mantener, ajustar o posponer.',
    demo: 'Demo · datos ilustrativos',
    open: 'En directo',
    kpi: { sold: 'Vendidas', price: 'Precio vs. objetivo', months: 'Meses al cierre', leads: 'Visitas 3D · 7 d' },
    phaseLabel: 'Fase activa',
    phases: [
      { name: 'Preparar', aud: 'Contenido y dossier' },
      { name: 'Inquilinos', aud: 'Primero, sin presión' },
      { name: 'Inversores', aud: 'Preventa discreta' },
      { name: 'Lanzamiento', aud: 'Mercado, por oleadas' },
    ],
    paceLabel: 'Decisión PATRIZIA',
    paces: ['Posponer', 'Mantener', 'Ajustar'],
    dec: {
      title: 'Decisión requerida',
      rows: ['Unidad / lote', 'Absorción vs. escenario', 'Pricing actual', 'Recomendación Savills', 'Impacto', 'Riesgo'],
      lot: 'Bloque B · 12 viviendas libres',
      abs: ['{n} viv. bajo el escenario', 'en línea con el escenario', '{n} viv. sobre el escenario'],
      recs: ['Cerrar dossier y preparar la primera oleada', 'Mantener precio y abrir a inquilinos', 'Mantener y abrir preventa a inversores', 'Mantener y liberar la siguiente oleada'],
      risks: ['Pérdida de impulso comercial', 'Bajo', 'Referencia de precio a la baja'],
    },
    approve: 'Aprobar oleada',
    approveLast: 'Última fase en curso',
    gate: 'Aprobación PATRIZIA',
    curve: 'Ventas acumuladas',
    plan: 'Plan',
    forecast: 'Previsión',
    units: 'viv.',
    mo: 'meses',
    today: 'hoy',
    feedTitle: 'Actividad',
    unitWord: 'Vivienda',
    approved: 'PATRIZIA aprueba la oleada · pasa a',
    feed: [
      ['Dossier inversor publicado', 'Tour 3D de la vivienda piloto listo', 'Cobega Live conectado al CRM'],
      ['Carta entregada · reunión agendada', 'Simulador de cuota abierto', 'Reserva de inquilino', 'Hipoteca preaprobada'],
      ['Acceso al data room', 'Reserva · preventa de vacía', 'Visita virtual completada', 'Oferta de bloque recibida'],
      ['Nuevo contacto desde portales', 'Visita a la jornada de puertas abiertas', 'Reserva en oleada abierta', 'Pico de visitas tras campaña'],
    ],
  },
  ficha: {
    eyebrow: '06 · La recompensa',
    title: 'Anticipar. Liberar. Fijar el precio. Decidir.',
    rows: [
        { k: 'Por qué', v: 'Maximizar valor sin sacrificar control, ingresos ni flexibilidad' },
        { k: 'Idea central', v: 'No vender más rápido. Vender en el orden correcto' },
        { k: 'Sistema', v: 'Capital Markets + Residential Sales + Property Management, una sola lógica de decisión' },
        { k: 'Fuente de verdad', v: 'Prinex → Power BI → reporting → decisión' },
        { k: 'Gobierno', v: 'Comité operativo semanal + comité de dirección mensual' },
        { k: 'Resultado', v: 'Visión global, trazabilidad, menor incertidumbre y mayor opcionalidad' },
    ],
  },
  cierre: {
    eyebrow: '07 · Cierre',
    title: 'Control the decisions. Maximise the value.',
    line: 'Patrizia aporta el activo y define la ambición. Savills aporta el sistema que convierte ocupación, demanda y riesgo en decisiones coordinadas. En Cobega I, maximizar valor no es vender primero: es decidir mejor.',
    foot: 'Cobega I · Propuesta confidencial para PATRIZIA · 2026',
  },
};

const EN: Copy = {
  htmlLang: 'en',
  docTitle: 'Cobega I · Proposal for PATRIZIA',
  timeLocale: 'en-GB',
  sections: {
    inicio: 'Home',
    activo: 'The question',
    propuesta: 'The system',
    escenarios: 'The proof',
    marketing: 'Marketing',
    app: 'Cobega Live',
    ficha: 'Summary',
    cierre: 'Closing',
  },
  ui: {
    loading: 'Loading',
    brandSub: 'For PATRIZIA',
    backTop: 'Back to top',
    sectionsAria: 'Sections',
    explode: 'Explode',
    assemble: 'Assemble',
    index: 'Index',
    close: 'Close',
    start: 'Back to start',
    cue: 'Scroll to explore',
    goTo: 'Go to',
    clockCity: 'Barcelona',
    langAria: 'Language',
    glFallback: 'This browser cannot display the 3D watch. The full content is below.',
  },
  hero: {
    eyebrow: 'Proposal for PATRIZIA · Sant Martí, Barcelona',
    title: 'COBEGA I',
    lead: 'How do you maximise the value of 225 homes when nearly nine in ten are still occupied? Not by selling faster: by selling in the right order.',
  },
  activo: {
    eyebrow: '01 · The question',
    title: 'Cobega I is not 225 transactions. It is a single value strategy.',
    body: [
      'Nearly nine in ten homes are still occupied. So the first problem is not selling product: it is controlling when that product becomes available.',
      'Every unit is tied to occupancy, rent, availability, buyer, price, absorption and risk. Value does not depend on price alone: it depends on sequence.',
    ],
    facts: [
        { k: 'Homes', v: '225' },
        { k: 'Occupancy', v: '~90%' },
        { k: 'Equation', v: 'Price × Timing × Availability × Absorption' },
        { k: 'Decisions', v: 'What · When · To whom · Price · What next' },
    ],
  },
  propuesta: {
    eyebrow: '02 · The system',
    title: 'Six pieces. One decision system.',
    steps: [
      { name: 'Operations', title: 'The sale starts before the unit reaches the market.', body: 'Property Management is not support: it is early information. Occupancy, expiries, renewals and incidents reach Residential prepared, documented and with an expected date.' },
      { name: 'Demand', title: 'Every buyer teaches us something about the next sale.', body: 'Residential Sales does not measure activity, it measures learning: leads, viewings, reservations, objections and absorption. Everything flows back into the system.' },
      { name: 'Decision', title: 'We don\'t decide how much to sell. We decide what maximises total value.', body: 'Capital Markets decides from the portfolio: release, hold, reposition, incentivise or wait, protecting the aggregate result, flexibility and speed of capital recovery.' },
      { name: 'Cycle', title: 'Detect. Decide. Execute. Measure.', body: 'Every unit has an operating status, a demand signal, a pricing decision and an owner. And the cycle starts again.' },
      { name: 'Single source', title: 'One source of truth.', body: 'Prinex, Power BI, reporting and decision: global view, integrated information, traceability, less uncertainty and more optionality.' },
      { name: 'Governance', title: 'Control is knowing which decision to take.', body: 'Weekly operational committee (leads, reservations, absorption, pricing, availability) and monthly steering committee (result, scenario, risks, phasing). No black boxes.' },
    ],
  },
  escenarios: {
    eyebrow: '03 · The proof',
    title: 'Precedents, not promises.',
    body: 'We\'re not starting from zero. Comparable cases in occupancy, operational complexity, reputational sensitivity and unit-by-unit sales: we know how to keep an asset under control while it is being sold.',
    items: [
        { k: 'Avenida Barcelona 111', v: 'Occupied asset, 126 units, 100% sell-out.' },
        { k: 'Barcelona-2', v: '244 units with tenants, 80% capital recovery in three years.' },
        { k: 'SkyPark', v: '60+ units committed in five months, with a positive adjustment over the initial asking price.' },
        { k: 'AXA', v: 'Privatisation with pricing adjustments during marketing.' },
    ],
    note: 'Comparable evidence: situation, action, result.',
  },
  marketing: {
    eyebrow: '04 · Marketing',
    title: 'Every buyer, their opportunity. Not 225 homes.',
    lead: 'Marketing by waves, typologies and segments, with differentiated messages. Every campaign generates demand and generates information to improve the next commercial decision.',
    phases: [
      { tag: 'Phase 0', name: 'Prepare', aud: 'For both audiences', items: [
        { k: 'Content', v: 'website, video and 3D tour' },
        { k: 'Dossier', v: 'one per audience' },
        { k: 'Cobega Live', v: 'single CRM and control app' },
      ] },
      { tag: 'Phase 1', name: 'Tenants', aud: 'First, no pressure', items: [
        { k: 'Personal approach', v: 'letter and meeting' },
        { k: 'Private access', v: 'their home, price and instalment simulator' },
        { k: 'Help to buy', v: 'mortgage with bank agreements' },
      ] },
      { tag: 'Phase 2', name: 'Investors', aud: 'Discreet pre-sale', items: [
        { k: 'Discreet pre-sale', v: 'vacant units, Savills network and LinkedIn' },
        { k: 'Virtual visit and data room', v: '3D tour, contracts, rents and plans' },
        { k: 'Live follow-up', v: 'report to the owner' },
      ] },
      { tag: 'Phase 3', name: 'Launch', aud: 'Tenants + investors', items: [
        { k: 'Portals, social and press', v: '3D tour, dossier and web link' },
        { k: 'Open house', v: 'show flat + 3D tour' },
        { k: 'Price waves', v: 'remaining stock, tranche by tranche' },
      ] },
    ],
    foot: 'Demand is managed too: no mass launches and no artificial urgency.',
  },
  app: {
    eyebrow: '05 · Cobega Live',
    title: 'This is where control shows.',
    lead: 'One screen: which decision is due, with what data, who recommends it and who approves it. PATRIZIA decides: keep, adjust or postpone.',
    demo: 'Demo · illustrative data',
    open: 'Live',
    kpi: { sold: 'Sold', price: 'Price vs. target', months: 'Months to close', leads: '3D visits · 7 d' },
    phaseLabel: 'Active phase',
    phases: [
      { name: 'Prepare', aud: 'Content and dossier' },
      { name: 'Tenants', aud: 'First, no pressure' },
      { name: 'Investors', aud: 'Discreet pre-sale' },
      { name: 'Launch', aud: 'Market, in waves' },
    ],
    paceLabel: 'PATRIZIA decision',
    paces: ['Postpone', 'Keep', 'Adjust'],
    dec: {
      title: 'Decision required',
      rows: ['Unit / lot', 'Absorption vs. scenario', 'Current pricing', 'Savills recommendation', 'Impact', 'Risk'],
      lot: 'Block B · 12 vacant homes',
      abs: ['{n} units below scenario', 'in line with scenario', '{n} units above scenario'],
      recs: ['Close the dossier and prepare the first wave', 'Keep price and open to tenants', 'Keep and open pre-sale to investors', 'Keep and release the next wave'],
      risks: ['Loss of commercial momentum', 'Low', 'Lower price reference'],
    },
    approve: 'Approve wave',
    approveLast: 'Final phase under way',
    gate: 'PATRIZIA approval',
    curve: 'Cumulative sales',
    plan: 'Plan',
    forecast: 'Forecast',
    units: 'units',
    mo: 'months',
    today: 'today',
    feedTitle: 'Activity',
    unitWord: 'Unit',
    approved: 'PATRIZIA approves the wave · moving to',
    feed: [
      ['Investor dossier published', '3D tour of the show flat ready', 'Cobega Live linked to the CRM'],
      ['Letter delivered · meeting booked', 'Mortgage simulator opened', 'Tenant reservation', 'Mortgage pre-approved'],
      ['Data room access', 'Reservation · vacant unit pre-sale', 'Virtual visit completed', 'Block offer received'],
      ['New lead from portals', 'Open-house visit', 'Reservation in open wave', 'Visit spike after campaign'],
    ],
  },
  ficha: {
    eyebrow: '06 · The reward',
    title: 'Anticipate. Release. Price. Decide.',
    rows: [
        { k: 'Why', v: 'Maximise value without sacrificing control, income or flexibility' },
        { k: 'Big idea', v: 'Not selling faster. Selling in the right order' },
        { k: 'System', v: 'Capital Markets + Residential Sales + Property Management, one decision logic' },
        { k: 'Source of truth', v: 'Prinex → Power BI → reporting → decision' },
        { k: 'Governance', v: 'Weekly operational committee + monthly steering committee' },
        { k: 'Outcome', v: 'Global view, traceability, less uncertainty and more optionality' },
    ],
  },
  cierre: {
    eyebrow: '07 · Closing',
    title: 'Control the decisions. Maximise the value.',
    line: 'PATRIZIA brings the asset and sets the ambition. Savills brings the system that turns occupancy, demand and risk into coordinated decisions. At Cobega I, maximising value is not selling first: it is deciding better.',
    foot: 'Cobega I · Confidential proposal for PATRIZIA · 2026',
  },
};

export const COPY: Record<Lang, Copy> = { es: ES, en: EN };

const KEY = 'cobega-lang';

/* Idioma inicial: ?lang= en el enlace > el último elegido > español */
export function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'es') return q;
  } catch { /* sin URL */ }
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === 'en' || s === 'es') return s;
  } catch { /* sin almacenamiento */ }
  return 'es';
}

export function saveLang(l: Lang) {
  try { window.localStorage.setItem(KEY, l); } catch { /* sin almacenamiento */ }
}
