export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'activo', label: 'El activo' },
  { id: 'propuesta', label: 'La propuesta' },
  { id: 'escenarios', label: 'Escenarios' },
  { id: 'ficha', label: 'Ficha' },
  { id: 'cierre', label: 'Cierre' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const HERO = {
  eyebrow: 'Propuesta para PATRIZIA · Sant Martí, Barcelona',
  title: 'COBEGA I',
  lead: 'Un edificio que pasa del alquiler a la venta sin que PATRIZIA pierda el control de ninguna decisión.',
};

export const ACTIVO = {
  eyebrow: '01 · El activo',
  title: 'Un propietario hoy. Muchos mañana.',
  body: [
    'Cobega I es un edificio residencial en Sant Martí que deja el alquiler para venderse vivienda a vivienda.',
    'Cada venta suma un propietario a la comunidad y reparte un poco más las decisiones. Nuestra propuesta empieza ahí: que ese reparto no le quite a PATRIZIA el control del activo.',
  ],
  facts: [
    { k: 'Ubicación', v: 'Sant Martí, Barcelona' },
    { k: 'Hoy', v: 'Alquiler (BTR)' },
    { k: 'Estrategia', v: 'Venta por viviendas (BTS)' },
    { k: 'Marco', v: 'Ley de Vivienda 12/2023' },
  ],
};

export const PROPUESTA = {
  eyebrow: '02 · La propuesta',
  title: 'Seis compromisos que funcionan juntos.',
  steps: [
    {
      name: 'Transparencia',
      title: 'PATRIZIA lo ve todo, siempre.',
      body: 'Una carta de transparencia deja por escrito qué hacemos, qué no hacemos y cuándo se lo contamos. Sin sorpresas en ninguna reunión.',
    },
    {
      name: 'Rentabilidad',
      title: 'Cada venta, medida antes de firmarla.',
      body: 'Un modelo financiero con tres escenarios muestra el efecto de cada vivienda vendida en el NOI y en el VAN del activo.',
    },
    {
      name: 'Riesgos',
      title: 'Los puntos débiles, a la vista.',
      body: 'Hemos revisado Cobega I a fondo y lo hemos puesto por escrito en «Lo que vemos en Cobega I». Mejor conocer hoy lo que puede fallar.',
    },
    {
      name: 'Ritmo y normativa',
      title: 'Una vivienda tras otra, con orden.',
      body: 'Los plazos, los derechos de tanteo y la Ley de Vivienda 12/2023 marcan el calendario. La prisa no.',
    },
    {
      name: 'Decisión',
      title: 'Las reglas, escritas antes de empezar.',
      body: 'ASSET SOVEREIGN™ define qué aprueba PATRIZIA, qué gestionamos nosotros y en qué momento. Cuando lleguen los nuevos propietarios, cada uno sabrá cuál es su papel.',
    },
    {
      name: 'Inversores y día a día',
      title: 'LPs informados y un edificio que funciona.',
      body: 'Informes periódicos con criterio INREV para los inversores, y una gestión diaria de la comunidad y de cada comprador que no quita tiempo a lo importante.',
    },
  ],
};

export const ESCENARIOS = {
  eyebrow: '03 · Escenarios',
  title: 'Tres ritmos para un mismo edificio.',
  body: 'Cada escenario tiene su calendario y su resultado esperado. PATRIZIA elige con los tres delante.',
  items: [
    { k: 'Prudente', v: 'Menos viviendas por trimestre y más margen para reaccionar al mercado.' },
    { k: 'Base', v: 'Un ritmo de venta sostenido, alineado con la demanda del barrio.' },
    { k: 'Ambicioso', v: 'Más velocidad de venta, con los controles de decisión reforzados.' },
  ],
  note: 'Cifras y calendario de cada escenario en el modelo financiero.',
};

export const FICHA = {
  eyebrow: '04 · Ficha de la propuesta',
  title: 'Lo que recibe PATRIZIA.',
  rows: [
    { k: 'Activo', v: 'Cobega I, edificio residencial en Sant Martí, Barcelona' },
    { k: 'Transición', v: 'Del alquiler (BTR) a la venta por viviendas (BTS)' },
    { k: 'Gobernanza', v: 'ASSET SOVEREIGN™: reglas de decisión, aprobaciones y plazos' },
    { k: 'Transparencia', v: 'Carta de compromisos por escrito' },
    { k: 'Análisis', v: 'Documento «Lo que vemos en Cobega I»' },
    { k: 'Modelo financiero', v: 'Tres escenarios con impacto en NOI y VAN' },
    { k: 'Reporting', v: 'Informes periódicos a LPs con criterio INREV' },
    { k: 'Normativa', v: 'Ley de Vivienda 12/2023 y normativa catalana (DOGC)' },
    { k: 'Gestión diaria', v: 'Comunidad de propietarios y atención al comprador' },
  ],
};

export const CIERRE = {
  eyebrow: '05 · Cierre',
  title: 'Cuando se venda la última vivienda, la decisión seguirá siendo de PATRIZIA.',
  line: 'Vender pisos es fácil. Lo difícil es seguir mandando.',
  foot: 'Cobega I · Propuesta confidencial para PATRIZIA · 2026',
};
