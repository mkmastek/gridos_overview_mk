// 3D chart pieces (Phase 4): instanced bars, area series with a moving cut ("now"), an
// uncertainty band, a merit-order supply stack and a canvas chart on a glass panel.
// Geometry is owned by each chart (disposed with the scene).

import * as THREE from 'three';
import { stdMat } from '../materials.js';
import { createGlassPanel } from './GridAssets.js';

/**
 * Row of vertical bars (instanced). Bars grow from y = 0.
 * Returns { group, mesh, setBar(i, height, color?), count }.
 */
export function createBars({ count, width = 0.8, depth = 0.8, spacing = 1.1, color = '#0FBDFF' }) {
  const geo = new THREE.BoxGeometry(width, 1, depth).translate(0, 0.5, 0);
  const mat = stdMat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.25 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  const o = new THREE.Object3D();
  const c = new THREE.Color(color);
  const heights = new Array(count).fill(0.001);
  const place = (i) => {
    o.position.set((i - (count - 1) / 2) * spacing, 0, 0);
    o.scale.set(1, Math.max(0.001, heights[i]), 1);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  };
  for (let i = 0; i < count; i += 1) {
    place(i);
    mesh.setColorAt(i, c);
  }
  const group = new THREE.Group();
  group.add(mesh);
  return {
    group,
    mesh,
    count,
    xAt: (i) => (i - (count - 1) / 2) * spacing,
    setBar(i, height, color) {
      heights[i] = height;
      place(i);
      mesh.instanceMatrix.needsUpdate = true;
      if (color) {
        mesh.setColorAt(i, color);
        mesh.instanceColor.needsUpdate = true;
      }
    },
  };
}

/**
 * An area series as a thin slab: profile values[i] at x = i * dx, from y = 0 up, depth along z.
 * setCut(x0, x1) shows only the part between x0 and x1 (used for "actual" vs "forecast").
 */
