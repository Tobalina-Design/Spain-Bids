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
    activo: 'El contexto',
    propuesta: 'La propuesta',
    escenarios: 'El modelo',
    marketing: 'Marketing',
    app: 'Cobega Live',
    ficha: 'Ficha',
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
    lead: 'Como un reloj de precisión, cada equipo tiene su función. Juntos, sincronizan la desinversión para maximizar el valor de PATRIZIA.',
  },
  activo: {
    eyebrow: '01 · El contexto',
    title: 'Barcelona: 90.000 viviendas de déficit.',
    body: [
      'Barcelona registra un déficit estimado de más de 90.000 viviendas, lo que mantiene una elevada presión sobre los precios y una intensa competencia por la oferta disponible.',
      'Para aprovechar plenamente este contexto, no basta con poner los activos en el mercado. Es necesario diseñar una estrategia integral que combine comercialización eficiente, gestión operativa alineada y coordinación constante entre todos los equipos implicados.',
    ],
    facts: [
      { k: 'Ubicación', v: 'Sant Martí, Barcelona' },
      { k: 'Déficit estimado', v: '+90.000 viviendas' },
      { k: 'Estrategia', v: 'Desinversión maximizada' },
      { k: 'Unidades gestionadas', v: '+4.500 Savills' },
    ],
  },
  propuesta: {
    eyebrow: '02 · La propuesta',
    title: 'Seis piezas. Un único mecanismo.',
    steps: [
      {
        name: 'Información',
        title: 'Datos fiables en tiempo real.',
        body: 'Un inversor institucional como PATRIZIA necesita información fiable, transparente y en tiempo real que facilite la toma de decisiones durante todo el proceso. Sin esperas, sin opacidad.',
      },
      {
        name: 'Coordinación',
        title: 'Todos los equipos. Un solo modelo.',
        body: 'La coordinación entre Property Management, Residential Sales y Capital Markets se convierte en un factor clave para garantizar una ejecución eficiente y maximizar el valor de la operación.',
      },
      {
        name: 'Reporting',
        title: 'Transparencia institucional.',
        body: 'Reporting institucional de calidad con criterio INREV para los inversores. Seguimiento continuo de la operación con total transparencia en cada fase del proceso.',
      },
      {
        name: 'Tecnología',
        title: 'Plataforma propia. Ventaja real.',
        body: 'Savills ha desarrollado una plataforma tecnológica propia que proporciona reporting en tiempo real, total transparencia y un seguimiento continuo de la operación. Datos accionables cuando se necesitan.',
      },
      {
        name: 'Escala',
        title: 'Experiencia que se mide en números.',
        body: 'Más de 4.500 unidades residenciales gestionadas y comercializadas, y 6.000 unidades residenciales bajo privatización. Savills aporta la escala, experiencia y capacidad necesarias.',
      },
      {
        name: 'Socio estratégico',
        title: 'Más allá de la venta.',
        body: 'Un equipo senior con mucha experiencia que no solo acompaña a PATRIZIA en la venta de los activos, sino que actúa como socio estratégico capaz de coordinar todo el proceso de creación de valor.',
      },
    ],
  },
  escenarios: {
    eyebrow: '03 · El modelo Savills',
    title: 'Tres equipos. Una sola cadencia.',
    body: 'Un reloj no funciona si una pieza falla. Capital Markets, Property Management y Residential Sales trabajan en sincronía, in-house, bajo un único interlocutor.',
    items: [
      { k: 'Capital Markets', v: 'Estrategia de desinversión, valoración y acceso a inversores institucionales.' },
      { k: 'Property Management', v: 'Gestión operativa del activo y de la comunidad de propietarios durante el proceso.' },
      { k: 'Residential Sales', v: 'Comercialización de las viviendas con ritmo, criterio y seguimiento continuo.' },
    ],
    note: 'Un único interlocutor para PATRIZIA a lo largo de toda la operación.',
  },
  marketing: {
    eyebrow: '04 · Marketing',
    title: 'Marketing a medida del activo. Y del propietario.',
    lead: '225 viviendas, 90 % ocupadas, de alquiler a venta. Vender caro sin tensionar al inquilino exige orden: cuatro fases, cada una con su audiencia.',
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
    foot: 'Cada fase, medida y controlada en directo con Cobega Live.',
  },
  app: {
    eyebrow: '05 · Cobega Live',
    title: 'Su activo, en directo. Y bajo su control.',
    lead: 'La estrategia de marketing, fase a fase, en una app: PATRIZIA ve cada venta, ajusta el ritmo y aprueba cada oleada antes de que salga al mercado.',
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
    paceLabel: 'Ritmo de venta',
    paces: ['Prudente', 'Plan', 'Acelerado'],
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
    eyebrow: '06 · Ficha de la propuesta',
    title: 'Una solución integral.',
    rows: [
      { k: 'Activo', v: 'Cobega I, dos activos residenciales en Barcelona' },
      { k: 'Objetivo', v: 'Maximizar el valor de la desinversión' },
      { k: 'Comercialización', v: 'Estrategia eficiente con Residential Sales' },
      { k: 'Gestión operativa', v: 'Property Management alineado con la venta' },
      { k: 'Coordinación', v: 'Capital Markets + PM + Residential Sales in-house' },
      { k: 'Reporting', v: 'Tiempo real, criterio INREV, total transparencia' },
      { k: 'Plataforma', v: 'Tecnología propia Savills para seguimiento continuo' },
      { k: 'Unidades gestionadas', v: '+4.500 residenciales gestionadas y comercializadas' },
      { k: 'Privatizaciones', v: '+6.000 unidades residenciales bajo privatización' },
    ],
  },
  cierre: {
    eyebrow: '07 · Cierre',
    title: 'Cuando todas las piezas encajan, el resultado es exacto.',
    line: 'Un único interlocutor, una única estrategia y un objetivo común: maximizar el valor para PATRIZIA.',
    foot: 'Cobega I · Propuesta confidencial para PATRIZIA · 2026',
  },
};

