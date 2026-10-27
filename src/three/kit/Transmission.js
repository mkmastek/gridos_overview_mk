// Transmission-grid building blocks (Phase 4): HV bus nodes, PMUs, GPS satellites, the PDC
// hub, an RTU cabinet, a weather mast, a solar farm, city loads, double-circuit lines and a
// helper for the oscillation ripple. Low-poly, merged parts, shared geometries.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedGeo, catenary, joinPaths, createConductor, createTransmissionTower } from './GridAssets.js';
import { mats, stdMat, glowMat } from '../materials.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function box(w, h, d, x = 0, y = 0, z = 0) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}
function cyl(rt, rb, h, seg, x = 0, y = 0, z = 0) {
  return new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y, z);
}
function merge(list) {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
}
function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/**
 * Stylised HV substation ("bus") for network diagrams: hexagonal pad, busbar and gantry.
 * The busbar colour shows the bus state. Returns { group, setColor(color, glow), top }.
 */
export function createBusNode({ radius = 1.6 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`bus:pad:${radius}`, () => cyl(radius, radius * 1.05, 0.25, 6, 0, 0.125, 0)), mats().concrete, false));
  group.add(mesh(sharedGeo(`bus:gantry:${radius}`, () => merge([
    box(0.12, 1.5, 0.12, -radius * 0.55, 1.0, 0),
    box(0.12, 1.5, 0.12, radius * 0.55, 1.0, 0),
    box(radius * 1.25, 0.1, 0.1, 0, 1.75, 0),
    box(0.7, 0.7, 0.55, 0, 0.6, -radius * 0.45),
  ])), mats().darkMetal));
  const busMat = stdMat('#0099A8', { emissive: '#0099A8', emissiveIntensity: 0.7 });
  const bus = mesh(sharedGeo(`bus:bar:${radius}`, () => cyl(0.09, 0.09, radius * 1.3, 8).rotateZ(Math.PI / 2).translate(0, 1.45, 0.25)), busMat, false);
  group.add(bus);
  return {
    group,
    top: V(0, 1.9, 0),
    setColor(color, glow = 0.7) {
      busMat.color.copy(color);
      busMat.emissive.copy(color);
      busMat.emissiveIntensity = glow;
    },
  };
}

/** PMU (Phasor Measurement Unit) box with a GPS antenna. */
export function createPMU() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('pmu:body', () => merge([
    box(0.55, 0.42, 0.4, 0, 0.21, 0),
    cyl(0.025, 0.025, 0.6, 6, 0.18, 0.72, 0),
  ])), mats().darkMetal));
  group.add(mesh(sharedGeo('pmu:dish', () => new THREE.ConeGeometry(0.13, 0.1, 10).translate(0.18, 1.05, 0)), glowMat('#0FBDFF', { blending: THREE.NormalBlending }), false));
  return group;
}

/** Small GPS satellite icon (body + two panels). */
export function createGPSSatellite() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('gps:body', () => box(0.45, 0.45, 0.45)), mats().metal, false));
  group.add(mesh(sharedGeo('gps:panels', () => merge([box(1.1, 0.04, 0.4, -0.8, 0, 0), box(1.1, 0.04, 0.4, 0.8, 0, 0)])), mats().solar, false));
  return group;
}

/** PDC (Phasor Data Concentrator) hub: a server tower with glowing rings. */
export function createPDC() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('pdc:body', () => merge([cyl(0.7, 0.85, 2.2, 12, 0, 1.1, 0), cyl(0.95, 0.95, 0.2, 12, 0, 0.1, 0)])), mats().buildingDark));
  const ringMat = glowMat('#0FBDFF', { blending: THREE.NormalBlending });
  for (const y of [0.7, 1.3, 1.9]) {
    const r = new THREE.Mesh(sharedGeo('pdc:ring', () => new THREE.TorusGeometry(0.78, 0.04, 6, 24).rotateX(Math.PI / 2)), ringMat);
    r.position.y = y;
    group.add(r);
  }
  return { group, ringMat };
}

/** RTU (Remote Terminal Unit) cabinet for the slow SCADA contrast. */
export function createRTU() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('rtu:body', () => merge([box(0.7, 1.0, 0.45, 0, 0.5, 0), cyl(0.02, 0.02, 0.6, 6, 0.22, 1.3, 0)])), mats().building));
  return group;
}

