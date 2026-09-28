import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  sunburstAniso, dialBase, drawDialPrint, drawRehaut, perlage, cotes, drawRotorText,
} from './textures';

/* Reloj procedural. Eje del reloj = Z, la esfera mira hacia +Z. 1 unidad ≈ 10 mm. */

export type LayerKey =
  | 'crystal' | 'hands' | 'dial' | 'case' | 'bracelet'
  | 'plate' | 'train' | 'balance' | 'bridges' | 'rotor' | 'caseback';

type MatRec = { m: THREE.MeshStandardMaterial; base: THREE.Color; env: number; op: number };

export type Layer = {
  key: LayerKey;
  group: THREE.Group;
  base: number; // z montado
  ex: number;   // z en despiece
  d: number;    // orden de salida 0..1
  mats: MatRec[];
  bright: number;
};

const TAU = Math.PI * 2;

/* ---------- materiales ---------- */
function polished(hex = 0xdadcdf, rough = 0.07) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, clearcoat: 0.25, clearcoatRoughness: 0.05 });
}
function brushed(hex = 0xc3c6ca, rough = 0.3, rot = 0) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, anisotropy: 0.75, anisotropyRotation: rot });
}
function gilt(rough = 0.22) {
  return new THREE.MeshPhysicalMaterial({ color: 0xc2a36e, metalness: 1, roughness: rough });
}
function ruby() {
  return new THREE.MeshPhysicalMaterial({ color: 0x8a0f1c, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.4, sheenColor: new THREE.Color(0xff5a6a) });
}

