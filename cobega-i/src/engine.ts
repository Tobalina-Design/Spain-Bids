import Lenis from 'lenis';
import { Stage, type SceneState } from './scene/Stage';
import { SECTIONS, type SectionId } from './content';

const TAU = Math.PI * 2;

/* ---------- guion de la presentación ----------
   Sección "La propuesta" (altura fija en CSS):
   0 ─ INTRO: el reloj se abre (despiece) · INTRO ─ OUTRO: 6 pasos, uno por idea · OUTRO ─ 1: el reloj se cierra */
const STEPS = 6;
const INTRO = 0.14;
const OUTRO = 0.9;

/* Estados del reloj por sección */
const S: Record<string, SceneState> = {
  hero:   { rx: -0.12, ry: -0.42,      rz: 0.06,  dist: 13.5, sx: 0.24,  sy: 0.03,  E: 0, br: 1 },
  activo: { rx: -0.3,  ry: 0.78,       rz: -0.12, dist: 14,   sx: -0.24, sy: -0.22, E: 0, br: 1 },
  p0:     { rx: -0.95, ry: 0.5,        rz: 0.28,  dist: 27,   sx: 0.2,  sy: -0.19, E: 0, br: 1 },
  p3:     { rx: -0.45, ry: 1.9,        rz: 0.1,   dist: 16,   sx: 0.02,  sy: -0.2,  E: 0, br: 1 },
  esc:    { rx: -0.28, ry: Math.PI - 0.75, rz: -0.05, dist: 13.8, sx: -0.24, sy: -0.22, E: 0, br: 1 },
  app:    { rx: -0.2,  ry: TAU - 1.2,  rz: 0.03,  dist: 15,   sx: 0.3,   sy: -0.3,  E: 0, br: 1 },
  ficha:  { rx: -0.2,  ry: TAU - 0.55, rz: 0.05,  dist: 15,   sx: 0.32,  sy: -0.3,  E: 0, br: 1 },
  cierre: { rx: -0.06, ry: TAU - 0.22, rz: 0.02,  dist: 12.5, sx: 0.23,  sy: -0.12, E: 0, br: 1 },
};

/* Una pose por paso: el despiece gira despacio entre paradas, nunca de golpe */
const STEP_RX = [-0.95, -0.94, -0.9, -0.86, -0.82, -0.78];
const STEP_RY = [0.5, 0.64, 0.78, 0.92, 1.04, 1.16];
const STEP_POSE: SceneState[] = STEP_RX.map((rx, i) => ({
  rx, ry: STEP_RY[i], rz: 0.28 - i * 0.02, dist: 27, sx: 0.2, sy: -0.19, E: 1, br: 0,
}));

type Anchor = { y: number; s: SceneState; dimMobile: number; dimDesk?: number };
type Stop = { y: number; id?: string; step?: number };

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export type EngineCallbacks = {
  onStep: (i: number) => void;
  onSection: (id: SectionId) => void;
  onReady: () => void;
};

