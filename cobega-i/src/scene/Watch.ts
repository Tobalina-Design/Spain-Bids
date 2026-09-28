import * as THREE from 'three';
import {
  nautilusDialBase, drawDialPrint, drawRehaut, perlage, cotes, drawRotorText,
} from './textures';

/* Reloj procedural — Patek Philippe Nautilus 5711/5712 */
/* Eje del reloj = Z, la esfera mira hacia +Z. 1 unidad ≈ 10 mm. */

export type LayerKey =
  | 'crystal' | 'hands' | 'dial' | 'case' | 'bracelet'
  | 'plate' | 'train' | 'balance' | 'bridges' | 'rotor' | 'caseback';

type MatRec = { m: THREE.MeshStandardMaterial; base: THREE.Color; env: number; op: number };

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

/* ---------- materiales ---------- */
function polished(hex = 0xdadcdf, rough = 0.07) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, clearcoat: 0.3, clearcoatRoughness: 0.05 });
}
function brushed(hex = 0xc3c6ca, rough = 0.28, rot = 0) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, anisotropy: 0.85, anisotropyRotation: rot });
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

/* Octágono extruido — base geométrica del Nautilus */
function octagonShape(outerR: number, innerR = 0, roundR = 0.06) {
  const s = new THREE.Shape();
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 8;
    const x = Math.cos(a) * outerR;
    const y = Math.sin(a) * outerR;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  if (innerR > 0) {
    const h = new THREE.Path();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 8;
      if (i === 0) h.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
      else h.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
    }
    h.closePath();
    s.holes.push(h);
  }
  void roundR;
  return s;
}

