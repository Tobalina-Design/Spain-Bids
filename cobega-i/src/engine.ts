import Lenis from 'lenis';
import { Stage, type SceneState } from './scene/Stage';
import { SECTIONS, type SectionId } from './content';

const TAU = Math.PI * 2;

/* Estados del reloj por sección */
const S: Record<string, SceneState> = {
  hero:   { rx: -0.12, ry: -0.42,      rz: 0.06,  dist: 13.5, sx: 0.24,  sy: 0.03,  E: 0, br: 1 },
  activo: { rx: -0.3,  ry: 0.78,       rz: -0.12, dist: 14,   sx: -0.24, sy: -0.22, E: 0, br: 1 },
  p0:     { rx: -0.95, ry: 0.5,        rz: 0.28,  dist: 27,   sx: 0.2,  sy: -0.19, E: 0, br: 1 },
  p1:     { rx: -0.95, ry: 0.62,       rz: 0.28,  dist: 27,   sx: 0.2,  sy: -0.19, E: 1, br: 0 },
  p2:     { rx: -0.8,  ry: 1.1,        rz: 0.3,   dist: 27,   sx: 0.2,  sy: -0.19, E: 1, br: 0 },
  p3:     { rx: -0.45, ry: 1.9,        rz: 0.1,   dist: 16,   sx: 0.02,  sy: -0.2,  E: 0, br: 1 },
  esc:    { rx: -0.28, ry: Math.PI - 0.75, rz: -0.05, dist: 13.8, sx: -0.24, sy: -0.22, E: 0, br: 1 },
  ficha:  { rx: -0.2,  ry: TAU - 0.55, rz: 0.05,  dist: 15,   sx: 0.32,  sy: -0.3,  E: 0, br: 1 },
  cierre: { rx: -0.06, ry: TAU - 0.22, rz: 0.02,  dist: 12.5, sx: 0.23,  sy: -0.12, E: 0, br: 1 },
};

type Anchor = { y: number; s: SceneState; dimMobile: number };

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export type EngineCallbacks = {
  onStep: (i: number) => void;
  onSection: (id: SectionId) => void;
  onReady: () => void;
};

export function createEngine(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
  const stage = new Stage(canvas, S.hero);
  const reduce = stage.reduce;
  const lenis = reduce ? null : new Lenis({ lerp: 0.06, wheelMultiplier: 0.75, touchMultiplier: 1, smoothWheel: true });

  let anchors: Anchor[] = [];
  let sticky = { start: 0, len: 1 };
  let vh = window.innerHeight;
  let step = -1;
  let section: SectionId = 'inicio';
  let dim = 1;

  const el = (id: string) => document.getElementById(id);
  const center = (id: string) => {
    const e = el(id);
    if (!e) return 0;
    return e.offsetTop + e.offsetHeight / 2 - vh / 2;
  };

  function measure() {
    vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = el('propuesta');
    sticky = p ? { start: p.offsetTop, len: Math.max(1, p.offsetHeight - vh) } : { start: 0, len: 1 };
    const ficha = el('ficha');
    const fichaTop = ficha ? ficha.offsetTop - vh * 0.35 : max;
    const list: Anchor[] = [
      { y: 0, s: S.hero, dimMobile: 1 },
      { y: center('activo'), s: S.activo, dimMobile: 1 },
      { y: sticky.start, s: S.p0, dimMobile: 1 },
      { y: sticky.start + sticky.len * 0.14, s: S.p1, dimMobile: 1 },
      { y: sticky.start + sticky.len * 0.86, s: S.p2, dimMobile: 1 },
      { y: sticky.start + sticky.len, s: S.p3, dimMobile: 1 },
      { y: center('escenarios'), s: S.esc, dimMobile: 1 },
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
  }

  function sample(y: number) {
    if (y <= anchors[0].y) return { s: anchors[0].s, dm: anchors[0].dimMobile };
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      if (y <= b.y) {
        const t = easeInOut((y - a.y) / (b.y - a.y));
        const s = {} as SceneState;
        (Object.keys(a.s) as (keyof SceneState)[]).forEach((k) => { s[k] = a.s[k] + (b.s[k] - a.s[k]) * t; });
        return { s, dm: a.dimMobile + (b.dimMobile - a.dimMobile) * t };
      }
    }
    const l = anchors[anchors.length - 1];
    return { s: l.s, dm: l.dimMobile };
  }

  stage.onBeforeFrame = (now, dt) => {
    lenis?.raf(now);
    const y = window.scrollY;
    const { s, dm } = sample(y);
    stage.target = s;

    const k = reduce ? 1 : 1 - Math.exp(-dt * 3);
    dim += ((stage.mobile ? dm : 1) - dim) * k;
    canvas.style.opacity = dim.toFixed(3);

    const p = (y - sticky.start) / sticky.len;
    const inProp = p > 0.08 && p < 0.92;
    stage.focusTarget = inProp ? 1 : 0;
    const st = Math.min(5, Math.max(0, Math.floor(((p - 0.08) / 0.84) * 6)));
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

  measure();
  const ro = new ResizeObserver(() => measure());
  ro.observe(document.body);
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  stage.start();

  return {
    stage,
    scrollTo(id: string) {
      const e = el(id);
      if (!e) return;
      if (lenis) lenis.scrollTo(e, { duration: 2.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: e.offsetTop });
    },
    scrollToStep(i: number) {
      const y = sticky.start + sticky.len * (0.08 + ((i + 0.5) / 6) * 0.84);
      if (lenis) lenis.scrollTo(y, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: y });
    },
    setExploded(v: boolean) { stage.exploded = v; },
    stop() { lenis?.stop(); },
    resume() { lenis?.start(); },
    destroy() {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      lenis?.destroy();
      stage.dispose();
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
