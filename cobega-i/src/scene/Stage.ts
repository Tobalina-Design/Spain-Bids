import * as THREE from 'three';
import { Watch, type LayerKey } from './Watch';

export type SceneState = {
  rx: number; ry: number; rz: number;
  dist: number;
  sx: number; // desplazamiento horizontal en escritorio (fracción del ancho)
  sy: number; // desplazamiento vertical en móvil (fracción del alto)
  E: number;  // despiece 0..1
  br: number; // brazalete visible 0..1
};

export const FOCUS: LayerKey[][] = [
  ['crystal'],
  ['train'],
  ['plate', 'bridges'],
  ['balance'],
  ['hands', 'dial'],
  ['rotor', 'caseback'],
];

const KEYS: (keyof SceneState)[] = ['rx', 'ry', 'rz', 'dist', 'sx', 'sy', 'E', 'br'];

function buildEnv(renderer: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x030303);
  const add = (w: number, h: number, p: [number, number, number], k: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), side: THREE.DoubleSide }),
    );
    m.position.set(...p);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  add(2.2, 20, [-8, 1, 6], 3.6);
  add(1.6, 20, [9, -1, 4], 2.4);
  add(16, 2.4, [0, 10, 5], 2.6);
  add(6, 6, [2, 3, 12], 1.4);
  add(14, 8, [0, 0, -12], 0.5);
  add(22, 2, [0, -9, 2], 0.8);
  add(10, 12, [-11, -3, -3], 1.1);
  add(10, 12, [11, 3, -3], 0.9);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return tex;
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(28, 1, 0.1, 400);
  watch = new Watch();
  W = 1; H = 1;
  mobile = false;
  target: SceneState;
  cur: SceneState;
  focusStep = -1;
  focusTarget = 0;
  focusW = 0;
  exploded = false;
  explodeW = 0;
  pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  reduce: boolean;
  private last = performance.now();
  private raf = 0;
  onFirstFrame?: () => void;
  private first = true;

  constructor(canvas: HTMLCanvasElement, initial: SceneState) {
    this.reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let r: THREE.WebGLRenderer;
    try {
      r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    }
    this.renderer = r;
    /* si algún material avanzado no compila en este dispositivo, se simplifican todos */
    r.debug.onShaderError = () => { this.simplify(); };
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setClearColor(0x000000, 0);
    this.scene.environment = buildEnv(this.renderer);
    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(-4, 6, 8);
    this.scene.add(key);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    this.scene.add(this.watch.root);
    this.target = { ...initial };
    this.cur = { ...initial };
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    /* la firma de la esfera usa una serif web: se redibuja cuando llega */
    const refresh = () => this.watch.refreshTextures();
    const loadFonts = () => {
      if (!document.fonts?.load) return;
      Promise.all(['600 80px "Cormorant Garamond"', '500 80px "Cormorant Garamond"'].map((f) => document.fonts.load(f)))
        .then(refresh).catch(() => {});
    };
    document.fonts?.ready.then(refresh);
    [0, 1200, 3500].forEach((ms) => setTimeout(loadFonts, ms));
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.pointer.x = (e.clientX / this.W) * 2 - 1;
    this.pointer.y = (e.clientY / this.H) * 2 - 1;
  };

  resize = () => {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.mobile = this.W < 900;
    /* presupuesto de píxeles: evita lienzos que el navegador rechaza (iOS) */
    const rh = Math.min(this.H, 4096);
    const budget = this.mobile ? 2.4e6 : 5e6;
    const dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, this.mobile ? 1.6 : 1.8, Math.sqrt(budget / (this.W * rh))));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.W, rh, false);
    this.camera.aspect = this.W / this.H;
  };

  private simplified = false;
  simplify() {
    if (this.simplified) return;
    this.simplified = true;
    this.watch.root.traverse((o) => {
      const mm = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | THREE.MeshPhysicalMaterial[] | undefined;
      for (const m of mm ? (Array.isArray(mm) ? mm : [mm]) : []) {
        if (!m.isMeshPhysicalMaterial) continue;
        m.anisotropy = 0;
        m.anisotropyMap = null;
        m.clearcoat = 0;
        m.sheen = 0;
        m.transmission = 0;
        m.needsUpdate = true;
      }
    });
  }

  start() {
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    this.renderer.dispose();
  }

  onBeforeFrame?: (now: number, dt: number) => void;

  private frame(now: number) {
    const dt = Math.min(0.08, (now - this.last) / 1000);
    this.onBeforeFrame?.(now, dt);
    this.last = now;
    /* amortiguación lenta: el reloj siempre llega tarde y suave al estado del scroll */
    const snap = this.reduce || (window as unknown as { __SNAP?: boolean }).__SNAP === true;
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.4);
    const kFast = snap ? 1 : 1 - Math.exp(-dt * 4);

    this.explodeW += ((this.exploded ? 1 : 0) - this.explodeW) * k;
    for (const key of KEYS) this.cur[key] += (this.target[key] - this.cur[key]) * k;
    this.focusW += (this.focusTarget - this.focusW) * kFast;

    const c = this.cur;
    const ew = this.explodeW;
    const E = Math.max(c.E, ew);
    const rx = c.rx + (-0.95 - c.rx) * ew * (1 - c.E);
    const ry = c.ry + (0.62 - c.ry) * ew * (1 - c.E);
    const dist = c.dist + (18.5 - c.dist) * ew * (1 - c.E);
    const br = Math.min(c.br, 1 - ew * 0.9);

    /* parallax del ratón, muy leve */
    this.pointer.sx += (this.pointer.x - this.pointer.sx) * kFast * 0.6;
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * kFast * 0.6;
    const px = this.mobile || this.reduce ? 0 : this.pointer.sx;
    const py = this.mobile || this.reduce ? 0 : this.pointer.sy;

    const w = this.watch;
    w.root.rotation.set(rx + py * 0.06, ry + px * 0.1, c.rz);

    /* despiece escalonado */
    const ease = (t: number) => t * t * (3 - 2 * t);
    for (const L of Object.values(w.layers)) {
      const loc = Math.min(1, Math.max(0, E * 1.3 - L.d * 0.3));
      L.group.position.z = L.base + (L.ex - L.base) * ease(loc);
    }
    w.inner.position.z = -w.exMid * ease(Math.min(1, E));

    /* foco sobre la pieza de cada paso */
    const f = this.focusW * Math.min(1, E * 1.4);
    const focused = this.focusStep >= 0 ? FOCUS[this.focusStep] : [];
    for (const L of Object.values(w.layers)) {
      const isF = focused.includes(L.key);
      let tgt = isF ? 1 + 0.12 * f : 1 - 0.6 * f;
      if (L.key === 'case') tgt = 1 - 0.45 * f;
      L.bright += (tgt - L.bright) * kFast;
      const op = L.key === 'bracelet' ? br : 1;
      for (const r of L.mats) {
        r.m.color.copy(r.base).multiplyScalar(L.bright);
        if ('envMapIntensity' in r.m) r.m.envMapIntensity = r.env * (0.25 + 0.75 * Math.min(1, L.bright));
        if (L.key === 'bracelet') {
          const t = op < 0.995;
          if (r.m.transparent !== t) { r.m.transparent = t; r.m.needsUpdate = true; }
          r.m.opacity = op;
          r.m.depthWrite = op > 0.5;
        }
      }
      if (L.key === 'bracelet') L.group.visible = op > 0.02;
    }

    /* movimiento propio */
    const t = now / 1000;
    w.setTime(new Date());
    for (const s of w.spinners) s.o.rotation.z += s.w * dt;
    w.balance.rotation.z = Math.sin(t * 6.3) * 0.9;
    w.fork.rotation.z = Math.sin(t * 6.3 + 1.3) * 0.1;
    w.rotor.rotation.z = Math.sin(t * 0.4) * 0.7 + t * 0.05;

    /* cámara: encuadre según pantalla */
    const aspect = this.W / this.H;
    const refAspect = this.mobile ? 1.3 : 1.5;
    const fit = aspect < refAspect ? refAspect / aspect : 1;
    const d = dist * (this.mobile ? Math.max(fit, 1.9) : Math.max(1, fit * 0.92));
    this.camera.position.set(0, 0, d);
    this.camera.lookAt(0, 0, 0);
    const ox = this.mobile ? 0 : c.sx * this.W;
    const oy = this.mobile ? c.sy * this.H : 0;
    this.camera.setViewOffset(this.W, this.H, -ox, -oy, this.W, this.H);
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
    if (this.first) {
      this.first = false;
      this.onFirstFrame?.();
    }
  }
}
