// Generation assets (Phase 2 kit): nuclear SMR, hydro dam, offshore wind, steam unit, water.
// Same low-poly "architectural model" style as GridAssets.js; geometries are shared.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedGeo, createWindTurbine } from './GridAssets.js';
import { mats, stdMat } from '../materials.js';

const merge = (list) => {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
};
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (rt, rb, h, s, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(rt, rb, h, s).translate(x, y, z);
const mesh = (g, m, cast = true) => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};

/** Flat water surface (owned material, so a scene may tint it). */
export function createWater(width, depth, color = '#0E4FB0') {
  const material = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.82, roughness: 0.25, metalness: 0.15 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth).rotateX(-Math.PI / 2), material);
  m.receiveShadow = true;
  return m;
}

/** Small modular reactor: round reactor building with a dome, turbine hall, auxiliary block. */
export function createSMR() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('smr:body', () => merge([
    cyl(1.15, 1.15, 1.6, 18, 0, 0.8, 0),
    new THREE.SphereGeometry(1.15, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.6, 0),
  ])), mats().white));
  group.add(mesh(sharedGeo('smr:aux', () => merge([
    box(2.2, 1.1, 1.4, 2.0, 0.55, 0.2),
    box(1.0, 0.7, 0.9, -1.7, 0.35, 0.6),
  ])), mats().building));
  return group;
}

/** Hydro dam with reservoir, powerhouse and penstocks. Returns { group, water }. */
export function createHydroDam({ width = 5 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`dam:wall:${width}`, () => merge([
    box(width, 2.4, 0.7, 0, 1.2, 0),
    box(width + 0.4, 0.2, 0.9, 0, 2.5, 0),
    box(1.6, 0.9, 1.0, 0, 0.45, 1.1),
  ])), mats().concrete));
  group.add(mesh(sharedGeo(`dam:pipes:${width}`, () => {
    const parts = [];
    for (const x of [-0.5, 0, 0.5]) {
      const p = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
      p.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 3.2));
      p.translate(x, 1.3, 0.75);
      parts.push(p);
    }
    return merge(parts);
  }), mats().darkMetal));
  const water = createWater(width, 3.2);
  water.position.set(0, 2.15, -1.95);
  const river = createWater(1.4, 2.2);
  river.position.set(0, 0.04, 2.6);
  group.add(water, river);
  return { group, water };
}

/** Offshore wind turbine on a monopile with a yellow transition piece. Returns { group, rotor }. */
export function createOffshoreTurbine({ height = 6, radius = 2.1 } = {}) {
  const t = createWindTurbine({ height, radius });
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('offshore:pile', () => merge([
    cyl(0.24, 0.26, 1.2, 10, 0, -0.3, 0),
  ])), mats().darkMetal));
  group.add(mesh(sharedGeo('offshore:tp', () => cyl(0.3, 0.3, 0.45, 10, 0, 0.45, 0)), stdMatShared('#EBAA01')));
  t.group.position.y = 0.65;
  group.add(t.group);
  return { group, rotor: t.rotor };
}

const SHARED_MATS = new Map();
function stdMatShared(color) {
  let m = SHARED_MATS.get(color);
  if (!m) {
    m = stdMat(color);
    m.userData.shared = true;
    SHARED_MATS.set(color, m);
  }
  return m;
}

/** Steam unit: turbine hall plus a cooling tower. */
export function createSteamUnit() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('steam:hall', () => merge([
    box(2.6, 1.3, 1.5, 0, 0.65, 0),
    new THREE.CylinderGeometry(0.35, 0.35, 2.0, 12).rotateZ(Math.PI / 2).translate(0, 1.55, 0),
  ])), mats().building));
  const pts = [];
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    pts.push(new THREE.Vector2(1.0 - 0.38 * Math.sin(t * Math.PI * 0.95), t * 2.6));
  }
  group.add(mesh(sharedGeo('steam:tower', () => new THREE.LatheGeometry(pts, 16).translate(2.4, 0, -0.4)), mats().concrete));
  return group;
}