/* Bisel octogonal facetado — característica icónica del Nautilus */
function nautilusBezel(outerR: number, innerR: number, depth: number) {
  const n = 8;
  const verts: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  /* Por cada lado del octágono generamos una cara facetada inclinada */
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU - Math.PI / 8;
    const a1 = ((i + 1) / n) * TAU - Math.PI / 8;
    // puntos exterior abajo, exterior arriba, interior arriba
    const ox0 = Math.cos(a0) * outerR, oy0 = Math.sin(a0) * outerR;
    const ox1 = Math.cos(a1) * outerR, oy1 = Math.sin(a1) * outerR;
    const ix0 = Math.cos(a0) * innerR, iy0 = Math.sin(a0) * innerR;
    const ix1 = Math.cos(a1) * innerR, iy1 = Math.sin(a1) * innerR;
    const base = i * 4;
    verts.push(
      ox0, oy0, 0,        // 0 outer bottom
      ox1, oy1, 0,        // 1 outer bottom
      ix1, iy1, depth,   // 2 inner top
      ix0, iy0, depth,   // 3 inner top
    );
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  /* cara interior plana */
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU - Math.PI / 8;
    const a1 = ((i + 1) / n) * TAU - Math.PI / 8;
    const base = n * 4 + i * 3;
    const cx = 0, cy = 0;
    verts.push(
      Math.cos(a0) * innerR, Math.sin(a0) * innerR, depth,
      Math.cos(a1) * innerR, Math.sin(a1) * innerR, depth,
      cx, cy, depth,
    );
    uvs.push(0, 0, 1, 0, 0.5, 0.5);
    indices.push(base, base + 1, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* Perfil exterior de la caja octogonal Nautilus */
function nautilusCaseOuter(outerR: number, height: number) {
  const n = 8;
  const verts: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const h2 = height / 2;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU - Math.PI / 8;
    const a1 = ((i + 1) / n) * TAU - Math.PI / 8;
    const x0 = Math.cos(a0) * outerR, y0 = Math.sin(a0) * outerR;
    const x1 = Math.cos(a1) * outerR, y1 = Math.sin(a1) * outerR;
    const base = i * 4;
    verts.push(x0, y0, -h2, x1, y1, -h2, x1, y1, h2, x0, y0, h2);
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
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

/* Aguja tipo feuille (Nautilus) — más fina y elegante que dauphine */
function feuilleHand(L: number, w: number, tail: number, thickness: number) {
  const shape = new THREE.Shape();
  const peak = L * 0.5;
  shape.moveTo(0, -tail);
  shape.bezierCurveTo(w * 0.7, peak * 0.3, w, peak * 0.7, 0, L);
  shape.bezierCurveTo(-w, peak * 0.7, -w * 0.7, peak * 0.3, 0, -tail);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.4,
    bevelSize: w * 0.25,
    bevelSegments: 4,
    curveSegments: 32,
  });
  g.translate(0, 0, -thickness / 2);
  return g;
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

    /* ===================== CAJA NAUTILUS ===================== */
    /* Material base: acero pulido lateral, cepillado horizontal en flancos */
    const casePol = polished(0xc8cacd, 0.12);   // pulido lateral
    const caseBru = brushed(0xb0b3b7, 0.32, 0); // cepillado flancos

    /* Perfil exterior octogonal */
    const caseOuterR = 1.96;
    const caseH = 1.22;
    this.add('case', nautilusCaseOuter(caseOuterR, caseH), casePol);

    /* Tapa frontal (bisel octogonal inclinado — icónico Nautilus) */
    const bezelOut = 2.06, bezelIn = 1.82, bezelDepth = 0.62;
    const bezelMat = polished(0xd2d5d8, 0.08);
    this.add('case', nautilusBezel(bezelOut, bezelIn, bezelDepth), bezelMat, [0, 0, caseH * 0.5 - 0.06]);

    /* Aristas horizontales del bisel — las líneas características del Nautilus */
    const edgeMat = brushed(0xe0e2e5, 0.14, Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 8;
      const am = ((i + 0.5) / 8) * TAU - Math.PI / 8;
      const mx = Math.cos(am) * (bezelOut + bezelIn) * 0.5;
      const my = Math.sin(am) * (bezelOut + bezelIn) * 0.5;
      const edgeBar = new THREE.BoxGeometry(0.52, 0.055, bezelDepth * 0.9);
      edgeBar.rotateZ(a + Math.PI / 8 + Math.PI / 2);
      this.add('case', edgeBar, edgeMat, [mx, my, caseH * 0.5 + bezelDepth * 0.45 - 0.06]);
    }

    /* Fondo de la caja */
    const caseBottom = new THREE.ExtrudeGeometry(octagonShape(caseOuterR * 0.98), {
      depth: 0.06, bevelEnabled: false, curveSegments: 2,
    });
    caseBottom.rotateZ(Math.PI / 8);
    this.add('case', caseBottom, caseBru, [0, 0, -caseH * 0.5]);

    /* Tapa delantera (anillo exterior bisel) */
    const rimGeo = new THREE.ExtrudeGeometry(octagonShape(bezelOut + 0.08, bezelOut - 0.01), {
      depth: bezelDepth + 0.06, bevelEnabled: false, curveSegments: 2,
    });
    rimGeo.rotateZ(Math.PI / 8);
    this.add('case', rimGeo, casePol, [0, 0, caseH * 0.5 - 0.08]);

    /* Orejas / integraciones del brazalete — arriba y abajo */
    const earMat = brushed(0xb8bbbe, 0.3, Math.PI / 2);
    for (const sy of [1, -1]) {
      /* eslabón de conexión */
      const earGeo = new THREE.BoxGeometry(1.82, 0.48, caseH);
      this.add('case', earGeo, earMat, [0, sy * (caseOuterR + 0.22), 0]);
      /* biselado lateral de la oreja */
      const earBevel = new THREE.BoxGeometry(1.72, 0.1, caseH * 0.85);
      this.add('case', earBevel, casePol, [0, sy * (caseOuterR + 0.46), 0]);
    }

    /* Corona — Nautilus tiene la corona integrada a las 3h, pequeña */
    const crownMat = polished(0xe0e2e4, 0.1);
    const crownG = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 32);
    crownG.rotateZ(Math.PI / 2);
    this.add('case', crownG, crownMat, [caseOuterR + 0.14, 0, -0.05]);
    /* Estrías de agarre */
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TAU;
      const ridgeG = new THREE.BoxGeometry(0.28, 0.022, 0.018);
      ridgeG.rotateY(a);
      const ridge = new THREE.Mesh(ridgeG, polished(0xdddfe1, 0.08));
      ridge.position.set(caseOuterR + 0.14, 0, -0.05);
      this.layers.case.group.add(ridge);
    }

    /* ===================== BRAZALETE NAUTILUS INTEGRADO ===================== */
    /* Característica definitoria: eslabones horizontales integrados con la caja */
    const polLink = polished(0xcdd0d3, 0.09);
    const bruLink = brushed(0xa8abad, 0.34, 0);
    const linkW = 1.82;  // ancho total del brazalete
    const linkH = 0.46;  // alto de cada eslabón
    const N = 10;        // eslabones por lado

    for (const sy of [1, -1]) {
      for (let k = 0; k < N; k++) {
        const startY = sy * (caseOuterR + 0.48);
        const y = startY + sy * (k + 0.5) * linkH;
        const taper = Math.max(0.68, 1 - k * 0.032);
        const lw = linkW * taper;
        const lz = -0.04 - k * 0.038; // se curva ligeramente

        /* eslabón central (pulido) */
        const cLink = new THREE.BoxGeometry(lw * 0.38, linkH * 0.88, 0.34);
        this.add('bracelet', cLink, polLink, [0, y, lz]);

        /* eslabones laterales (cepillados) — 2 por lado */
        for (const sx of [1, -1]) {
          const sLink = new THREE.BoxGeometry(lw * 0.28, linkH * 0.94, 0.32);
          this.add('bracelet', sLink, bruLink, [sx * lw * 0.33, y, lz - 0.01]);
        }

        /* línea de separación entre eslabones */
        if (k < N - 1) {
          const divider = new THREE.BoxGeometry(lw * taper * 0.98, 0.022, 0.36);
          this.add('bracelet', divider, polished(0x888b8e, 0.18), [0, y + sy * linkH * 0.5, lz]);
        }
      }
      /* cierre del brazalete al final */
      const closeY = sy * (caseOuterR + 0.48 + (N + 0.5) * linkH);
      const closureGeo = new THREE.BoxGeometry(linkW * 0.68 * (1 - N * 0.032), linkH * 0.7, 0.28);
      this.add('bracelet', closureGeo, polished(0xd8dadc, 0.1), [0, closeY, -0.04 - N * 0.038]);
    }

    /* ===================== ESFERA AZUL NAUTILUS ===================== */
    /* Esfera azul característica con rayas horizontales en relieve */
    const dialMat = new THREE.MeshPhysicalMaterial({
      map: nautilusDialBase(),
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.38,
      envMapIntensity: 0.5,
    });
    /* Esfera principal */
    const dialR = 1.74;
    this.add('dial', new THREE.CircleGeometry(dialR, 160), dialMat, [0, 0, 0.14]);

    /* Rayas horizontales en relieve — efecto característico Nautilus */
    const stripeMat = brushed(0x2a4a7a, 0.22, Math.PI / 2);
    const stripeCount = 12;
    for (let i = 0; i < stripeCount; i++) {
      const yPos = -dialR * 0.85 + (i + 0.5) * (dialR * 1.7 / stripeCount);
      const halfH = (dialR * 1.7 / stripeCount) * 0.36;
      const xExtent = Math.sqrt(Math.max(0, dialR * dialR - yPos * yPos)) * 0.96;
      if (xExtent < 0.05) continue;
      const stripeGeo = new THREE.PlaneGeometry(xExtent * 2, halfH * 2);
      this.add('dial', stripeGeo, stripeMat, [0, yPos, 0.148]);
    }

    /* Print sobre la esfera */
    this.printTex = drawDialPrint(null);
    const printMat = new THREE.MeshStandardMaterial({ map: this.printTex, transparent: true, roughness: 0.55, metalness: 0, depthWrite: false });
    this.add('dial', new THREE.CircleGeometry(dialR, 160), printMat, [0, 0, 0.1425]);

    /* Rehaut grabado */
    this.rehautTex = drawRehaut(null);
    const rehMat = new THREE.MeshStandardMaterial({ map: this.rehautTex, metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide });
    this.add('dial', lathe([[dialR, 0.14], [dialR + 0.09, 0.34]], 240), rehMat);

    /* Índices báton (tipo Nautilus — rectangulares, aplicados) */
    const idxMat = polished(0xf0f1f3, 0.05);
    const lumeMat = new THREE.MeshStandardMaterial({ color: 0xe9e8e1, roughness: 0.7, metalness: 0 });
    for (let h = 0; h < 12; h++) {
      if (h === 3 || h === 6 || h === 9) continue; // Nautilus: sin índice en 3, 6, 9
      const a = (h / 12) * TAU;
      const r = 1.28;
      const cx = Math.sin(a) * r;
      const cy = Math.cos(a) * r;
      /* índice doble en 12 */
      if (h === 0) {
        for (const off of [-0.085, 0.085]) {
          const bar = this.add('dial', new THREE.BoxGeometry(0.09, 0.32, 0.065), idxMat, [cx + Math.cos(a) * off, cy - Math.sin(a) * off, 0.18]);
          bar.rotation.z = -a;
          const lume = this.add('dial', new THREE.PlaneGeometry(0.04, 0.22), lumeMat, [cx + Math.cos(a) * off, cy - Math.sin(a) * off, 0.215]);
          lume.rotation.z = -a;
        }
      } else {
        const bar = this.add('dial', new THREE.BoxGeometry(0.09, 0.32, 0.065), idxMat, [cx, cy, 0.18]);
        bar.rotation.z = -a;
        const lume = this.add('dial', new THREE.PlaneGeometry(0.04, 0.22), lumeMat, [cx, cy, 0.215]);
        lume.rotation.z = -a;
      }
    }

    /* ===================== AGUJAS FEUILLE (NAUTILUS) ===================== */
    const hMat = polished(0xf2f3f5, 0.04);
    hMat.flatShading = false;
    const { h, m, s } = this.hands;
    h.position.z = 0.235; m.position.z = 0.265; s.position.z = 0.295;
    this.layers.hands.group.add(h, m, s);

    /* Agujas feuille — forma de hoja característica Nautilus */
    this.add('hands', feuilleHand(0.88, 0.11, 0.15, 0.038), hMat, [0, 0, 0], h);
    this.add('hands', feuilleHand(1.44, 0.085, 0.17, 0.032), hMat, [0, 0, 0], m);

    /* Segundero fino, con contra-peso circular */
    const sMat = polished(0xe8eaec, 0.08);
    const sBar = new THREE.BoxGeometry(0.018, 1.86, 0.01);
    sBar.translate(0, 1.86 / 2 - 0.32, 0);
    this.add('hands', sBar, sMat, [0, 0, 0], s);
    this.add('hands', zcyl(0.06, 0.012, 32), sMat, [0, -0.22, 0], s);
    this.add('hands', zcyl(0.04, 0.012, 32), sMat, [0, 1.14, 0], s);
    this.add('hands', zcyl(0.025, 0.018, 32), lumeMat, [0, 1.14, 0.01], s);
    /* pivote central */
    this.add('hands', zcyl(0.065, 0.15, 32), polished(0xeeeff1, 0.05), [0, 0, 0.24]);

    /* ===================== CRISTAL ZAFIRO (PLANO — Nautilus) ===================== */
    /* El Nautilus tiene cristal zafiro curvo pero casi plano */
    const Rc = 22, th = Math.asin(dialR * 1.02 / Rc);
    const cg = new THREE.SphereGeometry(Rc, 96, 8, 0, TAU, 0, th);
    cg.rotateX(Math.PI / 2);
    cg.translate(0, 0, -Rc * Math.cos(th));
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.01, transparent: true, opacity: 0.08,
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6, depthWrite: false,
    });
    this.add('crystal', cg, glass);

    /* ===================== MOVIMIENTO INTERNO ===================== */
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

    /* Fondo con zafiro */
    const cb = brushed(0x6c7176, 0.32);
    cb.side = THREE.DoubleSide;
    this.add('caseback', lathe([[1.4, 0.04], [1.62, 0.0], [1.82, -0.06], [1.8, -0.1], [1.4, -0.08]]), cb);
    const cbGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.08, clearcoat: 0.6, depthWrite: false, envMapIntensity: 0.9 });
    this.add('caseback', zcyl(1.42, 0.04, 96), cbGlass, [0, 0, -0.04]);
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
