// Grid equipment assets (Phase 2 kit): gas-insulated switchgear bay, live-tank breaker,
// power transformer, HVDC valve hall, STATCOM containers, relay cabinet, synchronous
// condenser, battery container. Low-poly, shared geometries, merged parts.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedGeo } from './GridAssets.js';
import { mats, stdMat, glowMat } from '../materials.js';

const merge = (list) => {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
};
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (rt, rb, h, s, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(rt, rb, h, s).translate(x, y, z);
const hcyl = (r, len, s, x = 0, y = 0, z = 0, axis = 'x') => {
  const g = new THREE.CylinderGeometry(r, r, len, s);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  else g.rotateX(Math.PI / 2);
  return g.translate(x, y, z);
};
const mesh = (g, m, cast = true) => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};

/** Gas-insulated switchgear bay: grey enclosure tubes on a frame. */
export function createGISBay() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('gis:frame', () => box(2.6, 0.2, 1.4, 0, 0.1, 0)), mats().darkMetal));
  group.add(mesh(sharedGeo('gis:tubes', () => merge([
    hcyl(0.22, 2.4, 12, 0, 0.55, -0.35),
    hcyl(0.22, 2.4, 12, 0, 0.55, 0.35),
    hcyl(0.18, 2.4, 12, 0, 1.05, 0),
    cyl(0.2, 0.2, 1.0, 12, -0.9, 0.7, 0),
    cyl(0.2, 0.2, 1.0, 12, 0.9, 0.7, 0),
    cyl(0.27, 0.27, 0.1, 12, -0.9, 1.2, 0),
    cyl(0.27, 0.27, 0.1, 12, 0.9, 1.2, 0),
  ])), mats().metal));
  group.add(mesh(sharedGeo('gis:bushings', () => merge([
    cyl(0.07, 0.11, 0.9, 8, -0.9, 1.7, 0),
    cyl(0.07, 0.11, 0.9, 8, 0.9, 1.7, 0),
  ])), mats().insulator, false));
  return group;
}

/** Live-tank circuit breaker: three insulator columns with breaking heads (air-insulated). */
export function createLiveTankBreaker() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('ltb:base', () => merge([
    box(2.2, 0.15, 0.5, 0, 0.6, 0),
    box(0.12, 0.6, 0.12, -0.9, 0.3, 0),
    box(0.12, 0.6, 0.12, 0.9, 0.3, 0),
  ])), mats().darkMetal));
  group.add(mesh(sharedGeo('ltb:columns', () => {
    const parts = [];
    for (const x of [-0.75, 0, 0.75]) {
      parts.push(cyl(0.09, 0.11, 1.3, 8, x, 1.33, 0));
      parts.push(box(0.5, 0.18, 0.18, x, 2.05, 0));
    }
    return merge(parts);
  }), mats().insulator));
  return group;
}

/** Power transformer: tank, radiators, high-voltage bushings, conservator. */
export function createPowerTransformer() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('ptx:body', () => merge([
    box(2.0, 1.6, 1.4, 0, 0.8, 0),
    ...[-0.7, -0.35, 0, 0.35, 0.7].map((x) => box(0.1, 1.3, 0.4, x, 0.75, 0.9)),
    hcyl(0.22, 1.6, 12, 0, 2.0, -0.45),
    box(0.1, 0.4, 0.1, -0.6, 1.75, -0.45),
  ])), mats().darkMetal));
  group.add(mesh(sharedGeo('ptx:bushings', () => merge(
    [-0.55, 0, 0.55].map((x) => cyl(0.06, 0.1, 1.0, 8, x, 2.1, 0.2)),
  )), mats().insulator, false));
  return group;
}

/** HVDC converter station: tall valve hall with converter transformers along one side. */
export function createHVDCHall() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('hvdc:hall', () => merge([
    box(5.2, 2.6, 2.6, 0, 1.3, 0),
    box(5.4, 0.18, 2.8, 0, 2.69, 0),
  ])), mats().white));
  group.add(mesh(sharedGeo('hvdc:xfmr', () => merge(
    [-1.7, 0, 1.7].map((x) => box(1.1, 1.1, 0.9, x, 0.55, 1.9)),
  )), mats().darkMetal));
  group.add(mesh(sharedGeo('hvdc:bushings', () => merge(
    [-1.7, 0, 1.7].map((x) => {
      const g = new THREE.CylinderGeometry(0.07, 0.1, 1.0, 8);
      g.rotateX(-Math.PI / 4);
      return g.translate(x, 1.4, 1.45);
    }),
  )), mats().insulator, false));
  return group;
}

/** STATCOM (a FACTS device): power-electronics containers with coolers. */
export function createStatcom() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('statcom:boxes', () => merge([
    box(2.4, 1.0, 1.0, 0, 0.5, -0.6),
    box(2.4, 1.0, 1.0, 0, 0.5, 0.6),
  ])), mats().battery));
  group.add(mesh(sharedGeo('statcom:coolers', () => merge(
    [-0.8, 0, 0.8].map((x) => box(0.6, 0.3, 0.6, x, 1.15, -0.6)),
  )), mats().darkMetal));
  return group;
}

/** Protection relay cabinet with blinking status lights. Returns { group, ledMaterial }. */
export function createRelayCabinet() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('relay:body', () => merge([
    box(0.9, 1.7, 0.55, 0, 0.85, 0),
    box(0.75, 1.3, 0.02, 0, 0.95, 0.29),
  ])), mats().buildingDark));
  const ledMaterial = glowMat('#5ECC62', { blending: THREE.NormalBlending });
  group.add(mesh(sharedGeo('relay:leds', () => merge(
    [1.4, 1.2, 1.0, 0.8].flatMap((y) => [-0.2, 0, 0.2].map((x) => box(0.08, 0.05, 0.02, x, y, 0.31))),
  )), ledMaterial, false));
  return { group, ledMaterial };
}

/** Synchronous condenser: a big horizontal rotating machine on a plinth. */
export function createSyncCondenser() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('sync:plinth', () => box(2.6, 0.4, 1.4, 0, 0.2, 0)), mats().concrete));
  group.add(mesh(sharedGeo('sync:machine', () => merge([
    hcyl(0.62, 1.8, 16, 0, 1.0, 0),
    hcyl(0.68, 0.12, 16, -0.9, 1.0, 0),
    hcyl(0.68, 0.12, 16, 0.9, 1.0, 0),
  ])), mats().metal));
  return group;
}

/** Battery energy storage container with a cooling unit. */
export function createBessContainer() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('bess:box', () => merge([
    box(2.0, 0.95, 0.9, 0, 0.475, 0),
    box(0.5, 0.35, 0.5, 0.6, 1.12, 0),
  ])), mats().battery));
  group.add(mesh(sharedGeo('bess:stripe', () => box(2.02, 0.12, 0.92, 0, 0.75, 0)), stdMatShared('#0099A8'), false));
  return group;
}

const SHARED = new Map();
function stdMatShared(color) {
  let m = SHARED.get(color);
  if (!m) {
    m = stdMat(color, { emissive: color, emissiveIntensity: 0.25 });
    m.userData.shared = true;
    SHARED.set(color, m);
  }
  return m;
}
