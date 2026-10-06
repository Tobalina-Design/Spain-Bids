import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  nautilusDial, nautilusDialNormal, drawDialPrint, drawDate, perlage, cotes, drawRotorText, DIAL_S,
} from './textures';

/* Reloj procedural inspirado en el Nautilus 5711/1A. */
/* Eje del reloj = Z, la esfera mira hacia +Z, Y = las 12. 1 unidad ≈ 10 mm. */

export type LayerKey =
  | 'crystal' | 'hands' | 'dial' | 'case' | 'bracelet'
  | 'plate' | 'train' | 'balance' | 'bridges' | 'rotor' | 'caseback';

type Mat = THREE.MeshStandardMaterial;
type MatRec = { m: Mat; base: THREE.Color; env: number; op: number };

export type Layer = {
  key: LayerKey;
  group: THREE.Group;
  base: number;
  ex: number;
  d: number;
  mats: MatRec[];
  bright: number;
};

const TAU = Math.PI * 2;
type V2 = [number, number];

/* ---------- materiales ---------- */
function polished(hex = 0xdadcdf, rough = 0.06) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, clearcoat: 0.3, clearcoatRoughness: 0.04 });
}
/* líneas de satinado: filas de brillo aleatorio */
let brushCache: THREE.CanvasTexture | null = null;
function brushTex() {
  if (brushCache) return brushCache;
  const c = document.createElement('canvas');
  c.width = 16; c.height = 1024;
  const g = c.getContext('2d')!;
  for (let y = 0; y < 1024; y++) {
    const v = 214 + Math.random() * 41;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 16, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 0.6);
  t.anisotropy = 8;
  brushCache = t;
  return t;
}
function satin(hex = 0xc4c7cb, rough = 0.26, rot = 0) {
  const map = rot ? brushTex().clone() : brushTex();
  if (rot) { map.rotation = rot; map.needsUpdate = true; }
  return new THREE.MeshPhysicalMaterial({ color: hex, map, metalness: 1, roughness: rough, anisotropy: 0.9, anisotropyRotation: rot });
}
function gilt(rough = 0.22) {
  return new THREE.MeshPhysicalMaterial({ color: 0xc2a36e, metalness: 1, roughness: rough });
}
function ruby() {
  return new THREE.MeshPhysicalMaterial({ color: 0x8a0f1c, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.4, sheenColor: new THREE.Color(0xff5a6a) });
}

/* ---------- geometrías base ---------- */
function zcyl(r: number, h: number, seg = 64) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  return g;
}

/* Polígono con esquinas redondeadas (radio constante) */
function roundedPoly(v: V2[], r: number, seg = 14): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  const n = v.length;
  for (let i = 0; i < n; i++) {
    const p0 = v[(i - 1 + n) % n], p1 = v[i], p2 = v[(i + 1) % n];
    const ax = p0[0] - p1[0], ay = p0[1] - p1[1];
    const bx = p2[0] - p1[0], by = p2[1] - p1[1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const ux = ax / la, uy = ay / la, wx = bx / lb, wy = by / lb;
    const th = Math.acos(Math.max(-1, Math.min(1, ux * wx + uy * wy)));
    let t = r / Math.tan(th / 2);
    t = Math.min(t, la * 0.49, lb * 0.49);
    const rr = t * Math.tan(th / 2);
    const sx = p1[0] + ux * t, sy = p1[1] + uy * t;
    const ex = p1[0] + wx * t, ey = p1[1] + wy * t;
    const bxm = ux + wx, bym = uy + wy, bl = Math.hypot(bxm, bym) || 1;
    const dc = rr / Math.sin(th / 2);
    const ccx = p1[0] + (bxm / bl) * dc, ccy = p1[1] + (bym / bl) * dc;
    let a0 = Math.atan2(sy - ccy, sx - ccx);
    let a1 = Math.atan2(ey - ccy, ex - ccx);
    let da = a1 - a0;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (da * k) / seg;
      out.push(new THREE.Vector2(ccx + Math.cos(a) * rr, ccy + Math.sin(a) * rr));
    }
    void a1;
  }
  return out;
}

