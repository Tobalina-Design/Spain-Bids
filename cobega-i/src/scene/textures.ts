import * as THREE from 'three';

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}

function srgb(c: HTMLCanvasElement, aniso = 8) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

const DISPLAY = '"Archivo", "Helvetica Neue", Arial, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

function spaced(g: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in g) (g as unknown as { letterSpacing: string }).letterSpacing = px + 'px';
}

/* Mapa de anisotropía radial: cepillado sunburst de la esfera */
export function sunburstAniso(size = 512) {
  const { c, g } = makeCanvas(size, size);
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size - 0.5;
      const v = 0.5 - (y + 0.5) / size;
      const a = Math.atan2(v, u);
      const i = (y * size + x) * 4;
      img.data[i] = (Math.cos(a) * 0.5 + 0.5) * 255;
      img.data[i + 1] = (Math.sin(a) * 0.5 + 0.5) * 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

/* Color base de la esfera: negro con rayos muy finos */
export function dialBase(size = 1024) {
  const { c, g } = makeCanvas(size, size);
  const cx = size / 2;
  g.fillStyle = '#121315';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 1440; i++) {
    const a = (i / 1440) * Math.PI * 2;
    g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.18)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx, cx);
    g.lineTo(cx + Math.cos(a) * cx * 1.1, cx + Math.sin(a) * cx * 1.1);
    g.stroke();
  }
  const gr = g.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)');
  gr.addColorStop(0.7, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return srgb(c);
}

/* Impresión de la esfera: minutería y textos, sobre transparente */
export function drawDialPrint(t: THREE.CanvasTexture | null, size = 2048) {
  const { c, g } = makeCanvas(size, size);
  const cx = size / 2;
  const R = cx * 0.985;
  g.clearRect(0, 0, size, size);
  g.strokeStyle = 'rgba(235,235,232,0.9)';
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const five = m % 5 === 0;
    const r1 = R * (five ? 0.925 : 0.945);
    const r2 = R * 0.975;
    g.lineWidth = five ? 5 : 2.4;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r1, cx + Math.sin(a) * r1);
    g.lineTo(cx + Math.cos(a) * r2, cx + Math.sin(a) * r2);
    g.stroke();
  }
  for (let q = 0; q < 240; q++) {
    if (q % 4 === 0) continue;
    const a = (q / 240) * Math.PI * 2 - Math.PI / 2;
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(235,235,232,0.35)';
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * 0.962, cx + Math.sin(a) * R * 0.962);
    g.lineTo(cx + Math.cos(a) * R * 0.975, cx + Math.sin(a) * R * 0.975);
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ecece8';
  g.font = `700 ${Math.round(size * 0.05)}px ${DISPLAY}`;
  spaced(g, size * 0.012);
  g.fillText('COBEGA I', cx + size * 0.006, cx - size * 0.2);
  g.fillStyle = 'rgba(236,236,232,0.7)';
  g.font = `400 ${Math.round(size * 0.017)}px ${MONO}`;
  spaced(g, size * 0.006);
  g.fillText('SANT MARTÍ', cx + size * 0.003, cx - size * 0.155);
  g.fillText('BARCELONA', cx + size * 0.003, cx + size * 0.26);
  if (!t) {
    t = srgb(c, 16);
  } else {
    t.image = c;
    t.needsUpdate = true;
  }
  return t;
}

/* Rehaut grabado con el nombre del cliente */
export function drawRehaut(t: THREE.CanvasTexture | null) {
  const W = 4096, H = 96;
  const { c, g } = makeCanvas(W, H);
  g.fillStyle = '#1b1c1f';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(210,210,206,0.55)';
  g.font = `500 40px ${MONO}`;
  spaced(g, 16);
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  const n = 12;
  for (let i = 0; i < n; i++) {
    g.save();
    g.translate(((i + 0.5) / n) * W, H / 2);
    g.scale(-1, 1);
    g.fillText('PATRIZIA', 0, 2);
    g.restore();
  }
  if (!t) {
    t = srgb(c, 16);
  } else {
    t.image = c;
    t.needsUpdate = true;
  }
  return t;
}

/* Perlage para la platina */
export function perlage(size = 1024) {
  const { c, g } = makeCanvas(size, size);
  g.fillStyle = '#8f9397';
  g.fillRect(0, 0, size, size);
  const step = 44;
  for (let y = -step; y < size + step; y += step * 0.8) {
    for (let x = -step; x < size + step; x += step * 0.8) {
      const gr = g.createRadialGradient(x, y, 2, x, y, step * 0.62);
      gr.addColorStop(0, 'rgba(230,232,235,0.9)');
      gr.addColorStop(0.55, 'rgba(160,164,168,0.6)');
      gr.addColorStop(1, 'rgba(110,114,118,0.0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, step * 0.62, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = srgb(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.35, 0.35);
  return t;
}

/* Côtes de Genève para puentes y rotor */
export function cotes(size = 1024) {
  const { c, g } = makeCanvas(size, size);
  const band = 96;
  for (let y = 0; y < size; y += band) {
    const gr = g.createLinearGradient(0, y, 0, y + band);
    gr.addColorStop(0, '#7e8286');
    gr.addColorStop(0.45, '#d9dcdf');
    gr.addColorStop(0.55, '#c6c9cc');
    gr.addColorStop(1, '#85898d');
    g.fillStyle = gr;
    g.fillRect(0, y, size, band);
  }
  const t = srgb(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.45, 0.45);
  t.rotation = 0.35;
  return t;
}

/* Grabado del rotor */
export function drawRotorText(t: THREE.CanvasTexture | null) {
  const { c, g } = makeCanvas(1024, 160);
  g.clearRect(0, 0, 1024, 160);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(20,20,22,0.85)';
  g.font = `700 70px ${DISPLAY}`;
  spaced(g, 22);
  g.fillText('PATRIZIA', 523, 70);
  g.font = `400 26px ${MONO}`;
  spaced(g, 10);
  g.fillStyle = 'rgba(20,20,22,0.7)';
  g.fillText('COBEGA I · BARCELONA', 517, 130);
  if (!t) {
    t = srgb(c, 16);
  } else {
    t.image = c;
    t.needsUpdate = true;
  }
  return t;
}
