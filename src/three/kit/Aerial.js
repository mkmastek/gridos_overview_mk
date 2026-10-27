// Aerial sensing for the Visual Intelligence demo (Phase 3).
//   createDrone        quad-copter with spinning rotors and a downward scanning cone
//   createSatellite    satellite body with solar panels
//   createSwath        translucent strip a satellite "paints" on the ground
//   createPointCloud   LiDAR-style points coloured by height
//   sample*            deterministic point samplers for trees, poles and lines

import * as THREE from 'three';
import { stdMat, glowMat, PALETTE, BRAND } from '../materials.js';

/** Returns { group, rotors, cone, spin(dt) } — the cone tip is at the drone, base on the ground. */
export function createDrone({ coneHeight = 7.5, coneRadius = 2.6 } = {}) {
  const group = new THREE.Group();
  const body = stdMat('#E8EDF4', { roughness: 0.5 });
  const dark = stdMat('#2A3550');
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.55), body));
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.08), dark);
    arm.rotation.y = a;
    group.add(arm);
  }
  const pod = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), dark);
  pod.position.y = -0.14;
  group.add(pod);
  const rotorMat = new THREE.MeshBasicMaterial({ color: '#C9D6F2', transparent: true, opacity: 0.45, depthWrite: false });
  const rotors = [];
  for (const [x, z] of [[0.53, 0.53], [-0.53, 0.53], [0.53, -0.53], [-0.53, -0.53]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 16), rotorMat);
    r.position.set(x, 0.07, z);
    rotors.push(r);
    group.add(r);
  }
  const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 28, 1, true).translate(0, -coneHeight / 2, 0);
  const cone = new THREE.Mesh(coneGeo, glowMat(PALETTE.data, { opacity: 0.14, side: THREE.DoubleSide, blending: THREE.NormalBlending }));
  cone.position.y = -0.12;
  group.add(cone);
  return {
    group,
    rotors,
    cone,
    spin(dt) { for (const r of rotors) r.rotation.y += dt * 30; },
  };
}

export function createSatellite() {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.3), stdMat('#C9D3E0', { metalness: 0.5, roughness: 0.4 })));
  const panel = stdMat('#1E3A6E', { emissive: '#0c1f44', metalness: 0.4 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.9), panel);
    p.position.x = s * 1.8;
    group.add(p);
  }
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 16, 1, true), stdMat('#E8EDF4', { side: THREE.DoubleSide }));
  dish.position.y = -0.6;
  dish.rotation.x = Math.PI;
  group.add(dish);
  return group;
}

/** A strip on the ground (length along x, width along z). */
export function createSwath({ length = 8, width = 16 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(length, width).rotateX(-Math.PI / 2), glowMat(PALETTE.data, { opacity: 0.16, blending: THREE.NormalBlending, side: THREE.DoubleSide }));
  m.position.y = 0.06;
  return m;
}

// Height ramp in Mastek colours: light blue (low) → turquoise → green → yellow (high).
const RAMP = [BRAND.lightBlue, BRAND.turquoise, BRAND.green, BRAND.yellow].map((c) => new THREE.Color(c));
export function heightColor(t, out = new THREE.Color()) {
  const x = Math.max(0, Math.min(0.999, t)) * (RAMP.length - 1);
  const i = Math.floor(x);
  return out.copy(RAMP[i]).lerp(RAMP[i + 1], x - i);
}

/** Points coloured by height. positions: number[] (x, y, z, …). Returns { points, setOpacity(v) }. */
export function createPointCloud(positions, { size = 0.13, minY = 0, maxY = 8 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(positions);
  const col = new Float32Array(pos.length);
  const c = new THREE.Color();
  for (let i = 0; i < pos.length; i += 3) {
    heightColor((pos[i + 1] - minY) / (maxY - minY), c);
    col.set([c.r, c.g, c.b], i);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true, toneMapped: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    setOpacity(v) {
      mat.opacity = Math.max(0, Math.min(1, v));
      points.visible = mat.opacity > 0.01;
    },
  };
}

// ── Deterministic samplers (same cloud every time) ─────────────────
export function makeRandom(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/** Points on a cone crown (a tree) standing at (x, z). */
export function sampleCone(out, rnd, { x, z, baseY, radius, height }, n) {
  for (let i = 0; i < n; i += 1) {
    const h = rnd();
    const a = rnd() * Math.PI * 2;
    const r = radius * (1 - h) * (0.85 + 0.15 * rnd());
    out.push(x + Math.cos(a) * r, baseY + h * height, z + Math.sin(a) * r);
  }
}

/** Points along a vertical cylinder (a pole). */
export function sampleCylinder(out, rnd, { x, z, y0, y1, radius }, n) {
  for (let i = 0; i < n; i += 1) {
    const a = rnd() * Math.PI * 2;
    out.push(x + Math.cos(a) * radius, y0 + rnd() * (y1 - y0), z + Math.sin(a) * radius);
  }
}

/** Points along a polyline (a conductor). */
export function samplePolyline(out, rnd, pts, n) {
  for (let i = 0; i < n; i += 1) {
    const f = rnd() * (pts.length - 1);
    const k = Math.floor(f);
    const a = pts[k];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    const t = f - k;
    out.push(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
  }
}

/** A loose grid of ground points. */
export function sampleGround(out, rnd, { x0, x1, z0, z1, step = 0.9 }) {
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) out.push(x + (rnd() - 0.5) * step, 0.04 + rnd() * 0.08, z + (rnd() - 0.5) * step);
  }
}