/* Octógono Nautilus: semiancho a, semialto b, corte de esquina c */
function octa(a: number, b: number, c: number): V2[] {
  return [[a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c], [-a + c, -b], [a - c, -b]];
}

function extrude(outer: THREE.Vector2[], holes: THREE.Vector2[][], depth: number, bevel: number, bevelSeg = 1) {
  const s = new THREE.Shape(outer);
  for (const h of holes) s.holes.push(new THREE.Path(h));
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel,
    bevelSegments: bevelSeg, curveSegments: 1,
  });
  return g; // z de -bevel a depth + bevel
}

/* uv planas normalizadas al cuadrado de la esfera */
function planarUV(g: THREE.BufferGeometry, S: number) {
  const p = g.getAttribute('position');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / (2 * S) + 0.5;
    uv[i * 2 + 1] = p.getY(i) / (2 * S) + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
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

/* Aguja bâton con punta, arista central facetada */
function batonHand(L: number, w: number, tail: number, h: number) {
  const tip = L - w * 1.1;
  const v: V2[] = [[-w / 2, -tail], [w / 2, -tail], [w / 2, tip], [0, L], [-w / 2, tip]];
  const shape = new THREE.Shape(v.map(([x, y]) => new THREE.Vector2(x, y)));
  const plate = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false });
  /* tejado a dos aguas */
  const z0 = 0.012, z1 = 0.012 + h;
  const P = (x: number, y: number, z: number) => [x, y, z];
  const tri = [
    ...P(-w / 2, -tail, z0), ...P(0, -tail, z1), ...P(0, L, z0 + h * 0.3),
    ...P(-w / 2, -tail, z0), ...P(0, L, z0 + h * 0.3), ...P(-w / 2, tip, z0),
    ...P(0, -tail, z1), ...P(w / 2, -tail, z0), ...P(w / 2, tip, z0),
    ...P(0, -tail, z1), ...P(w / 2, tip, z0), ...P(0, L, z0 + h * 0.3),
    ...P(-w / 2, tip, z0), ...P(0, L, z0 + h * 0.3), ...P(-w / 2, tip, z0),
  ];
  const roof = new THREE.BufferGeometry();
  roof.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  roof.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((tri.length / 3) * 2).fill(0), 2));
  roof.computeVertexNormals();
  /* relleno luminiscente */
  const lw = w * 0.42;
  const lume = new THREE.PlaneGeometry(lw, (tip - tail * 0.2) * 0.72);
  lume.translate(0, (tip * 0.72) / 2 + tip * 0.14, 0);
  return { plate, roof, lume };
}