const EN: Copy = {
  htmlLang: 'en',
  docTitle: 'Cobega I · Proposal for PATRIZIA',
  timeLocale: 'en-GB',
  sections: {
    inicio: 'Home',
    activo: 'The context',
    propuesta: 'The proposal',
    escenarios: 'The model',
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
    lead: 'Like a precision watch, every team has its function. Together, they synchronise the divestment to maximise value for PATRIZIA.',
  },
  activo: {
    eyebrow: '01 · The context',
    title: 'Barcelona: a shortfall of 90,000 homes.',
    body: [
      'Barcelona has an estimated shortfall of more than 90,000 homes, which keeps strong pressure on prices and fierce competition for the stock available.',
      'To make the most of this context, simply bringing the assets to market is not enough. It takes an integrated strategy that combines efficient sales, aligned property operations and constant coordination between every team involved.',
    ],
    facts: [
      { k: 'Location', v: 'Sant Martí, Barcelona' },
      { k: 'Estimated shortfall', v: '90,000+ homes' },
      { k: 'Strategy', v: 'Maximised divestment' },
      { k: 'Units managed', v: '4,500+ by Savills' },
    ],
  },
  propuesta: {
    eyebrow: '02 · The proposal',
    title: 'Six pieces. One mechanism.',
    steps: [
      {
        name: 'Information',
        title: 'Reliable data, in real time.',
        body: 'An institutional investor like PATRIZIA needs reliable, transparent, real-time information to support decision-making throughout the process. No waiting, no opacity.',
      },
      {
        name: 'Coordination',
        title: 'Every team. One model.',
        body: 'Coordination between Property Management, Residential Sales and Capital Markets is a key factor in delivering efficient execution and maximising the value of the transaction.',
      },
      {
        name: 'Reporting',
        title: 'Institutional transparency.',
        body: 'High-quality institutional reporting to INREV standards for investors. Continuous monitoring of the transaction, with full transparency at every stage of the process.',
      },
      {
        name: 'Technology',
        title: 'Proprietary platform. A real edge.',
        body: 'Savills has developed its own technology platform, delivering real-time reporting, full transparency and continuous monitoring of the transaction. Actionable data when it is needed.',
      },
      {
        name: 'Scale',
        title: 'Experience measured in numbers.',
        body: 'More than 4,500 residential units managed and sold, and 6,000 residential units under privatisation. Savills brings the scale, experience and capability required.',
      },
      {
        name: 'Strategic partner',
        title: 'Beyond the sale.',
        body: 'A highly experienced senior team that not only supports PATRIZIA in selling the assets, but acts as a strategic partner able to coordinate the entire value-creation process.',
      },
    ],
  },
  escenarios: {
    eyebrow: '03 · The Savills model',
    title: 'Three teams. One cadence.',
    body: 'A watch stops if one piece fails. Capital Markets, Property Management and Residential Sales work in sync, in-house, under a single point of contact.',
    items: [
      { k: 'Capital Markets', v: 'Divestment strategy, valuation and access to institutional investors.' },
      { k: 'Property Management', v: 'Day-to-day operation of the asset and the owners’ community throughout the process.' },
      { k: 'Residential Sales', v: 'Sales of the homes with pace, judgement and continuous follow-up.' },
    ],
    note: 'A single point of contact for PATRIZIA throughout the transaction.',
  },
  marketing: {
    eyebrow: '04 · Marketing',
    title: 'Marketing tailored to the asset. And to the owner.',
    lead: '225 homes, 90% occupied, moving from rental to sale. Selling high without pressuring tenants takes sequence: four phases, each with its own audience.',
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
    foot: 'Every phase, measured and controlled live with Cobega Live.',
  },
  app: {
    eyebrow: '05 · Cobega Live',
    title: 'Your asset, live. And under your control.',
    lead: 'The marketing strategy, phase by phase, in one app: PATRIZIA sees every sale, tunes the pace and approves each wave before it reaches the market.',
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
    paceLabel: 'Sales pace',
    paces: ['Prudent', 'Plan', 'Accelerated'],
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
    eyebrow: '06 · Proposal summary',
    title: 'An integrated solution.',
    rows: [
      { k: 'Asset', v: 'Cobega I, two residential assets in Barcelona' },
      { k: 'Objective', v: 'Maximise the value of the divestment' },
      { k: 'Sales', v: 'Efficient strategy with Residential Sales' },
      { k: 'Operations', v: 'Property Management aligned with the sale' },
      { k: 'Coordination', v: 'Capital Markets + PM + Residential Sales, all in-house' },
      { k: 'Reporting', v: 'Real time, INREV standard, full transparency' },
      { k: 'Platform', v: 'Proprietary Savills technology for continuous monitoring' },
      { k: 'Units managed', v: '4,500+ residential units managed and sold' },
      { k: 'Privatisations', v: '6,000+ residential units under privatisation' },
    ],
  },
  cierre: {
    eyebrow: '07 · Closing',
    title: 'When every piece fits, the result is exact.',
    line: 'One point of contact, one strategy and a shared goal: to maximise value for PATRIZIA.',
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