export function createEngine(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
  const stage = new Stage(canvas, S.hero);
  const reduce = stage.reduce;
  const lenis = reduce ? null : new Lenis({ lerp: 0.06, wheelMultiplier: 0.7, touchMultiplier: 1, smoothWheel: true });

  let anchors: Anchor[] = [];
  let stops: Stop[] = [];
  let sticky = { start: 0, len: 1 };
  let vh = window.innerHeight;
  let step = -1;
  let section: SectionId = 'inicio';
  let dim = 1;

  /* navegación */
  let cursor = 0;          // parada en la que está la presentación
  let traveling = false;   // hay un desplazamiento automático en curso
  let targetIdx = 0;
  let armed = false;       // se ha movido la rueda: al parar, se ajusta a la parada más cercana
  let lastScroll = 0;
  let lastDir = 1;
  let coolUntil = 0;       // pausa tras cada salto: la inercia del trackpad no cuenta como otro gesto

  const el = (id: string) => document.getElementById(id);
  const center = (id: string) => {
    const e = el(id);
    if (!e) return 0;
    return e.offsetTop + e.offsetHeight / 2 - vh / 2;
  };
  const stepY = (i: number) => sticky.start + sticky.len * (INTRO + ((i + 0.5) / STEPS) * (OUTRO - INTRO));

  function measure() {
    vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = el('propuesta');
    sticky = p ? { start: p.offsetTop, len: Math.max(1, p.offsetHeight - vh) } : { start: 0, len: 1 };
    const ficha = el('ficha');
    const fichaTop = ficha ? ficha.offsetTop - vh * 0.35 : max;

    const app = el('app');
    const appTop = app ? app.offsetTop : max;
    const appBot = app ? app.offsetTop + app.offsetHeight : max;
    const list: Anchor[] = [
      { y: 0, s: S.hero, dimMobile: 1 },
      { y: center('activo'), s: S.activo, dimMobile: 1 },
      { y: sticky.start, s: S.p0, dimMobile: 1 },
      { y: sticky.start + sticky.len * INTRO, s: STEP_POSE[0], dimMobile: 1 },
      ...STEP_POSE.map((s, i) => ({ y: stepY(i), s, dimMobile: 1 })),
      { y: sticky.start + sticky.len * OUTRO, s: STEP_POSE[STEPS - 1], dimMobile: 1 },
      { y: sticky.start + sticky.len, s: S.p3, dimMobile: 1 },
      { y: center('escenarios'), s: S.esc, dimMobile: 1 },
      { y: appTop - vh * 0.4, s: S.esc, dimMobile: 0.18, dimDesk: 1 },
      { y: center('app'), s: S.app, dimMobile: 0.18, dimDesk: 0.1 },
      { y: appBot - vh * 0.6, s: S.app, dimMobile: 0.18, dimDesk: 0.1 },
      { y: fichaTop, s: S.ficha, dimMobile: 0.18 },
      { y: center('ficha'), s: S.ficha, dimMobile: 0.18 },
      { y: max, s: S.cierre, dimMobile: 1 },
    ];
    anchors = [];
    let lastY = -Infinity;
    for (const a of list) {
      const y = Math.min(max, Math.max(0, a.y));
      if (y > lastY + 1) { anchors.push({ ...a, y }); lastY = y; }
    }

    /* paradas de la presentación: una por idea */
    const raw: Stop[] = [
      { y: 0, id: 'inicio' },
      { y: center('activo'), id: 'activo' },
      ...Array.from({ length: STEPS }, (_, i) => ({ y: stepY(i), step: i, id: i === 0 ? 'propuesta' : undefined })),
      { y: center('escenarios'), id: 'escenarios' },
      { y: center('app'), id: 'app' },
      { y: center('ficha'), id: 'ficha' },
      { y: max, id: 'cierre' },
    ];
    stops = [];
    lastY = -Infinity;
    for (const s of raw) {
      const y = Math.min(max, Math.max(0, s.y));
      if (y > lastY + 4) { stops.push({ ...s, y }); lastY = y; }
    }
    cursor = nearest(window.scrollY);
  }

  function nearest(y: number) {
    let b = 0;
    for (let i = 1; i < stops.length; i++) if (Math.abs(stops[i].y - y) < Math.abs(stops[b].y - y)) b = i;
    return b;
  }

  function sample(y: number) {
    const dd = (a: Anchor) => (stage.mobile ? a.dimMobile : a.dimDesk ?? 1);
    if (y <= anchors[0].y) return { s: anchors[0].s, dm: dd(anchors[0]) };
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      if (y <= b.y) {
        const t = easeInOut((y - a.y) / (b.y - a.y));
        const s = {} as SceneState;
        (Object.keys(a.s) as (keyof SceneState)[]).forEach((k) => { s[k] = a.s[k] + (b.s[k] - a.s[k]) * t; });
        return { s, dm: dd(a) + (dd(b) - dd(a)) * t };
      }
    }
    const l = anchors[anchors.length - 1];
    return { s: l.s, dm: dd(l) };
  }

  /* ---------- desplazamiento a una parada ---------- */
  function travel(i: number) {
    i = clamp(i, 0, stops.length - 1);
    targetIdx = i;
    const y = stops[i].y;
    armed = false;
    if (!lenis) {
      window.scrollTo({ top: y });
      cursor = i;
      return;
    }
    traveling = true;
    const dist = Math.abs(y - window.scrollY) / vh;
    lenis.scrollTo(y, {
      duration: clamp(1.15 + dist * 0.55, 1.9, 3.6),
      easing: easeInOutCubic,
      lock: true,
      force: true,
      onComplete: () => {
        traveling = false;
        cursor = targetIdx;
        armed = false;
        coolUntil = performance.now() + 550;
      },
    });
  }

  function go(delta: number) {
    const base = traveling ? targetIdx : cursor;
    const n = clamp(base + delta, 0, stops.length - 1);
    if (n === base && !traveling) return;
    travel(n);
  }

  /* Al parar la rueda dentro de la presentación: un gesto = una parada */
  const snapOn = () => !stage.mobile && !reduce;
  function settle() {
    if (!snapOn() || !stops.length) { cursor = nearest(window.scrollY); return; }
    const y = window.scrollY;
    const firstStep = stops.findIndex((s) => s.step === 0);
    const escIdx = stops.findIndex((s) => s.id === 'app');
    const zoneA = stops[firstStep].y - vh * 1.4;
    const zoneB = stops[escIdx].y + 2;
    if (y < zoneA || y > zoneB) { cursor = nearest(y); return; }
    const near = nearest(y);
    if (Math.abs(stops[near].y - y) < 3) { cursor = near; return; }
    const from = clamp(cursor, 0, stops.length - 1);
    const to = clamp(from + (lastDir >= 0 ? 1 : -1), 0, stops.length - 1);
    const a = stops[from].y, b = stops[to].y;
    const frac = b === a ? 0 : (y - a) / (b - a);
    let pick = near;
    if (frac > 0.05 && frac < 1.5) pick = to;
    else if (frac <= 0.05 && frac > -0.3) pick = from;
    travel(pick);
  }

  /* el reloj de pared manda: se mide con los eventos de rueda, no con los fotogramas */
  const onWheel = (e: WheelEvent) => {
    const now = performance.now();
    if (traveling || now < coolUntil || e.ctrlKey) return;
    lastScroll = now;
    armed = true;
    if (e.deltaY) lastDir = e.deltaY > 0 ? 1 : -1;
  };
  window.addEventListener('wheel', onWheel, { passive: true });
  lenis?.on('scroll', (l: Lenis) => {
    const now = performance.now();
    if (traveling || now < coolUntil) return;
    lastScroll = now;
    armed = true;
    if (Math.abs(l.velocity) > 0.05) lastDir = l.direction || lastDir;
  });

  stage.onBeforeFrame = (now, dt) => {
    lenis?.raf(now);
    if (armed && !traveling && performance.now() - lastScroll > 260 && Math.abs(lenis?.velocity ?? 0) < 0.08) {
      armed = false;
      settle();
    }
    const y = window.scrollY;
    const { s, dm } = sample(y);
    stage.target = s;

    const k = reduce ? 1 : 1 - Math.exp(-dt * 3);
    dim += (dm - dim) * k;
    canvas.style.opacity = dim.toFixed(3);

    const p = (y - sticky.start) / sticky.len;
    const inProp = p > INTRO - 0.01 && p < OUTRO + 0.01;
    stage.focusTarget = inProp ? 1 : 0;
    const st = clamp(Math.floor(((p - INTRO) / (OUTRO - INTRO)) * STEPS), 0, STEPS - 1);
    if (st !== step) {
      step = st;
      stage.focusStep = st;
      cb.onStep(st);
    }

    const mid = y + vh * 0.5;
    let cur: SectionId = 'inicio';
    for (const sec of SECTIONS) {
      const e = el(sec.id);
      if (e && e.offsetTop <= mid) cur = sec.id;
    }
    if (cur !== section) { section = cur; cb.onSection(cur); }
  };

  stage.onFirstFrame = cb.onReady;

  /* teclado: flechas, AvPág/RePág, espacio y los mandos de presentación */
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!el('menu')?.hidden) return;
    const t = e.target as HTMLElement | null;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    let d = 0;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown': d = 1; break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp': d = -1; break;
      case ' ': if (t && t.tagName === 'BUTTON') return; d = e.shiftKey ? -1 : 1; break;
      case 'Home': e.preventDefault(); if (!e.repeat) travel(0); return;
      case 'End': e.preventDefault(); if (!e.repeat) travel(stops.length - 1); return;
      default: return;
    }
    e.preventDefault();
    if (e.repeat) return;
    go(d);
  };
  window.addEventListener('keydown', onKey);

  measure();
  const ro = new ResizeObserver(() => measure());
  ro.observe(document.body);
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  stage.start();

  const stopIndex = (id: string) => stops.findIndex((s) => s.id === id);

  return {
    stage,
    scrollTo(id: string) {
      const i = stopIndex(id);
      if (i >= 0) { travel(i); return; }
      const e = el(id);
      if (!e) return;
      if (lenis) lenis.scrollTo(e, { duration: 2.6, easing: easeInOutCubic });
      else window.scrollTo({ top: e.offsetTop });
    },
    scrollToStep(i: number) {
      const k = stops.findIndex((s) => s.step === i);
      if (k >= 0) travel(k);
    },
    next() { go(1); },
    prev() { go(-1); },
    setExploded(v: boolean) { stage.exploded = v; },
    stop() { lenis?.stop(); },
    resume() { lenis?.start(); },
    destroy() {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      lenis?.destroy();
      stage.dispose();
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