/* ---------- construcción ---------- */
export class Watch {
  root = new THREE.Group();
  inner = new THREE.Group();
  layers: Record<LayerKey, Layer> = {} as Record<LayerKey, Layer>;
  hands = { h: new THREE.Group(), m: new THREE.Group(), s: new THREE.Group() };
  spinners: { o: THREE.Object3D; w: number }[] = [];
  balance = new THREE.Group();
  fork = new THREE.Group();
  rotor = new THREE.Group();
  private printTex: THREE.CanvasTexture | null = null;
  private dateTex: THREE.CanvasTexture | null = null;
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
  private add(key: LayerKey, geo: THREE.BufferGeometry, mat: Mat | Mat[], pos: [number, number, number] = [0, 0, 0], parent?: THREE.Object3D) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    (parent ?? this.layers[key].group).add(mesh);
    const L = this.layers[key];
    for (const m of Array.isArray(mat) ? mat : [mat]) {
      if (!L.mats.some((r) => r.m === m)) {
        L.mats.push({ m, base: m.color.clone(), env: m.envMapIntensity ?? 1, op: m.opacity });
      }
    }
    return mesh;
  }

  refreshTextures() {
    drawDialPrint(this.printTex);
    drawDate(this.dateTex);
    drawRotorText(this.rotorTex);
  }

  private build() {
    const PB: [number, number] = [-0.95, -0.2], PC: [number, number] = [0, 0], PT: [number, number] = [0.42, 0.62];
    const PF: [number, number] = [0.98, 0.7], PE: [number, number] = [1.18, 0.26], PBAL: [number, number] = [0.3, -0.86];

    this.layer('crystal', 0.34, 4.9, 0);
    this.layer('hands', 0, 3.7, 0.12);
    this.layer('dial', 0, 2.45, 0.24);
    this.layer('case', 0, 0, 0.5);
    this.layer('bracelet', 0, 0, 0.5);
    this.layer('plate', -0.12, -1.45, 0.4);
    this.layer('train', -0.2, -2.35, 0.52);
    this.layer('balance', -0.25, -3.2, 0.64);
    this.layer('bridges', -0.3, -4.05, 0.76);
    this.layer('rotor', -0.4, -4.95, 0.88);
    this.layer('caseback', -0.62, -5.95, 1);

    /* ===== medidas ===== */
    const A = 1.86, B = 1.8, C = 0.66;        // bisel exterior
    const RO = 0.36, RI = 0.6;                 // redondeo exterior / interior
    const Z_CASE0 = -0.52, Z_CASE1 = 0.1;      // carrura
    const Z_BEZ1 = 0.34;                        // cara superior del bisel
    const Z_DIAL = 0.1;

    /* ===== carrura con orejas a las 3 y a las 9 ===== */
    const earX = A + 0.34;
    const caseOutline = roundedPoly([
      [earX, -0.92], [earX, 0.92], [A - C * 0.5, B - 0.03], [-(A - C * 0.5), B - 0.03],
      [-earX, 0.92], [-earX, -0.92], [-(A - C * 0.5), -(B - 0.03)], [A - C * 0.5, -(B - 0.03)],
    ], 0.62, 22);
    const caseSatin = satin(0xc9ccd0, 0.3, 0);
    const casePol = polished(0xd8dadd, 0.07);
    /* abierta por dentro: su cara superior no puede coincidir con el plano de la esfera */
    const caseHole = roundedPoly(octa(A - 0.22, B - 0.22, C - 0.08), RI, 16);
    const cg = extrude(caseOutline, [caseHole], Z_CASE1 - Z_CASE0 - 0.08, 0.04, 2);
    this.add('case', cg, [caseSatin, casePol], [0, 0, Z_CASE0 + 0.04]);
    /* junta oscura entre carrura y bisel */
    const gap = extrude(roundedPoly(octa(A - 0.02, B - 0.02, C), RO, 14), [roundedPoly(octa(A - 0.3, B - 0.3, C - 0.1), RI, 14)], 0.012, 0);
    this.add('case', gap, new THREE.MeshStandardMaterial({ color: 0x1a1b1d, metalness: 0.6, roughness: 0.5 }), [0, 0, Z_CASE1]);

    /* ===== bisel octogonal: cara satinada horizontal, chaflanes pulidos ===== */
    const bezOuter = roundedPoly(octa(A, B, C), RO, 16);
    const bezInner = roundedPoly(octa(A - 0.32, B - 0.32, C - 0.1), RI, 16);
    const bezSatin = satin(0xd4d7da, 0.22, 0);
    const bezPol = polished(0xe6e8ea, 0.05);
    const bg = extrude(bezOuter, [bezInner], Z_BEZ1 - Z_CASE1 - 0.12, 0.06, 2);
    this.add('case', bg, [bezSatin, bezPol], [0, 0, Z_CASE1 + 0.072]);
    /* pared interior hasta la esfera */
    const wall = extrude(roundedPoly(octa(A - 0.3, B - 0.3, C - 0.1), RI, 16), [roundedPoly(octa(A - 0.35, B - 0.35, C - 0.1), RI, 16)], Z_BEZ1 - Z_DIAL - 0.06, 0);
    this.add('case', wall, [new THREE.MeshStandardMaterial({ color: 0x9fa4aa, metalness: 1, roughness: 0.35 })], [0, 0, Z_DIAL]);

    /* ===== corona protegida en la oreja derecha ===== */
    const crownMat = polished(0xe2e4e6, 0.08);
    const crown = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 40);
    crown.rotateZ(Math.PI / 2);
    this.add('case', crown, crownMat, [earX + 0.1, 0, -0.2]);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      const rib = new THREE.BoxGeometry(0.2, 0.03, 0.03);
      this.add('case', rib, crownMat, [earX + 0.1, Math.cos(a) * 0.2, -0.2 + Math.sin(a) * 0.2]);
    }
    this.add('case', zcyl(0.17, 0.02, 40).rotateY(Math.PI / 2), polished(0xf0f1f3, 0.04), [earX + 0.205, 0, -0.2]);

    /* ===== brazalete integrado 1A ===== */
    const linkSatin = satin(0xb9bdc1, 0.32, Math.PI / 2);
    const linkPol = polished(0xeef0f2, 0.22);
    for (const sy of [1, -1]) {
      /* pieza de unión que continúa la caja */
      const end = new RoundedBoxGeometry(2.12, 0.5, 0.52, 3, 0.1);
      this.add('bracelet', end, linkSatin, [0, sy * (B + 0.08), -0.2]).rotation.x = -sy * 0.06;
      const R = 2.5, Lk = 0.47, N = 10;
      for (let k = 0; k < N; k++) {
        const phi = ((k + 0.5) * Lk) / R;
        const grp = new THREE.Group();
        grp.position.set(0, sy * (B + 0.36 + R * Math.sin(phi)), -0.26 - R * (1 - Math.cos(phi)));
        grp.rotation.x = -sy * phi;
        this.layers.bracelet.group.add(grp);
        const tp = 1 - Math.min(k, 7) * 0.022;
        const ow = 0.86 * tp;
        this.add('bracelet', new RoundedBoxGeometry(0.26 * tp, Lk * 0.78, 0.3, 3, 0.07), linkPol, [0, 0, 0.03], grp);
        for (const sx of [1, -1]) {
          this.add('bracelet', new RoundedBoxGeometry(ow, Lk * 0.93, 0.32, 3, 0.07), linkSatin, [sx * (0.13 * tp + 0.02 + ow / 2), 0, 0], grp);
        }
      }
    }

    /* ===== esfera ===== */
    const dialShape = roundedPoly(octa(A - 0.26, B - 0.26, C - 0.08), RI, 16);
    const dg = planarUV(new THREE.ShapeGeometry(new THREE.Shape(dialShape), 1), DIAL_S);
    const nrm = nautilusDialNormal();
    nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
    const dialMat = new THREE.MeshPhysicalMaterial({
      map: nautilusDial(), normalMap: nrm, normalScale: new THREE.Vector2(0.8, 0.8),
      color: 0xffffff, metalness: 0.15, roughness: 0.6, clearcoat: 0, envMapIntensity: 0.22,
    });
    this.add('dial', dg, dialMat, [0, 0, Z_DIAL]);
    this.printTex = drawDialPrint(null);
    const printMat = new THREE.MeshStandardMaterial({ map: this.printTex, transparent: true, roughness: 0.6, metalness: 0, depthWrite: false });
    this.add('dial', planarUV(new THREE.ShapeGeometry(new THREE.Shape(dialShape), 1), DIAL_S), printMat, [0, 0, Z_DIAL + 0.002]);

    /* índices bâton aplicados, oro blanco con luminiscente */
    const idxMat = polished(0xf1f2f4, 0.04);
    const lumeMat = new THREE.MeshStandardMaterial({ color: 0xe6e8e2, roughness: 0.75, metalness: 0, emissive: 0x20261f, emissiveIntensity: 0.4 });
    const idxGeo = new RoundedBoxGeometry(0.085, 0.4, 0.05, 2, 0.018);
    const idxLume = new THREE.PlaneGeometry(0.036, 0.33);
    for (let h = 0; h < 12; h++) {
      if (h === 3) continue; // ventana de fecha
      const a = (h / 12) * TAU;
      const r = 1.13;
      const x = Math.sin(a) * r, y = Math.cos(a) * r;
      this.add('dial', idxGeo, idxMat, [x, y, Z_DIAL + 0.03]).rotation.z = -a;
      this.add('dial', idxLume, lumeMat, [x, y, Z_DIAL + 0.0555]).rotation.z = -a;
    }
    /* ventana de fecha a las 3 */
    this.dateTex = drawDate(null);
    const dateMat = new THREE.MeshStandardMaterial({ map: this.dateTex, roughness: 0.6, metalness: 0 });
    this.add('dial', new THREE.PlaneGeometry(0.25, 0.2), dateMat, [1.12, 0, Z_DIAL + 0.003]);
    const frame = new THREE.Shape([new THREE.Vector2(-0.15, -0.125), new THREE.Vector2(0.15, -0.125), new THREE.Vector2(0.15, 0.125), new THREE.Vector2(-0.15, 0.125)]);
    frame.holes.push(new THREE.Path([new THREE.Vector2(-0.125, -0.1), new THREE.Vector2(-0.125, 0.1), new THREE.Vector2(0.125, 0.1), new THREE.Vector2(0.125, -0.1)]));
    this.add('dial', new THREE.ExtrudeGeometry(frame, { depth: 0.03, bevelEnabled: false }), idxMat, [1.12, 0, Z_DIAL]);

    /* ===== agujas bâton ===== */
    const hMat = polished(0xf3f4f6, 0.04);
    hMat.flatShading = true;
    const { h, m, s } = this.hands;
    h.position.z = Z_DIAL + 0.09; m.position.z = Z_DIAL + 0.12; s.position.z = Z_DIAL + 0.15;
    this.layers.hands.group.add(h, m, s);
    for (const [grp, L, w] of [[h, 0.9, 0.11], [m, 1.36, 0.085]] as [THREE.Group, number, number][]) {
      const hg = batonHand(L, w, 0.16, 0.022);
      this.add('hands', hg.plate, hMat, [0, 0, 0], grp);
      this.add('hands', hg.roof, hMat, [0, 0, 0], grp);
      this.add('hands', hg.lume, lumeMat, [0, 0, 0.0345], grp);
    }
    const sMat = polished(0xeceef0, 0.06);
    const sBar = new THREE.BoxGeometry(0.018, 1.7, 0.01);
    sBar.translate(0, 1.7 / 2 - 0.3, 0);
    this.add('hands', sBar, sMat, [0, 0, 0], s);
    this.add('hands', new THREE.PlaneGeometry(0.03, 0.16), lumeMat, [0, 1.2, 0.006], s);
    this.add('hands', zcyl(0.045, 0.014, 32), sMat, [0, 0, 0], s);
    this.add('hands', zcyl(0.06, 0.16, 32), polished(0xeeeff1, 0.05), [0, 0, Z_DIAL + 0.08]);

    /* ===== cristal de zafiro plano ===== */
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.3, transparent: true, opacity: 0.02,
      clearcoat: 0, envMapIntensity: 0.08, depthWrite: false,
    });
    this.add('crystal', extrude(roundedPoly(octa(A - 0.3, B - 0.3, C - 0.1), RI, 16), [], 0.03, 0), glass, [0, 0, -0.05]);

    /* Platina */
    const plateMat = new THREE.MeshStandardMaterial({ map: perlage(), metalness: 1, roughness: 0.36, color: 0xffffff });
    this.add('plate', zcyl(1.7, 0.08, 96), new THREE.MeshStandardMaterial({ color: 0x9a9ea2, metalness: 1, roughness: 0.3 }));
    this.add('plate', new THREE.CircleGeometry(1.7, 96), plateMat, [0, 0, -0.0405]).rotation.y = Math.PI;
    this.add('plate', new THREE.CircleGeometry(1.7, 96), plateMat, [0, 0, 0.0405]);

    /* Tren de ruedas */
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

    /* Volante y escape */
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

    /* Puentes */
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

    /* Rotor */
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

    /* ===== fondo: bisel octogonal y zafiro ===== */
    const cbMat = satin(0xb5b9bd, 0.3, 0);
    const cbOuter = roundedPoly(octa(A - 0.08, B - 0.08, C), RO, 14);
    const cbHole = Array.from({ length: 96 }, (_, i) => new THREE.Vector2(Math.cos((i / 96) * TAU) * 1.42, Math.sin((i / 96) * TAU) * 1.42));
    this.add('caseback', extrude(cbOuter, [cbHole], 0.06, 0.03, 2), [cbMat, polished(0xd8dadd, 0.08)], [0, 0, 0.0]);
    const cbGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.04, clearcoat: 0.2, depthWrite: false, envMapIntensity: 0.3 });
    this.add('caseback', zcyl(1.43, 0.04, 96), cbGlass, [0, 0, 0.05]);
  }

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