/* ---------- geometrías ---------- */
function zcyl(r: number, h: number, seg = 64) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  return g;
}
function lathe(pts: [number, number][], seg = 160) {
  const g = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  return g;
}
function resample(pts: [number, number][], n: number) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l);
    total += l;
  }
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / (n - 1)) * total;
    let i = 0;
    while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const t = Math.min(1, d / segs[i]);
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
  }
  return out;
}
/* Bisel estriado (alternativa) */
export function flutedBezel(flutes = 60) {
  const prof = resample([[1.985, 0.3], [2.0, 0.42], [1.95, 0.56], [1.84, 0.63], [1.73, 0.61], [1.675, 0.52], [1.67, 0.42]], 28);
  const P = prof.length;
  const S = flutes * 10;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nrm2 = prof.map((_p, i) => {
    const a = prof[Math.max(0, i - 1)];
    const b = prof[Math.min(P - 1, i + 1)];
    const dr = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dr, dz) || 1;
    return [dz / l, -dr / l];
  });
  for (let s = 0; s <= S; s++) {
    const th = (s / S) * TAU;
    const f = 1 - 2 * Math.abs(((th * flutes) / TAU) % 1 - 0.5);
    for (let j = 0; j < P; j++) {
      const w = Math.sin((j / (P - 1)) * Math.PI) ** 1.4;
      const disp = 0.05 * (f - 0.5) * w;
      const r = prof[j][0] + nrm2[j][0] * disp;
      const z = prof[j][1] + nrm2[j][1] * disp;
      pos.push(Math.cos(th) * r, Math.sin(th) * r, z);
      uv.push(s / S, j / (P - 1));
    }
  }
  for (let s = 0; s < S; s++) {
    for (let j = 0; j < P - 1; j++) {
      const a = s * P + j, b = (s + 1) * P + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function gearGeo(n: number, r: number, depth: number, o: { root?: number; hole?: number; spokes?: number } = {}) {
  const s = new THREE.Shape();
  const ri = r * (o.root ?? 0.87);
  const st = TAU / n;
  const prof: [number, number][] = [[ri, 0], [r, 0.22], [r, 0.44], [ri, 0.66]];
  for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) {
    const a = i * st + prof[j][1] * st;
    const x = Math.cos(a) * prof[j][0], y = Math.sin(a) * prof[j][0];
    if (i === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const hr = o.hole ?? r * 0.1;
  if (hr > 0) { const h = new THREE.Path(); h.absarc(0, 0, hr, 0, TAU, true); s.holes.push(h); }
  const nh = o.spokes ?? 5;
  for (let k = 0; k < nh; k++) {
    const b = ((k + 0.5) / nh) * TAU;
    const p = new THREE.Path();
    p.absarc(Math.cos(b) * r * 0.52, Math.sin(b) * r * 0.52, r * 0.2, 0, TAU, true);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function capsule(a: [number, number], b: [number, number], r: number, depth: number) {
  const s = new THREE.Shape();
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  s.absarc(a[0], a[1], r, ang + Math.PI / 2, ang + Math.PI * 1.5, false);
  s.absarc(b[0], b[1], r, ang - Math.PI / 2, ang + Math.PI / 2, false);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 28 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function spiral(rin: number, rout: number, turns: number, tube: number, segs = 320) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, a = t * turns * TAU, r = rin + (rout - rin) * t;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs * 2, tube, 5, false);
}
/* Aguja facetada tipo dauphine */
function dauphine(L: number, w: number, tail: number, h: number, base = 0.012) {
  const y1 = L * 0.16;
  const outline = new THREE.Shape();
  outline.moveTo(0, -tail); outline.lineTo(w, y1); outline.lineTo(0, L); outline.lineTo(-w, y1); outline.closePath();
  const plate = new THREE.ExtrudeGeometry(outline, { depth: base, bevelEnabled: false }).toNonIndexed();
  const T = [0, -tail, base + h * 0.6], Tip = [0, L, base + h * 0.25];
  const Lf = [-w, y1, base], Rf = [w, y1, base];
  const Tb = [0, -tail, base], Tipb = [0, L, base];
  const tri = [
    ...T, ...Tip, ...Lf,
    ...T, ...Rf, ...Tip,
    ...Tb, ...T, ...Lf,
    ...Tb, ...Rf, ...T,
    ...Tipb, ...Lf, ...Tip,
    ...Tipb, ...Tip, ...Rf,
  ];
  const top = new THREE.BufferGeometry();
  top.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  top.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((tri.length / 3) * 2).fill(0), 2));
  top.computeVertexNormals();
  plate.deleteAttribute('normal');
  plate.computeVertexNormals();
  return [plate, top];
}

/* ---------- construcción ---------- */
export class Watch {
  root = new THREE.Group();   // rotación general
  inner = new THREE.Group();  // centrado del despiece
  layers: Record<LayerKey, Layer> = {} as Record<LayerKey, Layer>;
  hands = { h: new THREE.Group(), m: new THREE.Group(), s: new THREE.Group() };
  spinners: { o: THREE.Object3D; w: number }[] = [];
  balance = new THREE.Group();
  fork = new THREE.Group();
  rotor = new THREE.Group();
  private printTex: THREE.CanvasTexture | null = null;
  private rehautTex: THREE.CanvasTexture | null = null;
  private rotorTex: THREE.CanvasTexture | null = null;
  exMid = 0;

  constructor() {
    this.root.add(this.inner);
    this.build();
    const exs = Object.values(this.layers).map((l) => l.ex);
    this.exMid = (Math.max(...exs) + Math.min(...exs)) / 2;
  }

  private layer(key: LayerKey, base: number, ex: number, d: number) {
    const group = new THREE.Group();
    group.position.z = base;
    this.inner.add(group);
    const l: Layer = { key, group, base, ex, d, mats: [], bright: 1 };
    this.layers[key] = l;
    return l;
  }
  private add(key: LayerKey, geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, pos: [number, number, number] = [0, 0, 0], parent?: THREE.Object3D) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    (parent ?? this.layers[key].group).add(mesh);
    const L = this.layers[key];
    if (!L.mats.some((r) => r.m === mat)) {
      L.mats.push({ m: mat, base: mat.color.clone(), env: mat.envMapIntensity ?? 1, op: mat.opacity });
    }
    return mesh;
  }

  refreshTextures() {
    drawDialPrint(this.printTex);
    drawRehaut(this.rehautTex);
    drawRotorText(this.rotorTex);
  }

  private build() {
    const PB: [number, number] = [-0.95, -0.2], PC: [number, number] = [0, 0], PT: [number, number] = [0.42, 0.62];
    const PF: [number, number] = [0.98, 0.7], PE: [number, number] = [1.18, 0.26], PBAL: [number, number] = [0.3, -0.86];

    /* orden: z montado, z en despiece, orden de salida */
    this.layer('crystal', 0.56, 4.9, 0);
    this.layer('hands', 0, 3.7, 0.12);
    this.layer('dial', 0, 2.45, 0.24);
    this.layer('case', 0, 0, 0.5);
    this.layer('bracelet', 0, 0, 0.5);
    this.layer('plate', -0.06, -1.45, 0.4);
    this.layer('train', -0.16, -2.35, 0.52);
    this.layer('balance', -0.22, -3.2, 0.64);
    this.layer('bridges', -0.28, -4.05, 0.76);
    this.layer('rotor', -0.42, -4.95, 0.88);
    this.layer('caseback', -0.6, -5.95, 1);

    /* --- caja --- */
    const caseMat = polished(0xd6d8db, 0.16);
    this.add('case', lathe([[1.78, -0.6], [1.95, -0.57], [2.03, -0.46], [2.055, -0.2], [2.05, 0.12], [2.02, 0.28], [1.99, 0.31]]), caseMat);
    const bez = polished(0xe2e4e6, 0.06);
    bez.side = THREE.DoubleSide;
    this.add('case', lathe([[1.99, 0.3], [2.0, 0.4], [1.96, 0.5], [1.88, 0.57], [1.78, 0.6], [1.7, 0.585], [1.67, 0.52], [1.665, 0.42]], 200), bez);
    const lugMat = brushed(0xcfd2d5, 0.26, Math.PI / 2);
    for (const sy of [1, -1]) {
      for (const sx of [1, -1]) {
        const lug = this.add('case', new RoundedBoxGeometry(0.36, 0.95, 0.5, 4, 0.12), lugMat, [sx * 0.86, sy * 2.16, -0.13]);
        lug.rotation.x = -sy * 0.2;
      }
    }
    /* corona */
    const crownG = gearGeo(40, 0.28, 0.34, { root: 0.9, hole: 0, spokes: 0 });
    crownG.rotateY(Math.PI / 2);
    this.add('case', crownG, polished(0xe0e2e4, 0.1), [2.3, 0, -0.08]);
    this.add('case', zcyl(0.275, 0.02, 48).rotateY(Math.PI / 2), polished(0xeceef0, 0.05), [2.475, 0, -0.08]);
    const tube = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 32);
    tube.rotateZ(Math.PI / 2);
    this.add('case', tube, polished(), [2.08, 0, -0.08]);

    /* --- brazalete de tres eslabones --- */
    const polC = polished(0xcfd2d6, 0.08);
    const brO = brushed(0x9da2a8, 0.36, Math.PI / 2);
    const R = 2.4, Lk = 0.52, N = 9;
    for (const sy of [1, -1]) {
      this.add('bracelet', new RoundedBoxGeometry(1.34, 0.42, 0.34, 3, 0.1), brO, [0, sy * 2.46, -0.25]).rotation.x = -sy * 0.12;
      for (let k = 0; k < N; k++) {
        const phi = ((k + 0.5) * Lk) / R;
        const y = sy * (2.68 + R * Math.sin(phi));
        const z = -0.28 - R * (1 - Math.cos(phi));
        const taper = 1 - k * 0.018;
        const grp = new THREE.Group();
        grp.position.set(0, y, z);
        grp.rotation.x = -sy * phi;
        this.layers.bracelet.group.add(grp);
        this.add('bracelet', new RoundedBoxGeometry(0.4 * taper, Lk * 0.9, 0.26, 3, 0.07), polC, [0, 0, 0.02], grp);
        for (const sx of [1, -1]) {
          this.add('bracelet', new RoundedBoxGeometry(0.44 * taper, Lk * 0.96, 0.3, 3, 0.09), brO, [sx * 0.43 * taper, 0, 0], grp);
        }
      }
    }

    /* --- esfera --- */
    const dialMat = new THREE.MeshPhysicalMaterial({
      map: dialBase(), color: 0xffffff, metalness: 0.45, roughness: 0.42,
      anisotropy: 0.55, anisotropyMap: sunburstAniso(), envMapIntensity: 0.55,
    });
    this.add('dial', new THREE.CircleGeometry(1.66, 160), dialMat, [0, 0, 0.14]);
    this.printTex = drawDialPrint(null);
    const printMat = new THREE.MeshStandardMaterial({ map: this.printTex, transparent: true, roughness: 0.55, metalness: 0, depthWrite: false });
    this.add('dial', new THREE.CircleGeometry(1.66, 160), printMat, [0, 0, 0.1425]);
    this.rehautTex = drawRehaut(null);
    const rehMat = new THREE.MeshStandardMaterial({ map: this.rehautTex, metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide });
    this.add('dial', lathe([[1.66, 0.14], [1.75, 0.34]], 240), rehMat);
    /* índices aplicados */
    const idxMat = polished(0xf0f1f3, 0.05);
    const lumeMat = new THREE.MeshStandardMaterial({ color: 0xe9e8e1, roughness: 0.7, metalness: 0 });
    const idxGeo = new RoundedBoxGeometry(0.105, 0.34, 0.07, 2, 0.02);
    const lumeGeo = new THREE.PlaneGeometry(0.04, 0.24);
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * TAU;
      const offsets = h === 0 ? [-0.075, 0.075] : [0];
      for (const off of offsets) {
        const r = 1.25;
        const cx = Math.sin(a) * r + Math.cos(a) * off, cy = Math.cos(a) * r - Math.sin(a) * off;
        const bar = this.add('dial', idxGeo, idxMat, [cx, cy, 0.18]);
        bar.rotation.z = -a;
        const lume = this.add('dial', lumeGeo, lumeMat, [cx, cy, 0.2155]);
        lume.rotation.z = -a;
      }
    }

    /* --- agujas --- */
    const hMat = polished(0xf2f3f5, 0.05);
    hMat.flatShading = true;
    const { h, m, s } = this.hands;
    h.position.z = 0.235; m.position.z = 0.265; s.position.z = 0.295;
    this.layers.hands.group.add(h, m, s);
    for (const g of dauphine(0.86, 0.105, 0.16, 0.04)) this.add('hands', g, hMat, [0, 0, 0], h);
    for (const g of dauphine(1.42, 0.078, 0.18, 0.034)) this.add('hands', g, hMat, [0, 0, 0], m);
    const sMat = polished(0xe8eaec, 0.08);
    const sBar = new THREE.BoxGeometry(0.022, 1.82, 0.012);
    sBar.translate(0, 1.82 / 2 - 0.36, 0);
    this.add('hands', sBar, sMat, [0, 0, 0], s);
    this.add('hands', zcyl(0.055, 0.014, 32), sMat, [0, -0.26, 0], s);
    this.add('hands', zcyl(0.045, 0.014, 32), sMat, [0, 1.12, 0], s);
    this.add('hands', zcyl(0.028, 0.02, 32), lumeMat, [0, 1.12, 0.012], s);
    this.add('hands', zcyl(0.07, 0.16, 32), polished(0xeeeff1, 0.05), [0, 0, 0.26]);

    /* --- cristal de zafiro --- */
    const Rc = 14, th = Math.asin(1.74 / Rc);
    const cg = new THREE.SphereGeometry(Rc, 96, 8, 0, TAU, 0, th);
    cg.rotateX(Math.PI / 2);
    cg.translate(0, 0, -Rc * Math.cos(th));
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.1,
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6, depthWrite: false,
    });
    this.add('crystal', cg, glass);

    /* --- platina --- */
    const plateMat = new THREE.MeshStandardMaterial({ map: perlage(), metalness: 1, roughness: 0.36, color: 0xffffff });
    this.add('plate', zcyl(1.7, 0.08, 96), new THREE.MeshStandardMaterial({ color: 0x9a9ea2, metalness: 1, roughness: 0.3 }));
    this.add('plate', new THREE.CircleGeometry(1.7, 96), plateMat, [0, 0, -0.0405]).rotation.y = Math.PI;
    this.add('plate', new THREE.CircleGeometry(1.7, 96), plateMat, [0, 0, 0.0405]);

    /* --- tren de ruedas --- */
    const gm = gilt();
    const steel = polished(0xd8dadc, 0.12);
    const wheels: [[number, number], number, number, number, number][] = [
      [PB, 60, 0.66, 0.16, -0.22], [PC, 44, 0.48, 0.08, 0.19], [PT, 34, 0.33, 0.07, -0.28], [PF, 28, 0.27, 0.06, 0.34],
    ];
    wheels.forEach(([p, n, r, dpt, w], i) => {
      const g = this.add('train', gearGeo(n, r, dpt, { spokes: i === 0 ? 0 : 5, hole: i === 0 ? 0.08 : undefined, root: 0.9 }), gm, [p[0], p[1], 0]);
      this.spinners.push({ o: g, w });
      this.add('train', zcyl(r * 0.28, dpt + 0.14, 24), steel, [p[0], p[1], 0]);
    });
    this.add('train', spiral(0.1, 0.52, 6, 0.012), polished(0xb8bbbe, 0.2), [PB[0], PB[1], 0.09]);

    /* --- volante y escape --- */
    this.balance.position.set(PBAL[0], PBAL[1], 0);
    this.layers.balance.group.add(this.balance);
    this.add('balance', new THREE.TorusGeometry(0.62, 0.045, 16, 96), gm, [0, 0, 0], this.balance);
    for (let i = 0; i < 3; i++) {
      const sp = this.add('balance', new THREE.BoxGeometry(1.24, 0.05, 0.035), gm, [0, 0, 0], this.balance);
      sp.rotation.z = (i * Math.PI) / 3;
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      this.add('balance', zcyl(0.035, 0.1, 12), steel, [Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0], this.balance);
    }
    this.add('balance', spiral(0.08, 0.34, 8, 0.007), polished(0x9ea3aa, 0.2), [0, 0, 0.06], this.balance);
    this.add('balance', zcyl(0.05, 0.08, 20), ruby(), [0, 0, 0.04], this.balance);
    const esc = this.add('balance', gearGeo(15, 0.24, 0.05, { root: 0.66, spokes: 3, hole: 0.03 }), steel, [PE[0], PE[1], 0]);
    this.spinners.push({ o: esc, w: -0.55 });
    this.fork.position.set(1.52, -0.12, 0.02);
    this.layers.balance.group.add(this.fork);
    const fs = new THREE.Shape();
    fs.moveTo(-0.52, -0.03); fs.lineTo(0.05, -0.05); fs.lineTo(0.05, 0.05); fs.lineTo(-0.52, 0.03); fs.closePath();
    this.add('balance', new THREE.ExtrudeGeometry(fs, { depth: 0.04, bevelEnabled: false }), steel, [0, 0, -0.02], this.fork);
    this.add('balance', zcyl(0.03, 0.08, 12), ruby(), [-0.4, 0.03, 0], this.fork);

    /* --- puentes --- */
    const cot = cotes();
    const bridgeMat = new THREE.MeshStandardMaterial({ map: cot, metalness: 1, roughness: 0.3, color: 0xffffff });
    this.add('bridges', capsule(PB, [-0.25, 0.62], 0.56, 0.08), bridgeMat);
    this.add('bridges', capsule(PT, [1.28, 0.3], 0.34, 0.08), bridgeMat);
    this.add('bridges', capsule([-0.5, -0.95], [1.1, -0.75], 0.2, 0.07), bridgeMat, [0, 0, 0.1]);
    const screwMat = polished(0xe6e8ea, 0.08);
    const pts: [number, number][] = [[-1.2, 0.45], [-0.55, -0.55], [0.2, 0.95], [1.3, -0.05], [-0.62, -0.95], [1.12, -0.72]];
    pts.forEach(([x, y]) => {
      this.add('bridges', zcyl(0.07, 0.04, 20), screwMat, [x, y, 0.06]);
      this.add('bridges', new THREE.BoxGeometry(0.1, 0.015, 0.02), new THREE.MeshStandardMaterial({ color: 0x222325 }), [x, y, 0.08]);
    });
    [PB, PC, PT, PF, PE].forEach(([x, y]) => {
      this.add('bridges', zcyl(0.07, 0.1, 24), ruby(), [x, y, 0.02]);
      this.add('bridges', new THREE.TorusGeometry(0.075, 0.018, 8, 24), polished(0xd4a24c, 0.2), [x, y, 0.06]);
    });

    /* --- rotor --- */
    this.layers.rotor.group.add(this.rotor);
    const rs = new THREE.Shape();
    rs.absarc(0, 0, 1.68, 0.08, Math.PI - 0.08, false);
    rs.absarc(0, 0, 0.36, Math.PI - 0.2, 0.2, true);
    rs.closePath();
    const rotorG = new THREE.ExtrudeGeometry(rs, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 2, curveSegments: 64 });
    rotorG.translate(0, 0, -0.03);
    this.add('rotor', rotorG, new THREE.MeshStandardMaterial({ map: cot, metalness: 1, roughness: 0.36, color: 0x75797e }), [0, 0, 0], this.rotor);
    this.add('rotor', zcyl(0.32, 0.1, 48), polished(0xe8eaec, 0.06), [0, 0, 0], this.rotor);
    this.rotorTex = drawRotorText(null);
    const eng = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.27), new THREE.MeshBasicMaterial({ map: this.rotorTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    eng.position.set(0, 1.05, -0.05);
    eng.scale.x = -1;
    this.rotor.add(eng);
    this.layers.rotor.mats.push({ m: eng.material as unknown as THREE.MeshStandardMaterial, base: new THREE.Color(1, 1, 1), env: 1, op: 1 });

    /* --- fondo con zafiro --- */
    const cb = brushed(0x6c7176, 0.32);
    cb.side = THREE.DoubleSide;
    this.add('caseback', lathe([[1.4, 0.04], [1.62, 0.0], [1.82, -0.06], [1.8, -0.1], [1.4, -0.08]]), cb);
    const cbGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.08, clearcoat: 0.6, depthWrite: false, envMapIntensity: 0.9 });
    this.add('caseback', zcyl(1.42, 0.04, 96), cbGlass, [0, 0, -0.04]);
  }

  /* hora de Madrid en las agujas, con segundero continuo */
  private tzMin = -1;
  private tzH = 0;
  private tzM = 0;
  setTime(date: Date) {
    const minuteKey = Math.floor(date.getTime() / 60000);
    if (minuteKey !== this.tzMin) {
      this.tzMin = minuteKey;
      this.tzH = date.getHours();
      this.tzM = date.getMinutes();
      try {
        const parts = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(date);
        this.tzH = +(parts.find((p) => p.type === 'hour')?.value ?? this.tzH);
        this.tzM = +(parts.find((p) => p.type === 'minute')?.value ?? this.tzM);
      } catch { /* hora local */ }
    }
    const hh = this.tzH, mm = this.tzM;
    const ss = date.getSeconds() + date.getMilliseconds() / 1000;
    const mFrac = mm + ss / 60;
    this.hands.s.rotation.z = -(ss / 60) * TAU;
    this.hands.m.rotation.z = -(mFrac / 60) * TAU;
    this.hands.h.rotation.z = -(((hh % 12) + mFrac / 60) / 12) * TAU;
  }
}