/** Weather mast: pole, anemometer cups and a wind vane. Returns { group, cups } (spin cups.rotation.y). */
export function createWeatherMast({ height = 4 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`mast:${height}`, () => merge([cyl(0.05, 0.08, height, 6, 0, height / 2, 0), box(0.5, 0.35, 0.3, 0, 0.9, 0.12)])), mats().metal));
  const cups = new THREE.Group();
  cups.position.y = height + 0.15;
  cups.add(mesh(sharedGeo('mast:cups', () => {
    const parts = [cyl(0.02, 0.02, 0.3, 6, 0, 0, 0)];
    for (let i = 0; i < 3; i += 1) {
      const a = (i * 2 * Math.PI) / 3;
      parts.push(box(0.36, 0.02, 0.02, Math.cos(a) * 0.18, 0.12, Math.sin(a) * 0.18).applyMatrix4(new THREE.Matrix4().makeRotationY(-a + Math.PI)));
      parts.push(new THREE.SphereGeometry(0.06, 6, 4).translate(Math.cos(a) * 0.36, 0.12, Math.sin(a) * 0.36));
    }
    return merge(parts);
  }), mats().white, false));
  group.add(cups);
  return { group, cups };
}

/** Solar farm: rows of tilted panels (instanced). */
export function createSolarFarm({ rows = 4, cols = 6, gap = 1.1 } = {}) {
  const geo = sharedGeo('solarfarm:panel', () => box(0.9, 0.05, 0.6).rotateX(-0.5).translate(0, 0.55, 0));
  const legs = sharedGeo('solarfarm:leg', () => box(0.06, 0.5, 0.06, 0, 0.25, 0));
  const n = rows * cols;
  const panels = new THREE.InstancedMesh(geo, mats().solar, n);
  const posts = new THREE.InstancedMesh(legs, mats().darkMetal, n);
  const o = new THREE.Object3D();
  let i = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      o.position.set((c - (cols - 1) / 2) * gap, 0, (r - (rows - 1) / 2) * gap);
      o.updateMatrix();
      panels.setMatrixAt(i, o.matrix);
      posts.setMatrixAt(i, o.matrix);
      i += 1;
    }
  }
  panels.castShadow = true;
  const group = new THREE.Group();
  group.add(panels, posts);
  return group;
}

/** A small city block (load): a few towers of different heights with lit windows strip. */
export function createCityBlock({ seed = 1 } = {}) {
  const group = new THREE.Group();
  const heights = [1.6, 2.4, 1.2, 3.0, 1.9].map((h, i) => h * (0.8 + ((seed * (i + 3)) % 5) * 0.08));
  const parts = heights.map((h, i) => box(0.9, h, 0.9, (i % 3) * 1.05 - 1.05, h / 2, Math.floor(i / 3) * 1.05 - 0.5));
  group.add(mesh(merge(parts), mats().building));
  return group;
}

/**
 * Double-circuit transmission line between two points, on lattice towers.
 * Returns { group, circuits: [Vector3[] path circuit A, path circuit B], towers }.
 * Paths follow the lower conductor of each circuit (use them for PowerFlow).
 */
export function createDoubleCircuit(a, b, { towers = 1, towerHeight = 6.5, endHeight = 2.4, material = null } = {}) {
  const group = new THREE.Group();
  const dir = b.clone().sub(a).setY(0);
  const len = dir.length();
  dir.normalize();
  const perp = V(-dir.z, 0, dir.x);
  const angle = Math.atan2(dir.x, dir.z) - Math.PI / 2;
  const mat = material || stdMat('#8C98AC', { metalness: 0.5, roughness: 0.4 });
  const towerObjs = [];
  const attachAt = [];
  for (let i = 1; i <= towers; i += 1) {
    const t = i / (towers + 1);
    const tw = createTransmissionTower({ height: towerHeight });
    tw.position.copy(a.clone().lerp(b, t)).setY(0);
    // Tower arms run along local z; the line must run along local x.
    tw.rotation.y = angle;
    tw.updateMatrixWorld(true);
    group.add(tw);
    towerObjs.push(tw);
    attachAt.push(tw.userData.attach.map((p) => tw.localToWorld(p.clone())));
  }
  const endPts = (p, k) => {
    const side = k % 2 === 0 ? -1 : 1;
    const up = k >= 2 ? 0.5 : 0;
    return p.clone().setY(endHeight + up).add(perp.clone().multiplyScalar(side * 0.8));
  };
  const circuits = [];
  for (let k = 0; k < 4; k += 1) {
    const pts = [endPts(a, k), ...attachAt.map((arr) => arr[k]), endPts(b, k)];
    let path = [];
    for (let i = 0; i < pts.length - 1; i += 1) path = joinPaths(path, catenary(pts[i], pts[i + 1], Math.min(0.8, len * 0.03), 10));
    group.add(createConductor(path, mat, 0.035));
    if (k < 2) circuits.push(path);
  }
  return { group, circuits, towers: towerObjs, material: mat };
}

/**
 * Oscillation ripple: vertical offset and phase (0..1) of a point at distance `dist` from the
 * source, at time t. freq in Hz of the drawn wave (slowed for readability).
 */
export function ripple(t, dist, { freq = 0.5, waveLength = 18, amp = 1 } = {}) {
  const phase = (t * freq - dist / waveLength) % 1;
  return { y: Math.sin(phase * Math.PI * 2) * amp, phase: (phase + 1) % 1 };
}
