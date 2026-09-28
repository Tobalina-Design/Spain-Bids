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

/* Nautilus: la esfera cubre el cuadrado [-DIAL_S, DIAL_S] en unidades del reloj */
export const DIAL_S = 1.8;
const SERIF = '"Cormorant Garamond", "Cormorant", Georgia, "Times New Roman", serif';

/* Color de la esfera: azul degradado con relieve horizontal */
export function nautilusDial(size = 2048) {
  const { c, g } = makeCanvas(size, size);
  const cx = size / 2;
  const base = g.createRadialGradient(cx, cx * 0.96, 0, cx, cx, cx * 0.92);
  base.addColorStop(0, '#3d5f86');
  base.addColorStop(0.45, '#2a4668');
  base.addColorStop(0.8, '#15253b');
  base.addColorStop(1, '#0b1422');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const n = 42;
  const pitch = size / n;
  for (let i = 0; i < n; i++) {
    const y = i * pitch;
    const band = g.createLinearGradient(0, y, 0, y + pitch);
    band.addColorStop(0, 'rgba(255,255,255,0.10)');
    band.addColorStop(0.18, 'rgba(255,255,255,0.03)');
    band.addColorStop(0.7, 'rgba(0,0,0,0.04)');
    band.addColorStop(0.86, 'rgba(0,0,0,0.30)');
    band.addColorStop(1, 'rgba(0,0,0,0.38)');
    g.fillStyle = band;
    g.fillRect(0, y, size, pitch);
  }
  return srgb(c, 16);
}

/* Relieve horizontal de la esfera (mapa de normales) */
export function nautilusDialNormal(h = 1024) {
  const w = 8;
  const { c, g } = makeCanvas(w, h);
  const img = g.createImageData(w, h);
  const n = 42;
  const pitch = h / n;
  for (let y = 0; y < h; y++) {
    const t = (y % pitch) / pitch;
    /* banda redondeada con surco en V al final */
    let dy = 0;
    if (t < 0.12) dy = -0.9 * (1 - t / 0.12);
    else if (t > 0.82) dy = 0.9 * ((t - 0.82) / 0.18);
    else dy = (t - 0.47) * 0.25;
    const nx = 0, ny = -dy, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Impresión de la esfera: minutería y firma, sobre transparente */
export function drawDialPrint(t: THREE.CanvasTexture | null, size = 2048) {
  const { c, g } = makeCanvas(size, size);
  const cx = size / 2;
  const k = size / (DIAL_S * 2);
  g.clearRect(0, 0, size, size);
  g.strokeStyle = 'rgba(238,240,244,0.88)';
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const five = m % 5 === 0;
    const r1 = (five ? 1.37 : 1.405) * k;
    const r2 = 1.45 * k;
    g.lineWidth = five ? 4 : 2.2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r1, cx + Math.sin(a) * r1);
    g.lineTo(cx + Math.cos(a) * r2, cx + Math.sin(a) * r2);
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(244,245,248,0.97)';
  g.font = `600 ${Math.round(0.17 * k)}px ${SERIF}`;
  spaced(g, 0.035 * k);
  g.fillText('SAVILLS', cx + 0.0175 * k, cx - 0.62 * k);
  g.fillStyle = 'rgba(236,238,242,0.85)';
  g.font = `500 ${Math.round(0.066 * k)}px ${SERIF}`;
  spaced(g, 0.03 * k);
  g.fillText('BARCELONA', cx + 0.015 * k, cx - 0.47 * k);
  if (!t) {
    t = srgb(c, 16);
  } else {
    t.image = c;
    t.needsUpdate = true;
  }
  return t;
}

/* Disco de fecha (ventana a las 3) */
export function drawDate(t: THREE.CanvasTexture | null) {
  const { c, g } = makeCanvas(160, 128);
  g.fillStyle = '#f3f1ec';
  g.fillRect(0, 0, 160, 128);
  let d = new Date().getDate();
  try {
    d = +new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric' }).format(new Date());
  } catch { /* fecha local */ }
  g.fillStyle = '#16181c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `500 92px ${SERIF}`;
  g.fillText(String(d), 80, 68);
  if (!t) {
    t = srgb(c, 8);
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
