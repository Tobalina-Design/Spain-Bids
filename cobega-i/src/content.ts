export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'activo', label: 'El contexto' },
  { id: 'propuesta', label: 'La propuesta' },
  { id: 'escenarios', label: 'El modelo' },
  { id: 'ficha', label: 'Ficha' },
  { id: 'cierre', label: 'Cierre' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const HERO = {
  eyebrow: 'Propuesta para PATRIZIA · Sant Martí, Barcelona',
  title: 'COBEGA I',
  lead: 'Como un reloj de precisión, cada equipo tiene su función. Juntos, sincronizan la desinversión para maximizar el valor de PATRIZIA.',
};

export const ACTIVO = {
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
};

export const PROPUESTA = {
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
};

export const ESCENARIOS = {
  eyebrow: '03 · El modelo Savills',
  title: 'Tres equipos. Una sola cadencia.',
  body: 'Un reloj no funciona si una pieza falla. Capital Markets, Property Management y Residential Sales trabajan en sincronía, in-house, bajo un único interlocutor.',
  items: [
    { k: 'Capital Markets', v: 'Estrategia de desinversión, valoración y acceso a inversores institucionales.' },
    { k: 'Property Management', v: 'Gestión operativa del activo y de la comunidad de propietarios durante el proceso.' },
    { k: 'Residential Sales', v: 'Comercialización de las viviendas con ritmo, criterio y seguimiento continuo.' },
  ],
  note: 'Un único interlocutor para PATRIZIA a lo largo de toda la operación.',
};

export const FICHA = {
  eyebrow: '04 · Ficha de la propuesta',
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
};

export const CIERRE = {
  eyebrow: '05 · Cierre',
  title: 'Cuando todas las piezas encajan, el resultado es exacto.',
  line: 'Un único interlocutor, una única estrategia y un objetivo común: maximizar el valor para PATRIZIA.',
  foot: 'Cobega I · Propuesta confidencial para PATRIZIA · 2026',
};