export function createAreaSeries({ values, dx = 1, depth = 0.6, scaleY = 1, color, opacity = 1, emissive = 0.35 }) {
  const n = values.length;
  const pos = new Float32Array(n * 4 * 3);
  const idx = [];
  const v = (i, k) => i * 4 + k; // k: 0 front-bottom, 1 front-top, 2 back-bottom, 3 back-top
  for (let i = 0; i < n - 1; i += 1) {
    idx.push(v(i, 0), v(i + 1, 0), v(i + 1, 1), v(i, 0), v(i + 1, 1), v(i, 1)); // front
    idx.push(v(i, 2), v(i, 3), v(i + 1, 3), v(i, 2), v(i + 1, 3), v(i + 1, 2)); // back
    idx.push(v(i, 1), v(i + 1, 1), v(i + 1, 3), v(i, 1), v(i + 1, 3), v(i, 3)); // top
  }
  idx.push(v(0, 0), v(0, 1), v(0, 3), v(0, 0), v(0, 3), v(0, 2)); // left cap
  idx.push(v(n - 1, 0), v(n - 1, 2), v(n - 1, 3), v(n - 1, 0), v(n - 1, 3), v(n - 1, 1)); // right cap
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mat = stdMat(color, { emissive: color, emissiveIntensity: emissive, transparent: opacity < 1, opacity, side: THREE.DoubleSide, flatShading: false });
  if (opacity < 1) mat.depthWrite = false;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opacity >= 1;
  let vals = values.slice();
  const xMax = (n - 1) * dx;
  const yAt = (x) => {
    const f = Math.max(0, Math.min(n - 1, x / dx));
    const i = Math.min(n - 2, Math.floor(f));
    return (vals[i] + (vals[i + 1] - vals[i]) * (f - i)) * scaleY;
  };
  let cut = [0, xMax];
  const rebuild = () => {
    const [x0, x1] = cut;
    for (let i = 0; i < n; i += 1) {
      const x = Math.max(x0, Math.min(x1, i * dx));
      const y = Math.max(0.001, yAt(x));
      const d = depth / 2;
      pos.set([x, 0, d, x, y, d, x, 0, -d, x, y, -d], i * 12);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  };
  rebuild();
  return {
    mesh,
    material: mat,
    yAt,
    xMax,
    setValues(nv) { vals = nv.slice(); rebuild(); },
    setCut(x0, x1) {
      if (x0 === cut[0] && x1 === cut[1]) return;
      cut = [x0, x1];
      rebuild();
    },
  };
}

/**
 * Vertical ribbon between lower[i] and upper[i] (an uncertainty band), at z = 0.
 * setCut(x0, x1) like createAreaSeries.
 */
export function createBand({ lower, upper, dx = 1, scaleY = 1, color, opacity = 0.28 }) {
  const n = lower.length;
  const pos = new Float32Array(n * 2 * 3);
  const idx = [];
  for (let i = 0; i < n - 1; i += 1) idx.push(i * 2, i * 2 + 2, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  const at = (arr, x) => {
    const f = Math.max(0, Math.min(n - 1, x / dx));
    const i = Math.min(n - 2, Math.floor(f));
    return (arr[i] + (arr[i + 1] - arr[i]) * (f - i)) * scaleY;
  };
  let cut = [0, (n - 1) * dx];
  const rebuild = () => {
    for (let i = 0; i < n; i += 1) {
      const x = Math.max(cut[0], Math.min(cut[1], i * dx));
      pos.set([x, at(lower, x), 0, x, at(upper, x), 0], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  };
  rebuild();
  return {
    mesh,
    material: mat,
    setCut(x0, x1) {
      if (x0 === cut[0] && x1 === cut[1]) return;
      cut = [x0, x1];
      rebuild();
    },
  };
}

/**
 * Merit-order supply stack: one block per offer, sorted by price; width ∝ MW, height ∝ price.
 * offers: [{ key, mw, price, color }]. Returns { group, blocks: [{ key, mesh, x0, x1, offer }],
 * xAt(mw), yAt(price), width }.
 */
export function createMeritStack({ offers, mwScale = 1 / 60, priceScale = 1 / 22, depth = 2.2 }) {
  const group = new THREE.Group();
  const sorted = offers.slice().sort((a, b) => a.price - b.price);
  let x = 0;
  const blocks = sorted.map((o) => {
    const w = o.mw * mwScale;
    const h = Math.max(0.12, o.price * priceScale);
    const mat = stdMat(o.color, { emissive: o.color, emissiveIntensity: 0.3, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h, depth).translate(0, h / 2, 0), mat);
    m.position.x = x + w / 2;
    m.castShadow = true;
    group.add(m);
    const b = { key: o.key, mesh: m, material: mat, x0: x, x1: x + w, offer: o, height: h };
    x += w;
    return b;
  });
  return { group, blocks, width: x, xAt: (mw) => mw * mwScale, yAt: (p) => p * priceScale, sorted };
}

/**
 * A glass panel showing a canvas drawing. draw(g, w, h) paints the 2D context; call redraw()
 * whenever the inputs change. Returns { group, redraw, texture, canvas }.
 */
export function createCanvasPanel({ width = 8, height = 4, px = 768, draw }) {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = Math.round(px * (height / width));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const panel = createGlassPanel({ width, height, color: '#0FBDFF', map: texture, opacity: 0.95 });
  const g = canvas.getContext('2d');
  const redraw = (...args) => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    draw(g, canvas.width, canvas.height, ...args);
    texture.needsUpdate = true;
  };
  return { group: panel.group, redraw, texture, canvas };
}

/** Rounded-rectangle path helper for canvas charts. */
export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Standard dark chart background with a title, used by the canvas panels. */
export function chartFrame(g, w, h, title) {
  g.fillStyle = 'rgba(0, 16, 72, 0.9)';
  roundRect(g, 4, 4, w - 8, h - 8, 18);
  g.fill();
  g.strokeStyle = 'rgba(15, 189, 255, 0.85)';
  g.lineWidth = 3;
  g.stroke();
  if (title) {
    g.fillStyle = '#B9C6EA';
    g.font = '600 24px "Titillium Web", "Trebuchet MS", sans-serif';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(title, 26, 34);
  }
}
